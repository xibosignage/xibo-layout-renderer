# Code Modification Guide - Quick Start

**For Developers:** Use this document as a quick reference when implementing the gapless playback solution.

---

## 🎯 Understanding Code Markers

When you see any of these in IMPLEMENTATION_GUIDE.md, here's exactly what to do:

### PRESERVE (Do Not Touch)
```
✅ [EXISTING CODE - DO NOT MODIFY]
✅ [EXISTING CODE - ALREADY PRESENT]
```
**Action:** Copy or reference as-is. Do not make changes.  
**Example:** Current IMedia interface properties, existing options

---

### ADD (Extend Existing Code)
```
✅ [ADD TO IMedia INTERFACE]
✅ [ADD IMPORT]
✅ [ADD EXPORT]
✅ [ADD PROPERTY]
```
**Action:** Add these lines to existing files/classes/interfaces.  
**Common Location:** Inside existing class/interface definitions, or at top of file  
**Example:**
```typescript
// Find existing interface
export interface IMedia {
    id: number;
    // ... existing properties ...
    
    // ✅ [ADD TO IMedia INTERFACE] - Insert here
    lifecycle?: IMediaLifecycleManager;
}
```

---

### CREATE (New Code)
```
✅ [NEW FILE]
✅ [NEW METHOD]
```
**Action:** Create entirely new files or add new methods.  
**Location:** 
- NEW FILE → Create in specified directory
- NEW METHOD → Add to existing class (after last existing method)

**Example:**
```typescript
// ✅ [NEW FILE] - Create src/Lib/LayoutTransitionManager.ts
export class LayoutTransitionManager {
    // Entire new class
}

// ✅ [NEW METHOD] - Add to Media class
async preload(options?: {}) {
    // New method implementation
}
```

---

### REPLACE (Change Existing Code)
```
✅ [REPLACE]
```
**Action:** Find OLD code section, delete it, replace with NEW code section.  
**Format:** Both sections are clearly marked as:
```
// OLD CODE (REMOVE):
// ... code to remove ...

// NEW CODE (REPLACE WITH):
// ... code to add ...
```

**Example from Phase 5:**
```typescript
// ✅ [REPLACE] - OLD CODE
const timer = setInterval(() => {
    mediaTime++;
}, 1000);

// ✅ [REPLACE] - NEW CODE
const timer = new PreciseMediaTimer(duration);
timer.onTick((elapsed) => {
    // Handle tick
});
```

---

### UPDATE (Modify Existing Code)
```
✅ [MODIFY]
✅ [LOCATE]
```
**Action:** Find and update specific methods/properties  
**Difference from REPLACE:**
- REPLACE: Entire code block swapped
- MODIFY: Small updates to existing logic

**Example:**
```typescript
// ✅ [MODIFY] - Update regionEnded()
const originalRegionEnded = layoutObject.regionEnded;
layoutObject.regionEnded = function(region) {
    originalRegionEnded.call(this, region);  // Keep original logic
    
    // ✅ [MODIFY] - Add new logic here
    if (allRegionsDone) {
        layoutObject.emitter.emit('end', layoutObject);
    }
};
```

---

## 📋 Phase-by-Phase Quick Guide

### Phase 2: Media Integration
| Task | Marker | Files |
|------|--------|-------|
| Add properties to Media class | ADD PROPERTY | Media.ts |
| Create preload() methods | NEW METHOD | Media.ts, VideoMedia.ts, AudioMedia.ts |
| Update Media.run() | MODIFY | Media.ts |
| Update startMediaTimer() | REPLACE | Media.ts |
| Add type properties | ADD TO | Media.types.ts |

**Key Rule:** Preload methods should load resources WITHOUT playing them.

### Phase 3: Region Integration
| Task | Marker | Files |
|------|--------|-------|
| Add pipeline to region | ADD PROPERTY | Region.ts |
| Update prepareMediaObjects() | MODIFY | Region.ts |
| Create preload trigger | REPLACE | Media.ts (startMediaTimer) |
| Update playNextMedia() | MODIFY | Region.ts |

**Key Rule:** Pipeline handles all transitions. Region just orchestrates.

### Phase 4: Type Definitions
| Task | Marker | Files |
|------|--------|-------|
| Add media lifecycle types | ADD TO | Media.types.ts |
| Create transition config | NEW | Layout.types.ts |
| Create transition events | NEW | Layout.types.ts |
| Add transition manager type | ADD PROPERTY | Layout.types.ts |

**Key Rule:** All types must be fully documented with JSDoc.

### Phase 5: Layout Transitions (NEW)
| Task | Marker | Files |
|------|--------|-------|
| Create LayoutTransitionManager | NEW FILE | Lib/LayoutTransitionManager.ts |
| Export from lib | ADD EXPORT | Lib/index.ts |
| Add to Layout initialization | ADD PROPERTY | Layout.ts |
| Update regionEnded() | MODIFY | Layout.ts |
| Update playLayouts() | REPLACE | xibo-layout-renderer.ts |

**Key Rule:** Parallel rendering - nextLayout starts BEFORE currentLayout ends.

