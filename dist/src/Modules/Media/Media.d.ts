import { OptionsType } from "../../Types/Layout.types";
import { IRegion } from "../../Types/Region.types";
import { IMedia } from "../../Types/Media.types";
export interface IMediaEvents {
    start: (media: IMedia) => void;
    end: (media: IMedia) => void;
}
export default function Media(region: IRegion, mediaId: string, xml: Element, options: OptionsType): IMedia;
