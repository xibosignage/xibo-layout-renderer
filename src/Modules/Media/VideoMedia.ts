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
import '../../Lib/jquery-globals';

import videojs from 'video.js';
import 'xibo-interactive-control/dist/xibo-interactive-control.min.js';

import { IMedia } from '../../Types/Media';
import { capitalizeStr, getMediaId, preloadMediaBlob, MediaTypes, videoFileType, getFileExt } from '../Generators';
import { IXlr } from '../../types';

let xiboIC: unknown;
if ('xiboIC' in window) {
    xiboIC = window.xiboIC;
}

export async function composeVideoSource($media: HTMLVideoElement, media: IMedia) {
    const videoSrc = await preloadMediaBlob(media.url as string, media.mediaType as MediaTypes);
    const $videoSource = document.createElement('source');

    $videoSource.src = videoSrc;
    $videoSource.type = videoFileType(getFileExt(media.uri)) as string;

    $media.insertBefore($videoSource, $media.lastElementChild);

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
                vjsPlayer?.on('error', (err: any) => {
                    console.debug(`Media Error: ${capitalizeStr(media.mediaType)} for media > ${media.id}`);
                    // End media after 5 seconds
                    setTimeout(() => {
                        console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} has ended . . .`);
                        media.emitter.emit('end', media);
                        vjsPlayer.dispose();

                        if (xlr.config.platform === 'chromeOS') {
                            console.log({xiboIC});
                            // xiboIC.expireNow({targetId: xiboICTargetId});
                            // xiboIC.reportFault({
                            //   code: '5001',
                            //   reason: 'No Data',
                            // }, {targetId: xiboICTargetId});
                        }
                    }, 5000);
                });
    
                if (media.duration === 0) {
                    vjsPlayer?.on('durationchange', () => {
                        console.debug('Showing Media ' + media.id + ' for ' + $videoMedia.duration + 's of Region ' + media.region.regionId);
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
