export const defaultTrans = (duration: number, trans: 'in' | 'out') => {
    const defaultKeyframes = [
        { display: trans === 'in' ? 'none' : 'block' },
        { display: trans === 'out' ? 'none' : 'block' },
    ];
    const defaultTiming: number | KeyframeAnimationOptions | undefined = {
        duration,
    };

    return {
        keyframes: defaultKeyframes,
        timing: defaultTiming,
    };
};

export const fadeInElem = (duration: number) => {
    const fadeInKeyframes = [
        { opacity: 0 },
        { opacity: 1 },
    ];
    const fadeInTiming: number | KeyframeAnimationOptions | undefined = {
        duration,
        fill: 'forwards',
    };

    return {
        keyframes: fadeInKeyframes,
        timing: fadeInTiming,
    }
};

export const fadeOutElem = (duration: number) => {
    const fadeOutKeyframes = [
        { opacity: 1 },
        { opacity: 0 },
    ];
    const fadeOutTiming: number | KeyframeAnimationOptions | undefined = {
        duration,
        fill: 'forwards',
    };

    return {
        keyframes: fadeOutKeyframes,
        timing: fadeOutTiming,
    }
};

export type KeyframeOptionsType = {
    from: {
        [k: string]: any,
    },
    to: {
        [k: string]: any,
    },
}

export const flyInElem = (duration: number, keyframeOptions: KeyframeOptionsType | undefined, direction?: string) => {
    const flyInKeyframes = [
        {opacity: 0},
        {opacity: 1},
    ];
    const flyInTiming: number | KeyframeAnimationOptions | undefined = {
        duration,
        fill: 'forwards',
    };

    if (keyframeOptions && Boolean(keyframeOptions.from)) {
        flyInKeyframes[0] = {...keyframeOptions.from, ...flyInKeyframes[0]};
    }

    if (keyframeOptions && Boolean(keyframeOptions.to)) {
        flyInKeyframes[1] = {...keyframeOptions.to, ...flyInKeyframes[1]};
    }

    return {
        keyframes: flyInKeyframes,
        timing: flyInTiming,
    };
};

export const flyOutElem = (duration: number, keyframeOptions: KeyframeOptionsType | undefined, direction?: string) => {
    const flyOutKeyframes = [
        {opacity: 1},
        {opacity: 0},
    ];
    const flyOutTiming: number | KeyframeAnimationOptions | undefined = {
        duration,
        fill: 'forwards',
    };

    if (keyframeOptions && Boolean(keyframeOptions.from)) {
        flyOutKeyframes[0] = {...keyframeOptions.from, ...flyOutKeyframes[0]};
    }

    if (keyframeOptions && Boolean(keyframeOptions.to)) {
        flyOutKeyframes[1] = {...keyframeOptions.to, ...flyOutKeyframes[1]};
    }

    return {
        keyframes: flyOutKeyframes,
        timing: flyOutTiming,
    };
};

export type TransitionNameType = 'fadeIn' | 'fadeOut' | 'flyIn' | 'flyOut' | 'defaultIn' | 'defaultOut';

export type TransitionElementOptions = {
    duration: number;
    keyframes?: KeyframeOptionsType;
    direction?: string;
};

export const transitionElement = (transition: TransitionNameType, options: TransitionElementOptions) => {
    const transitions = {
        fadeIn: fadeInElem(options.duration),
        fadeOut: fadeOutElem(options.duration),
        flyIn: flyInElem(options.duration, options.keyframes, options.direction),
        flyOut: flyOutElem(options.duration, options.keyframes, options.direction),
        defaultIn: defaultTrans(options.duration, 'in'),
        defaultOut: defaultTrans(options.duration, 'out'),
    };

    return transitions[transition];
};

export type compassPoints = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'RESET';

export type flyTransitionParams = {
    trans: 'in' | 'out';
    direction: compassPoints;
    height: string | number;
    width: string | number;
};

