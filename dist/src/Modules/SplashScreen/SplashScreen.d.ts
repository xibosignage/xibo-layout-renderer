import './splash-screen.css';
import { OptionsType } from '../../Types/Layout';
export interface ISplashScreen {
    init: () => void;
    show: () => void;
    hide: () => void;
}
export interface PreviewSplashElement extends HTMLDivElement {
    hide: () => void;
}
export declare function SplashScreen($parent: Element | null, config?: OptionsType): ISplashScreen;
