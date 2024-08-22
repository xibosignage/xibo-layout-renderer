import { IMedia } from '../../Types/Media';
import { InputLayoutType, OptionsType } from '../../Types/Layout';
export declare function nextId(options: {
    idCounter: number;
}): number;
export declare const getMediaId: ({ mediaType, containerName }: IMedia) => string;
export declare const capitalizeStr: (inputStr: string) => string;
export declare function getDataBlob(src: string): Promise<unknown>;
export declare function preloadMediaBlob(src: string, type: 'video' | 'audio' | 'image'): Promise<string>;
export declare function fetchJSON(url: string): Promise<any>;
export declare function getFileExt(filename: string): string;
export declare function audioFileType(str: string): string | undefined;
export declare function composeResourceUrlByPlatform(options: OptionsType, params: any): string;
export declare function composeResourceUrl(config: OptionsType['config'], params: any): string;
export declare function composeBgUrlByPlatform(platform: OptionsType['platform'], params: any): string;
type LayoutIndexType = {
    [k: string]: InputLayoutType & {
        index: number;
    };
};
export declare function getIndexByLayoutId(layoutsInput: InputLayoutType[], layoutId?: number | null): (InputLayoutType & {
    index: number;
}) | LayoutIndexType;
export declare function isEmpty(input: any): boolean;
export declare const splashScreenLayoutObj: InputLayoutType;
export declare function splashScreenDOM(): HTMLImageElement;
export {};
