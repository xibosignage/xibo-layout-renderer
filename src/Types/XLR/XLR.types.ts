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
import {OverlayLayoutManager} from "../../Modules/Layout/OverlayLayoutManager";

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
    overlayStart: (overlay: ILayout) => void;
    overlayEnd: (overlay: ILayout) => void;
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
    bootstrap(): void,

    config: OptionsType,
    currentLayout: ILayout | undefined;
    currentLayoutId: number;
    currentLayoutIndex: number;

    emitSync<E extends keyof IXlrEvents>(eventName: E, ...args: Parameters<IXlrEvents[E]>): Promise<void>;

    emitter: Emitter<IXlrEvents>;

    getLayout(inputLayout: InputLayoutType): ILayout | undefined;

    getLayoutById(layoutId: number, layoutIndex?: number): ILayout | undefined;

    gotoNextLayout(): void;

    gotoPrevLayout(): void;

    init(): Promise<IXlr>;

    inputLayouts: InputLayoutType[];
    isInterrupted: boolean;

    isLayoutInDOM(containerName: string, layoutId: number): boolean;

    isSspEnabled: boolean;
    isUpdatingLoop: boolean;
    isUpdatingOverlays: boolean;
    layouts: Record<string, ILayout>;
    nextLayout: ILayout | undefined;

    on<E extends keyof IXlrEvents>(event: E, callback: IXlrEvents[E]): Unsubscribe;

    overlayLayoutManager: OverlayLayoutManager;
    overlays: InputLayoutType[];

    parseLayouts(loopUpdate?: boolean): IXlrPlayback;

    playLayouts(xlr: IXlr): void;

    playSchedules(xlr: IXlr): void;

    prepareForSsp(nextLayout: ILayout): Promise<ILayout>;

    prepareLayoutXlf(inputLayout: ILayout | undefined): Promise<ILayout>;

    prepareLayouts(): Promise<IXlr>;

    renderOverlayLayouts(): Promise<void>;

    uniqueLayouts: Record<string, InputLayoutType>;

    updateInputLayout(layoutIndex: number, layout: InputLayoutType): void;

    updateLayouts(inputLayouts: InputLayoutType[]): void;

    updateLoop(inputLayouts: InputLayoutType[]): Promise<void>;

    updateOverlays(overlays: InputLayoutType[]): Promise<void>;

    updateScheduleLayouts(scheduleLayouts: InputLayoutType[]): Promise<void>;
}

export const initialXlr: IXlr = {
    bootstrap() {
    },
    config: platform,
    currentLayout: undefined,
    currentLayoutId: -2,
    currentLayoutIndex: 0,
    // NOTE: Using -2 to avoid conflict with usage of -1 with SSP Layout
    emitSync<E extends keyof IXlrEvents>(eventName: E, ...args: Parameters<IXlrEvents[E]>): Promise<void> {
        return Promise.resolve();
    },
    emitter: <Emitter<IXlrEvents>>{},
    getLayout(inputLayout: InputLayoutType): ILayout | undefined {
        return;
    },
    getLayoutById(layoutId: number): ILayout | undefined {
        return <ILayout>{};
    },
    gotoNextLayout() {
    },
    gotoPrevLayout() {
    },
    init() {
        return Promise.resolve(<IXlr>{});
    },
    inputLayouts: [],
    isInterrupted: false,
    isLayoutInDOM(containerName: string, layoutId: number): boolean {
        return false;
    },
    isSspEnabled: false,
    isUpdatingLoop: false,
    isUpdatingOverlays: false,
    layouts: {},
    nextLayout: undefined,
    on<E extends keyof IXlrEvents>(event: E, callback: IXlrEvents[E]): Unsubscribe {
        return <Unsubscribe>{};
    },
    overlayLayoutManager: new OverlayLayoutManager(),
    overlays: [],
    parseLayouts(): IXlrPlayback {
        return <IXlrPlayback>{};
    },
    playLayouts(xlr: IXlr) {
    },
    playSchedules() {
    },
    prepareForSsp(nextLayout: ILayout): Promise<ILayout> {
        return Promise.resolve(<ILayout>{});
    },
    prepareLayoutXlf(inputLayout: ILayout | undefined): Promise<ILayout> {
        return Promise.resolve(<ILayout>{});
    },
    prepareLayouts(): Promise<IXlr> {
        return Promise.resolve(<IXlr>{});
    },
    renderOverlayLayouts(): Promise<void> {
        return Promise.resolve();
    },
    uniqueLayouts: {},
    updateInputLayout(layoutIndex: number, layout: InputLayoutType) {
    },
    updateLayouts(inputLayouts: InputLayoutType[]) {
    },
    updateLoop(inputLayouts) {
        return Promise.resolve();
    },
    updateOverlays(overlays: InputLayoutType[]) {
        return Promise.resolve();
    },
    updateScheduleLayouts(scheduleLayouts) {
        return Promise.resolve();
    },
};
