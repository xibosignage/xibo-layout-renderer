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

import { OptionsType } from '../../Types/Layout';
import { IRegion, IRegionEvents } from '../../Types/Region';
import { nextId } from '../Generators';
import { platform } from '../Platform';
import {Media, VideoMedia} from '../Media';
import {
    TransitionElementOptions,
    TransitionNameType,
    compassPoints,
    flyTransitionKeyframes,
    transitionElement,
} from '../Transitions';
import {IXlr} from '../../Types/XLR';
import {createMediaElement, getAllAttributes} from '../Generators/Generators';
import Layout from "../Layout";
import {MediaItem} from "../../Types/Media";

export class Region {
    activeMediaIndex = 0;
    complete: boolean = false;
    containerName: string = '';
    ended: boolean = false;
    ending: boolean = false;
    html?: HTMLElement;
    id: string | null = null;
    index = 0;
    mediaItems: MediaItem[] = [];
    mediaItemsActions: MediaItem[] = [];
    offsetX = 0;
    offsetY = 0;
    oldMedia?: MediaItem;
    oneMedia = false;
    ready = false;
    sHeight = 0;
    sWidth = 0;
    totalMediaItems = 0;
    uniqueId: string = '';
    zIndex = 0;

    options: Record<string, any> = {};
    emitter: Emitter<IRegionEvents> = createNanoEvents<IRegionEvents>();

    activeMedia?: MediaItem;
    nextMedia?: MediaItem;

    activeMediaEl?: HTMLElement;
    nextMediaEl?: HTMLElement;

    readonly layout: Layout | null = null;
    readonly regionId: string = '';
    private readonly xml: Element = <Element>{};
    private readonly xlr: IXlr = <IXlr>{};

    constructor(
        layout: Layout,
        xml: Element,
        regionId: string,
        options: OptionsType,
        xlr: IXlr
    ) {
        this.layout = layout;
        this.xml = xml;
        this.regionId = regionId;
        this.options = {...platform, ...options};
        this.xlr = xlr;

        this.prepareRegion();
    }

