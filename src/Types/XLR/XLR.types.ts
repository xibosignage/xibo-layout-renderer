/*
 * Copyright (C) 2025 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
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
    layoutStart: (layout: ILayout) => void;
    layoutEnd: (layout: ILayout) => void;
    layoutError: (layout: ILayout) => void;
    widgetStart: (widgetId: number) => void;
    widgetEnd: (widgetId: number) => void;
    widgetError: (widgetId: number) => void;
    adRequest: (sspLayoutIndex: number) => void;
    updateLoop: (inputLayouts: InputLayoutType[]) => void;
    updateOverlays: (overlays: InputLayoutType[]) => void;
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
    layouts: Record<string, ILayout>;
    overlays: InputLayoutType[];
    currentLayoutIndex: number;
    currentLayoutId: number;
    currentLayout: ILayout | undefined;
    nextLayout: ILayout | undefined;
    emitter: Emitter<IXlrEvents>;
    bootstrap(): void;
    init(): Promise<IXlr>;
    playSchedules(xlr: IXlr): void;
    prepareLayoutXlf(inputLayout: ILayout | undefined): Promise<ILayout>;
    prepareLayouts(): Promise<IXlr>;
    updateLayouts(inputLayouts: InputLayoutType[]): void;
    updateLoop(inputLayouts: InputLayoutType[]): Promise<void>;
    gotoPrevLayout(): void;
    gotoNextLayout(): void;
    uniqueLayouts: Record<string, InputLayoutType>;
    getLayout(inputLayout: InputLayoutType): ILayout | undefined;
    updateScheduleLayouts(scheduleLayouts: InputLayoutType[]): Promise<void>;
    parseLayouts(loopUpdate?: boolean): IXlrPlayback;
    getLayoutById(layoutId: number, layoutIndex?: number): ILayout | undefined;
    on<E extends keyof IXlrEvents>(event: E, callback: IXlrEvents[E]): Unsubscribe;
    prepareForSsp(nextLayout: ILayout): Promise<ILayout>;
    emitSync<E extends keyof IXlrEvents>(eventName: E, ...args: Parameters<IXlrEvents[E]>): Promise<void>;
    updateInputLayout(layoutIndex: number, layout: InputLayoutType): void;
    isSspEnabled: boolean;
    renderOverlayLayouts(): Promise<void>;
    isInterrupted: boolean;
    isLayoutInDOM(containerName: string, layoutId: number): boolean;
    isUpdatingLoop: boolean;
    isUpdatingOverlays: boolean;
    updateOverlays(overlays: InputLayoutType[]): Promise<void>;
}

export const initialXlr: IXlr = {
    inputLayouts: [],
    config: platform,
    layouts: {},
    overlays: [],
    currentLayoutIndex: 0,
    // NOTE: Using -2 to avoid conflict with usage of -1 with SSP Layout
    currentLayoutId: -2,
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
    },
    emitSync<E extends keyof IXlrEvents>(eventName: E, ...args: Parameters<IXlrEvents[E]>): Promise<void> {
        return Promise.resolve();
    },
    updateInputLayout(layoutIndex: number, layout: InputLayoutType) {
    },
    isSspEnabled: false,
    renderOverlayLayouts(): Promise<void> {
        return Promise.resolve();
    },
    isInterrupted: false,
    isLayoutInDOM(containerName: string, layoutId: number): boolean {
        return false;
    },
    isUpdatingLoop: false,
    isUpdatingOverlays: false,
    updateOverlays(overlays: InputLayoutType[]) {
        return Promise.resolve();
    }
};
