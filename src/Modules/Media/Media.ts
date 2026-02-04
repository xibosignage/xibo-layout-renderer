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
import { IRegion } from '../../Types/Region';
import { IMedia } from '../../Types/Media';
import { IMediaEvents } from '../../Types/Events';
import {
    capitalizeStr,
    getMediaId,
    nextId,
    preloadMediaBlob,
    composeResourceUrl,
    composeResourceUrlByPlatform,
    composeMediaUrl,
    getDataBlob,
} from '../Generators';
import { TransitionElementOptions, compassPoints, flyTransitionKeyframes, transitionElement } from '../Transitions';
import { composeVideoSource, VideoMedia } from './VideoMedia';
import { AudioMedia } from './AudioMedia';
import {IXlr} from '../../Types/XLR';
import {MediaState} from "../../Types/Media/Media.types";

import 'video.js/dist/video-js.min.css';
import {createMediaElement, MediaTypes} from "../Generators/Generators";
import { IMediaLifecycleManager, IPreciseMediaTimer, MediaLifecycleManager, MediaLifecycleState, PreciseMediaTimer } from '../../Lib';

export class Media implements IMedia {
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
    mediaType: MediaTypes | string = '';
    muted?: boolean = false;
    options: OptionsType & {
        [k: string]: any;
    } = <OptionsType>{};
    player?: Player = undefined;
    ready: boolean = true;
    region: IRegion = <IRegion>{};
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

    lifecycle: IMediaLifecycleManager = new MediaLifecycleManager();
    preciseTimer: IPreciseMediaTimer | null = null;
    preloadStartTime: number = 0;

    private mediaTimer: ReturnType<typeof setInterval> | undefined | null;
    private mediaTimeCount = 0;
    private xlr: IXlr = <IXlr>{};
    private readonly statsBC = new BroadcastChannel('statsBC');

    constructor(
        region: IRegion,
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
        this.containerName = `M-${this.id}-${this.idCounter}`;
        this.iframeName = `${this.containerName}-iframe`;
        this.mediaType = this.xml?.getAttribute('type') || '';
        this.render = this.xml?.getAttribute('render') || '';
        this.duration = parseInt(this.xml?.getAttribute('duration') as string) || 0;
        this.enableStat = Boolean(this.xml?.getAttribute('enableStat') || false);

        this.on('start', (media: IMedia) => {
            // if (media.state === MediaState.PLAYING) return;

            // media.state = MediaState.PLAYING;
            // if (media.mediaType === 'video') {
            //     const videoMedia = VideoMedia(media, xlr);

            //     videoMedia.init();

            //     if (media.duration > 0) {
            //         this.startMediaTimer(media);
            //     }
            // } else if (media.mediaType === 'audio') {
            //     AudioMedia(media).init();
            //     if (media.duration > 0) {
            //         this.startMediaTimer(media);
            //     }
            // } else {
            // }

            this.startMediaTimer(media);
            // Check if stats are enabled for the layout
            if (media.enableStat) {
                this.statsBC.postMessage({
                    action: 'START_STAT',
                    mediaId: parseInt(media.id),
                    layoutId: media.region.layout.id,
                    scheduleId: media.region.layout.scheduleId,
                    type: 'media',
                });
            }

            // Emit media/widget start event
            console.debug('Media::Emitter > Start - Calling widgetStart event');
            this.xlr.emitter.emit('widgetStart', parseInt(media.id));
        });

        this.on('end', (media: IMedia) => {
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
                    layoutId: media.region.layout.id,
                    scheduleId: media.region.layout.scheduleId,
                    type: 'media',
                });
            }

            // Emit media/widget end event
            console.debug('Media::Emitter > End - Calling widgetEnd event', {
                mediaId: media.id,
                regionId: media.region.id,
                layoutId: media.region.layout.id,
            });
            this.xlr.emitter.emit('widgetEnd', parseInt(media.id));

