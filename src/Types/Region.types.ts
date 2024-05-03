import { DefaultEvents, Emitter, Unsubscribe } from "nanoevents";
import {ILayout, initialLayout, OptionsType} from "./Layout.types.js";
import {platform} from "../Modules/Platform.js";
import {IMedia} from "./Media.types.js";

export interface IRegionEvents {
    start: (layout: IRegion) => void;
    end: (layout: IRegion) => void;
}

export interface IRegion {
    layout: ILayout;
    id: string;
    regionId: string;
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
    nxtMedia: IMedia | undefined;
    currentMediaIndex: number;
    totalMediaObjects: number;
    ready: boolean;
    options: OptionsType;
    sWidth: number;
    sHeight: number;
    offsetX: number;
    offsetY: number;
    zIndex: number;
    index: number;
    emitter?: Emitter<DefaultEvents>;
    prepareRegion(): void;
    playNextMedia(): void;
    transitionNodes(oldMedia: IMedia | undefined, newMedia: IMedia | undefined): void;
    finished(): void;
    run(): void;
    end(): void;
    exitTransition(): void;
    exitTransitionComplete(): void;
    on<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]): Unsubscribe;
    prepareMediaObjects(): void;
}

export const initialRegion: IRegion = {
    layout: initialLayout,
    id: '',
    regionId: '',
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
    nxtMedia: undefined,
    currentMediaIndex: 0,
    totalMediaObjects: 0,
    ready: false,
    options: platform,
    sWidth: 0,
    sHeight: 0,
    offsetX: 0,
    offsetY: 0,
    zIndex: 0,
    index: -1,
    prepareRegion() {
    },
    playNextMedia() {
    },
    transitionNodes() {
    },
    finished() {
    },
    run() {
    },
    end() {
    },
    exitTransition() {},
    exitTransitionComplete() {},
    on<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]): Unsubscribe {
        return <Unsubscribe>{};
    },
    prepareMediaObjects() {
    },
};
