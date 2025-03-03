import { GetLayoutParamType, GetLayoutType, ILayout, OptionsType } from '../../Types/Layout';
import { IXlr } from '../../Types/XLR';
import './layout.css';
export declare function initRenderingDOM(targetContainer: Element | null): void;
export declare function getXlf(layoutOptions: OptionsType): Promise<string>;
export declare function handleAxiosError(error: any, message?: string): void;
export declare function getLayout(params: GetLayoutParamType): GetLayoutType;
export interface ILayoutEvents {
    start: (layout: ILayout) => void;
    end: (layout: ILayout) => void;
}
export default function Layout(data: Document | null, options: OptionsType, xlr: IXlr, layout?: ILayout): ILayout;
