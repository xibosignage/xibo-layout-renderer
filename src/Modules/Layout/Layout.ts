/*
 * Copyright (C) 2025 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */
import {createNanoEvents, Emitter} from 'nanoevents';
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
import {composeBgUrlByPlatform} from '../Generators';
import ActionController, { Action } from '../ActionController';
import {platform} from "../Platform";
import { IRegion } from '../../types';

const playAgainClickHandle = function (ev: { preventDefault: () => void; }) {
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

            currentLayoutIndex = _currentLayout?.index as number;
            nextLayoutIndex = currentLayoutIndex + 1;

            if (inputLayouts.length > 1 && nextLayoutIndex < inputLayouts.length) {
                if (Boolean(inputLayouts[nextLayoutIndex])) {
                    _nextLayout = {...initialLayout, ...inputLayouts[nextLayoutIndex]};
                } else {
                    // If _nextLayout is undefined, then we go back to first layout
                    _nextLayout = {...initialLayout, ...inputLayouts[0]};
                }
            } else {
                // If _nextLayout is undefined, then we go back to first layout
                _nextLayout = {...initialLayout, ...inputLayouts[0]};
            }

        }
    }

    return {
        currentLayoutIndex,
        nextLayoutIndex,
        inputLayouts: params.xlr.inputLayouts,
        current: _currentLayout,
        next: _nextLayout,
    }
}

export interface ILayoutEvents {
    start: (layout: ILayout) => void;
    end: (layout: ILayout) => void;
}

export default class Layout implements ILayout {
    id: number | null = null;
    layoutId: number = -1;
    sw: number = 0;
    sh: number = 0;
    xw: number = 0;
    xh: number = 0;
    duration: number = 0;
    zIndex: number = 0;
    scaleFactor: number = 1;
    sWidth: number = 0;
    sHeight: number = 0;
    offsetX: number = 0;
    offsetY: number = 0;
    bgColor: string = '';
    bgImage: string = '';
    bgId: string = '';
    containerName: string = '';
    regionMaxZIndex: number = 0;
    ready: boolean = false;
    regionObjects: IRegion[] = <IRegion[]>[];
    drawer: Element | null = null;
    allExpired: boolean = false;
    regions: IRegion[] = <IRegion[]>[];
    actions: Action[] = <Action[]>[];
    done: boolean = false;
    allEnded: boolean = false;
    emitter: Emitter<ILayoutEvents> = createNanoEvents<ILayoutEvents>();
    index: number = -1;
    actionController: ActionController | undefined = undefined;
    enableStat: boolean = false;
    inLoop: boolean = true;
    xlfString: string = '';
    ad: any = null;
    isOverlay: boolean = false;
    shareOfVoice: number = 0;
    scheduleId?: number;
    layoutNode?: Document;
    path?: string = '';

    options: OptionsType = platform;
    xlr: IXlr = <IXlr>{};

    private readonly layoutObj: ILayout = <ILayout>{};
    protected readonly statsBC = new BroadcastChannel('statsBC');

    constructor(
      xlrLayoutObj: ILayout,
      options: OptionsType,
      xlr: IXlr,
      data?: Document,
    ) {
        this.layoutNode = data;
        this.options = options;
        this.xlr = xlr;
        this.layoutObj = xlrLayoutObj;

        // Prepare and parse layout node
        this.prepareLayout();

        this.on('start', (layout: ILayout) => {
            this.done = false;
            console.debug('Layout start emitted > Layout ID > ', layout.id);

            // Check if stats are enabled for the layout
            if (this.enableStat) {
                this.statsBC.postMessage({
                    action: 'START_STAT',
                    layoutId: layout.id,
                    scheduleId: layout.scheduleId,
                    type: 'layout',
                });
            }

            // Emit layout start event
            console.debug('Layout::Emitter > Start - Calling layoutStart event');
            this.xlr.emitter.emit('layoutStart', layout);
        });

        this.on('end', async (layout: ILayout) => {
            console.debug('Ending layout with ID of > ', layout.layoutId);
            /* Remove layout that has ended */
            const $layout = <HTMLDivElement | null>(
              document.querySelector(`#${layout.containerName}[data-sequence="${layout.index}"]`)
            );

            layout.done = true;
            console.debug({$layout});

            if ($layout !== null) {
                $layout.parentElement?.removeChild($layout);
            }

            // Emit layout end event
            console.debug('Layout::Emitter > End - Calling layoutEnd event');
            this.xlr.emitter.emit('layoutEnd', layout);

            // Check if stats are enabled for the layout
            if (layout.enableStat) {
                this.statsBC.postMessage({
                    action: 'END_STAT',
                    layoutId: layout.id,
                    scheduleId: layout.scheduleId,
                    type: 'layout',
                });
            }

            if (this.xlr.config.platform !== 'CMS' && layout.inLoop) {
                // Transition next layout to current layout and prepare next layout if exist
                const playback = this.xlr.parseLayouts();
                this.xlr.prepareLayouts(playback).then((parent) => {
                    console.log('XLR::Layout.on("end")', {playback, parent, layout});
                    this.xlr.playSchedules(parent);
                });
            }
        });
    }

