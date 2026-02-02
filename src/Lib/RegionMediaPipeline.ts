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

/**
 * RegionMediaPipeline
 * 
 * Orchestrates the loading and playback of media within a region to achieve gapless playback.
 * 
 * Key responsibilities:
 * 1. Maintain current and next media state
 * 2. Preload next media in background while current plays
 * 3. Transition smoothly between media (minimizing gap)
 * 4. Handle edge cases (single media, looping, failures)
 * 
 * Pipeline Algorithm:
 * - Media starts: Schedule preload trigger point
 * - At trigger point: Begin loading next media (background)
 * - When current ends: Transition to preloaded next media
 * - Transition includes: Out animation → In animation → Start playback
 */

import { IMedia } from '../Types/Media';
import { IRegion } from '../Types/Region';
import { MediaLifecycleManager, MediaLifecycleState } from './MediaLifecycleManager';

export interface IRegionMediaPipeline {
    currentMedia: IMedia | null;
    nextMedia: IMedia | null;
    queuedMedia: IMedia[];
    
    prepareNextMediaInBackground(): Promise<void>;
    preloadMediaResources(media: IMedia): Promise<void>;
    transitionToNextMedia(): Promise<void>;
    
    onCurrentMediaWillEnd(timeBeforeEnd: number): Promise<void>;
    onCurrentMediaEnded(): Promise<void>;
    
    estimatePreloadTime(media: IMedia): number;
    shouldStartPreloadingNow(currentElapsed: number, currentDuration: number): boolean;
}

export class RegionMediaPipeline implements IRegionMediaPipeline {
    private region: IRegion;
    
    private _currentMedia: IMedia | null = null;
    private _nextMedia: IMedia | null = null;
    private _queuedMedia: IMedia[] = [];
    
    private preloadPromise: Promise<void> | null = null;
    private preloadAbortController: AbortController | null = null;
    
    // Configuration
    private preloadBufferMs: number = 2000;      // Start preload 2s before end
    private maxPreloadTimeMs: number = 5000;     // Max time allowed to preload
    private transitionDurationMs: number = 500;  // Fade in/out duration
    
    constructor(region: IRegion, config?: Partial<{
        preloadBufferMs: number;
        maxPreloadTimeMs: number;
        transitionDurationMs: number;
    }>) {
        this.region = region;
        
        if (config) {
            this.preloadBufferMs = config.preloadBufferMs ?? this.preloadBufferMs;
            this.maxPreloadTimeMs = config.maxPreloadTimeMs ?? this.maxPreloadTimeMs;
            this.transitionDurationMs = config.transitionDurationMs ?? this.transitionDurationMs;
        }
    }
    
    /**
     * Get current playing media
     */
    get currentMedia(): IMedia | null {
        return this._currentMedia;
    }
    
    /**
     * Get next prepared media
     */
    get nextMedia(): IMedia | null {
        return this._nextMedia;
    }
    
    /**
     * Get queued media items
     */
    get queuedMedia(): IMedia[] {
        return this._queuedMedia;
    }
    
    /**
     * Set current media and initialize pipeline
     */
    setCurrentMedia(media: IMedia): void {
        this._currentMedia = media;
        
        // Prepare next media reference from region
        const nextMediaIndex = this.region.mediaObjects.indexOf(media) + 1;
        if (nextMediaIndex < this.region.mediaObjects.length) {
            this._nextMedia = this.region.mediaObjects[nextMediaIndex];
        } else if (this.region.mediaObjects.length > 1) {
            // Loop back to first
            this._nextMedia = this.region.mediaObjects[0];
        }
        
        // Queue remaining media
        this._queuedMedia = this.region.mediaObjects.slice(nextMediaIndex + 1 < this.region.mediaObjects.length ? nextMediaIndex + 1 : 0);
    }
    
    /**
     * Called when current media is about to end (at trigger point)
     * Initiates background preloading of next media
     */
    async onCurrentMediaWillEnd(timeBeforeEnd: number): Promise<void> {
        if (!this._nextMedia) {
            console.debug('RegionMediaPipeline: No next media to preload');
            return;
        }
        
        console.debug('RegionMediaPipeline: Preload trigger reached', {
            nextMediaId: this._nextMedia.id,
            timeBeforeEnd,
        });
        
        await this.prepareNextMediaInBackground();
    }
    
    /**
     * Called when current media has ended
     * Handles transition to next media with minimal gap
     */
    async onCurrentMediaEnded(): Promise<void> {
        await this.transitionToNextMedia();
    }
    
