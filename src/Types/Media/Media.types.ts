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
import Player from "video.js/dist/types/player";
import { IMediaEvents } from '../../Modules/Media/Media';
import {initialRegion, IRegion} from '../Region';
import {OptionsType} from '../Layout';

export type MediaState = 'idle' | 'playing' | 'ended';

export const MediaState = {
    IDLE: 'idle',
    PLAYING: 'playing',
    ENDED: 'ended',
} as const;

export interface IMedia {
    attachedAudio: boolean;
    checkIframeStatus: boolean;
    containerName: string;
    divHeight: number;
    divWidth: number;
    duration: number;
    emitter: Emitter<IMediaEvents>;
    enableStat: boolean;
    fileId: string;
    finished: boolean;
    html: HTMLElement | null;
    id: string;
    idCounter: number;
    iframe: HTMLIFrameElement | null;
    iframeName: string;
    index: number;

    loadIframeOnRun: boolean;
    loop: boolean;
    mediaId: string;
    mediaType: string;
    muted?: boolean;

    options: OptionsType & {
        [k: string]: any
    };
    player?: Player;
    ready: boolean;
    region: IRegion;
    render: string;

    run(): void;

    schemaVersion: string;
    singlePlay: boolean;
    state: MediaState;

    stop(): Promise<void>;

    tempSrc: string;
    timeoutId: ReturnType<typeof setTimeout>;
    type: string;
    uri: string;
    url: string | null;
    useDuration: boolean;
    xml: Element | null;
}

export const initialMedia: IMedia = {
    attachedAudio: false,
    checkIframeStatus: false,
    containerName: '',
    divHeight: 0,
    divWidth: 0,
    duration: 0,
    emitter: <Emitter<IMediaEvents>>{},
    enableStat: false,
    fileId: '',
    finished: false,
    html: null,
    id: '',
    idCounter: 0,
    iframe: null,
    iframeName: '',
    index: 0,
    loadIframeOnRun: false,
    loop: false,
    mediaId: '',
    mediaType: '',
    muted: false,
    options: <OptionsType>{},
    player: undefined,
    ready: true,
    region: initialRegion,
    render: 'html',
    run() {
    },
    schemaVersion: '1',
    singlePlay: false,
    state: MediaState.IDLE,
    stop() {
        return Promise.resolve();
    },
    tempSrc: '',
    timeoutId: setTimeout(() => {
    }, 0),
    type: '',
    uri: '',
    url: null,
    useDuration: Boolean(0),
    xml: null,
}
