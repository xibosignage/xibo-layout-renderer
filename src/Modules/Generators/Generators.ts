/*
 * Copyright (C) 2026 Xibo Signage Ltd
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
import videojs from "video.js";

import {IMedia} from '../../Types/Media';
import {ILayout, InputLayoutType, OptionsType} from '../../Types/Layout';
import {composeVideoSource, defaultVjsOpts, reportToPlayerPlatform} from "../Media/VideoMedia";
import {transitionElement} from "../Transitions";
import {IRegion} from "../../Types/Region";
import {ConsumerPlatform} from "../../Types/Platform";
import {PwaSW} from "../../Lib";

export function nextId(options: { idCounter: number; }) {
    if (options.idCounter > 500) {
        options.idCounter = 0;
    }

    options.idCounter = options.idCounter + 1;
    return options.idCounter;
}

export const getMediaId = ({mediaType, containerName}: IMedia) => {
    let mediaId = containerName;

    if (mediaType === 'video') {
        mediaId = mediaId + '-vid';
    } else if (mediaType === 'audio') {
        mediaId = mediaId + '-aud';
    }

    return mediaId;
};

export const capitalizeStr = (inputStr: string) => {
    if (inputStr === null) {
        return '';
    }

    return String(inputStr).charAt(0).toUpperCase() + String(inputStr).substring(1);
};

export async function getDataBlob(src: string, jwtToken: string|null) {
    return fetch(src, {
            method: 'GET',
            headers: {
                'X-PREVIEW-JWT': jwtToken || '',
            },
        })
        .then((res) => res.blob())
        .then((blob) => new Promise((res, rej) => {
            const reader = new FileReader();

            reader.onloadend = () => res(reader.result);
            reader.onerror = rej;
            reader.readAsDataURL(blob);
        }));
}

export type MediaTypes = 'video' | 'audio' | 'image';

export async function preloadMediaBlob(src: string, type: MediaTypes, jwtToken: string|null) {
    const res = await fetch(src, {
        method: 'GET',
        headers: {
            'X-PREVIEW-JWT': jwtToken || '',
        },
    });
    let blob: Blob | MediaSource = new Blob();

    if (type === 'image') {
        blob = new Blob()
    } else if (type === 'video') {
        blob = await res.blob();
    } else if (type === 'audio') {
        const data = await res.arrayBuffer();
        blob = new Blob([data], { type: audioFileType(getFileExt(src)) })
    }

    return URL.createObjectURL(blob);
}

export async function fetchJSON(url: string, jwtToken: string|null) {
    return fetch(url,
        {
            method: 'GET',
            headers: {
                'X-PREVIEW-JWT': jwtToken || '',
            },
        })
        .then(res => res.json())
        .catch(err => {
            console.debug(err);
        });
}

export async function fetchText(url: string, jwtToken: string|null): Promise<string> {
    return fetch(url,
        {
            method: 'GET',
            headers: {
                'X-PREVIEW-JWT': jwtToken || '',
            },
        })
        .then(res => res.text())
        .then((responseText) => {
            if (String(responseText).length > 0) {
                return responseText;
            } else {
                return '';
            }
        })
        .catch(err => {
            console.debug(err);
            return err?.message;
        });
}

export function getFileExt(filename: string) {
    const filenameArr = String(filename).split('.');

    return filenameArr[filenameArr.length - 1];
}

export function audioFileType(str: string) {
    const validAudioTypes = {
        'mp3': 'audio/mp3',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
    };

    if (Boolean(validAudioTypes[str as 'mp3' | 'wav' | 'ogg'])) {
        return validAudioTypes[str as 'mp3' | 'wav' | 'ogg'];
    }

    return undefined;
}

export function videoFileType(str: string) {
    const validVideoTypes = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'wmv': 'video/x-ms-wmv',
    };

    if (Boolean(validVideoTypes[str as 'mp4' | 'webm' | 'wmv'])) {
        return validVideoTypes[str as 'mp4' | 'webm' | 'wmv'];
    }

    return undefined;
}

export function composeResourceUrlByPlatform(options: OptionsType, params: any) {
    let resourceUrl = '';
    
    if (params.regionOptions && Boolean(params.regionOptions.getResourceUrl)) {
        resourceUrl = params.regionOptions.getResourceUrl
            .replace(":regionId", params.regionId)
            .replace(":id", params.mediaId) +
            '?preview=1&layoutPreview=1';
    }

    if (options.platform === ConsumerPlatform.CMS && Boolean(params.regionOptions.previewJwt)) {
        resourceUrl += '&jwt=' + params.regionOptions.previewJwt;
    }

    if (options.platform === ConsumerPlatform.CHROMEOS) {
        const resourceEndpoint = '/required-files/resource/';

        if (!params.isGlobalContent && params.isImageOrVideo) {
            resourceUrl = resourceEndpoint + params.fileId + '?saveAs=' + params.uri;
        }
    } else if (options.platform === ConsumerPlatform.ELECTRON) {
        if (params.render === 'html' || params.mediaType === 'ticker' || params.mediaType === 'webpage') {
            resourceUrl = options.appHost +
                'layout_' + params.layoutId +
                '_region_' + params.regionId +
                '_media_' + params.mediaId +
                '.html';
        } else if (params.render === 'native' && params.isImageOrVideo) {
            resourceUrl = options.appHost + params.uri;
        }
    } else if (!Boolean(params['mediaType'])) {
        resourceUrl += '&scale_override=' + params.scaleFactor;
    }

    return resourceUrl;
}

export function composeResourceUrl(options: OptionsType, params: any) {
    const schemaVersion = (options) && options.config?.schemaVersion;
    const hardwareKey = (options) && options.config?.hardwareKey;
    const serverKey = (options) && options.config?.cmsKey;

    return '/pwa/getResource' +
        '?v=' + schemaVersion +
        '&serverKey=' + serverKey +
        '&hardwareKey=' + hardwareKey +
        '&layoutId=' + params.layoutId +
        '&regionId=' + params.regionId +
        '&mediaId=' + params.mediaId;
}

export function composeMediaUrl(params: any) {
    return '/xmds.php?file=' + params.uri;
}

export function composeBgUrlByPlatform(
    platform: OptionsType['platform'],
    params: ILayout,
) {
    let bgImageUrl = '';

    if (platform === ConsumerPlatform.CMS) {
        bgImageUrl = params.options.layoutBackgroundDownloadUrl.replace(":id", (params.id as unknown) as string) +
            '&preview=1&width=' + params.sWidth +
            '&height=' + params.sHeight +
            '&dynamic&proportional=0';

    } else if (platform === ConsumerPlatform.CHROMEOS) {
        bgImageUrl = composeMediaUrl({uri: params.bgImage});
    } else if (platform === ConsumerPlatform.ELECTRON) {
        bgImageUrl = params.options.appHost + params.bgImage;
    }

    return bgImageUrl;
}

type LayoutIndexType = {
    [k: string]: InputLayoutType & {
        index: number;
    }
}

export function getIndexByLayoutId(layoutsInput: InputLayoutType[], layoutId?: number | null) {
    let layoutIndexes = layoutsInput.reduce((a: LayoutIndexType, b, indx) => {
        a[Number(b.layoutId)] = {
            ...b,
            index: indx
        };

        return a;
    }, {});

    if (layoutId === null || !layoutId) {
        return layoutIndexes;
    }

    if (Boolean(layoutIndexes[layoutId])) {
        return layoutIndexes[layoutId];
    }

    // Defaults to 0
    return {index: 0};
}

export function isEmpty(input: any) {
    return !Boolean(input) || String(input).length === 0;
}

export const splashScreenLayoutObj: InputLayoutType = {
    layoutId: 0,
    path: '',
    response: null,
};

export function splashScreenDOM() {
    const mediaItem = document.querySelector('.media--item');
    const newImg = document.createElement('img');

    newImg.src = new URL('./logo.png', import.meta.url).href;

    if (mediaItem !== null) {
        mediaItem.insertBefore(newImg, mediaItem.lastElementChild);
    }

    return newImg;
}

export function getAllAttributes(elem: Element) {
    if (!elem || elem === null) {
        return {};
    }

    return elem.getAttributeNames()
        .reduce((obj, name) => ({
            ...obj,
            [name]: {
                value: elem.getAttribute(name),
            },
        }), <{[k: string]: any}>{});
}

/**
 * Create expiration day based on current date
 * @param numDays Number of days as expiry
 * @returns JSON string format of date
 */
