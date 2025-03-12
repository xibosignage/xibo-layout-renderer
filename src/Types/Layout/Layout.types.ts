/*
 * Copyright (C) 2024 Xibo Signage Ltd
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
import {IRegion} from '../Region';
import {platform} from '../../Modules/Platform';
import {ILayoutEvents} from '../../Modules/Layout';
import {IXlr} from '../XLR';
import InteractiveActions, { Action } from '../../Modules/ActionController';

export type InputLayoutType = {
    layoutId: number;
    path?: string;
    index?: number;
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
};

export interface ILayout {
    id: number | null;
    layoutId: number;
    scheduleId?: number;
    sw: number | null;
    sh: number | null;
    xw: number | null;
    xh: number | null;
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
    layoutNode: Document | null;
    regionMaxZIndex: number;
    ready: boolean;
    regionObjects: IRegion[];
    drawer: Element | null;
    allExpired: boolean;
    regions: IRegion[];
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
    regionEnded(): void;
    stopAllMedia(): Promise<void>;
    resetLayout(): Promise<void>;
    index: number;
    actionController: InteractiveActions | undefined;
    enableStat: boolean;
    xlr: IXlr,
    finishAllRegions(): Promise<void[]>;
    inLoop: boolean;
}

export const initialLayout: ILayout = {
    id: null,
    layoutId: -1,
    sw: 0,
    sh: 0,
    xw: 0,
    xh: 0,
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
    layoutNode: null,
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
    regionEnded() {
    },
    stopAllMedia() {
        return Promise.resolve();
    },
    resetLayout() {
        return Promise.resolve();
    },
    emitter: <Emitter<ILayoutEvents>>{},
    index: -1,
    actionController: undefined,
    enableStat: false,
    xlr: <IXlr>{},
    finishAllRegions(): Promise<void[]> {
        return Promise.resolve([]);
    },
    inLoop: true,
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
