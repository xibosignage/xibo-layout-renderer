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
import {format} from "date-fns";

import {
    capitalizeStr,
    getMediaId,
    preloadMediaBlob,
    MediaTypes,
    videoFileType,
    getFileExt,
    setExpiry,
    nextId, composeResourceUrlByPlatform, composeResourceUrl, composeMediaUrl
} from '../Generators';
import {IXlr, OptionsType} from '../../types';
import PwaSW from '../../Lib/pwa-sw';

import './media.css';
import {IMediaEvents, Media} from "./Media";
import VideoJsPlayer from "video.js/dist/types/player";
import {createNanoEvents, Emitter} from "nanoevents";
import Player from "video.js/dist/types/player";
import {Region} from "../Region";
import {MediaState} from "../../Types/Media/Media.types";
import videojs from "video.js";


export type VideoEvents = {
    start: { regionId: string; mediaId?: string; src: string };
    end: { regionId: string; mediaId?: string; src: string };
    error: { regionId: string; mediaId?: string; src: string; error: any };
};

export function composeVideoSource($media: HTMLVideoElement, media: Media) {
    // const videoSrc = await preloadMediaBlob(media.url as string, media.mediaType as MediaTypes);
    const vidType = videoFileType(getFileExt(media.uri)) as string;

    // Only add one source per type
    if ($media.querySelectorAll(`source[type="${vidType}"]`).length === 0) {
        const $videoSource = document.createElement('source');
    
        $videoSource.src = media.url as string;
        $videoSource.type = vidType;
    
        $media.insertBefore($videoSource, $media.lastElementChild);
    }

    return $media;
}

