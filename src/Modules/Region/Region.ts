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
import { createNanoEvents } from 'nanoevents';
import { nanoid } from "nanoid";
import videojs from "video.js";

import { ILayout, OptionsType } from '../../Types/Layout';
import { IRegion } from '../../Types/Region';
import { IMedia } from '../../Types/Media';
import { IRegionEvents } from "../../Types/Events";
import { getFileExt, nextId, videoFileType } from '../Generators';
import { defaultVjsOpts, Media, videoMediaHandler } from '../Media';
import {
    TransitionElementOptions,
    TransitionNameType,
    compassPoints,
    flyTransitionKeyframes,
    transitionElement,
} from '../Transitions';
import { IXlr } from '../../Types/XLR';
import {
    getAllAttributes,
    prepareAudioMedia,
    prepareHtmlMedia,
    prepareImageMedia,
    prepareVideoMedia
} from '../Generators/Generators';
import { BlobLoader } from "../../Lib";
import { ConsumerPlatform } from "../../Types/Platform";

export default class Region implements IRegion {
    // ===== Properties =====
    layout: ILayout;
    xml: Element | null;
    regionId: string;
    options: OptionsType;
    xlr: IXlr;

    // ===== Initial Properties =====
    complete: boolean = false;
    containerName: string = '';
    currMedia: IMedia | undefined = undefined;
    currEl: HTMLElement | null = null;
    currentMedia: number = -1;
    currentMediaIndex: number = -1;
    ended: boolean = false;
    ending: boolean = false;
    html: HTMLDivElement = document.createElement('div');
    id: string = '';
    index: number = -1;
    mediaObjects: IMedia[] = [];
    mediaObjectsActions: IMedia[] = [];
    nxtMedia: IMedia | undefined = undefined;
    nxtEl: HTMLElement | null = null;
    offsetX: number = 0;
    offsetY: number = 0;
    oldMedia: IMedia | undefined = undefined;
    oneMedia: boolean = false;
    ready: boolean = false;
    sHeight: number = 0;
    sWidth: number = 0;
    totalMediaObjects: number = 0;
    uniqueId: string = nanoid();
    zIndex: number = 0;

    emitter = createNanoEvents<IRegionEvents>();

    // ===== Constructor =====
    constructor(
        layout: ILayout,
        xml: Element,
        regionId: string,
        options: OptionsType,
        xlr: IXlr,
    ) {
        this.layout = layout;
        this.xml = xml;
        this.regionId = regionId;
        this.options = options;
        this.xlr = xlr;
        this.ready = false;

        // Initialize other properties from old props
        this.id = regionId;
        this.containerName = `R-${this.id}-${this.uniqueId}`;
        this.html = document.createElement('div');

        this.prepareRegion();
    }

