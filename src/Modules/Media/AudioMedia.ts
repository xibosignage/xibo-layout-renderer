import { IMedia } from "../../Types/Media.types";
import { capitalizeStr, getMediaId } from "../Generators";

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
