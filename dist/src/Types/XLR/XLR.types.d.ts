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
export interface IXlr {
    inputLayouts: InputLayoutType[];
    config: OptionsType;
    layouts: ILayout[];
    currentLayoutIndex: number;
    currentLayoutId: number | null;
    currentLayout: ILayout | undefined;
    nextLayout: ILayout | undefined;
    emitter: Emitter<IXlrEvents>;
    bootstrap(): void;
    init(): Promise<IXlr>;
    playSchedules(xlr: IXlr): void;
    prepareLayoutXlf(inputLayout: ILayout | undefined): Promise<ILayout>;
    prepareLayouts(): Promise<IXlr>;
    updateLayouts(inputLayouts: InputLayoutType[]): void;
    updateLoop(inputLayouts: InputLayoutType[]): void;
    gotoPrevLayout(): void;
    gotoNextLayout(): void;
}
export declare const initialXlr: IXlr;
