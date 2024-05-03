import { DefaultEvents, Emitter, Unsubscribe } from "nanoevents";
import { IMediaEvents } from "../Modules/Media.js";
import {initialRegion, IRegion} from "./Region.types.js";

export interface IMedia {
    region: IRegion;
    xml: null | Element;
    id: string;
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
    options: {
        [k: string]: any;
    };
    divWidth: number;
    divHeight: number;
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
    duration: 5,
    useDuration: Boolean(0),
    fileId: '',
    options: {},
    divWidth: 0,
    divHeight: 0,
    run() {},
    init() {},
    stop() {
        return Promise.resolve();
    },
    on<E extends keyof IMediaEvents>(event: E, callback: IMediaEvents[E]): Unsubscribe {
        return <Unsubscribe>{};
    },
}
