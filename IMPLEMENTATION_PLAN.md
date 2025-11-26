# Semitile Implementation Plan

**Web-Based Tile and Tilemap Editor for Cicada-16**

## Project Overview

Semitile is a focused, web-based tool for creating graphics for the Cicada-16 fantasy console system. It will be hosted on the future semikit website and provide an accessible entry point for users to create tiles, palettes, and tilemaps without requiring any installation.

This tool complements the future semikit-studio desktop IDE by providing a lightweight, browser-based option for quick edits and learning.

### Design Philosophy

The UI is designed as a **modular, reusable component system** that can:

- Run standalone as a complete web application
- Be integrated into the future semikit website (potentially React-based)
- Share visual elements and design tokens across the ecosystem

## Architecture

### Tech Stack

- **Rust + WASM** for core logic (tile conversion, planar encoding, palette handling)
- **MVC Architecture** with clear separation of concerns:
  - **Models**: Observable state containers with WASM integration
  - **Views**: Web Components for UI (framework-agnostic, reusable)
  - **Controllers**: Coordinate between Models and Views
- **Canvas API** for pixel-perfect tile editing
- **IndexedDB** for project persistence
- **CSS Custom Properties** for shared design tokens

### Project Structure

```
semitile/
├── Cargo.toml                           # Rust workspace
├── semitile_core/                       # Pure Rust logic (WASM target)
│   ├── src/
│   │   ├── lib.rs
│   │   ├── tile.rs                     # Tile data structures
│   │   ├── planar.rs                   # 4bpp planar encoding/decoding
│   │   ├── palette.rs                  # RGB555 color handling
│   │   ├── tilemap.rs                  # Tilemap structures
│   │   └── export.rs                   # Binary export formats
│   └── Cargo.toml
├── web/                                 # WASM bindings
│   ├── src/
│   │   └── lib.rs                      # WASM public API
│   └── Cargo.toml
└── ui/                                  # UI components (framework-agnostic)
    ├── package.json
    ├── vite.config.js                   # Build configuration
    ├── src/
    │   ├── models/                      # MODEL LAYER - Observable state
    │   │   ├── EventEmitter.ts         # Base event emitter class
    │   │   ├── TileModel.ts            # Tile state + WASM integration
    │   │   ├── PaletteModel.ts         # Palette state + WASM integration
    │   │   ├── TilemapModel.ts         # Tilemap state + WASM integration
    │   │   ├── EditorState.ts          # Global editor state (tool, zoom, etc.)
    │   │   └── CommandHistory.ts       # Undo/redo command stack
    │   ├── views/                       # VIEW LAYER - Web Components
    │   │   ├── TileCanvas/
    │   │   │   ├── TileCanvas.ts       # Pure view component
    │   │   │   ├── TileCanvas.css      # Component styles
    │   │   │   └── index.ts            # Component exports
    │   │   ├── PaletteEditor/
    │   │   │   ├── PaletteEditor.ts
    │   │   │   ├── PaletteEditor.css
    │   │   │   └── index.ts
    │   │   ├── ColorPicker/
    │   │   │   ├── ColorPicker.ts      # RGB555 color picker
    │   │   │   ├── ColorPicker.css
    │   │   │   └── index.ts
    │   │   ├── TilemapEditor/
    │   │   │   ├── TilemapEditor.ts
    │   │   │   ├── TilemapEditor.css
    │   │   │   └── index.ts
    │   │   └── ToolPanel/
    │   │       ├── ToolPanel.ts
    │   │       ├── ToolPanel.css
    │   │       └── index.ts
    │   ├── controllers/                 # CONTROLLER LAYER - Business logic
    │   │   ├── TileEditorController.ts # Tile editing coordination
    │   │   ├── PaletteController.ts    # Palette editing coordination
    │   │   ├── TilemapController.ts    # Tilemap editing coordination
    │   │   └── FileController.ts       # File operations coordination
    │   ├── lib/                         # Utilities
    │   │   ├── wasm-loader.ts          # WASM initialization
    │   │   ├── CanvasRenderer.ts       # Canvas rendering utilities
    │   │   ├── ExportManager.ts        # Export logic
    │   │   └── storage.ts              # IndexedDB wrapper
    │   ├── styles/                      # Shared styles
    │   │   ├── tokens.css              # CSS custom properties
    │   │   ├── reset.css               # CSS reset
    │   │   └── common.css              # Shared component styles
    │   ├── standalone/                  # Standalone web app
    │   │   ├── index.html
    │   │   ├── app.ts                  # Main app logic (vanilla TypeScript)
    │   │   └── styles.css              # App-specific styles
    │   └── react/                       # React wrappers (future)
    │       ├── TileCanvasReact.tsx
    │       ├── PaletteEditorReact.tsx
    │       ├── ColorPickerReact.tsx
    │       ├── TilemapEditorReact.tsx
    │       ├── ToolPanelReact.tsx
    │       └── index.ts                # Export all React components
    └── dist/                            # Build output
```

## Component Architecture

### MVC Architecture with Observable Models

**Model Layer (Observable State):**

- Contains application state and wraps WASM functionality
- Emits events when state changes (Observer pattern)
- Single source of truth for all data
- Supports undo/redo through command history
- Examples: `TileModel`, `PaletteModel`, `EditorState`

**View Layer (Web Components):**

- Pure presentation components with no business logic
- Listen to Model events and re-render when state changes
- Dispatch user interaction events to Controllers
- Framework-agnostic (works in vanilla JS, React, Vue, etc.)
- Encapsulated styling with Shadow DOM
- Examples: `TileCanvas`, `PaletteEditor`, `ColorPicker`

**Controller Layer (Business Logic):**

- Mediates between Views and Models
- Handles user interaction events from Views
- Updates Models based on user actions
- Coordinates updates across multiple Views
- Contains tool logic, validation, and business rules
- Examples: `TileEditorController`, `PaletteController`

### MVC Architecture Examples

#### Model Layer: EventEmitter Base Class

```typescript
// ui/src/models/EventEmitter.ts
export class EventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}
```

#### Model Layer: TileModel

```typescript
// ui/src/models/TileModel.ts
import { EventEmitter } from './EventEmitter.js';
import type { Tile } from '../../wasm/semitile_web.js';

export class TileModel extends EventEmitter {
  private tile: Tile;
  private activeTileIndex: number = 0;

  constructor(wasmTile: Tile) {
    super();
    this.tile = wasmTile;
  }

  // Getters
  getPixel(x: number, y: number): number {
    return this.tile.get_pixel(x, y);
  }

  // Setters that emit events
  setPixel(x: number, y: number, colorIndex: number): void {
    this.tile.set_pixel(x, y, colorIndex);
    this.emit('pixelChanged', { x, y, colorIndex });
  }

  // Import/Export
  importPlanar(data: Uint8Array): void {
    this.tile = Tile.from_planar(data);
    this.emit('tileImported');
  }

  exportPlanar(): Uint8Array {
    return this.tile.to_planar();
  }

  clear(): void {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        this.tile.set_pixel(x, y, 0);
      }
    }
    this.emit('tileCleared');
  }
}
```

#### Model Layer: PaletteModel

