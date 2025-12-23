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
import {IRegion} from '../Region';
import {platform} from '../../Modules/Platform';
import {IXlr} from '../XLR';
import InteractiveActions, { Action } from '../../Modules/ActionController';
import {ConsumerPlatform} from "../Platform";
import {Region} from "../../Modules/Region";

export interface ILayoutEvents {
    start: (layout: ILayout) => void;
    end: (layout: ILayout) => void;
    cancelled: (layout: ILayout) => void;
}

export enum ELayoutState {
    IDLE,
    RUNNING,
    PLAYED,
    CANCELLED,
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
    libraryDownloadUrl: string;
    loaderUrl: string;
    idCounter: number;
    inPreview: boolean;
    appHost?: string | null;
    platform: ConsumerPlatform;
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
    regionEnded(): Promise<void>;
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
}

export const initialLayout: ILayout = {
    id: null,
    layoutId: -1,
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
    options: platform,
    done: false,
    allEnded: false,
    path: '',
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
    regionEnded(): Promise<void> {
        return Promise.resolve();
    },
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
