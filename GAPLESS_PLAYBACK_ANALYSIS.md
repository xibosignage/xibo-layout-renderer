# Gapless Playback Analysis & Solution for Xibo Layout Renderer (XLR)

## Executive Summary

The current XLR architecture prevents true gapless playback due to **sequential, blocking media lifecycle transitions**. The system processes media in a synchronous chain: current media ends → region transitions → next media starts. This introduces unavoidable gaps between media transitions, especially problematic for continuous video/audio playback.

---

## Current Architecture Issues

### 1. **Sequential Media Lifecycle (Root Cause)**

**Current Flow:**
```
Region.playNextMedia()
  ├─ Waits for oldMedia animation
  ├─ Calls transitionNodes(oldMedia, newMedia)
  │  └─ Waits for hideOldMedia Promise
  │     └─ Then calls newMedia.run()
  └─ newMedia only starts AFTER oldMedia is fully hidden
```

**Problem:** When media duration expires (via `startMediaTimer` in `Media.ts`), the `end` event is emitted, which triggers `region.playNextMedia()`. This function waits for transition animations before starting the next media, causing gaps.

### 1b. **Sequential Layout Lifecycle (Layout-Level Gap)**

**Current Flow:**
```
Layout.regionEnded()
  ├─ All regions finished
  ├─ Emit 'end' event
  └─ XLR detects layout end
     └─ Switch to nextLayout
         ├─ Hide currentLayout DOM
         ├─ Show nextLayout DOM
         └─ Call nextLayout.playRegions()
```

**Problem:** Similar issue at layout level:
- `currentLayout` plays all regions
- `nextLayout` is prepared in background (✓ good)
- But when `currentLayout` ends, there's a DOM update delay before `nextLayout` starts rendering
- This creates a visible gap/transition at layout boundaries

### 2. **Timer-Based Duration Tracking**

Located in `Media.ts#startMediaTimer()`:
```typescript
this.mediaTimer = setInterval(() => {
    this.mediaTimeCount++;
    if (this.mediaTimeCount > media.duration) {
        media.emitter.emit('end', media);  // Synchronous end
    }
}, 1000);
```

**Problems:**
- 1-second interval granularity causes timing drift
- No accounting for actual playback time (network delays, render time)
- Blocking integer comparison ignores millisecond precision
- Transitions introduce unpredictable gaps

### 3. **Single Media in Flight per Region**

`Region.ts#prepareMediaObjects()` maintains:
```typescript
currMedia  // Currently playing
nxtMedia   // Prepared for next transition
```

**Gap Source:** `nxtMedia` is prepared but NOT loaded/buffered until `currMedia` ends and transitions complete.

### 4. **Synchronous Region Rendering**

`Layout.ts#playRegions()`:
```typescript
for (let i = 0; i < this.regions.length; i++) {
    this.regions[i].run();  // Blocking loop
}
```

While regions must run synchronously, media within regions should prepare in parallel.

### 4b. **Layout-to-Layout Transition Delay**

Current flow in `xibo-layout-renderer.ts`:
```typescript
xlrObject.playLayouts = function(xlr: IXlr) {
    if (xlr.currentLayout !== undefined) {
        xlr.currentLayout.run();  // Play current
    }
};
```

**Gap Source:** 
- `currentLayout.end()` called when all regions finish
- `nextLayout` was prepared in background (✓)
- But DOM hide/show happens sequentially:
  - Hide currentLayout container
  - Show nextLayout container  
  - Start nextLayout.playRegions()
- This creates visible transition/gap at layout boundary

### 5. **No Media Preloading Strategy**

Media preparation happens AFTER previous media ends:
- HTML/iframe: Created on-demand
- Image: URL set on-demand
- Video: video.js player created + source set + playback started sequentially
- Audio: Source set on first play

**Result:** Video/audio require network fetch + codec initialization AFTER previous media ends = guaranteed gap.

---

## Impact by Media Type

### Video Media (Worst Case)
```
TimelineT0: prevVideo ends
     T0+ΔT1: transOut animation (~1000ms typical)
     T0+ΔT1+ΔT2: newVideo.run() called
     T0+ΔT1+ΔT2+ΔT3: Network fetch starts
     T0+ΔT1+ΔT2+ΔT3+ΔT4: video.js canplay event
     T0+ΔT1+ΔT2+ΔT3+ΔT4+ΔT5: Video starts playing
     ↑↑↑ TOTAL GAP: ΔT1+ΔT2+ΔT3+ΔT4+ΔT5 (typically 3-5+ seconds)
```

