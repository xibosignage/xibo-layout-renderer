import { ILayout, InputLayoutType, OptionsType } from '../Layout';
import { Emitter } from 'nanoevents';
export type PrepareLayoutsType = {
    moveNext?: boolean;
};
export declare enum ELayoutType {
    CURRENT = 0,
    NEXT = 1
}
export type IXlrEvents = {
    layoutChange: (layoutId: number) => void;
};
export interface IXlrPlayback {
    currentLayout: ILayout | undefined;
    nextLayout: ILayout | undefined;
    currentLayoutIndex: number;
    nextLayoutIndex: number;
    isCurrentLayoutValid: boolean;
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
    updateLoop(inputLayouts: InputLayoutType[]): void;
    gotoPrevLayout(): void;
    gotoNextLayout(): void;
    uniqueLayouts: {
        [layoutId: string]: InputLayoutType;
    };
    getLayout(inputLayout: InputLayoutType): ILayout | undefined;
    updateScheduleLayouts(scheduleLayouts: InputLayoutType[]): void;
    parseLayouts(loopUpdate?: boolean): IXlrPlayback;
}
export declare const initialXlr: IXlr;
