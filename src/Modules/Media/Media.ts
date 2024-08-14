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
import { createNanoEvents } from 'nanoevents';
import { OptionsType } from '../../Types/Layout';
import { IRegion } from '../../Types/Region';
import { IMedia, initialMedia } from '../../Types/Media';
import { fetchJSON, getMediaId, nextId, preloadMediaBlob } from '../Generators';
import { TransitionElementOptions, compassPoints, flyTransitionKeyframes, transitionElement } from '../Transitions';
import VideoMedia from './VideoMedia';
import AudioMedia from './AudioMedia';
import {composeResourceUrlByPlatform, getDataBlob} from '../Generators/Generators';
import {IXlr} from '../../Types/XLR';

export interface IMediaEvents {
    start: (media: IMedia) => void;
    end: (media: IMedia) => void;
}

export default function Media(
    region: IRegion,
    mediaId: string,
    xml: Element,
    options: OptionsType,
    xlr: IXlr,
) {
    const props = {
        region: region,
        mediaId: mediaId,
        xml: xml,
        options: options,
    };
    let mediaTimer: string | number | NodeJS.Timeout | null | undefined = null;
    let mediaTimeCount = 0;
    const emitter = createNanoEvents<IMediaEvents>();
    const mediaObject: IMedia = {
        ...initialMedia,
        ...props,
    };
    const startMediaTimer = (media: IMedia) => {
        mediaTimer = setInterval(() => {
            mediaTimeCount++;
            if (mediaTimeCount > media.duration) {
                media.emitter?.emit('end', media);
            }
        }, 1000);
        console.debug('Showing Media ' + media.id + ' for ' + media.duration + 's of Region ' + media.region.regionId);
    };

    emitter.on('start', function(media) {
        if (media.mediaType === 'video') {
            VideoMedia(media).init();

            if (media.duration > 0) {
                startMediaTimer(media);
            }
        } else if (media.mediaType === 'audio') {
            AudioMedia(media).init();
            if (media.duration > 0) {
                startMediaTimer(media);
            }
        } else {
            startMediaTimer(media);
        }
    });

    emitter.on('end', function(media) {
        if (mediaTimer) {
            clearInterval(mediaTimer);
            mediaTimeCount = 0;
        }

        media.region.playNextMedia();
    });

    mediaObject.init = function() {
        const self = mediaObject;
        self.id = props.mediaId;
        self.fileId = self.xml?.getAttribute('fileId') || '';
        self.idCounter = nextId(props.options);
        self.containerName = `M-${self.id}-${self.idCounter}`;
        self.iframeName = `${self.containerName}-iframe`;
        self.mediaType = self.xml?.getAttribute('type') || '';
        self.render = self.xml?.getAttribute('render') || '';
        self.duration = parseInt(self.xml?.getAttribute('duration') as string) || 0;
        self.options = { ...props.options, mediaId };

        const $mediaIframe = document.createElement('iframe');
        const mediaOptions = self.xml?.getElementsByTagName('options');

        if (mediaOptions) {
            for (let _options of Array.from(mediaOptions)) {
                // Get options
                const _mediaOptions = _options.children;
                for (let mediaOption of Array.from(_mediaOptions)) {
                    self.options[mediaOption.nodeName.toLowerCase()] = mediaOption.textContent;
                }
            }
        }

        // Check for options.uri and add it to media
        if (Boolean(self.options['uri'])) {
            self.uri = self.options['uri'];
        }

        // Show in fullscreen?
        if(self.options.showfullscreen === "1") {
            // Set dimensions as the layout ones
            self.divWidth = self.region.layout.sWidth;
            self.divHeight = self.region.layout.sHeight;
        } else {
            // Set dimensions as the region ones
            self.divWidth = self.region.sWidth;
            self.divHeight = self.region.sHeight;
        }

        $mediaIframe.scrolling = 'no';
        $mediaIframe.id = self.iframeName;
        $mediaIframe.width = `${self.divWidth}px`;
        $mediaIframe.height = `${self.divHeight}px`;
        $mediaIframe.style.cssText = `border: 0; visibility: hidden;`;

        const $mediaId = getMediaId(self);
        let $media = document.getElementById($mediaId);

        if ($media === null) {
            if (self.mediaType === 'video') {
                $media = document.createElement('video');
            } else if (self.mediaType === 'audio') {
                $media = new Audio();
            } else {
                $media = document.createElement('div');
            }
        
            $media.id = $mediaId;
        }

        $media.className = 'media--item';

        /* Scale the Content Container */
        $media.style.cssText = `
            display: none;
            width: ${self.divWidth}px;
            height: ${self.divHeight}px;
            position: absolute;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        `;

        const $region = document.getElementById(`${self.region.containerName}`);

        const resourceUrlParams: any = {
            ...xlr.config.config,
            regionOptions: self.region.options,
            layoutId: self.region.layout.layoutId,
            regionId: self.region.id,
            mediaId: self.id,
            fileId: self.fileId,
            scaleFactor: self.region.layout.scaleFactor,
            uri: self.uri,
        };

        if (self.mediaType === 'image' || self.mediaType === 'video') {
            resourceUrlParams.mediaType = self.mediaType;
        }

        const tmpUrl = composeResourceUrlByPlatform(xlr.config.platform, resourceUrlParams);

        self.url = tmpUrl;

        // Loop if media has loop, or if region has loop and a single media
        self.loop =
            self.options['loop'] == '1' ||
            (self.region.options['loop'] == '1' && self.region.totalMediaObjects == 1);

        $mediaIframe.src = `${tmpUrl}&width=${self.divWidth}&height=${self.divHeight}`;

        if (self.render === 'html' || self.mediaType === 'ticker' || self.mediaType === 'webpage') {
            self.checkIframeStatus = true;
            self.iframe = $mediaIframe;
        }  else if (self.mediaType === "image") {
            // preload.addFiles(tmpUrl);
            // $media.style.cssText = $media.style.cssText.concat(`background-image: url('${tmpUrl}');`);
            if (self.options['scaletype'] === 'stretch') {
                $media.style.cssText = $media.style.cssText.concat(`background-size: 100% 100%;`);
            } else if (self.options['scaletype'] === 'fit') {
                $media.style.cssText = $media.style.cssText.concat(`background-size: cover;`);
            } else {
                // Center scale type, do we have align or valign?
                const align = (self.options['align'] == "") ? "center" : self.options['align'];
                const valign = (self.options['valign'] == "" || self.options['valign'] == "middle") ? "center" : self.options['valign'];
                $media.style.cssText = $media.style.cssText.concat(`background-position: ${align} ${valign}`);
            }
        } else if (self.mediaType === 'video') {
            const $videoMedia = $media as HTMLVideoElement;

            $videoMedia.preload = 'auto';
            $videoMedia.textContent = 'Unsupported Video';

            if (Boolean(self.options['mute'])) {
                $videoMedia.muted = self.options.mute === '1';
            }

            if (Boolean(self.options['scaletype'])) {
                if (self.options.scaletype === 'stretch') {
                    $videoMedia.style.objectFit = 'fill';
                }
            }
            $videoMedia.playsInline = true;

            if (self.loop) {
                $videoMedia.loop = true;
            }

            $media = $videoMedia;
        } else if (self.mediaType === 'audio') {
            const $audioMedia = $media as HTMLAudioElement;

            $audioMedia.preload = 'auto';
            $audioMedia.textContent = 'Unsupported Audio';
            $audioMedia.autoplay = true;

            if (self.loop) {
                $audioMedia.loop = true;
            }

            $media = $audioMedia;
        }

        // Duration is per item condition
        if (self.render === 'html' || self.mediaType === 'ticker') {
            /* Check if the ticker duration is based on the number of items in the feed */
            if (self.options['durationisperitem'] === '1') {
                const regex = new RegExp('<!-- NUMITEMS=(.*?) -->');

                (async () => {
                    let html = await fetchJSON(`${tmpUrl}&width=${self.divWidth}&height=${self.divHeight}`);
                    console.debug({html});
                    const res = regex.exec(html);

                    if (res !== null) {
                        self.duration = parseInt(String(self.duration)) * parseInt(res[1]);
                    }
                })();
            }
        }

        // Check if the media has fade-in/out transitions
        if (Boolean(self.options['transin']) && Boolean(self.options['transinduration'])) {
            const transInDuration = Number(self.options.transinduration);
            const fadeInTrans = transitionElement('fadeIn', { duration: transInDuration });
            $media.animate(fadeInTrans.keyframes, fadeInTrans.timing);
        }

        // Add media to the region
        // Second media if exists, will be off-canvas
        // All added media will be hidden by default
        // It will start showing when region.nextMedia() function is called

        // When there's only 1 item and loop = false, don't remove the item but leave it at its last state
        // For image, and only 1 item, it should still have the transition for next state
        // Add conditions for video duration being 0 or 1 and also the loop property
        // For video url, we have to create a URL out of the XLF video URL

        /**
         * @DONE
         * Case 1: Video duration = 0, this will play the video for its entire duration
         * Case 2: Video duration is set > 0 and loop = false
         * E.g. Set duration = 100s, video duration = 62s
         * the video will play until 62s and will stop to its last frame until 100s
         * After 100s, it will expire
         * Case 3: Video duration is set > 0 and loop = true
         * E.g. Set duration = 100s, video duration = 62s, loop = true
         * the video will play until 62s and will loop through until the remaining 38s
         * to complete the 100s set duration
         */

        // Add html node to media for
        self.html = $media;
        // Check/set iframe based widgets play status
    };

    mediaObject.run = function() {
        const self = mediaObject;
        let transInDuration = 1;
        let transInDirection: compassPoints = 'E';

        if (Boolean(self.options['transinduration'])) {
            transInDuration = Number(self.options.transinduration);
        }

        if (Boolean(self.options['transindirection'])) {
            transInDirection = self.options.transindirection;
        }

        let defaultTransInOptions: TransitionElementOptions = {duration: transInDuration};
        let transIn = transitionElement('defaultIn', {duration: defaultTransInOptions.duration});
        
        if (Boolean(self.options['transin'])) {
            let transInName = self.options['transin'];

            if (transInName === 'fly') {
                transInName = `${transInName}In`;
                defaultTransInOptions.keyframes = flyTransitionKeyframes({
                    trans: 'in',
                    direction: transInDirection,
                    height: self.divHeight,
                    width: self.divWidth,
                });
            }

            transIn = transitionElement(transInName, defaultTransInOptions);
        }

        const showCurrentMedia = async () => {
            let $mediaId = getMediaId(self);
            let $media = document.getElementById($mediaId);
            const isCMS = xlr.config.platform === 'CMS';

            if ($media === null) {
                $media = getNewMedia();
            }

            if ($media !== null) {
                $media.style.setProperty('display', 'block');

                if (Boolean(self.options['transin'])) {
                    $media.animate(transIn.keyframes, transIn.timing);
                }

                if (self.mediaType === 'image' && self.url !== null) {
                    ($media as HTMLImageElement).style
                        .setProperty(
                            'background-image',
                            `url(${!isCMS ? self.url : await getDataBlob(self.url)}`
                        );
                } else if (self.mediaType === 'video' && self.url !== null) {
                    ($media as HTMLVideoElement).src =
                        isCMS ? await preloadMediaBlob(self.url, self.mediaType) : self.url;
                } else if (self.mediaType === 'audio' && self.url !== null) {
                    ($media as HTMLAudioElement).src =
                        isCMS ? await preloadMediaBlob(self.url, self.mediaType) : self.url;
                } else if ((self.render === 'html' || self.mediaType === 'webpage') &&
                    self.iframe && self.checkIframeStatus
                ) {
                    // Set state as false ( for now )
                    self.ready = false;

                    // Append iframe
                    $media.innerHTML = '';
                    $media.appendChild(self.iframe as Node);

                    // On iframe load, set state as ready to play full preview
                    (self.iframe) && self.iframe.addEventListener('load', function(){
                        self.ready = true;
                        if (self.iframe) {
                            const iframeStyles = self.iframe.style.cssText;
                            self.iframe.style.cssText = iframeStyles?.concat('visibility: visible;');
                        }
                    });
                }

                self.emitter?.emit('start', self);
            }
        };
        const getNewMedia = (): HTMLElement | null => {
            const $region = document.getElementById(`${self.region.containerName}`);
            // This function is for checking whether
            // the region still has to show a media item
            // when another region is not finished yet
            if (self.region.complete && !self.region.layout.allEnded) {
                // Add currentMedia to the region

                ($region) && $region.insertBefore(self.html as Node, $region.lastElementChild);

                return self.html as HTMLElement;
            }

            return null;
        };

        showCurrentMedia();
    };

    mediaObject.stop = async function() {
        const self = mediaObject;
        const $media = document.getElementById(getMediaId(self));

        if ($media) {
            $media.style.display = 'none';
            $media.remove();
        }
    };

    
    mediaObject.on = function<E extends keyof IMediaEvents>(event: E, callback: IMediaEvents[E]) {
        return emitter.on(event, callback);
    };

    mediaObject.emitter = emitter;

    mediaObject.init();

    return mediaObject;
}