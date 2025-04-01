import { Emitter, Unsubscribe, DefaultEvents } from 'nanoevents';
import Player from 'video.js/dist/types/player';

type PrepareLayoutsType = {
    moveNext?: boolean;
};
declare enum ELayoutType {
    CURRENT = 0,
    NEXT = 1
}
type IXlrEvents = {
    layoutChange: (layoutId: number) => void;
};
interface IXlrPlayback {
    currentLayout: ILayout | undefined;
    nextLayout: ILayout | undefined;
    currentLayoutIndex: number;
    nextLayoutIndex: number;
    isCurrentLayoutValid: boolean;
    hasDefaultOnly: boolean;
}
interface IXlr {
    inputLayouts: InputLayoutType[];
    config: OptionsType;
    layouts: {
        [key: string]: ILayout;
    };
    currentLayoutIndex: number;
    currentLayoutId: number;
    currentLayout: ILayout | undefined;
    nextLayout: ILayout | undefined;
    emitter: Emitter<IXlrEvents>;
    bootstrap(): void;
    init(): Promise<IXlr>;
    playSchedules(xlr: IXlr): void;
    prepareLayoutXlf(inputLayout: ILayout | undefined): Promise<ILayout>;
    prepareLayouts(playback: IXlrPlayback): Promise<IXlr>;
    updateLayouts(inputLayouts: InputLayoutType[]): void;
    updateLoop(inputLayouts: InputLayoutType[]): Promise<void>;
    gotoPrevLayout(): void;
    gotoNextLayout(): void;
    uniqueLayouts: {
        [layoutId: string]: InputLayoutType;
    };
    getLayout(inputLayout: InputLayoutType): ILayout | undefined;
    updateScheduleLayouts(scheduleLayouts: InputLayoutType[]): Promise<void>;
    parseLayouts(loopUpdate?: boolean): IXlrPlayback;
}
declare const initialXlr: IXlr;

interface IMediaEvents {
    start: (media: IMedia) => void;
    end: (media: IMedia) => void;
}
declare function Media(region: IRegion, mediaId: string, xml: Element, options: OptionsType, xlr: IXlr): IMedia;

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
    enableStat: boolean;
    muted?: boolean;
    player?: Player;
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
    uniqueId: string;
    xml: null | Element;
    mediaObjects: IMedia[];
    mediaObjectsActions: IMedia[];
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
    playPreviousMedia(): void;
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

declare function initRenderingDOM(targetContainer: Element | null): void;
declare function getXlf(layoutOptions: OptionsType): Promise<string>;
declare function getLayout(params: GetLayoutParamType): GetLayoutType;
interface ILayoutEvents {
    start: (layout: ILayout) => void;
    end: (layout: ILayout) => void;
}

declare class Action {
    readonly id: string;
    readonly xml: Element;
    constructor(id: string, xml: Element);
}
declare class ActionsWrapper extends HTMLDivElement {
    constructor();
}
type InactOptions = {
    [k: string]: any;
} & OptionsType['previewTranslations'];
declare class ActionController {
    readonly parent: ILayout;
    readonly actions: Action[];
    readonly options: InactOptions;
    readonly $container: HTMLElement | null;
    readonly $actionController: ActionsWrapper;
    readonly $actionListContainer: Element | null;
    $actionControllerTitle: HTMLElement | null;
    $actionsContainer: HTMLElement | null;
    translations: any;
    constructor(parent: ILayout, actions: Action[], options: InactOptions);
    init(): void;
    openLayoutInNewTab(layoutCode: string, options: InactOptions): void;
    openLayoutInPlayer(layoutCode: string, options: InactOptions): void;
    prevOrNextLayout(targetId: string, actionType: string): void;
    /** Change media in region (next/previous) */
    nextMediaInRegion(regionId: string, actionType: string): void;
    loadMediaInRegion(regionId: string, widgetId: string): void;
    /** Run action based on action data */
    runAction(actionData: {
        [k: string]: any;
    }, options: InactOptions): void;
    initTouchActions(): void;
}

