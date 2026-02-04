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
import { nanoid } from 'nanoid';

import { ILayout, OptionsType } from '../../Types/Layout';
import { IRegion } from '../../Types/Region';
import { IRegionEvents } from '../../Types/Events';
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
import { RegionMediaPipeline } from '../../Lib';

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
    currentMediaIndex: number = 0;
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
    pipeline: RegionMediaPipeline;

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

        // Initialize other properties from old props
        this.id = regionId;
        this.containerName = `R-${this.id}-${this.uniqueId}`;
        this.html = document.createElement('div');

        this.pipeline = new RegionMediaPipeline(this, {
            preloadBufferMs: this.options.gaplessPlayback?.preloadBufferMs ?? 2000,
            maxPreloadTimeMs: this.options.gaplessPlayback?.maxPreloadTimeMs ?? 5000,
            transitionDurationMs: this.options.gaplessPlayback?.transitionDurationMs ?? 500,
        });
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
        this.currentMediaIndex = 0;
        this.id = this.regionId;
        this.uniqueId = `${nextId(this.options as OptionsType & IRegion["options"])}`;
        this.options = this.options;
        this.containerName = `R-${this.id}-${this.uniqueId}`;
        this.xml = this.xml;
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

        Array.from(regionMediaItems).forEach((mediaXml, indx) => {
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

        this.prepareMediaObjects();
    };

    finished() {
        console.debug('<> XLR.debug Region::finished called . . . ', {
            regionId: this.id,
        });

        // Mark as complete
        this.complete = true;
        this.layout.regions[this.index] = this;
        this.layout.regionExpired();
    };

    prepareMediaObjects() {
        let nextMediaIndex;

        if (this.mediaObjects.length > 0) {

            if (this.currentMediaIndex >= this.mediaObjects.length) {
                this.currentMediaIndex = 0;
            }

            this.currMedia = this.mediaObjects[this.currentMediaIndex];

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

            console.debug('<> XLR.debug prepareMediaObjects::oldMedia', {
                regionId: this.id,
                oldMedia: this.oldMedia?.containerName,
            });

            const $region = document.getElementById(`${this.containerName}`);
            // Append available media to region DOM
            if (this.currMedia) {
                this.currEl = this.currMedia.html;
                (this.currEl) && (this.currEl.dataset.role = 'current');

                this.currMedia.html = this.currEl;

                console.debug('<> XLR.debug prepareMediaObjects::currMedia', {
                    currentMedia: this.currMedia.containerName,
                    regionId: this.id,
                });
                ($region) && $region.insertBefore(this.currEl as Node, $region.lastElementChild);
            }

            if (this.totalMediaObjects > 1 && this.nxtMedia) {
                this.nxtEl = this.nxtMedia.html;
                (this.nxtEl) && (this.nxtEl.dataset.role = 'next');

                this.nxtMedia.html = this.nxtEl;

                console.debug('<> XLR.debug prepareMediaObjects::nxtMedia', {
                    nextMedia: this.nxtMedia.containerName,
                    regionId: this.id,
                });
                ($region) && $region.insertBefore(this.nxtEl as Node, $region.lastElementChild);
            }

            // Set pipeline's current media
            if (this.currMedia) {
                this.pipeline.setCurrentMedia(this.currMedia);
            }
        }
    };

    run(): void {
        console.debug('Called Region::run > ', this.id);

        // Reset region states
        this.reset();

        if (this.currMedia) {
            this.transitionNodes(this.oldMedia, this.currMedia);
        }
    };

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

                        if (Boolean(oldMedia.options['transout']) && this.totalMediaObjects > 1) {
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

    playNextMedia() {
        console.debug('<> XLR.debug Region playing next media', {
            regionId: this.id,
            currentMediaIndex: this.currentMediaIndex,
            mediaItemsLn: this.mediaObjects.length,
            oldMedia: this.oldMedia?.containerName,
            currMedia: this.currMedia?.containerName,
            nxtMedia: this.nxtMedia?.containerName,
        })

        // Delegate to pipeline for proper transition
        try {
            /* The current media has finished running */
            if (this.ended) {
                return;
            }

            // Move to next media in cycle
            if (!this.layout.isOverlay && this.currentMediaIndex === this.mediaObjects.length - 1) {
                this.finished();

                if (this.layout.allEnded) {
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

            // Update index
            this.oldMedia = this.currMedia;
            this.currentMediaIndex++;
            this.prepareMediaObjects();

            // Let pipeline handle transition
            // (already preloaded from background preload)
            this.transitionNodes(this.oldMedia, this.currMedia);
        } catch (error) {
            console.error('Region::playNextMedia error:', error);
        }

        // if (this.currMedia) {
        //     this.oldMedia = this.currMedia;
        // } else {
        //     this.oldMedia = undefined;
        // }

        // this.currentMediaIndex = this.currentMediaIndex + 1;
        // this.prepareMediaObjects();

        // console.debug('region::playNextMedia', this);
        // this.transitionNodes(this.oldMedia, this.currMedia);
    };
    
    playPreviousMedia() {
        this.currentMediaIndex = this.currentMediaIndex - 1;

        if(this.currentMediaIndex < 0 || this.ended) {
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
            $region.style.display = 'none';
        }

        console.debug('Called Region::exitTransition ', this.id);

        this.exitTransitionComplete();
    };

    exitTransitionComplete() {
        console.debug('Called Region::exitTransitionComplete ', this.id);
        this.ended = true;
        this.layout.regions[this.index] = this;
        this.layout.regionEnded();
    };

    reset() {
        this.ended = false;
        this.complete = false;
        this.ending = false;
        console.debug('Resetting region states', this);
    };

    on<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]) {
        return this.emitter.on(event, callback);
    };

}
