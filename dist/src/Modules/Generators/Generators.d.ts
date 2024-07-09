import { IMedia } from '../../Types/Media';
import { OptionsType } from "../../Types/Layout";
export declare function nextId(options: {
    idCounter: number;
}): number;
export declare const getMediaId: ({ mediaType, containerName }: IMedia) => string;
export declare const capitalizeStr: (inputStr: string) => string;
export declare function preloadMediaBlob(src: string, type: 'video' | 'audio'): Promise<string>;
export declare function fetchJSON(url: string): Promise<any>;
export declare function getFileExt(filename: string): string;
export declare function audioFileType(str: string): string | undefined;
export declare function composeResourceUrlByPlatform(platform: OptionsType['platform'], params: any): string;