    prepareLayout(): void {
        this.parseXlf();
    }

    parseXlf(): void {
        if (this.options.idCounter === 0) {
            this.options.idCounter = nextId(this.options);
        }

        this.id = this.layoutObj.id;
        this.layoutId = this.layoutObj.layoutId;
        this.scheduleId = this.layoutObj.scheduleId;
        this.index = this.layoutObj.index;
        this.xlfString = this.layoutObj.xlfString;
        this.duration = this.layoutObj.duration;
        this.ad = this.layoutObj.ad;
        this.isOverlay = this.layoutObj.isOverlay;
        this.shareOfVoice = this.layoutObj.shareOfVoice;

        this.done = false;
        this.allEnded = false;
        this.allExpired = false;
        this.containerName = "L" + this.id + "-" + this.options.idCounter;
        this.regions = [];
        this.actions = [];

        console.log('XLR::Layout/parseXlf', this);

        /* Create a hidden div to show the layout in */
        let $layout = <HTMLDivElement | null>(document.querySelector(`#${this.containerName}[data-sequence="${this.index}"]`));

        if ($layout === null) {
            $layout = document.createElement('div');
            $layout.id = this.containerName;
        }

        let $screen = document.getElementById('screen_container');
        ($screen) && $screen.append($layout);

        if ($layout) {
            $layout.dataset.sequence = `${this.index}`;
            $layout.style.display = 'none';
            if (this.xlr.config.platform === 'CMS') {
                $layout.style.outline = 'red solid thin';
            }

            // Add is-overlay className
            if (this.isOverlay) {
                $layout.classList.add('is-overlay');
            }
        }

        /* Calculate the screen size */
        this.sw = $screen?.offsetWidth || 0;
        this.sh = $screen?.offsetHeight || 0;

        this.xw = Number(this.layoutNode?.firstElementChild?.getAttribute('width'));
        this.xh = Number(this.layoutNode?.firstElementChild?.getAttribute('height'));
        this.zIndex = Number(this.layoutNode?.firstElementChild?.getAttribute('zindex')) || 0;
        this.enableStat = Boolean(this.layoutNode?.firstElementChild?.getAttribute('enableStat') || false);

        /* Calculate Scale Factor */
        this.scaleFactor = Math.min((this.sw / this.xw), (this.sh / this.xh));
        this.sWidth = this.xw * this.scaleFactor;
        this.sHeight = this.xh * this.scaleFactor;
        this.offsetX = Math.abs(this.sw - this.sWidth) / 2;
        this.offsetY = Math.abs(this.sh - this.sHeight) / 2;

        /* Scale the Layout Container */
        if ($layout) {
            $layout.style.width = `${this.sWidth}px`;
            $layout.style.height = `${this.sHeight}px`;
            $layout.style.position = 'absolute';
            $layout.style.left = `${this.offsetX}px`;
            $layout.style.top = `${this.offsetY}px`;
            $layout.style.overflow = 'hidden';
        }

        if ($layout && this.zIndex !== null) {
            $layout.style.zIndex = this.isOverlay ? '999' : `${this.zIndex}`;
        }

        /* Set the layout background */
        this.bgColor = this.layoutNode?.firstElementChild?.getAttribute('bgcolor') || '';
        this.bgImage = this.layoutNode?.firstElementChild?.getAttribute('background') || '';

        if (!(this.bgImage === "" || typeof this.bgImage === 'undefined')) {
            /* Extract the image ID from the filename */
            this.bgId = this.bgImage.substring(0, this.bgImage.indexOf('.'));

            const bgImageUrl = composeBgUrlByPlatform(
              this.xlr.config.platform,
              {
                  ...this.options,
                  layout: this,
              },
            );

            if ($layout) {
                if (!this.isOverlay) {
                    $layout.style.backgroundImage = `url("${bgImageUrl}")`;
                    $layout.style.backgroundRepeat = 'no-repeat';
                    $layout.style.backgroundSize = `${this.sWidth}px ${this.sHeight}px`;
                    $layout.style.backgroundPosition = '0px 0px';
                }
            }
        }

        // Set the background color
        if ($layout && this.bgColor) {
            $layout.style.backgroundColor = this.isOverlay ? 'transparent' : `${this.bgColor}`;
        }

        // Hide if layout is not the currentLayout
        if ($layout && this.xlr.currentLayoutId !== undefined && this.xlr.currentLayoutId !== this.id) {
            $layout.style.display = 'none';
        }

        // For overlay layout
        if (this.isOverlay && $layout) {
        }

        // Create actions
        const layoutActions = Array.from(this.layoutNode?.getElementsByTagName('action') || []);
        Array.from(layoutActions).forEach((actionXml) => {
            this.actions.push(new Action(actionXml?.getAttribute('id') || '', actionXml));
        });

        // Create interactive actions
        this.actionController = new ActionController(
          this,
          this.actions,
          this.options,
        );

        // Create drawer
        const layoutDrawers = Array.from(this.layoutNode?.getElementsByTagName('drawer') || []);

        Array.from(layoutDrawers).forEach((layoutDrawerXml) => {
            this.drawer = layoutDrawerXml;
        });

        // Create regions
        const layoutRegions = Array.from(this?.layoutNode?.getElementsByTagName('region') || []);

        Array.from(layoutRegions).forEach((regionXml, regionIndex) => {
            const regionObj = Region(
              this,
              regionXml,
              regionXml?.getAttribute('id') || '',
              this.options,
              this.xlr,
            );

            regionObj.index = regionIndex;
            this.regions.push(regionObj);
        });

        this.actionController.initTouchActions();
    }

