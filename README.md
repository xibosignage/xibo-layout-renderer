# Xibo Layout Renderer
This is a npm module for rendering Xibo layouts to a browser window.

## How It Works

### 1. Initialization Flow

```
Consumer calls XiboLayoutRenderer(inputLayouts, overlays, options)
  ├─ bootstrap()         → Sets up DOM (#preview_canvas), splash screen
  ├─ init()              → Calls prepareLayouts()
  │   ├─ parseLayouts()  → Determines current + next layout from schedule loop
  │   ├─ prepareLayoutXlf()  → Fetches XLF XML, parses with DOMParser
  │   └─ new Layout()    → Parses XLF → creates Regions → creates Media objects
  └─ playSchedules()     → Makes current layout visible, runs regions + overlays
```

### 2. Layout Lifecycle

Each layout goes through these states defined in `ELayoutState`:

| State       | Meaning                                    |
|-------------|---------------------------------------------|
| `IDLE`      | Layout created but not yet running          |
| `RUNNING`   | Layout is actively displayed                |
| `PLAYED`    | Layout has finished (all regions expired)   |
| `CANCELLED` | Layout was removed before completing        |
| `ERROR`     | Layout encountered an error                 |

### 3. Region → Media Playback

- A **Layout** contains one or more **Regions** (positioned `<div>` containers)
- Each **Region** contains a playlist of **Media** items (widgets)
- Media items can be: `image`, `video`, `audio`, `html` (iframe-based widgets)
- When a media item's duration expires, the region transitions to the next media
- When all regions have completed their cycle, the layout emits `'end'`, triggering the next layout

### 4. Schedule Loop

The orchestrator (IXlr) maintains a **current** and **next** layout. When the current layout ends:
1. The next layout becomes current
2. A new next layout is prepared from the input schedule
3. This creates a continuous loop of layouts

### 5. Overlay System

OverlayLayoutManager handles layouts that display on top of the main schedule. Overlays are paused during "interrupt" layouts (layouts with `shareOfVoice > 0`).

### 6. Event System

Uses [nanoevents](https://github.com/ai/nanoevents) for a pub/sub event pattern:

| Level   | Events                                           |
|---------|--------------------------------------------------|
| **XLR** | `layoutChange`, `layoutStart`, `layoutEnd`, `layoutError`, `widgetStart`, `widgetEnd`, `updateLoop`, `updateOverlays`, `adRequest`, `overlayStart`, `overlayEnd`, `commandCodeReceived` |
| **Layout** | `start`, `end`, `cancelled`                   |
| **Region** | `start`, `end`                                |
| **Media**  | `start`, `end`                                |

### 7. Platform Abstraction

The library supports multiple platforms via `ConsumerPlatform` enum and the `options.platform` flag:

| Platform    | XLF Source                     | Special Behavior                 |
|-------------|--------------------------------|-----------------------------------|
| `CMS`       | Fetched via URL with JWT       | Preview-only features, "Play again" UI |
| `chromeOS`  | Local file path                | Fault reporting via Service Worker |
| `electron`  | App host + URL                 | Standard playback                 |
| PWA         | Proxy/hosted                   | Service Worker caching            |

## CMS Integration — postMessage Protocol

When XLR is embedded in a sandboxed `<iframe>` (e.g. in CMS Preview), it communicates with the parent frame via `window.parent.postMessage` instead of using browser dialogs that require `allow-modals`.

### Iframe requirements

The iframe must include `allow-scripts` in its `sandbox` attribute. `allow-modals` is **not** required.

```html
<iframe src="..." sandbox="allow-scripts allow-same-origin"></iframe>
```

### Messages sent by XLR

#### `xlr:navLayout`

Fired when a "Navigate to Layout" touch/webhook action is triggered. The parent frame is responsible for showing a confirmation prompt and opening the layout.

```typescript
interface XlrNavLayoutMessage {
  type: 'xlr:navLayout';
  layoutCode: string;  // The layout code from the action
  url: string;         // Pre-constructed preview URL (ready to open)
}
```

**CMS listener example:**

```javascript
window.addEventListener('message', (event) => {
  // In production, validate event.origin against your known CMS origin.
  if (event.data?.type === 'xlr:navLayout') {
    if (confirm(`Navigate to layout with code ${event.data.layoutCode}?`)) {
      window.open(event.data.url, '_blank');
    }
  }
});
```

### Event API (non-iframe consumers)

The same action also emits a `navLayout` event via the XLR event system, usable by consumers that have direct access to the `IXlr` object:

```typescript
xlr.on('navLayout', (layoutCode: string, url: string) => {
  // Show your own confirmation UI and open the URL as needed.
});
```