type InputLayoutType = {
    response: any;
    layoutId: number;
    path?: string;
    index?: number;
    id?: number;
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
    previewTranslations?: {
        [k: string]: any;
    };
    icons?: {
        splashScreen: string;
        logo: string;
    };
};
interface ILayout {
    id: number | null;
    layoutId: number;
    scheduleId?: number;
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
    drawer: Element | null;
    allExpired: boolean;
    regions: IRegion[];
    actions: Action[];
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
    actionController: ActionController | undefined;
    enableStat: boolean;
    xlr: IXlr;
    finishAllRegions(): Promise<void[]>;
    inLoop: boolean;
    removeLayout(): void;
}
declare const initialLayout: ILayout;
type GetLayoutParamType = {
    xlr: IXlr;
    moveNext?: boolean;
};
type GetLayoutType = {
    currentLayoutIndex: number;
    nextLayoutIndex: number;
    inputLayouts: InputLayoutType[];
    current: ILayout | undefined;
    next: ILayout | undefined;
};

declare function XiboLayoutRenderer(inputLayouts: InputLayoutType[], options?: OptionsType): IXlr;

declare function nextId(options: {
    idCounter: number;
}): number;
declare const getMediaId: ({ mediaType, containerName }: IMedia) => string;
declare const capitalizeStr: (inputStr: string) => string;
declare function getDataBlob(src: string): Promise<unknown>;
type MediaTypes = 'video' | 'audio' | 'image';
declare function preloadMediaBlob(src: string, type: MediaTypes): Promise<string>;
declare function fetchJSON(url: string): Promise<any>;
declare function fetchText(url: string): Promise<string>;
declare function getFileExt(filename: string): string;
declare function audioFileType(str: string): string | undefined;
declare function videoFileType(str: string): string | undefined;
declare function composeResourceUrlByPlatform(options: OptionsType, params: any): string;
declare function composeResourceUrl(options: OptionsType, params: any): string;
declare function composeMediaUrl(params: any): string;
declare function composeBgUrlByPlatform(platform: OptionsType['platform'], params: any): string;
type LayoutIndexType = {
    [k: string]: InputLayoutType & {
        index: number;
    };
};
declare function getIndexByLayoutId(layoutsInput: InputLayoutType[], layoutId?: number | null): (InputLayoutType & {
    index: number;
}) | LayoutIndexType | {
    index: number;
};
declare function isEmpty(input: any): boolean;
/**
 * Create expiration day based on current date
 * @param numDays Number of days as expiry
 * @returns JSON string format of date
 */
declare function setExpiry(numDays: number): string;

declare function VideoMedia(media: IMedia, xlr: IXlr): {
    duration: number;
    init: () => void;
    stop: (disposeOnly?: boolean) => void;
};

declare function AudioMedia(media: IMedia): {
    init(): void;
};

declare const platform: OptionsType;

declare function Region(layout: ILayout, xml: Element, regionId: string, options: OptionsType, xlr: IXlr): IRegion;

interface ISplashScreen {
    init: () => void;
    show: () => void;
    hide: () => void;
}
interface PreviewSplashElement extends HTMLDivElement {
    hide: () => void;
    show: () => void;
}

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

export { Action, ActionsWrapper, AudioMedia, ELayoutType, type GetLayoutParamType, type GetLayoutType, type ILayout, type ILayoutEvents, type IMedia, type IRegion, type IRegionEvents, type ISplashScreen, type IXlr, type IXlrEvents, type InactOptions, type InputLayoutType, type KeyframeOptionsType, Media, type MediaTypes, type OptionsType, type PrepareLayoutsType, type PreviewSplashElement, Region, type TransitionElementOptions, type TransitionNameType, VideoMedia, audioFileType, capitalizeStr, type compassPoints, composeBgUrlByPlatform, composeMediaUrl, composeResourceUrl, composeResourceUrlByPlatform, XiboLayoutRenderer as default, defaultTrans, fadeInElem, fadeOutElem, fetchJSON, fetchText, flyInElem, flyOutElem, flyTransitionKeyframes, type flyTransitionParams, getDataBlob, getFileExt, getIndexByLayoutId, getLayout, getMediaId, getXlf, initRenderingDOM, initialLayout, initialMedia, initialRegion, initialXlr, isEmpty, nextId, platform, preloadMediaBlob, setExpiry, transitionElement, videoFileType };