### Phase 6: Testing
| Task | Marker | Files |
|------|--------|-------|
| Create test structure | NEW FILE | tests/*.test.ts |
| Write test cases | NEW METHOD | All test files |

**Key Rule:** Test both success and failure paths.

### Phase 7: Rollout
| Task | Marker | Files |
|------|--------|-------|
| Add feature flag | ADD TO | OptionsType |
| Add monitoring | MODIFY | playLayouts(), Layout.ts |
| Update docs | Documentation | All .md files |

**Key Rule:** Backward compatible - old code path must still work.

---

## ⚠️ Common Mistakes to Avoid

### ❌ Mistake 1: Modifying Existing Code When You Should ADD

**Wrong:**
```typescript
// ❌ Trying to modify when should ADD
export interface IMedia {
    id: number;
    preload() // <- Trying to add to interface
}
```

**Right:**
```typescript
// ✅ ADD TO existing interface
export interface IMedia {
    // ... existing properties ...
    
    // ✅ [ADD TO IMedia INTERFACE]
    preload?(options?: PreloadOptions): Promise<void>;
}
```

### ❌ Mistake 2: Removing Code Marked as PRESERVE

**Wrong:**
```typescript
// ❌ DO NOT remove existing implementation
export interface IRegion {
    pipeline: RegionMediaPipeline;  // ← Already exists, don't touch
}
```

**Right:**
```typescript
// ✅ Recognize it already exists
export interface IRegion {
    // ... existing properties ...
    
    // ✅ [EXISTING CODE - ALREADY PRESENT]
    pipeline: RegionMediaPipeline;
}
```

### ❌ Mistake 3: Not Understanding REPLACE vs MODIFY

**REPLACE (entire code block changes):**
```typescript
// OLD CODE (REMOVE ALL):
const timer = setInterval(() => { count++; }, 1000);

// NEW CODE (REPLACE ENTIRE SECTION):
const timer = new PreciseMediaTimer(duration);
timer.onTick((e) => {});
```

**MODIFY (keep structure, update logic):**
```typescript
// Keep existing method signature
function playNextMedia() {
    // Keep existing code that calls transitionNodes
    this.transitionNodes(oldMedia, newMedia);
    
    // ✅ [MODIFY] - Add new logic
    this.pipeline.prepareNext();
}
```

### ❌ Mistake 4: Not Maintaining TypeScript Strict Mode

**Wrong:**
```typescript
// ❌ Using 'any' type
const lifecycleManager: any = new MediaLifecycleManager();
```

**Right:**
```typescript
// ✅ Proper typing
const lifecycleManager: IMediaLifecycleManager = new MediaLifecycleManager();
```

### ❌ Mistake 5: Changing Method Signatures

**Wrong:**
```typescript
// ❌ Don't change existing method signature
async preload() {
    // Changed from: async preload(options?: PreloadOptions)
}
```

**Right:**
```typescript
// ✅ Keep existing signature intact
async preload(options?: PreloadOptions): Promise<void> {
    // Implementation with new features
}
```

---

## ✅ How to Know You're Doing It Right

### Code Structure Checks
- [ ] All imports are at top of file
- [ ] Classes/interfaces maintain their original order
- [ ] New methods are added after existing methods
- [ ] No code marked `[EXISTING - DO NOT MODIFY]` has been changed
- [ ] All changes follow the markers exactly

### Type Safety Checks
- [ ] TypeScript `strict` mode still enabled
- [ ] No `any` types used
- [ ] All interfaces fully documented with JSDoc
- [ ] Method signatures unchanged for public APIs

### Test Checks
- [ ] Code compiles without errors
- [ ] No type errors in IDE
- [ ] All new methods have implementations
- [ ] Existing functionality still works

---

## 🔍 Verification Checklist

After each phase, verify:

### Phase 2 Complete?
- [ ] Media.ts compiles without errors
- [ ] preload() methods return Promise<void>
- [ ] startMediaTimer() uses PreciseMediaTimer
- [ ] Tests for preload() pass

### Phase 3 Complete?
- [ ] Region.ts compiles without errors
- [ ] pipeline property initialized
- [ ] playNextMedia() calls pipeline methods
- [ ] Preload triggers at correct time

### Phase 4 Complete?
- [ ] Types compile without errors
- [ ] All interfaces have JSDoc comments
- [ ] No circular dependencies
- [ ] Import paths are correct

### Phase 5 Complete?
- [ ] LayoutTransitionManager.ts created (280 LOC)
- [ ] Layout.ts modified and compiles
- [ ] xibo-layout-renderer.ts playLayouts() updated
- [ ] Parallel fade transition works

### Phase 6 Complete?
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Gap measurements < 0.5s
- [ ] Memory usage stable

### Phase 7 Complete?
- [ ] Feature flag works
- [ ] Monitoring captures metrics
- [ ] Documentation updated
- [ ] Version bumped

---

## 📞 Need Help?

**Question:** "Where do I find the code to modify?"  
**Answer:** Use `Ctrl+F` (Find) in your editor with the exact section name from IMPLEMENTATION_GUIDE.md

**Question:** "Can I skip a phase?"  
**Answer:** No. Phases must be done in order (1→7). Phase 4 and Phase 5 can be done in parallel.

**Question:** "What if I make a mistake?"  
**Answer:** 
1. Undo the changes (Ctrl+Z or git checkout)
2. Re-read the code marker instructions
3. Try again carefully
4. If stuck, check the "Before/After" examples in guide

**Question:** "How do I know if my code is correct?"  
**Answer:** If it compiles without errors AND all tests pass, you're good!

---

**Document Version:** 1.0  
**Last Updated:** January 30, 2026  
**Purpose:** Quick reference for code modification markers and implementation guidance
