/*
 * Copyright (C) 2024 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://www.xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */
import {createNanoEvents} from 'nanoevents';
import {
    GetLayoutParamType,
    GetLayoutType,
    ILayout,
    initialLayout,
    OptionsType,
} from '../../Types/Layout';
import { IXlr } from '../../Types/XLR';
import { nextId } from '../Generators';
import { Region } from '../Region';

import './layout.css';
import {composeBgUrlByPlatform, getIndexByLayoutId} from '../Generators/Generators';
import ActionController, { Action } from '../ActionController';

const playAgainClickHandle = function(ev: { preventDefault: () => void; }) {
    ev.preventDefault();
    history.go(0);
};

export function initRenderingDOM(targetContainer: Element | null) {
    let _targetContainer = targetContainer;
    const previewPlayer = document.createElement('div');
    const previewScreen = document.createElement('div');
    const endPlay = document.createElement('div');
    const playAgainLink = document.createElement('a');

    // Preview player
    previewPlayer.className = 'player-preview';
    previewPlayer.id = 'player_container';

    // Preview screen
    previewScreen.className = 'screen-preview';
    previewScreen.id = 'screen_container';

    // Ended play
    endPlay.className = 'preview-ended';
    endPlay.id = 'play_ended';
    endPlay.style.display = 'none';

    // Play again link
    playAgainLink.id = 'play_back_preview';
    playAgainLink.className = 'play-back-preview';
    playAgainLink.style.cssText = 'text-decoration: none; color: #ffffff;';
    playAgainLink.innerHTML = 'Play again?';
    playAgainLink.removeEventListener('click', playAgainClickHandle);
    playAgainLink.addEventListener('click', playAgainClickHandle);

    if (!_targetContainer) {
        _targetContainer = document.body;
    }

    if (_targetContainer) {
        if (_targetContainer.querySelector('#player_container') === null) {
            _targetContainer.insertBefore(previewPlayer, _targetContainer.firstChild);

            if (previewPlayer.querySelector('#screen_container') === null) {
                previewPlayer.appendChild(previewScreen);
            }

            if (previewPlayer.querySelector('#play_ended') === null) {
                previewPlayer.appendChild(endPlay);

                if (endPlay.querySelector('a') === null) {
                    endPlay.appendChild(playAgainLink);
                }
            }
        }
    }
}

export async function getXlf(layoutOptions: OptionsType) {
    let apiHost = window.location.origin;

    let xlfUrl = apiHost + layoutOptions.xlfUrl;
    let fetchOptions: RequestInit = {};

    if (layoutOptions.platform === 'CMS') {
        xlfUrl = apiHost + layoutOptions.xlfUrl;
        fetchOptions.mode = 'no-cors';
    } else if (layoutOptions.platform === 'chromeOS') {
        xlfUrl = layoutOptions.xlfUrl;
        fetchOptions.mode = 'cors';
        fetchOptions.headers = {
            'Content-Type': 'text/xml',
        };
    } else if (layoutOptions.platform !== 'CMS' && layoutOptions.appHost !== null) {
        xlfUrl = layoutOptions.appHost + layoutOptions.xlfUrl;
    }

    const res = await fetch(xlfUrl);

    return await res.text();
}

export function handleAxiosError(error: any, message?: string) {
    console.error(error);
    if (error.response.status == 500) {
        // SOAP responses are always 500's
        // Return the body
        throw new Error(error.response.data);
    } else {
        throw new Error(message || 'Unknown Error');
    }
}

export function getLayout(params: GetLayoutParamType): GetLayoutType {
    let _currentLayout = undefined;
    let _nextLayout = undefined;
    let {
        inputLayouts,
        currentLayout,
        nextLayout,
        currentLayoutIndex: currLayoutIndx
    } = params.xlr;
    const hasLayout = inputLayouts.length > 0;
    let currentLayoutIndex = currLayoutIndx;
    let nextLayoutIndex = currentLayoutIndex + 1;

    if (currentLayout === undefined && nextLayout === undefined) {
        let activeLayout;
        // Preview just got started
        if (hasLayout) {
            let nextLayoutTemp = {...initialLayout};
            activeLayout = inputLayouts[currentLayoutIndex];
            _currentLayout = {...initialLayout, ...activeLayout};

            if (inputLayouts.length > 1) {
                nextLayoutTemp = {...nextLayoutTemp, ...inputLayouts[nextLayoutIndex]};
                _nextLayout = nextLayoutTemp;
            } else {
                _nextLayout = _currentLayout;
            }

            _currentLayout.id = activeLayout.layoutId;

            if (nextLayoutTemp) {
                _nextLayout.id = nextLayoutTemp.layoutId;
            }
        }
    } else {
        if (hasLayout) {
            _currentLayout = nextLayout;

            currentLayoutIndex = getIndexByLayoutId(inputLayouts, _currentLayout?.layoutId).index as number;
            nextLayoutIndex = currentLayoutIndex + 1;

            if (inputLayouts.length > 1 && nextLayoutIndex < inputLayouts.length) {
                if (Boolean(params.xlr.layouts[nextLayoutIndex])) {
                    _nextLayout = params.xlr.layouts[nextLayoutIndex];
                } else {
                    _nextLayout = {...initialLayout, ...inputLayouts[nextLayoutIndex]};
                }
            }

            // If _nextLayout is undefined, then we go back to first layout
            if (_nextLayout === undefined) {
                let availableLayout = null;

                // Get available layout
                for (let _availableLayout of params.xlr.layouts) {
                    if (_availableLayout === undefined) {
                        params.xlr.layouts.shift();
                    } else {
                        availableLayout = _availableLayout;
                        break;
                    }
                }

                _nextLayout = availableLayout !== null ?
                    availableLayout : {...initialLayout, ...inputLayouts[0]};
            }
        }
    }

    return {
        currentLayoutIndex,
        inputLayouts: params.xlr.inputLayouts,
        current: _currentLayout,
        next: _nextLayout,
    }
}

