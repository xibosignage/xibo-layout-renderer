import { ILayout, OptionsType } from '../../types';
import './action-controller.css';
export declare class Action {
    readonly id: string;
    readonly xml: Element;
    constructor(id: string, xml: Element);
}
export declare class ActionsWrapper extends HTMLDivElement {
    constructor();
}
export type InactOptions = {
    [k: string]: any;
} & OptionsType['previewTranslations'];
export default class ActionController {
    readonly parent: ILayout;
    readonly actions: Action[];
    readonly options: InactOptions;
    readonly $container: HTMLElement | null;
    readonly $actionController: ActionsWrapper;
    readonly $actionListContainer: Element | null;
    $actionControllerTitle: HTMLElement | null;
    $actionsContainer: HTMLElement | null;
    translations: any;
    constructor(parent: ILayout, actions: Action[], options: InactOptions);
    init(): void;
    openLayoutInNewTab(layoutCode: string, options: InactOptions): void;
    openLayoutInPlayer(layoutCode: string, options: InactOptions): void;
    prevOrNextLayout(targetId: string, actionType: string): void;
    /** Change media in region (next/previous) */
    nextMediaInRegion(regionId: string, actionType: string): void;
    loadMediaInRegion(regionId: string, widgetId: string): void;
    /** Run action based on action data */
    runAction(actionData: {
        [k: string]: any;
    }, options: InactOptions): void;
    initTouchActions(): void;
}