            media.region.playNextMedia();
        });

        // Initialize Media object
        this.init();
    }

    async preload(options?: {
        signal?: AbortSignal;
        onProgress?: (percent: number) => void;
    }): Promise<void> {
        if (this.mediaType === 'video') {
            await this.preloadVideo(options);
        } else if (this.mediaType === 'audio') {
            await this.preloadAudio(options);
        } else if (this.mediaType === 'image') {
            await this.preloadImage(options);
        } else if (this.render === 'html' || this.mediaType === 'webpage') {
            await this.preloadHtml(options);
        } else {
            // Default: mark as ready immediately
            options?.onProgress?.(100);
        }
    }

    private async preloadVideo(options?: any): Promise<void> {
        console.debug('??? XLR.debug >> Preloading video media', {
            mediaId: this.id,
            url: this.url,
        });
        // Video preloading
        return new Promise((resolve, reject) => {
            const abortListener = () => reject(new DOMException('Aborted', 'AbortError'));
            options?.signal?.addEventListener('abort', abortListener);
            
            try {
                // Create video element and video.js player
                if (!this.player && this.html && this.mediaType === 'video') {
                    // Create player with preload: 'auto'
                    const player = videojs(this.html, {
                        controls: false,
                        preload: 'auto',
                        autoplay: false,
                        muted: true,
                        errorDisplay: this.xlr.config.platform !== 'chromeOS',
                        loop: this.loop,
                    });
                    
                    this.player = player;
                    
                    // Set source
                    if (this.url) {
                        const source = composeVideoSource(this.html as HTMLVideoElement, this);
                        options?.onProgress?.(50);
                    }
                    
                    // Wait for metadata to be loaded
                    player.one('loadedmetadata', () => {
                        options?.onProgress?.(80);
                        
                        const playerDuration = player.duration();
                        if (this.duration === 0 && playerDuration) {
                            this.duration = Math.ceil(playerDuration);
                        }
                    });
                    
                    // Wait for canplay
                    player.one('canplay', () => {
                        options?.onProgress?.(100);
                        options?.signal?.removeEventListener('abort', abortListener);
                        resolve();
                    });
                    
                    player.on('error', (err: any) => {
                        options?.signal?.removeEventListener('abort', abortListener);
                        reject(err);
                    });
                }
            } catch (error) {
                options?.signal?.removeEventListener('abort', abortListener);
                reject(error);
            }
        });
    }

    private async preloadAudio(options?: any): Promise<void> {
        console.debug('??? XLR.debug >> Preloading audio media', {
            mediaId: this.id,
            url: this.url,
        });
        const isCMS = this.xlr.config.platform === 'CMS';
        // Similar to video but for audio elements
        return new Promise(async (resolve, reject) => {
            try {
                if (this.url && this.html) {
                    const audio = this.html as HTMLAudioElement;
                    audio.src = !isCMS ? this.url : await preloadMediaBlob(this.url, this.mediaType, this.options.previewJwt);
                    options?.onProgress?.(50);
                    
                    audio.onloadedmetadata = () => {
                        options?.onProgress?.(80);
                        if (this.duration === 0) {
                            this.duration = Math.ceil(audio.duration);
                        }
                    };
                    
                    audio.oncanplay = () => {
                        options?.onProgress?.(100);
                        resolve();
                    };
                    
                    audio.onerror = (err) => reject(err);
                    audio.load();
                } else {
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    private async preloadImage(options?: any): Promise<void> {
        console.debug('??? XLR.debug >> Preloading image media', {
            mediaId: this.id,
            url: this.url,
        });
        const isCMS = this.xlr.config.platform === 'CMS';
        // Preload image via Image element
        return new Promise(async (resolve, reject) => {
            try {
                const img = new Image();
                img.onload = () => {
                    options?.onProgress?.(100);
                    resolve();
                };
                img.onerror = () => reject(new Error('Image load failed'));
                
                if (this.url) {
                    options?.onProgress?.(50);
                    img.src = !isCMS ? this.url : await getDataBlob(this.url, this.options.previewJwt) as string;
                } else {
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    private async preloadHtml(options?: any): Promise<void> {
        console.debug('??? XLR.debug >> Preloading HTML/iframe media', {
            mediaId: this.id,
            html: this.html,
            iframe: this.iframe,
            ready: this.ready,
            iframeStatus: this.checkIframeStatus,
        });
        // HTML/iframe preloading
        return new Promise((resolve) => {
            if (this.iframe) {
                options?.onProgress?.(50);
                
                const onIframeReady = () => {
                    this.checkIframeStatus = true;
                    options?.onProgress?.(100);

                    if (this.html) {
                        this.html.innerHTML = '';
                        this.html.appendChild(this.iframe as HTMLIFrameElement);
                    }

                    resolve();
                };
                
                if (this.ready) {
                    onIframeReady();
                } else {
                    this.iframe.onload = onIframeReady;
                    setTimeout(onIframeReady, 1000);  // Timeout safety
                }
            } else {
                options?.onProgress?.(100);
                resolve();
            }
        });
    }

    private startMediaTimer(media: IMedia) {
        const preciseTimer = new PreciseMediaTimer(media.duration);
        const preloadEstimate = media.region.pipeline.estimatePreloadTime(media);
        const preloadTriggerMs = media.duration - (2000 + preloadEstimate);

        let preloadTriggered = false;

        preciseTimer.onTick((elapsed, remaining) => {
            // Trigger preload at calculated time
            if (!preloadTriggered && remaining <= (2000 + preloadEstimate)) {
                preloadTriggered = true;
                console.debug(`??? XLR.debug >> Precise timer: Preloading next media for media ${media.id}, remaining time: ${remaining}ms`, {
                    elapsed,
                });
                
                media.region.pipeline
                    .onCurrentMediaWillEnd(remaining)
                    .catch(err => console.error('??? XLR.debug >> Preload failed:', err));
            }
        });

        preciseTimer.onComplete(() => {
            console.debug(`??? XLR.debug >> Precise timer: Media ${media.id} duration ended`);
            console.debug('??? XLR.debug >> startMediaTimer: emit>end: on media ' + media.id + ' of Region ' + media.region.regionId);

            // Trigger transition
            media.region.pipeline
                .onCurrentMediaEnded()
                .catch(err => console.error('??? XLR.debug >> Transition failed:', err));
        });

        preciseTimer.start();
        media.preciseTimer = preciseTimer;

        this.mediaTimer = null; // Disable interval-based timer
        this.mediaTimeCount = 0;
        // this.mediaTimer = setInterval(() => {
        //     this.mediaTimeCount++;
        //     if (this.mediaTimeCount > media.duration) {
        //         console.debug('startMediaTimer: emit>end: on media ' + media.id + ' of Region ' + media.region.regionId);

        //         console.debug('Media::Emitter > End', {
        //             currentLayout: this.xlr.currentLayout,
        //             media,
        //             region: media.region,
        //             layout: media.region.layout,
        //         })

        //         media.emitter.emit('end', media);

        //         if (media.mediaType === 'video') {
        //             // Dispose the video media
        //             console.debug(`VideoMedia::stop - ${capitalizeStr(media.mediaType)} for media > ${media.id} has ended playing . . .`);
        //             VideoMedia(media, this.xlr).stop(true);
        //         }
        //     }
        // }, 1000);

        console.debug('startMediaTimer: Showing Media ' + media.id + ' for ' + media.duration + 's of Region ' + media.region.regionId);
    };

    private on<E extends keyof IMediaEvents>(event: E, callback: IMediaEvents[E]) {
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
            this.divWidth = this.region.layout.sWidth;
            this.divHeight = this.region.layout.sHeight;
        } else {
            // Set dimensions as the region ones
            this.divWidth = this.region.sWidth;
            this.divHeight = this.region.sHeight;
        }

        const resourceUrlParams: any = {
            ...this.xlr.config.config,
            regionOptions: this.region.options,
            layoutId: this.region.layout.layoutId,
            regionId: this.region.id,
            mediaId: this.id,
            fileId: this.fileId,
            scaleFactor: this.region.layout.scaleFactor,
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
                if (this.region.layout.layoutId === -1) {
                    tmpUrl = this.uri;
                }
            }
        }

        this.url = tmpUrl;

        // Loop if media has loop, or if region has loop and a single media
        this.loop =
            this.options['loop'] == '1' ||
            (this.region.options['loop'] == '1' && this.region.totalMediaObjects == 1);

        // Create HTML element for media
        this.html = createMediaElement(this, 'current');
    }

    run() {
        // Update lifecycle state
        if (this.lifecycle.canTransitionTo(MediaLifecycleState.PLAYING)) {
            this.lifecycle.transitionToState(MediaLifecycleState.PLAYING);
        }

        // Resources should already be loaded from preload()
        // Just start rendering/playing
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

        const getNewMedia = (): HTMLElement | null => {
            const $region = document.getElementById(`${this.region.containerName}`);
            // This function is for checking whether
            // the region still has to show a media item
            // when another region is not finished yet
            if (this.region.complete && !this.region.layout.allEnded) {
                // Add currentMedia to the region

                ($region) && $region.insertBefore(this.html as Node, $region.lastElementChild);

                return this.html as HTMLElement;
            }

            return null;
        };

        const showCurrentMedia = async () => {
            let $mediaId = getMediaId(<IMedia>{mediaType: this.mediaType, containerName: this.containerName});
            let $media = document.getElementById($mediaId);

            if (!$media) {
                $media = getNewMedia();
            }

            if ($media) {
                $media.style.setProperty('display', 'block');

                if (Boolean(this.options['transin'])) {
                    $media.animate(transIn.keyframes, transIn.timing);
                }

                // For video: start playback immediately
                if (this.mediaType === 'video' && this.player) {
                    // Player should already be ready from preload
                    this.player.muted(this.muted ?? false);
                    this.player.play()?.catch((err) => {
                        console.error('Video playback failed:', err);
                    });
                }

                if (!this.region.layout.isOverlay ||
                    (this.region.layout.isOverlay && this.region.totalMediaObjects > 1)
                ) {
                    this.emitter.emit('start', this);
                }
            }
        };

        showCurrentMedia();
    }

    async stop() {
        const $media = document.getElementById(
            getMediaId(<IMedia>{mediaType: this.mediaType, containerName: this.containerName})
        );

        if ($media) {
            $media.style.display = 'none';
            $media.remove();
        }
    }
}