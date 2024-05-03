import {ILayout, OptionsType} from "../Types/Layout.types.js";
import {initialRegion, IRegion, IRegionEvents} from "../Types/Region.types.js";
import {IMedia} from "../Types/Media.types.js";
import {nextId} from "./Generators.js";
import Media from "./Media.js";
import { createNanoEvents } from "nanoevents";

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
        const regionMedia = Array.from(self.xml.getElementsByTagName('media'));
        for (let mediaXml of regionMedia) {
            self.mediaObjects.push(Media(
                self,
                mediaXml?.getAttribute('id') || '',
                mediaXml,
                options,
            ));
        }
    };

    regionObject.finished = function() {
        const self = regionObject;
        console.log('Region::finished called . . . ', self.id);
        // Mark as complete
        self.complete = true;
        self.layout.regions[regionObject.index] = regionObject;
        self.layout.regionExpired();
    };

    regionObject.transitionNodes = function(oldMedia: IMedia | undefined, newMedia: IMedia | undefined) {
        console.log('Called Region::transitionNodes from region ID ', regionObject.id);
        console.log('transitionNodes > ', {oldMedia, newMedia});
        (newMedia) && newMedia.run()
    };

    regionObject.run = function() {
        console.log('Called Region::run > ', regionObject.id);
        regionObject.nextMedia();
    };

    regionObject.nextMedia = function() {
        const self = regionObject;

        /* The current media has finished running */
        if (self.ended) {
            return;
        }

        if (self.curMedia) {
            // playLog(8, "debug", "nextMedia -> Old: " + self.curMedia.id);
            self.oldMedia = self.curMedia;
        } else {
            self.oldMedia = undefined;
        }

        self.currentMedia = self.currentMedia + 1;

        if (self.currentMedia >= self.mediaObjects.length) {
            self.finished();
            self.currentMedia = 0;
            return;
        }

        self.curMedia = self.mediaObjects[self.currentMedia];

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