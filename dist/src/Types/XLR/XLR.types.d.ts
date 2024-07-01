import { ILayout, InputLayoutType, OptionsType } from "../Layout/Layout.types";
export type PrepareLayoutsType = {
    moveNext?: boolean;
};
export declare enum ELayoutType {
    CURRENT = 0,
    NEXT = 1
}
export interface IXlr {
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
export declare const initialXlr: IXlr;