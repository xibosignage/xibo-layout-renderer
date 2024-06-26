import { IMedia } from "../Types/Media.types";
export declare function nextId(options: {
    idCounter: number;
}): number;
export declare const getMediaId: ({ mediaType, containerName }: IMedia) => string;
export declare const capitalizeStr: (inputStr: string) => string;
export declare function preloadMediaBlob(src: string, type: 'video' | 'audio'): Promise<string>;
export declare function fetchJSON(url: string): Promise<any>;
export declare function isAudioType(filename: string): boolean;
export declare function getFileExt(filename: string): string;
export declare function audioFileType(str: string): string | undefined;
