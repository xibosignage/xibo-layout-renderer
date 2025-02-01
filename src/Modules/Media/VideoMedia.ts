/*
 * Copyright (C) 2024 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://www.xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */
import videojs from 'video.js';
import {format} from "date-fns";

import { IMedia } from '../../Types/Media';
import { capitalizeStr, getMediaId, preloadMediaBlob, MediaTypes, videoFileType, getFileExt, setExpiry } from '../Generators';
import { IXlr } from '../../types';
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
        init: function () {
            const vjsPlayer = media.player;

            if (vjsPlayer !== undefined) {
                const playerReportFault = async function(msg: string) {
                    // Immediately expire media and report a fault
                    const playerSW = PwaSW();
                    const hasSW = await playerSW.getSW();

                    const endVideo = function() {
                        // Expire the media and dispose the video
                        vjsPlayer.dispose();
                        media.emitter.emit('end', media);
                    };

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
                            endVideo();
                        });
                    } else {
                        endVideo();
                    }
                }

                vjsPlayer.on('loadstart', () => {
                    console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} has started loading data . . .`);
                });
                vjsPlayer.on('canplay', () => {
                    console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} can be played . . .`);
                });
                vjsPlayer.on('ready', function() {
                    vjsPlayer.muted(true);
                    let promise = vjsPlayer.play();

                    if (promise !== undefined) {
                        // Race promise with a 0.5s play and a 5s skip
                        Promise.race([
                            promise,
                            new Promise((resolve, reject) => setTimeout(async () => {
                                console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} : Trying to force play after 0.5 seconds`);
                                // Try to force play here
                                try {
                                    await vjsPlayer.play();
                                    // Resolve if play works
                                    resolve(true);
                                } catch (error) {
                                    // Reject race if play fails
                                    reject('Force play failed');
                                }
                            }, 500)),
                            new Promise((_, reject) => setTimeout(() => reject('Timeout'), 5000))
                        ])
                        .then(() => {
                            console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} : Autoplay started`);
                        })
                        .catch(async (error) => {
                            if (error === 'Timeout') {
                                console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} : Promise not resolved within 5 seconds. Move to next media`);
                                vjsPlayer.dispose();
                                media.emitter?.emit('end', media);
                            } else {
                                console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} : Autoplay error: ${error}`);
                                if (xlr.config.platform === 'chromeOS') {
                                    await playerReportFault('Media autoplay error');
                                }
                            }
                        });
                    }
                });
                vjsPlayer.on('playing', () => {
                    console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} is now playing . . .`);
                    vjsPlayer.muted(media.muted);
                });
                vjsPlayer.on('error', async (err: any) => {
                    console.debug(`Media Error: ${capitalizeStr(media.mediaType)} for media > ${media.id}`);
                    if (xlr.config.platform === 'chromeOS') {
                        await playerReportFault('Video file source not supported');
                    } else {
                        // End media after 5 seconds
                        setTimeout(() => {
                            console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} has ended . . .`);
                            media.emitter.emit('end', media);
                            vjsPlayer.dispose();
                        }, 5000);
                    }
                });

                vjsPlayer.on('ended', function () {
                    console.debug(`VideoMedia: onended: ${capitalizeStr(media.mediaType)} for media > ${media.id} has ended playing . . .`);
                    media.emitter?.emit('end', media);
                    vjsPlayer.dispose();
                });

                vjsPlayer.on('durationchange', () => {
                    if (media.duration === 0 && vjsPlayer.duration() !== undefined) {
                        media.duration = vjsPlayer.duration() as number;
                    } else if (media.duration > 0) {
                        vjsPlayer.duration(media.duration);
                    }

                    console.debug('VIDEOJS: ondurationchange: Showing Media ' + media.id + ' for ' + vjsPlayer.duration() + 's of Region ' + media.region.regionId);
                });
            }
        }
    }
}