```typescript
// ui/src/models/PaletteModel.ts
import { EventEmitter } from './EventEmitter.js';
import type { Palette, Color } from '../../wasm/semitile_web.js';

export class PaletteModel extends EventEmitter {
  private palette: Palette;
  private activeSubPalette: number = 0;
  private selectedColorIndex: number = 1; // 0 is transparent

  constructor(wasmPalette: Palette) {
    super();
    this.palette = wasmPalette;
  }

  // Getters
  getColor(paletteIdx: number, colorIdx: number): { r: number; g: number; b: number } {
    const color = this.palette.get_color(paletteIdx, colorIdx);
    const [r, g, b] = color.to_rgb888();
    return { r, g, b };
  }

  getActiveSubPalette(): number {
    return this.activeSubPalette;
  }

  getSelectedColorIndex(): number {
    return this.selectedColorIndex;
  }

  // Setters that emit events
  setColor(paletteIdx: number, colorIdx: number, r: number, g: number, b: number): void {
    const color = Color.from_rgb888(r, g, b);
    this.palette.set_color(paletteIdx, colorIdx, color);
    this.emit('colorChanged', { paletteIdx, colorIdx, r, g, b });
  }

  setActiveSubPalette(index: number): void {
    this.activeSubPalette = index;
    this.emit('subPaletteChanged', { index });
  }

  selectColor(colorIndex: number): void {
    this.selectedColorIndex = colorIndex;
    this.emit('colorSelected', { colorIndex });
  }

  // Import/Export
  importBinary(data: Uint8Array): boolean {
    const imported = Palette.import_binary(data);
    if (imported) {
      this.palette = imported;
      this.emit('paletteImported');
      return true;
    }
    return false;
  }

  exportBinary(): Uint8Array {
    return this.palette.export_binary();
  }
}
```

#### Model Layer: EditorState

```typescript
// ui/src/models/EditorState.ts
import { EventEmitter } from './EventEmitter.js';

export enum Tool {
  Pencil = 'pencil',
  Fill = 'fill',
  Line = 'line',
  Rectangle = 'rectangle',
}

export class EditorState extends EventEmitter {
  private currentTool: Tool = Tool.Pencil;
  private zoom: number = 16;
  private gridEnabled: boolean = true;

  // Tool management
  setTool(tool: Tool): void {
    this.currentTool = tool;
    this.emit('toolChanged', { tool });
  }

  getTool(): Tool {
    return this.currentTool;
  }

  // Zoom management
  setZoom(zoom: number): void {
    this.zoom = Math.max(1, Math.min(32, zoom));
    this.emit('zoomChanged', { zoom: this.zoom });
  }

  getZoom(): number {
    return this.zoom;
  }

  // Grid toggle
  setGridEnabled(enabled: boolean): void {
    this.gridEnabled = enabled;
    this.emit('gridToggled', { enabled });
  }

  isGridEnabled(): boolean {
    return this.gridEnabled;
  }
}
```

#### View Layer: TileCanvas (Pure View)

```typescript
// ui/src/views/TileCanvas/TileCanvas.ts
import type { TileModel } from '../../models/TileModel.js';
import type { PaletteModel } from '../../models/PaletteModel.js';
import type { EditorState } from '../../models/EditorState.js';

class TileCanvas extends HTMLElement {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tileModel: TileModel | null = null;
  private paletteModel: PaletteModel | null = null;
  private editorState: EditorState | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupCanvas();
    this.attachEventListeners();
  }

  disconnectedCallback() {
    // Clean up model listeners
    if (this.tileModel) {
      this.tileModel.off('pixelChanged', this.handleModelChange);
      this.tileModel.off('tileImported', this.handleModelChange);
      this.tileModel.off('tileCleared', this.handleModelChange);
    }
    if (this.paletteModel) {
      this.paletteModel.off('colorChanged', this.handleModelChange);
      this.paletteModel.off('paletteImported', this.handleModelChange);
    }
    if (this.editorState) {
      this.editorState.off('zoomChanged', this.handleStateChange);
      this.editorState.off('gridToggled', this.handleStateChange);
    }
  }

  // Inject dependencies (called by controller)
  setModels(tileModel: TileModel, paletteModel: PaletteModel, editorState: EditorState): void {
    this.tileModel = tileModel;
    this.paletteModel = paletteModel;
    this.editorState = editorState;

    // Listen to model changes
    this.tileModel.on('pixelChanged', this.handleModelChange);
    this.tileModel.on('tileImported', this.handleModelChange);
    this.tileModel.on('tileCleared', this.handleModelChange);
    this.paletteModel.on('colorChanged', this.handleModelChange);
    this.paletteModel.on('paletteImported', this.handleModelChange);
    this.editorState.on('zoomChanged', this.handleStateChange);
    this.editorState.on('gridToggled', this.handleStateChange);

    this.redraw();
  }

  private handleModelChange = () => {
    this.redraw();
  };

  private handleStateChange = () => {
    this.redraw();
  };

  render() {
    this.shadowRoot!.innerHTML = `
      <link rel="stylesheet" href="./TileCanvas.css">
      <div class="tile-canvas-container">
        <canvas id="canvas" width="128" height="128"></canvas>
      </div>
    `;
  }

  setupCanvas() {
    this.canvas = this.shadowRoot!.getElementById("canvas") as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d", { alpha: false })!;
  }

  // Pure rendering - no business logic
  redraw() {
    if (!this.tileModel || !this.paletteModel || !this.editorState) return;

    const zoom = this.editorState.getZoom();
    const activePalette = this.paletteModel.getActiveSubPalette();

    this.canvas.width = 8 * zoom;
    this.canvas.height = 8 * zoom;

    // Render pixels
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const colorIdx = this.tileModel.getPixel(x, y);
        const { r, g, b } = this.paletteModel.getColor(activePalette, colorIdx);
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }

    // Draw grid if enabled
    if (this.editorState.isGridEnabled()) {
      this.drawGrid(zoom);
    }
  }

  drawGrid(zoom: number) {
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const pos = i * zoom;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, 8 * zoom);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(8 * zoom, pos);
      this.ctx.stroke();
    }
  }

  attachEventListeners() {
    this.canvas.addEventListener("mousedown", (e) => {
      this.dispatchInteractionEvent('draw-start', e);
    });

    this.canvas.addEventListener("mousemove", (e) => {
      this.dispatchInteractionEvent('draw-move', e);
    });

    this.canvas.addEventListener("mouseup", (e) => {
      this.dispatchInteractionEvent('draw-end', e);
    });
  }

  // Dispatch events to controller - no direct model modification
  private dispatchInteractionEvent(type: string, e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const zoom = this.editorState?.getZoom() || 16;
    const x = Math.floor((e.clientX - rect.left) / zoom);
    const y = Math.floor((e.clientY - rect.top) / zoom);

    if (x >= 0 && x < 8 && y >= 0 && y < 8) {
      this.dispatchEvent(new CustomEvent(type, {
        detail: { x, y },
        bubbles: true,
        composed: true,
      }));
    }
  }
}

customElements.define("tile-canvas", TileCanvas);
export default TileCanvas;
```

#### Controller Layer: TileEditorController

```typescript
// ui/src/controllers/TileEditorController.ts
import { TileModel } from '../models/TileModel.js';
import { PaletteModel } from '../models/PaletteModel.js';
import { EditorState, Tool } from '../models/EditorState.js';
import type TileCanvas from '../views/TileCanvas/TileCanvas.js';

export class TileEditorController {
  private isDrawing: boolean = false;

  constructor(
    private tileModel: TileModel,
    private paletteModel: PaletteModel,
    private editorState: EditorState,
    private view: TileCanvas
  ) {
    this.setupView();
    this.attachViewListeners();
  }

  private setupView() {
    // Inject models into view
    this.view.setModels(this.tileModel, this.paletteModel, this.editorState);
  }

  private attachViewListeners() {
    this.view.addEventListener('draw-start', (e: CustomEvent) => {
      this.isDrawing = true;
      this.handleDraw(e.detail.x, e.detail.y);
    });

    this.view.addEventListener('draw-move', (e: CustomEvent) => {
      if (this.isDrawing) {
        this.handleDraw(e.detail.x, e.detail.y);
      }
    });

    this.view.addEventListener('draw-end', () => {
      this.isDrawing = false;
    });
  }

  // Business logic: handle drawing based on active tool
  private handleDraw(x: number, y: number) {
    const tool = this.editorState.getTool();
    const colorIndex = this.paletteModel.getSelectedColorIndex();

    switch (tool) {
      case Tool.Pencil:
        this.tileModel.setPixel(x, y, colorIndex);
        break;
      case Tool.Fill:
        this.floodFill(x, y, colorIndex);
        break;
      // Other tools handled similarly
    }
  }

  private floodFill(startX: number, startY: number, newColor: number) {
    const targetColor = this.tileModel.getPixel(startX, startY);
    if (targetColor === newColor) return;

    const stack: [number, number][] = [[startX, startY]];

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;

      if (x < 0 || x >= 8 || y < 0 || y >= 8) continue;
      if (this.tileModel.getPixel(x, y) !== targetColor) continue;

      this.tileModel.setPixel(x, y, newColor);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  // Public methods for external control
  clear() {
    this.tileModel.clear();
  }

  undo() {
    // Integrate with CommandHistory
  }

  redo() {
    // Integrate with CommandHistory
  }
}
```

