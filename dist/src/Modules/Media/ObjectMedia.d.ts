import { IMedia } from '../../Types/Media';
export default function ObjectMedia(media: IMedia): {
    prepare($objectMedia: HTMLObjectElement): HTMLObjectElement;
    init(): void;
};
