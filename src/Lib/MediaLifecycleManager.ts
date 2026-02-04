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

/**
 * MediaLifecycleManager
 * 
 * State machine for managing media lifecycle across:
 * - IDLE: Not yet prepared
 * - PREPARING: Loading resources (preload phase)
 * - PRELOADED: Resources ready, waiting to play
 * - PLAYING: Currently rendering/playing
 * - TRANSITIONING: Transition animation in progress
 * - ENDING: End animation running
 * - FINISHED: Complete and cleaned up
 * 
 * This allows fine-grained control over when media is loaded vs when it plays,
 * enabling the preload-while-playing strategy.
 */

export enum MediaLifecycleState {
    IDLE = 'idle',
    PREPARING = 'preparing',
    PRELOADED = 'preloaded',
    PLAYING = 'playing',
    TRANSITIONING = 'transitioning',
    ENDING = 'ending',
    FINISHED = 'finished',
}

export interface IMediaLifecycleManager {
    state: MediaLifecycleState;
    progressPercent: number;
    readyTimeMs: number;
    playStartTimeMs: number;
    
    transitionToState(nextState: MediaLifecycleState): Promise<void>;
    onStateChange(callback: (from: MediaLifecycleState, to: MediaLifecycleState) => void): Unsubscribe;
    onProgressChange(callback: (percent: number) => void): Unsubscribe;
    onReady(callback: () => void): Unsubscribe;
    canTransitionTo(nextState: MediaLifecycleState): boolean;
}

type Unsubscribe = () => void;

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<MediaLifecycleState, MediaLifecycleState[]> = {
    [MediaLifecycleState.IDLE]: [
        MediaLifecycleState.PREPARING,
        MediaLifecycleState.PLAYING,  // Direct play without preload
    ],
    [MediaLifecycleState.PREPARING]: [
        MediaLifecycleState.PRELOADED,
        MediaLifecycleState.IDLE,     // Reset if preparation fails
    ],
    [MediaLifecycleState.PRELOADED]: [
        MediaLifecycleState.PLAYING,
        MediaLifecycleState.IDLE,     // Reset if not needed
    ],
    [MediaLifecycleState.PLAYING]: [
        MediaLifecycleState.ENDING,
        MediaLifecycleState.TRANSITIONING,
    ],
    [MediaLifecycleState.TRANSITIONING]: [
        MediaLifecycleState.PLAYING,
        MediaLifecycleState.ENDING,
    ],
    [MediaLifecycleState.ENDING]: [
        MediaLifecycleState.FINISHED,
        MediaLifecycleState.IDLE,     // For looping media
    ],
    [MediaLifecycleState.FINISHED]: [
        MediaLifecycleState.IDLE,     // Reset for reuse
    ],
};

export class MediaLifecycleManager implements IMediaLifecycleManager {
    private _state: MediaLifecycleState = MediaLifecycleState.IDLE;
    private _progressPercent: number = 0;
    private _readyTimeMs: number = 0;
    private _playStartTimeMs: number = 0;
    
    // Callbacks
    private stateChangeCallbacks: Array<(from: MediaLifecycleState, to: MediaLifecycleState) => void> = [];
    private progressCallbacks: Array<(percent: number) => void> = [];
    private readyCallbacks: Array<() => void> = [];
    
    constructor() {
        this._state = MediaLifecycleState.IDLE;
    }
    
    /**
     * Get current state
     */
    get state(): MediaLifecycleState {
        return this._state;
    }
    
    /**
     * Get preload progress (0-100)
     */
    get progressPercent(): number {
        return this._progressPercent;
    }
    
    /**
     * Get time when media was ready for playback
     */
    get readyTimeMs(): number {
        return this._readyTimeMs;
    }
    
    /**
     * Get time when playback started
     */
    get playStartTimeMs(): number {
        return this._playStartTimeMs;
    }
    
    /**
     * Set progress during preparation phase (0-100)
     */
    setProgress(percent: number): void {
        if (this._state !== MediaLifecycleState.PREPARING) {
            console.warn('??? XLR.debug >> MediaLifecycleManager: Cannot set progress outside PREPARING state');
            return;
        }
        
        const normalized = Math.min(100, Math.max(0, percent));
        
        if (normalized !== this._progressPercent) {
            this._progressPercent = normalized;
            
            for (const callback of this.progressCallbacks) {
                try {
                    callback(normalized);
                } catch (error) {
                    console.error('??? XLR.debug >> Error in progress callback:', error);
                }
            }
        }
    }
    
    /**
     * Transition to a new state
     */
    async transitionToState(nextState: MediaLifecycleState): Promise<void> {
        if (!this.canTransitionTo(nextState)) {
            throw new Error(
                `Invalid state transition: ${this._state} -> ${nextState}`
            );
        }
        
        const previousState = this._state;
        this._state = nextState;
        
        // Record timing for important states
        if (nextState === MediaLifecycleState.PRELOADED) {
            this._readyTimeMs = performance.now();
        }
        
        if (nextState === MediaLifecycleState.PLAYING) {
            this._playStartTimeMs = performance.now();
        }
        
        // Reset progress when leaving PREPARING
        if (previousState === MediaLifecycleState.PREPARING) {
            this._progressPercent = 0;
        }
        
        // Notify state change listeners
        for (const callback of this.stateChangeCallbacks) {
            try {
                callback(previousState, nextState);
            } catch (error) {
                console.error('??? XLR.debug >> Error in state change callback:', error);
            }
        }
        
        // Notify ready listeners
        if (nextState === MediaLifecycleState.PRELOADED) {
            for (const callback of this.readyCallbacks) {
                try {
                    callback();
                } catch (error) {
                    console.error('??? XLR.debug >> Error in ready callback:', error);
                }
            }
        }
    }
    
    /**
     * Check if a transition is valid
     */
    canTransitionTo(nextState: MediaLifecycleState): boolean {
        const validNextStates = VALID_TRANSITIONS[this._state];
        return validNextStates && validNextStates.includes(nextState);
    }
    
    /**
     * Subscribe to state changes
     */
    onStateChange(callback: (from: MediaLifecycleState, to: MediaLifecycleState) => void): Unsubscribe {
        this.stateChangeCallbacks.push(callback);
        
        return () => {
            const index = this.stateChangeCallbacks.indexOf(callback);
            if (index > -1) {
                this.stateChangeCallbacks.splice(index, 1);
            }
        };
    }
    
    /**
     * Subscribe to progress changes during preparation
     */
    onProgressChange(callback: (percent: number) => void): Unsubscribe {
        this.progressCallbacks.push(callback);
        
        return () => {
            const index = this.progressCallbacks.indexOf(callback);
            if (index > -1) {
                this.progressCallbacks.splice(index, 1);
            }
        };
    }
    
    /**
     * Subscribe to ready event (PRELOADED state reached)
     */
    onReady(callback: () => void): Unsubscribe {
        this.readyCallbacks.push(callback);
        
        return () => {
            const index = this.readyCallbacks.indexOf(callback);
            if (index > -1) {
                this.readyCallbacks.splice(index, 1);
            }
        };
    }
    
    /**
     * Reset to IDLE state
     */
    reset(): void {
        this._state = MediaLifecycleState.IDLE;
        this._progressPercent = 0;
        this._readyTimeMs = 0;
        this._playStartTimeMs = 0;
    }
}

export default MediaLifecycleManager;
