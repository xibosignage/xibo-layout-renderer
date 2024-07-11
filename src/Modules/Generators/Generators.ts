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
import {OptionsType} from "../../Types/Layout";

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
    const res = await fetch(src, {mode: 'no-cors'});
    const blob = await res.blob();

    return await parseURI(blob);
}

export async function parseURI(uri: Blob) {
    const reader = new FileReader();

    reader.readAsDataURL(uri);

    return new Promise((res, rej) => {
        reader.onload = (e) => {
            res(e.target?.result);
        };
    });
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
        '?preview=1&layoutPreview=1&scale_override=' + params.scaleFactor;

    if (platform === 'chromeOS') {
        resourceUrl = params.cmsUrl + resourceUrl;
    }

    // if (platform === 'CMS') {
    //     resourceUrl = params.regionOptions.getResourceUrl
    //             .replace(":regionId", params.regionId)
    //             .replace(":id", params.mediaId) +
    //         '?preview=1&layoutPreview=1&scale_override=' + params.scaleFactor;
    // } else if (platform === 'chromeOS' && params.mediaType && params.mediaType === 'image') {
    //     resourceUrl = params.cmsUrl + params.regionOptions.getResourceUrl
    //         .replace(":regionId", params.regionId)
    //         .replace(":id", params.mediaId) +
    //         '?preview=1&layoutPreview=1&scale_override=' + params.scaleFactor;
    // } else if (platform === 'chromeOS') {
    //     resourceUrl = params.cmsUrl + '/chromeOS/getResource' +
    //         '?v=' + params.schemaVersion +
    //         '&serverKey=' + params.cmsKey +
    //         '&hardwareKey=' + params.hardwareKey +
    //         '&layoutId=' + params.layoutId +
    //         '&regionId=' + params.regionId +
    //         '&mediaId=' + params.mediaId;
    // }

    return resourceUrl;
}
