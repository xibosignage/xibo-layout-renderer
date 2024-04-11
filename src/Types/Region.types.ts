import {ILayout, initialLayout, OptionsType} from "./Layout.types.js";
import {platform} from "../Modules/Platform.js";
import {IMedia} from "./Media.types.js";

export interface IRegion {
    layout: ILayout;
    id: string;
    xml: null | Element;
    mediaObjects: IMedia[];
    mediaObjectsActions: String[];
    currentMedia: number;
    complete: boolean;
    containerName: string;
    ending: boolean;
    ended: boolean;
    oneMedia: boolean;
    oldMedia: IMedia | undefined;
    curMedia: IMedia | undefined;
    totalMediaObjects: number;
    ready: boolean;
    options: OptionsType;
    sWidth: number;
    sHeight: number;
    offsetX: number;
    offsetY: number;
    zIndex: number;
    prepareRegion(): void;
    nextMedia(): void;
    transitionNodes(oldMedia: IMedia | undefined, newMedia: IMedia | undefined): void;
    finished(): void;
    run(): void;
    end(): void;
}

export const initialRegion: IRegion = {
    layout: initialLayout,
    id: '',
    xml: null,
    mediaObjects: [],
    mediaObjectsActions: [],
    currentMedia: -1,
    complete: false,
    containerName: '',
    ending: false,
    ended: false,
    oneMedia: false,
    oldMedia: undefined,
    curMedia: undefined,
    totalMediaObjects: 0,
    ready: false,
    options: platform,
    sWidth: 0,
    sHeight: 0,
    offsetX: 0,
    offsetY: 0,
    zIndex: 0,
    prepareRegion() {
    },
    nextMedia() {
    },
    transitionNodes() {
    },
    finished() {
    },
    run() {
    },
    end() {
    }
};
