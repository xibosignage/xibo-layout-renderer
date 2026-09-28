/*
 * Copyright (C) 2026 Xibo Signage Ltd
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
/**
 * Flat summaries of XLR runtime objects for console logging.
 *
 * Layout, Region and Media reference each other, XLR, DOM nodes and video.js
 * players. Logged whole, the player serialises that entire graph on every call
 * (to forward it over IPC and on to the CMS), which froze playback, and the
 * console keeps it all alive. These summaries keep every field that helps follow
 * playback, and read only plain properties and inline styles so they stay cheap.
 *
 * Passed as a log call's second argument, a summary's top-level layoutId /
 * scheduleId / mediaId / regionId are also picked up as the CMS log's fields.
 */

type Loose = Record<string, any> | null | undefined;

/** Drop unset fields so log lines only show what is known */
const compact = <T extends Record<string, any>>(obj: T): Partial<T> => {
    for (const key of Object.keys(obj)) {
        if (obj[key] === undefined) delete obj[key];
    }
    return obj;
};

const safe = <T>(fn: () => T): T | undefined => {
    try {
        return fn();
    } catch {
        return undefined;
    }
};

export function layoutSummary(layout: Loose) {
    if (!layout) return layout ?? null;
    return compact({
        layoutId: layout.layoutId,
        scheduleId: layout.scheduleId,
        containerName: layout.containerName || undefined,
        index: layout.index,
        state: layout.state,
        done: layout.done,
        allExpired: layout.allExpired,
        allEnded: layout.allEnded,
        inLoop: layout.inLoop,
        duration: layout.duration,
        isOverlay: layout.isOverlay || undefined,
        shareOfVoice: layout.shareOfVoice || undefined,
        cyclePlayback: layout.cyclePlayback || undefined,
        groupKey: layout.groupKey,
        errorCode: layout.errorCode ?? undefined,
        scaleFactor: layout.scaleFactor,
        size: layout.sWidth !== undefined ? `${Math.round(layout.sWidth)}x${Math.round(layout.sHeight)}` : undefined,
        regionCount: Array.isArray(layout.regions) ? layout.regions.length : undefined,
        // Next-layout widget preload: false while its widget iframes are held back
        mediaReleased: layout.mediaReleased,
        deferredIframes: Array.isArray(layout.deferredIframes) ? layout.deferredIframes.length : undefined,
    });
}

export function regionSummary(region: Loose) {
    if (!region) return region ?? null;
    return compact({
        regionId: region.id,
        layoutId: region.layout?.layoutId,
        scheduleId: region.layout?.scheduleId,
        containerName: region.containerName,
        index: region.index,
        complete: region.complete,
        ending: region.ending,
        ended: region.ended,
        currentMediaIndex: region.currentMediaIndex,
        currMediaId: region.currMedia?.id,
        oldMediaId: region.oldMedia?.id,
        nxtMediaId: region.nxtMedia?.id,
        totalMediaObjects: region.totalMediaObjects,
        mediaIds: Array.isArray(region.mediaObjects) ? region.mediaObjects.map((m: Loose) => m?.id) : undefined,
        loop: region.options?.loop,
        zIndex: region.zIndex,
        size: region.sWidth !== undefined ? `${Math.round(region.sWidth)}x${Math.round(region.sHeight)}` : undefined,
    });
}

export function mediaSummary(media: Loose) {
    if (!media) return media ?? null;
    return compact({
        mediaId: media.id,
        regionId: media.region?.id,
        layoutId: media.region?.layout?.layoutId,
        scheduleId: media.region?.layout?.scheduleId,
        type: media.mediaType,
        render: media.render,
        state: media.state,
        index: media.index,
        duration: media.duration,
        useDuration: media.useDuration,
        loop: media.loop,
        fromDt: media.fromDt || undefined,
        toDt: media.toDt || undefined,
        singlePlay: media.singlePlay || undefined,
        playlistParentWidgetId: media.playlistParentWidgetId || undefined,
        playlistCyclePlayback: media.playlistCyclePlayback || undefined,
        containerName: media.containerName,
        fileId: media.fileId || undefined,
        uri: media.uri || undefined,
        url: media.url,
        inDOM: media.html ? media.html.isConnected : null,
        iframe: media.iframe ? iframeState(media.iframe) : undefined,
        hasPlayer: media.player ? true : undefined,
    });
}

function iframeState(iframe: HTMLIFrameElement) {
    if (iframe.getAttribute('src')) return 'loaded';
    return iframe.dataset?.src ? 'deferred' : 'none';
}

