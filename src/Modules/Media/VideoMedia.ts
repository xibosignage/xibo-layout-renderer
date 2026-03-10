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
import {format} from "date-fns";

import { IMedia } from '../../Types/Media';
import {capitalizeStr, videoFileType, getFileExt, setExpiry, getMediaId} from '../Generators';
import {ConsumerPlatform, ELayoutState, IXlr, OptionsType} from '../../types';
import PwaSW from '../../Lib/pwa-sw';

import './media.css';
import {BlobLoader} from "../../Lib";
import {playerReportFault} from "../Generators/Generators";

export function composeVideoSource($media: HTMLVideoElement, media: IMedia) {
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
    stop(disposeOnly?: boolean): void;
}

export function videoMediaHandler(media: IMedia, platform: OptionsType['platform']): IVideoMediaHandler {
    const videoPlayer: IVideoMediaHandler = {
        player: undefined,
        duration: 0,
        stop(disposeOnly?: boolean) {
        }
    };

    const playerReportFault = async (msg: string) => {
        // Immediately expire media and report a fault
        const playerSW = PwaSW();
        const hasSW = await playerSW.getSW();
        media.region.layout.state = ELayoutState.ERROR;
        media.region.layout.errorCode = 405

        if (hasSW) {
            playerSW.postMsg({
                type: 'MEDIA_FAULT',
                code: 5002,
                reason: msg,
                mediaId: media.id,
                regionId: media.region.id,
                layoutId: media.region.layout.id,
                date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                // Temporary setting
                expires: format(new Date(setExpiry(1)), 'yyyy-MM-dd HH:mm:ss'),
            }).finally(() => {
                videoPlayer.stop();
            });
        } else {
            videoPlayer.stop();
        }
    };

    videoPlayer.duration = media.duration;

    if (media.player) {
        videoPlayer.player = media.player;
    } else {
        // Load on demand if it has not been cached
        let vjsElem: HTMLElement | string | null = media.html;
        const vidType = videoFileType(getFileExt(media.uri)) as string;

        if (vjsElem === null) {
            // Use media containerName instead for VJS id
            vjsElem = media.containerName;
        }

        videoPlayer.player = videojs(vjsElem, {
            ...defaultVjsOpts,
            sources: [{
                src: media.url,
                type: vidType,
            }],
        });
        media.player = videoPlayer.player;
    }

    videoPlayer.stop = (disposeOnly = false) => {
        // Expire the media and dispose the video
        if (videoPlayer.player !== undefined) {
            if (!disposeOnly) {
                media.emitter.emit('end', media);
            }

            // Dispose player
            videoPlayer.player.dispose();

            // Clear up media player
            videoPlayer.player = undefined;
            media.player = undefined;

        }
    };

    videoPlayer.player.on('loadstart', () => {
        console.debug(`??? XLR.debug >> VideoMedia - ${capitalizeStr(media.mediaType)} for media > ${media.id} has started loading data . . .`);
    });

    videoPlayer.player.one('loadedmetadata', () => {
        if (media.duration === 0 && videoPlayer.player !== undefined) {
            videoPlayer.duration = videoPlayer.player.duration() as number;
        }

        console.debug('??? XLR.debug >> VideoMedia - loadedmetadata: Setting video duration to = ' + videoPlayer.duration);
    });

    videoPlayer.player.one('playing', () => {
        console.debug('??? XLR.debug >> VideoMedia - playing: Showing Media ' +
          media.id + ' for ' + videoPlayer.duration + 's of Region ' + media.region.regionId);
        console.debug(`??? XLR.debug >> VideoMedia - ${capitalizeStr(media.mediaType)} for media > ${media.id} is now playing . . .`);
        (videoPlayer.player) && videoPlayer.player.muted(media.muted);
    });

    videoPlayer.player.on('error', async (err: any) => {
        console.debug(`??? XLR.debug >> VideoMedia - Media Error: ${capitalizeStr(media.mediaType)} for media > ${media.id}`);
        if (platform === 'chromeOS') {
            await playerReportFault('Video file source not supported');
        } else {
            // End media after 5 seconds
            setTimeout(() => {
                console.debug(`??? XLR.debug >> VideoMedia - ${capitalizeStr(media.mediaType)} for media > ${media.id} has ended . . .`);
                videoPlayer.stop();
            }, 5000);
        }
    });

    // Register on.("end") when media.duration is 0
    if (media.duration === 0) {
        videoPlayer.player.on('ended', () => {
            console.debug(`??? XLR.debug >> VideoMedia - onended: ${capitalizeStr(media.mediaType)} for media > ${media.id} has ended playing . . .`);
            videoPlayer.stop();
        });
    }

    return videoPlayer;
}

