import { DefaultEvents, Emitter, Unsubscribe } from 'nanoevents';
import { ILayout } from '../Layout';
import { IMedia } from '../Media';
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
export declare const initialRegion: IRegion;
