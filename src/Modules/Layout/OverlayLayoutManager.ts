/*
 * Copyright (C) 2025 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://xibosignage.com
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

import {ELayoutState, ILayout, initialLayout, InputLayoutType} from "../../Types/Layout";
import {LayoutPlaybackType} from "../../types";
import {IXlr} from "../../Types/XLR";
import OverlayLayout from "./OverlayLayout";
import {elementSummary, inputLayoutSummary, layoutListSummary, layoutSummary} from "../../Lib";

export class OverlayLayoutManager {
    overlays: OverlayLayout[] = [];
    container!: HTMLElement;
    parent!: IXlr;

    // Overlay updates are applied one at a time. Two updates overlapping (e.g. playSchedules and
    // updateOverlays) would each build the same overlays and leave one set orphaned in the DOM.
    private queue: Promise<void> = Promise.resolve();

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'overlay-layouts';
        this.container.style.display = 'none';
    }

    private enqueue(task: () => Promise<void>): Promise<void> {
        this.queue = this.queue.then(task).catch((error) => {
            console.error('<> XLR.debug OverlayLayoutManager::enqueue task failed', error);
        });

        return this.queue;
    }

    private getOverlayElement(overlay: OverlayLayout): HTMLDivElement | null {
        return document.querySelector(`#${overlay.containerName}[data-sequence="${overlay.index}"]`);
    }

    // An overlay can keep playing through a schedule update if it hasn't ended and is still in the DOM
    private isReusable(overlay: OverlayLayout): boolean {
        return overlay.state !== ELayoutState.PLAYED && this.getOverlayElement(overlay) !== null;
    }

    private async removeOverlay(overlay: OverlayLayout) {
        if (this.getOverlayElement(overlay) === null) return;

        if (overlay.state === ELayoutState.RUNNING) {
            await overlay.finishAllRegions();
            overlay.emitter.emit('end', overlay);
        } else {
            // Prepared but never shown (e.g. held back by an interrupt), so there is nothing to report
            overlay.discardLayout(LayoutPlaybackType.OVERLAY);
        }
    }

    async parseOverlays(list: any[], existing: OverlayLayout[] = []): Promise<Awaited<OverlayLayout[]>> {
        // Hand each existing overlay to at most one entry of the new list
        const pool = [...existing];

        return await Promise.all(list.map(async (item: any, index: number) => {
            const poolIndex = pool.findIndex((o) =>
                o.layoutId === Number(item.layoutId) &&
                o.scheduleId === (item.scheduleId || undefined) &&
                this.isReusable(o));

            if (poolIndex !== -1) {
                const [overlay] = pool.splice(poolIndex, 1);

                console.debug('<> XLR.debug OverlayLayoutManager::parseOverlays reusing overlay layout', {
                    overlayLayout: layoutSummary(overlay),
                });

                return overlay;
            }

            let inputOverlay: InputLayoutType = <InputLayoutType>{};

            inputOverlay = {...inputOverlay, ...item};
            inputOverlay.index = item.index ?? index;

            const overlayLayout = await this.parent.prepareLayoutXlf(<ILayout>{...initialLayout, ...inputOverlay});

            console.debug('<> XLR.debug OverlayLayoutManager::parseOverlays prepared overlay layout', {
                overlayLayout: layoutSummary(overlayLayout),
                inputOverlay: inputLayoutSummary(inputOverlay),
            });

            // Keep the new overlay hidden until it runs
            const $overlay = <HTMLDivElement | null>(document.querySelector(`#${overlayLayout.containerName}[data-sequence="${overlayLayout.index}"]`));

            if ($overlay !== null) {
                $overlay.style.setProperty('visibility', 'hidden');
                $overlay.style.setProperty('z-index', '-999');
            }

            return overlayLayout as OverlayLayout;
        }));
    }

    async prepareOverlayLayouts(list: InputLayoutType[], parent: IXlr) {
        this.parent = parent;

        console.debug('<> XLR.debug OverlayLayoutManager::prepareOverlayLayouts', {
            existingOverlays: layoutListSummary(this.overlays),
            newOverlays: layoutListSummary(list),
        });

        const existing = this.overlays;
        const overlays = await this.parseOverlays(list as InputLayoutType[], existing);

        // End the overlays that are no longer scheduled, or that couldn't be reused
        const overlaysRemoved = existing.filter((o) => overlays.indexOf(o) === -1);

        console.debug('<> XLR.debug OverlayLayoutManager::prepareOverlayLayouts overlaysRemoved', {
            overlaysRemoved: layoutListSummary(overlaysRemoved),
        });

        for (const o of overlaysRemoved) {
            await this.removeOverlay(o);
        }

        this.overlays = overlays;
    }

    // Prepare the given overlays and play them, after any update already in progress
    updateOverlays(list: InputLayoutType[], parent: IXlr): Promise<void> {
        return this.enqueue(async () => {
            await this.prepareOverlayLayouts(list, parent);
            this.playOverlays();
        });
    }

    playOverlays() {
        if (this.overlays.length === 0) return;

        if (this.parent && this.parent.currentLayout?.isInterrupt()) {
            this.container.style.setProperty('visibility', 'hidden');
            this.container.style.setProperty('z-index', '-999');
            return;
        }

        this.overlays.forEach((overlay) => {
            // Running again would restart the regions of an overlay that is already playing
            if (overlay.state === ELayoutState.RUNNING) return;

            overlay.run();
        });
    }

    stopOverlays() {
        if (this.overlays.length === 0) return;

        this.overlays.forEach(async (overlay) => {
            const overlayHtml = this.getOverlayElement(overlay);

            console.debug('<> XLR.debug OverlayLayoutManager::stopOverlays', {
                overlay: layoutSummary(overlay),
                overlayHtml: elementSummary(overlayHtml),
            });

            if (overlayHtml !== null && overlay.state === ELayoutState.RUNNING) {
                await overlay.finishAllRegions();
                overlay.emitter.emit('end', overlay);
            }
        })
    }

    resumeOverlays(): Promise<void> {
        return this.enqueue(async () => {
            if (this.overlays.length === 0) return;

            // Overlays ended by the interrupt are rebuilt, the rest carry on
            this.overlays = await this.parseOverlays(this.overlays, this.overlays);

            this.playOverlays();
        });
    }
}