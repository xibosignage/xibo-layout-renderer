import {ILayout, InputLayoutType, OptionsType} from "./Layout.types";
import {platform} from "../Modules/Platform";

export type PrepareLayoutsType = {
    moveNext?: boolean;
};

export enum ELayoutType {
    CURRENT,
    NEXT,
}

export interface IXlr {
    inputLayouts: InputLayoutType[],
    config: OptionsType,
    layouts: ILayout[],
    currentLayoutIndex: number;
    currentLayoutId: string | undefined;
    currentLayout: ILayout | undefined;
    nextLayout: ILayout | undefined;
    bootstrap(): void;
    init(): void;
    playSchedules(xlr: IXlr): void;
    prepareLayoutXlf(inputLayout: ILayout | undefined, type: ELayoutType): Promise<ILayout>;
    prepareLayouts(): Promise<IXlr>;
}

export const initialXlr: IXlr = {
    inputLayouts: [],
    config: platform,
    layouts: [],
    currentLayoutIndex: 0,
    currentLayoutId: undefined,
    currentLayout: undefined,
    nextLayout: undefined,
    bootstrap() {
    },
    init() {
    },
    playSchedules() {
    },
    prepareLayoutXlf(inputLayout: ILayout | undefined, type: ELayoutType): Promise<ILayout> {
        return Promise.resolve(<ILayout>{});
    },
    prepareLayouts(): Promise<IXlr> {
        return Promise.resolve(<IXlr>{});
    }
};
