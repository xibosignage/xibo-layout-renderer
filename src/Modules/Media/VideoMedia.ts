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
import { IMedia } from '../../Types/Media';
import { capitalizeStr, getMediaId } from '../Generators';

export default function VideoMedia(media: IMedia) {
    const videoMediaObject = {
        init() {
            const $videoMedia = document.getElementById(getMediaId(media)) as HTMLVideoElement;

            if ($videoMedia) {
                $videoMedia.onloadstart = () => {
                    console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} has started loading data . . .`);
                };
                $videoMedia.onloadeddata = () => {
                    if ($videoMedia.readyState >= 2) {
                        console.debug(`${capitalizeStr(media.mediaType)} data for media > ${media.id} has been fully loaded . . .`);
                    }
                };
                $videoMedia.oncanplay = () => {
                    console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} can be played . . .`);
        
                    const videoPlayPromise = $videoMedia.play();
        
                    if (videoPlayPromise !== undefined) {
                        videoPlayPromise.then(() => {
                            console.debug('autoplay started . . .');
                            // Autoplay restarted
                        }).catch(error => {
                            $videoMedia.muted = true;
                            $videoMedia.play();
                        });
                    }
                };
                $videoMedia.onplaying = () => {
                    console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} is now playing . . .`);
                };

                if (media.duration === 0) {
                    $videoMedia.ondurationchange = () => {
                        console.debug('Showing Media ' + media.id + ' for ' + $videoMedia.duration + 's of Region ' + media.region.regionId);
                    };
                    $videoMedia.onended = () => {
                        console.debug(`${capitalizeStr(media.mediaType)} for media > ${media.id} has ended playing . . .`);
                        media.emitter?.emit('end', media);
                    };
                }
            }
        }
    }

    return videoMediaObject;
}
