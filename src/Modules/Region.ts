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
    const regionObject: IRegion = {
        ...initialRegion,
        ...props,
    };

    regionObject.prepareRegion = function() {
        const self = this;
        const {layout, options} = self;
        self.id = props.regionId;
        self.containerName = `R-${this.id}-${nextId(options)}`;
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
        console.log('Region::run called . . . ', this.id);
        // Mark as complete
        this.complete = true;
        this.layout.regionExpired();
        this.layout.emitter?.emit('end', this.layout);
    };

    regionObject.transitionNodes = function(oldMedia: IMedia | undefined, newMedia: IMedia | undefined) {
        console.log({oldMedia, newMedia});
        (newMedia) && newMedia.run()
    };

    regionObject.run = function() {
        console.log('Called Region::run > ', this.id);
        this.nextMedia();
    };

    regionObject.nextMedia = function() {
        const self = regionObject;
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
        }

        self.curMedia = self.mediaObjects[self.currentMedia];

        self.transitionNodes(self.oldMedia, self.curMedia);
    };

    regionObject.on = function<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]) {
        return emitter.on(event, callback);
    };

    regionObject.emitter = emitter;

    regionObject.prepareRegion();

    return regionObject;
}