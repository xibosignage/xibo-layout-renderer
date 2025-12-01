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

import Layout from "./Layout";
import {ELayoutState, ILayout, ILayoutEvents, OptionsType} from "../../Types/Layout";
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

    this.state = ELayoutState.IDLE;

    this.on('start', (overlay: ILayout) => {
      if (overlay.state === ELayoutState.RUNNING) return;
      overlay.done = false;
      overlay.state = ELayoutState.RUNNING;
      console.debug('>>>> XLR.debug Overlay layout start emitted > Layout ID > ', overlay.id);

      // Check if stats are enabled for the layout
      if (overlay.enableStat) {
        this.statsBC.postMessage({
          action: 'START_STAT',
          layoutId: overlay.id,
          scheduleId: overlay.scheduleId,
          type: 'layout',
        });
      }

      // Emit overlay start event
      console.debug('Overlay::Emitter > Start - Calling overlayStart event');
      overlay.xlr.emitter.emit('overlayStart', overlay);
    });

    this.on('end', async (overlay: ILayout) => {
      if (overlay.state === ELayoutState.PLAYED) return;

      overlay.state = ELayoutState.PLAYED;

      // Check if currentLayout is already done
      // If not, don't remove the overlay layout until currentLayout.done = true
      console.log('XLR::OverlayLayout >> emitter.on("end")', {
        currentLayout: overlay.xlr.currentLayout,
        overlay,
      });

      console.debug('XLR::OverlayLayout >> Ending overlay layout with ID of > ', overlay.layoutId);
      /* Remove layout that has ended */
      const $overlay = <HTMLDivElement | null>(
        document.querySelector(`#${overlay.containerName}[data-sequence="${overlay.index}"]`)
      );

      overlay.done = true;
      console.debug({overlayHtml: $overlay});

      if ($overlay !== null) {
        $overlay.parentElement?.removeChild($overlay);
      }

      // Emit overlay layout end event
      console.debug('Overlay::Emitter > End - Calling overlayEnd event');
      overlay.xlr.emitter.emit('overlayEnd', overlay);

      // Check if stats are enabled for the overlay
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
