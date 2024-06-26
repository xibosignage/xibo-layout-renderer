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
import {DefaultEvents, Emitter, Unsubscribe} from "nanoevents";
import {IRegion} from "./Region.types";
import {platform} from "../Modules/Platform";
import {ILayoutEvents} from "../Modules/Layout/Layout";
import {IXlr} from "./XLR.types";

export type InputLayoutType = {
    layoutId: string;
};

export type TargetContainerType = HTMLElement;

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
};

export interface ILayout {
    id: string;
    layoutId: string;
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
    drawer: String[];
    allExpired: boolean;
    regions: IRegion[];
    actions: String[];
    options: OptionsType;
    done: boolean;
    allEnded: boolean;
    prepareLayout(): void;
    parseXlf(): void;
    run(): void;
    emitter?: Emitter<DefaultEvents>;
    on<E extends keyof ILayoutEvents>(event: E, callback: ILayoutEvents[E]): Unsubscribe;
    regionExpired(): void;
    end(): void;
    regionEnded(): void;
    stopAllMedia(): Promise<void>;
}

export const initialLayout: ILayout = {
    id: '',
    layoutId: '',
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
    drawer: [],
    allExpired: false,
    regions: [],
    actions: [],
    options: platform,
    done: false,
    allEnded: false,
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
};

export type GetLayoutParamType = {
    xlr: IXlr;
    moveNext?: boolean;
}

export type GetLayoutType = {
    currentLayoutIndex: number;
    inputLayouts: InputLayoutType[];
    current: ILayout | undefined;
    next: ILayout | undefined;
}
