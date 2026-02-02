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
import {IRegion} from '../Region';
import {IXlr} from '../XLR';
import InteractiveActions, { Action } from '../../Modules/ActionController';
import {ILayoutTransitionManager} from "../../Lib";
import Layout from "../../Modules/Layout";
import {Region} from "../../../../xlr-wip/player/types";

export interface ILayoutEvents {
    start: (layout: Layout) => void;
    end: (layout: Layout) => void;
    cancelled: (layout: Layout) => void;
}

export enum ELayoutState {
    IDLE,
    RUNNING,
    PLAYED,
    CANCELLED,
    ERROR,
}

export type InputLayoutType = {
    response: any;
    layoutId: number;
    path?: string;
    index?: number;
    id?: number;
    ad?: any;
    getXlf?(): string;
    duration?: number;
    isOverlay?: boolean;
};

export type OptionsType = {
    xlfUrl: string;
    getResourceUrl: string;
    layoutBackgroundDownloadUrl: string;
    layoutPreviewUrl: string;
    loaderUrl: string;
    previewJwt: string;
    idCounter: number;
    inPreview: boolean;
    appHost?: string | null;
    platform: 'CMS' | 'chromeOS';
    config?: {
        cmsUrl: string | null;
        schemaVersion: number;
        cmsKey: string | null;
        hardwareKey: string | null;
    };
    previewTranslations?: {
        [k: string]: any;
    };
    icons?: {
        splashScreen: string;
        logo: string;
    };
    gaplessPlayback: {
        enabled?: boolean; // Default: true
        preloadBufferMs?: number; // Default: 2000
        maxPreloadTimeMs?: number; // Default: 5000
        transitionDurationMs?: number; // Default: 500
        enablePrecisionTimer?: boolean; // Default: true
    };
};

export interface ILayout {
    id: number | null;
    layoutId: number;
    scheduleId?: number;
    sw: number | null;
    sh: number | null;
    xw: number | null;
    xh: number | null;
    duration: number;
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
    layoutNode?: Document;
    regionMaxZIndex: number;
    ready: boolean;
    regionObjects: IRegion[];
    drawer: Element | null;
    allExpired: boolean;
    regions: Region[];
    actions: Action[];
    options: OptionsType;
    done: boolean;
    allEnded: boolean;
    path?: string;
    prepareLayout(): void;
    parseXlf(): void;
    run(): void;
    emitter: Emitter<ILayoutEvents>;
    on<E extends keyof ILayoutEvents>(event: E, callback: ILayoutEvents[E]): Unsubscribe;
    regionExpired(): void;
    end(): void;
    regionEnded(region: Region): void;
    stopAllMedia(): Promise<void>;
    resetLayout(): Promise<void>;
    index: number;
    actionController: InteractiveActions | undefined;
    enableStat: boolean;
    xlr: IXlr,
    finishAllRegions(): Promise<void[]>;
    inLoop: boolean;
    removeLayout(): void;
    xlfString: string;
    getXlf(): string;
    ad: any;
    isOverlay: boolean;
    shareOfVoice: number;
    isInterrupt(): boolean;
    state: ELayoutState;
    errorCode: number | null;
    playRegions(): void;

    /**
     * DOM element reference for this layout
     * Set during parseXlf(), used for fade transitions by LayoutTransitionManager
     * @type {HTMLDivElement | null}
     */
    html?: HTMLDivElement | null;

    // Gapless playback transitions
    transitionManager?: ILayoutTransitionManager;
    currentRegionCount?: number;
    regionsEnded?: number;
}

export const initialLayout: ILayout = {
    id: null,
    layoutId: -9,
    sw: 0,
    sh: 0,
    xw: 0,
    xh: 0,
    duration: 0,
    zIndex: 0,
    scaleFactor: 1,
    sWidth: 0,
    sHeight: 0,
    offsetX: 0,
    offsetY: 0,
    bgColor: '',
    bgImage: '',
    bgId: '',
    containerName: '',
    layoutNode: undefined,
    regionMaxZIndex: 0,
    ready: false,
    regionObjects: [],
    drawer: null,
    allExpired: false,
    regions: [],
    actions: [],
    options: {} as OptionsType,
    done: false,
    allEnded: false,
    path: '',
    html: null,
    emitter: <Emitter<ILayoutEvents>>{},
    index: -1,
    actionController: undefined,
    enableStat: false,
    xlr: <IXlr>{},
    inLoop: true,
    xlfString: '',
    ad: null,
    isOverlay: false,
    shareOfVoice: 0,
    errorCode: null,
    prepareLayout() {
    },
    parseXlf() {
    },
    run() {
    },
    on<E extends keyof ILayoutEvents>(event: E, callback: ILayoutEvents[E]): Unsubscribe {
        return <Unsubscribe>{};
    },
    regionExpired() {
    },
    end() {
    },
    regionEnded(region: Region) {},
    stopAllMedia() {
        return Promise.resolve();
    },
    resetLayout() {
        return Promise.resolve();
    },
    finishAllRegions(): Promise<void[]> {
        return Promise.resolve([]);
    },
    removeLayout() {
    },
    getXlf(): string {
        return '';
    },
    isInterrupt: () => false,
    state: ELayoutState.IDLE,
    playRegions() {},
};

export type GetLayoutParamType = {
    xlr: IXlr;
    moveNext?: boolean;
}

export type GetLayoutType = {
    currentLayoutIndex: number;
    nextLayoutIndex: number;
    inputLayouts: InputLayoutType[];
    current: ILayout | undefined;
    next: ILayout | undefined;
}

/**
 * Configuration for layout-to-layout transitions
 */
export interface ILayoutTransitionConfig {
    /** Duration of fade transition in milliseconds */
    fadeDurationMs: number;

    /** Time before current layout ends to start next layout playback */
    parallelStartMs: number;

    /** Maximum time to wait for layout preparation before forcing transition */
    maxWaitMs: number;

    /** Easing function for fade (ease-in-out', 'ease-in', 'ease-out', 'linear') */
    easing?: 'ease-in-out' | 'ease-in' | 'ease-out' | 'linear';
}

/**
 * Events emitted during layout transitions
 */
export interface ILayoutTransitionEvents {
    /** Fired when layout transition starts */
    transitionStart: (data: {
        from: ILayout,
        to: ILayout,
        fadeDurationMs: number;
    }) => void;

    /** Fired when layout transition completes */
    transitionComplete: (data: {
        from: ILayout,
        to: ILayout,
        durationMs: number;
    }) => void;

    /** Fired if layout transition fails */
    transitionFailed: (data: {
        from: ILayout,
        to: ILayout,
        error: Error;
    }) => void;
}