export interface ILayoutEvents {
    start: (layout: ILayout) => void;
    end: (layout: ILayout) => void;
}

export default function Layout(
    data: Document | null,
    options: OptionsType,
    xlr: IXlr,
    layout?: ILayout
) {
    const props = {
        data: data,
        options: options,
        layout: layout || initialLayout,
    }
    const emitter = createNanoEvents<ILayoutEvents>();
    const statsBC = new BroadcastChannel('statsBC');

    emitter.on('start', (layout: ILayout) => {
        layout.done = false;
        console.debug('Layout start emitted > Layout ID > ', layout.id);

        // Check if stats are enabled for the layout
        if (layout.enableStat) {
            statsBC.postMessage({
                action: 'START_STAT',
                layoutId: layout.id,
                scheduleId: layout.scheduleId,
                type: 'layout',
            });
        }
    });

    emitter.on('end', async (layout: ILayout) => {
        console.debug('Ending layout with ID of > ', layout.layoutId);
        /* Remove layout that has ended */
        const $layout = document.getElementById(layout.containerName);

        layout.done = true;
        console.debug({$layout});

        if ($layout !== null) {
            $layout.parentElement?.removeChild($layout);
        }

        // Check if stats are enabled for the layout
        if (layout.enableStat) {
            statsBC.postMessage({
                action: 'END_STAT',
                layoutId: layout.id,
                scheduleId: layout.scheduleId,
                type: 'layout',
            });
        }

        if (xlr.config.platform !== 'CMS' && layout.inLoop) {
            // Transition next layout to current layout and prepare next layout if exist
            xlr.prepareLayouts().then((parent) => {
                xlr.playSchedules(parent);
            });
        }
    });

    const layoutObject: ILayout = {
        ...props.layout,
        options: props.options,
    };

    layoutObject.xlr = xlr;

    layoutObject.on = function<E extends keyof ILayoutEvents>(event: E, callback: ILayoutEvents[E]) {
        return emitter.on(event, callback);
    };
    layoutObject.emitter = emitter;

    layoutObject.run = function() {
        const layout = layoutObject;
        const $layoutContainer = document.getElementById(`${layout.containerName}`);
        const $splashScreen = document.getElementById(`splash_${layout.id}`);

        if ($layoutContainer) {
            $layoutContainer.style.display = 'block';
        }

        if ($splashScreen) {
            $splashScreen.style.display = 'none';
        }

        console.debug('Layout running > Layout ID > ', layout.id);
        console.debug('Layout Regions > ', layout.regions);
        for (let i = 0; i < layout.regions.length; i++) {
            // playLog(4, "debug", "Running region " + self.regions[i].id, false);
            layout.regions[i].run();
        }
    };

    layoutObject.prepareLayout = function(){
        layoutObject.parseXlf();
    };

    layoutObject.parseXlf = function() {
        const layout = this;
        const {options} = layout;

        layout.done = false;
        layout.allEnded = false;
        layout.allExpired = false;
        layout.containerName = "L" + layout.id + "-" + nextId(options);
        layout.regions = [];
        layout.actions = [];

        /* Create a hidden div to show the layout in */
        let $layout = document.getElementById(layout.containerName);

        if ($layout === null) {
            $layout = document.createElement('div');
            $layout.id = layout.containerName;
        }

        let $screen = document.getElementById('screen_container');
        ($screen) && $screen.appendChild($layout);

        if ($layout) {
            $layout.style.display = 'none';
            if (xlr.config.platform === 'CMS') {
                $layout.style.outline = 'red solid thin';
            }
        }

        layout.layoutNode = props.data;

        /* Calculate the screen size */
        layout.sw = $screen?.offsetWidth || 0;
        layout.sh = $screen?.offsetHeight || 0;

        layout.xw = Number(layout.layoutNode?.firstElementChild?.getAttribute('width'));
        layout.xh = Number(layout.layoutNode?.firstElementChild?.getAttribute('height'));
        layout.zIndex = Number(layout.layoutNode?.firstElementChild?.getAttribute('zindex')) || 0;
        layout.enableStat = Boolean(layout.layoutNode?.firstElementChild?.getAttribute('enableStat') || false);

        /* Calculate Scale Factor */
        layout.scaleFactor = Math.min((layout.sw / layout.xw), (layout.sh / layout.xh));
        layout.sWidth = layout.xw * layout.scaleFactor;
        layout.sHeight = layout.xh * layout.scaleFactor;
        layout.offsetX = Math.abs(layout.sw - layout.sWidth) / 2;
        layout.offsetY = Math.abs(layout.sh - layout.sHeight) / 2;

        /* Scale the Layout Container */
        if ($layout) {
            $layout.style.width = `${layout.sWidth}px`;
            $layout.style.height = `${layout.sHeight}px`;
            $layout.style.position = 'absolute';
            $layout.style.left = `${layout.offsetX}px`;
            $layout.style.top = `${layout.offsetY}px`;
        }

        if ($layout && layout.zIndex !== null) {
            $layout.style.zIndex = `${layout.zIndex}`;
        }

        /* Set the layout background */
        layout.bgColor = layout.layoutNode?.firstElementChild?.getAttribute('bgcolor') || '';
        layout.bgImage = layout.layoutNode?.firstElementChild?.getAttribute('background') || '';

        if (!(layout.bgImage === "" || typeof layout.bgImage === 'undefined')) {
            /* Extract the image ID from the filename */
            layout.bgId = layout.bgImage.substring(0, layout.bgImage.indexOf('.'));

            const bgImageUrl = composeBgUrlByPlatform(
                xlr.config.platform,
                {
                    ...options,
                    layout,
                }
            );

            if ($layout) {
                $layout.style.backgroundImage = `url("${bgImageUrl}")`;
                $layout.style.backgroundRepeat = 'no-repeat';
                $layout.style.backgroundSize = `${layout.sWidth}px ${layout.sHeight}px`;
                $layout.style.backgroundPosition = '0px 0px';
            }
        }

        // Set the background color
        if ($layout && layout.bgColor) {
            $layout.style.backgroundColor = `${layout.bgColor}`;
        }

        // Hide if layout is not the currentLayout
        if ($layout && xlr.currentLayoutId !== undefined && xlr.currentLayoutId !== layout.id) {
            $layout.style.display = 'none';
        }

        // Create actions
        const layoutActions = Array.from(layout?.layoutNode?.getElementsByTagName('action') || []);
        Array.from(layoutActions).forEach((actionXml, indx) => {
            layout.actions.push(new Action(actionXml?.getAttribute('id') || '', actionXml));
        });

        // Create interactive actions
        layout.actionController = new ActionController(
            layout,
            layout.actions,
            options,
        );

        // Create drawer
        const layoutDrawers = Array.from(layout?.layoutNode?.getElementsByTagName('drawer') || []);

        Array.from(layoutDrawers).forEach((layoutDrawerXml) => {
            layout.drawer = layoutDrawerXml;
        });

        // Create regions
        const layoutRegions = Array.from(layout?.layoutNode?.getElementsByTagName('region') || []);

        Array.from(layoutRegions).forEach((regionXml, indx) => {
            const regionObj = Region(
                layout,
                regionXml,
                regionXml?.getAttribute('id') || '',
                options,
                xlr,
            );

            regionObj.index = indx;
            layout.regions.push(regionObj);
        });

        layout.actionController.initTouchActions();
    };

    layoutObject.regionExpired = function() {
        const self = layoutObject;
        self.allExpired = true;

        for (let layoutRegion of self.regions) {
            if (!layoutRegion.complete) {
                self.allExpired = false;
            }
        }

        if (self.allExpired) {
            self.end();
        }
    };

    layoutObject.regionEnded = async function() {
        const self = layoutObject;
        self.allEnded = true;
        
        for (let i = 0; i < self.regions.length; i++) {
            if (! self.regions[i].ended) {
                self.allEnded = false;
            }
        }
        
        if (self.allEnded) {
            await self.stopAllMedia();

            console.debug('starting to end layout . . .');
            if (xlr.config.platform === 'CMS') {
                const $end = document.getElementById('play_ended');
                const $preview = document.getElementById('screen_container');

                if ($preview) {
                    while($preview.firstChild) {
                        $preview.removeChild($preview.firstChild);
                    }

                    $preview.style.display = 'none';
                }

                if ($end) {
                    $end.style.display = 'block';
                }
            }

            self.emitter.emit('end', self);
        }
    };

    layoutObject.end = function() {
        console.debug('Executing Layout::end and Calling Region::end ', layoutObject);

        /* Ask the layout to gracefully stop running now */
        for (let layoutRegion of layoutObject.regions) {
            layoutRegion.end();
        }
    };

    layoutObject.stopAllMedia = function() {
        console.debug('Stopping all media . . .');
        return new Promise(async (resolve) => {
            for(var i = 0;i < layoutObject.regions.length;i++) {
                var region = layoutObject.regions[i];
                for(var j = 0;j < region.mediaObjects.length;j++) {
                    var media = region.mediaObjects[j];
                    await media.stop();
                }
            }

            resolve();
        });
    };

    layoutObject.finishAllRegions = function() {
        return Promise.all(layoutObject.regions.map(region => region.finished()));
    };

    layoutObject.prepareLayout();

    return layoutObject;
}
