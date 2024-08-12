import { IMedia } from '../../Types/Media';
export default function VideoMedia(media: IMedia): {
    prepare($videoMedia: HTMLVideoElement): HTMLVideoElement;
    init(): void;
};