### Usage in Standalone App (Vanilla JS)

```html
<!-- ui/src/standalone/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Semitile - Cicada-16 Tile Editor</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="app">
      <header class="app-header">
        <h1>semitile</h1>
        <nav class="app-nav">
          <button id="new-file">New</button>
          <button id="open-file">Open</button>
          <button id="save-file">Save</button>
          <button id="export">Export</button>
        </nav>
      </header>

      <main class="editor-layout">
        <aside class="palette-panel">
          <palette-editor id="palette"></palette-editor>
          <color-picker id="color-picker"></color-picker>
        </aside>

        <section class="canvas-panel">
          <tile-canvas
            id="tile-canvas"
            zoom="16"
            grid="true"
            active-palette="0"
          >
          </tile-canvas>
        </section>

        <aside class="tools-panel">
          <tool-panel id="tools"></tool-panel>
        </aside>
      </main>
    </div>

    <script type="module" src="./app.ts"></script>
  </body>
</html>
```

```typescript
// ui/src/standalone/app.ts
import { initWasm } from "../lib/wasm-loader.js";
import { TileModel } from "../models/TileModel.js";
import { PaletteModel } from "../models/PaletteModel.js";
import { EditorState } from "../models/EditorState.js";
import { TileEditorController } from "../controllers/TileEditorController.js";
import { PaletteController } from "../controllers/PaletteController.js";
import { FileController } from "../controllers/FileController.js";

import "../views/TileCanvas/TileCanvas.js";
import "../views/PaletteEditor/PaletteEditor.js";
import "../views/ColorPicker/ColorPicker.js";
import "../views/ToolPanel/ToolPanel.js";

async function main() {
  // Initialize WASM
  const wasm = await initWasm();

  // Create Models (single source of truth)
  const tileModel = new TileModel(new wasm.Tile());
  const paletteModel = new PaletteModel(new wasm.Palette());
  const editorState = new EditorState();

  // Get View elements
  const tileCanvas = document.getElementById("tile-canvas");
  const paletteEditor = document.getElementById("palette");
  const colorPicker = document.getElementById("color-picker");
  const toolPanel = document.getElementById("tools");

  // Create Controllers (wire up Views and Models)
  const tileController = new TileEditorController(
    tileModel,
    paletteModel,
    editorState,
    tileCanvas
  );

  const paletteController = new PaletteController(
    paletteModel,
    paletteEditor,
    colorPicker
  );

  const fileController = new FileController(
    tileModel,
    paletteModel
  );

  // Wire up tool panel to editor state
  toolPanel.addEventListener("tool-selected", (e) => {
    editorState.setTool(e.detail.tool);
  });

  toolPanel.addEventListener("zoom-changed", (e) => {
    editorState.setZoom(e.detail.zoom);
  });

  toolPanel.addEventListener("grid-toggled", (e) => {
    editorState.setGridEnabled(e.detail.enabled);
  });

  // Wire up file operations
  document.getElementById("save-file").addEventListener("click", () => {
    fileController.saveProject();
  });

  document.getElementById("export").addEventListener("click", () => {
    fileController.exportBinary();
  });

  document.getElementById("open-file").addEventListener("click", () => {
    fileController.openProject();
  });

  // Global undo/redo shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z") {
        e.preventDefault();
        tileController.undo();
      } else if (e.key === "y") {
        e.preventDefault();
        tileController.redo();
      }
    }
  });
}

main();
```

### Usage in React (Future Semikit Website)

```tsx
// ui/src/react/TileCanvasReact.tsx
import React, { useEffect, useRef } from "react";
import "../components/TileCanvas/TileCanvas.js";

export function TileCanvas({
  zoom = 16,
  grid = true,
  activePalette = 0,
  onPixelChanged,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;

    const handlePixelChange = (e) => {
      if (onPixelChanged) {
        onPixelChanged(e.detail);
      }
    };

    element.addEventListener("pixel-changed", handlePixelChange);
    return () => {
      element.removeEventListener("pixel-changed", handlePixelChange);
    };
  }, [onPixelChanged]);

  useEffect(() => {
    if (ref.current) {
      ref.current.setAttribute("zoom", zoom.toString());
      ref.current.setAttribute("grid", grid.toString());
      ref.current.setAttribute("active-palette", activePalette.toString());
    }
  }, [zoom, grid, activePalette]);

  return <tile-canvas ref={ref} />;
}
```

```tsx
// Example usage in semikit website
import { TileCanvas, PaletteEditor } from "semitile-ui/react";
import "semitile-ui/styles/tokens.css";

function TileEditorPage() {
  const [activePalette, setActivePalette] = useState(0);
  const [zoom, setZoom] = useState(16);

  const handlePixelChanged = (detail) => {
    console.log("Pixel changed:", detail);
  };

  return (
    <div className="editor-page">
      <h1>Tile Editor</h1>
      <div className="editor-container">
        <PaletteEditor
          activePalette={activePalette}
          onPaletteChange={setActivePalette}
        />
        <TileCanvas
          zoom={zoom}
          grid={true}
          activePalette={activePalette}
          onPixelChanged={handlePixelChanged}
        />
      </div>
    </div>
  );
}
```

## Design System

### CSS Custom Properties (Design Tokens)

```css
/* ui/src/styles/tokens.css */
:root {
  /* Cicada-16 brand colors */
  --c16-primary: #00ff88;
  --c16-primary-dark: #00cc6a;
  --c16-secondary: #ff0088;
  --c16-accent: #00d4ff;

  /* Background colors */
  --c16-bg-dark: #1a1a2e;
  --c16-bg-medium: #16213e;
  --c16-bg-light: #0f3460;

  /* Text colors */
  --c16-text-primary: #ffffff;
  --c16-text-secondary: #b8b8b8;
  --c16-text-muted: #666666;

  /* Component spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border radius */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;

  /* Typography */
  --font-mono: "SF Mono", "Courier New", monospace;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  /* Font sizes */
  --text-xs: 11px;
  --text-sm: 13px;
  --text-md: 15px;
  --text-lg: 18px;
  --text-xl: 24px;

  /* Canvas rendering */
  --pixel-size: 16px;
  --grid-color: rgba(255, 255, 255, 0.2);
}
```

All components use these tokens, ensuring visual consistency across standalone and integrated contexts.

## Core Data Structures (Rust)

### Tile Representation

