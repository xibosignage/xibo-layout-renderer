import { DefaultEvents, Emitter, Unsubscribe } from "nanoevents";
import { IRegion } from "./Region.types";
import { ILayoutEvents } from "../Modules/Layout/Layout";
import { IXlr } from "./XLR.types";
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
    inPreview: boolean;
    appHost?: string | null;
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
    allEnded: boolean;
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
