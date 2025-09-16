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
import { createNanoEvents } from 'nanoevents';

import Layout, {getXlf, initRenderingDOM} from './Modules/Layout';
import { platform } from './Modules/Platform';
import {
    ILayout, initialLayout, InputLayoutType, OptionsType,
} from './Types/Layout';
import { ELayoutType, initialXlr, IXlr, IXlrEvents, IXlrPlayback } from './Types/XLR';
import SplashScreen, {ISplashScreen, PreviewSplashElement} from './Modules/SplashScreen';
import {hasDefaultOnly, isLayoutValid} from "./Modules/Generators";
import {hasSspLayout} from "./Modules/Generators/Generators";
import OverlayLayout from "./Modules/Layout/OverlayLayout";

export default function XiboLayoutRenderer(
    inputLayouts: InputLayoutType[],
    options?: OptionsType,
) {
    const props = {
        inputLayouts,
        options,
    }

    const xlrObject: IXlr = {
        ...initialXlr,
    };

    let splashScreen: ISplashScreen;

    xlrObject.emitter = createNanoEvents<IXlrEvents>();

    xlrObject.on = function<E extends keyof IXlrEvents>(event: E, callback: IXlrEvents[E]) {
        return xlrObject.emitter.on(event, callback);
    };

    xlrObject.on('layoutChange', async (layoutId: number) => {
        let targetLayout: { layout: ILayout; pos: ELayoutType } | undefined;

        if (layoutId === xlrObject.nextLayout?.layoutId) {
            targetLayout = {
                layout: xlrObject.nextLayout,
                pos: ELayoutType.NEXT
            };
        }

        if (targetLayout?.layout && targetLayout?.pos) {
            xlrObject.nextLayout = await xlrObject.prepareLayoutXlf(xlrObject.nextLayout);
        }
    });

    /**
     * Asynchronous event emitter. Extended nanoevents event emitter.
     *
     * @param eventName
     * @param args
     */
    xlrObject.emitSync = <E extends keyof IXlrEvents>(eventName: E, ...args: Parameters<IXlrEvents[E]>) => {
        return new Promise(async resolve => {
            xlrObject.emitter.emit(eventName, ...args);
            resolve();
        });
    };

    xlrObject.bootstrap = function() {
        // Place to set configurations and initialize required props
        const self = this;
        self.inputLayouts = !Array.isArray(props.inputLayouts) ?
            [props.inputLayouts] : props.inputLayouts;
        self.config = JSON.parse(JSON.stringify({...platform, ...props.options}));

        // Prepare rendering DOM
        const previewCanvas = document.querySelector('#preview_canvas');

        initRenderingDOM(previewCanvas);

        // Prepare splash screen
        splashScreen = SplashScreen(
            document.querySelector('.player-preview'),
            self.config,
        );

        splashScreen.show();
    };

    xlrObject.init = function() {
        return new Promise<IXlr>((resolve) => {
            const self = this;

            // Check if only have splash screen from inputLayouts
            if (self.inputLayouts.length === 1 && self.inputLayouts[0].layoutId === 0) {
                resolve(self);
            } else {
                const playback = this.parseLayouts();
                self.prepareLayouts(playback).then((xlr) => {
                    resolve(xlr);
                });
            }
        });
    };

    xlrObject.playSchedules = function(xlr: IXlr) {
        const self = this;
        const $splashScreen = document.querySelector('.preview-splash') as PreviewSplashElement;
        // Check if there's a current layout
        if (xlr.currentLayout !== undefined) {
            if ($splashScreen && $splashScreen.style.display === 'block') {
                $splashScreen?.hide();
            }

            if (!xlr.currentLayout.done) {
                console.log('>>>> XLR.debug XLR::playSchedules > Running currentLayout', xlr.currentLayout);
                xlr.currentLayout.run();

                // @TODO: Implement overlay layout here
                (async () => {
                    await self.renderOverlayLayouts();
                })();
            }
        } else {
            // Show splash screen
            if ($splashScreen) {
                $splashScreen?.show();
            }

        }
    };

    xlrObject.renderOverlayLayouts = async function() {
        const self = this;
        // Parse this.uniqueLayouts if overlays are available
        const overlayLayouts = Object.keys(this.uniqueLayouts).reduce((_layouts: ILayout[], _layoutId) => {
            if (Boolean(this.uniqueLayouts[_layoutId])) {
                if (this.uniqueLayouts[_layoutId]?.isOverlay !== undefined) {
                    // Get layout
                    const fromUniqueLayout = this.getLayout(this.uniqueLayouts[_layoutId]);
                    if (fromUniqueLayout !== undefined) {
                        _layouts = [..._layouts, fromUniqueLayout];
                    }
                }
            }

            return _layouts;
        }, []);

        console.log('XLR::renderOverlayLayouts', {overlayLayouts});
        await Promise.all(overlayLayouts.map(async (_overlayLayout) => {
            const _overlay = await this.prepareLayoutXlf(_overlayLayout);

            console.log('>>>> XLR.debug XLR::renderOverlayLayouts >> prepareLayoutXlf', _overlay);
            console.log('>>>> XLR.debug XLR::renderOverlayLayouts >> currentLayout.isInterrupt()', this.currentLayout?.isInterrupt());

            if (_overlay) {
                // Check if currentLayout is not an interrupt
                if (this.currentLayout && this.currentLayout.isInterrupt()) {
                    if (this.isLayoutInDOM(_overlay.containerName, _overlay.index)) {
                        await _overlay.finishAllRegions();
                        _overlay.removeLayout();
                    }
                } else {
                    _overlay.run();
                }
            }
        }));
    }

    xlrObject.updateScheduleLayouts = async function(scheduleLayouts: InputLayoutType[]) {
        console.debug('XLR::updateScheduleLayouts > Updating schedule layouts . . .');
        const inputLayoutIds: (number | string)[] = [];

        await Promise.all(scheduleLayouts.map((_layout, layoutIndex) => {
            const uniqueLayout = _layout;
            uniqueLayout.index = layoutIndex;
            uniqueLayout.id = _layout.layoutId;

            this.uniqueLayouts[_layout.layoutId] = uniqueLayout;
            inputLayoutIds.push(_layout.layoutId);
        }));

        // Cross-check if we need to remove non-existing layouts based on inputLayouts
        await Promise.all(Object.keys(this.uniqueLayouts).map((layoutId) => {
            if (!inputLayoutIds.includes(parseInt(layoutId))) {
                delete this.uniqueLayouts[layoutId];
            }
        }))
    };

    xlrObject.isLayoutInDOM = function(containerName: string, layoutIndex: number) {
        const $layout = <HTMLDivElement | null>(document.querySelector(`#${containerName}[data-sequence="${layoutIndex}"]`));

        return $layout !== null;
    };

    xlrObject.updateLoop = async function(inputLayouts: InputLayoutType[]) {
        console.debug('>>>> XLR.debug XLR::updateLoop > Updating schedule loop . . .');
        this.inputLayouts = inputLayouts;
        const playback = this.parseLayouts(true);

        let isCurrentLayoutValid = isLayoutValid(this.inputLayouts, this.currentLayoutId);

        if (this.isSspEnabled && this.currentLayoutId === -1) {
            isCurrentLayoutValid = true;
        }

        console.debug('>>>> XLR.debug XLR::updateLoop > uniqueLayouts', this.uniqueLayouts);
        console.debug('>>>> XLR.debug XLR::updateLoop > inputLayouts', this.inputLayouts);
        console.debug('>>>> XLR.debug XLR::updateLoop > isCurrentLayoutValid', isCurrentLayoutValid);
        console.debug('>>>> XLR.debug XLR::updateLoop > currentLayout', this.currentLayout);
        console.debug('>>>> XLR.debug XLR::updateLoop > nextLayout', this.nextLayout);
        console.debug('>>>> XLR.debug XLR::updateLoop > playback', playback);

        if (!isCurrentLayoutValid) {
            if (playback.hasDefaultOnly) {
                // Clean up old layout in the DOM
                if (this.currentLayout && playback.currentLayout &&
                    this.currentLayout.layoutId !== playback.currentLayout.layoutId
                ) {
                    this.currentLayout.inLoop = false;
                    await this.currentLayout.finishAllRegions();
                    this.currentLayout.removeLayout();
                }

                this.currentLayout = await this.prepareLayoutXlf(playback.currentLayout);
                this.currentLayoutId = this.currentLayout.layoutId;
                this.nextLayout = await this.prepareForSsp(await this.prepareLayoutXlf(playback.nextLayout));
            } else {
                if (this.currentLayout) {
                    this.currentLayout.inLoop = false;
                    await this.currentLayout.finishAllRegions();
                    this.currentLayout.removeLayout();
                }
    
                if (this.nextLayout) {
                    this.nextLayout.removeLayout();
                }
    
                if (playback.currentLayout) {
                    this.currentLayout = await this.prepareLayoutXlf(playback.currentLayout);
                    this.currentLayoutId = this.currentLayout.layoutId;
                    this.currentLayoutIndex = playback.currentLayoutIndex;
                }
    
                if (playback.nextLayout) {
                    this.nextLayout = await this.prepareForSsp(await this.prepareLayoutXlf(playback.nextLayout));
                }
            }

            this.playSchedules(this);
        } else {
            if (this.nextLayout && playback.nextLayout) {
                if (this.nextLayout.index > playback.nextLayout.index ||
                  (this.nextLayout.layoutId === playback.nextLayout.layoutId &&
                    this.nextLayout.index !== playback.nextLayout.index
                  )
                ) {
                    // Remove existing nextLayout
                    this.nextLayout.removeLayout();
                }
            }

            if (playback.nextLayout) {
                if (playback.currentLayout) {
                    if (inputLayouts.length === 1) {
                        if (playback.currentLayout.layoutId === this.currentLayoutId &&
                            playback.currentLayout.index === this.currentLayoutIndex
                        ) {
                            this.nextLayout = playback.currentLayout;
                        } else {
                            this.nextLayout = await this.prepareLayoutXlf(playback.currentLayout);
                        }
                    } else {
                        // Clean up old nextLayout
                        if (this.nextLayout) {
                            if (this.isLayoutInDOM(this.nextLayout.containerName, this.nextLayout.index)) {
                                this.nextLayout.removeLayout();
                            }
                        }

                        this.nextLayout = await this.prepareForSsp(await this.prepareLayoutXlf(playback.nextLayout));
                    }
                }
            }

            console.debug('>>>> XLR.debug XLR::updateLoop > updated nextLayout', this.nextLayout);
        }
    };

    xlrObject.parseLayouts = function(loopUpdate?: boolean) {
        let _currentLayout;
        let _nextLayout;
        let _hasDefaultOnly = hasDefaultOnly(this.inputLayouts);
        const hasLayout = this.inputLayouts.length > 0;
        let _currentLayoutIndex = this.currentLayoutIndex;
        let _nextLayoutIndex = _currentLayoutIndex + 1;
        let isCurrentLayoutValid = isLayoutValid(this.inputLayouts, this.currentLayout?.layoutId);

        // Check for SSP layout
        this.isSspEnabled = hasSspLayout(this.inputLayouts);

        if (this.isSspEnabled && this.currentLayout?.layoutId === -1) {
            isCurrentLayoutValid = true;
        }

        _currentLayout = this.currentLayout;

        if (this.currentLayout && this.nextLayout) {
            // Both currentLayout and nextLayout has values
            if (hasLayout) {
                if (!isCurrentLayoutValid) {
                    _currentLayout = this.getLayout(this.inputLayouts[0]);

                    if (this.inputLayouts.length > 1) {
                        _nextLayout = this.getLayout(this.inputLayouts[1]);
                    } else {
                        _nextLayout = _currentLayout;
                    }
                } else {
                    if (loopUpdate) {
                        _currentLayout = this.currentLayout;
                        if (this.inputLayouts.length === 1 &&
                            _currentLayout.layoutId === this.inputLayouts[0].layoutId &&
                            _currentLayout.index !== this.inputLayouts[0].index
                        ) {
                            _currentLayout = this.getLayout(this.inputLayouts[0]);
                            _nextLayoutIndex = (this.inputLayouts[0].index as number) + 1;
                        }
                    } else {
                        _currentLayout = this.nextLayout;
                        _currentLayoutIndex = _currentLayout.index;
                        _nextLayoutIndex = _currentLayoutIndex + 1;
                    }

                    // Since currentLayout is still in the schedule loop
                    // Then, we only try to validate nextLayout
                    if (_nextLayoutIndex >= this.inputLayouts.length) {
                        // nextLayout index is beyond the schedule loop
                        // then, we set nextLayout to 0
                        _nextLayout = this.getLayout(this.inputLayouts[0]);
                        _nextLayoutIndex = 0;
                    } else {
                        // we set nextLayout based on next index of currentLayout
                        _nextLayout = this.getLayout(this.inputLayouts[_nextLayoutIndex]);
                    }
                }
            }
        } else {
            // Initial run: set both currentLayout and nextLayout
            if (hasLayout) {
                _currentLayout = this.getLayout(this.inputLayouts[_currentLayoutIndex]);

                if (this.inputLayouts.length > 1) {
                    _nextLayout = this.getLayout(this.inputLayouts[_nextLayoutIndex]);
                } else {
                    _nextLayout = this.getLayout(this.inputLayouts[0]);
                }
            }
        }

        if (_currentLayout === undefined && _nextLayout === undefined) {
            if (_hasDefaultOnly) {
                _currentLayout = this.getLayout(this.inputLayouts[0]);
                _nextLayout = this.getLayout(this.inputLayouts[0]);
            }
        }

        return {
            currentLayout: _currentLayout,
            nextLayout: _nextLayout,
            currentLayoutIndex: _currentLayoutIndex,
            nextLayoutIndex: _nextLayoutIndex,
            isCurrentLayoutValid,
            hasDefaultOnly: _hasDefaultOnly,
        };
    };

    xlrObject.getLayout = function(inputLayout: InputLayoutType) {
        if (Object.keys(this.uniqueLayouts).length === 0) {
            return;
        }

        let _layout: InputLayoutType = <InputLayoutType>{};

        if (inputLayout) {
            if (inputLayout.layoutId === -1) {
                _layout = inputLayout;
                _layout.id = inputLayout.layoutId;
            } else {
                _layout = {..._layout, ...this.uniqueLayouts[inputLayout.layoutId]};

                // Must set index/sequence from schedule loop
                _layout.index = inputLayout.index as number;
            }
        }

        let iLayout: ILayout = <ILayout>initialLayout;

        iLayout = {...iLayout, ..._layout};

        return  iLayout;
    };

    xlrObject.getLayoutById = function(layoutId: number, layoutIndex) {
        if (!layoutId || Object.keys(this.uniqueLayouts).length === 0) {
            return undefined;
        }

        const _layout = {
            ...initialLayout,
            ...this.uniqueLayouts[layoutId],
        };

        // Set layout index if available
        if (layoutIndex) {
            _layout.index = layoutIndex;
        }

        return _layout as ILayout;
    };

    xlrObject.prepareLayouts = async function(playback: IXlrPlayback) {
        const self = this;

        // Don't prepare layout if it's just the splash screen
        if (self.inputLayouts.length === 1 && self.inputLayouts[0].layoutId === 0) {
            return Promise.resolve(self);
        }

        console.debug('>>>> XLR.debug prepareLayouts::playback', playback);

        self.currentLayoutId = playback.currentLayout?.layoutId as ILayout['layoutId'];

        let currentLayoutXlf: ILayout;
        let nextLayoutXlf: ILayout;

        const layouts: ILayout[] = [];
        currentLayoutXlf = await this.prepareLayoutXlf(playback.currentLayout);
        layouts.push(currentLayoutXlf);

        nextLayoutXlf = await self.prepareForSsp(await this.prepareLayoutXlf(playback.nextLayout));
        layouts.push(nextLayoutXlf);

        return new Promise<IXlr>(async (resolve) => {
            self.layouts.current = layouts[0];
            self.layouts.next = layouts[1];

            self.currentLayoutIndex = playback.currentLayoutIndex;
            self.currentLayout = self.layouts.current;
            self.currentLayoutId = self.currentLayout.layoutId;
            self.nextLayout = self.layouts.next;

            resolve(self);
        });
    };

    xlrObject.prepareLayoutXlf = async function(inputLayout: ILayout) {
        const self = this;
        // Compose layout props first
        let newOptions: OptionsType = Object.assign({}, platform);

        newOptions = {
            ...newOptions,
            ...props.options,
        };

        if (self.config.platform ==='CMS' &&
            inputLayout && Boolean(inputLayout.layoutId)
        ) {
            newOptions.xlfUrl =
                newOptions.xlfUrl.replace(':layoutId', String(inputLayout.layoutId));
        } else if (self.config.platform === 'chromeOS' && inputLayout !== undefined) {
            newOptions.xlfUrl = inputLayout.path as string;
        }

        let layoutXlf: string;
        let layoutXlfNode: Document | undefined;
        let sspInputLayout: InputLayoutType;
        let overlayLayout: InputLayoutType;
        if (inputLayout && inputLayout.layoutNode === undefined) {
            // Check if we have an SspLayout
            if (inputLayout.layoutId === -1) {
                await self.emitSync('adRequest', inputLayout.index);
                sspInputLayout = self.inputLayouts[inputLayout.index];

                // @ts-ignore
                layoutXlf = sspInputLayout?.getXlf() || '';
            } else {
                layoutXlf = await getXlf(newOptions);
            }

            if (Boolean(inputLayout['isOverlay'])) {
                overlayLayout = self.uniqueLayouts[inputLayout.layoutId];
            }

            const parser = new window.DOMParser();
            layoutXlfNode = parser.parseFromString(layoutXlf as string, 'text/xml');
        } else {
            layoutXlfNode = inputLayout && inputLayout.layoutNode;
        }

        return new Promise<ILayout>((resolve) => {
            const xlrLayoutObj: ILayout = <ILayout>{...initialLayout};

            console.log('XLR::prepareLayoutXlf >> Promise', {xlrLayoutObj, inputLayout});

            xlrLayoutObj.id = Number(inputLayout.layoutId);
            xlrLayoutObj.layoutId = Number(inputLayout.layoutId);
            xlrLayoutObj.scheduleId = inputLayout?.scheduleId || undefined;
            xlrLayoutObj.options = newOptions;
            xlrLayoutObj.index = inputLayout.index;
            xlrLayoutObj.xlfString = layoutXlf;
            xlrLayoutObj.duration = inputLayout.duration;
            xlrLayoutObj.isOverlay = !!overlayLayout;
            xlrLayoutObj.shareOfVoice = inputLayout.shareOfVoice;

            console.log('XLR::prepareLayoutXlf >> Promise >> xlrLayoutObj', xlrLayoutObj);

            if (sspInputLayout) {
                xlrLayoutObj.duration = sspInputLayout.duration || 0;
                xlrLayoutObj.ad = sspInputLayout.ad;
            }

            if (overlayLayout) {
                resolve(new OverlayLayout(
                  xlrLayoutObj,
                  newOptions,
                  self,
                  layoutXlfNode,
                ));
            } else {
                resolve(new Layout(
                  xlrLayoutObj,
                  newOptions,
                  self,
                  layoutXlfNode,
                ));
            }
        });
    };

    xlrObject.prepareForSsp = async function (nextLayout: ILayout) {
        const self = this;
        let _nextLayout = nextLayout;

        while (_nextLayout && _nextLayout.xlfString === '') {
            // Remove skipped layout
            _nextLayout.removeLayout();

            // Get next valid layout
            // We will skip next layout that has no valid xlf
            const inputLayout = self.inputLayouts[_nextLayout.index + 1];
            const nextLayout = self.getLayout(inputLayout);

            _nextLayout = await self.prepareLayoutXlf(nextLayout);
        }

        return _nextLayout;
    };

    xlrObject.gotoPrevLayout = async function() {
        const _currentLayoutIndex = this.currentLayoutIndex;
        let _assumedPrevIndex = _currentLayoutIndex - 1;

        // If previous layout is same as current layout or
        // if there's only one layout, do nothing
        if (_assumedPrevIndex < 0) {
            return;
        }

        console.debug('XLR::gotoPrevLayout', {
            previousLayoutIndex: _assumedPrevIndex,
            method: 'XLR::gotoPrevLayout',
            shouldParse: false,
        });

        if (Boolean(this.inputLayouts[_assumedPrevIndex])) {
            // end current layout
            await this.currentLayout?.finishAllRegions();

            // and set the previous layout as current layout
            this.currentLayoutIndex = _assumedPrevIndex;
            const playback = this.parseLayouts();

            this.prepareLayouts(playback).then((xlr) => {
                this.playSchedules(xlr);
            });
        }
    };

    xlrObject.gotoNextLayout = async function() {
        console.debug('XLR::gotoNextLayout', {
            nextLayoutIndex: this.currentLayoutIndex + 1,
            method: 'XLR::gotoNextLayout',
            shouldParse: false,
        });

        await xlrObject.currentLayout?.finishAllRegions();
    };

    xlrObject.updateInputLayout = function(layoutIndex, layout) {
        const xlrInputLayout = this.inputLayouts[layoutIndex];

        if (layout !== null) {
            layout.index = xlrInputLayout.index;
        }

        this.inputLayouts[layoutIndex] = layout || xlrInputLayout;
    };

    xlrObject.bootstrap();

    return xlrObject;
}
