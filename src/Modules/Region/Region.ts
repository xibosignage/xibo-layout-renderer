/*
 * Copyright (C) 2024 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://www.xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */
import { createNanoEvents } from 'nanoevents';
import { ILayout, OptionsType } from '../../Types/Layout';
import { initialRegion, IRegion, IRegionEvents } from '../../Types/Region';
import { IMedia } from '../../Types/Media';
import { getMediaId, nextId } from '../Generators';
import { platform } from '../Platform';
import { Media } from '../Media';
import {
    TransitionElementOptions,
    TransitionNameType,
    compassPoints,
    flyTransitionKeyframes,
    transitionElement,
} from '../Transitions';
import {IXlr} from '../../Types/XLR';

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

    regionObject.prepareRegion = function() {
        const {layout, options} = this;
        this.id = props.regionId;
        this.options = {...platform, ...props.options};
        this.containerName = `R-${this.id}-${nextId(this.options as OptionsType & IRegion["options"])}`;
        this.xml = props.xml;
        this.mediaObjects = [];

        this.sWidth = (this.xml) && Number(this.xml?.getAttribute('width')) * layout.scaleFactor;
        this.sHeight = (this.xml) && Number(this.xml?.getAttribute('height')) * layout.scaleFactor;
        this.offsetX = (this.xml) && Number(this.xml?.getAttribute('left')) * layout.scaleFactor;
        this.offsetY = (this.xml) && Number(this.xml?.getAttribute('top')) * layout.scaleFactor;
        this.zIndex = (this.xml) && Number(this.xml?.getAttribute('zindex'));
        
        const regionOptions = this.xml?.getElementsByTagName('options');

        if (regionOptions) {
            for (let _options of Array.from(regionOptions)) {
                // Get options
                const _regionOptions = _options.children;
                for (let regionOption of Array.from(_regionOptions)) {
                    this.options[regionOption.nodeName.toLowerCase()] = regionOption.textContent;
                }
            }
        }


        let $region = document.getElementById(this.containerName);
        const $layout = document.getElementById(`${this.layout.containerName}`);

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

        /* Parse region media objects */
        const regionMediaItems = Array.from(this.xml.getElementsByTagName('media'));
        this.totalMediaObjects = regionMediaItems.length;

        Array.from(regionMediaItems).forEach((mediaXml, indx) => {
            const mediaObj = Media(
                this,
                mediaXml?.getAttribute('id') || '',
                mediaXml,
                options as OptionsType & IRegion["options"],
                xlr,
            );

            mediaObj.index = indx;
            this.mediaObjects.push(mediaObj);
        });

        this.prepareMediaObjects();
    };

    regionObject.finished = function() {
        const self = regionObject;
        console.debug('Region::finished called . . . ', self.id);
        // Mark as complete
        self.complete = true;
        self.layout.regions[regionObject.index] = regionObject;
        self.layout.regionExpired();
    };

    regionObject.prepareMediaObjects = function() {
        let nextMediaIndex;

        if (this.mediaObjects.length > 0) {

            if (this.curMedia) {
                this.oldMedia = this.curMedia;
            } else {
                this.oldMedia = undefined;
            }

            if (this.currentMediaIndex >= this.mediaObjects.length) {
                this.currentMediaIndex = 0;
            }

            this.curMedia = this.mediaObjects[this.currentMediaIndex];

            nextMediaIndex = this.currentMediaIndex + 1;

            if (nextMediaIndex >= this.mediaObjects.length ||
                (
                    !Boolean(this.mediaObjects[nextMediaIndex]) &&
                    this.mediaObjects.length === 1
                )
            ) {
                nextMediaIndex = 0;
            }

            if (Boolean(this.mediaObjects[nextMediaIndex])) {
                this.nxtMedia = this.mediaObjects[nextMediaIndex];
            }

            const $region = document.getElementById(`${this.containerName}`);
            // Append available media to region DOM
            if (this.curMedia) {
                ($region) && $region.insertBefore(this.curMedia.html as Node, $region.lastElementChild);
            }

            if (this.nxtMedia) {
                ($region) && $region.insertBefore(this.nxtMedia.html as Node, $region.lastElementChild);
            }
        }
    };

    regionObject.run = function() {
        console.debug('Called Region::run > ', regionObject.id);

        if (regionObject.curMedia) {
            regionObject.transitionNodes(regionObject.oldMedia, regionObject.curMedia);
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
        /* The current media has finished running */
        if (this.ended) {
            return;
        }

        if (this.currentMediaIndex === this.mediaObjects.length - 1) {
            this.finished();

            if (this.layout.allEnded) {
                return;
            }
        }

        // When the region has completed and when currentMedia is html
        // Then, preserve the currentMedia state
        if (this.complete &&
            this.curMedia?.render === 'html'
        ) {
            return;
        }

        // When the region has completed and mediaObjects.length = 1
        // and curMedia.loop = false, then put the media on
        // its current state
        if (this.complete && this.mediaObjects.length === 1 &&
            this.curMedia?.render !== 'html' &&
            this.curMedia?.mediaType === 'image' &&
            !this.curMedia?.loop
        ) {
            return;
        }

        this.currentMediaIndex = this.currentMediaIndex + 1;
        this.prepareMediaObjects();

        console.debug('region::playNextMedia', this);
        this.transitionNodes(this.oldMedia, this.curMedia);
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

    regionObject.reset = async function() {
        regionObject.ended = false;
        regionObject.ending = false;
        regionObject.complete = false;

        regionObject.layout.allEnded = false;
        regionObject.layout.allExpired = false;
    };

    regionObject.on = function<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]) {
        return emitter.on(event, callback);
    };

    regionObject.emitter = emitter;

    regionObject.prepareRegion();

    return regionObject;
}