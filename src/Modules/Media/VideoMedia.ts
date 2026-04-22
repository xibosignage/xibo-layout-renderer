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
import Player from "video.js/dist/types/player";

import { IMedia } from '../../Types/Media';
import {capitalizeStr, videoFileType, getFileExt, getMediaId, playerReportFault, FaultCodes} from '../Generators';
import {ConsumerPlatform, IXlr} from '../../types';

import './media.css';

export function composeVideoSource($media: HTMLVideoElement, media: IMedia) {
    // const videoSrc = await preloadMediaBlob(media.url as string, media.mediaType as MediaTypes);
    const vidType = videoFileType(getFileExt(media.uri)) as string;

    if (!vidType) {
        console.warn(`XLR >> VideoMedia: Unsupported video type for media ${media.id} with uri ${media.uri}`);
        return $media;
    }

    // Only add one source per type
    if ($media.querySelectorAll(`source[type="${vidType}"]`).length === 0) {
        const $videoSource = document.createElement('source');
    
        $videoSource.src = media.url as string;
        $videoSource.type = vidType;
    
        $media.insertBefore($videoSource, $media.lastElementChild);
    }

    return $media;
}

export const defaultVjsOpts = {
    autoplay: false,
    muted: true, // Start muted to allow autoplay policies
    preload: 'auto',
    controls: false,
};

export const vjsDefaultOptions = (opts?: any) => ({
    controls: false,
    preload: 'auto',
    autoplay: false,
    muted: true,
    ...opts,
});

export interface IVideoMediaHandler {
    player: Player | undefined;
    duration: number;
    init(): void;
    play(): void;
    stop(disposeOnly?: boolean): void;
}

export const reportToPlayerPlatform = [
    ConsumerPlatform.CHROMEOS,
    ConsumerPlatform.ELECTRON,
];

