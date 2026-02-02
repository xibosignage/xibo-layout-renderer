# Gapless Playback Architecture Reference

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        XLR (Xibo Layout Renderer)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
        ┌───────────▼─────────────┐    ┌──────────▼──────────┐
        │   Layout Module         │    │  Region Module      │
        │                         │    │                     │
        │ • Manages structure     │    │ • Multiple media    │
        │ • Runs regions sync     │    │ • Sync playback    │
        └────────────┬────────────┘    └──────────┬──────────┘
                     │                            │
                     └────────────┬───────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │    Region Media Pipeline   │  ◄─── NEW
                    │                            │
                    │ • Current/Next media mgmt  │
                    │ • Preload coordination     │
                    │ • Transition orchestration │
                    └─────────────┬──────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
        ┌───────▼────────┐  ┌────▼──────────┐  ┌──▼───────────────┐
        │   Media Module │  │   Lifecycle   │  │  Precise Timer   │
        │                │  │   Manager     │  │                  │
        │ • Render types │  │               │  │ • RAF-based      │
        │ • Playback     │  │ IDLE →        │  │ • <16ms precision│
        │ • Lifecycle    │  │ PREPARING →   │  │ • Tick events    │
        │ • Preload()    │  │ PRELOADED →   │  │ • Complete event │
        │ • run()        │  │ PLAYING →     │  └──────────────────┘
        │                │  │ ENDING →      │
        │ Types:         │  │ FINISHED      │
        │ • Video        │  │               │
        │ • Audio        │  │ (State        │
        │ • Image        │  │  machine)     │
        │ • HTML         │  │               │
        └────────────────┘  └───────────────┘
```

## Media Lifecycle State Machine

```
                    ┌─────────────┐
                    │    IDLE     │
                    │ Not prepared│
                    └──────┬──────┘
                           │
                ┌──────────┴──────────┐
                │                     │
         [preload]            [direct play]
                │                     │
      ┌─────────▼─────────┐          │
      │   PREPARING       │          │
      │ Loading resources │          │
      │ • Fetch media     │          │
      │ • Create players  │          │
      │ • Buffer data     │          │
      └──────────┬────────┘          │
                 │                   │
         ┌───────▼───────┐           │
         │ PRELOADED     │           │
         │ Ready to play │◄──────────┤
         │ Not playing   │           │
         └───────┬───────┘           │
                 │                   │
    ┌────────────┴───────────────┐   │
    │                            │   │
    │[play]           [play]     │   │
    │                            │   │
 ┌──▼────────────┐     ┌─────────▼──▼──┐
 │    PLAYING    │     │   PLAYING      │
 │ Rendering now │     │ Direct play    │
 └──┬──────┬─────┘     │ (w/o preload)  │
    │      │           └────┬──────┬────┘
    │      │                │      │
    │    [end or            │      │
    │     transition]        │      │
    │      │                │      │
    │  ┌───▼───────┐        │      │
    │  │TRANSITIONING◄──────┘      │
    │  │ In/Out anim│              │
    │  └────┬──────┘               │
    │       │[transition_end]      │
    │       │                      │[end]
    │   ┌───▼──────┐        ┌──────▼────┐
    │   │ ENDING   │        │  ENDING   │
    │   │ End anim │        │ End anim  │
    │   └───┬──────┘        └────┬──────┘
    │       │                    │
    └─────┬─┴────────────────────┘
          │
    ┌─────▼────────┐
    │   FINISHED   │
    │ Done playing │
    └──────┬───────┘
           │
      [reset/loop]
           │
    ┌──────▼────────┐
    │     IDLE      │
    │  (for next    │
    │   cycle)      │
    └───────────────┘
```

## Timeline: Gapless Playback Flow

### Current (Non-Gapless) Timeline
```
Time  Event                          Gap
────────────────────────────────────────────────────────────────
0     Video A starts                ▓
      Video A (duration 10s)        ▓
                                    ▓
10s   Video A ends event            ▓
      region.playNextMedia() called ▓ GAP START
      ↓                             ▓
