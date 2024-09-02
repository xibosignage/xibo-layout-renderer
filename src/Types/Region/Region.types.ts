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
import { DefaultEvents, Emitter, Unsubscribe } from 'nanoevents';
import {ILayout, initialLayout} from '../Layout';
import {IMedia} from '../Media';

export interface IRegionEvents {
    start: (layout: IRegion) => void;
    end: (layout: IRegion) => void;
}

export interface IRegion {
    layout: ILayout;
    id: string;
    regionId: string;
    xml: null | Element;
    mediaObjects: IMedia[];
    mediaObjectsActions: String[];
    currentMedia: number;
    complete: boolean;
    containerName: string;
    ending: boolean;
    ended: boolean;
    oneMedia: boolean;
    oldMedia: IMedia | undefined;
    curMedia: IMedia | undefined;
    nxtMedia: IMedia | undefined;
    currentMediaIndex: number;
    totalMediaObjects: number;
    ready: boolean;
    options: {
        [k: string]: any;
    };
    sWidth: number;
    sHeight: number;
    offsetX: number;
    offsetY: number;
    zIndex: number;
    index: number;
    emitter?: Emitter<DefaultEvents>;
    prepareRegion(): void;
    playNextMedia(): void;
    transitionNodes(oldMedia: IMedia | undefined, newMedia: IMedia | undefined): void;
    finished(): void;
    run(): void;
    end(): void;
    exitTransition(): void;
    exitTransitionComplete(): void;
    on<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]): Unsubscribe;
    prepareMediaObjects(): void;
    reset(): void;
}

export const initialRegion: IRegion = {
    layout: initialLayout,
    id: '',
    regionId: '',
    xml: null,
    mediaObjects: [],
    mediaObjectsActions: [],
    currentMedia: -1,
    complete: false,
    containerName: '',
    ending: false,
    ended: false,
    oneMedia: false,
    oldMedia: undefined,
    curMedia: undefined,
    nxtMedia: undefined,
    currentMediaIndex: 0,
    totalMediaObjects: 0,
    ready: false,
    options: {},
    sWidth: 0,
    sHeight: 0,
    offsetX: 0,
    offsetY: 0,
    zIndex: 0,
    index: -1,
    prepareRegion() {
    },
    playNextMedia() {
    },
    transitionNodes() {
    },
    finished() {
    },
    run() {
    },
    end() {
    },
    exitTransition() {},
    exitTransitionComplete() {},
    on<E extends keyof IRegionEvents>(event: E, callback: IRegionEvents[E]): Unsubscribe {
        return <Unsubscribe>{};
    },
    prepareMediaObjects() {
    },
    reset() {
    }
};
