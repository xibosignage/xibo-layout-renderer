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
};
