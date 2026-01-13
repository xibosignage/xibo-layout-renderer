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
import { IMedia } from '../../Types/Media';
import {InputLayoutType, OptionsType} from '../../Types/Layout';
import {IXlr} from "../../Types/XLR";
import {nanoid} from "nanoid";
import {composeVideoSource} from "../Media/VideoMedia";
import {transitionElement} from "../Transitions";

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
            mode: 'no-cors',
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
        mode: 'no-cors',
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
    let resourceUrl = params.regionOptions.getResourceUrl
        .replace(":regionId", params.regionId)
        .replace(":id", params.mediaId) +
        '?preview=1&layoutPreview=1';

    if (options.platform === 'CMS') {
        resourceUrl += '&jwt=' + params.regionOptions.previewJwt;
    }

    if (options.platform === 'chromeOS') {
        const resourceEndpoint = '/required-files/resource/';

        if (!params.isGlobalContent && params.isImageOrVideo) {
            resourceUrl = resourceEndpoint + params.fileId + '?saveAs=' + params.uri;
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
    params: any
) {
    let bgImageUrl = '';

    if (platform === 'CMS') {
        bgImageUrl = params.layoutBackgroundDownloadUrl.replace(":id", (params.layout.id as unknown) as string) +
            '&preview=1&width=' + params.layout.sWidth +
            '&height=' + params.layout.sHeight +
            '&dynamic&proportional=0';

    } else if (platform === 'chromeOS') {
        bgImageUrl = composeMediaUrl({uri: params.layout.bgImage});
    }
    // @TODO: Add condition to handle electron platform

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

export function createMediaElement(mediaObject: IMedia, role: 'current' | 'next') {
    const self = mediaObject;
    const $mediaIframe = document.createElement('iframe');
    $mediaIframe.scrolling = 'no';
    $mediaIframe.id = self.iframeName;
    $mediaIframe.width = `${self.divWidth}px`;
    $mediaIframe.height = `${self.divHeight}px`;
    $mediaIframe.style.cssText = `border: 0;`;

    const mediaSelector = `.media--item[data-role="${role}"][data-media-id="${mediaObject.id}"]`;
    let $media = <HTMLElement>(self.region.html.querySelector!(mediaSelector));

    if ($media === null) {
        if (self.mediaType === 'video') {
            $media = document.createElement('video');
        } else if (self.mediaType === 'audio') {
            $media = new Audio();
        } else {
            $media = document.createElement('div');
        }

        $media.id = getMediaId(self);
    }

    $media.dataset.role = role;
    $media.dataset.mediaId = self.id;
    $media.dataset.mediaType = self.mediaType;
    $media.dataset.type = self.type;
    $media.dataset.render = self.render;
    $media.dataset.duration = String(self.duration);
    $media.dataset.fileId = self.fileId;
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

    if ((self.render === 'html' || self.render === 'webpage') && self.url !== null) {
        $mediaIframe.src = self.url;
    } else {
        $mediaIframe.src = `${self.url}&width=${self.divWidth}&height=${self.divHeight}`;
    }

    if (self.render === 'html' || self.mediaType === 'ticker' || self.mediaType === 'webpage') {
        self.checkIframeStatus = true;
        self.iframe = $mediaIframe;
    }  else if (self.mediaType === "image") {
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
        const $videoMedia = composeVideoSource($media as HTMLVideoElement, self);

        let isMuted = false;
        if (Boolean(self.options['mute'])) {
            isMuted = self.options.mute === '1';
        }

        if (Boolean(self.options['scaletype'])) {
            if (self.options.scaletype === 'stretch') {
                $videoMedia.style.objectFit = 'fill';
            }
        }

        $videoMedia.classList.add('video-js', 'vjs-default-skin');

        if (self.loop) {
            self.loop = true;
            $videoMedia.loop = true;
        }

        self.muted = isMuted;

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
