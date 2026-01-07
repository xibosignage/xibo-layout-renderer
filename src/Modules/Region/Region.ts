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
import { getMediaId, nextId } from '../Generators';
import { Media } from '../Media';
import {
    TransitionElementOptions,
    TransitionNameType,
    compassPoints,
    flyTransitionKeyframes,
    transitionElement,
} from '../Transitions';
import {IXlr} from '../../Types/XLR';
import {createMediaElement, getAllAttributes} from '../Generators/Generators';

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
        self.options = props.options;
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

        self.prepareMediaObjects();
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

            nextMediaIndex = self.currentMediaIndex + 1;

            if (nextMediaIndex >= self.mediaObjects.length ||
                (
                    !Boolean(self.mediaObjects[nextMediaIndex]) &&
                    self.mediaObjects.length === 1
                )
            ) {
                nextMediaIndex = 0;
            }

            if (Boolean(self.mediaObjects[nextMediaIndex])) {
                self.nxtMedia = self.mediaObjects[nextMediaIndex];
            }

            console.debug('<> XLR.debug prepareMediaObjects::oldMedia', {
                regionId: self.id,
                oldMedia: self.oldMedia?.containerName,
            });

            const $region = document.getElementById(`${self.containerName}`);
            // Append available media to region DOM
            if (self.currMedia) {
                self.currEl = createMediaElement(self.currMedia, 'current');
                self.currMedia.html = self.currEl;

                console.debug('<> XLR.debug prepareMediaObjects::currMedia', {
                    currentMedia: self.currMedia.containerName,
                    regionId: self.id,
                });
                ($region) && $region.insertBefore(self.currEl as Node, $region.lastElementChild);
            }

            if (self.totalMediaObjects > 1 && self.nxtMedia) {
                self.nxtEl = createMediaElement(self.nxtMedia, 'next');
                self.nxtMedia.html = self.nxtEl;

                console.debug('<> XLR.debug prepareMediaObjects::nxtMedia', {
                    nextMedia: self.nxtMedia.containerName,
                    regionId: self.id,
                });
                ($region) && $region.insertBefore(self.nxtEl as Node, $region.lastElementChild);
            }
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

        console.debug('<> XLR.debug Region playing next media', {
            regionId: self.id,
            currentMediaIndex: self.currentMediaIndex,
            mediaItemsLn: self.mediaObjects.length,
            oldMedia: self.oldMedia?.containerName,
            currMedia: self.currMedia?.containerName,
            nxtMedia: self.nxtMedia?.containerName,
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

        self.currentMediaIndex = self.currentMediaIndex + 1;
        self.prepareMediaObjects();

        console.debug('region::playNextMedia', self);
        self.transitionNodes(self.oldMedia, self.currMedia);
    };
    
    regionObject.playPreviousMedia = function() {
        const self = regionObject;
        self.currentMediaIndex = self.currentMediaIndex - 1;

        if(self.currentMediaIndex < 0 || self.ended) {
            self.currentMediaIndex = 0;
            return;
        }

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