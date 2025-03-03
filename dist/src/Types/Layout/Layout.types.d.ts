import { Emitter, Unsubscribe } from 'nanoevents';
import { IRegion } from '../Region';
import { ILayoutEvents } from '../../Modules/Layout';
import { IXlr } from '../XLR';
import InteractiveActions, { Action } from '../../Modules/ActionController';
export type InputLayoutType = {
    layoutId: number | null;
    path?: string;
};
export type OptionsType = {
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
};
export interface ILayout {
    id: number | null;
    layoutId: number | null;
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
    actionController: InteractiveActions | undefined;
    enableStat: boolean;
    xlr: IXlr;
    finishAllRegions(): Promise<void[]>;
    inLoop: boolean;
}
export declare const initialLayout: ILayout;
export type GetLayoutParamType = {
    xlr: IXlr;
    moveNext?: boolean;
};
export type GetLayoutType = {
    currentLayoutIndex: number;
    inputLayouts: InputLayoutType[];
    current: ILayout | undefined;
    next: ILayout | undefined;
};
