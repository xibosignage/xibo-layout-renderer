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
import {Emitter} from 'nanoevents';
import Player from "video.js/dist/types/player";

import {initialRegion, IRegion} from '../Region';
import {OptionsType} from '../Layout';
import {IVideoMediaHandler} from "../../Modules/Media";
import { IMediaEvents } from "../Events";

export type MediaState = 'idle' | 'playing' | 'ended' | 'cancelled';

export const MediaState = {
    IDLE: 'idle',
    PLAYING: 'playing',
    ENDED: 'ended',
    CANCELLED: 'cancelled',
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
    fromDt: string;
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
    toDt: string;
    type: string;
    uri: string;
    url: string | null;
    useDuration: boolean;
    xml: Element | null;
    videoHandler?: IVideoMediaHandler;
    mediaTimer: ReturnType<typeof setInterval> | undefined;
}