    // ===== Methods =====
    prepareRegion() {
        this.complete = false;
        this.ending = false;
        this.ended = false;
        this.currMedia = undefined;
        this.nxtMedia = undefined;
        this.oldMedia = undefined;
        this.currentMediaIndex = -1;
        this.id = this.regionId;
        this.uniqueId = `${nextId(this.options as OptionsType & IRegion["options"])}`;
        this.containerName = `R-${this.id}-${this.uniqueId}`;
        this.mediaObjects = [];

        this.sWidth = (this.xml) ? Number(this.xml?.getAttribute('width')) * this.layout.scaleFactor : 0;
        this.sHeight = (this.xml) ? Number(this.xml?.getAttribute('height')) * this.layout.scaleFactor : 0;
        this.offsetX = (this.xml) ? Number(this.xml?.getAttribute('left')) * this.layout.scaleFactor : 0;
        this.offsetY = (this.xml) ? Number(this.xml?.getAttribute('top')) * this.layout.scaleFactor : 0;
        this.zIndex = (this.xml) ? Number(this.xml?.getAttribute('zindex')) : 0;

        const regionOptions = this.xml?.getElementsByTagName('options');

        if (regionOptions) {
            for (let _options of Array.from(regionOptions)) {
                // Get options
                const _regionOptions = _options.children;
                for (let regionOption of Array.from(_regionOptions)) {
                    (this.options as Record<string, any>)[regionOption.nodeName.toLowerCase()] = regionOption.textContent;
                }
            }
        }

        const $layout = <HTMLDivElement | null>(document.querySelector(`#${this.layout.containerName}[data-sequence="${this.layout.index}"]`));

        let $region = null;
        if ($layout !== null) {
            $region = $layout.querySelector('#' + this.containerName) as HTMLDivElement;
        }

        if ($region === null) {
            $region = document.createElement('div');
            $region.id = this.containerName;
        }

        ($layout) && $layout.appendChild($region);

        /* Scale the Layout Container */
        /* Add region styles */
        $region.style.cssText = `
            width: ${this.sWidth}px;
            height: ${this.sHeight}px;
            position: absolute;
            left: ${this.offsetX}px;
            top: ${this.offsetY}px;
            z-index: ${Math.round(this.zIndex)};
        `;
        $region.className = 'region--item';

        // Set visibility when zIndex = 0 and
        // only when layout has background image
        if (String(this.layout.bgImage).length > 0 && this.zIndex <= 0) {
            $region.style.setProperty('visibility', 'hidden');
        }

        // Save region html
        this.html = $region;

        /* Parse region media objects */
        const regionMediaItems = Array.from(this.xml!.getElementsByTagName('media'));
        this.totalMediaObjects = regionMediaItems.length;

        Array.from(regionMediaItems).forEach(async (mediaXml, indx) => {
            const mediaObj = new Media(
                this,
                mediaXml?.getAttribute('id') || '',
                mediaXml,
                this.options as OptionsType & IRegion["options"],
                this.xlr,
            );

            mediaObj.index = indx;
            this.mediaObjects.push(mediaObj);
        });

        console.debug('??? XLR.debug >> Region - done looping through media', {
            mediaObjects: this.mediaObjects,
        });
        //
        // (async () => {
        //   // prepare first media
        //   if (this.mediaObjects.length > 0) {
        //     const firstMedia = this.mediaObjects[0];
        //     await this.prepareFirstMedia(firstMedia);
        //
        //     this.ready = true;
        //     console.debug('??? XLR.debug >> Region prepareRegion - prepared first media', {
        //       mediaId: firstMedia.id,
        //       mediaType: firstMedia.mediaType,
        //       containerName: firstMedia.containerName,
        //     })
        //   }
        // })();

        // Add media to region for targeted actions
        this.layout.actionController?.actions.forEach((action) => {
            const attributes = getAllAttributes(action.xml);

            if (attributes.target.value === 'region' &&
                attributes.actionType.value === 'navWidget' &&
                attributes.targetId.value == this.id
            ) {
                const drawerMediaItems = Array.from(this.layout.drawer?.getElementsByTagName('media') || []);

                drawerMediaItems.forEach((drawerMedia) => {
                    if (drawerMedia.id === attributes.widgetId?.value) {
                        // Add drawer media to the region
                        this.mediaObjectsActions.push(new Media(
                            this,
                            drawerMedia?.getAttribute('id') || '',
                            drawerMedia as Element,
                            this.options as OptionsType & IRegion['options'],
                            this.xlr,
                        ));
                    }
                });
            }
        });

        console.debug('??? XLR.debug >> Region::prepareRegion', {
            mediaItems: this.mediaObjects,
            totalMediaItems: this.totalMediaObjects,
        });

        // Prepare first media
        if (this.mediaObjects.length > 0) {
            // Clean up region first
            if (this.html?.children.length > 0) {
                this.html.innerHTML = '';
            }

            this.prepareFirstMedia();
        }
    };

    prepareMedia(media: IMedia) {
        if (media.mediaType === 'video') {
            prepareVideoMedia(media, this);
        } else if (media.mediaType === 'image' && media.url !== null) {
            prepareImageMedia(media, this);
        } else if (media.mediaType === 'audio' && media.url !== null) {
            prepareAudioMedia(media, this);
        } else if ((media.render === 'html' || media.mediaType === 'webpage') &&
            media.iframe && media.checkIframeStatus
        ) {
            prepareHtmlMedia(media, this);
        }
    }

    prepareFirstMedia() {
        this.currentMediaIndex = 0;
        this.oldMedia = undefined;
        this.currMedia = this.mediaObjects[this.currentMediaIndex];
        const firstMedia = this.currMedia;

        if (firstMedia) {
            this.prepareMedia(firstMedia);
        }
    }

    prepareNextMedia() {
        const nextMediaIndex = (this.currentMediaIndex + 1) % this.totalMediaObjects;
        const nextMedia = this.mediaObjects[nextMediaIndex];

        this.prepareMedia(nextMedia);
    }

