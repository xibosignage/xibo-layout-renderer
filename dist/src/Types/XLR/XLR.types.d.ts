import { ILayout, InputLayoutType, OptionsType } from '../Layout';
import { Emitter, Unsubscribe } from 'nanoevents';
export type PrepareLayoutsType = {
    moveNext?: boolean;
};
export declare enum ELayoutType {
    CURRENT = 0,
    NEXT = 1
}
export type IXlrEvents = {
    layoutChange: (layoutId: number) => void;
    layoutStart: (layoutId: number, layoutIndex?: number) => void;
    layoutEnd: (layoutId: number, layoutIndex?: number) => void;
    layoutError: (layoutId: number) => void;
    widgetStart: (widgetId: number) => void;
    widgetEnd: (widgetId: number) => void;
    widgetError: (widgetId: number) => void;
};
export interface IXlrPlayback {
    currentLayout: ILayout | undefined;
    nextLayout: ILayout | undefined;
    currentLayoutIndex: number;
    nextLayoutIndex: number;
    isCurrentLayoutValid: boolean;
    hasDefaultOnly: boolean;
}
export interface IXlr {
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
    getLayoutById(layoutId: number, layoutIndex?: number): ILayout | undefined;
    on<E extends keyof IXlrEvents>(event: E, callback: IXlrEvents[E]): Unsubscribe;
}
export declare const initialXlr: IXlr;