12s   transitionNodes() called      ▓
      hideOldMedia animation        ▓
                                    ▓
13s   hideOldMedia completes        ▓
      Video B.run() called          ▓ (>3 seconds)
      ↓                             ▓
15s   Video B network fetch starts  ▓
16s   Video B codec loaded          ▓
      Video B canplay event         ▓
      Video B starts playing        ▓ GAP END
```

### Proposed (Gapless) Timeline
```
Time  Event                          Gap
────────────────────────────────────────────────────────────────
0     Video A starts                
      Video B scheduled for preload
                                    
8s    Video B preload trigger       
      preloadMediaResources() starts
      ↓ (background)                
                                    
10.5s Video B preload completes     
      Video B fully loaded & ready  
                                    
10s   Video A ends event            ▓
      region.playNextMedia() called ▓ GAP START
      ↓                             ▓
10.2s hideOldMedia animation        ▓
      showNewMedia animation        ▓
      (parallel, ~200ms)            ▓
                                    ▓
10.4s Animations complete           ▓
      Video B.run() called          ▓ (~400ms)
      (player already loaded!)      ▓
      Video B starts playing        ▓ GAP END
```

**Gap Reduction:** 3000ms → 400ms (87% improvement)

## Data Flow: Preload-While-Playing

```
STEP 1: Media Starts Playing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Region.run()
  ├─ prepareMediaObjects()
  │  └─ Set currentMedia & nextMedia
  │
  ├─ Media.run()
  │  ├─ Set lifecycle: PLAYING
  │  ├─ startMediaTimer(duration)
  │  │  └─ Create PreciseMediaTimer
  │  │     └─ Register onTick & onComplete callbacks
  │  │
  │  └─ Start rendering (video.js play, etc.)


STEP 2: Media Playing (Background Preload Scheduled)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[During media playback...]

Timer ticks every ~16ms:
  onTick(elapsed, remaining)
    ├─ Check if should start preload
    │  └─ remaining ≤ (preloadBufferMs + estimatePreloadTime)
    │
    └─ If yes: trigger preload
       │
       └─ pipeline.onCurrentMediaWillEnd(remaining)
          │
          └─ pipeline.prepareNextMediaInBackground()
             │
             └─ preloadMediaResources(nextMedia)
                ├─ Set lifecycle: PREPARING
                ├─ For video:
                │  ├─ Create video.js player
                │  ├─ Set source
                │  ├─ Wait for 'canplay'
                │  └─ Set lifecycle: PRELOADED
                │
                └─ For audio/image/html: similar


STEP 3: Current Media Ends (Smooth Transition)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Timer onComplete() fired:
  │
  └─ media.emitter.emit('end', media)
     │
     └─ region.playNextMedia()
        │
        ├─ Set lifecycle: TRANSITIONING
        │
        ├─ Parallel animations:
        │  ├─ fadeOut(currentMedia) ~500ms
        │  └─ fadeIn(nextMedia)    ~500ms
        │
        ├─ Wait for both animations
        │
        ├─ Set lifecycle: PLAYING
        │
        └─ nextMedia.run()
           ├─ Start rendering
           └─ Video.js play() (player ready!)


STEP 4: Next Media Plays (Loop)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
nextMedia.emitter.emit('start', nextMedia)
  │
  ├─ Analytics/metrics emitted
  │
  └─ Timer for nextMedia created
     └─ [Back to STEP 2...]
