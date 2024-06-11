/*
 * Copyright (C) 2024 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - http://www.xibo.org.uk
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
const RESOURCE_URL = '/playlist/widget/resource/:regionId/:id';
const XLF_URL = '/layout/xlf/:layoutId';
const LAYOUT_BACKGROUND_DOWNLOAD_URL = '/layout/background/:id';
const LAYOUT_PREVIEW_URL = '/layout/preview/[layoutCode]';
const LIBRARY_DOWNLOAD_URL = '/library/download/:id';
const LOADER_URL = '/theme/default/img/loader.gif';

export const platform = {
    getResourceUrl: RESOURCE_URL,
    xlfUrl: XLF_URL,
    layoutBackgroundDownloadUrl: LAYOUT_BACKGROUND_DOWNLOAD_URL,
    layoutPreviewUrl: LAYOUT_PREVIEW_URL,
    libraryDownloadUrl: LIBRARY_DOWNLOAD_URL,
    loaderUrl: LOADER_URL,
    idCounter: 0,
    inPreview: true,
    appHost: null,
};
