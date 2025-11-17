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

import {ILayout, initialLayout, InputLayoutType} from "../../Types/Layout";
import {IXlr} from "../../Types/XLR";
import OverlayLayout from "./OverlayLayout";

export class OverlayLayoutManager {
    overlays: OverlayLayout[] = [];
    container!: HTMLElement;
    parent!: IXlr;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'overlay-layouts';
        this.container.style.display = 'none';
    }

    async prepareOverlayLayouts(list: InputLayoutType[], parent: IXlr) {
        let hasChanged = false;
        this.parent = parent;

        console.debug('<> XLR.debug OverlayLayoutManager::prepareOverlayLayouts', {
            existingOverlays: this.overlays,
            newOverlays: list,
            hasChanged,
        });

        // Check if list has changed
        // If yes, then emit overlayEnd for removed overlay
        if (this.overlays.length > 0 && list.length >= 0) {
            const existingOverlayIds = this.overlays.reduce((ids: number[], o) => [...ids, o.layoutId], []);
            const newListIds = list.reduce((ids: number[], o) => [...ids, o.layoutId], []);
            hasChanged = existingOverlayIds.join(',') !== newListIds.join(',');

            if (hasChanged) {
                const overlaysRemoved = existingOverlayIds.filter(eId => newListIds.indexOf(eId) === -1);
                console.debug('<> XLR.debug OverlayLayoutManager::prepareOverlayLayouts overlaysRemoved', {
                    overlaysRemoved,
                    existingOverlayIds,
                    newListIds,
                });

                if (overlaysRemoved.length > 0) {
                    for (const oLayoutId of overlaysRemoved) {
                        const o = this.overlays.find(o => o.layoutId === oLayoutId);

                        if (o) {
                            const overlayHtml = <HTMLDivElement | null>(document.querySelector(`#${o.containerName}[data-sequence="${o.index}"]`));

                            if (overlayHtml !== null) {
                                await o.finishAllRegions();
                                o.emitter.emit('end', o);
                            }
                        }
                    }
                }
            }
        }

        console.debug('<> XLR.debug OverlayLayoutManager::prepareOverlayLayouts', {
            existingOverlays: this.overlays,
            newOverlays: list,
            hasChanged,
        });

        this.overlays = await Promise.all(list.map(async (item: InputLayoutType) => {
            let inputOverlay: InputLayoutType = <InputLayoutType>{};

            inputOverlay = {...inputOverlay, ...item};
            inputOverlay.index = item.index;

            const overlayLayout = await this.parent.prepareLayoutXlf(<ILayout>{...initialLayout, ...inputOverlay});

            // Hide all overlays first
            const $overlay = <HTMLDivElement | null>(document.querySelector(`#${overlayLayout.containerName}[data-sequence="${overlayLayout.index}"]`));

            if ($overlay !== null) {
                $overlay.style.setProperty('display', 'none');
            }

            return overlayLayout as OverlayLayout;
        }));
    }

    playOverlays() {
        if (this.overlays.length === 0) {
            // Clean up existing overlays
        }

        if (this.parent && this.parent.currentLayout?.isInterrupt()) {
            this.container.style.setProperty('display', 'none');
            return;
        }

        this.overlays.forEach((overlay) => {
            overlay.run();
        });
    }
}