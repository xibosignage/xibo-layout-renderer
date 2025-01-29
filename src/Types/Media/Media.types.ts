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
import { IMediaEvents } from '../../Modules/Media/Media';
import {initialRegion, IRegion} from '../Region';
import {OptionsType} from '../Layout';

export interface IMedia {
    checkIframeStatus: boolean;
    run(): void;
    divHeight: number;
    type: string;
    timeoutId: ReturnType<typeof setTimeout>;
    divWidth: number;
    tempSrc: string;
    duration: number;
    iframeName: string;
    loadIframeOnRun: boolean;
    xml: Element | null;
    containerName: string;
    ready: boolean;
    loop: boolean;
    options: OptionsType & {
        [k: string]: any
    };
    useDuration: boolean;
    html: HTMLElement | null;
    id: string;
    mediaId: string;
    iframe: HTMLIFrameElement | null;
    render: string;
    attachedAudio: boolean;
    on<E extends keyof IMediaEvents>(event: E, callback: IMediaEvents[E]): Unsubscribe;
    init(): void;
    schemaVersion: string;
    index: number;
    mediaType: string;
    finished: boolean;
    uri: string;
    url: string | null;
    singlePlay: boolean;
    stop(): Promise<void>;
    idCounter: number;
    region: IRegion;
    fileId: string;
    emitter: Emitter<IMediaEvents>;
    enableStat: boolean;
    muted?: boolean;
}

export const initialMedia: IMedia = {
    region: initialRegion,
    xml: null,
    id: '',
    mediaId: '',
    index: 0,
    idCounter: 0,
    containerName: '',
    html: null,
    iframe: null,
    iframeName: '',
    mediaType: '',
    render: 'html',
    attachedAudio: false,
    singlePlay: false,
    timeoutId: setTimeout(() => {}, 0),
    ready: true,
    checkIframeStatus: false,
    loadIframeOnRun: false,
    tempSrc: '',
    finished: false,
    schemaVersion: '1',
    type: '',
    duration: 0,
    useDuration: Boolean(0),
    fileId: '',
    uri: '',
    options: <OptionsType>{},
    divWidth: 0,
    divHeight: 0,
    url: null,
    loop: false,
    run() {},
    init() {},
    stop() {
        return Promise.resolve();
    },
    on<E extends keyof IMediaEvents>(event: E, callback: IMediaEvents[E]): Unsubscribe {
        return <Unsubscribe>{};
    },
    emitter: <Emitter<IMediaEvents>>{},
    enableStat: false,
    muted: false,
}
