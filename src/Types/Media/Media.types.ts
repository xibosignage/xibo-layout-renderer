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
import { DefaultEvents, Emitter, Unsubscribe } from "nanoevents";
import { IMediaEvents } from "../../Modules/Media/Media";
import {initialRegion, IRegion} from "../Region/Region.types";

export interface IMedia {
    region: IRegion;
    xml: null | Element;
    id: string;
    idCounter: number;
    index: number;
    containerName: string;
    html: null | HTMLElement;
    iframe: null | HTMLIFrameElement;
    iframeName: string;
    mediaType: string;
    render: string;
    attachedAudio: boolean;
    singlePlay: boolean;
    timeoutId: ReturnType<typeof setTimeout>;
    ready: boolean;
    checkIframeStatus: boolean;
    loadIframeOnRun: boolean;
    tempSrc: string;
    finished: boolean;
    schemaVersion: string;
    type: string;
    duration: number;
    useDuration: boolean;
    fileId: string;
    uri: string;
    options: {
        [k: string]: any;
    };
    divWidth: number;
    divHeight: number;
    url: string | null;
    loop: boolean;
    emitter?: Emitter<DefaultEvents>;
    run(): void;
    init(): void;
    stop(): Promise<void>;
    on<E extends keyof IMediaEvents>(event: E, callback: IMediaEvents[E]): Unsubscribe;
}

export const initialMedia: IMedia = {
    region: initialRegion,
    xml: null,
    id: '',
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
    timeoutId: setTimeout(() => {}, 100),
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
    options: {},
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
}
