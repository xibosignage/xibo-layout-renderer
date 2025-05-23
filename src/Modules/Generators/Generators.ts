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
import {InputLayoutType, OptionsType} from '../../Types/Layout';
import {IXlr} from "../../Types/XLR";

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

export async function getDataBlob(src: string) {
    return fetch(src, {mode: 'no-cors'})
        .then((res) => res.blob())
        .then((blob) => new Promise((res, rej) => {
            const reader = new FileReader();

            reader.onloadend = () => res(reader.result);
            reader.onerror = rej;
            reader.readAsDataURL(blob);
        }));
}

export type MediaTypes = 'video' | 'audio' | 'image';

export async function preloadMediaBlob(src: string, type: MediaTypes) {
    const res = await fetch(src, {mode: 'no-cors'});
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

export async function fetchJSON(url: string) {
    return fetch(url)
        .then(res => res.json())
        .catch(err => {
            console.debug(err);
        });
}

export async function fetchText(url: string): Promise<string> {
    return fetch(url)
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
    let bgImageUrl = params.layoutBackgroundDownloadUrl.replace(":id", (params.layout.id as unknown) as string) +
        '?preview=1&width=' + params.layout.sWidth +
        '&height=' + params.layout.sHeight +
        '&dynamic&proportional=0';

    if (platform === 'chromeOS') {
        bgImageUrl = composeMediaUrl({uri: params.layout.bgImage});
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
export function isLayoutValid(layouts: { [p: string]: InputLayoutType }, layoutId: number | undefined) {
    if (Object.keys(layouts).length < 1 || !layoutId) {
        return false;
    }

    return Object.keys(layouts).includes(String(layoutId));
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
