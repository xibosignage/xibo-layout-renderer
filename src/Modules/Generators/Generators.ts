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
import {InputLayoutType, OptionsType} from "../../Types/Layout";

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

    console.log({blob})
    return URL.createObjectURL(blob);
}

export async function fetchJSON(url: string) {
    return fetch(url)
        .then(res => res.json())
        .catch(err => {
            console.log(err);
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

export function composeResourceUrlByPlatform(platform: OptionsType['platform'], params: any) {
    let resourceUrl = params.regionOptions.getResourceUrl
        .replace(":regionId", params.regionId)
        .replace(":id", params.mediaId) +
        '?preview=1&layoutPreview=1';

    if (platform === 'chromeOS') {
        resourceUrl = params.cmsUrl +
            '/chromeOS/resource/' +
            params.fileId +
            '?saveAs=' + params.uri;
    } else if (!Boolean(params['mediaType'])) {
        resourceUrl += '&scale_override=' + params.scaleFactor;
    }

    return resourceUrl;
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

    return layoutIndexes[layoutId];
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