export function VideoMedia(media: IMedia, xlr: IXlr) {
    let stopped = false;
    const mediaId = getMediaId(media);

    // ── Stall watchdog (closure-level so stop() can cancel it) ───────────────
    // 'waiting' and 'stalled' fire when the browser stops receiving data.
    // Unlike codec or source errors they do NOT fire the 'error' event, so
    // without a watchdog the video silently freezes for its entire duration.
    let stallWatchdog: ReturnType<typeof setTimeout> | undefined;
    const STALL_TIMEOUT_MS = 10_000;

    const clearStallWatchdog = () => {
        if (stallWatchdog !== undefined) {
            clearTimeout(stallWatchdog);
            stallWatchdog = undefined;
        }
    };
    // ─────────────────────────────────────────────────────────────────────────

    // ── Unified error → report → stop helper (closure-level) ─────────────────
    // Used by both the 'error' event and the play Promise catch.
    // playerReportFault only fires for platforms that report faults (Electron,
    // ChromeOS). All other platforms just advance to the next media via stop().
    const reportAndStop = (reason: string, code: number) => {
        if (stopped) return;
        if (reportToPlayerPlatform.includes(xlr.config.platform)) {
            playerReportFault(reason, media, code).then(() => videoPlayer.stop());
        } else {
            videoPlayer.stop();
        }
    };
    // ─────────────────────────────────────────────────────────────────────────

    const videoPlayer = {
        player: undefined as Player | undefined,
        duration: 0,
        init: function () {
            let triggerTimeUpdate = false; // Used for media.duration === 0

            videoPlayer.duration = media.duration;

            const vjsPlayer = videojs(mediaId);
            if (vjsPlayer) {
                videoPlayer.player = vjsPlayer;

                // ── Early source check ────────────────────────────────────────────────
                // Two-step check before video.js tries to load anything:
                // 1. Is the file extension one we map to a MIME type?
                // 2. Can the browser actually play that MIME type?
                // Failing either step skips the media immediately so video.js
                // never renders its "No compatible source" error overlay.
                const vidType = videoFileType(getFileExt(media.uri));
                if (!vidType) {
                    console.warn(`XLR >> VideoMedia: unrecognised file extension for media ${media.id} (uri: ${media.uri})`);
                    reportAndStop(`Unsupported video file extension for media ${media.id}`, FaultCodes.FaultVideoSource);
                    return;
                }
                if (document.createElement('video').canPlayType(vidType) === '') {
                    console.warn(`XLR >> VideoMedia: browser cannot play type "${vidType}" for media ${media.id}`);
                    reportAndStop(`Browser cannot play video type "${vidType}" for media ${media.id}`, FaultCodes.FaultVideoSource);
                    return;
                }
                // ─────────────────────────────────────────────────────────────────────

                const armStallWatchdog = () => {
                    clearStallWatchdog();
                    stallWatchdog = setTimeout(() => {
                        if (stopped) return;
                        console.warn(`XLR >> VideoMedia: stall timeout on media ${media.id}`);
                        reportAndStop('Video stall timeout', FaultCodes.FaultVideoUnexpected);
                    }, STALL_TIMEOUT_MS);
                };

                vjsPlayer.on('waiting', armStallWatchdog);
                vjsPlayer.on('stalled', armStallWatchdog);
                vjsPlayer.on('playing', clearStallWatchdog);
                vjsPlayer.on('ended', clearStallWatchdog);

                vjsPlayer.on('loadedmetadata', () => {
                    if (media.duration === 0) {
                        videoPlayer.duration = vjsPlayer.duration() as number;
                    }

                    console.debug('??? XLR.debug >> VideoMedia: loadedmetadata: Setting video duration to = ' + videoPlayer.duration);
                });

                vjsPlayer.on('canplay', () => {
                    console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} can be played . . .`);
                });

                vjsPlayer.on('playing', () => {
                    // Update duration
                    if (videoPlayer.duration === 0) {
                        videoPlayer.duration = vjsPlayer.duration() as number;
                    }

                    console.debug('??? XLR.debug >> VideoMedia: playing: Showing Media ' +
                      media.id + ' for ' + videoPlayer.duration + 's of Region ' + media.region.regionId);
                    console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} is now playing . . .`);
                });

                // @NOTE: When video is paused due to fail in unmuting the video
                // and video has media.duration = 0, the video will stay paused and the video cycle won't end
                // @TODO: Add timer when video is paused due to unmuting fail and duration that is equal to 0
                // @NOTE: The pause issue when unmuting the video is mainly on a browser level.
                // Please visit https://developer.chrome.com/blog/autoplay/ for more info.

                vjsPlayer.ready(() => {
                    // Add guard making sure that video element is present
                    const videoElem = document.querySelector(`.media--item.${mediaId}`);
                    if (!document.body.contains(videoElem)) {
                        media.emitter.emit('cancelled', media);
                        return;
                    }

                    if (vjsPlayer !== undefined) {
                        vjsPlayer.muted(true);

                        // Race promise between a 0.5s play and a 5s skip
                        Promise.race([
                            new Promise((resolve, reject) => setTimeout(async () => {
                                console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Trying to force play after 0.1 seconds`);
                                // Try to force play here
                                try {
                                    if (vjsPlayer.currentTime() === 0) {
                                        // Set video mute/unmute based on setting once playing
                                        vjsPlayer.muted(media.muted);

                                        await vjsPlayer.play();
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
                              console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Autoplay started`);
                          })
                          .catch((error) => {
                                if (stopped) return;

                                if (error === 'Timeout') {
                                    console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Promise not resolved within 5 seconds. Move to next media`);
                                    // Timeout is a scheduling issue, not a media fault — just advance
                                    videoPlayer.stop();
                                } else {
                                    console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Autoplay error: ${error}`);
                                    reportAndStop('Media autoplay error', FaultCodes.FaultVideoUnexpected);
                                }
                          });

                        // Optional: Reset the flag automatically when a new video loads or the source changes
                        vjsPlayer.on('loadstart', function() {
                            console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} has started loading data . . .`);
                            triggerTimeUpdate = false;
                        });

                        if (media.duration === 0) {
                            vjsPlayer.on('timeupdate', function() {
                                const preloadBufferTimeMs = 2000;
                                const mediaDuration = vjsPlayer.duration();
                                const currentTime = vjsPlayer.currentTime();
                                const regionHasMultipleMedia = media.region.totalMediaObjects > 1;
                                let remainingTimeMs = 0;

                                if (mediaDuration !== undefined && currentTime !== undefined) {
                                    remainingTimeMs = (mediaDuration - currentTime) * 1000;
                                }
                                
                                if (regionHasMultipleMedia && !triggerTimeUpdate &&
                                    (remainingTimeMs === 0 || remainingTimeMs <= preloadBufferTimeMs)
                                ) {
                                    // Check if remaining time is less than preloadBufferTimeMs and the action hasn't been triggered yet
                                    console.log('Less than preloadBufferTimeMs remaining! Do something now.');
                                    media.region.prepareNextMedia();

                                    triggerTimeUpdate = true; // Set the flag to prevent re-triggering
                                }

                                // Reset the flag if the user seeks back to a point where more than preloadBufferTimeMs remain
                                if (remainingTimeMs > preloadBufferTimeMs) {
                                    triggerTimeUpdate = false;
                                }
                            });
                        }
                    }
                });
                vjsPlayer.on('error', () => {
                    if (stopped) return;
                    clearStallWatchdog();

                    // Extract the actual MediaError so the fault message is
                    // meaningful: code 2 = network, 3 = decode, 4 = not supported.
                    const vjsError = vjsPlayer.error();
                    const reason = vjsError
                        ? `Video error (code ${vjsError.code}): ${vjsError.message}`
                        : 'Unknown video error';

                    console.warn(`XLR >> VideoMedia: error on media ${media.id}`, vjsError);
                    reportAndStop(reason, FaultCodes.FaultVideoUnexpected);
                });

                if (media.duration === 0) {
                    vjsPlayer.on('ended', () => {
                        console.debug(`??? XLR.debug >> VideoMedia: onended: ${capitalizeStr(media.mediaType)} for media > ${media.id} has ended playing . . .`);
                        this.stop();
                    });
                }
            }
        },
        stop: function(disposeOnly = false) {
            clearStallWatchdog();

            const vjsPlayer = media.player;

            console.debug('??? XLR.debug >> VideoMedia::stop', {
                vjsPlayer,
                isDisposed: vjsPlayer?.isDisposed(),
                el: vjsPlayer?.el(),
            });

            // Expire the media and dispose the video
            if (vjsPlayer !== undefined && !vjsPlayer.isDisposed()) {
                if (!disposeOnly) {
                    media.emitter.emit('end', media);
                }

                vjsPlayer.dispose();

                // Clear up media player
                media.player = undefined;
                media.html = null;
            } else {
                media.player = undefined;
                media.html = null;

                if (!disposeOnly) {
                    media.emitter.emit('end', media);
                }
            }
            stopped = true;
        },
        play: function() {
            const vjsPlayer = videojs(mediaId);
            if (vjsPlayer !== undefined) {
                vjsPlayer.play()
                  ?.catch(async (error) => {
                      if (error === 'Timeout') {
                          console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Promise not resolved within 5 seconds. Move to next media`);
                          this.stop();
                      } else {
                          console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Autoplay error: ${error}`);
                          if (reportToPlayerPlatform.includes(xlr.config.platform)) {
                              playerReportFault('Media autoplay error', media)
                                .then(() => {
                                    this.stop();
                                });
                          }
                      }
                  })
            }
        },
    }

    return videoPlayer;
}