export function setExpiry(numDays: number) {
    const today = new Date();

    return new Date(today.setHours(24 * numDays || 1)).toJSON();
}

/**
 * Check if given layout exists in the loop using layoutId
 * @param layouts Schedule loop unique layouts (uniqueLayouts)
 * @param layoutId Layout ID of the layout to look for
 *
 * @return boolean
 */
export function isLayoutValid(layouts: InputLayoutType[], layoutId: number | undefined) {
    if (layouts.length < 1 || !layoutId) {
        return false;
    }

    const layoutIndex = layouts.findIndex(l => l.layoutId === layoutId);

    return layoutIndex !== -1;
}

export function getLayoutIndexByLayoutId(layouts: InputLayoutType[], layoutId: number) {
    if (layouts.length < 1 || !layoutId) {
        return null;
    }

    return layouts.findIndex(l => l.layoutId === layoutId);
}

export function hasDefaultOnly(inputLayouts: InputLayoutType[]) {
    if (!inputLayouts) {
        return false;
    }

    return inputLayouts.length === 1 && inputLayouts[0].response?.nodeName === 'default';
}

export function isDefaultLayout(inputLayout: InputLayoutType) {
    if (!inputLayout) {
        return false;
    }

    return inputLayout.response?.nodeName === 'default';
}