export class VideoMedia {
    attachedAudio: boolean = false;
    checkIframeStatus: boolean = false;
    containerName: string = '';
    divHeight: number = 0;
    divWidth: number = 0;
    duration: number = 0;
    emitter: Emitter<VideoEvents> = createNanoEvents<VideoEvents>();
    enableStat: boolean = false;
    fileId: string = '';
    finished: boolean = false;
    html: HTMLVideoElement | null = null;
    id: string = '';
    idCounter: number = 0;
    iframe: HTMLIFrameElement | null = null;
    iframeName: string = '';
    index: number = 0;
    loadIframeOnRun: boolean = false;
    loop: boolean = false;
    mediaId: string = '';
    mediaType: string = '';
    muted?: boolean = false;
    options: OptionsType & {
        [k: string]: any;
    } = <OptionsType>{};
    player?: Player = undefined;
    ready: boolean = true;
    region?: Region;
    render: string = 'html';
    schemaVersion: string = '1';
    singlePlay: boolean = false;
    state: MediaState = MediaState.IDLE;
    tempSrc: string = '';
    timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {}, 0);
    type: string = '';
    uri: string = '';
    url: string | null = null;
    useDuration: boolean = false;
    xml: Element | null = null;

    private mediaTimer: ReturnType<typeof setInterval> | undefined;
    private mediaTimeCount = 0;
    private xlr: IXlr = <IXlr>{};
    private readonly statsBC = new BroadcastChannel('statsBC');

    constructor(
        region: Region,
        mediaId: string,
        xml: Element,
        options: OptionsType,
        xlr: IXlr
    ) {
        this.region = region;
        this.id = mediaId;
        this.mediaId = this.id;
        this.xml = xml;
        this.options = options;
        this.xlr = xlr;

        this.fileId = this.xml?.getAttribute('fileId') || '';
        this.idCounter = nextId(this.options);
        this.containerName = `M-${this.id}-${this.idCounter}`;
        this.iframeName = `${this.containerName}-iframe`;
        this.mediaType = this.xml?.getAttribute('type') || '';
        this.render = this.xml?.getAttribute('render') || '';
        this.duration = parseInt(this.xml?.getAttribute('duration') as string) || 0;
        this.enableStat = Boolean(this.xml?.getAttribute('enableStat') || false);

        this.init();

        this.html = this.createVideoElement();
        this.player = this.createPlayer(this.html);
    }

    on<E extends keyof VideoEvents>(
        event: E,
        cb: VideoEvents[E]
    ) {
        return this.emitter.on(event, cb);
    }

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

        const $region = document.getElementById(`${this.containerName}`);

        if ($region) {
            $region.appendChild(el);
        }
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
        // if (!this.preparedItem) return;
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
        // const item = this.preparedItem;
        // this.emitter.emit("error", {
        //     regionId: this.regionId,
        //     mediaId: item?.id,
        //     src: item?.src ?? "",
        //     error: err,
        // });
    }

    private log(...args: any[]) {
        // if (this.config.debug) {
        //     console.log("[VideoMediaRenderer][" + this.regionId + "]", ...args);
        // }
    }

    private init() {
        const mediaOptions = this.xml?.getElementsByTagName('options');

        if (mediaOptions) {
            for (let _options of Array.from(mediaOptions)) {
                // Get options
                const _mediaOptions = _options.children;
                for (let mediaOption of Array.from(_mediaOptions)) {
                    this.options[mediaOption.nodeName.toLowerCase()] = mediaOption.textContent;
                }
            }
        }

        // Check for options.uri and add it to media
        if (Boolean(this.options['uri'])) {
            this.uri = this.options['uri'];
        }

        // Show in fullscreen?
        if(this.options.showfullscreen === "1") {
            // Set dimensions as the layout ones
            this.divWidth = this.region?.layout?.sWidth || 0;
            this.divHeight = this.region?.layout?.sHeight || 0;
        } else {
            // Set dimensions as the region ones
            this.divWidth = this.region?.sWidth || 0;
            this.divHeight = this.region?.sHeight || 0;
        }

        const resourceUrlParams: Record<string, any> = {
            ...this.xlr.config.config,
            regionOptions: this.region?.options,
            layoutId: this.region?.layout?.layoutId,
            regionId: this.region?.id,
            mediaId: this.id,
            fileId: this.fileId,
            scaleFactor: this.region?.layout?.scaleFactor,
            uri: this.uri,
            isGlobalContent: this.mediaType === 'global',
            isImageOrVideo: true,
        };

        resourceUrlParams.mediaType = this.mediaType;

        let tmpUrl = '';

        if (this.xlr.config.platform === 'CMS') {
            tmpUrl = composeResourceUrlByPlatform(this.xlr.config, resourceUrlParams);
        } else if (this.xlr.config.platform === 'chromeOS') {
            tmpUrl = composeMediaUrl(resourceUrlParams);

            // this is an SSP Layout
            if (this.region?.layout?.layoutId === -1) {
                tmpUrl = this.uri;
            }
        }

        this.url = tmpUrl;

        // Loop if media has loop, or if region has loop and a single media
        this.loop =
            this.options['loop'] == '1' ||
            (this.region?.options['loop'] == '1' && this.region?.totalMediaItems == 1);
    }


    async playerReportFault(msg: string) {
        // Immediately expire media and report a fault
        const playerSW = PwaSW();
        const hasSW = await playerSW.getSW();

        if (hasSW) {
            playerSW.postMsg({
                type: 'MEDIA_FAULT',
                code: 5002,
                reason: msg,
                mediaId: this.id,
                regionId: this.region?.id,
                layoutId: this.region?.layout?.id,
                date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                // Temporary setting
                expires: format(new Date(setExpiry(1)), 'yyyy-MM-dd HH:mm:ss'),
            }).finally(() => {
                this.stop();
            });
        } else {
            this.stop();
        }
    };

    //
    // init() {
    //     const vjsPlayer = this.media.player;
    //
    //     this.duration = this.media.duration;
    //
    //     if (vjsPlayer !== undefined) {
    //         vjsPlayer.on('loadstart', () => {
    //             console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} has started loading data . . .`);
    //         });
    //
    //         vjsPlayer.one('loadedmetadata', () => {
    //             if (media.duration === 0) {
    //                 this.duration = vjsPlayer.duration() as number;
    //             }
    //
    //             console.debug('VideoMedia: loadedmetadata: Setting video duration to = ' + this.duration);
    //         });
    //
    //         vjsPlayer.one('canplay', () => {
    //             console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} can be played . . .`);
    //         });
    //
    //         vjsPlayer.one('playing', () => {
    //             console.debug('VideoMedia: playing: Showing Media ' +
    //                 media.id + ' for ' + this.duration + 's of Region ' + media.region?.regionId);
    //             console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} is now playing . . .`);
    //         });
    //
    //         // @NOTE: When video is paused due to fail in unmuting the video
    //         // and video has media.duration = 0, the video will stay paused and the video cycle won't end
    //         // @TODO: Add timer when video is paused due to unmuting fail and duration that is equal to 0
    //         // @NOTE: The pause issue when unmuting the video is mainly on a browser level.
    //         // Please visit https://developer.chrome.com/blog/autoplay/ for more info.
    //
    //         vjsPlayer.on('ready', () => {
    //             vjsPlayer.muted(true);
    //
    //             // Race promise between a 0.5s play and a 5s skip
    //             Promise.race([
    //                 new Promise((resolve, reject) => setTimeout(async () => {
    //                     console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Trying to force play after 0.1 seconds`);
    //                     // Try to force play here
    //                     try {
    //                         // Set video mute/unmute based on setting once playing
    //                         vjsPlayer.muted(media.muted);
    //
    //                         await vjsPlayer.play();
    //                         // Resolve if play works
    //                         resolve(true);
    //                     } catch (error) {
    //                         // Reject race if play fails
    //                         reject('Play failed');
    //                     }
    //                 }, 100)),
    //                 new Promise((_, reject) => setTimeout(() => reject('Timeout'), 5000))
    //             ])
    //             .then(() => {
    //                 console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Autoplay started`);
    //             })
    //             .catch(async (error) => {
    //                 if (error === 'Timeout') {
    //                     console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Promise not resolved within 5 seconds. Move to next media`);
    //                     this.stop();
    //                 } else {
    //                     console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Autoplay error: ${error}`);
    //                     if (xlr.config.platform === 'chromeOS') {
    //                         await playerReportFault('Media autoplay error');
    //                     }
    //                 }
    //             });
    //         });
    //         vjsPlayer.on('error', async (err: any) => {
    //             console.debug(`VideoMedia: Media Error: ${capitalizeStr(media.mediaType)} for media > ${media.id}`);
    //             if (xlr.config.platform === 'chromeOS') {
    //                 await playerReportFault('Video file source not supported');
    //             } else {
    //                 // End media after 5 seconds
    //                 setTimeout(() => {
    //                     console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} has ended . . .`);
    //                     this.stop();
    //                 }, 5000);
    //             }
    //         });
    //
    //         if (media.duration === 0) {
    //             vjsPlayer.on('ended', () => {
    //                 console.debug(`VideoMedia: onended: ${capitalizeStr(media.mediaType)} for media > ${media.id} has ended playing . . .`);
    //                 this.stop();
    //             });
    //         }
    //     }
    // }

    stop(disposeOnly = false) {
        // const vjsPlayer = media.player;
        //
        // // Expire the media and dispose the video
        // if (vjsPlayer !== undefined) {
        //     if (!disposeOnly) {
        //         media.emitter.emit('end', media);
        //     }
        //
        //     vjsPlayer.dispose();
        //
        //     // Clear up media player
        //     media.player = undefined;
        // }
    }
}
