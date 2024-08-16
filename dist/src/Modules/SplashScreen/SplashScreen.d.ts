import './splash-screen.css';
export interface ISplashScreen {
    init: () => void;
    show: () => void;
    hide: () => void;
}
export interface PreviewSplashElement extends HTMLDivElement {
    hide: () => void;
}
export default function SplashScreen($parent: Element | null): ISplashScreen;
