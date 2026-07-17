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
import { IMedia } from './Types/Media';
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
    });

    xlrObject.on('navLayout', (layoutCode: string) => {
        // Non-CMS platforms handle navLayout in their renderer via playInterruptLayout.
        // CMS navLayout is handled by ActionController (opens layout in a new tab).
        console.debug('[navLayout] XLR::on("navLayout") - received', { layoutCode });
    });

    xlrObject.emitSync = async <E extends keyof IXlrEvents>(eventName: E, ...args: Parameters<IXlrEvents[E]>) => {
        const handlers = (xlrObject.emitter.events[eventName] ?? []) as ((...a: any[]) => any)[];
        await Promise.all(handlers.map(handler => handler(...args)));
    };

    // Cycle playback state: one entry per campaign groupKey
    let rawInputLayouts: InputLayoutType[] = [];
    const cycleGroupSequence = new Map<number, number>();
    const cycleGroupPlays = new Map<number, number>();

    // Returns a filtered copy of layouts with only the currently active layout per cycle campaign.
    // Non-cycle layouts pass through unchanged. Zero overhead when no cycle campaigns are present.
    const applyCyclePlayback = (layouts: InputLayoutType[]): InputLayoutType[] => {
        // Group all cycle layouts by campaign
        const cycleGroups = new Map<number, InputLayoutType[]>();
        for (const layout of layouts) {
            if (layout.cyclePlayback && layout.groupKey) {
                if (!cycleGroups.has(layout.groupKey)) {
                    cycleGroups.set(layout.groupKey, []);
                }
                cycleGroups.get(layout.groupKey)!.push(layout);
            }
        }

        // No cycle campaigns, nothing to do
        if (cycleGroups.size === 0) {
            return layouts;
        }

        const placedCampaigns = new Set<number>();
        const result: InputLayoutType[] = [];

        for (const layout of layouts) {
            // Non-cycle layouts go straight through
            if (!layout.cyclePlayback || !layout.groupKey) {
                result.push(layout);
                continue;
            }

            // Each campaign gets one slot, remaining layouts from the same campaign are skipped
            if (placedCampaigns.has(layout.groupKey)) continue;

            placedCampaigns.add(layout.groupKey);
            const group = cycleGroups.get(layout.groupKey)!;
            // Reset to the last valid index if the campaign has fewer layouts than before
            const sequence = Math.min(cycleGroupSequence.get(layout.groupKey) ?? 0, group.length - 1);
            cycleGroupSequence.set(layout.groupKey, sequence);
            result.push(group[sequence]);
        }

        return result;
    };

    // Advance cycle state when a cycle layout finishes. Runs synchronously inside emitSync
    // so inputLayouts is updated before XLR selects the next layout to prepare.
    xlrObject.on('layoutEnd', (layout: ILayout) => {
        // Only act on cycle layouts
        if (!layout.cyclePlayback || !layout.groupKey) return;

        const groupKey = layout.groupKey;
        // All layouts belonging to this campaign
        const group = rawInputLayouts.filter(l => l.cyclePlayback && l.groupKey === groupKey);
        if (group.length === 0) return;

        const sequence = Math.min(cycleGroupSequence.get(groupKey) ?? 0, group.length - 1);
        // Treat 0 as 1, a layout must play at least once before advancing
        const playCount = Math.max(group[sequence].playCount ?? 1, 1);
        const plays = (cycleGroupPlays.get(groupKey) ?? 0) + 1;

        if (plays >= playCount) {
            // Move to the next layout in the campaign, wrapping back to the first after the last
            const nextSequence = (sequence + 1) % group.length;
            cycleGroupSequence.set(groupKey, nextSequence);
            cycleGroupPlays.set(groupKey, 0);
            xlrObject.inputLayouts = applyCyclePlayback(rawInputLayouts);
            console.info(`[XLR] Cycle campaign ${groupKey}: advancing to layout index ${nextSequence}`);
        } else {
            // Not ready to advance yet, just record the play
            cycleGroupPlays.set(groupKey, plays);
        }
    });

    xlrObject.bootstrap = function () {
        // Place to set configurations and initialize required props
        const self = this;
        rawInputLayouts = !Array.isArray(props.inputLayouts) ?
            [props.inputLayouts] : props.inputLayouts;
        self.inputLayouts = applyCyclePlayback(rawInputLayouts);
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
        console.debug('XLR::updateScheduleLayouts > Updating schedule layouts . . .', scheduleLayouts);

        let next = new Map<string, InputLayoutType>();

        if (scheduleLayouts.length === 0) {
            this.uniqueLayouts = next;
            return;
        }

        scheduleLayouts.forEach((_layout, layoutIndex) => {
            next.set(String(_layout.layoutId), {
                ..._layout,
                index: layoutIndex,
                id: _layout.layoutId,
            });
        });

        console.debug('XLR::updateScheduleLayouts > next unique layouts', Array.from(next).values());

        this.uniqueLayouts = next;
    };

    xlrObject.isLayoutInDOM = function (containerName: string, layoutIndex: number) {
        const $layout = <HTMLDivElement | null>(document.querySelector(`#${containerName}[data-sequence="${layoutIndex}"]`));

        return $layout !== null;
    };

    // Scans screen_container for non-overlay layout divs and removes any that
    // are not the current or next active layout. Prevents DOM accumulation when
    // prepareLayouts() races with updateLoop and multiple same-layoutId elements
    // end up in screen_container (e.g. transitioning from a 1-layout loop where
    // two elements exist for the same layout to a multi-layout schedule).
    // keepCurrent / keepNext:
    //   undefined  → fall back to this.currentLayout / this.nextLayout
    //   null       → keep nothing for that slot (explicit "no layout to preserve")
    //   ILayout    → keep exactly that instance
    xlrObject.cleanupOrphanedLayouts = function (
        keepCurrent?: ILayout | null,
        keepNext?: ILayout | null,
    ) {
        const $screen = document.getElementById('screen_container');
        if (!$screen) return;

        const current = keepCurrent !== undefined ? keepCurrent : this.currentLayout;
        const next    = keepNext    !== undefined ? keepNext    : this.nextLayout;

        Array.from($screen.querySelectorAll(':scope > div:not(.is-overlay)')).forEach((el) => {
            const div = el as HTMLDivElement;
            const isCurrentLayout = current && div.id === current.containerName && div.dataset.sequence === String(current.index);
            const isNextLayout    = next    && div.id === next.containerName    && div.dataset.sequence === String(next.index);

            if (!isCurrentLayout && !isNextLayout) {
                console.debug('XLR::cleanupOrphanedLayouts - removing orphaned layout element', div.id);
                div.parentElement?.removeChild(div);
            }
        });
    };

    xlrObject.updateLoop = async function (inputLayouts: InputLayoutType[]) {
        console.debug('>>>> XLR.debug XLR::updateLoop > Updating schedule loop . . .');

        // Store the full schedule list and clear state for campaigns no longer present
        rawInputLayouts = inputLayouts;
        const validGroupKeys = new Set(
            inputLayouts
                .filter(l => l.cyclePlayback && l.groupKey)
                .map(l => l.groupKey as number)
        );
        for (const key of cycleGroupSequence.keys()) {
            if (!validGroupKeys.has(key)) {
                cycleGroupSequence.delete(key);
                cycleGroupPlays.delete(key);
            }
        }

        this.inputLayouts = applyCyclePlayback(rawInputLayouts);

        // Guard against a splash-only update: uniqueLayouts has no entry for layoutId 0,
        // so parseLayouts() would return undefined current/next and prepareLayoutXlf()
        // would be called with undefined. Clean up any playing layouts and show splash directly.
        if (inputLayouts.length === 1 && inputLayouts[0].layoutId === 0) {
            if (this.currentLayout &&
                this.isLayoutInDOM(this.currentLayout.containerName, this.currentLayout.index)
            ) {
                // Force all regions to complete immediately
                this.currentLayout.inLoop = false;
                await this.currentLayout.finishAllRegions();
                this.currentLayout.removeLayout();
            }
            if (this.nextLayout) {
                // Discard regardless of DOM presence: nextLayout may be preloaded with
                // DOM elements and video.js players but not yet attached to the screen container.
                this.nextLayout.discardLayout(LayoutPlaybackType.NEXT);
            }
            this.currentLayout = undefined;
            this.nextLayout = undefined;
            await this.playSchedules(this);
            return;
        }

        const playback = this.parseLayouts(true);

        let isCurrentLayoutValid = isLayoutValid(this.inputLayouts, this.currentLayout?.layoutId);

        if (this.isSspEnabled && this.currentLayoutId === -1) {
            isCurrentLayoutValid = true;
        }

        if (!isCurrentLayoutValid && this.currentLayout) {
            this.currentLayout.emitter.emit('cancelled', this.currentLayout);
        }

        console.debug('>>>>> XLR.debug XLR::updateLoop > uniqueLayouts', Array.from(this.uniqueLayouts.values()));
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

                // Discard old nextLayout before replacing it — same as the
                // other two branches do, otherwise the prepared DOM element
                // and any video.js players are orphaned.
                if (this.nextLayout &&
                    this.isLayoutInDOM(this.nextLayout.containerName, this.nextLayout.index)
                ) {
                    this.nextLayout.discardLayout(LayoutPlaybackType.NEXT);
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

                // If the pre-prepared nextLayout is still valid in the new schedule
                // and matches what parseLayouts selected as the new current, reuse it
                // directly — no async XLF fetch needed, no blank-screen window.
                const nextIsReusable =
                    this.nextLayout != null &&
                    !this.nextLayout.done &&
                    this.nextLayout.layoutNode != null &&
                    this.nextLayout.xlfString !== '' &&
                    playback.currentLayout != null &&
                    isLayoutValid(this.inputLayouts, this.nextLayout.layoutId) &&
                    this.nextLayout.layoutId === playback.currentLayout.layoutId;

                if (nextIsReusable && this.nextLayout) {
                    const reuseLayout = this.nextLayout;
                    this.nextLayout = undefined;
                    this.currentLayout = reuseLayout;
                    this.currentLayoutId = reuseLayout.layoutId;
                    this.currentLayoutIndex = playback.currentLayoutIndex;

                    // Kick off prep for the slot after B in the background so
                    // on('end') can fast-path gaplessly when B finishes.
                    // .catch() keeps this fire-and-forget from becoming an unhandled
                    // rejection on network/parse failure — nextLayout stays undefined
                    // and on('end') falls back to prepareLayouts() for recovery.
                    if (playback.nextLayout) {
                        this.prepareLayoutXlf(playback.nextLayout)
                            .then((next) => this.prepareForSsp(next))
                            .then((next) => { this.nextLayout = next; })
                            .catch(() => {});
                    }
                } else {
                    if (this.nextLayout &&
                        this.isLayoutInDOM(this.nextLayout.containerName, this.nextLayout.index)
                    ) {
                        this.nextLayout.discardLayout(LayoutPlaybackType.NEXT);
                    }

                    if (playback.currentLayout) {
                        await prepareNewCurrentLayout();
                    }

                    if (playback.nextLayout) {
                        this.nextLayout = await this.prepareForSsp(await this.prepareLayoutXlf(playback.nextLayout));
                    }
                }
            }

            await this.playSchedules(this);
        } else {
            // Remove next layout if it is in the DOM.
            // Guard: never discard nextLayout when it IS currentLayout — this happens
            // briefly during the gapless fast-path in on('end') while prepareLayouts()
            // is running asynchronously. Discarding it would remove the playing layout.
            if (this.nextLayout &&
                this.nextLayout !== this.currentLayout &&
                this.isLayoutInDOM(this.nextLayout.containerName, this.nextLayout.index)
            ) {
                this.nextLayout.discardLayout(LayoutPlaybackType.NEXT);
            }

            // Purge any other orphaned layouts from screen_container that belong
            // to the old single-layout loop. When there was only one layout in the
            // loop, prepareLayouts() kept two DOM elements alive (current + next,
            // both the same layoutId but different containerNames). On a schedule
            // change the this.nextLayout check above only discards the element
            // currently referenced by this.nextLayout, but concurrent
            // prepareLayouts() calls can leave earlier same-layoutId elements
            // behind.
            // Pass null (not undefined) for keepNext: undefined would fall back to
            // this.nextLayout which may still reference the just-discarded layout
            // or — if isLayoutInDOM returned false and discardLayout was skipped —
            // the orphan itself, causing cleanupOrphanedLayouts to preserve it.
            // null means "no next to keep"; we are about to prepare a fresh one.
            this.cleanupOrphanedLayouts(this.currentLayout, null);

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

        console.debug('XLR::parseLayouts', {
            currentLayoutId: this.currentLayout?.layoutId,
            currentLayoutIndex: this.currentLayoutIndex,
            nextLayoutId: this.nextLayout?.layoutId,
            isCurrentLayoutValid,
            hasChanged: !!hasChanged,
            inputLayoutsCount: this.inputLayouts.length,
            inputLayoutIds: this.inputLayouts.map(l => l.layoutId).join(', '),
        });

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

        console.debug('XLR::parseLayouts result', {
            currentLayoutId: _currentLayout?.layoutId,
            currentLayoutIndex: _currentLayoutIndex,
            nextLayoutId: _nextLayout?.layoutId,
            nextLayoutIndex: _nextLayoutIndex,
        });

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
        if (!isCMS && this.uniqueLayouts.size === 0) {
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
                    const layoutFromUniqueLayouts = this.uniqueLayouts.get(String(inputLayout.layoutId));

                    console.debug('XLR::getLayout > layoutFromUniqueLayouts', {
                        layoutFromUniqueLayouts,
                        inputLayout,
                        uniqueLayouts: this.uniqueLayouts,
                    });

                    activeLayout = layoutFromUniqueLayouts ? { ...layoutFromUniqueLayouts } : { ...inputLayout };
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

        // Cycle properties come from the schedule loop, not uniqueLayouts, always take from inputLayout
        iLayout.groupKey = inputLayout.groupKey;
        iLayout.cyclePlayback = inputLayout.cyclePlayback;

        return iLayout;
    };

    xlrObject.getLayoutById = function (layoutId: number, layoutIndex) {
        if (!layoutId || this.uniqueLayouts.size === 0 || !this.uniqueLayouts.has(String(layoutId))) {
            return undefined;
        }

        const _layout = {
            ...initialLayout,
            ...this.uniqueLayouts.get(String(layoutId)),
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
            console.debug('XLR::prepareLayouts - skipped (isUpdatingLoop)');
            return Promise.resolve(self);
        }

        let layoutPlayback = self.parseLayouts();

        // Don't prepare layout if it's just the splash screen
        if (self.inputLayouts.length === 1 && self.inputLayouts[0].layoutId === 0) {
            console.debug('XLR::prepareLayouts - skipped (splash screen only)');
            return Promise.resolve(self);
        }

        console.debug('XLR::prepareLayouts', {
            currentLayoutId: layoutPlayback.currentLayout?.layoutId,
            currentLayoutIndex: layoutPlayback.currentLayoutIndex,
            nextLayoutId: layoutPlayback.nextLayout?.layoutId,
            nextLayoutIndex: layoutPlayback.nextLayoutIndex,
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

        // True when the same object was returned (reused); false when a fresh
        // Layout was constructed by prepareLayoutXlf above.
        const wasCurrentReused = currentLayoutXlf === layoutPlayback.currentLayout;
        const nextLayoutXlf = await self.prepareLayoutXlf(layoutPlayback.nextLayout);

        let layouts: ILayout[] = await Promise.all([
            currentLayoutXlf,
            await self.prepareForSsp(nextLayoutXlf),
        ]);

        // Return early if a concurrent updateLoop killed the current candidate.
        // isUpdatingLoop may already be false if updateLoop finished quickly,
        // so also check layouts[0].done (set by removeLayout inside updateLoop).
        if (self.isUpdatingLoop || layouts[0].done) {
            console.debug('XLR::prepareLayouts - aborted (concurrent updateLoop)', {
                isUpdatingLoop: self.isUpdatingLoop,
                currentLayoutDone: layouts[0].done,
            });
            // If currentLayout was freshly prepared (not reused from nextLayout),
            // its DOM element was just appended — discard it now so it does not
            // accumulate in screen_container. Also disposes any video.js players
            // that were initialized during prepareVideoMedia but never played.
            if (!wasCurrentReused &&
                this.isLayoutInDOM(currentLayoutXlf.containerName, currentLayoutXlf.index)
            ) {
                currentLayoutXlf.discardLayout(LayoutPlaybackType.NEXT);
            }
            if (layoutPlayback.nextLayout &&
                nextLayoutXlf &&
                this.isLayoutInDOM(nextLayoutXlf.containerName, nextLayoutXlf.index)
            ) {
                nextLayoutXlf.discardLayout(LayoutPlaybackType.NEXT);
            }
            return Promise.resolve(self);
        }

        console.debug('XLR::prepareLayouts - layouts prepared', {
            currentLayoutId: layouts[0]?.layoutId,
            currentLayoutIndex: layouts[0]?.index,
            nextLayoutId: layouts[1]?.layoutId,
            nextLayoutIndex: layouts[1]?.index,
            currentReused: wasCurrentReused,
        });

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

            // Evict any orphaned layout DOM elements that aren't the current
            // or next layout. Concurrent prepareLayouts() calls can each append
            // a freshly-prepared nextLayout to screen_container and then
            // overwrite this.nextLayout, leaving earlier elements behind.
            // Calling this here — with explicit references — ensures every
            // completed prepare cycle leaves the DOM in a clean state.
            self.cleanupOrphanedLayouts(self.currentLayout, self.nextLayout);

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
            xlrLayoutObj.groupKey = inputLayout.groupKey;
            xlrLayoutObj.cyclePlayback = inputLayout.cyclePlayback;
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

            let xlrLayout: ILayout;
            if (isOverlayLayout) {
                xlrLayout = new OverlayLayout(
                    xlrLayoutObj,
                    newOptions,
                    self,
                    layoutXlfNode,
                );
            } else {
                xlrLayout = new Layout(
                    xlrLayoutObj,
                    newOptions,
                    self,
                    layoutXlfNode,
                );
            }

            // Advance the shared counter so the next prepareLayoutXlf() call
            // starts from where this layout left off — prevents every layout
            // instance from reusing idCounter=1 and colliding on the same
            // containerName / DOM element.
            if (props.options) {
                props.options.idCounter = newOptions.idCounter;
            }

            resolve(xlrLayout);
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

    // Shared re-entry guard for all layout navigation methods.
    // Prevents a double-tap from advancing two layouts at once.
    let isNavigatingLayout = false;

    xlrObject.gotoPrevLayout = async function () {
        if (isNavigatingLayout) return;
        isNavigatingLayout = true;

        try {
            const _currentLayoutIndex = this.currentLayoutIndex;
            let _assumedPrevIndex = _currentLayoutIndex - 1;

            // If previous layout is same as current layout or
            // if there's only one layout, do nothing
            if (_assumedPrevIndex < 0) {
                return;
            }

            console.debug('XLR::gotoPrevLayout', { previousLayoutIndex: _assumedPrevIndex });

            if (Boolean(this.inputLayouts[_assumedPrevIndex])) {
                // Discard the existing nextLayout before replacing it with the target.
                if (this.nextLayout &&
                    this.isLayoutInDOM(this.nextLayout.containerName, this.nextLayout.index)
                ) {
                    this.nextLayout.discardLayout(LayoutPlaybackType.NEXT);
                }

                // Pre-prepare the target layout as nextLayout while A is still playing.
                // on('end') will fast-path to it gaplessly — no inLoop=false needed.
                let targetLayout = this.getLayout(this.inputLayouts[_assumedPrevIndex]);
                targetLayout = setLayoutIndex(targetLayout, _assumedPrevIndex);
                this.nextLayout = await this.prepareForSsp(await this.prepareLayoutXlf(targetLayout));
                this.currentLayoutIndex = _assumedPrevIndex;

                await this.currentLayout?.finishAllRegions();
                // on('end') handles the gapless transition and prepareLayouts for the new next.
            }
        } finally {
            isNavigatingLayout = false;
        }
    };

    xlrObject.gotoNextLayout = async function () {
        if (isNavigatingLayout) return;
        isNavigatingLayout = true;

        try {
            const nextIndex = this.currentLayoutIndex + 1;

            if (!Boolean(this.inputLayouts[nextIndex])) {
                return;
            }

            console.debug('XLR::gotoNextLayout', { nextLayoutIndex: nextIndex });

            // The normal loop always pre-prepares the layout at currentLayoutIndex+1 as
            // nextLayout — that is exactly the target here. No discard or re-prepare
            // needed: just end A early and let on('end') fast-path to the already-ready
            // nextLayout gaplessly, then kick off prepareLayouts() for the layout after B.
            this.currentLayoutIndex = nextIndex;
            await this.currentLayout?.finishAllRegions();
        } finally {
            isNavigatingLayout = false;
        }
    };

    xlrObject.gotoLayoutByCode = async function (layoutCode: string) {
        if (isNavigatingLayout) return;
        isNavigatingLayout = true;

        try {
            let targetIndex = -1;

            // 1. Check the two already-parsed layouts first (zero fetch cost)
            const parsedLayouts: Array<ILayout | undefined> = [
                this.layouts['current'] as ILayout | undefined,
                this.layouts['next'] as ILayout | undefined,
            ];
            for (const layout of parsedLayouts) {
                if (!layout) continue;
                const code = layout.layoutNode?.documentElement?.getAttribute('code');
                if (code === layoutCode) {
                    targetIndex = this.inputLayouts.findIndex(
                        (i: InputLayoutType) => i.layoutId === layout.layoutId,
                    );
                    break;
                }
            }

            // 2. Fall back: iterate unparsed inputLayouts
            if (targetIndex === -1) {
                const parser = new DOMParser();
                for (let i = 0; i < this.inputLayouts.length; i++) {
                    const inputLayout = this.inputLayouts[i];

                    // Fast check: code pre-populated by the player (no fetch needed)
                    if (inputLayout.code !== undefined) {
                        if (inputLayout.code === layoutCode) {
                            targetIndex = i;
                            break;
                        }
                        continue;
                    }

                    let xlfString: string | undefined;

                    // Prefer getXlf() when available (e.g. CMS platform)
                    xlfString = inputLayout.getXlf?.();

                    // Otherwise fetch from the local file server (Electron / ChromeOS)
                    if (!xlfString && this.config.appHost && inputLayout.path) {
                        const url = this.config.appHost + inputLayout.path;
                        console.debug('[gotoLayoutByCode] Fetching XLF for layoutId', inputLayout.layoutId, url);
                        try {
                            const res = await fetch(url);
                            if (!res.ok) {
                                console.debug('[gotoLayoutByCode] Fetch non-OK', res.status, url);
                                continue;
                            }
                            xlfString = await res.text();
                        } catch (_e) {
                            console.debug('[gotoLayoutByCode] Fetch error for', url, _e);
                            continue;
                        }
                    }

                    if (!xlfString) {
                        console.debug('[gotoLayoutByCode] No XLF for layoutId', inputLayout.layoutId, 'path:', inputLayout.path);
                        continue;
                    }

                    const doc = parser.parseFromString(xlfString, 'text/xml');
                    const foundCode = doc.documentElement?.getAttribute('code');
                    if (foundCode === layoutCode) {
                        targetIndex = i;
                        break;
                    }
                }
            }

            if (targetIndex === -1) {
                console.warn('XLR::gotoLayoutByCode - layout not found for code:', layoutCode);
                return;
            }

            console.debug('XLR::gotoLayoutByCode', { layoutCode, targetIndex });

            // Discard the existing nextLayout before replacing it with the target.
            if (this.nextLayout &&
                this.isLayoutInDOM(this.nextLayout.containerName, this.nextLayout.index)
            ) {
                this.nextLayout.discardLayout(LayoutPlaybackType.NEXT);
            }

            // Pre-prepare the target layout as nextLayout while A is still playing.
            // on('end') will fast-path to it gaplessly — no inLoop=false needed.
            let targetLayout = this.getLayout(this.inputLayouts[targetIndex]);
            targetLayout = setLayoutIndex(targetLayout, targetIndex);
            this.nextLayout = await this.prepareForSsp(await this.prepareLayoutXlf(targetLayout));
            this.currentLayoutIndex = targetIndex;

            await this.currentLayout?.finishAllRegions();
            // on('end') handles the gapless transition and prepareLayouts for the new next.
        } finally {
            isNavigatingLayout = false;
        }
    };

    xlrObject.playInterruptLayout = async function (inputLayout: InputLayoutType) {
        if (isNavigatingLayout) return;
        isNavigatingLayout = true;

        try {
            const resumeIndex = this.currentLayoutIndex;
            // Save B (the layout that was queued to play after A) before stopping A.
            // After the interrupt ends, parseLayouts() will use this to resume the loop.
            const savedNextLayout = this.nextLayout;

            console.debug('[navLayout] XLR::playInterruptLayout - Starting interrupt', {
                interruptLayoutId: inputLayout.layoutId,
                resumeIndex,
                currentLayoutId: this.currentLayout?.layoutId,
                resumeNextLayoutId: savedNextLayout?.layoutId,
            });

            // Prevent A's end handler from calling prepareLayouts (we take over).
            if (this.currentLayout) {
                this.currentLayout.inLoop = false;
            }
            await this.currentLayout?.finishAllRegions();

            // Register interrupt in uniqueLayouts so getLayout()/prepareLayoutXlf() resolve it.
            // Do NOT splice into inputLayouts — keeping the original loop intact means
            // parseLayouts() will see the interrupt as "not in loop" (isCurrentLayoutValid=false)
            // after it ends, and will correctly advance to savedNextLayout (B).
            const interruptKey = String(inputLayout.layoutId);
            const wasInUniqueLayouts = this.uniqueLayouts.has(interruptKey);
            if (!wasInUniqueLayouts) {
                this.uniqueLayouts.set(interruptKey, {
                    ...inputLayout,
                    index: resumeIndex,
                    id: inputLayout.layoutId,
                });
            }

            // Prepare the interrupt ILayout (fetches XLF, builds regions).
            const interruptILayout = await this.prepareLayoutXlf(
                this.getLayout(inputLayout)
            );

            // Wire into XLR so playLayouts picks up the interrupt as current.
            // inLoop=true lets the interrupt's own end handler call prepareLayouts normally.
            interruptILayout.inLoop = true;
            this.layouts.current = interruptILayout;
            this.currentLayout = interruptILayout;
            this.currentLayoutId = interruptILayout.layoutId;

            // Restore nextLayout to B so after the interrupt ends, parseLayouts() resumes
            // the original loop from B (since interrupt.layoutId is not in inputLayouts,
            // parseLayouts sees it as invalid and advances to nextLayout).
            if (savedNextLayout) {
                this.layouts.next = savedNextLayout;
                this.nextLayout = savedNextLayout;
            }

            // Remove interrupt from uniqueLayouts once it ends.
            const cleanup = this.emitter.on('layoutEnd', (endedLayout: ILayout) => {
                if (endedLayout !== interruptILayout) return;
                cleanup();
                if (!wasInUniqueLayouts) {
                    this.uniqueLayouts.delete(interruptKey);
                }
                console.debug('[navLayout] XLR::playInterruptLayout - Interrupt ended, resuming loop', {
                    interruptLayoutId: inputLayout.layoutId,
                    resumeNextLayoutId: savedNextLayout?.layoutId,
                });
            });

            await this.playSchedules(xlrObject);
        } finally {
            isNavigatingLayout = false;
        }
    };

    xlrObject.triggerAction = function (triggerCode: string, widgetId?: string) {
        this.currentLayout?.actionController?.handleWebhookTrigger(triggerCode, widgetId);
    };

    function findCurrMediaByWidgetId(layout: ILayout | undefined, widgetId: string): IMedia | undefined {
        if (!layout) return undefined;
        for (const region of layout.regions) {
            const curr = region.currMedia;
            if (curr && curr.mediaId === widgetId) return curr;
        }
        return undefined;
    }

    xlrObject.expireWidget = function (widgetId: string) {
        findCurrMediaByWidgetId(this.currentLayout, widgetId)?.expire();
    };

    xlrObject.extendWidgetDuration = function (widgetId: string, duration: number) {
        console.debug('XLR::extendWidgetDuration', { widgetId, duration });
        const media = findCurrMediaByWidgetId(this.currentLayout, widgetId);
        if (media) media.duration += duration;
    };

    xlrObject.setWidgetDuration = function (widgetId: string, duration: number) {
        console.debug('XLR::setWidgetDuration', { widgetId, duration });
        const media = findCurrMediaByWidgetId(this.currentLayout, widgetId);
        if (media) media.duration = duration;
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
