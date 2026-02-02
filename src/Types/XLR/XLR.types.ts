/*
 * Copyright (C) 2026 Xibo Signage Ltd
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
import {OverlayLayoutManager} from "../../Modules/Layout/OverlayLayoutManager";
import Layout from "../../Modules/Layout";

export type PrepareLayoutsType = {
    moveNext?: boolean;
};

export enum ELayoutType {
    CURRENT,
    NEXT,
}

export type IXlrEvents = {
    layoutChange: (layoutId: number) => void;
    layoutStart: (layout: Layout) => void;
    layoutEnd: (layout: Layout) => void;
    layoutError: (layout: Layout) => void;
    widgetStart: (widgetId: number) => void;
    widgetEnd: (widgetId: number) => void;
    widgetError: (widgetId: number) => void;
    adRequest: (sspLayoutIndex: number) => void;
    updateLoop: (inputLayouts: InputLayoutType[]) => void;
    updateOverlays: (overlays: InputLayoutType[]) => void;
    overlayStart: (overlay: Layout) => void;
    overlayEnd: (overlay: Layout) => void;
};

export interface IXlrPlayback {
    currentLayout: Layout | undefined;
    nextLayout: Layout | undefined;
    currentLayoutIndex: number;
    nextLayoutIndex: number;
    isCurrentLayoutValid: boolean;
    hasDefaultOnly: boolean;
}

export interface IXlr {
    bootstrap(): void,

    config: OptionsType,
    currentLayout: Layout | undefined;
    currentLayoutId: number;
    currentLayoutIndex: number;

    emitSync<E extends keyof IXlrEvents>(eventName: E, ...args: Parameters<IXlrEvents[E]>): Promise<void>;

    emitter: Emitter<IXlrEvents>;

    getLayout(inputLayout: InputLayoutType): Layout | undefined;

    getLayoutById(layoutId: number, layoutIndex?: number): Layout | undefined;

    gotoNextLayout(): void;

    gotoPrevLayout(): void;

    init(): Promise<IXlr>;

    inputLayouts: InputLayoutType[];
    isInterrupted: boolean;

    isLayoutInDOM(containerName: string, layoutId: number): boolean;

    isSspEnabled: boolean;
    isUpdatingLoop: boolean;
    isUpdatingOverlays: boolean;
    layouts: Record<string, Layout>;
    nextLayout: Layout | undefined;

    on<E extends keyof IXlrEvents>(event: E, callback: IXlrEvents[E]): Unsubscribe;

    overlayLayoutManager: OverlayLayoutManager;
    overlays: InputLayoutType[];

    parseLayouts(loopUpdate?: boolean): IXlrPlayback;

    playLayouts(xlr: IXlr): void;

    playSchedules(xlr: IXlr): void;

    prepareForSsp(nextLayout: Layout): Promise<Layout>;

    prepareLayoutXlf(inputLayout: Layout | undefined): Promise<Layout>;

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
    config: {} as OptionsType,
    currentLayout: undefined,
    currentLayoutId: -2,
    currentLayoutIndex: 0,
    // NOTE: Using -2 to avoid conflict with usage of -1 with SSP Layout
    emitSync<E extends keyof IXlrEvents>(eventName: E, ...args: Parameters<IXlrEvents[E]>): Promise<void> {
        return Promise.resolve();
    },
    emitter: <Emitter<IXlrEvents>>{},
    getLayout(inputLayout: InputLayoutType): Layout | undefined {
        return;
    },
    getLayoutById(layoutId: number): Layout | undefined {
        return <Layout>{};
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
    prepareForSsp(nextLayout: Layout): Promise<Layout> {
        return Promise.resolve(<Layout>{});
    },
    prepareLayoutXlf(inputLayout: Layout | undefined): Promise<Layout> {
        return Promise.resolve(<Layout>{});
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