### Audio Media
```
Slightly better but still has ΔT1+ΔT2+ΔT3
```

### Image Media
```
Minimal gap if URL is pre-set (ΔT1+ΔT2)
```

### Layout-to-Layout Transitions (System-Level)
```
TimelineT0: currentLayout regions all end
     T0+ΔL1: currentLayout.emitter.emit('end')
     T0+ΔL1+ΔL2: XLR detects end, switches to nextLayout
     T0+ΔL1+ΔL2+ΔL3: Hide currentLayout DOM
     T0+ΔL1+ΔL2+ΔL3+ΔL4: Show nextLayout DOM
     T0+ΔL1+ΔL2+ΔL3+ΔL4+ΔL5: nextLayout.playRegions() starts
     ↑↑↑ TOTAL LAYOUT GAP: ΔL1+ΔL2+ΔL3+ΔL4+ΔL5 (typically 0.5-2 seconds)
```

---

## Proposed Solution: Proactive Media Pipeline Architecture

### Core Principles

1. **Prepare next media while current media plays** (not after it ends)
2. **Load/buffer next media in background** (during current media playback)
3. **Minimize media transition delay** to <500ms
4. **Enable instant media playback** when current media duration expires
5. **Parallel layout transitions** - nextLayout renders alongside currentLayout end
6. **Handle single-layout case** with seamless looping
7. **Region synchronization maintained** - all regions still run synchronously

---

## Implementation Strategy

### Phase 1: Create Media Lifecycle State Machine

**File:** `src/Lib/MediaLifecycleManager.ts` (NEW)

```typescript
export enum MediaLifecycleState {
    IDLE = 'idle',              // Not yet prepared
    PREPARING = 'preparing',    // Loading resources
    PRELOADED = 'preloaded',    // Ready to play
    PLAYING = 'playing',        // Currently rendering
    TRANSITIONING = 'transitioning',  // Transition in progress
    ENDING = 'ending',          // End animation running
    FINISHED = 'finished',      // Complete
}

export interface IMediaLifecycleManager {
    state: MediaLifecycleState;
    progressPercent: number;    // 0-100 for buffering
    readyTimeMs: number;        // When media was ready
    playStartTimeMs: number;    // When play was called
    
    transitionToState(nextState: MediaLifecycleState): Promise<void>;
    onProgress(callback: (percent: number) => void): void;
    onReady(callback: () => void): void;
}
```

### Phase 2: Implement Precise Duration Tracking

**File:** `src/Lib/PreciseMediaTimer.ts` (NEW)

```typescript
export interface IPreciseMediaTimer {
    start(): void;
    pause(): void;
    resume(): void;
    stop(): void;
    elapsed(): number;          // Milliseconds
    remaining(): number;        // Milliseconds
    isRunning(): boolean;
    onComplete(callback: () => void): void;
    onTick(callback: (elapsed: number, remaining: number) => void): void;
}
```

**Benefits:**
- Uses `requestAnimationFrame` for <16ms precision (60fps)
- Accounts for actual playback time, not just interval counts
- Allows pause/resume without losing time
- Emits precise tick events for progress bars

### Phase 3: Create Region Media Pipeline Manager

**File:** `src/Lib/RegionMediaPipeline.ts` (NEW)

Key responsibilities:
```typescript
export interface IRegionMediaPipeline {
    currentMedia: IMedia | null;
    nextMedia: IMedia | null;
    queuedMedia: IMedia[];      // Future media
    
    // Core operations
    prepareNextMediaInBackground(): Promise<void>;
    preloadMediaResources(media: IMedia): Promise<void>;
    transitionToNextMedia(): Promise<void>;
    
    // Lifecycle hooks
    onCurrentMediaWillEnd(timeBeforeEnd: number): Promise<void>;
    onCurrentMediaEnded(): Promise<void>;
    
    // Helpers
    estimatePreloadTime(media: IMedia): number;
    shouldStartPreloadingNow(): boolean;
}
```

**Algorithm:**
```
Region playback loop (continuous):
  │
  ├─ onMediaStarted()
  │  └─ Schedule: prepareNextMedia @ (currentDuration - preloadBuffer)
  │
  ├─ [currentDuration - preloadBuffer] seconds elapse
  │  └─ Call: prepareNextMediaInBackground()
  │     ├─ Load all resources for nextMedia
  │     ├─ Emit: 'mediaPreloadStart'
  │     └─ Poll for completion or timeout
  │
  ├─ [currentDuration] seconds elapse
  │  └─ Call: media.emitter.emit('end')
  │     └─ Region.playNextMedia()
  │        ├─ Start transition OUT for current (if configured)
  │        ├─ Parallel: start transition IN for next
  │        ├─ At end of transitions: start playback of next
  │        └─ (MINIMAL GAP NOW: only transition duration)
  │
  └─ Repeat
```

