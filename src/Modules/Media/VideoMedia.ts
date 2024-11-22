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

import { IMedia } from '../../Types/Media';
import { capitalizeStr, getMediaId, preloadMediaBlob, MediaTypes, videoFileType, getFileExt, setExpiry } from '../Generators';
import { IXlr } from '../../types';
import PwaSW from '../../Lib/pwa-sw';

export async function composeVideoSource($media: HTMLVideoElement, media: IMedia) {
    const videoSrc = await preloadMediaBlob(media.url as string, media.mediaType as MediaTypes);
    const vidType = videoFileType(getFileExt(media.uri)) as string;

    // Only add one source per type
    if ($media.querySelectorAll(`source[type="${vidType}"]`).length === 0) {
        const $videoSource = document.createElement('source');
    
        $videoSource.src = videoSrc;
        $videoSource.type = vidType;
    
        $media.insertBefore($videoSource, $media.lastElementChild);    
    }

    return $media;
}

export default function VideoMedia(media: IMedia, xlr: IXlr) {
    const videoMediaObject = {
        init() {
            const $videoMedia = document.getElementById(getMediaId(media)) as HTMLVideoElement;

            if ($videoMedia) {
                const vjsPlayer = videojs.getPlayer($videoMedia);

                vjsPlayer?.on('loadstart', () => {
                    console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} has started loading data . . .`);
                });
                vjsPlayer?.on('loadstart', () => {
                    if ($videoMedia.readyState >= 2) {
                        console.debug(`${capitalizeStr(media.mediaType)} data for media > ${media.id} has been fully loaded . . .`);
                    }
                });
                vjsPlayer?.on('canplay', () => {
                    console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} can be played . . .`);

                    // Autoplay restarted
                    console.debug('autoplay started . . .');
                    
                    vjsPlayer.muted(true);
                    vjsPlayer.play();
                });
                vjsPlayer?.on('playing', () => {
                    console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} is now playing . . .`);
                });
                vjsPlayer?.on('error', async (err: any) => {
                    console.debug(`Media Error: ${capitalizeStr(media.mediaType)} for media > ${media.id}`);
                    if (xlr.config.platform === 'chromeOS') {
                        // Immediately expire media and report a fault
                        const playerSW = PwaSW();
                        const hasSW = await playerSW.getSW();

                        if (hasSW) {
                            playerSW.postMsg({
                                type: 'MEDIA_FAULT',
                                code: '5002',
                                reason: 'Video file source not supported',
                                mediaId: media.id,
                                regionId: media.region.id,
                                layoutId: media.region.layout.id,
                                date: new Date().toJSON(),
                                // Temporary setting
                                expiry: setExpiry(7), 
                            }).then(() => {
                                // Expire the media and dispose the video
                                vjsPlayer.dispose();
                                media.emitter.emit('end', media);
                            });
                        }
                    } else {
                        // End media after 5 seconds
                        setTimeout(() => {
                            console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} has ended . . .`);
                            media.emitter.emit('end', media);
                            vjsPlayer.dispose();
                        }, 5000);
                    }
                });
    
                if (media.duration === 0) {
                    vjsPlayer?.on('durationchange', () => {
                        console.debug('Showing Media ' + media.id + ' for ' + vjsPlayer.duration() + 's of Region ' + media.region.regionId);
                    });

                    vjsPlayer?.on('ended', function() {
                        console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} has ended playing . . .`);
                        media.emitter?.emit('end', media);
                        vjsPlayer.dispose();
                    });
                }
            }
        }
    }

    return videoMediaObject;
}
