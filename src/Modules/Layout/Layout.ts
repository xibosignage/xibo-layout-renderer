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
import {createNanoEvents} from "nanoevents";
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

    if (layoutOptions.platform === 'CMS') {
        xlfUrl = apiHost + layoutOptions.xlfUrl;
    } else if (layoutOptions.platform === 'chromeOS') {
        xlfUrl = layoutOptions.xlfUrl;
    } else if (layoutOptions.platform !== 'CMS' && layoutOptions.appHost !== null) {
        xlfUrl = layoutOptions.appHost + layoutOptions.xlfUrl;
    }

    const res = await fetch(xlfUrl, {mode: 'no-cors'});
    return await res.text();
}

export function getLayout(params: GetLayoutParamType): GetLayoutType {
    let _currentLayout = undefined;
    let _nextLayout = undefined;
    let {
        inputLayouts,
        currentLayout,
        nextLayout,
        currentLayoutIndex
    } = params.xlr;
    const hasLayout = inputLayouts.length > 0;
    const nextLayoutIndex = currentLayoutIndex + 1;

    if (currentLayout === undefined && nextLayout === undefined) {
        let activeLayout;
        // Preview just got started
        if (hasLayout) {
            activeLayout = inputLayouts[currentLayoutIndex];
            _currentLayout = {...initialLayout};

            if (inputLayouts.length > 1) {
                activeLayout = inputLayouts[nextLayoutIndex];
                _nextLayout = {...initialLayout};
            } else {
                _nextLayout = _currentLayout;
            }

            _currentLayout.id = activeLayout.layoutId;
            _currentLayout.layoutId = activeLayout.layoutId;
            _currentLayout.path = activeLayout?.path ?? '';

            _nextLayout.id = activeLayout.layoutId;
            _nextLayout.layoutId = activeLayout.layoutId;
            _nextLayout.path = activeLayout?.path ?? '';
        }
    } else {
        if (hasLayout) {
            _currentLayout = nextLayout;

            if (inputLayouts.length > 1 && nextLayoutIndex < inputLayouts.length) {
                if (Boolean(params.xlr.layouts[nextLayoutIndex])) {
                    _nextLayout = params.xlr.layouts[nextLayoutIndex];
                } else {
                    _nextLayout = {...initialLayout, ...inputLayouts[nextLayoutIndex]};
                }
            }

            // If _nextLayout is undefined, then we go back to first layout
            if (_nextLayout === undefined) {
                _nextLayout = params.xlr.layouts[0];
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

    emitter.on('start', (layout) => {
        layout.done = false;
        console.log('Layout start emitted > Layout ID > ', layout.id);
    });

    emitter.on('end', (layout) => {
        console.log('Ending layout with ID of > ', layout.layoutId);
        layout.done = true;
        /* Remove layout that has ended */
        const $layout = document.getElementById(layout.containerName);

        console.log({$layout});

        if ($layout !== null) {
            $layout.remove();
        }

        if (xlr.config.platform !== 'CMS') {
            // Transition next layout to current layout and prepare next layout if exist
            xlr.prepareLayouts().then((parent) => {
                xlr.playSchedules(parent);
            });
        }
    });

    const layoutObject: ILayout = {
        ...props.layout,
        options: props.options,
        emitter,
    };

    layoutObject.on = function<E extends keyof ILayoutEvents>(event: E, callback: ILayoutEvents[E]) {
        return emitter.on(event, callback);
    };
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

        console.log('Layout running > Layout ID > ', layout.id);
        console.log('Layout Regions > ', layout.regions);
        for (let i = 0; i < layout.regions.length; i++) {
            // playLog(4, "debug", "Running region " + self.regions[i].id, false);
            layout.regions[i].run();
        }
    };

    layoutObject.parseXlf = function() {
        const layout = layoutObject;
        const {data, options} = props;
        layout.containerName = "L" + layout.id + "-" + nextId(options);
        layout.regions = [];

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
            $layout.style.outline = 'red solid thin';
        }

        layout.layoutNode = data;

        /* Calculate the screen size */
        layout.sw = $screen?.offsetWidth || 0;
        layout.sh = $screen?.offsetHeight || 0;

        layout.xw = Number(layout.layoutNode?.firstElementChild?.getAttribute('width'));
        layout.xh = Number(layout.layoutNode?.firstElementChild?.getAttribute('height'));
        layout.zIndex = Number(layout.layoutNode?.firstElementChild?.getAttribute('zindex')) || 0;

        /* Calculate Scale Factor */
        layout.scaleFactor = Math.min((layout.sw / layout.xw), (layout.sh / layout.xh));
        layout.sWidth = Math.round(layout.xw * layout.scaleFactor);
        layout.sHeight = Math.round(layout.xh * layout.scaleFactor);
        layout.offsetX = Math.abs(layout.sw - layout.sWidth) / 2;
        layout.offsetY = Math.abs(layout.sh - layout.sHeight) / 2;

        const layoutStyles = `
            width: ${layout.sWidth}px;
            height: ${layout.sHeight}px;
            position: absolute;
            left: ${layout.offsetX}px;
            top: ${layout.offsetY}px;
        `;
        /* Scale the Layout Container */
        if ($layout) {
            $layout.style.cssText = layoutStyles;
        }

        if ($layout && layout.zIndex !== null) {
            $layout.style.cssText = layoutStyles.concat(`z-index: ${layout.zIndex};`);
        }

        /* Set the layout background */
        layout.bgColor = layout.layoutNode?.firstElementChild?.getAttribute('bgcolor') || '';
        layout.bgImage = layout.layoutNode?.firstElementChild?.getAttribute('background') || '';

        if (!(layout.bgImage === "" || typeof layout.bgImage === 'undefined')) {
            /* Extract the image ID from the filename */
            layout.bgId = layout.bgImage.substring(0, layout.bgImage.indexOf('.'));

            let tmpUrl = options.layoutBackgroundDownloadUrl.replace(":id", (layout.id as unknown) as string) + '?preview=1';

            // preload.addFiles(tmpUrl + "&width=" + self.sWidth + "&height=" + self.sHeight + "&dynamic&proportional=0");
            if ($layout) {
                $layout.style.cssText = layoutStyles.concat(`
                    background: url('${tmpUrl}&width=${layout.sWidth}&height=${layout.sHeight}&dynamic&proportional=0');
                    backgroundRepeat: "no-repeat";
                    backgroundSize: ${layout.sWidth}px ${layout.sHeight}px;
                    backgroundPosition: "0px 0px";
                `);
            }
        }

        // Set the background color
        if ($layout) {
            $layout.style.cssText = layoutStyles.concat(`background-color: layout.bgColor;`);
        }

        // Hide if layout is not the currentLayout
        if ($layout && xlr.currentLayoutId !== undefined && xlr.currentLayoutId !== layout.id) {
            $layout.style.cssText = $layout.style.cssText.concat('display: none;');
        }

        // Create regions
        const layoutRegions = Array.from(layout?.layoutNode?.getElementsByTagName('region') || []);

        Array.from(layoutRegions).forEach((regionXml, indx) => {
            const regionObj = Region(
                layout,
                regionXml,
                regionXml?.getAttribute('id') || '',
                options,
            );

            regionObj.index = indx;
            layout.regions.push(regionObj);
        });
    };

    layoutObject.prepareLayout = function() {
        layoutObject.parseXlf();
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

    layoutObject.regionEnded = function() {
        const self = layoutObject;
        self.allEnded = true;
        
        for (var i = 0; i < self.regions.length; i++) {
            if (! self.regions[i].ended) {
                self.allEnded = false;
            }
        }
        
        if (self.allEnded) {
            self.stopAllMedia().then(() => {
                console.log('starting to end layout . . .');
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
                
                self.emitter?.emit('end', self);
            });

        }
    };

    layoutObject.end = function() {
        console.log('Executing Layout::end and Calling Region::end ', layoutObject);

        /* Ask the layout to gracefully stop running now */
        for (let layoutRegion of layoutObject.regions) {
            layoutRegion.end();
        }
    };

    layoutObject.stopAllMedia = function() {
        console.log('Stopping all media . . .');
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

    layoutObject.prepareLayout();

    return layoutObject;
}