export function hasSspLayout(inputLayouts: InputLayoutType[], defaultValue = false) {
    if (!inputLayouts || inputLayouts.length === 0) {
        return defaultValue;
    }

    return inputLayouts.find(layout => layout.layoutId === -1) !== undefined;
}

export function prepareIframe(media: IMedia) {
    const iframe = document.createElement('iframe');

    iframe.scrolling = 'no';
    iframe.id = media.iframeName;
    iframe.width = `${media.divWidth}px`;
    iframe.height = `${media.divHeight}px`;
    iframe.style.cssText = `border: 0;`;


    if ((media.render === 'html' || media.render === 'webpage') && media.url !== null) {
        iframe.src = media.url;
    } else {
        iframe.src = `${media.url}&width=${media.divWidth}&height=${media.divHeight}`;
    }

    return iframe;
}

export function prepareImage(media: IMedia, container: HTMLElement) {
    if (media.options['scaletype'] === 'stretch') {
        container.style.cssText = container.style.cssText.concat(`background-size: 100% 100%;`);
    } else if (media.options['scaletype'] === 'fit') {
        container.style.cssText = container.style.cssText.concat(`background-size: cover;`);
    } else {
        // Center scale type, do we have align or valign?
        const align = (media.options['align'] == "") ? "center" : media.options['align'];
        const valign = (media.options['valign'] == "" || media.options['valign'] == "middle") ? "center" : media.options['valign'];
        container.style.cssText = container.style.cssText.concat(`background-position: ${align} ${valign}`);
    }

    return container;
}

export function prepareVideo(media: IMedia, container: HTMLVideoElement) {
    const $videoMedia = composeVideoSource(container as HTMLVideoElement, media);

    let isMuted = false;
    if (Boolean(media.options['mute'])) {
        isMuted = media.options.mute === '1';
    }

    if (Boolean(media.options['scaletype'])) {
        if (media.options.scaletype === 'stretch') {
            $videoMedia.style.objectFit = 'fill';
        }
    }

    $videoMedia.classList.add('video-js', 'vjs-default-skin');

    if (media.loop) {
        media.loop = true;
        $videoMedia.loop = true;
    }

    media.muted = isMuted;

    return $videoMedia;
}

export function prepareAudio(media: IMedia, container: HTMLAudioElement) {
    const $audioMedia = container as HTMLAudioElement;

    $audioMedia.preload = 'auto';
    $audioMedia.textContent = 'Unsupported Audio';
    $audioMedia.autoplay = true;

    if (media.loop) {
        $audioMedia.loop = true;
    }

    return $audioMedia;
}

