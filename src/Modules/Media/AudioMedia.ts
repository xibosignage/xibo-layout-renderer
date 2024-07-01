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

import './media.css';

export default function AudioMedia(media: IMedia) {
    const audioMediaObject = {
        init() {
            const $audioMedia = document.getElementById(getMediaId(media)) as HTMLAudioElement;
            let $playBtn: HTMLButtonElement | null = null;

            if ($audioMedia) {
                $audioMedia.onloadstart = () => {
                    console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} has started loading data . . .`);
                };
                $audioMedia.onloadeddata = () => {
                    if ($audioMedia.readyState >= 2) {
                        console.log(`${capitalizeStr(media.mediaType)} data for media > ${media.id} has been fully loaded . . .`);
                    }
                };
                $audioMedia.oncanplay = () => {
                    console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} can be played . . .`);
                };
                $audioMedia.onplaying = () => {
                    console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} is now playing . . .`);

                    if ($playBtn !== null) {
                        $playBtn.remove();
                    }
                };

                const audioPlayPromise = $audioMedia.play();
    
                if (audioPlayPromise !== undefined) {
                    audioPlayPromise.then(() => {
                        console.log('autoplay started . . .');
                        // Autoplay restarted
                    }).catch(error => {
                        if (error.name === 'NotAllowedError') {
                            // Let's show a play audio button
                            $playBtn = document.createElement('button');

                            $playBtn.classList.add('play-audio-btn');
                            $playBtn.textContent = 'Play Audio';
                            $playBtn.addEventListener('click', () => {
                                $audioMedia.muted = false;
                                $audioMedia.play();
                            });
                            $audioMedia.parentNode?.insertBefore($playBtn, $audioMedia.nextSibling);
                        }
                    });
                }
                if (media.duration === 0) {
                    $audioMedia.ondurationchange = () => {
                        console.log('Showing Media ' + media.id + ' for ' + $audioMedia.duration + 's of Region ' + media.region.regionId);
                    };
                    $audioMedia.onended = () => {
                        console.log(`${capitalizeStr(media.mediaType)} for media > ${media.id} has ended playing . . .`);
                        media.emitter?.emit('end', media);
                    };
                }
            }
        },
    };

    return audioMediaObject;
}
