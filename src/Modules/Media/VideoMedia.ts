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

import {ConsumerPlatform, IXlr, OptionsType} from '../../types';
import {capitalizeStr, videoFileType, getFileExt, setExpiry} from '../Generators';
import PwaSW from '../../Lib/pwa-sw';

import './media.css';
import {createNanoEvents, Emitter, Unsubscribe} from "nanoevents";
import {Region} from "../Region";
import {MediaState} from "../../Types/Media/Media.types";
import {Media} from "./Media";
import {getVideoJsWrapper, isVideoJsInitialized} from "../../Lib/dom";
import videojs from "video.js";

export function composeVideoSource($media: HTMLVideoElement, media: { uri: string; url: string | null; }) {
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

export type VideoMediaEvents = {
    start: () => void;
    end: () => void;
    error: (err: any) => void;
}

export class VideoMedia extends Media {
    override emitter: Emitter<VideoMediaEvents> = createNanoEvents<VideoMediaEvents>();
    private mediaDuration = 0;
    private manualEndTimerId?: NodeJS.Timeout;
    private $vidEl: HTMLElement | null = null;

    constructor(
        region: Region,
        mediaId: string,
        xml: Element,
        options: OptionsType,
        xlr: IXlr,
    ) {
        super(
            region,
            mediaId,
            xml,
            options,
            xlr,
        );
        this.$vidEl = this.html;

        this.on('start', () => {
            if (this.state === MediaState.PLAYING) return;

            this.state = MediaState.PLAYING;

            // Check if stats are enabled for the layout
            if (this.enableStat) {
                this.statsBC.postMessage({
                    action: 'START_STAT',
                    mediaId: parseInt(this.id),
                    layoutId: this.region?.layout?.id,
                    scheduleId: this.region?.layout?.scheduleId,
                    type: 'media',
                });
            }

            console.debug('VideoMedia::Emitter("start")', {
                videoMedia: this,
            })
            // Emit media/widget start event
            console.debug('VideoMedia::Emitter > Start - Calling widgetStart event', {
                mediaId: this.id,
                regionId: this.region?.id,
                layoutId: this.region?.layout?.id,
            });
            this.xlr.emitter.emit('widgetStart', parseInt(this.id));
        });

        this.on('end', () => {
            if (this.state === MediaState.ENDED) return;
            this.state = MediaState.ENDED;

            if ((this.region.activeMediaIndex + 1) === this.region.totalMediaItems &&
                this.region.totalMediaItems === 1
            ) {
                if (this.loop && !this.region.layout?.allEnded) {
                    this.region.playNextMedia();
                    return;
                } else {
                    if (this.isInitialized()) this.player?.pause();
                }
            } else {
                this.stop();
                this.disposePlayer();
            }

            // Check if stats are enabled for the layout
            if (this.enableStat) {
                this.statsBC.postMessage({
                    action: 'END_STAT',
                    mediaId: parseInt(this.id),
                    layoutId: this.region?.layout?.id,
                    scheduleId: this.region?.layout?.scheduleId,
                    type: 'media',
                });
            }

            // Emit media/widget end event
            console.debug('VideoMedia::Emitter > End - Calling widgetEnd event', {
                mediaId: this.id,
                regionId: this.region?.id,
                layoutId: this.region?.layout?.id,
            });
            this.xlr.emitter.emit('widgetEnd', parseInt(this.id));

            if (this.manualEndTimerId) {
                clearTimeout(this.manualEndTimerId);
            }

            this.region.playNextMedia();
        });

        this.on('error', async (err: any) => {
            console.debug(`VideoMedia: Media Error: ${capitalizeStr(this.mediaType)} for media > ${this.id}`);
            if (xlr.config.platform === 'chromeOS') {
                await this.playerReportFault('Video file source not supported');
            } else {
                // End media after 5 seconds
                setTimeout(() => {
                    console.debug(`VideoMedia: ${capitalizeStr(this.mediaType)} for media > ${this.id} has ended . . .`);
                    this.stop();
                    this.emitter.emit('end');
                    this.disposePlayer();
                }, 5000);
            }
        })
    }

    private isInitialized(): boolean {
        return isVideoJsInitialized(document.getElementById(this.containerName) as HTMLElement);
    }

    private getWrapper(): HTMLElement {
        return getVideoJsWrapper(document.getElementById(this.containerName) as HTMLElement);
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
                regionId: this.region.id,
                layoutId: this.region?.layout?.id,
                date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                // Temporary setting
                expires: format(new Date(setExpiry(1)), 'yyyy-MM-dd HH:mm:ss'),
            }).finally(() => {
                this.stopAndEnd();
            });
        } else {
            this.stopAndEnd();
        }
    }

    override on<E extends keyof VideoMediaEvents>(event: E, callback: VideoMediaEvents[E]): Unsubscribe {
        return this.emitter.on(event, callback);
    }

    private initPlayer() {
        console.debug('<IAK> VideoMedia::initPlayer >> Initializing video player');

        this.$vidEl = document.getElementById(this.containerName);
        this.html = this.$vidEl;

        this.player = videojs(this.html as Element, {
            autoplay: false,
            muted: true,
            controls: false,
        })

        this.player.on('ready', () => {
            // Race promise between a 0.5s play and a 5s skip
            Promise.race([
                new Promise((resolve, reject) => setTimeout(async () => {
                    console.debug(`<IAK> VideoMedia: ${capitalizeStr(this.mediaType)} for media > ${this.id} : Trying to force play after 0.1 seconds`);
                    // Try to force play here
                    try {
                        // Set video mute/unmute based on setting once playing
                        this.player?.muted(this.muted);

                        console.debug('<IAK> VideoMedia::ready >> Video will play for ' +
                            (this.duration > 0 ? this.duration : this.mediaDuration) +
                            ' seconds'
                        );
                        console.debug('<IAK> VideoMedia::ready', {
                            mediaDuration: this.mediaDuration,
                        });

                        // Resolve if play works
                        resolve(true);
                    } catch (error) {
                        // Reject race if play fails
                        reject('Play failed');
                    }
                }, 100)),
                new Promise((_, reject) => setTimeout(() => reject('Timeout'), 5000))
            ])
            .then(() => {
                console.debug(`<IAK> VideoMedia: ${capitalizeStr(this.mediaType)} for media > ${this.id} : Autoplay started`);
            })
            .catch(async (error) => {
                if (error === 'Timeout') {
                    console.debug(`VideoMedia: ${capitalizeStr(this.mediaType)} for media > ${this.id} : Promise not resolved within 5 seconds. Move to next media`);
                    this.emitter.emit('end');
                } else {
                    console.debug(`VideoMedia: ${capitalizeStr(this.mediaType)} for media > ${this.id} : Autoplay error: ${error}`);
                    if (this.xlr.config.platform === 'chromeOS') {
                        await this.playerReportFault('Media autoplay error');
                    }
                }
            });
        });

        // Hook video.js events to Nanoevents
        this.player.on("play", () => {
            console.debug('<IAK> VideoMedia::initPlayer >> player.play()');

            // Let's put a manual stop of the video when duration is set
            if (this.duration > 0 && this.mediaDuration > this.duration) {
                if (this.manualEndTimerId) clearTimeout(this.manualEndTimerId);

                this.manualEndTimerId = setTimeout(() => {
                    console.log('<IAK> VideoMedia::initPlayer >> Force end media with custom duration', {
                        customDuration: this.duration,
                        originalDuration: this.mediaDuration,
                    })

                    this.player?.pause();
                    this.player?.currentTime(0);

                    // Manually trigger ended event
                    this.player?.trigger('ended');
                }, this.duration * 1000)
            }

            this.emitter.emit("start");
        });

        this.player.on('playing', () => {
            console.debug('<IAK> VideoMedia::initPlayer >> player.playing()', {
                currentTime: this.player?.currentTime(),
            })
        })

        // "ended" triggers reliably when playback finishes
        this.player.on("ended", () => {
            console.debug('<IAK> VideoMedia::initPlayer >> player.on("ended")')
            this.emitter.emit("end");
        });
        // Media/tech errors
        this.player.on("error", () => {
            this.emitter.emit("error", this.player?.error());
        });
    }

    private async waitForWrapper(): Promise<void> {
        // Video.js wrapper appears asynchronously
        if (this.isInitialized()) return;

        // Wait until wrapper exists
        await new Promise<void>((resolve) => {
            const check = () => {
                if (this.isInitialized()) resolve();
                else requestAnimationFrame(check);
            };
            check();
        });
    }

    async prepare(media: VideoMedia) {
        // Wait until video.js has wrapped the element
        await this.waitForWrapper();

        if (!this.player) this.initPlayer();

        if (this.player?.currentSrc() === media.url) return;
        console.debug('<IAK> VideoMedia::prepare >> currentSrc() === media.url', {
            currentSrc: this.player?.currentSrc(),
            mediaUrl: media.url,
        })

        console.debug('<IAK> VideoMedia::prepare >> Done waiting for wrapper');

        await new Promise<void>((resolve, reject) => {
            if (!this.player) {
                // return reject('Video player not initialized');
                // try to initialize player
                this.initPlayer();
            }
            let player = this.player;

            const onMeta = () => {
                this.mediaDuration = player!.duration() as number;

                console.debug('<IAK> VideoMedia::prepare >> onMeta - loadedmetadata', {
                    player,
                })
                player!.off('error', onErr);
                resolve();
            };

            const onErr = () => {
                console.debug('<IAK> VideoMedia::prepare >> onErr - error');
                player!.off('loadedmetadata', onMeta);
                reject(player!.error());
            };

            player!.one('loadedmetadata', onMeta);
            player!.one('error', onErr);

            const videoType = videoFileType(getFileExt(media.uri)) || 'video/mp4';
            player!.src({ src: media.url, type: videoType as string })
        })
    }

    /** Called when region activates media */
    async play(media: VideoMedia) {
        console.debug('<IAK> VideoMedia::play()');
        // Ensure metadata is prepared
        await this.prepare(media);

        // Ensure wrapper exists before showing
        await this.waitForWrapper();
        this.show();

        this.player!.currentTime(0);

        try {
            await this.player!.play();
        } catch (err) {
            this.emitter.emit("error", err);
        }
    }

    override async stop() {
        if (this.player) {
            try {
                this.player.pause();
            } catch (_) {}
        }
        this.hide();
    }

    disposePlayer() {
        if (this.player) {
            this.player.dispose();
            this.player = null;
        }
    }

    private hide() {
        const wrapper = this.getWrapper();
        wrapper!.style.display = "none";
    }

    override show() {
        const wrapper = this.getWrapper();
        console.debug('VideoMedia::show', {
            wrapper,
        })

        wrapper!.style.display = "block";

        this.$vidEl!.style.display = "block";
    }

    public override clone(): VideoMedia {
        return new VideoMedia(
            this.region,
            this.mediaId,
            this.xml as Element,
            this.options,
            this.xlr,
        );
    }

    stopAndEnd() {
        console.debug('<IAK> VideoMedia::stopAndEnd >> state', this.state);

        // Only proceed when last known state is "playing"
        if (this.state !== MediaState.PLAYING) return;

        this.stop();
        if (this.player) {
            this.player.trigger('ended');
            this.disposePlayer();
        }
    }
}