export function createMediaElement(mediaObject: IMedia) {
    const self = mediaObject;

    const mediaId = getMediaId(self);
    const mediaSelector = `.media--item.${mediaId}`;
    let $media = <HTMLElement>(self.region.html.querySelector!(mediaSelector));

    if ($media === null) {
        if (self.mediaType === 'video') {
            $media = document.createElement('video') as HTMLVideoElement;
        } else if (self.mediaType === 'audio') {
            $media = new Audio();
        } else {
            $media = document.createElement('div');
        }

        $media.id = mediaId;
    }

    $media.dataset.mediaId = self.id;
    $media.dataset.mediaType = self.mediaType;
    $media.dataset.type = self.type;
    $media.dataset.render = self.render;
    $media.dataset.duration = String(self.duration);
    $media.dataset.fileId = self.fileId;
    $media.className = `media--item ${mediaId}`;

    /* Scale the Content Container */
    let cssText = `
        width: ${self.divWidth}px;
        height: ${self.divHeight}px;
        position: absolute;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
    `;

    if (self.mediaType !== 'video') {
        cssText += `
            visibility: hidden;
            opacity: 0;
            z-index: 0;
        `
    }

    $media.style.cssText = cssText;

    if (self.render === 'html' || self.mediaType === 'ticker' || self.mediaType === 'webpage') {
        self.checkIframeStatus = true;
        self.iframe = prepareIframe(self);
    }  else if (self.mediaType === "image") {
        $media = prepareImage(self, $media);
    } else if (self.mediaType === 'video') {
        $media = prepareVideo(self, $media as HTMLVideoElement);
    } else if (self.mediaType === 'audio') {
        $media = prepareAudio(self, $media as HTMLAudioElement);
    }

    // Duration is per item condition
    if ((self.render === 'html' || self.mediaType === 'ticker') && self.url !== null) {
        /* Check if the ticker duration is based on the number of items in the feed */
        if (self.options['durationisperitem'] === '1') {
            const regex = new RegExp('<!-- NUMITEMS=(.*?) -->');

            (async () => {
                let html = await fetchJSON(`${self.url}&width=${self.divWidth}&height=${self.divHeight}`, self.options.previewJwt);
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
    // self.html = $media;

    return $media;
}

export function prepareVideoMedia(media: IMedia, region: IRegion) {
    const mediaId = getMediaId(media);
    // Check if html is ready and is in the DOM
    if (media.html !== null) {

        // Clean up video.js instance
        const existingPlayer = videojs.getPlayer(mediaId);

        if (existingPlayer !== undefined) {
            existingPlayer.dispose();
            media.player = undefined;
        }

        const $layout = region.layout.html;
        const layoutSelector = '#' + region.layout.containerName +
          '[data-sequence="' + region.layout.index + '"]';
        const $layoutWithIndex = document.querySelector(layoutSelector);
        const $region = region.html;
        const mediaInRegion = $region?.querySelector('.' + mediaId);

        console.debug('??? XLR.debug >> [Generators::prepareVideoMedia]', {
            layoutSelector,
            $layoutWithIndex,
            $region,
            mediaInRegion,
            mediaHtml: media.html,
            existingPlayer,
            mediaId,
            layoutInDOM: document.body.contains($layout),
        })
        if (!mediaInRegion) {
            media.html = createMediaElement(media);
        } else {
            mediaInRegion.remove();
            media.html = createMediaElement(media);
        }

        // Append fresh copy of the media into the region
        region.html.appendChild(media.html);

        const isMediaInDOM = document.body.contains(media.html);

        console.debug('??? XLR.debug >> [Generators::prepareVideoMedia]', {
            isMediaInDOM,
            mediaHtml: media.html,
            mediaId,
        })

        // Initialize video.js
        media.player = videojs(mediaId, {
            ...defaultVjsOpts,
            errorDisplay: !reportToPlayerPlatform.includes(region.xlr.config.platform),
            loop: media.loop,
        });

        (media.player.el() as HTMLElement).style.setProperty('visibility', 'hidden');
        (media.player.el() as HTMLElement).style.setProperty('opacity', '0');
        (media.player.el() as HTMLElement).style.setProperty('z-index', '-99');
    }
}

export function prepareImageMedia(media: IMedia, region: IRegion) {
    const mediaId = getMediaId(media);
    (media.html as HTMLElement).style
      .setProperty('background-image', `url(${media.url}`);

    // Check if media in region
    // Remove old copy before inserting fresh copy
    const mediaInRegion = region.html.querySelector('.' + mediaId);

    if (mediaInRegion) {
        mediaInRegion.remove();
    }

    // Append media to its region using the direct reference to avoid
    // global querySelector finding a same-named region in another layout
    region.html.appendChild(media.html as HTMLElement);
}

export function prepareAudioMedia(media: IMedia, region: IRegion) {
    const mediaId = getMediaId(media);
    if (media.url !== null) {
        (media.html as HTMLAudioElement).src = media.url;
    }

    // Check if media in region
    // Remove old copy before inserting fresh copy of the media
    const mediaInRegion = region.html.querySelector('.' + mediaId);

    if (mediaInRegion) {
        mediaInRegion.remove();
    }

    // Append media to its region using the direct reference
    region.html.appendChild(media.html as HTMLAudioElement);
}

export function prepareHtmlMedia(media: IMedia, region: IRegion) {
    // Set state as false ( for now )
    media.ready = false;

    if (media.html) {
        const mediaId = getMediaId(media);

        // Clean up old copy of the media
        // before inserting fresh copy
        const $layout = document.querySelector(`#${region.layout.containerName}[data-sequence="${region.layout.index}"]`) as HTMLDivElement;
        const $region = $layout.querySelector('#' + region.containerName) as HTMLElement;
        const mediaInRegion = $region.querySelector('.' + mediaId);

        console.debug('<><> XLR.debug >> [Media] - [Generators::prepareHtmlMedia]', {
            mediaId,
            mediaInRegion,
        })

        // Append iframe
        media.html.innerHTML = '';
        media.html.appendChild(media.iframe as Node);

        if (!mediaInRegion) {
            // Add fresh copy of the media into the region using the direct reference
            region.html.appendChild(media.html as HTMLElement);
            media.ready = true;
        }
    }
}

export enum FaultCodes {
    FaultVideoSource = 2001,
    FaultVideoUnexpected = 2099,
}

export async function playerReportFault(msg: string, media: IMedia, code: number = FaultCodes.FaultVideoUnexpected) {
    // Immediately expire media and report a fault
    const platform = media.region.xlr.config.platform;
    const playerSW = PwaSW();
    const hasSW = await playerSW.getSW();
    const mediaFault = {
        type: 'MEDIA_FAULT',
        code: code,
        reason: msg,
        mediaId: media.id,
        regionId: media.region.id,
        layoutId: media.region.layout.id,
        date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        // Temporary setting
        expires: format(new Date(setExpiry(1)), 'yyyy-MM-dd HH:mm:ss'),
    };

    console.debug('playerReportFault >> Reporting media fault', {
        mediaFault,
        platform,
        hasSW,
    });

    if (platform === ConsumerPlatform.CHROMEOS && hasSW) {
        return playerSW.postMsg(mediaFault)
          .then(() => {
              // We try to prepare next media if we have more than 1 media
              if (media.region.totalMediaObjects > 1) {
                  media.region.prepareNextMedia();
              }
          })
          .finally(() => {
              // Stopping media as we have reported the error as fault
              console.debug('??? XLR.debug >> VideoMedia - Done reporting media fault', {
                  mediaId: media.id,
                  regionItems: media.region.totalMediaObjects,
              })
          });
    } else if (platform === ConsumerPlatform.ELECTRON) {
        // Create a broadcast channel to report media fault to the main process
        const channel = new BroadcastChannel('player-faults-bc');
        channel.postMessage(mediaFault);

        console.debug('playerReportFault >> Electron platform - posted media fault to channel', {
            mediaFault,
        });
        // channel.close();
        return Promise.resolve();
    }

    return Promise.resolve();
}

export function setLayoutIndex(layout: ILayout | undefined, layoutIndex: number) {
    if (!layout || layout.id === null) {
        return;
    }

    layout.index = layoutIndex;
    return layout;
}