export const flyTransitionKeyframes = (params: flyTransitionParams): KeyframeOptionsType => {
    const keyframes = {
        from: {},
        to: {},
    };
    const opacityAttr = (source: 'from' | 'to') => {
        if (source === 'from') {
            return params.trans === 'in' ? 0 : 1;
        }
        
        return params.trans === 'out' ? 1 : 0;
    };

    switch (params.direction) {
        case 'N':
            keyframes.from = {
                opacity: opacityAttr('from'),
                top: params.trans === 'in' ? `${params.height}px` : 0,
            };
            keyframes.to = {
                opacity: opacityAttr('to'),
                top: params.trans === 'in' ? 0 : `-${params.height}px`,
            };
            break;
        case 'NE':
            keyframes.from = {
                opacity: opacityAttr('from'),
                top: params.trans === 'in' ? `${params.height}px` : 0,
                left: params.trans === 'in' ? `-${params.width}px` : 0,
            };
            keyframes.to = {
                opacity: opacityAttr('to'),
                top: params.trans === 'in' ? 0 : `-${params.height}px`,
                left: params.trans === 'in' ? 0 : `${params.width}px`,
            };
            break;
        case 'E':
            keyframes.from = {
                opacity: opacityAttr('from'),
                left: params.trans === 'in' ? `-${params.width}px` : 0,
            };
            keyframes.to = {
                opacity: opacityAttr('to'),
                left: params.trans === 'in' ? 0 : `${params.width}px`,
            };
            break;
        case 'SE':
            keyframes.from = {
                opacity: opacityAttr('from'),
                top: params.trans === 'in' ? `-${params.height}px` : 0,
                left: params.trans === 'in' ? `-${params.width}px` : 0,
            };
            keyframes.to = {
                opacity: opacityAttr('to'),
                top: params.trans === 'in' ? 0 : `${params.height}px`,
                left: params.trans === 'in' ? 0 : `${params.width}px`,
            };
            break;
        case 'S':
            keyframes.from = {
                opacity: opacityAttr('from'),
                top: params.trans === 'in' ? `-${params.height}px` : 0,
            };
            keyframes.to = {
                opacity: opacityAttr('to'),
                top: params.trans === 'in' ? 0 : `${params.height}px`,
            };
            break;
        case 'SW':
            keyframes.from = {
                opacity: opacityAttr('from'),
                top: params.trans === 'in' ? `-${params.height}px` : 0,
                left: params.trans === 'in' ? `${params.width}px` : 0,
            };
            keyframes.to = {
                opacity: opacityAttr('to'),
                top: params.trans === 'in' ? 0 : `${params.height}px`,
                left: params.trans === 'in' ? 0 : `-${params.width}px`,
            };
            break;
        case 'W':
            keyframes.from = {
                opacity: opacityAttr('from'),
                left: params.trans === 'in' ? `${params.width}px` : 0,
            };
            keyframes.to = {
                opacity: opacityAttr('to'),
                left: params.trans === 'in' ? 0 : `-${params.width}px`,
            };
            break;
        case 'NW':
            keyframes.from = {
                opacity: opacityAttr('from'),
                top: params.trans === 'in' ? `${params.height}px` : 0,
                left: params.trans === 'in' ? `${params.width}px` : 0,
            };
            keyframes.to = {
                opacity: opacityAttr('to'),
                top: params.trans === 'in' ? 0 : `-${params.height}px`,
                left: params.trans === 'in' ? 0 : `-${params.width}px`,
            };
            break;
        case 'RESET':
            keyframes.from = {
                opacity: 0,
                top: 0,
                left: 0,
            };
            keyframes.to = {
                opacity: 0,
                top: 0,
                left: 0,
            };
            break;
        default:
            keyframes.from = {
                opacity: opacityAttr('from'),
                top: params.trans === 'in' ? `${params.height}px` : 0,
            };
            keyframes.to = {
                opacity: opacityAttr('to'),
                top: params.trans === 'in' ? 0 : `-${params.height}px`,
            };
            break;
    }

    return keyframes;
};
