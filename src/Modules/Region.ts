import { createNanoEvents } from "nanoevents";
import {ILayout, OptionsType} from "../Types/Layout.types";
import {initialRegion, IRegion, IRegionEvents} from "../Types/Region.types";
import {IMedia} from "../Types/Media.types";
import {nextId} from "./Generators";
import Media from "./Media";

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
        self.containerName = `R-${self.id}-${nextId(options)}`;
        self.xml = props.xml;
        self.mediaObjects = [];

        self.sWidth = (self.xml) && Number(self.xml?.getAttribute('width')) * layout.scaleFactor;
        self.sHeight = (self.xml) && Number(self.xml?.getAttribute('height')) * layout.scaleFactor;
        self.offsetX = (self.xml) && Number(self.xml?.getAttribute('left')) * layout.scaleFactor;
        self.offsetY = (self.xml) && Number(self.xml?.getAttribute('top')) * layout.scaleFactor;
        self.zIndex = (self.xml) && Number(self.xml?.getAttribute('zindex')) * layout.scaleFactor;

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

        Array.from(regionMediaItems).forEach((mediaXml, indx) => {
            const mediaObj = Media(
                self,
                mediaXml?.getAttribute('id') || '',
                mediaXml,
                options,
            );

            mediaObj.index = indx;
            self.mediaObjects.push(mediaObj);
        });

        // Check if mediaObjects.length === 1
        // If yes, then clone it to have next media item available
        if (self.mediaObjects.length === 1) {
            const tempMedia = { ...self.mediaObjects[0] };

            tempMedia.index = tempMedia.index + 1;
            self.mediaObjects.push(tempMedia);
        }

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
                ($region) && $region.appendChild(self.curMedia.html as Node);
            }

            if (self.nxtMedia) {
                ($region) && $region.appendChild(self.nxtMedia.html as Node);
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
        if (newMedia) {
            newMedia.run();
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