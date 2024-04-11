import { createNanoEvents } from 'nanoevents';
import {ILayout} from "../Types/Layout.types.js";

export const emitter = createNanoEvents();
export const startLayout = (layout: ILayout) => emitter.on('start', stats => {
    layout.done = false;
});

export const finishLayout = (layout: ILayout) => emitter.on('end', stats => {
    layout.done = true;
});