    prepareMediaObjects() {
        this.currentMediaIndex = (this.currentMediaIndex + 1) % this.mediaObjects.length;
        let nextMediaIndex;

        if (this.mediaObjects.length > 0) {

            this.currMedia = this.mediaObjects[this.currentMediaIndex];
            nextMediaIndex = (this.currentMediaIndex + 1) % this.totalMediaObjects;

            if (Boolean(this.mediaObjects[nextMediaIndex])) {
                this.nxtMedia = (this.currentMediaIndex === nextMediaIndex)
                    ? { ...this.mediaObjects[nextMediaIndex] }
                    : this.mediaObjects[nextMediaIndex];
            }

            console.debug('<> XLR.debug prepareMediaObjects::oldMedia', {
                regionId: this.id,
                oldMedia: this.oldMedia?.containerName,
            });

            // const $region = document.getElementById(`${this.containerName}`);

            // Preload first item
            // if (this.currentMediaIndex > 0 && this.nxtMedia) {
            //     // Prepare next items
            //     this.prepareMedia(this.nxtMedia);
            // } else {
            //     this.prepareMedia(this.currMedia);
            // }
            // Append available media to region DOM
            // if (this.currMedia) {
            //
            //     this.currEl = createMediaElement(this.currMedia);
            //     this.currMedia.html = this.currEl;
            //
            //     console.debug('<> XLR.debug prepareMediaObjects::currMedia', {
            //         currentMedia: this.currMedia.containerName,
            //         regionId: this.id,
            //     });
            //     ($region) && $region.insertBefore(this.currEl as Node, $region.lastElementChild);
            // }

            // if (this.totalMediaObjects > 1 && this.nxtMedia) {
            //     this.nxtEl = createMediaElement(this.nxtMedia);
            //     this.nxtMedia.html = this.nxtEl;
            //
            //     console.debug('<> XLR.debug prepareMediaObjects::nxtMedia', {
            //         nextMedia: this.nxtMedia.containerName,
            //         regionId: this.id,
            //     });
            //     ($region) && $region.insertBefore(this.nxtEl as Node, $region.lastElementChild);
            // }
        }
    }

    finished() {
        console.debug('<> XLR.debug Region::finished called . . . ', {
            regionId: this.id,
        });

        // Mark as complete
        this.complete = true;
        this.layout.regions[this.index] = this;
        this.layout.regionExpired();
    }

    private async prepareVideo(media: IMedia, container: HTMLElement | null) {
        const video = media.html as HTMLVideoElement;

        if (media.url !== null) {
            video.src = media.url;
        }

        (container !== null) && container.appendChild(media.html as HTMLVideoElement);

        return new Promise<void>((resolve) => {
            const vidType = videoFileType(getFileExt(media.uri)) as string;
            // Initialize Video.js
            media.player = videojs(video, {
                ...defaultVjsOpts,
                errorDisplay: this.xlr.config.platform !== ConsumerPlatform.CHROMEOS,
                loop: media.loop,
                sources: [{ src: media.url as string, type: vidType }] // Adjust MIME type if dynamic
            });

            (media.player.el() as HTMLElement).style.setProperty('visibility', 'hidden');
            (media.player.el() as HTMLElement).style.setProperty('z-index', '0');
            (media.player.el() as HTMLElement).style.setProperty('opacity', '0');

            // Register video handler
            media.videoHandler = videoMediaHandler(media, this.xlr.config.platform);

            media.videoHandler.player?.one('canplaythrough', () => {
                resolve();
            });
        });
    }