```rust
// semitile_core/src/tile.rs
pub struct Tile {
    pixels: [[u8; 8]; 8],  // 4-bit color indices (0-15)
}

impl Tile {
    pub fn new() -> Self {
        Self { pixels: [[0; 8]; 8] }
    }

    pub fn set_pixel(&mut self, x: usize, y: usize, color: u8) {
        if x < 8 && y < 8 && color < 16 {
            self.pixels[y][x] = color;
        }
    }

    pub fn get_pixel(&self, x: usize, y: usize) -> u8 {
        if x < 8 && y < 8 {
            self.pixels[y][x]
        } else {
            0
        }
    }

    pub fn to_planar(&self) -> [u8; 32] {
        // Convert to 4bpp planar format as per PPU_Architecture.md
        // 32 bytes organized into four 8-byte bit planes
        let mut planar = [0u8; 32];

        for y in 0..8 {
            for x in 0..8 {
                let color = self.pixels[y][x];
                let bit_pos = 7 - x; // MSB first

                // Distribute each bit of the 4-bit color across the four planes
                if color & 0b0001 != 0 { planar[y] |= 1 << bit_pos; }       // Plane 0
                if color & 0b0010 != 0 { planar[8 + y] |= 1 << bit_pos; }   // Plane 1
                if color & 0b0100 != 0 { planar[16 + y] |= 1 << bit_pos; }  // Plane 2
                if color & 0b1000 != 0 { planar[24 + y] |= 1 << bit_pos; }  // Plane 3
            }
        }

        planar
    }

    pub fn from_planar(data: &[u8; 32]) -> Self {
        // Decode from planar format
        let mut tile = Tile::new();

        for y in 0..8 {
            for x in 0..8 {
                let bit_pos = 7 - x;
                let mut color = 0u8;

                // Reconstruct 4-bit color from the four planes
                if data[y] & (1 << bit_pos) != 0 { color |= 0b0001; }
                if data[8 + y] & (1 << bit_pos) != 0 { color |= 0b0010; }
                if data[16 + y] & (1 << bit_pos) != 0 { color |= 0b0100; }
                if data[24 + y] & (1 << bit_pos) != 0 { color |= 0b1000; }

                tile.pixels[y][x] = color;
            }
        }

        tile
    }
}

impl Default for Tile {
    fn default() -> Self {
        Self::new()
    }
}
```

### Color and Palette

```rust
// semitile_core/src/palette.rs
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Color {
    r: u8,  // 0-31 (5 bits)
    g: u8,  // 0-31 (5 bits)
    b: u8,  // 0-31 (5 bits)
}

impl Color {
    pub fn new(r: u8, g: u8, b: u8) -> Self {
        Self {
            r: r.min(31),
            g: g.min(31),
            b: b.min(31),
        }
    }

    pub fn to_rgb555(&self) -> u16 {
        // RRRRRGGGGGBBBBB format
        ((self.r as u16) << 10) | ((self.g as u16) << 5) | (self.b as u16)
    }

    pub fn from_rgb555(value: u16) -> Self {
        Self {
            r: ((value >> 10) & 0x1F) as u8,
            g: ((value >> 5) & 0x1F) as u8,
            b: (value & 0x1F) as u8,
        }
    }

    pub fn to_rgb888(&self) -> (u8, u8, u8) {
        // For display in browser (scale 0-31 to 0-255)
        // Use proper 5-bit to 8-bit expansion
        ((self.r << 3) | (self.r >> 2),
         (self.g << 3) | (self.g >> 2),
         (self.b << 3) | (self.b >> 2))
    }

    pub fn from_rgb888(r: u8, g: u8, b: u8) -> Self {
        // Convert 8-bit RGB to 5-bit RGB
        Self {
            r: r >> 3,
            g: g >> 3,
            b: b >> 3,
        }
    }
}

impl Default for Color {
    fn default() -> Self {
        Self::new(0, 0, 0)
    }
}

pub struct Palette {
    sub_palettes: [[Color; 16]; 16],  // 256 colors total
}

impl Palette {
    pub fn new() -> Self {
        Self {
            sub_palettes: [[Color::default(); 16]; 16],
        }
    }

    pub fn get_color(&self, palette_idx: u8, color_idx: u8) -> Color {
        self.sub_palettes[palette_idx as usize % 16][color_idx as usize % 16]
    }

    pub fn set_color(&mut self, palette_idx: u8, color_idx: u8, color: Color) {
        self.sub_palettes[palette_idx as usize % 16][color_idx as usize % 16] = color;
    }

    pub fn export_binary(&self) -> Vec<u8> {
        // Export as 512 bytes (256 colors × 2 bytes RGB555)
        let mut data = Vec::with_capacity(512);
        for sub_palette in &self.sub_palettes {
            for color in sub_palette {
                let rgb555 = color.to_rgb555();
                data.push((rgb555 & 0xFF) as u8);        // Low byte
                data.push(((rgb555 >> 8) & 0xFF) as u8); // High byte
            }
        }
        data
    }

    pub fn import_binary(data: &[u8]) -> Option<Self> {
        if data.len() != 512 {
            return None;
        }

        let mut palette = Palette::new();
        for palette_idx in 0..16 {
            for color_idx in 0..16 {
                let offset = (palette_idx * 16 + color_idx) * 2;
                let low = data[offset] as u16;
                let high = data[offset + 1] as u16;
                let rgb555 = (high << 8) | low;
                palette.sub_palettes[palette_idx][color_idx] = Color::from_rgb555(rgb555);
            }
        }

        Some(palette)
    }
}

impl Default for Palette {
    fn default() -> Self {
        Self::new()
    }
}
```

### Tilemap

```rust
// semitile_core/src/tilemap.rs
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TilemapEntry {
    tile_index: u16,    // 10 bits (0-1023)
    palette: u8,        // 3 bits (0-7) for backgrounds
    h_flip: bool,
    v_flip: bool,
    priority: bool,
}

impl TilemapEntry {
    pub fn new(tile_index: u16) -> Self {
        Self {
            tile_index: tile_index & 0x3FF,
            palette: 0,
            h_flip: false,
            v_flip: false,
            priority: false,
        }
    }

    pub fn to_u16(&self) -> u16 {
        // Pack into 16-bit format as per PPU spec
        // Bit 15: Priority
        // Bit 14: V-Flip
        // Bit 13: H-Flip
        // Bits 10-12: Palette (0-7)
        // Bits 8-9: Tile index bits 8-9
        // Bits 0-7: Tile index bits 0-7
        let mut value = self.tile_index & 0x3FF;  // 10 bits
        value |= (self.palette as u16 & 0x7) << 10;
        if self.h_flip { value |= 1 << 13; }
        if self.v_flip { value |= 1 << 14; }
        if self.priority { value |= 1 << 15; }
        value
    }

    pub fn from_u16(value: u16) -> Self {
        Self {
            tile_index: value & 0x3FF,
            palette: ((value >> 10) & 0x7) as u8,
            h_flip: (value & (1 << 13)) != 0,
            v_flip: (value & (1 << 14)) != 0,
            priority: (value & (1 << 15)) != 0,
        }
    }
}

impl Default for TilemapEntry {
    fn default() -> Self {
        Self::new(0)
    }
}

pub struct Tilemap {
    width: usize,   // In tiles
    height: usize,  // In tiles
    entries: Vec<TilemapEntry>,
}

impl Tilemap {
    pub fn new(width: usize, height: usize) -> Self {
        let entries = vec![TilemapEntry::default(); width * height];
        Self { width, height, entries }
    }

    pub fn get_entry(&self, x: usize, y: usize) -> Option<&TilemapEntry> {
        if x < self.width && y < self.height {
            Some(&self.entries[y * self.width + x])
        } else {
            None
        }
    }

    pub fn set_entry(&mut self, x: usize, y: usize, entry: TilemapEntry) {
        if x < self.width && y < self.height {
            self.entries[y * self.width + x] = entry;
        }
    }

    pub fn export_binary(&self) -> Vec<u8> {
        let mut data = Vec::with_capacity(self.entries.len() * 2);
        for entry in &self.entries {
            let value = entry.to_u16();
            data.push((value & 0xFF) as u8);        // Low byte
            data.push(((value >> 8) & 0xFF) as u8); // High byte
        }
        data
    }
}
```

## WASM Integration

### Public API for JavaScript

