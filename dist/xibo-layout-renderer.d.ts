import { Unsubscribe, Emitter, DefaultEvents } from 'nanoevents';

declare enum ELayoutType {
    CURRENT = 0,
    NEXT = 1
}
interface IXlr {
    inputLayouts: InputLayoutType[];
    config: OptionsType;
    layouts: ILayout[];
    currentLayoutIndex: number;
    currentLayoutId: number | null;
    currentLayout: ILayout | undefined;
    nextLayout: ILayout | undefined;
    bootstrap(): void;
    init(): Promise<IXlr>;
    playSchedules(xlr: IXlr): void;
    prepareLayoutXlf(inputLayout: ILayout | undefined): Promise<ILayout>;
    prepareLayouts(): Promise<IXlr>;
    updateLayouts(inputLayouts: InputLayoutType[]): void;
    updateLoop(inputLayouts: InputLayoutType[]): void;
}
declare const initialXlr: IXlr;

interface IMediaEvents {
    start: (media: IMedia) => void;
    end: (media: IMedia) => void;
}

interface IMedia {
    checkIframeStatus: boolean;
    run(): void;
    divHeight: number;
    type: string;
    timeoutId: ReturnType<typeof setTimeout>;
    divWidth: number;
    tempSrc: string;
    duration: number;
    iframeName: string;
    loadIframeOnRun: boolean;
    xml: Element | null;
    containerName: string;
    ready: boolean;
    loop: boolean;
    options: OptionsType & {
        [k: string]: any;
    };
    useDuration: boolean;
    html: HTMLElement | null;
    id: string;
    mediaId: string;
    iframe: HTMLIFrameElement | null;
    render: string;
    attachedAudio: boolean;
    on<E extends keyof IMediaEvents>(event: E, callback: IMediaEvents[E]): Unsubscribe;
    init(): void;
    schemaVersion: string;
    index: number;
    mediaType: string;
    finished: boolean;
    uri: string;
    url: string | null;
    singlePlay: boolean;
    stop(): Promise<void>;
    idCounter: number;
    region: IRegion;
    fileId: string;
    emitter: Emitter<IMediaEvents>;
}
declare const initialMedia: IMedia;

interface IRegionEvents {
    start: (layout: IRegion) => void;
    end: (layout: IRegion) => void;
}
interface IRegion {
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
    options: {
        [k: string]: any;
    };
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
    reset(): void;
}
declare const initialRegion: IRegion;

interface ILayoutEvents {
    start: (layout: ILayout) => void;
    end: (layout: ILayout) => void;
}

type InputLayoutType = {
    layoutId: number | null;
    path?: string;
};
type OptionsType = {
    xlfUrl: string;
    getResourceUrl: string;
    layoutBackgroundDownloadUrl: string;
    layoutPreviewUrl: string;
    libraryDownloadUrl: string;
    loaderUrl: string;
    idCounter: number;
    inPreview: boolean;
    appHost?: string | null;
    platform: 'CMS' | 'chromeOS';
    config?: {
        cmsUrl: string | null;
        schemaVersion: number;
        cmsKey: string | null;
        hardwareKey: string | null;
    };
};
interface ILayout {
    id: number | null;
    layoutId: number | null;
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
    allEnded: boolean;
    path?: string;
    prepareLayout(): void;
    parseXlf(): void;
    run(): void;
    emitter: Emitter<ILayoutEvents>;
    on<E extends keyof ILayoutEvents>(event: E, callback: ILayoutEvents[E]): Unsubscribe;
    regionExpired(): void;
    end(): void;
    regionEnded(): void;
    stopAllMedia(): Promise<void>;
    resetLayout(): Promise<void>;
    index: number;
}
declare const initialLayout: ILayout;
type GetLayoutParamType = {
    xlr: IXlr;
    moveNext?: boolean;
};
type GetLayoutType = {
    currentLayoutIndex: number;
    inputLayouts: InputLayoutType[];
    current: ILayout | undefined;
    next: ILayout | undefined;
};

declare function XiboLayoutRenderer(inputLayouts: InputLayoutType[], options?: OptionsType): IXlr;

export { ELayoutType, type GetLayoutParamType, type GetLayoutType, type ILayout, type IMedia, type IRegion, type IRegionEvents, type IXlr, type InputLayoutType, type OptionsType, XiboLayoutRenderer as default, initialLayout, initialMedia, initialRegion, initialXlr };