    private async prepareImage(media: IMedia, container: HTMLElement | null) {
        const blobUrl = await BlobLoader.load(media.url as string);

        const img = new Image();

        // Wait for decoding to finish so there is no visual glitch
        return new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (e) => reject(e);
            img.src = blobUrl;

            if (media.html) {
                media.html.style.setProperty(
                    'background-image',
                    `url(${blobUrl})`
                );
            }

            (container !== null) && container.appendChild(media.html as HTMLElement);
        });
    }

    private prepareIframe(media: IMedia, container: HTMLElement | null): Promise<void> {
        console.debug('??? XLR.debug >> Region prepareIframe - start');
        return new Promise((resolve, reject) => {
            const iframe = media.iframe;
            console.debug('??? XLR.debug >> Region prepareIframe - promise', {
                iframe,
                mediaType: media.mediaType,
                container,
            })

            if (iframe !== null) {
                iframe.onload = () => resolve();
                iframe.onerror = (e) => reject(e);

                // Append iframe to html
                if (media.html) {
                    media.html.innerHTML = '';
                    media.html.appendChild(iframe);
                }

                (container !== null) && container.appendChild(media.html as HTMLElement);
            }
        });
    }

    run() {
        console.debug('??? XLR.debug >> Region Called Region::run > ', this.id);

        // Reset region states
        this.reset();

        if (this.currMedia) {
            this.transitionNodes(this.oldMedia, this.currMedia);
        }
    }

    transitionNodes(oldMedia: IMedia | undefined, newMedia: IMedia | undefined) {
        let transOutDuration = 1;
        let transOutDirection: compassPoints = 'E';

        if (newMedia) {
            if (oldMedia && Boolean(oldMedia.options['transoutduration'])) {
                transOutDuration = Number(oldMedia.options.transoutduration);
            }

            if (oldMedia && Boolean(oldMedia.options['transoutdirection'])) {
                transOutDirection = oldMedia.options.transoutdirection;
            }

            let defaultTransOutOptions: TransitionElementOptions = { duration: transOutDuration };
            let transOut = transitionElement('defaultOut', { duration: defaultTransOutOptions.duration });

            let transOutName: TransitionNameType | string;
            if (oldMedia && Boolean(oldMedia.options['transout'])) {
                transOutName = oldMedia.options['transout'];

                if (transOutName === 'fly') {
                    transOutName = `${transOutName}Out`;
                    defaultTransOutOptions.keyframes = flyTransitionKeyframes({
                        trans: 'out',
                        direction: transOutDirection,
                        height: oldMedia.divHeight,
                        width: oldMedia.divWidth,
                    });
                }

                transOut = transitionElement(transOutName as TransitionNameType, defaultTransOutOptions);
            }

            const hideOldMedia = () => {
                // Hide oldMedia
                if (oldMedia) {
                    const $oldMedia = oldMedia.html;
                    if ($oldMedia) {
                        const removeOldMedia = () => {
                            console.debug('??? XLR.debug >> Region transitionNodes - removeOldMedia fn', {
                                $oldMedia,
                            })
                            $oldMedia.style.setProperty('visibility', 'hidden');
                            $oldMedia.style.setProperty('z-index', '-999');
                            $oldMedia.style.setProperty('opacity', '0');

                            let $videoWrapper = null;
                            if (oldMedia.mediaType === 'video') {
                                // @ts-ignore
                                if ($oldMedia !== null && $oldMedia?.parentElement?.classList.contains('video-js')) {
                                    $videoWrapper = $oldMedia.parentElement;

                                    if ($videoWrapper !== null) {
                                        $videoWrapper.style.setProperty('visibility', 'hidden');
                                        $videoWrapper.style.setProperty('z-index', '-999');
                                        $videoWrapper.style.setProperty('opacity', '0');

                                        if (oldMedia.player && oldMedia.videoHandler) {
                                            oldMedia.videoHandler.stop(true);
                                        }
                                    }
                                }
                            }

                            setTimeout(() => {
                                console.debug('??? XLR.debug >> Region transitionNodes - removeOldMedia setTimeout');
                                // Remove entirely the element with a delay
                                if ($videoWrapper) {
                                    $videoWrapper.remove();
                                }
                                $oldMedia.remove();
                            }, 1000);
                        };

                        let oldMediaAnimate: any;
                        if (Boolean(oldMedia.options['transout'])) {
                            oldMediaAnimate = $oldMedia.animate(transOut.keyframes, transOut.timing);
                        }

                        if (Boolean(oldMedia.options['transout']) && this.totalMediaObjects > 1) {
                            if (transOutName === 'flyOut') {
                                // Reset last item to original position and state
                                oldMediaAnimate ? oldMediaAnimate.finished
                                    .then(() => {
                                        oldMediaAnimate?.effect?.updateTiming({ fill: 'none' });
                                        removeOldMedia();
                                    }) : undefined;
                            } else {
                                console.debug('??? XLR.debug >> Region transitionNode - hideOldMedia setTimeout', {
                                    transOutDuration,
                                });
                                setTimeout(() => {
                                    console.debug('??? XLR.debug >> Region transitionNode - hideOldMedia execute setTimeout', {
                                        transOutDuration,
                                        oldMedia,
                                        $oldMedia,
                                    });
                                    removeOldMedia();
                                }, (transOutDuration / 2));
                            }
                        } else {
                            console.debug('??? XLR.debug >> Region transitionNode - hideOldMedia' +
                                'no transout and only 1 media');
                            removeOldMedia();
                            // Resolve this right away
                            // As a result, the transition between two media object
                            // seems like a cross-over
                        }
                    }
                }
            };

            if (oldMedia) {
                hideOldMedia();
                newMedia.run();
            } else {
                newMedia.run();
            }
        }
    };

    playNextMedia() {
        console.debug('??? XLR.debug Region playing next media', {
            regionId: this.id,
            currentMediaIndex: this.currentMediaIndex,
            mediaItemsLn: this.mediaObjects.length,
            oldMedia: this.oldMedia?.containerName,
            currMedia: this.currMedia?.containerName,
            nxtMedia: this.nxtMedia?.containerName,
        })

        /* The current media has finished running */
        if (this.ended) {
            console.debug('??? XLR.debug >> Region - playNextMedia - region ended', {
                ended: this.ended,
            });
            return;
        }

        // Are we in a playlist, and has the playlist completed a full cycle?
        const isLastMediaInPlaylist = this.currentMediaIndex === this.mediaObjects.length - 1 && this.mediaObjects.length > 1;

        // If yes, enable shell command widgets again (if any), so they execute on the next playlist cycle
        if (isLastMediaInPlaylist) {
            this.mediaObjects.forEach((media: IMedia): void => {
                if (media.mediaType === 'shellcommand') {
                    // reset per-playlist-cycle execution state
                    (media as any).hasCommandExecuted = false;
                }
            });
        }

        if (!this.layout.isOverlay && this.currentMediaIndex === this.mediaObjects.length - 1) {
            this.finished();

            if (this.layout.allEnded) {
                console.debug('??? XLR.debug >> Region - playNextMedia - layout all ended');
                return;
            }
        }

        // When the region has completed and when currentMedia is html
        // Then, preserve the currentMedia state
        if (this.complete &&
            this.currMedia?.render === 'html'
        ) {
            return;
        }

        // When the region has completed and mediaObjects.length = 1
        // and curMedia.loop = false, then put the media on
        // its current state
        if (this.complete && this.mediaObjects.length === 1 &&
            this.currMedia?.render !== 'html' &&
            (this.currMedia?.mediaType === 'image' ||
                this.currMedia?.mediaType === 'video') &&
            !this.currMedia?.loop
        ) {
            return;
        }

        if (this.currMedia) {
            this.oldMedia = this.currMedia;
        } else {
            this.oldMedia = undefined;
        }

        this.currentMediaIndex = (this.currentMediaIndex + 1) % this.totalMediaObjects;
        this.currMedia = this.mediaObjects[this.currentMediaIndex];
        this.nxtMedia = this.mediaObjects[
            (this.currentMediaIndex + 1) % this.totalMediaObjects
        ];

        console.debug('??? XLR.debug >> End Region::playNextMedia > execute transitionNodes', {
            regionId: this.id,
            currentMediaIndex: this.currentMediaIndex,
            mediaItemsLn: this.mediaObjects.length,
            oldMedia: this.oldMedia?.containerName,
            currMedia: this.currMedia?.containerName,
            nxtMedia: this.nxtMedia?.containerName,
        })

        this.transitionNodes(this.oldMedia, this.currMedia);
    };

    playPreviousMedia() {
        this.currentMediaIndex = this.currentMediaIndex - 1;

        if (this.currentMediaIndex < 0 || this.ended) {
            this.currentMediaIndex = 0;
            return;
        }

        this.prepareMediaObjects();

        console.debug('region::playPreviousMedia', this);
        /* Do the transition */
        this.transitionNodes(this.oldMedia, this.currMedia);
    };

    end() {
        this.ending = true;
        /* The Layout has finished running */
        /* Do any region exit transition then clean up */
        this.layout.regions[this.index] = this;
        console.debug('Calling Region::end ', this);
        this.exitTransition();
    };

    exitTransition() {
        /* TODO: Actually implement region exit transitions */
        const $region = document.getElementById(`${this.containerName}`);

        if ($region) {
            // $region.style.display = 'none';
        }

        console.debug('Called Region::exitTransition ', this.id);

        this.exitTransitionComplete();
    }

    exitTransitionComplete() {
        console.debug('Called Region::exitTransitionComplete ', this.id);
        this.ended = true;
        this.layout.regions[this.index] = this;
        this.layout.regionEnded();
    }

    reset() {
        this.ended = false;
        this.complete = false;
        this.ending = false;
        console.debug('Resetting region states', this);
    }

    on<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]) {
        return this.emitter.on(event, callback);
    }
}