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

import {IMedia} from '../../Types/Media';
import {
    capitalizeStr,
    getFileExt,
    setExpiry,
    videoFileType
} from '../Generators';
import {ConsumerPlatform, IXlr} from '../../types';
import PwaSW from '../../Lib/pwa-sw';

import './media.css';

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

export default function VideoMedia(media: IMedia, xlr: IXlr) {
    return {
        duration: 0,
        init: function () {
            const vjsPlayer = media.player;

            this.duration = media.duration;

            if (vjsPlayer !== undefined) {
                const playerReportFault = async (msg: string) => {
                    // Immediately expire media and report a fault
                    const playerSW = PwaSW();
                    const hasSW = await playerSW.getSW();

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
                            this.stop();
                        });
                    } else {
                        this.stop();
                    }
                };

                vjsPlayer.on('loadstart', () => {
                    console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} has started loading data . . .`);
                });

                vjsPlayer.one('loadedmetadata', () => {
                    if (media.duration === 0) {
                        this.duration = vjsPlayer.duration() as number;
                    }

                    console.debug('VideoMedia: loadedmetadata: Setting video duration to = ' + this.duration);
                });

                vjsPlayer.one('canplay', () => {
                    console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} can be played . . .`);
                });

                vjsPlayer.one('playing', () => {
                    console.debug('VideoMedia: playing: Showing Media ' +
                        media.id + ' for ' + this.duration + 's of Region ' + media.region.regionId);
                    console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} is now playing . . .`);
                });

                // @NOTE: When video is paused due to fail in unmuting the video
                // and video has media.duration = 0, the video will stay paused and the video cycle won't end
                // @TODO: Add timer when video is paused due to unmuting fail and duration that is equal to 0
                // @NOTE: The pause issue when unmuting the video is mainly on a browser level.
                // Please visit https://developer.chrome.com/blog/autoplay/ for more info.

                vjsPlayer.on('ready', () => {
                    vjsPlayer.muted(true);

                    // Race promise between a 0.5s play and a 5s skip
                    Promise.race([
                        new Promise((resolve, reject) => setTimeout(async () => {
                            console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Trying to force play after 0.1 seconds`);
                            // Try to force play here
                            try {
                                // Set video mute/unmute based on setting once playing
                                vjsPlayer.muted(media.muted);

                                await vjsPlayer.play();
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
                        console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Autoplay started`);
                    })
                    .catch(async (error) => {
                        if (error === 'Timeout') {
                            console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Promise not resolved within 5 seconds. Move to next media`);
                            this.stop();
                        } else {
                            console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} : Autoplay error: ${error}`);
                            if (xlr.config.platform === ConsumerPlatform.CHROMEOS) {
                                await playerReportFault('Media autoplay error');
                            }
                        }
                    });
                });
                vjsPlayer.on('error', async (err: any) => {
                    console.debug(`VideoMedia: Media Error: ${capitalizeStr(media.mediaType)} for media > ${media.id}`);
                    if (xlr.config.platform === ConsumerPlatform.CHROMEOS) {
                        await playerReportFault('Video file source not supported');
                    } else {
                        // End media after 5 seconds
                        setTimeout(() => {
                            console.debug(`VideoMedia: ${capitalizeStr(media.mediaType)} for media > ${media.id} has ended . . .`);
                            this.stop();
                        }, 5000);
                    }
                });

                if (media.duration === 0) {
                    vjsPlayer.on('ended', () => {
                        console.debug(`VideoMedia: onended: ${capitalizeStr(media.mediaType)} for media > ${media.id} has ended playing . . .`);
                        this.stop();
                    });
                }
            }
        },
        stop: function(disposeOnly = false) {
            const vjsPlayer = media.player;

            // Expire the media and dispose the video
            if (vjsPlayer !== undefined) {
                if (!disposeOnly) {
                    media.emitter.emit('end', media);
                }

                vjsPlayer.dispose();

                // Clear up media player
                media.player = undefined;
            }
        },
    }
}