    on<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]) {
        return this.emitter.on(event, callback);
    }

    prepareRegion() {
        this.complete = false;
        this.ended = false;
        this.ending = false;
        this.activeMedia = undefined;
        this.activeMediaEl = undefined;
        this.nextMedia = undefined;
        this.nextMediaEl = undefined;
        this.oldMedia = undefined;
        this.activeMediaIndex = 0;
        this.id = this.regionId;
        this.uniqueId = `${nextId(this.options as OptionsType & IRegion["options"])}`;
        this.containerName = `R-${this.id}-${this.uniqueId}`;
        this.mediaItems = [];
        this.mediaItemsActions = [];

        let regionOptions;
        if (this.layout !== null && this.xml) {
            this.sWidth = parseInt(this.xml.getAttribute('width') ?? '0') * this.layout.scaleFactor;
            this.sHeight = parseInt(this.xml.getAttribute('height') ?? '0') * this.layout.scaleFactor;
            this.offsetX = parseInt(this.xml.getAttribute('left') ?? '0') * this.layout.scaleFactor;
            this.offsetY = parseInt(this.xml.getAttribute('top') ?? '0') * this.layout.scaleFactor;
            this.zIndex = parseInt(this.xml.getAttribute('zindex') ?? '0');

            regionOptions = this.xml.getElementsByTagName('options');
        }

        if (regionOptions && this.options) {
            for (let _options of Array.from(regionOptions)) {
                // Get options
                const _regionOptions = _options.children;
                for (let regionOption of Array.from(_regionOptions)) {
                    this.options[regionOption.nodeName.toLowerCase()] = regionOption.textContent;
                }
            }
        }

        let $layout = null;
        if (this.layout) {
            $layout = <HTMLDivElement | null>(document.querySelector(`#${this.layout.containerName}[data-sequence="${this.layout.index}"]`));
        }

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
        if (this.layout &&
            String(this.layout.bgImage).length > 0 &&
            this.zIndex <= 0
        ) {
            $region.style.setProperty('visibility', 'hidden');
        }

        // Save region html
        this.html = $region;

        /* Parse region media objects */
        const regionMediaItems = Array.from(this.xml.getElementsByTagName('media'));
        this.totalMediaItems = regionMediaItems.length;

        Array.from(regionMediaItems).forEach(async (mediaXml, indx) => {
            // Get the mediaType to switch between classes
            const mediaType = mediaXml?.getAttribute('type') || null;
            const mediaObjParams: [Region, string, Element, OptionsType, IXlr] = [
                this,
                mediaXml?.getAttribute('id') || '',
                mediaXml,
                this.options as OptionsType & IRegion["options"],
                this.xlr,
            ];

            let mediaObj: Media | VideoMedia = new Media(...mediaObjParams);

            if (mediaType !== null && mediaType === 'video') {
                mediaObj = new VideoMedia(...mediaObjParams);
            }

            if (mediaObj !== null) {
                mediaObj.index = indx;
                this.mediaItems.push(mediaObj);
            }
        });

        // Add media to region for targeted actions
        this.layout?.actionController?.actions.forEach((action) => {
            const attributes = getAllAttributes(action.xml);

            if (attributes.target.value === 'region' &&
                attributes.actionType.value === 'navWidget' &&
                attributes.targetId.value == this.id
            ) {
                const drawerMediaItems = Array.from(this.layout?.drawer?.getElementsByTagName('media') || []);

                drawerMediaItems.forEach((drawerMedia) => {
                    if (drawerMedia.id === attributes.widgetId?.value) {
                        // Add drawer media to the region
                        this.mediaItemsActions.push(new Media(
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
    }

    finished()  {
        console.debug('<> XLR.debug Region::finished called . . . ', {
            regionId: this.id,
        });

        // Mark as complete
        this.complete = true;

        if (this.layout) {
            this.layout.regions[this.index] = this;
        }
        this.layout?.regionExpired();
    };

    get nextMediaIndex() {
        return (this.activeMediaIndex + 1) % this.mediaItems.length;
    }

    prepareMediaObjects()  {
        let nextMediaIndex;

        if (this.mediaItems.length > 0) {

            if (this.activeMediaIndex >= this.mediaItems.length) {
                this.activeMediaIndex = 0;
            }

            this.activeMedia = this.mediaItems[this.activeMediaIndex];

            nextMediaIndex = this.nextMediaIndex;

            if (Boolean(this.mediaItems[nextMediaIndex])) {
                if (nextMediaIndex === this.activeMediaIndex) {
                    this.nextMedia = this.activeMedia;
                    this.nextMedia.html = null;
                    this.nextMediaEl = undefined;
                } else {
                    this.nextMedia = this.mediaItems[nextMediaIndex];
                    this.nextMedia.html = null;
                    this.nextMediaEl = undefined;
                }
            }

            console.debug('<IAK> XLR.debug prepareMediaObjects::oldMedia', {
                regionId: this.id,
                oldMedia: this.oldMedia?.containerName,
            });

            const $region = document.getElementById(`${this.containerName}`);

            // Append available media to region DOM
            if (this.activeMedia) {
                this.activeMediaEl = createMediaElement(this.activeMedia);
                this.activeMedia.html = this.activeMediaEl;

                console.debug('<IAK> XLR.debug prepareMediaObjects::currMedia', {
                    currentMedia: this.activeMedia.containerName,
                    regionId: this.id,
                });

                ($region) && $region.appendChild(this.activeMedia.html);
            }

            console.debug('<IAK> Region::prepareMediaObjects >> ', {
                totalMediaItems: this.totalMediaItems,
                nextMedia: this.nextMedia,
                nextMediaIndex,
            })
            if (this.nextMedia && this.totalMediaItems > 1) {
                this.nextMediaEl = createMediaElement(this.nextMedia);
                this.nextMedia.html = this.nextMediaEl;

                console.debug('<IAK> XLR.debug prepareMediaObjects::nxtMedia', {
                    nextMedia: this.nextMedia.containerName,
                    regionId: this.id,
                });
                ($region) && $region.appendChild(this.nextMedia.html);

                if (this.nextMedia.mediaType === 'video') {
                    ((this.nextMedia as unknown) as VideoMedia).prepare((this.nextMedia as unknown) as VideoMedia);
                }
            }
        }
    };

    run()  {
        console.debug('Called Region::run > ', this.id);

        // Reset region states
        this.reset();

        if (this.activeMedia) {
            this.transitionNodes(this.oldMedia, this.activeMedia);
        }
    };

    transitionNodes(oldMedia: MediaItem | undefined, newMedia: MediaItem | undefined) {

        console.debug('<IAK> Region::transitionNodes', {
            oldMedia,
            newMedia,
        })
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
                    const $oldMedia = document.getElementById(oldMedia.containerName);
                    console.debug('<IAK> Region::transitionNodes >> $oldMedia', {
                        $oldMedia,
                        oldMediaHtml: oldMedia.html,
                    })
                    if ($oldMedia) {
                        const removeOldMedia = () => {
                            console.debug('<IAK> Region::transitionNodes >> removeOldMedia()');
                            if (oldMedia.mediaType === 'video') {
                            } else {
                                $oldMedia.style.setProperty('display', 'none');
                                $oldMedia.remove();
                            }
                        };

                        let oldMediaAnimate: any;
                        if (Boolean(oldMedia.options['transout'])) {
                            oldMediaAnimate = $oldMedia.animate(transOut.keyframes, transOut.timing);
                        }

                        if (Boolean(oldMedia.options['transout']) && this.totalMediaItems > 1) {
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
                hideOldMedia.then(async (isDone) => {
                    console.debug('<IAK> Region::transitionNodes >> hideOldMedia::isDone: ', isDone);
                    if (isDone) {
                        if (newMedia.mediaType === 'video') {
                            console.debug('<IAK> Region::transitionNodes >> hideOldMedia::isVideo');
                            await (newMedia as VideoMedia).play(newMedia as VideoMedia);
                        } else {
                            console.debug('<IAK> Region::transitionNodes >> hideOldMedia::otherMedia: ', newMedia.mediaType);
                            newMedia.run();
                        }
                    }
                });
            } else {
                if (newMedia.mediaType === 'video') {
                    (async () => {
                        await (newMedia as VideoMedia).play(newMedia as VideoMedia);
                    })();
                } else {
                    newMedia.run();
                }
            }
        }
    };

    playNextMedia(caller: string = '')  {
        console.debug('<IAK> XLR.debug Region playing next media', {
            regionId: this.id,
            currentMediaIndex: this.activeMediaIndex,
            mediaItemsLn: this.mediaItems.length,
            oldMedia: this.oldMedia?.containerName,
            currMedia: this.activeMedia?.containerName,
            nxtMedia: this.nextMedia?.containerName,
        })

        /* The current media has finished running */
        if (this.ended) {
            return;
        }

        if (!this.layout?.isOverlay && this.activeMediaIndex === this.mediaItems.length - 1) {
            this.finished();

            if (this.layout?.allEnded) {
                return;
            }
        }

        // When the region has completed and when currentMedia is html
        // Then, preserve the currentMedia state
        if (this.complete &&
            this.activeMedia?.render === 'html'
        ) {
            return;
        }

        // When the region has completed and mediaObjects.length = 1
        // and curMedia.loop = false, then put the media on
        // its current state
        if (this.complete && this.mediaItems.length === 1 &&
            this.activeMedia?.render !== 'html' &&
            (this.activeMedia?.mediaType === 'image' ||
                this.activeMedia?.mediaType === 'video') &&
            !this.activeMedia?.loop
        ) {
            return;
        }

        if (this.activeMedia) {
            this.oldMedia = this.activeMedia;
        } else {
            this.oldMedia = undefined;
        }

        this.activeMediaIndex = (this.activeMediaIndex + 1) % this.totalMediaItems;
        this.prepareMediaObjects();

        console.debug(`${caller} region::playNextMedia`, this);
        this.transitionNodes(this.oldMedia, this.activeMedia);
    };

    playPreviousMedia()  {

        this.activeMediaIndex = this.activeMediaIndex - 1;

        if(this.activeMediaIndex < 0 || this.ended) {
            this.activeMediaIndex = 0;
            return;
        }

        this.prepareMediaObjects();

        console.debug('region::playPreviousMedia', self);
        /* Do the transition */
        this.transitionNodes(this.oldMedia, this.activeMedia);
    };

    end()  {
        this.ending = true;
        /* The Layout has finished running */
        /* Do any region exit transition then clean up */
        if (this.layout) {
            this.layout.regions[this.index] = this;
        }

        console.debug('Calling Region::end ', this);
        this.exitTransition();
    };

    exitTransition()  {

        /* TODO: Actually implement region exit transitions */
        const $region = document.getElementById(`${this.containerName}`);

        if ($region) {
            $region.style.display = 'none';
        }

        console.debug('Called Region::exitTransition ', this.id);

        this.exitTransitionComplete();
    };

    exitTransitionComplete()  {
        console.debug('Called Region::exitTransitionComplete ', this.id);
        this.ended = true;

        if (this.layout) {
            this.layout.regions[this.index] = this;
        }
        this.layout?.regionEnded();
    };

    reset()  {
        this.ended = false;
        this.complete = false;
        this.ending = false;
        console.debug('Resetting region states', this);
    };

    removeSinglePlayItem(media: MediaItem) {
        console.debug('<IAK> Region::removeSinglePlayItem >> isSinglePlay: ', media.singlePlay);
        console.debug('<IAK> Region::removeSinglePlayItem >> available media items', {
            mediaItems: this.mediaItems,
        })

        // Add check if media is just a singleplay = true
        // Due to interactivity, then remove it from the list
        const activeMediaFromIndex = this.mediaItems[this.activeMediaIndex];

        if (activeMediaFromIndex.id === media.id) {
            this.mediaItems.splice(this.activeMediaIndex, 1);
            this.totalMediaItems = this.mediaItems.length;
        }

        console.debug('<IAK> Region::removeSinglePlayItem >> updated media items', {
            mediaItems: this.mediaItems,
        })
    }
}