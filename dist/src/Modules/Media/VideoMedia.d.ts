import { IMedia } from '../../Types/Media';
import { IXlr } from '../../types';
import './media.css';
export declare function composeVideoSource($media: HTMLVideoElement, media: IMedia): HTMLVideoElement;
export default function VideoMedia(media: IMedia, xlr: IXlr): {
    duration: number;
    init: () => void;
    stop: (disposeOnly?: boolean) => void;
};