```

## Component Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    Media                                    │
│  • Owns lifecycle manager                                   │
│  • Implements preload()                                     │
│  • Creates precise timer                                    │
└────────────────────┬────────────────────────────────────────┘
                     │ owns
                     ▼
        ┌────────────────────────┐
        │ MediaLifecycleManager  │
        │ • State machine        │
        │ • Progress tracking    │
        └────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Region                                    │
│  • Owns pipeline                                            │
│  • Manages region media collection                          │
└────────────────────┬────────────────────────────────────────┘
                     │ owns
                     ▼
    ┌────────────────────────────────┐
    │  RegionMediaPipeline           │
    │ • Orchestrates preload         │
    │ • Handles transitions          │
    │ • Manages current/next media   │
    └──┬──────────────────┬──────────┘
       │ calls            │ calls
       │                  │
    ┌──▼──────┐    ┌──────▼─────────┐
    │ Media   │    │ Media          │
    │preload()│    │transitionNodes()
    │         │    │                │
    └────────┘    │                │
                  │ uses          │
                  │  ┌────────────▼────────┐
                  │  │PreciseMediaTimer    │
                  │  │• Millisecond timing │
                  │  │• RAF-based ticks    │
                  │  └─────────────────────┘
                  │
                  └─ Parallel animations
                     └─ Web Animations API
```

## Key Design Decisions

### 1. **Separate Preload from Run**
- **Why:** Allows preparing media while current plays
- **How:** `media.preload()` vs `media.run()`
- **Benefit:** No blocking on network I/O

### 2. **RAF-Based Precise Timer**
- **Why:** 1-second intervals too coarse for preload triggers
- **How:** `requestAnimationFrame` for <16ms precision
- **Benefit:** Accurate preload trigger timing

### 3. **State Machine for Lifecycle**
- **Why:** Clear ownership of preparation phases
- **How:** IDLE → PREPARING → PRELOADED → PLAYING
- **Benefit:** Prevents invalid state transitions, trackable progress

### 4. **Pipeline Orchestration**
- **Why:** Central place for transition logic
- **How:** Region owns pipeline, pipeline manages media
- **Benefit:** Decoupled from Region/Media internals

### 5. **Configurable Preload Buffer**
- **Why:** Different media types need different prep time
- **How:** `preloadBufferMs` option per-region
- **Benefit:** Tunable, not hardcoded

## Backward Compatibility

The new system is **fully backward compatible**:

1. **Existing Media.run() Still Works**
   - If media skipped preload, run() prepares synchronously
   - Graceful fallback if preload times out

2. **Region Synchronization Maintained**
   - Region playback still synchronous
   - Only media loading is async

3. **Single-Layout Loops Supported**
   - Preload same media again after completion
   - Seamless loop achieved

4. **All Media Types Supported**
   - Video, Audio, Image, HTML all have preload()
   - Fallback for unknown types

5. **Optional Feature Flag**
   ```typescript
   options.gaplessPlayback?.enabled = true/false
   ```

## Performance Characteristics

### Memory
- **Per Region:** 2 media in memory (current + next preloaded)
- **Peak:** 2-3 video.js player instances max
- **Typical:** < 150MB overhead vs current

### CPU
- **Preload Phase:** Network I/O + codec initialization
- **Playback Phase:** Normal playback, no extra work
- **Overhead:** Minimal, mostly OS-level

### Network
- **Parallel Loads:** Preload starts 2-3s before next media needed
- **Timing:** Uses available bandwidth, doesn't create new bandwidth
- **Fallback:** If network slow, graceful degrade to immediate playback

### Browser Compatibility
- **RAF:** All modern browsers (IE11+ if polyfilled)
- **Abort Signal:** Chrome 66+, Firefox 57+, Safari 11.1+
- **Fallback:** Still works without, just no cancellation

## Testing Strategy

```
Unit Tests (PreciseMediaTimer, MediaLifecycleManager, Pipeline)
    ↓
Integration Tests (Full media cycle with gap measurement)
    ↓
Performance Tests (Memory, CPU, network during playback)
    ↓
Manual Tests (Visual inspection, multiple platforms)
    ↓
Regression Tests (Existing functionality still works)
```

## Success Metrics

- [x] Architecture design complete
- [x] Core modules implemented
- [ ] Media integration (Phase 2)
- [ ] Region integration (Phase 3)
- [ ] Types updated (Phase 4)
- [ ] Full test suite (Phase 5)
- [ ] < 1s gap for video transitions
- [ ] < 0.5s gap for audio transitions
- [ ] No breaking API changes
- [ ] Backward compatible with 100% coverage

