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
import { DefaultEvents, Emitter, Unsubscribe } from 'nanoevents';
import {ILayout, initialLayout} from '../Layout';
import {IMedia} from '../Media';

export interface IRegionEvents {
    start: (layout: IRegion) => void;
    end: (layout: IRegion) => void;
}

export interface IRegion {
    complete: boolean;
    containerName: string;
    currMedia: IMedia | undefined;
    currEl: HTMLElement | undefined;
    currentMedia: number;
    currentMediaIndex: number;
    emitter?: Emitter<DefaultEvents>;

    end(): void;

    ended: boolean;
    ending: boolean;

    exitTransition(): void;

    exitTransitionComplete(): void;

    finished(): void;

    html: HTMLDivElement;
    id: string;
    index: number;
    layout: ILayout;
    mediaObjects: IMedia[];
    mediaObjectsActions: IMedia[];
    nxtMedia: IMedia | undefined;
    nxtEl: HTMLElement | undefined;
    offsetX: number;
    offsetY: number;
    oldMedia: IMedia | undefined;

    on<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]): Unsubscribe;

    oneMedia: boolean;
    options: {
        [k: string]: any;
    };

    playNextMedia(): void;

    playPreviousMedia(): void;

    prepareMediaObjects(): void;

    prepareRegion(): void;

    ready: boolean;
    regionId: string;

    reset(): void;

    run(): void;

    sHeight: number;
    sWidth: number;
    totalMediaObjects: number;

    transitionNodes(oldMedia: IMedia | undefined, newMedia: IMedia | undefined): void;

    uniqueId: string;
    xml: null | Element;
    zIndex: number;
}

export const initialRegion: IRegion = {
    complete: false,
    containerName: '',
    currMedia: undefined,
    currEl: undefined,
    currentMedia: -1,
    currentMediaIndex: 0,
    end() {
    },
    ended: false,
    ending: false,
    exitTransition() {
    },
    exitTransitionComplete() {
    },
    finished() {
    },
    html: <HTMLDivElement>{},
    id: '',
    index: -1,
    layout: initialLayout,
    mediaObjects: [],
    mediaObjectsActions: [],
    nxtMedia: undefined,
    nxtEl: undefined,
    offsetX: 0,
    offsetY: 0,
    oldMedia: undefined,
    on<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]): Unsubscribe {
        return <Unsubscribe>{};
    },
    oneMedia: false,
    options: {},
    playNextMedia() {
    },
    playPreviousMedia() {
    },
    prepareMediaObjects() {
    },
    prepareRegion() {
    },
    ready: false,
    regionId: '',
    reset() {
    },
    run() {
    },
    sHeight: 0,
    sWidth: 0,
    totalMediaObjects: 0,
    transitionNodes() {
    },
    uniqueId: '',
    xml: null,
    zIndex: 0,
};