/**
 * Element id/class, whether it is attached, its inline visibility styles and,
 * for an iframe (or an element holding one), whether its src is set yet.
 */
export function elementSummary(el: Element | null | undefined) {
    if (!el) return el ?? null;
    const style = (el as HTMLElement).style;
    const iframe = el.tagName === 'IFRAME' ? el as HTMLIFrameElement : el.querySelector?.('iframe');
    return compact({
        id: el.id || undefined,
        tag: el.tagName.toLowerCase(),
        className: typeof el.className === 'string' && el.className ? el.className : undefined,
        inDOM: el.isConnected,
        visibility: style?.visibility || undefined,
        opacity: style?.opacity || undefined,
        zIndex: style?.zIndex || undefined,
        iframe: iframe ? iframeState(iframe) : undefined,
    });
}

/** video.js player id and playback state */
export function playerSummary(player: Loose) {
    if (!player) return player ?? null;
    const isDisposed = safe(() => player.isDisposed());
    const summary: Record<string, any> = {
        id: safe(() => player.id()) ?? player.id_,
        isDisposed,
    };
    // A disposed player has no tech left to query
    if (!isDisposed) {
        summary.paused = safe(() => player.paused());
        summary.ended = safe(() => player.ended());
        summary.currentTime = safe(() => player.currentTime());
        summary.duration = safe(() => player.duration());
        summary.readyState = safe(() => player.readyState());
        summary.src = safe(() => player.currentSrc());
        const error = safe(() => player.error());
        summary.error = error ? { code: error.code, message: error.message } : undefined;
    }
    return compact(summary);
}

/**
 * A schedule / input layout entry. These are mostly plain data, so keep every
 * primitive field and the raw schedule attributes; only object references
 * (a parsed XLF document, ad payloads, functions) and the XLF text are left out.
 */
export function inputLayoutSummary(layout: Loose) {
    if (!layout) return layout ?? null;
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(layout)) {
        if (key === 'xlfString') continue;
        if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
            out[key] = value;
        }
    }
    if (layout.response?.$) out.schedule = { ...layout.response.$ };
    if (layout.ad) out.hasAd = true;
    return out;
}

export function layoutListSummary(layouts: Iterable<Loose> | null | undefined) {
    if (!layouts) return layouts ?? null;
    return Array.from(layouts, inputLayoutSummary);
}

/**
 * An error's useful parts. Its message and stack are not enumerable, so logged
 * whole they are lost when the player serialises logs; an axios error instead
 * carries its whole request and response. Keep the text, code and, for HTTP
 * failures, the method, URL, status and start of the body. The stack is left
 * out: logs reach the CMS, and it exposes install paths and source file names.
 */
export function errorSummary(err: unknown): Record<string, any> | string {
    if (!err || typeof err !== 'object') return String(err);
    const e = err as Record<string, any>;
    const body = e.response?.data;
    const bodyText = body === undefined || body === null ? undefined
        : (typeof body === 'string' ? body : safe(() => JSON.stringify(body)) ?? String(body));
    return compact({
        name: e.name,
        message: e.message,
        code: e.code,
        method: e.config?.method ? String(e.config.method).toUpperCase() : undefined,
        url: e.config?.url,
        status: e.response?.status ?? e.status,
        responseData: bodyText && bodyText.length > 300 ? bodyText.slice(0, 300) + '…' : bodyText,
    });
}

/** XLR loop state: which layout is playing, what is queued and whether the loop is updating */
export function xlrSummary(xlr: Loose) {
    if (!xlr) return xlr ?? null;
    return compact({
        currentLayoutId: xlr.currentLayout?.layoutId,
        currentLayoutIndex: xlr.currentLayoutIndex,
        currentContainer: xlr.currentLayout?.containerName,
        nextLayoutId: xlr.nextLayout?.layoutId,
        nextContainer: xlr.nextLayout?.containerName,
        isUpdatingLoop: xlr.isUpdatingLoop,
        isSspEnabled: xlr.isSspEnabled || undefined,
        inputLayoutIds: Array.isArray(xlr.inputLayouts) ? xlr.inputLayouts.map((l: Loose) => l?.layoutId) : undefined,
        preloadDueInMs: typeof xlr.preloadDueAt === 'number' && isFinite(xlr.preloadDueAt)
            ? Math.round(xlr.preloadDueAt - Date.now()) : undefined,
    });
}