    run(): void {
        const $layoutContainer = <HTMLDivElement | null>(document.querySelector(`#${this.containerName}[data-sequence="${this.index}"]`));
        const $splashScreen = document.getElementById(`splash_${this.id}`);

        if ($layoutContainer) {
            $layoutContainer.style.display = 'block';
            // Also set the background color of the player window > body
            // Only set the body color when this.isOverlay === false
            if (!this.isOverlay) {
                document.body.style.setProperty('background-color', `${this.bgColor}`);
            }

            // Emit start event
            // Only start event emitter when this.isOverlay === false
            if (!this.isOverlay) {
                this.emitter.emit('start', this);
            }
        }

        if ($splashScreen) {
            $splashScreen.style.display = 'none';
        }

        console.debug('Layout running > Layout ID > ', this.id);
        console.debug('Layout Regions > ', this.regions);
        for (let i = 0; i < this.regions.length; i++) {
            // playLog(4, "debug", "Running region " + self.regions[i].id, false);
            this.regions[i].run();
        }
    }

    regionExpired(): void {
        this.allExpired = true;

        for (let layoutRegion of this.regions) {
            if (!layoutRegion.complete) {
                this.allExpired = false;
            }
        }

        if (this.allExpired) {
            this.end();
        }
    }

    end(): void {
        console.debug('Executing Layout::end and Calling Region::end ', this);

        /* Ask the layout to gracefully stop running now */
        for (let layoutRegion of this.regions) {
            layoutRegion.end();
        }
    }

    async regionEnded(): Promise<void> {
        this.allEnded = true;

        for (let i = 0; i < this.regions.length; i++) {
            if (! this.regions[i].ended) {
                this.allEnded = false;
            }
        }

        if (this.allEnded) {
            await this.stopAllMedia();

            console.debug('starting to end layout . . .');
            if (this.xlr.config.platform === 'CMS') {
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

            this.emitter.emit('end', this);
        }
    }

    stopAllMedia(): Promise<void> {
        console.debug('Stopping all media . . .');
        return new Promise(async (resolve) => {
            for(let i = 0;i < this.regions.length;i++) {
                let region = this.regions[i];
                for(let j = 0;j < region.mediaObjects.length;j++) {
                    let media = region.mediaObjects[j];
                    await media.stop();
                }
            }

            resolve();
        });
    }

    resetLayout(): Promise<void> {
        throw new Error('Method not implemented.');
    }

    finishAllRegions(): Promise<void[]> {
        return Promise.all(this.regions.map(region => region.finished()));
    }

    removeLayout(): void {
        /* Remove layout that does not exist */
        const $layout = <HTMLDivElement | null>(document.querySelector(`#${this.containerName}[data-sequence="${this.index}"]`));

        this.done = true;
        console.debug({$layout});

        if ($layout !== null) {
            $layout.parentElement?.removeChild($layout);
        }
    }

    getXlf(): string {
        return this.xlfString;
    }

    isInterrupt(): boolean {
        return this.shareOfVoice > 0;
    }

    on<E extends keyof ILayoutEvents>(event: E, callback: ILayoutEvents[E]) {
        return this.emitter.on(event, callback);
    }

}