```rust
// web/src/lib.rs
use wasm_bindgen::prelude::*;
use semitile_core::{Tile, Palette, Color, Tilemap, TilemapEntry};

#[wasm_bindgen]
pub struct TileEditor {
    tile: Tile,
    palette: Palette,
    active_palette: u8,
}

#[wasm_bindgen]
impl TileEditor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            tile: Tile::default(),
            palette: Palette::default(),
            active_palette: 0,
        }
    }

    pub fn set_pixel(&mut self, x: usize, y: usize, color_index: u8) {
        self.tile.set_pixel(x, y, color_index);
    }

    pub fn get_pixel(&self, x: usize, y: usize) -> u8 {
        self.tile.get_pixel(x, y)
    }

    pub fn export_planar(&self) -> Vec<u8> {
        self.tile.to_planar().to_vec()
    }

    pub fn import_planar(&mut self, data: &[u8]) -> bool {
        if data.len() == 32 {
            let arr: [u8; 32] = data.try_into().unwrap();
            self.tile = Tile::from_planar(&arr);
            true
        } else {
            false
        }
    }

    pub fn get_color_rgb(&self, palette_idx: u8, color_idx: u8) -> Vec<u8> {
        let color = self.palette.get_color(palette_idx, color_idx);
        let (r, g, b) = color.to_rgb888();
        vec![r, g, b]
    }

    pub fn set_color(&mut self, palette_idx: u8, color_idx: u8, r: u8, g: u8, b: u8) {
        let color = Color::new(r, g, b);
        self.palette.set_color(palette_idx, color_idx, color);
    }

    pub fn export_palette(&self) -> Vec<u8> {
        self.palette.export_binary()
    }

    pub fn import_palette(&mut self, data: &[u8]) -> bool {
        if let Some(palette) = Palette::import_binary(data) {
            self.palette = palette;
            true
        } else {
            false
        }
    }
}
```

## UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│ semitile - Cicada-16 Tile Editor                    [=] │
├─────────────────────────────────────────────────────────┤
│ File  Edit  View  Export                                │
├──────────────┬──────────────────────────┬───────────────┤
│              │                          │               │
│   Palette    │    Tile Canvas (8×8)     │  Tools        │
│              │                          │               │
│ ┌──────────┐ │   ┌────────────────┐     │  ● Pencil     │
│ │■■■■■■■■■ │ │   │                │     │  ○ Fill       │
│ │■■■■■■■■■ │ │   │   [Grid View]  │     │  ○ Line       │
│ └──────────┘ │   │                │     │  ○ Rectangle  │
│              │   │    @Zoom: 16×  │     │               │
│ Active: 0    │   └────────────────┘     │  [ ] Grid     │
│              │                          │  [ ] Preview  │
│ ┌──────────┐ │   Preview (1×)           │               │
│ │ RGB555   │ │   ┌──┐                   │  Tile Bank    │
│ │ R: ████  │ │   │  │                   │  ┌─────────┐  │
│ │ G: ████  │ │   └──┘                   │  │■■■■■■■■ │  │
│ │ B: ████  │ │                          │  │■■■■■■■■ │  │
│ └──────────┘ │                          │  └─────────┘  │
│              │                          │               │
└──────────────┴──────────────────────────┴───────────────┘
```

## Cicada-16 Specific Considerations

### 4bpp Planar Format

Per `PPU_Architecture.md`, each 8×8 tile requires 32 bytes organized into four bit planes:

- **Bytes 0-7:** Bit Plane 0 (LSB of color index)
- **Bytes 8-15:** Bit Plane 1
- **Bytes 16-23:** Bit Plane 2
- **Bytes 24-31:** Bit Plane 3 (MSB of color index)

Within each plane, each byte represents one row of 8 pixels, with bit 7 being the leftmost pixel.

### RGB555 Color Format

Colors are stored as 16-bit values (little-endian):

- Bits 10-14: Red (5 bits)
- Bits 5-9: Green (5 bits)
- Bits 0-4: Blue (5 bits)

### Palette System

- **256 total colors** divided into **16 sub-palettes** of **16 colors** each
- Background layers (BG0, BG1, Window) can only use sub-palettes 0-7
- Sprites can use all 16 sub-palettes (0-15)
- Color 0 in each sub-palette is transparent (except BG0 which is always opaque)

### Tilemap Entry Format (16-bit)

```
Bit 15:    Priority (1=in front of sprites with priority=0)
Bit 14:    V-Flip
Bit 13:    H-Flip
Bits 10-12: Palette Select (0-7)
Bit 9:     Tile Index bit 9
Bit 8:     Tile Index bit 8
Bits 0-7:  Tile Index bits 0-7
```

## Export Formats

### Binary Tile Data

- Raw 32-byte planar format per tile
- Can be directly loaded into VRAM via DMA

### Palette Data

- 512 bytes total (256 colors × 2 bytes)
- Each entry is RGB555 format (little-endian)
- Can be directly loaded into CRAM (F200-F3FF) via DMA Mode 3

### Tilemap Data

- 2 bytes per tile entry (little-endian)
- Width × Height × 2 bytes total
- Can be directly loaded into VRAM tilemap area

### C/Assembly Headers

```c
// Example generated header file
#ifndef TILES_H
#define TILES_H

// Tile data (4bpp planar format)
const unsigned char tile_grass[] = {
    // Plane 0 (bit 0 of color)
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
    // Plane 1 (bit 1 of color)
    0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F,
    // Plane 2 (bit 2 of color)
    0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
    // Plane 3 (bit 3 of color)
    0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F
};

// Palette data (RGB555 format, little-endian)
const unsigned short palette_overworld[] = {
    0x7FFF,  // Color 0: White (transparent for BG1+)
    0x001F,  // Color 1: Blue
    0x03E0,  // Color 2: Green
    0x7C00,  // Color 3: Red
    // ... 252 more colors
};

// Tilemap data (16-bit entries, little-endian)
const unsigned short tilemap_level1[] = {
    0x0042,  // Tile 0,0: index=0x042, palette=0, no flips
    0x2043,  // Tile 0,1: index=0x043, palette=1, no flips
    // ... more entries
};

#define TILEMAP_LEVEL1_WIDTH 32
#define TILEMAP_LEVEL1_HEIGHT 32

