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

import {createNanoEvents, Emitter} from 'nanoevents';
import {ILayout, ILayoutTransitionConfig} from "../Types/Layout";
import {ILayoutTransitionEvents} from "../Types/Events";

export interface ILayoutTransitionManager {
  /** Prepare layout transition from current to next layout */
  prepareTransition(from: ILayout, to: ILayout): Promise<void>;

  /** Execute fade transition with regions playing concurrently */
  executeTransition(from: ILayout, to: ILayout): Promise<void>;

  /** Abort ongoing transition */
  abort(): void;

  /** Get transition configuration */
  getConfig(): ILayoutTransitionConfig;

  /** Subscribe to transition events */
  on<E extends keyof ILayoutTransitionEvents>(
    event: E,
    callback: ILayoutTransitionEvents[E]
  ): () => void;
}

export class LayoutTransitionManager implements ILayoutTransitionManager {
  private config: ILayoutTransitionConfig;
  private emitter: Emitter<ILayoutTransitionEvents>;
  private abortController: AbortController | null = null;

  constructor(config: Partial<ILayoutTransitionConfig> = {}) {
    this.config = {
      fadeDurationMs: config.fadeDurationMs ?? 500,
      parallelStartMs: config.parallelStartMs ?? 1000,
      maxWaitMs: config.maxWaitMs ?? 5000,
      easing: config.easing ?? 'ease-in-out',
    };

    this.emitter = createNanoEvents<ILayoutTransitionEvents>();
  }

  /**
   * Prepare next layout for transition
   * Ensures nextLayout is fully prepared before starting transition
   */
  async prepareTransition(from: ILayout, to: ILayout): Promise<void> {
    const startTime = performance.now();

    try {
      console.debug('LayoutTransitionManager: Preparing transition', {
        from: from.id,
        to: to.id,
      });

      // Wait for next layout to complete preparation (all regions ready)
      await this.waitForLayoutReady(to, this.config.maxWaitMs);

      const prepareTime = performance.now() - startTime;
      console.debug(`LayoutTransitionManager: Transition preparation complete (${prepareTime.toFixed(2)}ms)`);
    } catch (error) {
      console.error('LayoutTransitionManager: Preparation failed', error);
      this.emitter.emit('transitionFailed', {
        from,
        to,
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }

  /**
   * Execute fade transition while regions play concurrently
   *
   * Timeline:
   * - T=0ms: currentLayout regions continue playing
   * - T=0ms: nextLayout regions START PLAYING
   * - T=0-500ms: Fade currentLayout to transparent
   * - T=0-500ms: Fade nextLayout to opaque
   * - T=500ms: Hide currentLayout DOM, keep nextLayout visible
   */
  async executeTransition(from: ILayout, to: ILayout): Promise<void> {
    const startTime = performance.now();

    this.abortController = new AbortController();

    try {
      console.debug('LayoutTransitionManager: Starting transition', {
        from: from.id,
        to: to.id,
        fadeDurationMs: this.config.fadeDurationMs,
      });

      this.emitter.emit("transitionStart", {
        from,
        to,
        fadeDurationMs: this.config.fadeDurationMs,
      });

      // Step 1: Start nextLayout regions playing IMMEDIATELY
      // Replace sequential regions start with parallel start
      if (to.playRegions && typeof to.playRegions === 'function') {
        to.playRegions();
        console.debug('LayoutTransitionManager: nextLayout regions started');
      }

      // Step 2: Fade both layouts concurrently
      await this.performFadeTransition(from, to, this.abortController.signal);

      // Step 3: Clean up currentLayout DOM
      // Hide currentLayout after fade completes
      if (from.html) {
        from.html.style.display = 'none';
        from.html.style.opacity = '0';
      }

      // Step 4: Ensure nextLayout is fully visible
      // nextLayout should already be visible
      if (to.html) {
        to.html.style.display = 'block';
        to.html.style.opacity = '1';
      }

      const transitionTime = performance.now() - startTime;
      console.debug(`LayoutTransitionManager: Transition complete (${transitionTime.toFixed(2)}ms)`);

      this.emitter.emit('transitionComplete', {
        from,
        to,
        durationMs: transitionTime,
      });
    } catch (error) {
      if ((error as Error).message !== 'Aborted') {
        console.error('LayoutTransitionManager: Transition failed', error);
        this.emitter.emit('transitionFailed', {
          from,
          to,
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }

      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Perform fade animation on both layouts
   * Uses Web Animations API for smooth transitions
   */
  private async performFadeTransition(
    fromLayout: ILayout,
    toLayout: ILayout,
    signal: AbortSignal,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkAbort = () => {
        if (signal.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
        }
      };

      signal.addEventListener('abort', checkAbort);

      const easing = this.getEasingFunction(this.config.easing ?? 'ease-in-out');

      // Fade OUT current layout
      const fromFadeKeyframes = [
        { opacity: 1 },
        { opacity: 0 },
      ];

      const fromAnimation = fromLayout.html?.animate(
        fromFadeKeyframes, {
          duration: this.config.fadeDurationMs,
          easing,
          fill: 'forwards',
        }
      );

      // Fade IN next layout
      const toFadeKeyframes = [
        { opacity: 0 },
        { opacity: 1 },
      ];

      const toAnimation = toLayout.html?.animate(
        toFadeKeyframes, {
          duration: this.config.fadeDurationMs,
          easing,
          fill: 'forwards',
        }
      );

      // Wait for animations to complete
      Promise.all([
        fromAnimation?.finished ?? Promise.resolve(),
        toAnimation?.finished ?? Promise.resolve(),
      ])
        .then(() => {
          signal.removeEventListener('abort', checkAbort);
          resolve();
        })
        .catch((err) => {
          signal.removeEventListener('abort', checkAbort);
          reject(err);
        });
    });
  }

  /**
   * Wait for layout and all its regions to be ready
   */
  private async waitForLayoutReady(layout: ILayout, maxWaitMs: number): Promise<void> {
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      const checkReady = () => {
        if (layout.ready && layout.regions?.every(
          r => r.ready)
        ) {
          resolve();
          return;
        }

        const elapsed = performance.now() - startTime;
        if (elapsed > maxWaitMs) {
          reject(new Error(`Layout not ready after ${maxWaitMs}ms`));
          return;
        }

        // Check again after 100ms
        setTimeout(checkReady, 100);
      };

      checkReady();
    });
  }

  /**
   * Get CSS easing function string
   */
  private getEasingFunction(easing: string): string {
    const easingMap: { [key: string]: string } = {
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      'linear': 'linear',
    };
    return easingMap[easing] || easingMap['ease-in-out'];
  }

  getConfig(): ILayoutTransitionConfig {
    return { ...this.config };
  }

  on<E extends keyof ILayoutTransitionEvents>(
    event: E,
    callback: ILayoutTransitionEvents[E]
  ): () => void {
    return this.emitter.on(event, callback as any);
  }

  abort(): void {
    if (this.abortController && !this.abortController.signal.aborted) {
      this.abortController.abort();
    }
  }
}

export default LayoutTransitionManager;