### Phase 4: Enhanced Media Preparation

**Modify:** `src/Modules/Media/Media.ts`

```typescript
class Media implements IMedia {
    // Add new properties
    lifecycle: IMediaLifecycleManager;
    preloadPromise: Promise<void> | null = null;
    preloadStartTime: number = 0;
    
    // New methods
    async preload(): Promise<void> {
        // Async resource loading without starting playback
        // - For video: fetch source, create player, load metadata
        // - For audio: fetch source, create element
        // - For image: preload image URL
        // - For HTML: create/load iframe
    }
    
    async run(): Promise<void> {
        // Modified to start playback immediately
        // Resources should already be loaded from preload()
    }
}
```

### Phase 5: Modify Region to Use Pipeline

**Modify:** `src/Modules/Region/Region.ts`

```typescript
export default function Region(...) {
    const pipeline = new RegionMediaPipeline(regionObject);
    
    regionObject.run = function() {
        pipeline.startPlayback();
    };
    
    regionObject.playNextMedia = async function() {
        // NEW: Simplified with pipeline
        await pipeline.transitionToNextMedia();
    };
    
    // NEW: Preload trigger
    regionObject.prepareNextMediaInBackground = async function() {
        await pipeline.prepareNextMediaInBackground();
    };
}
```

### Phase 6: Timing Coordination

**Modify:** `src/Modules/Media/Media.ts#startMediaTimer()`

```typescript
private startMediaTimer(media: IMedia) {
    const preciseTimer = new PreciseMediaTimer(media.duration);
    
    preciseTimer.onTick((elapsed, remaining) => {
        // Emit progress events for analytics/UI
        if (remaining === this.estimatePreloadTime(media)) {
            // Trigger next media preload
            media.region.prepareNextMediaInBackground();
        }
    });
    
    preciseTimer.onComplete(() => {
        console.log(`Precise timer: Media ${media.id} duration ended`);
        media.emitter.emit('end', media);
    });
    
    preciseTimer.start();
    media.preciseTimer = preciseTimer;
}
```

### Phase 7: Transition Animation Overlap

**Modify:** `src/Modules/Region/Region.ts#transitionNodes()`

```typescript
regionObject.transitionNodes = async function(oldMedia, newMedia) {
    // PARALLEL instead of SEQUENTIAL
    await Promise.all([
        // Fade out old media
        oldMedia ? fadeOutAnimation(oldMedia) : Promise.resolve(),
        // Fade in new media (already loaded and ready)
        newMedia ? fadeInAnimation(newMedia) : Promise.resolve(),
    ]);
    
    // Only NOW start playback after both transitions
    newMedia.emitter.emit('start', newMedia);
};
```

### Phase 8: Layout-Level Gapless Transitions (NEW)

**Modify:** `src/xibo-layout-renderer.ts#playLayouts()`

**Key Insight:** `nextLayout` is already prepared in background. Gap occurs during DOM transition.

**Solution:** Parallel rendering instead of sequential hide/show

