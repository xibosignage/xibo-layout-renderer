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
import videojs from 'video.js';
import {format} from "date-fns";

import {capitalizeStr, videoFileType, getFileExt, setExpiry, getMediaId} from '../Generators';
import {IXlr, OptionsType} from '../../types';
import PwaSW from '../../Lib/pwa-sw';

import './media.css';
import {createNanoEvents, Emitter, Unsubscribe} from "nanoevents";
import Player from "video.js/dist/types/player";
import {Region} from "../Region";
import {MediaState} from "../../Types/Media/Media.types";
import {AudioMedia} from "./AudioMedia";
import {Media} from "./Media";
import {getVideoJsWrapper, isVideoJsInitialized} from "../../Lib/dom";
import {compassPoints, flyTransitionKeyframes, transitionElement, TransitionElementOptions} from "../Transitions";

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
            console.debug('Media::Emitter > Start - Calling widgetStart event', {
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
                    this.player?.pause();
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
            console.debug('Media::Emitter > End - Calling widgetEnd event', {
                mediaId: this.id,
                regionId: this.region?.id,
                layoutId: this.region?.layout?.id,
            });
            this.xlr.emitter.emit('widgetEnd', parseInt(this.id));

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
                    this.disposePlayer();
                    this.emitter.emit('end');
                }, 5000);
            }
        })
    }

    private isInitialized(): boolean {
        return isVideoJsInitialized(this.html as HTMLElement);
    }

    private getWrapper(): HTMLElement {
        return getVideoJsWrapper(this.html as HTMLElement);
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
        console.debug('VideoMedia::initPlayer >> Initializing video player');

        this.player = videojs(this.html as Element, {
            autoplay: false,
            muted: true,
            controls: false,
        })

        this.player.on('ready', () => {
            // Race promise between a 0.5s play and a 5s skip
            Promise.race([
                new Promise((resolve, reject) => setTimeout(async () => {
                    console.debug(`VideoMedia: ${capitalizeStr(this.mediaType)} for media > ${this.id} : Trying to force play after 0.1 seconds`);
                    // Try to force play here
                    try {
                        // Set video mute/unmute based on setting once playing
                        this.player?.muted(this.muted);

                        console.debug('VideoMedia::ready >> Video will play for ' +
                            (this.duration > 0 ? this.duration : this.mediaDuration) +
                            ' seconds'
                        );

                        // Let's put a manual stop of the video when duration is set
                        if (this.duration > 0 && this.mediaDuration > this.duration) {
                            setTimeout(() => {
                                this.player?.pause();
                                this.player?.currentTime(0);

                                // Manually trigger ended event
                                this.player?.trigger('ended');
                            }, this.duration * 1000)
                        }
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
                console.debug(`VideoMedia: ${capitalizeStr(this.mediaType)} for media > ${this.id} : Autoplay started`);
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
            console.debug('VideoMedia::initPlayer >> player.play()');
            this.emitter.emit("start");
        });

        // "ended" triggers reliably when playback finishes
        this.player.on("ended", () => {
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
        if (!this.player) this.initPlayer();

        if (this.player?.currentSrc() === media.url) return;
        console.debug('VideoMedia::prepare >> currentSrc() === media.url', {
            currentSrc: this.player?.currentSrc(),
            mediaUrl: media.url,
        })

        // Wait until video.js has wrapped the element
        await this.waitForWrapper();
        console.debug('VideoMedia::prepare >> Done waiting for wrapper');

        await new Promise<void>((resolve, reject) => {
            const player = this.player;
            if (!player) return reject('Video player not initialized');

            const onMeta = () => {
                this.mediaDuration = player.duration() as number;

                console.debug('VideoMedia::prepare >> onMeta - loadedmetadata', {
                    player,
                })
                player.off('error', onErr);
                resolve();
            };

            const onErr = () => {
                console.debug('VideoMedia::prepare >> onErr - error');
                player.off('loadedmetadata', onMeta);
                reject(player.error());
            };

            player!.one('loadedmetadata', onMeta);
            player!.one('error', onErr);

            const videoType = videoFileType(getFileExt(media.uri)) || 'video/mp4';
            player!.src({ src: media.url, type: videoType as string })
        })
    }

    override run() {
        let transInDuration = 1;
        let transInDirection: compassPoints = 'E';

        if (Boolean(this.options['transinduration'])) {
            transInDuration = Number(this.options.transinduration);
        }

        if (Boolean(this.options['transindirection'])) {
            transInDirection = this.options.transindirection;
        }

        let defaultTransInOptions: TransitionElementOptions = {duration: transInDuration};
        let transIn = transitionElement('defaultIn', {duration: defaultTransInOptions.duration});

        if (Boolean(this.options['transin'])) {
            let transInName = this.options['transin'];

            if (transInName === 'fly') {
                transInName = `${transInName}In`;
                defaultTransInOptions.keyframes = flyTransitionKeyframes({
                    trans: 'in',
                    direction: transInDirection,
                    height: this.divHeight,
                    width: this.divWidth,
                });
            }

            transIn = transitionElement(transInName, defaultTransInOptions);
        }

        const getNewMedia = (): HTMLElement | null => {
            const $region = document.getElementById(`${this.region.containerName}`);
            // This function is for checking whether
            // the region still has to show a media item
            // when another region is not finished yet
            if (this.region && this.region.complete && !this.region.layout?.allEnded) {
                // Add currentMedia to the region

                ($region) && $region.insertBefore(this.html as Node, $region.lastElementChild);

                return this.html as HTMLElement;
            }

            return null;
        };

        const showCurrentMedia = async () => {
            let $media = document.getElementById(this.containerName);
            const isCMS = this.xlr.config.platform === 'CMS';

            if (!$media) {
                $media = getNewMedia();
            }

            if ($media) {
                if (Boolean(this.options['transin'])) {
                    $media.animate(transIn.keyframes, transIn.timing);

                    // await this.play(this);
                }
            }
        }
    }
    /** Called when region activates media */
    async play(media: VideoMedia) {
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

    private show() {
        const wrapper = this.getWrapper();
        console.debug('VideoMedia::show', {
            wrapper,
        })

        wrapper!.style.display = "block";

        this.html!.style.display = "block";
    }

    override clone() {
        return new VideoMedia(
            this.region,
            this.mediaId,
            this.xml as Element,
            this.options,
            this.xlr,
        );
    }

    stopAndEnd() {
        this.stop();
        this.disposePlayer();
        this.emitter.emit('end');
    }
}
