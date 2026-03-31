# Xibo Layout Renderer
This is a npm module for rendering Xibo layouts to a browser window.

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
