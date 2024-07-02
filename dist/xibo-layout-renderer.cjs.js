import { Emitter, DefaultEvents, Unsubscribe } from 'nanoevents';

interface IMediaEvents {
    start: (media: IMedia) => void;
    end: (media: IMedia) => void;
}
declare function Media(region: IRegion, mediaId: string, xml: Element, options: OptionsType): IMedia;

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
}
declare const initialRegion: IRegion;

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
declare const initialXlr: IXlr;

declare function initRenderingDOM(targetContainer: Element | null): void;
declare function getXlf(layoutOptions: OptionsType): Promise<string>;
declare function getLayout(params: GetLayoutParamType): GetLayoutType;
interface ILayoutEvents {
    start: (layout: ILayout) => void;
    end: (layout: ILayout) => void;
}
declare function Layout(data: Document | null, options: OptionsType, xlr: IXlr, layout?: ILayout): ILayout;

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
    platform?: 'CMS' | 'chromeOS';
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

declare const platform: {
    getResourceUrl: string;
    xlfUrl: string;
    layoutBackgroundDownloadUrl: string;
    layoutPreviewUrl: string;
    libraryDownloadUrl: string;
    loaderUrl: string;
    idCounter: number;
    inPreview: boolean;
    appHost: null;
};

declare function nextId(options: {
    idCounter: number;
}): number;
declare const getMediaId: ({ mediaType, containerName }: IMedia) => string;
declare const capitalizeStr: (inputStr: string) => string;
declare function preloadMediaBlob(src: string, type: 'video' | 'audio'): Promise<string>;
declare function fetchJSON(url: string): Promise<any>;
declare function getFileExt(filename: string): string;
declare function audioFileType(str: string): string | undefined;

declare const defaultTrans: (duration: number, trans: 'in' | 'out') => {
    keyframes: {
        display: string;
    }[];
    timing: KeyframeAnimationOptions;
};
declare const fadeInElem: (duration: number) => {
    keyframes: {
        opacity: number;
    }[];
    timing: KeyframeAnimationOptions;
};
declare const fadeOutElem: (duration: number) => {
    keyframes: ({
        opacity: number;
        zIndex?: undefined;
    } | {
        opacity: number;
        zIndex: number;
    })[];
    timing: KeyframeAnimationOptions;
};
type KeyframeOptionsType = {
    from: {
        [k: string]: any;
    };
    to: {
        [k: string]: any;
    };
};
declare const flyInElem: (duration: number, keyframeOptions: KeyframeOptionsType | undefined, direction?: string) => {
    keyframes: ({
        opacity: number;
        zIndex?: undefined;
    } | {
        opacity: number;
        zIndex: number;
    })[];
    timing: KeyframeAnimationOptions;
};
declare const flyOutElem: (duration: number, keyframeOptions: KeyframeOptionsType | undefined, direction?: string) => {
    keyframes: Keyframe[];
    timing: KeyframeAnimationOptions;
};
type TransitionNameType = 'fadeIn' | 'fadeOut' | 'flyIn' | 'flyOut' | 'defaultIn' | 'defaultOut';
type TransitionElementOptions = {
    duration: number;
    keyframes?: KeyframeOptionsType;
    direction?: string;
};
declare const transitionElement: (transition: TransitionNameType, options: TransitionElementOptions) => {
    keyframes: {
        display: string;
    }[];
    timing: KeyframeAnimationOptions;
} | {
    keyframes: {
        opacity: number;
    }[];
    timing: KeyframeAnimationOptions;
} | {
    keyframes: ({
        opacity: number;
        zIndex?: undefined;
    } | {
        opacity: number;
        zIndex: number;
    })[];
    timing: KeyframeAnimationOptions;
} | {
    keyframes: ({
        opacity: number;
        zIndex?: undefined;
    } | {
        opacity: number;
        zIndex: number;
    })[];
    timing: KeyframeAnimationOptions;
} | {
    keyframes: Keyframe[];
    timing: KeyframeAnimationOptions;
};
type compassPoints = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
type flyTransitionParams = {
    trans: 'in' | 'out';
    direction: compassPoints;
    height: string | number;
    width: string | number;
};
declare const flyTransitionKeyframes: (params: flyTransitionParams) => KeyframeOptionsType;

declare function Region(layout: ILayout, xml: Element, regionId: string, options: OptionsType): IRegion;

declare function VideoMedia(media: IMedia): {
    init(): void;
};

declare function AudioMedia(media: IMedia): {
    init(): void;
};

export { AudioMedia, ELayoutType, type GetLayoutParamType, type GetLayoutType, type ILayout, type ILayoutEvents, type IMedia, type IRegion, type IRegionEvents, type IXlr, type InputLayoutType, type KeyframeOptionsType, Layout, Media, type OptionsType, Region, type TransitionElementOptions, type TransitionNameType, VideoMedia, XiboLayoutRenderer, audioFileType, capitalizeStr, type compassPoints, defaultTrans, fadeInElem, fadeOutElem, fetchJSON, flyInElem, flyOutElem, flyTransitionKeyframes, type flyTransitionParams, getFileExt, getLayout, getMediaId, getXlf, initRenderingDOM, initialLayout, initialMedia, initialRegion, initialXlr, nextId, platform, preloadMediaBlob, transitionElement };
//# sourceMappingURL=xibo-layout-renderer.cjs.js.map
