/**
 * Centralized event type definitions
 * All module events should be defined here
 */

import { ILayout } from "../Layout";
import { IMedia } from "../Media";
import { IRegion } from "../Region";

/**
 * Events emitted by Layout
 */
export interface ILayoutEvents {
  start: (layout: ILayout) => void;
  end: (layout: ILayout) => void;
  cancelled: (layout: ILayout) => void;
  layoutStart?: (layout: ILayout) => void;
  layoutEnd?: (layout: ILayout) => void;
}

/**
 * Events emitted by Region
 */
export interface IRegionEvents {
  start: (region: IRegion) => void;
  end: (region: IRegion) => void;
}

/**
 * Events emitted by Media
 */
export interface IMediaEvents {
  start: (media: IMedia) => void;
  end: (media: IMedia) => void;
}


/**
 * Type alias for event unsubscriber
 */
export type EventUnsubscriber = () => void;
export type EventEmitter<T> = <K extends keyof T>(event: K, ...args: Parameters<T[K] extends (...args: any[]) => any ? T[K] : never>) => void;
