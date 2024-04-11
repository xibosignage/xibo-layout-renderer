import {IRegion} from "./Region.types.js";
import {platform} from "../Modules/Platform.js";
import {DefaultEvents, Emitter, Unsubscribe} from "nanoevents";
import {ILayoutEvents} from "../Modules/Layout/Layout.js";
import {IXlr} from "./XLR.types";
// import Region from "../Modules/Region";

export type InputLayoutType = {
    layoutId: string;
};

export type TargetContainerType = HTMLElement;

export type OptionsType = {
    xlfUrl: string;
    getResourceUrl: string;
    layoutBackgroundDownloadUrl: string;
    layoutPreviewUrl: string;
    libraryDownloadUrl: string;
    loaderUrl: string;
    idCounter: number;
};

export interface ILayout {
    id: string;
    layoutId: string;
    sw: number | null;
    sh: number | null;
    xw: number | null;
    xh: number | null;
    zIndex: number | null;
    scaleFactor: number;
    sWidth: number;
    sHeight: number;
    offsetX: number;
    offsetY: number;
    bgColor: string;
    bgImage: string;
    bgId: string;
    containerName: string;
    layoutNode: Document | null;
    regionMaxZIndex: number;
    ready: boolean;
    regionObjects: IRegion[];
    drawer: String[];
    allExpired: boolean;
    regions: IRegion[];
    actions: String[];
    options: OptionsType;
    done: boolean;
    prepareLayout(): void;
    parseXlf(): void;
    run(): void;
    emitter?: Emitter<DefaultEvents>;
    on<E extends keyof ILayoutEvents>(event: E, callback: ILayoutEvents[E]): Unsubscribe;
    regionExpired(): void;
    end(): void;
}

export const initialLayout: ILayout = {
    id: '',
    layoutId: '',
    sw: 0,
    sh: 0,
    xw: 0,
    xh: 0,
    zIndex: 0,
    scaleFactor: 1,
    sWidth: 0,
    sHeight: 0,
    offsetX: 0,
    offsetY: 0,
    bgColor: '',
    bgImage: '',
    bgId: '',
    containerName: '',
    layoutNode: null,
    regionMaxZIndex: 0,
    ready: false,
    regionObjects: [],
    drawer: [],
    allExpired: false,
    regions: [],
    actions: [],
    options: platform,
    done: false,
    prepareLayout() {
    },
    parseXlf() {
    },
    run() {
    },
    on<E extends keyof ILayoutEvents>(event: E, callback: ILayoutEvents[E]): Unsubscribe {
        return <Unsubscribe>{};
    },
    regionExpired() {
    },
    end() {
    }
};

export type GetLayoutParamType = {
    xlr: IXlr;
    moveNext?: boolean;
}

export type GetLayoutType = {
    currentLayoutIndex: number;
    inputLayouts: InputLayoutType[];
    current: ILayout | undefined;
    next: ILayout | undefined;
}
