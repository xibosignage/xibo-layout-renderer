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

export async function preloadMediaBlob(src: string, type: 'video' | 'audio' | 'image') {
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

export function composeResourceUrlByPlatform(options: OptionsType, params: any) {
    let resourceUrl = params.regionOptions.getResourceUrl
        .replace(":regionId", params.regionId)
        .replace(":id", params.mediaId) +
        '?preview=1&layoutPreview=1';

    if (options.platform === 'chromeOS') {
        const resourceEndpoint = params.cmsUrl + '/chromeOS/resource/';

        if (!params.isGlobalContent && params.isImageOrVideo) {
            resourceUrl = resourceEndpoint + params.fileId + '?saveAs=' + params.uri;
        } else {
            // resourceUrl = composeResourceUrl(options.config, params);
            resourceUrl = params.cmsUrl + resourceUrl;
        }
    } else if (!Boolean(params['mediaType'])) {
        resourceUrl += '&scale_override=' + params.scaleFactor;
    }

    return resourceUrl;
}

export function composeResourceUrl(config: OptionsType['config'], params: any) {
    const schemaVersion = (config) && config.schemaVersion;
    const hardwareKey = (config) && config.hardwareKey;
    const serverKey = (config) && config.cmsKey;
    const cmsUrl = (config) && config.cmsUrl;

    return cmsUrl + '/chromeOS/resource' +
        '/' + params.layoutId +
        '/' + params.regionId +
        '/' + params.mediaId;

    // return cmsUrl + '/pwa/getResource' +
    //     '?v=' + schemaVersion +
    //     '&serverKey=' + serverKey +
    //     '&hardwareKey=' + hardwareKey +
    //     '&layoutId=' + params.layoutId +
    //     '&regionId=' + params.regionId +
    //     '&mediaId=' + params.mediaId;
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
        bgImageUrl = params.cmsUrl +
            '/chromeOS/resource/' + params.layout.id +
            '?saveAs=' + params.layout.bgImage;
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
