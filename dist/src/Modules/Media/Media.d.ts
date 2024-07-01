import { OptionsType } from '../../Types/Layout';
import { IRegion } from '../../Types/Region';
import { IMedia } from '../../Types/Media';
export interface IMediaEvents {
    start: (media: IMedia) => void;
    end: (media: IMedia) => void;
}
export default function Media(region: IRegion, mediaId: string, xml: Element, options: OptionsType): IMedia;
