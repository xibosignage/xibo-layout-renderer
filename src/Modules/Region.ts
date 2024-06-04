import { createNanoEvents } from "nanoevents";
import {ILayout, OptionsType} from "../Types/Layout.types";
import {initialRegion, IRegion, IRegionEvents} from "../Types/Region.types";
import {IMedia} from "../Types/Media.types";
import {getMediaId, nextId} from "./Generators";
import { platform } from "./Platform";
import Media from "./Media/Media";
import { TransitionElementOptions, TransitionNameType, flyTransitionKeyframes, transitionElement } from "./Transitions";

export default function Region(
    layout: ILayout,
    xml: Element,
    regionId: string,
    options: OptionsType,
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
        const self = regionObject;
        const {layout, options} = self;
        self.id = props.regionId;
        self.options = {...platform, ...props.options};
        self.containerName = `R-${self.id}-${nextId(self.options as OptionsType & IRegion["options"])}`;
        self.xml = props.xml;
        self.mediaObjects = [];

        self.sWidth = (self.xml) && Number(self.xml?.getAttribute('width')) * layout.scaleFactor;
        self.sHeight = (self.xml) && Number(self.xml?.getAttribute('height')) * layout.scaleFactor;
        self.offsetX = (self.xml) && Number(self.xml?.getAttribute('left')) * layout.scaleFactor;
        self.offsetY = (self.xml) && Number(self.xml?.getAttribute('top')) * layout.scaleFactor;
        self.zIndex = (self.xml) && Number(self.xml?.getAttribute('zindex')) * layout.scaleFactor;
        
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


        let $region = document.getElementById(self.containerName);
        const $layout = document.getElementById(`${self.layout.containerName}`);

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
        `;
        $region.className = 'region--item';

        /* Parse region media objects */
        const regionMediaItems = Array.from(self.xml.getElementsByTagName('media'));
        self.totalMediaObjects = regionMediaItems.length;

        Array.from(regionMediaItems).forEach((mediaXml, indx) => {
            const mediaObj = Media(
                self,
                mediaXml?.getAttribute('id') || '',
                mediaXml,
                options as OptionsType & IRegion["options"],
            );

            mediaObj.index = indx;
            self.mediaObjects.push(mediaObj);
        });

        self.prepareMediaObjects();
    };

    regionObject.finished = function() {
        const self = regionObject;
        console.log('Region::finished called . . . ', self.id);
        // Mark as complete
        self.complete = true;
        self.layout.regions[regionObject.index] = regionObject;
        self.layout.regionExpired();
    };

    regionObject.prepareMediaObjects = function() {
        const self = regionObject;
        let nextMediaIndex;

        if (self.mediaObjects.length > 0) {

            if (self.curMedia) {
                self.oldMedia = self.curMedia;
            } else {
                self.oldMedia = undefined;
            }

            if (self.currentMediaIndex >= self.mediaObjects.length) {
                self.currentMediaIndex = 0;
            }

            self.curMedia = self.mediaObjects[self.currentMediaIndex];

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

            const $region = document.getElementById(`${self.containerName}`);
            // Append available media to region DOM
            if (self.curMedia) {
                ($region) && $region.insertBefore(self.curMedia.html as Node, $region.lastElementChild);
            }

            if (self.nxtMedia) {
                ($region) && $region.insertBefore(self.nxtMedia.html as Node, $region.lastElementChild);
            }
        }
    };

    regionObject.run = function() {
        console.log('Called Region::run > ', regionObject.id);

        if (regionObject.curMedia) {
            regionObject.transitionNodes(regionObject.oldMedia, regionObject.curMedia);
        }
    };

    regionObject.transitionNodes = function(oldMedia: IMedia | undefined, newMedia: IMedia | undefined) {
        const self = regionObject;
        let transOutDuration = 1;

        if (newMedia) {
            if (oldMedia && Boolean(oldMedia.options['transoutduration'])) {
                transOutDuration = Number(oldMedia.options.transoutduration);
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
                        direction: 'NE',
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
                            $oldMedia.style.display = 'none';
                            $oldMedia.remove();
                        };

                        let oldMediaAnimate = null;
                        if (Boolean(oldMedia.options['transout'])) {
                            oldMediaAnimate = $oldMedia.animate(transOut.keyframes, transOut.timing);
                        }

                        // Reset last item to original position and state
                        // when region.completed = true
                        if (self.mediaObjects.length === 2 &&
                            self.currentMediaIndex === self.mediaObjects.length - 1 &&
                            oldMediaAnimate !== null &&
                            (transOutName && transOutName === 'flyOut')
                        ) {
                            oldMediaAnimate.onfinish = (ev) => {
                                const resetTransOptions = {
                                    keyframes: flyTransitionKeyframes({
                                        trans: 'out',
                                        direction: 'RESET',
                                        height: 0,
                                        width: 0,
                                    }),
                                    duration: transOutDuration,
                                };
                                const resetTrans = transitionElement(transOutName, resetTransOptions);
                                $oldMedia.animate(resetTrans.keyframes, resetTrans.timing);
                            };
                        }

                        // Resolve this right away
                        // As a result, the transition between two media object
                        // seems like a cross-over
                        resolve(true);

                        if (Boolean(oldMedia.options['transout'])) {
                            setTimeout(removeOldMedia, transOutDuration);
                        } else {
                            removeOldMedia();
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

        /* The current media has finished running */
        if (self.ended) {
            return;
        }

        if (self.currentMediaIndex === self.mediaObjects.length - 1) {
            self.finished();

            if (self.layout.allEnded) {
                return;
            }
        }

        // When the region is has completed and when currentMedia is html
        // Then, preserve the currentMedia state
        if (self.complete &&
            self.curMedia?.render === 'html'
        ) {
            return;
        }

        self.currentMediaIndex = self.currentMediaIndex + 1;
        self.prepareMediaObjects();

        self.transitionNodes(self.oldMedia, self.curMedia);
    };
    
    regionObject.end = function() {
        const self = regionObject;
        self.ending = true;
        /* The Layout has finished running */
        /* Do any region exit transition then clean up */
        self.layout.regions[self.index] = self;

        console.log('Calling Region::end ', self);
        self.exitTransition();
    };

    regionObject.exitTransition = function() {
        const self = regionObject;
        /* TODO: Actually implement region exit transitions */
        const $region = document.getElementById(`${self.containerName}`);

        if ($region) {
            $region.style.display = 'none';
        }

        console.log('Called Region::exitTransition ', self.id);

        self.exitTransitionComplete();
    };

    regionObject.exitTransitionComplete = function() {
        const self = regionObject;
        console.log('Called Region::exitTransitionComplete ', self.id);
        self.ended = true;
        self.layout.regions[self.index] = self;
        self.layout.regionEnded();
    };

    regionObject.on = function<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]) {
        return emitter.on(event, callback);
    };

    regionObject.emitter = emitter;

    regionObject.prepareRegion();

    return regionObject;
}