    /**
     * Initiate background preload of next media
     * Returns immediately; preload happens asynchronously
     */
    async prepareNextMediaInBackground(): Promise<void> {
        if (!this._nextMedia) {
            return;
        }
        
        // Avoid duplicate preloading
        if (this.preloadPromise) {
            console.debug('RegionMediaPipeline: Preload already in progress');
            return;
        }
        
        // Create abort controller for this preload operation
        this.preloadAbortController = new AbortController();
        
        this.preloadPromise = (async () => {
            try {
                console.debug('RegionMediaPipeline: Starting background preload', {
                    mediaId: this._nextMedia?.id,
                });
                
                if (this._nextMedia) {
                    await this.preloadMediaResources(
                        this._nextMedia,
                        this.preloadAbortController?.signal
                    );
                    
                    console.debug('RegionMediaPipeline: Preload completed', {
                        mediaId: this._nextMedia?.id,
                    });
                }
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    console.debug('RegionMediaPipeline: Preload cancelled');
                } else {
                    console.error('RegionMediaPipeline: Preload failed', error);
                }
            } finally {
                this.preloadPromise = null;
                this.preloadAbortController = null;
            }
        })();
    }
    
    /**
     * Load/prepare media resources without starting playback
     */
    async preloadMediaResources(
        media: IMedia,
        signal?: AbortSignal
    ): Promise<void> {
        if (!media) {
            return;
        }
        
        // Set up lifecycle manager if not already done
        if (!('lifecycle' in media)) {
            (media as any).lifecycle = new MediaLifecycleManager();
        }
        
        const lifecycle = (media as any).lifecycle as MediaLifecycleManager;
        
        try {
            // Transition to PREPARING state
            if (lifecycle.canTransitionTo(MediaLifecycleState.PREPARING)) {
                await lifecycle.transitionToState(MediaLifecycleState.PREPARING);
            }
            
            // Call media-specific preload method
            if ('preload' in media && typeof (media as any).preload === 'function') {
                const preloadPromise = (media as any).preload({
                    signal,
                    onProgress: (percent: number) => lifecycle.setProgress(percent),
                });
                
                await Promise.race([
                    preloadPromise,
                    this.createTimeoutPromise(this.maxPreloadTimeMs, signal),
                ]);
            }
            
            // Transition to PRELOADED state
            if (lifecycle.canTransitionTo(MediaLifecycleState.PRELOADED)) {
                await lifecycle.transitionToState(MediaLifecycleState.PRELOADED);
            }
        } catch (error) {
            // Reset to IDLE on failure
            lifecycle.reset();
            throw error;
        }
    }
    
    /**
     * Transition from current media to next media
     * Coordinates animations and starts playback of next
     */
    async transitionToNextMedia(): Promise<void> {
        if (!this._nextMedia) {
            console.debug('RegionMediaPipeline: No next media, looping current');
            // TODO: Handle loop-same-media case
            return;
        }
        
        console.debug('RegionMediaPipeline: Starting transition', {
            fromMediaId: this._currentMedia?.id,
            toMediaId: this._nextMedia?.id,
        });
        
        try {
            // Run out and in animations in parallel
            await Promise.all([
                this.animateMediaOut(this._currentMedia),
                this.animateMediaIn(this._nextMedia),
            ]);
            
            // Start playback of next media
            if (this._nextMedia && 'emitter' in this._nextMedia) {
                this._nextMedia.emitter.emit('start', this._nextMedia);
            }
            
            // Update current/next references
            this._currentMedia = this._nextMedia;
            
            // Find and set next media
            const currentIndex = this.region.mediaObjects.indexOf(this._currentMedia);
            const nextIndex = currentIndex + 1;
            
            if (nextIndex < this.region.mediaObjects.length) {
                this._nextMedia = this.region.mediaObjects[nextIndex];
            } else if (this.region.mediaObjects.length > 1) {
                this._nextMedia = this.region.mediaObjects[0];
            } else {
                this._nextMedia = null;
            }
            
        } catch (error) {
            console.error('RegionMediaPipeline: Transition failed', error);
            throw error;
        }
    }
    
    /**
     * Estimate time needed to preload a media item
     */
    estimatePreloadTime(media: IMedia): number {
        // Heuristic based on media type
        if (media.mediaType === 'video') {
            return 3000;  // 3 seconds for video
        } else if (media.mediaType === 'audio') {
            return 1000;  // 1 second for audio
        } else if (media.mediaType === 'image') {
            return 500;   // 500ms for image
        } else if (media.render === 'html' || media.mediaType === 'webpage') {
            return 2000;  // 2 seconds for HTML
        } else {
            return 500;   // 500ms default
        }
    }
    
    /**
     * Determine if preloading should start now
     */
    shouldStartPreloadingNow(currentElapsed: number, currentDuration: number): boolean {
        if (currentDuration === 0) {
            return false;
        }
        
        const timeRemaining = currentDuration - currentElapsed;
        const preloadEstimate = this.estimatePreloadTime(this._currentMedia!);
        
        return timeRemaining <= (this.preloadBufferMs + preloadEstimate);
    }
    
    /**
     * Private: Animate media out (fade, etc.)
     */
    private async animateMediaOut(media: IMedia | null): Promise<void> {
        if (!media || !media.html) {
            return;
        }
        
        return new Promise((resolve) => {
            // TODO: Hook into region's transition system
            // For now, just hide after transition duration
            setTimeout(() => {
                if (media.html) {
                    media.html.style.setProperty('display', 'none');
                }
                resolve();
            }, this.transitionDurationMs);
        });
    }
    
    /**
     * Private: Animate media in (fade, etc.)
     */
    private async animateMediaIn(media: IMedia | null): Promise<void> {
        if (!media || !media.html) {
            return;
        }
        
        return new Promise((resolve) => {
            // TODO: Hook into region's transition system
            // For now, just show immediately
            if (media.html) {
                media.html.style.setProperty('display', 'block');
            }
            setTimeout(resolve, this.transitionDurationMs);
        });
    }
    
    /**
     * Private: Create a timeout promise
     */
    private createTimeoutPromise(ms: number, signal?: AbortSignal): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Preload timeout after ${ms}ms`));
            }, ms);
            
            if (signal) {
                signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                    reject(new DOMException('Preload aborted', 'AbortError'));
                });
            }
        });
    }
}

export default RegionMediaPipeline;
