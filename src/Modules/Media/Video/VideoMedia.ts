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
import videojs  from "video.js";
import VideoJsPlayer from 'video.js/dist/types/player';
import {createNanoEvents} from "nanoevents";
import {VideoMediaItem} from "../../../Types/Media/Media.types";

export type VideoEvents = {
    start: { regionId: string; mediaId?: string; src: string };
    end: { regionId: string; mediaId?: string; src: string };
    error: { regionId: string; mediaId?: string; src: string; error: any };
};

export type VideoMediaRendererConfig = {
    regionId: string;
    warmDecoder?: boolean;       // briefly play/pause to warm decoder
    lowMemoryMode?: boolean;     // unload src when not needed
    debug?: boolean;
};
export class VideoMediaRenderer {
    private container: HTMLElement;
    private regionId: string;
    private config: Required<VideoMediaRendererConfig>;
    private videoEl: HTMLVideoElement;
    private player: VideoJsPlayer;
    private preparedItem?: VideoMediaItem;
    private emitter = createNanoEvents<VideoEvents>();
    private destroyed = false;

    constructor(container: HTMLElement, cfg: VideoMediaRendererConfig) {
        this.container = container;
        this.regionId = cfg.regionId;
        this.config = {
            warmDecoder: cfg.warmDecoder ?? true,
            lowMemoryMode: cfg.lowMemoryMode ?? false,
            debug: cfg.debug ?? false,
            regionId: cfg.regionId,
        };

        this.videoEl = this.createVideoElement();
        this.player = this.createPlayer(this.videoEl);
    }

    // ---------- PUBLIC API ----------

    on<E extends keyof VideoEvents>(
        event: E,
        cb: VideoEvents[E],
    ) {
        return this.emitter.on(event, cb);
    }

    // async prepare(item: VideoMediaItem): Promise<void> {
    //     if (this.destroyed) throw new Error("VideoMediaRenderer destroyed");
    //     this.preparedItem = item;
    //
    //     this.log("prepare", item.src);
    //
    //     this.player.pause();
    //     this.player.src({ src: item.src, type: item.type || "video/mp4" });
    //     this.player.load();
    //
    //     this.videoEl.muted = item.muted ?? true;
    //     if (item.poster) this.videoEl.poster = item.poster;
    //
    //     if (this.config.warmDecoder && !this.config.lowMemoryMode) {
    //         await this.player.ready();
    //         try {
    //             await this.player.play();
    //         } catch {}
    //         this.player.pause();
    //         if (item.startAt) this.player.currentTime(item.startAt);
    //     }
    //
    //     this.videoEl.style.visibility = "hidden";
    // }
    //
    // async activatePrepared(seekTo?: number) {
    //     if (!this.preparedItem) return;
    //
    //     const item = this.preparedItem;
    //     this.preparedItem = undefined;
    //
    //     try {
    //         if (seekTo !== undefined) {
    //             this.player.currentTime(seekTo);
    //         } else if (item.startAt) {
    //             this.player.currentTime(item.startAt);
    //         }
    //     } catch {}
    //
    //     try {
    //         await this.player.play();
    //     } catch (err) {
    //         this.emitError(err);
    //     }
    //
    //     this.videoEl.style.visibility = "visible";
    // }
    //
    // hideAndPause() {
    //     this.videoEl.style.visibility = "hidden";
    //     this.player.pause();
    //
    //     if (this.config.lowMemoryMode) {
    //         this.player.src({ src: "", type: "" });
    //         this.player.load();
    //     }
    // }
    //
    // dispose() {
    //     if (this.destroyed) return;
    //     this.destroyed = true;
    //
    //     this.player.dispose();
    //     this.videoEl.remove();
    // }

    // ---------- INTERNALS ----------

    private createVideoElement() {
        const el = document.createElement("video");
        el.setAttribute("playsinline", "");
        el.muted = true;
        el.preload = "auto";

        el.style.position = "absolute";
        el.style.inset = "0";
        el.style.width = "100%";
        el.style.height = "100%";
        el.style.objectFit = "cover";
        el.style.transform = "translateZ(0)";
        el.style.willChange = "transform, opacity";
        el.style.visibility = "hidden";

        this.container.appendChild(el);
        return el;
    }

    private createPlayer(el: HTMLVideoElement) {
        const player = videojs(el, {
            autoplay: false,
            muted: true,
            controls: false,
            preload: "auto",
            userActions: { click: false, doubleClick: false },
        });

        player.on("playing", () => this.emitStart());
        player.on("ended", () => this.emitEnd());
        player.on("error", () => this.emitError(player.error()));

        return player;
    }

    private emitStart() {
        if (!this.preparedItem) return;
        // this.emitter.emit("start", {
        //     regionId: this.regionId,
        //     mediaId: this.preparedItem?.id,
        //     src: this.preparedItem?.src || "",
        // });
    }

    private emitEnd() {
        // this.emitter.emit("end", {
        //     regionId: this.regionId,
        //     mediaId: this.preparedItem?.id,
        //     src: this.preparedItem?.src ?? "",
        // });
    }

    private emitError(err: any) {
        const item = this.preparedItem;
        // this.emitter.emit("error", {
        //     regionId: this.regionId,
        //     mediaId: item?.id,
        //     src: item?.src ?? "",
        //     error: err,
        // });
    }

    private log(...args: any[]) {
        if (this.config.debug) {
            console.log("[VideoMediaRenderer][" + this.regionId + "]", ...args);
        }
    }
}