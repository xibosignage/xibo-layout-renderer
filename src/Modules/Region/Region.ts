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
import {nanoid} from "nanoid";

import { ILayout, OptionsType } from '../../Types/Layout';
import { initialRegion, IRegion, IRegionEvents } from '../../Types/Region';
import { IMedia } from '../../Types/Media';
import {getDataBlob, getMediaId, nextId, preloadMediaBlob} from '../Generators';
import { platform } from '../Platform';
import {Media, vjsDefaultOptions} from '../Media';
import {
    TransitionElementOptions,
    TransitionNameType,
    compassPoints,
    flyTransitionKeyframes,
    transitionElement,
} from '../Transitions';
import {IXlr} from '../../Types/XLR';
import {createMediaElement, getAllAttributes} from '../Generators/Generators';
import videojs from "video.js";
import {ConsumerPlatform} from "../../Types/Platform";

export default function Region(
    layout: ILayout,
    xml: Element,
    regionId: string,
    options: OptionsType,
    xlr: IXlr,
) {
    const props = {
        layout: layout,
        xml: xml,
        regionId: regionId,
        options: options,
    }
    const emitter = createNanoEvents<IRegionEvents>();
    let regionObject: IRegion = {
        ...initialRegion,
        ...props,
    };

    regionObject.currEl = undefined;
    regionObject.nxtEl = undefined;

    regionObject.prepareRegion = function() {
        const self = regionObject;
        const {layout, options} = self;
        self.complete = false;
        self.ending = false;
        self.ended = false;
        self.currMedia = undefined;
        self.nxtMedia = undefined;
        self.oldMedia = undefined;
        self.currentMediaIndex = 0;
        self.id = props.regionId;
        self.uniqueId = `${nextId(self.options as OptionsType & IRegion["options"])}`;
        self.options = {...platform, ...props.options};
        self.containerName = `R-${self.id}-${self.uniqueId}`;
        self.xml = props.xml;
        self.mediaObjects = [];

        self.sWidth = (self.xml) && Number(self.xml?.getAttribute('width')) * layout.scaleFactor;
        self.sHeight = (self.xml) && Number(self.xml?.getAttribute('height')) * layout.scaleFactor;
        self.offsetX = (self.xml) && Number(self.xml?.getAttribute('left')) * layout.scaleFactor;
        self.offsetY = (self.xml) && Number(self.xml?.getAttribute('top')) * layout.scaleFactor;
        self.zIndex = (self.xml) && Number(self.xml?.getAttribute('zindex'));
        
        const regionOptions = self.xml?.getElementsByTagName('options');

        if (regionOptions) {
            for (let _options of Array.from(regionOptions)) {
                // Get options
                const _regionOptions = _options.children;
                for (let regionOption of Array.from(_regionOptions)) {
                    self.options[regionOption.nodeName.toLowerCase()] = regionOption.textContent;
                }
            }
        }

        const $layout = <HTMLDivElement | null>(document.querySelector(`#${self.layout.containerName}[data-sequence="${self.layout.index}"]`));

        let $region = null;
        if ($layout !== null) {
            $region = $layout.querySelector('#' + self.containerName) as HTMLDivElement;
        }

        if ($region === null) {
            $region = document.createElement('div');
            $region.id = self.containerName;
        }

        ($layout) && $layout.appendChild($region);

        /* Scale the Layout Container */
        /* Add region styles */
        $region.style.cssText = `
            width: ${self.sWidth}px;
            height: ${self.sHeight}px;
            position: absolute;
            left: ${self.offsetX}px;
            top: ${self.offsetY}px;
            z-index: ${Math.round(self.zIndex)};
        `;
        $region.className = 'region--item';

        // Set visibility when zIndex = 0 and
        // only when layout has background image
        if (String(self.layout.bgImage).length > 0 && self.zIndex <= 0) {
            $region.style.setProperty('visibility', 'hidden');
        }

        // Save region html
        self.html = $region;

        /* Parse region media objects */
        const regionMediaItems = Array.from(self.xml.getElementsByTagName('media'));
        self.totalMediaObjects = regionMediaItems.length;

        Array.from(regionMediaItems).forEach((mediaXml, indx) => {
            const mediaObj = new Media(
                self,
                mediaXml?.getAttribute('id') || '',
                mediaXml,
                options as OptionsType & IRegion["options"],
                xlr,
            );

            mediaObj.index = indx;
            self.mediaObjects.push(mediaObj);
        });

        // Add media to region for targeted actions
        self.layout.actionController?.actions.forEach((action) => {
            const attributes = getAllAttributes(action.xml);

            if (attributes.target.value === 'region' &&
                attributes.actionType.value === 'navWidget' &&
                attributes.targetId.value == self.id
            ) {
                const drawerMediaItems = Array.from(self.layout.drawer?.getElementsByTagName('media') || []);
                
                drawerMediaItems.forEach((drawerMedia) => {
                    if (drawerMedia.id === attributes.widgetId?.value) {
                        // Add drawer media to the region
                        self.mediaObjectsActions.push(new Media(
                            self,
                            drawerMedia?.getAttribute('id') || '',
                            drawerMedia as Element,
                            options as OptionsType & IRegion['options'],
                            xlr,
                        ));
                    }
                });
            }
        });

        console.debug('??? XLR.debug >> Region::prepareRegion', {
            mediaItems: self.mediaObjects,
            totalMediaItems: self.totalMediaObjects,
        });

        // Prepare first media
        if (self.mediaObjects.length > 0) {
            // Clean up region first
            if (self.html?.children.length > 0) {
                self.html.innerHTML = '';
            }

            self.prepareFirstMedia();
        }
    };

    const prepareVideoMedia = (media: IMedia) => {
        const mediaId = getMediaId(media);
        // Check if html is ready and is in the DOM
        if (media.html !== null) {

            // Clean up video.js instance
            const existingPlayer = videojs.getPlayer(mediaId);

            if (existingPlayer !== undefined) {
                existingPlayer.dispose();
                media.player = undefined;
            }

            const $region = document.getElementById(regionObject.containerName);
            const mediaInRegion = $region?.querySelector('.' + mediaId);

            if (!mediaInRegion) {
                media.html = createMediaElement(media);
            }

            // Append fresh copy of the media into the region
            regionObject.html.appendChild(media.html);

            // Initialize video.js
            media.player = videojs(getMediaId(media), {
                ...vjsDefaultOptions({
                    errorDisplay: xlr.config.platform !== ConsumerPlatform.CHROMEOS,
                    loop: media.loop,
                }),
            });
            (media.player.el() as HTMLElement).style.display = 'none';
        }
    };

    const prepareImageMedia = (media: IMedia) => {
        const mediaId = getMediaId(media);
        (media.html as HTMLElement).style
              .setProperty('background-image', `url(${media.url}`);

        // Check if media in region
        // Remove old copy before inserting fresh copy
        const mediaInRegion = regionObject.html.querySelector('.' + mediaId);

        if (mediaInRegion) {
            mediaInRegion.remove();
        }

        // Append media to its region
        regionObject.html.appendChild(media.html as HTMLElement);
    };

    const prepareAudio = (media: IMedia) => {
        const mediaId = getMediaId(media);
        if (media.url !== null) {
            (media.html as HTMLAudioElement).src = media.url;
        }

        // Check if media in region
        // Remove old copy before inserting fresh copy of the media
        const mediaInRegion = regionObject.html.querySelector('.' + mediaId);

        if (mediaInRegion) {
            mediaInRegion.remove();
        }

        // Append media to its region
        regionObject.html.appendChild(media.html as HTMLAudioElement);
    };

    const prepareHtml = (media: IMedia) => {
        // Set state as false ( for now )
        media.ready = false;

        if (media.html) {
            const mediaId = getMediaId(media);

            // Clean up old copy of the media
            // before inserting fresh copy
            const mediaInRegion = regionObject.html.querySelector('.' + mediaId);

            // Append iframe
            media.html.innerHTML = '';
            media.html.appendChild(media.iframe as Node);

            if (!mediaInRegion) {
                // Add fresh copy of the media into the region
                regionObject.html.appendChild(media.html as HTMLElement);
                media.ready = true;
            }
        }
    };

    regionObject.prepareFirstMedia = () => {
        regionObject.currentMediaIndex = 0;
        regionObject.oldMedia = undefined;
        regionObject.currMedia = regionObject.mediaObjects[regionObject.currentMediaIndex];
        const firstMedia = regionObject.currMedia;

        if (firstMedia) {
            if (firstMedia.mediaType === 'video') {
                prepareVideoMedia(firstMedia);
            } else if (firstMedia.mediaType === 'image' && firstMedia.url !== null) {
                prepareImageMedia(firstMedia);
            } else if (firstMedia.mediaType === 'audio') {
                prepareAudio(firstMedia);
            } else if ((firstMedia.render === 'html' || firstMedia.mediaType === 'webpage') &&
              firstMedia.iframe && firstMedia.checkIframeStatus
            ) {
                prepareHtml(firstMedia);
            }
        }
    };

    regionObject.prepareNextMedia = () => {
        const nextMediaIndex = (regionObject.currentMediaIndex + 1) % regionObject.totalMediaObjects;
        const nextMedia = regionObject.mediaObjects[nextMediaIndex];

        if (nextMedia.mediaType === 'video') {
            prepareVideoMedia(nextMedia);
        } else if (nextMedia.mediaType === 'image' && nextMedia.url !== null) {
            prepareImageMedia(nextMedia);
        } else if (nextMedia.mediaType === 'audio' && nextMedia.url !== null) {
            prepareAudio(nextMedia);
        } else if ((nextMedia.render === 'html' || nextMedia.mediaType === 'webpage') &&
          nextMedia.iframe && nextMedia.checkIframeStatus
        ) {
            prepareHtml(nextMedia);
        }
    };

    regionObject.finished = function() {
        const self = regionObject;
        console.debug('<> XLR.debug Region::finished called . . . ', {
            regionId: self.id,
        });

        // Mark as complete
        self.complete = true;
        self.layout.regions[regionObject.index] = self;
        self.layout.regionExpired();
    };

    regionObject.prepareMediaObjects = function() {
        const self = regionObject;
        let nextMediaIndex;

        if (self.mediaObjects.length > 0) {

            if (self.currentMediaIndex >= self.mediaObjects.length) {
                self.currentMediaIndex = 0;
            }

            self.currMedia = self.mediaObjects[self.currentMediaIndex];

            nextMediaIndex = (self.currentMediaIndex + 1) % self.totalMediaObjects;

            if (nextMediaIndex >= self.mediaObjects.length ||
                (
                    !Boolean(self.mediaObjects[nextMediaIndex]) &&
                    self.mediaObjects.length === 1
                )
            ) {
                nextMediaIndex = 0;
            }

            if (Boolean(self.mediaObjects[nextMediaIndex])) {
                self.nxtMedia = (self.currentMediaIndex === nextMediaIndex)
                  ? {...self.mediaObjects[nextMediaIndex]}
                  : self.mediaObjects[nextMediaIndex];
            }

            console.debug('<> XLR.debug prepareMediaObjects::oldMedia', {
                regionId: self.id,
                oldMedia: self.oldMedia?.containerName,
            });

        //     const $region = document.getElementById(`${self.containerName}`);
        //     // Append available media to region DOM
        //     if (self.currMedia) {
        //         console.debug('<> XLR.debug prepareMediaObjects::currMedia', {
        //             currentMedia: self.currMedia.containerName,
        //             regionId: self.id,
        //         });
        //
        //         if (self.currMedia.mediaType === 'video') {
        //             const currVidPlayer = videojs.getPlayer(self.currMedia.containerName);
        //             // Clean up first if media has player already
        //             if (currVidPlayer) {
        //                 currVidPlayer.dispose();
        //                 self.currMedia.player = undefined;
        //             }
        //         }
        //
        //         ($region) && $region.insertBefore(self.currMedia.html as Node, $region.lastElementChild);
        //
        //         if (self.currMedia.mediaType === 'video') {
        //             if (self.currMedia.player === undefined) {
        //                 self.currMedia.player = videojs(self.currMedia.html, {
        //                     controls: false,
        //                     preload: 'auto',
        //                     autoplay: false,
        //                     muted: true,
        //                     errorDisplay: xlr.config.platform !== ConsumerPlatform.CHROMEOS,
        //                     loop: self.currMedia.loop,
        //                 });
        //             }
        //         }
        //     }
        //
        //     if (self.totalMediaObjects > 1 && self.nxtMedia) {
        //         console.debug('<> XLR.debug prepareMediaObjects::nxtMedia', {
        //             nextMedia: self.nxtMedia.containerName,
        //             regionId: self.id,
        //         });
        //
        //         if (self.nxtMedia.mediaType === 'video') {
        //             const nxtVidPlayer = videojs.getPlayer(self.nxtMedia.containerName);
        //             // Clean up first if media has player already
        //             if (nxtVidPlayer) {
        //                 nxtVidPlayer.dispose();
        //                 self.nxtMedia.player = undefined;
        //             }
        //         }
        //
        //         ($region) && $region.insertBefore(self.nxtMedia.html as Node, $region.lastElementChild);
        //
        //         if (self.nxtMedia.mediaType === 'video') {
        //             if (self.nxtMedia.player === undefined) {
        //                 self.nxtMedia.player = videojs(self.nxtMedia.html, {
        //                     controls: false,
        //                     preload: 'auto',
        //                     autoplay: false,
        //                     muted: true,
        //                     errorDisplay: xlr.config.platform !== ConsumerPlatform.CHROMEOS,
        //                     loop: self.nxtMedia.loop,
        //                 });
        //             }
        //         }
        //     }
        }
    };

    regionObject.run = function() {
        console.debug('Called Region::run > ', regionObject.id);

        // Reset region states
        regionObject.reset();

        if (regionObject.currMedia) {
            regionObject.transitionNodes(regionObject.oldMedia, regionObject.currMedia);
        }
    };

    regionObject.transitionNodes = function(oldMedia: IMedia | undefined, newMedia: IMedia | undefined) {
        const self = regionObject;
        let transOutDuration = 1;
        let transOutDirection: compassPoints = 'E';

        if (newMedia) {
            if (oldMedia && Boolean(oldMedia.options['transoutduration'])) {
                transOutDuration = Number(oldMedia.options.transoutduration);
            }

            if (oldMedia && Boolean(oldMedia.options['transoutdirection'])) {
                transOutDirection = oldMedia.options.transoutdirection;
            }
    
            let defaultTransOutOptions: TransitionElementOptions = {duration: transOutDuration};
            let transOut = transitionElement('defaultOut', {duration: defaultTransOutOptions.duration});
    
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
            
            const hideOldMedia = new Promise((resolve) => {
                // Hide oldMedia
                if (oldMedia) {
                    const $oldMedia = document.getElementById(getMediaId(oldMedia));
                    if ($oldMedia) {
                        const removeOldMedia = () => {
                            $oldMedia.style.setProperty('display', 'none');
                            $oldMedia.remove();
                        };

                        let oldMediaAnimate: any;
                        if (Boolean(oldMedia.options['transout'])) {
                            oldMediaAnimate = $oldMedia.animate(transOut.keyframes, transOut.timing);
                        }

                        if (Boolean(oldMedia.options['transout']) && self.totalMediaObjects > 1) {
                            if (transOutName === 'flyOut') {
                                // Reset last item to original position and state
                                oldMediaAnimate ? oldMediaAnimate.finished
                                    .then(() => {
                                        resolve(true);
                                        oldMediaAnimate?.effect?.updateTiming({fill: 'none'});
                                        removeOldMedia();
                                    }) : undefined;
                            } else {
                                setTimeout(removeOldMedia, transOutDuration / 2);
                                resolve(true);
                            }
                        } else {
                            removeOldMedia();
                            // Resolve this right away
                            // As a result, the transition between two media object
                            // seems like a cross-over
                            resolve(true);

                        }
                    }
                }
            });
    
            if (oldMedia) {
                hideOldMedia.then((isDone) => {
                    if (isDone) {
                        newMedia.run();
                    }
                });
            } else {
                newMedia.run();
            }
        }
    };

    regionObject.playNextMedia = function() {
        const self = regionObject;

        console.debug('??? XLR.debug >> Start Region::playNextMedia:', {
            regionId: self.id,
            currentMediaIndex: self.currentMediaIndex,
            mediaItemsLn: self.mediaObjects.length,
            oldMedia: self.oldMedia?.containerName,
            currMedia: self.currMedia?.containerName,
        })

        /* The current media has finished running */
        if (self.ended) {
            return;
        }

        if (!self.layout.isOverlay && self.currentMediaIndex === self.mediaObjects.length - 1) {
            self.finished();

            if (self.layout.allEnded) {
                return;
            }
        }

        // When the region has completed and when currentMedia is html
        // Then, preserve the currentMedia state
        if (self.complete &&
            self.currMedia?.render === 'html'
        ) {
            return;
        }

        // When the region has completed and mediaObjects.length = 1
        // and curMedia.loop = false, then put the media on
        // its current state
        if (self.complete && self.mediaObjects.length === 1 &&
            self.currMedia?.render !== 'html' &&
            (self.currMedia?.mediaType === 'image' ||
            self.currMedia?.mediaType === 'video') &&
            !self.currMedia?.loop
        ) {
            return;
        }

        if (self.currMedia) {
            self.oldMedia = self.currMedia;
        } else {
            self.oldMedia = undefined;
        }

        self.currentMediaIndex = (self.currentMediaIndex + 1) % self.totalMediaObjects;
        self.currMedia = self.mediaObjects[self.currentMediaIndex];
        self.nxtMedia = self.mediaObjects[
            (self.currentMediaIndex + 1) % self.totalMediaObjects
        ];

        console.debug('??? XLR.debug >> End Region::playNextMedia > execute transitionNodes', {
            regionId: self.id,
            currentMediaIndex: self.currentMediaIndex,
            mediaItemsLn: self.mediaObjects.length,
            oldMedia: self.oldMedia?.containerName,
            currMedia: self.currMedia?.containerName,
            nxtMedia: self.nxtMedia?.containerName,
        })

        self.transitionNodes(self.oldMedia, self.currMedia);
    };
    
    regionObject.playPreviousMedia = function() {
        const self = regionObject;
        self.currentMediaIndex = self.currentMediaIndex - 1;

        if(self.currentMediaIndex < 0 || self.ended) {
            self.currentMediaIndex = 0;
            return;
        }

        // @TODO Update with new logic
        self.prepareMediaObjects();

        console.debug('region::playPreviousMedia', self);
        /* Do the transition */
        self.transitionNodes(self.oldMedia, self.currMedia);
    };

    regionObject.end = function() {
        const self = regionObject;
        self.ending = true;
        /* The Layout has finished running */
        /* Do any region exit transition then clean up */
        self.layout.regions[self.index] = self;

        console.debug('Calling Region::end ', self);
        self.exitTransition();
    };

    regionObject.exitTransition = function() {
        const self = regionObject;
        /* TODO: Actually implement region exit transitions */
        const $region = document.getElementById(`${self.containerName}`);

        if ($region) {
            $region.style.display = 'none';
        }

        console.debug('Called Region::exitTransition ', self.id);

        self.exitTransitionComplete();
    };

    regionObject.exitTransitionComplete = function() {
        const self = regionObject;
        console.debug('Called Region::exitTransitionComplete ', self.id);
        self.ended = true;
        self.layout.regions[self.index] = self;
        self.layout.regionEnded();
    };

    regionObject.reset = function() {
        regionObject.ended = false;
        regionObject.complete = false;
        regionObject.ending = false;
        console.debug('Resetting region states', regionObject);
    };

    regionObject.on = function<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]) {
        return emitter.on(event, callback);
    };

    regionObject.emitter = emitter;

    regionObject.prepareRegion();

    return regionObject;
}