#endif // TILES_H
```

## Package Publishing

### NPM Package Structure

```json
{
  "name": "semitile-ui",
  "version": "0.1.0",
  "description": "Tile and tilemap editor components for Cicada-16",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./react": "./dist/react/index.js",
    "./styles/*": "./dist/styles/*",
    "./wasm": "./dist/wasm/semitile_web_bg.wasm"
  },
  "files": ["dist", "README.md", "LICENSE"],
  "keywords": [
    "cicada-16",
    "tile-editor",
    "tilemap",
    "pixel-art",
    "web-components",
    "fantasy-console"
  ]
}
```

## Future Enhancements

- Sprite editor (with size/shape attributes from OAM)
- Animation preview for sprite sequences
- Tilemap collision layer editing
- Tileset organization and management
- Auto-tiling tools
- Integration with semikit-studio via shared file formats
- Collaborative editing features (multiplayer editing)
- Import from common formats (Aseprite, PNG, Tiled TMX, etc.)
- Export sprite sheets
- Palette reduction/quantization tools
- Dithering patterns

## Implementation Stages

This section outlines the step-by-step implementation strategy for building semitile. Each stage builds upon the previous one, creating a working prototype early and iterating from there.

### Stage 0: Project Setup & Foundation

**Goal:** Set up the development environment and basic project structure

**Tasks:**

1. Initialize Rust workspace with `semitile_core/` and `web/` crates
2. Configure `semitile_core/` crate for library compilation
3. Configure `web/` crate with `wasm-bindgen` and `wasm-pack`
4. Set up `ui/` directory with `package.json` and Vite build configuration
5. Create basic project structure (all directories and placeholder files)
6. Add `.gitignore` for Rust and Node artifacts
7. Create basic `README.md` with project description and build instructions
8. Verify build pipeline: `cargo build` for Rust, `wasm-pack build` for WASM, `npm run dev` for UI

**Deliverable:** Empty project structure with working build system

---

### Stage 1: Core Rust Implementation

**Goal:** Implement all core data structures and conversion logic

**Tasks:**

#### 1.1 - Tile Implementation

- Implement `Tile` struct in `semitile_core/src/tile.rs`
- Implement `new()`, `set_pixel()`, `get_pixel()` methods
- Implement `to_planar()` conversion (4bpp planar encoding)
- Implement `from_planar()` conversion (4bpp planar decoding)
- Write unit tests for planar conversion (round-trip tests)

#### 1.2 - Color and Palette Implementation

- Implement `Color` struct in `semitile_core/src/palette.rs`
- Implement RGB555 conversion: `to_rgb555()`, `from_rgb555()`
- Implement RGB888 conversion: `to_rgb888()`, `from_rgb888()` (for browser display)
- Implement `Palette` struct with 16 sub-palettes
- Implement `export_binary()` and `import_binary()` for palette data
- Write unit tests for color conversions and palette operations

#### 1.3 - Tilemap Implementation

- Implement `TilemapEntry` struct in `semitile_core/src/tilemap.rs`
- Implement `to_u16()` and `from_u16()` for 16-bit packing/unpacking
- Implement `Tilemap` struct with grid operations
- Implement `export_binary()` for tilemap data
- Write unit tests for tilemap entry packing and tilemap operations

#### 1.4 - Export Utilities

- Create `semitile_core/src/export.rs` for export format generation
- Implement C header file generation
- Implement Assembly (.inc) file generation
- Write unit tests for export formats

**Deliverable:** Complete, tested Rust core library with all data structures

---

### Stage 2: WASM Bindings

**Goal:** Create JavaScript API for the Rust core

**Tasks:**

#### 2.1 - WASM Project Setup

- Configure `web/Cargo.toml` with dependencies (`wasm-bindgen`, `console_error_panic_hook`)
- Set up build script for WASM compilation
- Create output directory structure

#### 2.2 - WASM Bindings for Core Types

- Expose `Tile` struct in `web/src/lib.rs`
  - Methods: `new()`, `set_pixel()`, `get_pixel()`, `to_planar()`, `from_planar()`
- Expose `Color` struct
  - Methods: `new()`, `from_rgb888()`, `to_rgb888()`, `from_rgb555()`, `to_rgb555()`
- Expose `Palette` struct
  - Methods: `new()`, `get_color()`, `set_color()`, `export_binary()`, `import_binary()`
- Expose `Tilemap` and `TilemapEntry` structs
  - Methods: `new()`, `get_entry()`, `set_entry()`, `export_binary()`
- Set up panic hook for better debugging in browser

#### 2.3 - WASM Module Building & Testing

- Build WASM module with `wasm-pack build --target web`
- Create simple HTML test page to verify WASM loads correctly
- Test all exposed methods from JavaScript console
- Verify memory management (no leaks with repeated calls)

**Deliverable:** Working WASM module with direct access to Rust types

---

### Stage 3: UI Foundation & Design System

**Goal:** Set up UI infrastructure and shared styling

**Tasks:**

#### 3.1 - UI Project Setup

- Initialize `ui/package.json` with Vite and development dependencies
- Configure Vite for ES modules and WASM support
- Set up development server with hot reload

#### 3.2 - Design System

- Create `ui/src/styles/tokens.css` with CSS custom properties
  - Cicada-16 brand colors
  - Spacing scale
  - Typography scale
  - Component-specific tokens
- Create `ui/src/styles/reset.css` for CSS normalization
- Create `ui/src/styles/common.css` for shared component styles

#### 3.3 - WASM Loader Utility

- Create `ui/src/lib/wasm-loader.ts`
- Implement async WASM module initialization
- Export WASM types for use in Models
- Add error handling for WASM load failures

**Deliverable:** UI build system with design tokens and WASM loader

---

### Stage 4: Model Layer (Observable State)

**Goal:** Create observable Model classes that wrap WASM functionality

**Tasks:**

#### 4.1 - EventEmitter Base Class

- Create `ui/src/models/EventEmitter.ts`
- Implement `on()`, `off()`, `emit()` methods
- Support multiple listeners per event
- Proper cleanup in `off()`

#### 4.2 - TileModel

- Create `ui/src/models/TileModel.ts`
- Wrap WASM `Tile` instance
- Implement getters: `getPixel(x, y)`
- Implement setters that emit events: `setPixel(x, y, color)`
- Implement `importPlanar()`, `exportPlanar()`, `clear()`
- Emit events: `pixelChanged`, `tileImported`, `tileCleared`

#### 4.3 - PaletteModel

- Create `ui/src/models/PaletteModel.ts`
- Wrap WASM `Palette` instance
- Track active sub-palette and selected color
- Implement `getColor()`, `setColor()`, `selectColor()`, `setActiveSubPalette()`
- Implement `importBinary()`, `exportBinary()`
- Emit events: `colorChanged`, `colorSelected`, `subPaletteChanged`, `paletteImported`

#### 4.4 - EditorState

- Create `ui/src/models/EditorState.ts`
- Define `Tool` enum (Pencil, Fill, Line, Rectangle)
- Track current tool, zoom level, grid enabled
- Implement setters that emit events
- Emit events: `toolChanged`, `zoomChanged`, `gridToggled`

#### 4.5 - Model Testing

- Create simple HTML page to test Models
- Verify events are emitted correctly
- Test Model state changes
- Verify WASM integration works

**Deliverable:** Complete Model layer with observable state management

---

### Stage 5: TileCanvas View Component (MVP)

**Goal:** Create the first working View component - pure presentation only

**Tasks:**

#### 5.1 - TileCanvas Web Component Structure

- Create `ui/src/views/TileCanvas/` directory
- Implement basic Web Component class structure
- Set up Shadow DOM
- Implement `connectedCallback()` and `disconnectedCallback()` lifecycle

#### 5.2 - Model Dependency Injection

- Add `setModels()` method to inject TileModel, PaletteModel, EditorState
- Subscribe to Model events in `setModels()`
- Unsubscribe from Model events in `disconnectedCallback()`
- Store Model references as private properties

#### 5.3 - Canvas Setup & Pure Rendering

- Create canvas element in Shadow DOM
- Initialize 2D rendering context
- Implement `redraw()` method that reads from Models only (no state)
- Render pixels using TileModel.getPixel() and PaletteModel.getColor()
- Use EditorState.getZoom() for zoom level
- Add image-rendering CSS for crisp pixels

#### 5.4 - Grid Overlay

- Implement `drawGrid()` method
- Read grid enabled state from EditorState.isGridEnabled()
- Style grid with semi-transparent lines

#### 5.5 - Mouse Event Dispatching

- Implement mouse event listeners (mousedown, mousemove, mouseup)
- Convert mouse coordinates to tile pixel coordinates
- Dispatch custom events (`draw-start`, `draw-move`, `draw-end`) with coordinates
- DO NOT modify Models directly - only dispatch events

#### 5.6 - Component Styling

- Add component styles in `TileCanvas.css`
- Style canvas container
- Add hover effects

**Deliverable:** Pure View component that renders tile state and dispatches interaction events

---

### Stage 6: TileEditorController

**Goal:** Create Controller to handle tile editing logic

**Tasks:**

#### 6.1 - TileEditorController Class

- Create `ui/src/controllers/TileEditorController.ts`
- Accept TileModel, PaletteModel, EditorState, and TileCanvas view in constructor
- Inject Models into View via `view.setModels()`

#### 6.2 - Event Handling

- Listen to View's `draw-start`, `draw-move`, `draw-end` events
- Track drawing state (isDrawing flag)
- Get selected color from PaletteModel
- Update TileModel based on active tool from EditorState

#### 6.3 - Tool Logic

- Implement pencil tool (direct pixel setting)
- Implement fill tool (flood fill algorithm)
- Implement line tool (Bresenham's line algorithm)
- Implement rectangle tool (filled and outline)

#### 6.4 - Public API

- Expose methods: `clear()`, `undo()`, `redo()`
- Methods update Models, which trigger View re-renders via events

**Deliverable:** Working tile editor with Controller coordinating View and Models

---

### Stage 7: PaletteEditor View & Controller

**Goal:** Create palette viewing/editing with View and Controller

**Tasks:**

#### 7.1 - PaletteEditor View Component

- Create `ui/src/views/PaletteEditor/` directory
- Implement Web Component class
- Set up Shadow DOM with grid layout
- Add `setModel(paletteModel)` method for dependency injection
- Subscribe to PaletteModel events: `colorChanged`, `colorSelected`, `subPaletteChanged`

#### 7.2 - Palette Grid Rendering (Pure View)

- Render 16 color swatches for active sub-palette
- Read colors from PaletteModel.getColor()
- Highlight selected color from PaletteModel.getSelectedColorIndex()
- Show color index numbers
- Re-render when Model emits events

#### 7.3 - User Interaction Events

- Implement click handlers for color swatches
- Dispatch custom events (`color-select-clicked`) with color index
- DO NOT modify Model directly - only dispatch events

#### 7.4 - Sub-Palette Selector

- Add sub-palette dropdown (0-15)
- Read active sub-palette from PaletteModel
- Dispatch `subpalette-change-clicked` event on selection

#### 7.5 - Styling

- Create `PaletteEditor.css` with grid layout
- Style color swatches with borders and hover effects
- Add selection highlighting
- Add transparency indicator for color index 0

#### 7.6 - PaletteController

- Create `ui/src/controllers/PaletteController.ts`
- Listen to View's `color-select-clicked` event
- Update PaletteModel.selectColor() when user clicks color
- Listen to `subpalette-change-clicked` and update PaletteModel

**Deliverable:** Palette viewer with MVC separation

---

### Stage 8: ColorPicker View Component

**Goal:** Allow users to edit individual colors in RGB555 format

**Tasks:**

#### 8.1 - ColorPicker View Structure

- Create `ui/src/views/ColorPicker/` directory
- Implement Web Component class
- Set up Shadow DOM with form layout
- Add `setModel(paletteModel)` method for dependency injection
- Subscribe to PaletteModel events: `colorSelected`, `colorChanged`

#### 8.2 - RGB555 Sliders (Pure View)

- Create three range inputs for R, G, B (0-31 range)
- Display current color value as RGB555 hex
- Show live color preview swatch
- Display 8-bit RGB values for reference
- Load current color from PaletteModel when selection changes

#### 8.3 - Color Editing Events

- Dispatch `color-edit` custom event when sliders change
- Include { paletteIdx, colorIdx, r, g, b } in event detail
- DO NOT modify Model directly - Controller will handle it
- Debounce slider updates for performance

#### 8.4 - Hex Input (Optional)

- Add text input for direct RGB555 hex entry
- Validate hex input format
- Dispatch `color-edit` event with parsed hex values

#### 8.5 - Styling

- Create `ColorPicker.css`
- Style sliders with custom track colors
- Add color preview swatch
- Show value labels

#### 8.6 - Controller Integration

- PaletteController (from Stage 7) listens to `color-edit` event
- Controller calls PaletteModel.setColor() with new values
- Model emits `colorChanged` event
- All Views observing PaletteModel update automatically

**Deliverable:** Functional RGB555 color editor with MVC separation

---

### Stage 9: Standalone App Integration (MVC Wiring)

**Goal:** Wire up Models, Views, and Controllers into a working application

**Tasks:**

#### 9.1 - HTML Structure

- Create `ui/src/standalone/index.html`
- Set up semantic HTML structure (header, main, aside)
- Create layout grid for View placement
- Add navigation buttons (New, Save, Export)

#### 9.2 - MVC Bootstrap

- Create `ui/src/standalone/app.ts`
- Import all View components
- Initialize WASM and create Models (TileModel, PaletteModel, EditorState)
- Get View element references from DOM
- Create Controllers and pass Models + Views to them

#### 9.3 - Controller Wiring

- Instantiate TileEditorController with TileModel, PaletteModel, EditorState, TileCanvas
- Instantiate PaletteController with PaletteModel, PaletteEditor, ColorPicker
- Controllers automatically wire up Views to Models
- Models emit events → Views update automatically

#### 9.4 - Tool Panel Integration

- Add ToolPanel View component
- Wire up tool selection to EditorState.setTool()
- Wire up zoom changes to EditorState.setZoom()
- Wire up grid toggle to EditorState.setGridEnabled()

#### 9.5 - Layout & Styling

- Create `ui/src/standalone/styles.css`
- Implement responsive layout
- Style header and navigation
- Add panel styling for View containers

#### 9.6 - Loading State

- Add loading screen while WASM initializes
- Handle WASM initialization errors
- Show error messages if Models fail to initialize

**Deliverable:** Working standalone tile editor with full MVC architecture

---

### Stage 10: File Operations & Export (FileController)

**Goal:** Enable saving, loading, and exporting work with FileController

**Tasks:**

#### 10.1 - FileController Class

- Create `ui/src/controllers/FileController.ts`
- Accept TileModel and PaletteModel in constructor
- Implement file operations that read from / write to Models

#### 10.2 - Export Manager Utility

- Create `ui/src/lib/ExportManager.ts` class
- Implement binary tile data export (.bin)
- Implement binary palette export (.pal)
- Implement C header generation
- Implement Assembly header generation

#### 10.3 - File Download

- FileController.exportBinary() reads from Models and triggers downloads
- FileController.exportCHeader() generates C headers
- Implement browser file download functionality
- Generate appropriate filenames with extensions

#### 10.4 - Project Format

- Define JSON-based project file format
  - Tile data (planar format base64 encoded)
  - Palette data (RGB555 values)
  - Metadata (name, version, etc.)
- FileController.saveProject() serializes Models to JSON
- FileController.loadProject() deserializes JSON to Models

#### 10.5 - IndexedDB Storage

- Create `ui/src/lib/storage.ts` wrapper
- FileController.autoSave() periodically saves to IndexedDB
- FileController.listProjects() returns saved project list
- Show list of saved projects in UI

#### 10.6 - File Import

- FileController.openProject() opens file picker
- Parse and validate project files
- Load tile and palette data into Models
- Models emit events → all Views update automatically

**Deliverable:** Complete file management system with MVC separation

---

### Stage 11: Command History & Undo/Redo

**Goal:** Implement command pattern for undo/redo functionality

**Tasks:**

#### 11.1 - Command Interface

- Create `ui/src/models/CommandHistory.ts`
- Define `Command` interface with `execute()` and `undo()` methods
- Implement command stack (undo stack and redo stack)

#### 11.2 - Tile Commands

- Implement `SetPixelCommand` with execute/undo
- Implement `FillCommand` with execute/undo
- Implement `ClearTileCommand` with execute/undo

#### 11.3 - Palette Commands

- Implement `SetColorCommand` with execute/undo
- Implement `ImportPaletteCommand` with execute/undo

#### 11.4 - Controller Integration

- TileEditorController wraps Model mutations in Commands
- Execute command → add to history → command calls Model methods
- Model emits events → Views update
- Implement undo() and redo() in Controllers

#### 11.5 - Keyboard Shortcuts

- Wire up Ctrl+Z for undo
- Wire up Ctrl+Y / Ctrl+Shift+Z for redo
- Add undo/redo buttons to UI

**Deliverable:** Full undo/redo system integrated with MVC architecture

---

### Stage 12: Tile Bank (Multi-Tile Model)

**Goal:** Extend TileModel to manage multiple tiles

**Tasks:**

#### 12.1 - TileBankModel

- Create `ui/src/models/TileBankModel.ts`
- Manage array of WASM `Tile` instances
- Track active tile index
- Implement methods: `addTile()`, `deleteTile()`, `setActiveTile()`, `getTile(index)`
- Emit events: `tileAdded`, `tileDeleted`, `activeTileChanged`

#### 12.2 - Tile Bank View Component

- Create `ui/src/views/TileBank/TileBank.ts`
- Render mini-grid of tile thumbnails
- Read tiles from TileBankModel
- Listen to Model events and re-render
- Dispatch `tile-select-clicked` event

#### 12.3 - TileBankController

- Create `ui/src/controllers/TileBankController.ts`
- Wire TileBankModel to TileBank View
- Handle tile selection → update TileBankModel.setActiveTile()
- Handle add/delete buttons → update TileBankModel

#### 12.4 - Integration with TileEditorController

- TileEditorController now works with TileBankModel.getActiveTile()
- When active tile changes, TileCanvas re-renders
- All editing operations apply to active tile

#### 12.5 - Tile Operations

- Implement copy/paste tiles (commands for undo/redo)
- Implement duplicate tile
- Implement clear tile
- Add tile reordering (drag & drop with command pattern)

#### 12.6 - File Operations Update

- FileController saves/loads all tiles from TileBankModel
- Export all tiles in batch

**Deliverable:** Multi-tile editing with MVC architecture

---

### Stage 13: Tilemap Editor (Model-View-Controller)

**Goal:** Arrange tiles into tilemaps with MVC architecture

**Tasks:**

#### 13.1 - TilemapModel

- Create `ui/src/models/TilemapModel.ts`
- Wrap WASM `Tilemap` instance
- Track tilemap dimensions, entries
- Implement methods: `getEntry()`, `setEntry()`, `resize()`
- Emit events: `entryChanged`, `tilemapResized`

#### 13.2 - TilemapEditor View

- Create `ui/src/views/TilemapEditor/TilemapEditor.ts`
- Render grid of tiles from TileBankModel
- Listen to TilemapModel and TileBankModel events
- Implement scrolling/panning
- Show tile boundaries
- Dispatch `tile-place-clicked` event

#### 13.3 - TilemapController

- Create `ui/src/controllers/TilemapController.ts`
- Handle tile placement from View events
- Update TilemapModel.setEntry() with selected tile
- Handle tile attribute changes (flip, palette, priority)

#### 13.4 - Tile Attributes Panel View

- Add attribute editing panel component
- Display attributes for selected tilemap entry
- Dispatch events for H-Flip, V-Flip, palette, priority changes

#### 13.5 - Tilemap Export

- FileController exports tilemap via TilemapModel.exportBinary()
- Export as C/Assembly arrays
- Include tilemap dimensions in export

**Deliverable:** Complete tilemap editor with MVC separation

---

### Stage 14: Advanced Features & Polish

**Goal:** Add quality-of-life features and polish

**Tasks:**

#### 14.1 - Keyboard Shortcuts

- Add keyboard navigation
- Implement tool hotkeys (P=Pencil, F=Fill, etc.)
- Add color selection shortcuts (0-9 for first 10 colors)
- EditorState tracks shortcuts and emits events

#### 14.2 - PNG Import/Export

- Implement PNG import with palette quantization
- Implement PNG export of current tile
- Support batch PNG export of tile bank
- FileController handles PNG operations

#### 14.3 - UI Polish

- Add tooltips to all buttons and controls
- Improve loading states in Views
- Add error messages for invalid operations
- Improve responsive layout for different screen sizes

#### 14.4 - Testing & Bug Fixes

- Test MVC data flow end-to-end
- Test all Model events trigger View updates correctly
- Fix rendering bugs
- Optimize performance
- Test on different browsers

**Deliverable:** Polished, production-ready standalone app with MVC architecture

---

### Stage 15: React Wrappers

**Goal:** Create React components for semikit website integration

**Tasks:**

#### 15.1 - React Hooks for Models

- Create custom React hooks for Models
  - `useTileModel()` - returns TileModel with state synchronization
  - `usePaletteModel()` - returns PaletteModel
  - `useEditorState()` - returns EditorState
- Hooks use `useState` + Model events to trigger re-renders

#### 15.2 - React Wrapper Components

- Create `ui/src/react/TileCanvasReact.tsx`
- Create `ui/src/react/PaletteEditorReact.tsx`
- Create `ui/src/react/ColorPickerReact.tsx`
- Create `ui/src/react/ToolPanelReact.tsx`
- Create `ui/src/react/TilemapEditorReact.tsx`
- Wrappers use hooks to access Models and pass to View components

#### 15.3 - React MVC Integration

- React components can use Models directly via hooks
- Controllers can be instantiated in React components
- Views remain Web Components (wrapped for React)

#### 15.4 - React Example Page

- Create example React app demonstrating MVC usage
- Show how to create Models, Controllers in React
- Document all component props
- Show event handling patterns

#### 15.5 - TypeScript Definitions

- Create `.d.ts` files for all components
- Type all props and events
- Type all Models and Controllers
- Document APIs

**Deliverable:** React-ready component library with MVC support

---

### Stage 16: Documentation & Publishing

**Goal:** Prepare for public release and npm publishing

**Tasks:**

#### 16.1 - Documentation

- Write comprehensive README
- Document MVC architecture (Models, Views, Controllers)
- Document all Models (TileModel, PaletteModel, EditorState, etc.)
- Document all Views (Web Components with attributes, events, methods)
- Document all Controllers
- Document React wrappers and hooks
- Create usage examples for vanilla JS and React
- Write integration guide for semikit website

#### 16.2 - API Documentation

- Document WASM API
- Document Model APIs
- Document export formats
- Document file formats
- Create Cicada-16 integration guide

#### 16.3 - Build & Package

- Configure production build
- Optimize WASM size
- Minify TypeScript/CSS
- Generate source maps
- Bundle Models, Views, Controllers separately for tree-shaking

#### 16.4 - NPM Publishing

- Finalize `package.json` metadata
- Create `.npmignore`
- Publish to npm as `semitile-ui`
- Verify package installation and imports
- Test MVC architecture works after npm install

#### 16.5 - Demo Deployment

- Deploy standalone app to GitHub Pages or Netlify
- Create public demo URL
- Add demo to semikit website

**Deliverable:** Published npm package with MVC architecture and public demo

---

### Stage 17: Future Iterations

**Goal:** Continue improving based on user feedback

**Potential Features:**

- Animation preview system
- Sprite editor with OAM attributes
- Auto-tiling tools
- Palette optimization/reduction
- Dithering patterns
- Integration with semikit-studio file formats
- Collaborative editing
- Import from Aseprite/Tiled formats

---

## Implementation Notes

### Development Order Rationale

1. **Core → WASM → Models → Views → Controllers**: Building from the inside out ensures a solid foundation
2. **MVC First**: Establish Model layer before Views to ensure proper separation of concerns
3. **MVP First**: TileCanvas View + TileEditorController + Models = minimum viable product
4. **Iterative**: Each stage produces a working artifact
5. **Testable**: Models, Views, and Controllers can be tested independently

### MVC Architecture Benefits

1. **Single Source of Truth**: Models hold all state, preventing inconsistencies
2. **Automatic View Updates**: Models emit events → all Views update automatically
3. **Easy Undo/Redo**: Command pattern integrates naturally with MVC
4. **Testable Business Logic**: Controllers can be unit tested without DOM
5. **Multiple Views of Same Data**: Palette can be displayed in multiple places
6. **Framework Flexibility**: Models and Controllers are framework-agnostic
7. **Easier Debugging**: Clear data flow makes bugs easier to trace
8. **Future-Proof**: Adding new Views or Controllers doesn't require changing Models

### Testing Strategy

- **Unit Tests**:
  - Rust core (planar conversion, color conversion, packing)
  - Models (event emission, state management)
  - Controllers (business logic, command execution)
- **Integration Tests**:
  - WASM bindings (JavaScript ↔ Rust)
  - Model → View event flow
  - View → Controller → Model interaction
- **Manual Testing**: Views (visual rendering and user interaction)
- **E2E Testing**: Full MVC workflow in standalone app

### Performance Considerations

- WASM for performance-critical operations (planar conversion)
- Canvas rendering optimized with `requestAnimationFrame`
- Debounced updates for sliders and continuous operations
- IndexedDB for efficient local storage

### Browser Compatibility

- Target modern browsers with Web Components support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14+)
- No IE11 support (Web Components not polyfillable)

---

© 2025 Connor Nolan