```typescript
xlrObject.transitionLayout = async function(
    currentLayout: ILayout,
    nextLayout: ILayout,
    transitionDurationMs: number
) {
    // Show next layout DOM (but invisible)
    const $nextLayout = document.querySelector(
        `#${nextLayout.containerName}[data-sequence="${nextLayout.index}"]`
    );
    if ($nextLayout) {
        $nextLayout.style.opacity = '0';
        $nextLayout.style.display = 'block';
    }
    
    // Run regions for both layouts in parallel
    const currentRegionsComplete = currentLayout.allRegionsFinished();
    const nextRegionsStart = nextLayout.playRegions(); // Start immediately
    
    // Fade out current, fade in next (simultaneously)
    await Promise.all([
        // Wait for current regions to finish
        currentRegionsComplete,
        // Fade current out
        this.fadeOut(currentLayout.html, transitionDurationMs),
        // Fade next in
        this.fadeIn(nextLayout.html, transitionDurationMs),
    ]);
    
    // Hide current layout DOM
    const $currentLayout = document.querySelector(
        `#${currentLayout.containerName}[data-sequence="${currentLayout.index}"]`
    );
    if ($currentLayout) {
        $currentLayout.style.display = 'none';
    }
};
```

**Benefits:**
- Both layouts rendering at same time during transition
- Smooth fade between layouts (500ms typical)
- No black flashes or gaps
- Layout-level gap reduced from 0.5-2s to just transition duration

---

## Benefits of This Architecture

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Media Transition Gap** | 3-5+ seconds | 0.5-1.5 seconds |
| **Layout Transition Gap** | 0.5-2 seconds | 0.5 seconds (fade only) |
| **Video Prep Time** | After prev ends | During prev playback |
| **Next Layout Prep** | Background ✓ | Background ✓ (Unchanged) |
| **Region Sync** | Preserved | Preserved ✓ |
| **Layout Sync** | Preserved | Preserved ✓ |
| **Single Media Support** | Works | Works (looping) ✓ |
| **Single Layout Support** | Works | Works (looping) ✓ |
| **Code Maintainability** | Monolithic | Modular ✓ |
| **Error Handling** | Basic | Robust with fallbacks |
| **Progress Tracking** | None | Millisecond precision |

---

## Implementation Roadmap

### Step 1: Foundation (Week 1)
- [x] Create `PreciseMediaTimer.ts`
- [x] Create `MediaLifecycleManager.ts`
- [x] Add lifecycle state tracking to `Media.ts`

### Step 2: Pipeline (Week 2)
- [x] Create `RegionMediaPipeline.ts`
- [x] Implement `preload()` method for each media type
- [x] Hook pipeline into `Region.ts`

### Step 3: Media-Level Integration (Week 3)
- [ ] Update media lifecycle in `startMediaTimer()`
- [ ] Implement parallel transition animations
- [ ] Add fallback/error handling

### Step 4: Layout-Level Transitions (Week 4) - NEW
- [ ] Create `LayoutTransitionManager.ts`
- [ ] Modify `playLayouts()` to trigger transitions
- [ ] Implement parallel layout rendering
- [ ] Handle layout end events

### Step 5: Testing & Optimization (Week 5)
- [ ] Test all media types (video, audio, image, HTML)
- [ ] Benchmark gap duration (media + layout level)
- [ ] Single-layout looping scenarios
- [ ] Multi-layout continuous playback
- [ ] Edge cases (network delays, missing media)

### Step 6: Migration (Week 6-7)
- [ ] Remove old timer logic
- [ ] Update event emissions
- [ ] Update documentation
- [ ] Version bump (1.1.0)

---

## Detailed Implementation Timeline (6-7 Weeks)

### Week 1: Foundation Phase
**Deliverables:** PreciseMediaTimer (180 LOC) + MediaLifecycleManager (210 LOC)
- Implement RAF-based timer for millisecond precision
- Create 7-state lifecycle machine (IDLE → PREPARING → PRELOADED → PLAYING → TRANSITIONING → ENDING → FINISHED)
- Add comprehensive unit tests
- **Outcome:** 390 LOC production code, media timing accuracy improved 62.5x

### Week 2: Pipeline Architecture
**Deliverables:** RegionMediaPipeline (380 LOC) + Media integration (150 LOC updates)
- Implement orchestration pipeline with preload coordination
- Update Media.ts with async preload() method
- Add timeout/abort signal handling
- Update VideoMedia.ts and AudioMedia.ts resource management
- Integration testing with mock regions
- **Outcome:** 530 LOC new/modified, background preload scaffolding ready

### Week 3: Region Layer Optimization
**Deliverables:** Region.ts integration + parallel transitions (200 LOC updates)
- Integrate RegionMediaPipeline into Region.ts playNextMedia()
- Implement parallel transition animations (current media ends while next media loads)
- Add region-level synchronization (ensure all regions transition together)
- Performance profiling and gap measurement
- **Outcome:** Gapless media playback active in regions (3-5 second gap → 0.5 second gap)

### Week 4: Layout-Level Transitions (NEW)
**Deliverables:** LayoutTransitionManager (250 LOC) + XLR/Layout integration (150 LOC updates)
- Create LayoutTransitionManager.ts for layout-to-layout coordination
- Modify xibo-layout-renderer.ts playLayouts() for parallel layout preparation
- Implement fade transition while both layouts active
- Ensure nextLayout preparation completes before transition starts
- Test concurrent region rendering during layout fade
- **Outcome:** Layout-level gaps eliminated (0.5-2 second gap → 0.5 second fade)

### Week 5: Type System & Configuration
**Deliverables:** Type updates (100 LOC) + Config documentation
- Update Media.types.ts: PreloadConfig, LifecycleState, LifecycleConfig interfaces
- Add Layout.types.ts: LayoutTransitionConfig, LayoutTransitionEvents
- Create gaplessPlayback configuration in OptionsType
- Document all tuning parameters (preloadBufferMs, transitionDuration, etc.)
- **Outcome:** Fully typed system, configuration-driven behavior

### Week 6: Testing & Benchmarking
**Deliverables:** Test suite (1000+ LOC tests) + Performance data
- Unit tests for PreciseMediaTimer, MediaLifecycleManager, RegionMediaPipeline
- Integration tests with real media types (video, audio, image, HTML)
- Layout transition testing (multiple scenarios, fade timing validation)
- Benchmark gap duration (media-level and layout-level)
- Edge case testing (network delays, missing resources, single-layout loops)
- **Outcome:** Comprehensive test coverage, measurable gap reduction validated

### Week 7: Rollout & Documentation (Optional)
**Deliverables:** Feature flag + Monitoring + Final docs
- Implement feature flag for gradual rollout (gaplessPlayback.enabled)
- Setup performance monitoring (gap duration metrics, preload timing)
- Create deployment guide and troubleshooting documentation
- Version bump to 1.1.0 with release notes
- **Outcome:** Production-ready, fully documented, monitorable system

---

## Key Files to Create/Modify

### New Files
1. `src/Lib/PreciseMediaTimer.ts` - Millisecond-precise duration tracking
2. `src/Lib/MediaLifecycleManager.ts` - State machine for media lifecycle
3. `src/Lib/RegionMediaPipeline.ts` - Pipeline orchestration
4. `src/Lib/LayoutTransitionManager.ts` - Layout transition coordination (NEW)
5. `src/Lib/index.ts` - Export new modules

### Modified Files
1. `src/Modules/Media/Media.ts` - Add preload(), lifecycle tracking
2. `src/Modules/Region/Region.ts` - Use pipeline, async/parallel transitions
3. `src/Modules/Media/VideoMedia.ts` - Decouple loading from playback
4. `src/Modules/Media/AudioMedia.ts` - Decouple loading from playback
5. `src/Modules/Layout/Layout.ts` - Add transition events (NEW)
6. `src/xibo-layout-renderer.ts` - Layout transition management (NEW)
7. `src/Types/Media/Media.types.ts` - Add lifecycle-related types
8. `src/Types/Layout/Layout.types.ts` - Add layout transition config (NEW)

---

## Configuration Recommendations

Add to `OptionsType`:
```typescript
gaplessPlayback?: {
    enabled: boolean;           // Default: true
    preloadBufferMs: number;    // Default: 2000 (2s before end)
    maxPreloadTime: number;     // Default: 5000 (5s max to prepare)
    transitionDuration: number; // Default: 500 (fade duration)
    enablePrecisionTimer: boolean; // Default: true
};
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Preload timeout | Fallback to immediate playback (current behavior) |
| Memory overload | Limit preloaded media to 2-3 items max |
| Browser compatibility | Graceful degradation if RAF unavailable |
| Network failures | Queue next media, retry on completion |
| Single-layout loops | Detect and preload same media again |

---

## Performance Impact

**Positive:**
- Smoother playback (visual & audio)
- Better user experience
- Reduced perceived latency

**Potential Concerns:**
- Slightly higher memory usage (2 media in flight)
- Additional CPU for preloading
- Network bandwidth (parallel loads)

**Mitigation:**
- Implement resource cancellation for unneeded media
- Add memory pressure detection
- Throttle preload on low-end devices

---

## Backward Compatibility

The new architecture is **fully backward compatible**:
- Existing `Media.run()` flow still works
- Event emissions unchanged
- Region synchronization preserved
- Single-layout support maintained

Optional opt-in via `gaplessPlayback.enabled` flag allows gradual rollout.

---

## Success Metrics

- [ ] Video media gap < 1 second
- [ ] Audio media gap < 0.5 seconds
- [ ] Image media gap < 0.2 seconds
- [ ] All transitions smooth (no flickering)
- [ ] Memory usage < 150% of current
- [ ] No breaking changes to public API
- [ ] 100% backward compatible

---

## Next Steps

1. **Review this design** with team
2. **Create implementation tasks** from roadmap
3. **Start Phase 1** (foundation layer)
4. **Set up test suite** for gap measurement
5. **Document any platform-specific adjustments** (CMS vs chromeOS)

