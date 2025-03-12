import { IMedia } from '../../Types/Media';
import { InputLayoutType, OptionsType } from '../../Types/Layout';
export declare function nextId(options: {
    idCounter: number;
}): number;
export declare const getMediaId: ({ mediaType, containerName }: IMedia) => string;
export declare const capitalizeStr: (inputStr: string) => string;
export declare function getDataBlob(src: string): Promise<unknown>;
export type MediaTypes = 'video' | 'audio' | 'image';
export declare function preloadMediaBlob(src: string, type: MediaTypes): Promise<string>;
export declare function fetchJSON(url: string): Promise<any>;
export declare function fetchText(url: string): Promise<string>;
export declare function getFileExt(filename: string): string;
export declare function audioFileType(str: string): string | undefined;
export declare function videoFileType(str: string): string | undefined;
export declare function composeResourceUrlByPlatform(options: OptionsType, params: any): string;
export declare function composeResourceUrl(options: OptionsType, params: any): string;
export declare function composeMediaUrl(params: any): string;
export declare function composeBgUrlByPlatform(platform: OptionsType['platform'], params: any): string;
type LayoutIndexType = {
    [k: string]: InputLayoutType & {
        index: number;
    };
};
export declare function getIndexByLayoutId(layoutsInput: InputLayoutType[], layoutId?: number | null): (InputLayoutType & {
    index: number;
}) | LayoutIndexType | {
    index: number;
};
export declare function isEmpty(input: any): boolean;
export declare const splashScreenLayoutObj: InputLayoutType;
export declare function splashScreenDOM(): HTMLImageElement;
export declare function getAllAttributes(elem: Element): {
    [k: string]: any;
};
/**
 * Create expiration day based on current date
 * @param numDays Number of days as expiry
 * @returns JSON string format of date
 */
export declare function setExpiry(numDays: number): string;
/**
 * Check if given layout exists in the loop using layoutId
 * @param layouts Schedule loop unique layouts (uniqueLayouts)
 * @param layoutId Layout ID of the layout to look for
 *
 * @return boolean
 */
export declare function isLayoutValid(layouts: InputLayoutType[], layoutId: number): boolean;
export {};
