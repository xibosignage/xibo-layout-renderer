export declare const defaultTrans: (duration: number, trans: 'in' | 'out') => {
    keyframes: {
        display: string;
    }[];
    timing: KeyframeAnimationOptions;
};
export declare const fadeInElem: (duration: number) => {
    keyframes: {
        opacity: number;
    }[];
    timing: KeyframeAnimationOptions;
};
export declare const fadeOutElem: (duration: number) => {
    keyframes: {
        opacity: number;
    }[];
    timing: KeyframeAnimationOptions;
};
export type KeyframeOptionsType = {
    from: {
        [k: string]: any;
    };
    to: {
        [k: string]: any;
    };
};
export declare const flyInElem: (duration: number, keyframeOptions: KeyframeOptionsType | undefined, direction?: string) => {
    keyframes: {
        opacity: number;
    }[];
    timing: KeyframeAnimationOptions;
};
export declare const flyOutElem: (duration: number, keyframeOptions: KeyframeOptionsType | undefined, direction?: string) => {
    keyframes: {
        opacity: number;
    }[];
    timing: KeyframeAnimationOptions;
};
export type TransitionNameType = 'fadeIn' | 'fadeOut' | 'flyIn' | 'flyOut' | 'defaultIn' | 'defaultOut';
export type TransitionElementOptions = {
    duration: number;
    keyframes?: KeyframeOptionsType;
    direction?: string;
};
export declare const transitionElement: (transition: TransitionNameType, options: TransitionElementOptions) => {
    keyframes: {
        display: string;
    }[];
    timing: KeyframeAnimationOptions;
} | {
    keyframes: {
        opacity: number;
    }[];
    timing: KeyframeAnimationOptions;
} | {
    keyframes: {
        opacity: number;
    }[];
    timing: KeyframeAnimationOptions;
} | {
    keyframes: {
        opacity: number;
    }[];
    timing: KeyframeAnimationOptions;
} | {
    keyframes: {
        opacity: number;
    }[];
    timing: KeyframeAnimationOptions;
};
export type compassPoints = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'RESET';
export type flyTransitionParams = {
    trans: 'in' | 'out';
    direction: compassPoints;
    height: string | number;
    width: string | number;
};
export declare const flyTransitionKeyframes: (params: flyTransitionParams) => KeyframeOptionsType;
