/*
 * Copyright (C) 2025 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */
import {createNanoEvents, Emitter} from 'nanoevents';
import videojs from 'video.js';
import Player from "video.js/dist/types/player";

import { OptionsType } from '../../Types/Layout';
import {
    getMediaId,
    nextId,
    preloadMediaBlob,
    composeResourceUrl,
    composeResourceUrlByPlatform,
    composeMediaUrl,
    getDataBlob,
} from '../Generators';
import { TransitionElementOptions, compassPoints, flyTransitionKeyframes, transitionElement } from '../Transitions';
import { AudioMedia } from './AudioMedia';
import {IXlr} from '../../Types/XLR';
import {MediaState} from "../../Types/Media/Media.types";

import 'video.js/dist/video-js.min.css';
import {Region} from "../Region";
import {createMediaElement} from "../Generators/Generators";

export interface IMediaEvents {
    start: (media: Media) => void;
    end: (media: Media) => void;
}

export class Media {
    attachedAudio: boolean = false;
    checkIframeStatus: boolean = false;
    containerName: string = '';
    divHeight: number = 0;
    divWidth: number = 0;
    duration: number = 0;
    emitter: Emitter<IMediaEvents> = createNanoEvents<IMediaEvents>();
    enableStat: boolean = false;
    fileId: string = '';
    finished: boolean = false;
    html: HTMLElement | null = null;
    id: string = '';
    idCounter: number = 0;
    iframe: HTMLIFrameElement | null = null;
    iframeName: string = '';
    index: number = 0;
    loadIframeOnRun: boolean = false;
    loop: boolean = false;
    mediaId: string = '';
    mediaType: string = '';
    muted?: boolean = false;
    options: OptionsType & {
        [k: string]: any;
    } = <OptionsType>{};
    player: Player | null = null;
    ready: boolean = true;
    region: Region;
    render: string = 'html';
    schemaVersion: string = '1';
    singlePlay: boolean = false;
    state: MediaState = MediaState.IDLE;
    tempSrc: string = '';
    timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {}, 0);
    type: string = '';
    uri: string = '';
    url: string | null = null;
    useDuration: boolean = false;
    xml: Element | null = null;
    xlr: IXlr = <IXlr>{};
    mediaTimer: ReturnType<typeof setInterval> | undefined;
    mediaTimeCount = 0;

    readonly statsBC = new BroadcastChannel('statsBC');

    constructor(
        region: Region,
        mediaId: string,
        xml: Element,
        options: OptionsType,
        xlr: IXlr
    ) {
        this.region = region;
        this.id = mediaId;
        this.mediaId = this.id;
        this.xml = xml;
        this.options = options;
        this.xlr = xlr;

        this.fileId = this.xml?.getAttribute('fileId') || '';
        this.idCounter = nextId(this.options);
        this.iframeName = `${this.containerName}-iframe`;
        this.mediaType = this.xml?.getAttribute('type') || '';
        this.containerName = getMediaId({ mediaType: this.mediaType, containerName: `M-${this.id}-${this.idCounter}` });
        this.render = this.xml?.getAttribute('render') || '';
        this.duration = parseInt(this.xml?.getAttribute('duration') as string) || 0;
        this.enableStat = Boolean(this.xml?.getAttribute('enableStat') || false);

        this.on('start', (media) => {
            if (media.state === MediaState.PLAYING) return;

            media.state = MediaState.PLAYING;
            if (media.mediaType === 'audio') {
                AudioMedia(media).init();
                if (media.duration > 0) {
                    this.startMediaTimer(media);
                }
            } else {
                this.startMediaTimer(media);
            }

            // Check if stats are enabled for the layout
            if (media.enableStat) {
                this.statsBC.postMessage({
                    action: 'START_STAT',
                    mediaId: parseInt(media.id),
                    layoutId: media.region?.layout?.id,
                    scheduleId: media.region?.layout?.scheduleId,
                    type: 'media',
                });
            }

            // Emit media/widget start event
            console.debug('Media::Emitter > Start - Calling widgetStart event');
            this.xlr.emitter.emit('widgetStart', parseInt(media.id));
        });

        this.on('end', (media: Media) => {
            if (media.state === MediaState.ENDED) return;
            media.state = MediaState.ENDED;

            if (this.mediaTimer) {
                clearInterval(this.mediaTimer);
                this.mediaTimeCount = 0;
            }

            // Check if stats are enabled for the layout
            if (media.enableStat) {
                this.statsBC.postMessage({
                    action: 'END_STAT',
                    mediaId: parseInt(media.id),
                    layoutId: media.region?.layout?.id,
                    scheduleId: media.region?.layout?.scheduleId,
                    type: 'media',
                });
            }

            // Emit media/widget end event
            console.debug('Media::Emitter > End - Calling widgetEnd event', {
                mediaId: media.id,
                regionId: media.region?.id,
                layoutId: media.region?.layout?.id,
            });
            this.xlr.emitter.emit('widgetEnd', parseInt(media.id));

            media.region.playNextMedia();
        });

        // Initialize Media object
        this.init();
    }

    startMediaTimer(media: Media) {
        this.mediaTimer = setInterval(() => {
            this.mediaTimeCount++;
            if (this.mediaTimeCount > media.duration) {
                console.debug('startMediaTimer: emit>end: on media ' + media.id + ' of Region ' + media.region.regionId);

                console.debug('Media::Emitter > End', {
                    currentLayout: this.xlr.currentLayout,
                    media,
                    region: media.region,
                    layout: media.region.layout,
                })

                media.emitter.emit('end', media);
            }
        }, 1000);

        console.debug('startMediaTimer: Showing Media ' + media.id + ' for ' + media.duration + 's of Region ' + media.region.regionId);
    };

    on<E extends keyof IMediaEvents>(event: E, callback: IMediaEvents[E]) {
        return this.emitter.on(event, callback);
    };

    private init() {
        const mediaOptions = this.xml?.getElementsByTagName('options');

        if (mediaOptions) {
            for (let _options of Array.from(mediaOptions)) {
                // Get options
                const _mediaOptions = _options.children;
                for (let mediaOption of Array.from(_mediaOptions)) {
                    this.options[mediaOption.nodeName.toLowerCase()] = mediaOption.textContent;
                }
            }
        }

        // Check for options.uri and add it to media
        if (Boolean(this.options['uri'])) {
            this.uri = this.options['uri'];
        }

        // Show in fullscreen?
        if(this.options.showfullscreen === "1") {
            // Set dimensions as the layout ones
            this.divWidth = this.region?.layout?.sWidth ?? 0;
            this.divHeight = this.region?.layout?.sHeight ?? 0;
        } else {
            // Set dimensions as the region ones
            this.divWidth = this.region?.sWidth;
            this.divHeight = this.region?.sHeight;
        }

        const resourceUrlParams: any = {
            ...this.xlr.config.config,
            regionOptions: this.region.options,
            layoutId: this.region?.layout?.layoutId,
            regionId: this.region.id,
            mediaId: this.id,
            fileId: this.fileId,
            scaleFactor: this.region?.layout?.scaleFactor,
            uri: this.uri,
            isGlobalContent: this.mediaType === 'global',
            isImageOrVideo: this.mediaType === 'image' || this.mediaType === 'video',
        };

        if (this.mediaType === 'image' || this.mediaType === 'video') {
            resourceUrlParams.mediaType = this.mediaType;
        }

        let tmpUrl = '';

        if (this.xlr.config.platform === 'CMS') {
            tmpUrl = composeResourceUrlByPlatform(this.xlr.config, resourceUrlParams);
        } else if (this.xlr.config.platform === 'chromeOS') {
            tmpUrl = composeResourceUrl(this.xlr.config, resourceUrlParams);

            if (this.mediaType === 'image' || this.mediaType === 'video' || this.mediaType === 'audio') {
                tmpUrl = composeMediaUrl(resourceUrlParams);

                // this is an SSP Layout
                if (this.region?.layout?.layoutId === -1) {
                    tmpUrl = this.uri;
                }
            }
        }

        this.url = tmpUrl;

        // Loop if media has loop, or if region has loop and a single media
        this.loop =
            this.options['loop'] == '1' ||
            (this.region.options['loop'] == '1' && this.region.totalMediaItems == 1);
    }

    run() {
        const self = this;
        let transInDuration = 1;
        let transInDirection: compassPoints = 'E';

        if (Boolean(this.options['transinduration'])) {
            transInDuration = Number(this.options.transinduration);
        }

        if (Boolean(this.options['transindirection'])) {
            transInDirection = this.options.transindirection;
        }

        let defaultTransInOptions: TransitionElementOptions = {duration: transInDuration};
        let transIn = transitionElement('defaultIn', {duration: defaultTransInOptions.duration});
        
        if (Boolean(this.options['transin'])) {
            let transInName = this.options['transin'];

            if (transInName === 'fly') {
                transInName = `${transInName}In`;
                defaultTransInOptions.keyframes = flyTransitionKeyframes({
                    trans: 'in',
                    direction: transInDirection,
                    height: this.divHeight,
                    width: this.divWidth,
                });
            }

            transIn = transitionElement(transInName, defaultTransInOptions);
        }

        const showCurrentMedia = async () => {
            let $media = document.getElementById(this.containerName);
            const isCMS = this.xlr.config.platform === 'CMS';

            if (!$media) {
                $media = getNewMedia();
            }

            if ($media) {
                $media.style.setProperty('display', 'block');

                if (Boolean(this.options['transin'])) {
                    $media.animate(transIn.keyframes, transIn.timing);
                }

                if (this.mediaType === 'image' && this.url !== null) {
                    ($media as HTMLImageElement).style
                        .setProperty(
                            'background-image',
                            `url(${!isCMS
                                ? this.url
                                : await getDataBlob(this.url)}`
                        );
                } else if (this.mediaType === 'audio' && this.url !== null) {
                    ($media as HTMLAudioElement).src =
                        isCMS ? await preloadMediaBlob(this.url, this.mediaType) : this.url;
                } else if ((this.render === 'html' || this.mediaType === 'webpage') &&
                    this.iframe && this.checkIframeStatus
                ) {
                    // Set state as false ( for now )
                    this.ready = false;

                    // Append iframe
                    $media.innerHTML = '';
                    $media.appendChild(this.iframe as Node);

                    // On iframe load, set state as ready to play full preview
                    // (self.iframe) && self.iframe.addEventListener('load', function(){
                    //     self.ready = true;
                    //     if (self.iframe) {
                    //         const iframeStyles = self.iframe.style.cssText;
                    //         self.iframe.style.cssText = iframeStyles?.concat('visibility: visible;');
                    //     }
                    // });
                }

                if (this.region && !this.region.layout?.isOverlay ||
                    (this.region && this.region.layout?.isOverlay && this.region.totalMediaItems > 1)
                ) {
                    this.emitter.emit('start', this);
                }
            }
        };
        const getNewMedia = (): HTMLElement | null => {
            const $region = document.getElementById(`${this.region.containerName}`);
            // This function is for checking whether
            // the region still has to show a media item
            // when another region is not finished yet
            if (this.region && this.region.complete && !this.region.layout?.allEnded) {
                // Add currentMedia to the region

                ($region) && $region.insertBefore(this.html as Node, $region.lastElementChild);

                return this.html as HTMLElement;
            }

            return null;
        };

        showCurrentMedia();
    }

    async stop() {
        const $media = document.getElementById(this.containerName);

        if ($media) {
            $media.style.display = 'none';
            $media.remove();
        }
    }

    clone() {
        return new Media(
            this.region,
            this.mediaId,
            this.xml as Element,
            this.options,
            this.xlr,
        );
    }
}