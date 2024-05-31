import { ILayout } from "../Types/Layout.types";
export declare const emitter: import("nanoevents").Emitter<import("nanoevents").DefaultEvents>;
export declare const startLayout: (layout: ILayout) => import("nanoevents").Unsubscribe;
export declare const finishLayout: (layout: ILayout) => import("nanoevents").Unsubscribe;
