import { Emitter, DefaultEvents, Unsubscribe } from 'nanoevents';

declare enum ELayoutType {
    CURRENT = 0,
    NEXT = 1
}
interface IXlr {
    inputLayouts: InputLayoutType[];
    config: OptionsType;
    layouts: ILayout[];
    currentLayoutIndex: number;
    currentLayoutId: string | undefined;
    currentLayout: ILayout | undefined;
    nextLayout: ILayout | undefined;
    bootstrap(): void;
    init(): Promise<IXlr>;
    playSchedules(xlr: IXlr): void;
    prepareLayoutXlf(inputLayout: ILayout | undefined, type: ELayoutType): Promise<ILayout>;
    prepareLayouts(): Promise<IXlr>;
}

interface IMediaEvents {
    start: (media: IMedia) => void;
    end: (media: IMedia) => void;
}

interface IMedia {
    region: IRegion;
    xml: null | Element;
    id: string;
    idCounter: number;
    index: number;
    containerName: string;
    html: null | HTMLElement;
    iframe: null | HTMLIFrameElement;
    iframeName: string;
    mediaType: string;
    render: string;
    attachedAudio: boolean;
    singlePlay: boolean;
    timeoutId: ReturnType<typeof setTimeout>;
    ready: boolean;
    checkIframeStatus: boolean;
    loadIframeOnRun: boolean;
    tempSrc: string;
    finished: boolean;
    schemaVersion: string;
    type: string;
    duration: number;
    useDuration: boolean;
    fileId: string;
    options: {
        [k: string]: any;
    };
    divWidth: number;
    divHeight: number;
    url: string | null;
    loop: boolean;
    emitter?: Emitter<DefaultEvents>;
    run(): void;
    init(): void;
    stop(): Promise<void>;
    on<E extends keyof IMediaEvents>(event: E, callback: IMediaEvents[E]): Unsubscribe;
}

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
}

interface ILayoutEvents {
    start: (layout: ILayout) => void;
    end: (layout: ILayout) => void;
}

type InputLayoutType = {
    layoutId: string;
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
    allEnded: boolean;
    path?: string;
    prepareLayout(): void;
    parseXlf(): void;
    run(): void;
    emitter?: Emitter<DefaultEvents>;
    on<E extends keyof ILayoutEvents>(event: E, callback: ILayoutEvents[E]): Unsubscribe;
    regionExpired(): void;
    end(): void;
    regionEnded(): void;
    stopAllMedia(): Promise<void>;
}

declare function XiboLayoutRenderer(inputLayouts: InputLayoutType[], options?: OptionsType): IXlr;

export { XiboLayoutRenderer as default };
