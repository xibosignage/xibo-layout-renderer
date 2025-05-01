/*
 * Copyright (C) 2025 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://www.xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */
import {Emitter, Unsubscribe} from 'nanoevents';
import {ILayout, InputLayoutType, OptionsType} from '../Layout';
import {platform} from '../../Modules/Platform';

export type PrepareLayoutsType = {
    moveNext?: boolean;
};

export enum ELayoutType {
    CURRENT,
    NEXT,
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
    inputLayouts: InputLayoutType[],
    config: OptionsType,
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
    prepareForSsp(nextLayout: ILayout): Promise<ILayout>;
}

export const initialXlr: IXlr = {
    inputLayouts: [],
    config: platform,
    layouts: {},
    currentLayoutIndex: 0,
    currentLayoutId: -1,
    currentLayout: undefined,
    nextLayout: undefined,
    emitter: <Emitter<IXlrEvents>>{},
    bootstrap() {
    },
    init() {
        return Promise.resolve(<IXlr>{});
    },
    playSchedules() {
    },
    prepareLayoutXlf(inputLayout: ILayout | undefined): Promise<ILayout> {
        return Promise.resolve(<ILayout>{});
    },
    prepareLayouts(): Promise<IXlr> {
        return Promise.resolve(<IXlr>{});
    },
    updateLayouts(inputLayouts: InputLayoutType[]) {
    },
    updateLoop(inputLayouts) {
        return Promise.resolve();
    },
    gotoPrevLayout() {
    },
    gotoNextLayout() {
    },
    uniqueLayouts: {},
    getLayout(inputLayout: InputLayoutType): ILayout | undefined {
        return;
    },
    updateScheduleLayouts(scheduleLayouts) {
        return Promise.resolve();
    },
    parseLayouts(): IXlrPlayback {
        return <IXlrPlayback>{};
    },
    getLayoutById(layoutId: number): ILayout | undefined {
        return <ILayout>{};
    },
    on<E extends keyof IXlrEvents>(event: E, callback: IXlrEvents[E]): Unsubscribe {
        return <Unsubscribe>{};
    },
    prepareForSsp(nextLayout: ILayout): Promise<ILayout> {
        return Promise.resolve(<ILayout>{});
    }
};
