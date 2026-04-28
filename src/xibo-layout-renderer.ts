/*
 * Copyright (C) 2026 Xibo Signage Ltd
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

import Layout, { getXlf, initRenderingDOM } from './Modules/Layout';
import { ELayoutState, ILayout, initialLayout, InputLayoutType, OptionsType, } from './Types/Layout';
import { ELayoutType, initialXlr, IXlr, IXlrEvents } from './Types/XLR';
import SplashScreen, { ISplashScreen, PreviewSplashElement } from './Modules/SplashScreen';
import { hasDefaultOnly, isLayoutValid, getLayoutIndexByLayoutId, hasSspLayout } from "./Modules/Generators";
import OverlayLayout from "./Modules/Layout/OverlayLayout";
import { OverlayLayoutManager } from "./Modules/Layout/OverlayLayoutManager";
import { ConsumerPlatform, LayoutPlaybackType } from './types';
import { setLayoutIndex } from './Modules/Generators/Generators';

export default function XiboLayoutRenderer(
    inputLayouts: InputLayoutType[],
    overlays: InputLayoutType[],
    options?: OptionsType,
) {
    console.debug('??? Xibo Layout Renderer loaded');

    // Init ID counter if we have options
    if (options && options.idCounter == null) {
        options.idCounter = 0;
    }

    const props = {
        inputLayouts,
        options,
    }

    const xlrObject: IXlr = {
        ...initialXlr,
    };

    const runOverlayLayouts = (async () => {
        await xlrObject.overlayLayoutManager.prepareOverlayLayouts(xlrObject.overlays, xlrObject);

        // Play overlays
        xlrObject.overlayLayoutManager.playOverlays();
    });

    xlrObject.isUpdatingLoop = false;
    xlrObject.isUpdatingOverlays = false;
    xlrObject.overlayLayoutManager = new OverlayLayoutManager();

    let splashScreen: ISplashScreen;

    xlrObject.emitter = createNanoEvents<IXlrEvents>();

    xlrObject.on = function <E extends keyof IXlrEvents>(event: E, callback: IXlrEvents[E]) {
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

    xlrObject.on('updateLoop', async (inputLayouts: InputLayoutType[]) => {
        xlrObject.isUpdatingLoop = true;
        await xlrObject.updateLoop(inputLayouts);
        xlrObject.isUpdatingLoop = false;

        // If the running layout finished while isUpdatingLoop was true, the
        // layout end-handler bailed out of prepareLayouts() early and the
        // subsequent playLayouts() call saw currentLayout.done === true and
        // skipped run() — leaving a black screen.  Catch up now that the flag
        // is clear.
        if (xlrObject.currentLayout?.done) {
            xlrObject.prepareLayouts().then(xlr => xlrObject.playLayouts(xlr));
        }
    });

    xlrObject.on('updateOverlays', async (overlays: InputLayoutType[]) => {
        xlrObject.isUpdatingOverlays = true;
        await xlrObject.updateOverlays(overlays);
        xlrObject.isUpdatingOverlays = false;
    })

    xlrObject.emitSync = async <E extends keyof IXlrEvents>(eventName: E, ...args: Parameters<IXlrEvents[E]>) => {
        const handlers = (xlrObject.emitter.events[eventName] ?? []) as ((...a: any[]) => any)[];
        await Promise.all(handlers.map(handler => handler(...args)));
    };

    xlrObject.bootstrap = function () {
        // Place to set configurations and initialize required props
        const self = this;
        self.inputLayouts = !Array.isArray(props.inputLayouts) ?
            [props.inputLayouts] : props.inputLayouts;
        self.overlays = overlays;
        self.config = props.options as OptionsType;

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

    xlrObject.init = function () {
        return new Promise<IXlr>((resolve) => {
            const self = this;

            // Check if only have splash screen from inputLayouts
            if (self.inputLayouts.length === 1 && self.inputLayouts[0].layoutId === 0) {
                resolve(self);
            } else {
                self.prepareLayouts().then((xlr) => {
                    resolve(xlr);
                });
            }
        });
    };

    xlrObject.playLayouts = function (xlr: IXlr) {
        const $splashScreen = document.querySelector('.preview-splash') as PreviewSplashElement;
        // Check if there's a current layout
        if (xlr.currentLayout !== undefined) {
            if ($splashScreen && $splashScreen.style.display === 'block') {
                $splashScreen?.hide();
            }

            console.debug('>>>> XLR.debug XLR::playLayouts > currentLayout', {
                layoutId: xlr.currentLayout.layoutId,
                layoutIndex: xlr.currentLayout.index,
                layoutState: xlr.currentLayout.state,
            });

            if (!xlr.currentLayout.done) {
                // Hide overlays when current layout is interrupt
                if (xlr.currentLayout.isInterrupt()) {
                    xlrObject.overlayLayoutManager.stopOverlays();
                }

                console.debug('>>>> XLR.debug XLR::playLayouts > Running currentLayout', {
                    layoutId: xlr.currentLayout.layoutId,
                    layoutIndex: xlr.currentLayout.index,
                    layoutState: xlr.currentLayout.state,
                });
                xlr.currentLayout.run();
            }

        } else {
            // Show splash screen
            if ($splashScreen) {
                $splashScreen?.show();
            }
        }
    }

    xlrObject.playSchedules = async function (xlr: IXlr) {
        xlrObject.playLayouts(xlr);

        if (xlr.currentLayout !== undefined && !xlr.currentLayout.isInterrupt()) {
            // Run overlay layouts separately
            await runOverlayLayouts();
        }
    };

    xlrObject.renderOverlayLayouts = async function () {
        // Parse this.overlays if overlays are available
        const overlayLayouts = this.overlays.reduce((collection: ILayout[], item) => {
            let inputOverlay: InputLayoutType = <InputLayoutType>{};

            inputOverlay = { ...inputOverlay, ...item };
            inputOverlay.index = item.index;

            const overlayLayout: ILayout = <ILayout>initialLayout;

            return [...collection, {
                ...overlayLayout,
                ...inputOverlay,
            }]
        }, []);

        console.log('XLR::renderOverlayLayouts', { overlayLayouts });
        await Promise.all(overlayLayouts.map(async (_overlayLayout) => {
            const _overlay = await this.prepareLayoutXlf(_overlayLayout);

            console.log('>>>> XLR.debug XLR::renderOverlayLayouts >> prepareLayoutXlf', _overlay);
            console.log('>>>> XLR.debug XLR::renderOverlayLayouts >> currentLayout.isInterrupt()', this.currentLayout?.isInterrupt());

            if (_overlay) {
                // Check if currentLayout is not an interrupt
                if (this.currentLayout && this.currentLayout.isInterrupt()) {
                    if (this.isLayoutInDOM(_overlay.containerName, _overlay.index)) {
                        await _overlay.finishAllRegions();
                        _overlay.removeLayout(LayoutPlaybackType.OVERLAY);
                    }
                } else {
                    _overlay.run();
                }
            }
        }));
    }

    xlrObject.updateScheduleLayouts = async function (scheduleLayouts: InputLayoutType[]) {
        console.debug('XLR::updateScheduleLayouts > Updating schedule layouts . . .');
        const inputLayoutIds: (number | string)[] = [];

        for (const [layoutIndex, _layout] of scheduleLayouts.entries()) {
            const uniqueLayout = _layout;
            uniqueLayout.index = layoutIndex;
            uniqueLayout.id = _layout.layoutId;

            this.uniqueLayouts[_layout.layoutId] = uniqueLayout;
            inputLayoutIds.push(_layout.layoutId);
        }

        // Cross-check if we need to remove non-existing layouts based on inputLayouts
        for (const layoutId of Object.keys(this.uniqueLayouts)) {
            if (!inputLayoutIds.includes(parseInt(layoutId))) {
                delete this.uniqueLayouts[layoutId];
            }
        }
    };

    xlrObject.isLayoutInDOM = function (containerName: string, layoutIndex: number) {
        const $layout = <HTMLDivElement | null>(document.querySelector(`#${containerName}[data-sequence="${layoutIndex}"]`));

        return $layout !== null;
    };

    xlrObject.updateLoop = async function (inputLayouts: InputLayoutType[]) {
        console.debug('>>>> XLR.debug XLR::updateLoop > Updating schedule loop . . .');
        this.inputLayouts = inputLayouts;
        const playback = this.parseLayouts(true);

        let isCurrentLayoutValid = isLayoutValid(this.inputLayouts, this.currentLayout?.layoutId);

        if (this.isSspEnabled && this.currentLayoutId === -1) {
            isCurrentLayoutValid = true;
        }

        if (!isCurrentLayoutValid && this.currentLayout) {
            this.currentLayout.emitter.emit('cancelled', this.currentLayout);
        }

        console.debug('>>>>> XLR.debug XLR::updateLoop > uniqueLayouts', this.uniqueLayouts);
        console.debug('>>>>> XLR.debug XLR::updateLoop > inputLayouts', this.inputLayouts);
        console.debug('>>>>> XLR.debug XLR::updateLoop > isCurrentLayoutValid', isCurrentLayoutValid);
        console.debug('>>>>> XLR.debug XLR::updateLoop > currentLayout', this.currentLayout);
        console.debug('>>>>> XLR.debug XLR::updateLoop > nextLayout', this.nextLayout);
        console.debug('>>>>> XLR.debug XLR::updateLoop > playback', playback);

        const prepareNewCurrentLayout = async () => {
            this.currentLayout = await this.prepareLayoutXlf(playback.currentLayout);
            this.currentLayoutId = this.currentLayout.layoutId;
            this.currentLayoutIndex = playback.currentLayoutIndex;
        };

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
                if (this.currentLayout &&
                    this.isLayoutInDOM(this.currentLayout.containerName, this.currentLayout.index)
                ) {
                    this.currentLayout.inLoop = false;
                    await this.currentLayout.finishAllRegions();
                    this.currentLayout.removeLayout();
                }

                if (this.nextLayout &&
                    this.isLayoutInDOM(this.nextLayout.containerName, this.nextLayout.index)
                ) {
                    this.nextLayout.removeLayout(LayoutPlaybackType.NEXT);
                }

                if (playback.currentLayout) {
                    await prepareNewCurrentLayout();
                }

                if (playback.nextLayout) {
                    this.nextLayout = await this.prepareForSsp(await this.prepareLayoutXlf(playback.nextLayout));
                }
            }

            await this.playSchedules(this);
        } else {
            // Remove next layout if it is in the DOM
            if (this.nextLayout &&
                this.isLayoutInDOM(this.nextLayout.containerName, this.nextLayout.index)
            ) {
                this.nextLayout.removeLayout(LayoutPlaybackType.NEXT);
            }

            // The current layout is still valid and running — do NOT replace the
            // live currentLayout object.  Only refresh the queued nextLayout so
            // that when the running layout finishes it transitions to the correct
            // position in the updated loop.  Using playback.currentLayout (the
            // slot that follows the running layout in the new queue) as the new
            // nextLayout keeps the cycle in order; the slot after that will be
            // prepared by the normal prepareLayouts() call at transition time.
            if (playback.currentLayout) {
                this.currentLayoutIndex = playback.currentLayoutIndex;
                this.nextLayout = await this.prepareForSsp(await this.prepareLayoutXlf(playback.currentLayout));
            }

            console.debug('>>>> XLR.debug XLR::updateLoop > updated nextLayout', this.nextLayout);
        }
    };

    xlrObject.updateOverlays = async (overlays: InputLayoutType[]) => {
        xlrObject.overlays = overlays;

        // Run overlay layouts separately
        await runOverlayLayouts();
    };

    xlrObject.parseLayouts = function (hasChanged?: boolean) {
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
                    // Check if currentLayout.state is PLAYED,
                    // then, validate nextLayout and if valid,
                    // proceed to nextLayout as new currentLayout
                    // Else, go back to first layout in the loop
                    if (this.currentLayout.state === ELayoutState.PLAYED &&
                        isLayoutValid(this.inputLayouts, this.nextLayout?.layoutId)
                    ) {
                        // Get nextLayout from updated loop
                        const tempNextLayoutIndex = getLayoutIndexByLayoutId(
                            this.inputLayouts, this.nextLayout.layoutId);
                        _currentLayoutIndex = tempNextLayoutIndex ?? 0;
                        _currentLayout = this.getLayout(this.inputLayouts[tempNextLayoutIndex ?? 0]);
                        _currentLayout = setLayoutIndex(_currentLayout, _currentLayoutIndex);
                    } else {
                        _currentLayout = this.getLayout(this.inputLayouts[0]);
                        _currentLayout = setLayoutIndex(_currentLayout, 0);
                    }

                    if (this.inputLayouts.length > 1) {
                        if (_currentLayoutIndex + 1 > this.inputLayouts.length - 1) {
                            _nextLayoutIndex = 0;
                        } else {
                            _nextLayoutIndex = _currentLayoutIndex + 1;
                        }

                        _nextLayout = this.getLayout(this.inputLayouts[_nextLayoutIndex]);
                        _nextLayout = setLayoutIndex(_nextLayout, _nextLayoutIndex);
                    } else {
                        _nextLayout = _currentLayout;
                    }
                } else {
                    if (hasChanged) {
                        _currentLayout = this.currentLayout;
                        if (this.inputLayouts.length === 1) {
                            if (_currentLayout.layoutId === this.inputLayouts[0].layoutId &&
                                _currentLayout.index !== this.inputLayouts[0].index
                            ) {
                                _currentLayout = this.getLayout(this.inputLayouts[0]);

                                if (_currentLayout) {
                                    _currentLayoutIndex = _currentLayout.index;
                                }

                                _currentLayout = setLayoutIndex(_currentLayout, _currentLayoutIndex);

                                _nextLayoutIndex = 0;
                                _nextLayout = this.getLayout(this.inputLayouts[_nextLayoutIndex]);
                                _nextLayout = setLayoutIndex(_nextLayout, _nextLayoutIndex);
                            }
                        } else {
                            _currentLayoutIndex = this.nextLayout.index > this.inputLayouts.length - 1 ? 0 : this.nextLayout.index;
                            _currentLayout = this.getLayout(this.inputLayouts[_currentLayoutIndex]);
                            _currentLayout = setLayoutIndex(_currentLayout, _currentLayoutIndex);

                            _nextLayoutIndex = _currentLayoutIndex + 1 > this.inputLayouts.length - 1 ? 0 : _currentLayoutIndex + 1;
                            _nextLayout = this.getLayout(this.inputLayouts[_nextLayoutIndex]);
                            _nextLayout = setLayoutIndex(_nextLayout, _nextLayoutIndex);
                        }
                    } else {
                        _currentLayout = this.nextLayout;
                        _currentLayoutIndex = _currentLayout.index;

                        // updateLoop can re-queue the same index that is currently
                        // playing (e.g. it fires while nextLayout.index === currentLayout.index).
                        // When that layout then ends, the catch-up prepareLayouts() would
                        // replay the same slot instead of advancing.  Detect this by checking
                        // whether the queued next-to-current is at the same index as the
                        // layout that just finished, and advance past it so the following
                        // slot (e.g. an SSP that now has an ad) becomes current instead.
                        if (
                            this.inputLayouts.length > 1 &&
                            this.currentLayout?.done &&
                            _currentLayoutIndex === this.currentLayout?.index
                        ) {
                            _currentLayoutIndex = (_currentLayoutIndex + 1) % this.inputLayouts.length;
                            _currentLayout = this.getLayout(this.inputLayouts[_currentLayoutIndex]);
                            _currentLayout = setLayoutIndex(_currentLayout, _currentLayoutIndex);
                        }

                        _nextLayoutIndex = (_currentLayoutIndex + 1) % this.inputLayouts.length;
                        _nextLayout = this.getLayout(this.inputLayouts[_nextLayoutIndex]);
                        _nextLayout = setLayoutIndex(_nextLayout, _nextLayoutIndex);
                    }
                }
            }
        } else {
            // Initial run: set both currentLayout and nextLayout
            if (hasLayout) {
                _currentLayout = this.getLayout(this.inputLayouts[_currentLayoutIndex]);
                _currentLayout = setLayoutIndex(_currentLayout, _currentLayoutIndex);

                if (this.inputLayouts.length > 1) {
                    _nextLayout = this.getLayout(this.inputLayouts[_nextLayoutIndex]);
                    _nextLayout = setLayoutIndex(_nextLayout, _nextLayoutIndex);
                } else {
                    _nextLayout = this.getLayout(this.inputLayouts[0]);
                    _nextLayout = setLayoutIndex(_nextLayout, 0);
                }
            }
        }

        if (_currentLayout === undefined && _nextLayout === undefined) {
            if (_hasDefaultOnly) {
                _currentLayout = this.getLayout(this.inputLayouts[0]);
                _currentLayout = setLayoutIndex(_currentLayout, 0);
                _nextLayout = this.getLayout(this.inputLayouts[0]);
                _nextLayout = setLayoutIndex(_nextLayout, 0);
            }
        }

        if (_currentLayout !== undefined && _nextLayout !== undefined) {
            _currentLayout.xlr = this;
            _nextLayout.xlr = this;
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

    xlrObject.getLayout = function (inputLayout: InputLayoutType) {
        const isCMS = this.config.platform === ConsumerPlatform.CMS;
        if (!isCMS && Object.keys(this.uniqueLayouts).length === 0) {
            return;
        }

        let _layout: InputLayoutType = <InputLayoutType>{};

        if (inputLayout) {
            if (inputLayout.layoutId === -1) {
                _layout = inputLayout;
                _layout.id = inputLayout.layoutId;
            } else {
                let activeLayout = inputLayout;

                if (isCMS) {
                    activeLayout.index = 0;
                    // id stays null without this — setLayoutIndex returns undefined for CMS layouts
                    if (activeLayout.id == null) {
                        activeLayout.id = activeLayout.layoutId;
                    }
                } else {
                    activeLayout = { ...this.uniqueLayouts[inputLayout.layoutId] };
                }

                _layout = { ..._layout, ...activeLayout };

                console.debug('XLR::getLayout > activeLayout from uniqueLayouts', {
                    activeLayout,
                    inputLayout,
                    uniqueLayouts: this.uniqueLayouts,
                });

                // Must set index/sequence from schedule loop
                _layout.index = activeLayout.index as number;
            }
        }

        let iLayout: ILayout = <ILayout>initialLayout;

        iLayout = { ...iLayout, ..._layout };

        return iLayout;
    };

    xlrObject.getLayoutById = function (layoutId: number, layoutIndex) {
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

    xlrObject.prepareLayouts = async function () {
        const self = xlrObject;

        if (this.isUpdatingLoop) {
            return Promise.resolve(self);
        }

        let layoutPlayback = self.parseLayouts();

        // Don't prepare layout if it's just the splash screen
        if (self.inputLayouts.length === 1 && self.inputLayouts[0].layoutId === 0) {
            return Promise.resolve(self);
        }

        console.debug('??? XLR.debug prepareLayouts::playback', {
            layoutPlayback,
            shouldParse: false,
        });

        self.currentLayoutId = layoutPlayback.currentLayout?.layoutId as ILayout['layoutId'];

        // Only reuse the existing Layout instance if it is fully healthy —
        // a done=true instance was removed from the DOM (e.g. an SSP slot that
        // had no ad), and an empty-XLF instance has no regions so it can never
        // advance the cycle.  In either case re-prepare from scratch so we get
        // a fresh request (which may now have a valid ad / XLF).
        const currentLayoutXlf = (
            layoutPlayback.currentLayout?.layoutNode &&
            !layoutPlayback.currentLayout.done &&
            layoutPlayback.currentLayout.xlfString !== ''
        )
            ? layoutPlayback.currentLayout
            : await self.prepareLayoutXlf(layoutPlayback.currentLayout);
        const nextLayoutXlf = await self.prepareLayoutXlf(layoutPlayback.nextLayout);

        let layouts: ILayout[] = await Promise.all([
            currentLayoutXlf,
            await self.prepareForSsp(nextLayoutXlf),
        ]);

        // Return early if a concurrent updateLoop killed the current candidate.
        // isUpdatingLoop may already be false if updateLoop finished quickly,
        // so also check layouts[0].done (set by removeLayout inside updateLoop).
        if (self.isUpdatingLoop || layouts[0].done) {
            if (layoutPlayback.nextLayout &&
                nextLayoutXlf &&
                this.isLayoutInDOM(nextLayoutXlf.containerName, nextLayoutXlf.index)
            ) {
                nextLayoutXlf.removeLayout(LayoutPlaybackType.NEXT);
            }
            return Promise.resolve(self);
        }

        console.debug('>>>>> XLR.debug prepared layout XLF', layouts);

        return new Promise<IXlr>(async function (resolve) {
            self.layouts.current = layouts[0];
            self.layouts.next = layouts[1];

            if (self.layouts.current && self.layouts.next) {
                self.layouts.current.xlr = self;
                self.layouts.next.xlr = self;
            }

            self.currentLayoutIndex = layoutPlayback.currentLayoutIndex;
            self.currentLayout = self.layouts.current;
            self.currentLayoutId = self.currentLayout.layoutId;
            self.nextLayout = self.layouts.next;

            resolve(xlrObject);
        });
    };

    xlrObject.prepareLayoutXlf = async function (inputLayout: ILayout) {
        if (!inputLayout) {
            console.warn('XLR::prepareLayoutXlf called with undefined inputLayout');
            return initialLayout;
        }

        const self = this;
        // Compose layout props first
        // Clone options to avoid mutating the shared xlfUrl template
        let newOptions = { ...props.options } as OptionsType;

        if (self.config.platform === ConsumerPlatform.CMS &&
            inputLayout && Boolean(inputLayout.layoutId)
        ) {
            newOptions.xlfUrl =
                newOptions.xlfUrl.replace(':layoutId', String(inputLayout.layoutId));
        } else if ((
            self.config.platform === ConsumerPlatform.CHROMEOS ||
            self.config.platform === ConsumerPlatform.ELECTRON
         ) && inputLayout !== undefined) {
            newOptions.xlfUrl = inputLayout.path as string;
        }

        let layoutXlf: string;
        let layoutXlfNode: Document | undefined;
        let sspInputLayout: InputLayoutType;
        if (inputLayout && inputLayout.layoutNode === undefined) {
            // Check if we have an SspLayout
            if (inputLayout.layoutId === -1) {
                await self.emitSync('adRequest', inputLayout.index);
                sspInputLayout = self.inputLayouts[inputLayout.index];

                console.debug('XLR::prepareLayoutXlf > SSP input layout', {
                    sspInputLayout,
                    inputLayout,
                });

                // @ts-ignore
                layoutXlf = typeof sspInputLayout?.getXlf === 'function' ? sspInputLayout.getXlf() : '';
            } else {
                layoutXlf = await getXlf(newOptions);
            }

            const parser = new window.DOMParser();
            layoutXlfNode = parser.parseFromString(layoutXlf as string, 'text/xml');
        } else {
            layoutXlfNode = inputLayout && inputLayout.layoutNode;
        }

        const isOverlayLayout = !!inputLayout?.isOverlay;

        return new Promise<ILayout>((resolve) => {
            const xlrLayoutObj: ILayout = <ILayout>{
                ...initialLayout,
                ad: inputLayout.ad ?? initialLayout.ad
            };

            console.log('XLR::prepareLayoutXlf >> Promise', { xlrLayoutObj, inputLayout });

            xlrLayoutObj.id = Number(inputLayout.layoutId);
            xlrLayoutObj.layoutId = Number(inputLayout.layoutId);
            xlrLayoutObj.scheduleId = inputLayout?.scheduleId || undefined;
            xlrLayoutObj.options = newOptions;
            xlrLayoutObj.index = inputLayout.index;
            xlrLayoutObj.xlfString = layoutXlf;
            xlrLayoutObj.duration = inputLayout.duration;
            xlrLayoutObj.isOverlay = isOverlayLayout;
            xlrLayoutObj.shareOfVoice = inputLayout.shareOfVoice;

            console.log('XLR::prepareLayoutXlf >> Promise >> xlrLayoutObj', xlrLayoutObj);

            if (sspInputLayout) {
                xlrLayoutObj.duration = sspInputLayout.duration || 0;
                xlrLayoutObj.ad = sspInputLayout.ad;
            }

            if (isOverlayLayout) {
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
        let iterations = 0;
        const maxIterations = self.inputLayouts.length;

        while (_nextLayout && _nextLayout.xlfString === '' && iterations < maxIterations) {
            // Remove the empty slot's DOM element before skipping past it
            _nextLayout.removeLayout(LayoutPlaybackType.NEXT);
            iterations++;

            // Advance to the next slot, wrapping around so a trailing SSP slot
            // with no ad does not strand the queue at the end of the array.
            const nextIndex = (_nextLayout.index + 1) % self.inputLayouts.length;

            const inputLayout = self.inputLayouts[nextIndex];
            if (!inputLayout) break;

            let nextLayoutObj = self.getLayout(inputLayout);
            nextLayoutObj = setLayoutIndex(nextLayoutObj, nextIndex);
            if (!nextLayoutObj) break;

            _nextLayout = await self.prepareLayoutXlf(nextLayoutObj);
        }

        return _nextLayout;
    };

    xlrObject.gotoPrevLayout = async function () {
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

            this.prepareLayouts().then(async (xlr) => {
                await this.playSchedules(xlr);
            });
        }
    };

    xlrObject.gotoNextLayout = async function () {
        console.debug('XLR::gotoNextLayout', {
            nextLayoutIndex: this.currentLayoutIndex + 1,
            method: 'XLR::gotoNextLayout',
            shouldParse: false,
        });

        await xlrObject.currentLayout?.finishAllRegions();
    };

    xlrObject.updateInputLayout = function (layoutIndex, layout) {
        const xlrInputLayout = this.inputLayouts[layoutIndex];

        if (layout !== null) {
            layout.index = xlrInputLayout.index;
        }

        console.debug('XLR::updateInputLayout', {
            layoutIndex,
            layout,
            xlrInputLayout,
        });

        this.inputLayouts[layoutIndex] = layout || xlrInputLayout;
    };

    xlrObject.bootstrap();

    return xlrObject;
}
