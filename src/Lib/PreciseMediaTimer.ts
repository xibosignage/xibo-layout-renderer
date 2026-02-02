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
 * PreciseMediaTimer
 * 
 * Provides millisecond-precision timing for media playback using requestAnimationFrame.
 * Replaces the 1-second interval timer to eliminate timing drift and enable accurate
 * preloading trigger points.
 * 
 * Benefits:
 * - <16ms precision (60fps)
 * - Accounts for actual playback time
 * - Supports pause/resume
 * - RAF-based, synced with browser rendering
 */

export interface IPreciseMediaTimer {
    start(): void;
    pause(): void;
    resume(): void;
    stop(): void;
    elapsed(): number;                           // Total elapsed in milliseconds
    remaining(): number;                         // Time remaining in milliseconds
    isRunning(): boolean;                        // Current running state
    onComplete(callback: () => void): Unsubscribe;    // Subscribe to completion
    onTick(callback: (elapsed: number, remaining: number) => void): Unsubscribe;  // Subscribe to tick
}

type Unsubscribe = () => void;

export class PreciseMediaTimer implements IPreciseMediaTimer {
    private duration: number;                    // Total duration in milliseconds
    private elapsedTime: number = 0;            // Current elapsed time
    private startTime: number = 0;              // When timer started
    private pausedTime: number = 0;             // Time when paused
    private isCurrentlyRunning: boolean = false;
    private rafId: number | null = null;
    
    // Event callbacks
    private completeCallbacks: Array<() => void> = [];
    private tickCallbacks: Array<(elapsed: number, remaining: number) => void> = [];
    
    constructor(durationMs: number) {
        if (durationMs <= 0) {
            throw new Error('Duration must be greater than 0');
        }
        this.duration = durationMs;
    }
    
    /**
     * Start the timer using requestAnimationFrame for precision
     */
    start(): void {
        if (this.isCurrentlyRunning) {
            console.warn('PreciseMediaTimer: Already running');
            return;
        }
        
        this.startTime = performance.now();
        this.elapsedTime = 0;
        this.isCurrentlyRunning = true;
        
        this.scheduleNextTick();
    }
    
    /**
     * Pause the timer, preserving elapsed time
     */
    pause(): void {
        if (!this.isCurrentlyRunning) {
            return;
        }
        
        this.pausedTime = this.elapsedTime;
        this.isCurrentlyRunning = false;
        
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
    
    /**
     * Resume from paused state
     */
    resume(): void {
        if (this.isCurrentlyRunning) {
            return;
        }
        
        this.elapsedTime = this.pausedTime;
        this.startTime = performance.now() - this.elapsedTime;
        this.isCurrentlyRunning = true;
        
        this.scheduleNextTick();
    }
    
    /**
     * Stop the timer and clean up
     */
    stop(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        this.isCurrentlyRunning = false;
        this.elapsedTime = 0;
        this.completeCallbacks = [];
        this.tickCallbacks = [];
    }
    
    /**
     * Get elapsed time in milliseconds
     */
    elapsed(): number {
        if (!this.isCurrentlyRunning) {
            return this.elapsedTime;
        }
        
        return Math.min(
            performance.now() - this.startTime,
            this.duration
        );
    }
    
    /**
     * Get remaining time in milliseconds
     */
    remaining(): number {
        return Math.max(0, this.duration - this.elapsed());
    }
    
    /**
     * Check if timer is currently running
     */
    isRunning(): boolean {
        return this.isCurrentlyRunning;
    }
    
    /**
     * Subscribe to completion event
     */
    onComplete(callback: () => void): Unsubscribe {
        this.completeCallbacks.push(callback);
        
        return () => {
            const index = this.completeCallbacks.indexOf(callback);
            if (index > -1) {
                this.completeCallbacks.splice(index, 1);
            }
        };
    }
    
    /**
     * Subscribe to tick events with precise timing
     */
    onTick(callback: (elapsed: number, remaining: number) => void): Unsubscribe {
        this.tickCallbacks.push(callback);
        
        return () => {
            const index = this.tickCallbacks.indexOf(callback);
            if (index > -1) {
                this.tickCallbacks.splice(index, 1);
            }
        };
    }
    
    /**
     * Private: Schedule next animation frame
     */
    private scheduleNextTick(): void {
        if (!this.isCurrentlyRunning) {
            return;
        }
        
        this.rafId = requestAnimationFrame(() => {
            const currentElapsed = this.elapsed();
            const currentRemaining = this.remaining();
            
            // Emit tick callbacks
            for (const callback of this.tickCallbacks) {
                try {
                    callback(currentElapsed, currentRemaining);
                } catch (error) {
                    console.error('Error in onTick callback:', error);
                }
            }
            
            // Check if duration expired
            if (currentRemaining <= 0) {
                this.isCurrentlyRunning = false;
                
                // Emit complete callbacks
                for (const callback of this.completeCallbacks) {
                    try {
                        callback();
                    } catch (error) {
                        console.error('Error in onComplete callback:', error);
                    }
                }
            } else {
                // Schedule next tick
                this.scheduleNextTick();
            }
        });
    }
}

export default PreciseMediaTimer;
