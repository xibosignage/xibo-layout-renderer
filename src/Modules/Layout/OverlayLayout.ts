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

import Layout, {ILayoutEvents} from "./Layout";
import {ILayout, OptionsType} from "../../Types/Layout";
import {IXlr} from "../../Types/XLR";
import {createNanoEvents, Emitter, Unsubscribe} from "nanoevents";

export interface IOverlayLayoutEvents extends ILayoutEvents {}

export default class OverlayLayout extends Layout {
  override emitter: Emitter<IOverlayLayoutEvents> = createNanoEvents<IOverlayLayoutEvents>();

  constructor(
    xlrLayoutObj: ILayout,
    options: OptionsType,
    xlr: IXlr,
    data?: Document,
  ) {
    super(
      xlrLayoutObj,
      options,
      xlr,
      data,
    );

    this.on('start', (overlay: ILayout) => {
      super.on('start', (overlay: ILayout) => {});
      console.log('XLR::OverlayLayout >> emitter.on("start")', {
        overlay,
      })
    });

    this.on('end', async (overlay: ILayout) => {
      // Check if currentLayout is already done
      // If not, don't remove the overlay layout until currentLayout.done = true
      console.log('XLR::OverlayLayout >> emitter.on("end")', {
        currentLayout: this.xlr.currentLayout,
        overlay,
      });
      if (this.xlr.currentLayout && !this.xlr.currentLayout.allEnded) {
        return;
      }

      console.debug('XLR::OverlayLayout >> Ending overlay layout with ID of > ', overlay.layoutId);
      /* Remove layout that has ended */
      const $layout = <HTMLDivElement | null>(
        document.querySelector(`#${overlay.containerName}[data-sequence="${overlay.index}"]`)
      );

      overlay.done = true;
      console.debug({$layout});

      if ($layout !== null) {
        $layout.parentElement?.removeChild($layout);
      }

      // Emit layout end event
      console.debug('Layout::Emitter > End - Calling layoutEnd event');
      this.xlr.emitter.emit('layoutEnd', overlay);

      // Check if stats are enabled for the layout
      if (overlay.enableStat) {
        this.statsBC.postMessage({
          action: 'END_STAT',
          layoutId: overlay.id,
          scheduleId: overlay.scheduleId,
          type: 'layout',
        });
      }
    });
  }

  override on<E extends keyof IOverlayLayoutEvents>(event: E, callback: IOverlayLayoutEvents[E]): Unsubscribe {
    return this.emitter.on(event, callback);
  }
}