export function VideoMedia(media: IMedia, xlr: IXlr) {
    const vjsPlayer = videojs(getMediaId(media));
    const videoPlayer = {
        duration: 0,
        init: function () {
            let triggerTimeUpdate = false; // Used for media.duration === 0

            videoPlayer.duration = media.duration;

            if (vjsPlayer) {
                vjsPlayer.on('loadstart', () => {
                    console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} has started loading data . . .`);
                });

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
                          .catch(async (error) => {
                              if (error === 'Timeout') {
                                  console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Promise not resolved within 5 seconds. Move to next media`);
                                  this.stop();
                              } else {
                                  console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Autoplay error: ${error}`);
                                  if (xlr.config.platform === ConsumerPlatform.CHROMEOS) {
                                      playerReportFault('Media autoplay error', media)
                                        .then(() => {
                                            this.stop();
                                        });
                                  }
                              }
                          });

                        // Optional: Reset the flag automatically when a new video loads or the source changes
                        vjsPlayer.on('loadstart', function() {
                            triggerTimeUpdate = false;
                        });

                        if (media.duration === 0) {
                            vjsPlayer.on('timeupdate', function() {
                                const preloadBufferTimeMs = 2000;
                                const mediaDuration = vjsPlayer.duration();
                                const currentTime = vjsPlayer.currentTime();
                                let remainingTimeMs = 0;

                                if (mediaDuration !== undefined && currentTime !== undefined) {
                                    remainingTimeMs = (mediaDuration - currentTime) * 1000;
                                }

                                if (remainingTimeMs === 0 && !triggerTimeUpdate) {
                                    // We don't have data yet and we must immediately prepare next media
                                    media.region.prepareNextMedia();
                                } else if (remainingTimeMs <= preloadBufferTimeMs && !triggerTimeUpdate) {
                                    // Check if remaining time is less than preloadBufferTimeMs and the action hasn't been triggered yet
                                    console.log('Less than preloadBufferTimeMs remaining! Do something now.');
                                    // Prepare next media in region
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
                vjsPlayer.on('error', async (err: any) => {
                    console.debug(`??? XLR.debug >> VideoMedia: Media Error: ${capitalizeStr(media.mediaType)} for media > ${media.id}`);
                    if (xlr.config.platform === ConsumerPlatform.CHROMEOS) {
                        playerReportFault('Video file source not supported', media)
                            .then(() => {
                                this.stop();
                            });
                    } else {
                        // End media after 5 seconds
                        setTimeout(() => {
                            console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} has ended . . .`);
                            this.stop();
                        }, 5000);
                    }
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
            const vjsPlayer = media.player;

            console.debug('??? XLR.debug >> VideoMedia::stop', {
                vjsPlayer,
                isDisposed: vjsPlayer?.isDisposed_,
                el: vjsPlayer?.el_,
            });

            // Expire the media and dispose the video
            if (vjsPlayer !== undefined && !vjsPlayer.isDisposed_) {
                if (!disposeOnly) {
                    media.emitter.emit('end', media);
                }

                vjsPlayer.dispose();

                // Clear up media player
                media.player = undefined;
            } else {
                media.player = undefined;
                media.html = null;
                media.emitter.emit('end', media);
            }
        },
        play: function() {
            if (vjsPlayer) {
                vjsPlayer.play()
                  ?.catch(async (error) => {
                      if (error === 'Timeout') {
                          console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Promise not resolved within 5 seconds. Move to next media`);
                          this.stop();
                      } else {
                          console.debug(`??? XLR.debug >> VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Autoplay error: ${error}`);
                          if (xlr.config.platform === ConsumerPlatform.CHROMEOS) {
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
