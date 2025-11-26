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
- **Web Components** for UI components (framework-agnostic, reusable)
- **Class-based utilities** for business logic (state management, rendering, export)
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
    │   ├── components/                  # Reusable Web Components
    │   │   ├── TileCanvas/
    │   │   │   ├── TileCanvas.js       # Web Component implementation
    │   │   │   ├── TileCanvas.css      # Component styles
    │   │   │   └── index.js            # Component exports
    │   │   ├── PaletteEditor/
    │   │   │   ├── PaletteEditor.js
    │   │   │   ├── PaletteEditor.css
    │   │   │   └── index.js
    │   │   ├── ColorPicker/
    │   │   │   ├── ColorPicker.js      # RGB555 color picker
    │   │   │   ├── ColorPicker.css
    │   │   │   └── index.js
    │   │   ├── TilemapEditor/
    │   │   │   ├── TilemapEditor.js
    │   │   │   ├── TilemapEditor.css
    │   │   │   └── index.js
    │   │   └── ToolPanel/
    │   │       ├── ToolPanel.js
    │   │       ├── ToolPanel.css
    │   │       └── index.js
    │   ├── lib/                         # Utilities (class-based)
    │   │   ├── wasm-loader.js          # WASM initialization
    │   │   ├── EditorState.js          # State management
    │   │   ├── CanvasRenderer.js       # Canvas rendering utilities
    │   │   ├── ExportManager.js        # Export logic
    │   │   └── storage.js              # IndexedDB wrapper
    │   ├── styles/                      # Shared styles
    │   │   ├── tokens.css              # CSS custom properties
    │   │   ├── reset.css               # CSS reset
    │   │   └── common.css              # Shared component styles
    │   ├── standalone/                  # Standalone web app
    │   │   ├── index.html
    │   │   ├── app.js                  # Main app logic (vanilla JS)
    │   │   └── styles.css              # App-specific styles
    │   └── react/                       # React wrappers (future)
    │       ├── TileCanvasReact.jsx
    │       ├── PaletteEditorReact.jsx
    │       ├── ColorPickerReact.jsx
    │       ├── TilemapEditorReact.jsx
    │       ├── ToolPanelReact.jsx
    │       └── index.js                # Export all React components
    └── dist/                            # Build output
```

## Component Architecture

### Hybrid Approach: Web Components + Class-based Utilities

**Web Components** are used for all visual UI elements:

- Framework-agnostic (works in vanilla JS, React, Vue, etc.)
- Encapsulated styling with Shadow DOM
- Custom events for communication
- HTML attributes for configuration

**Class-based utilities** handle business logic:

- State management
- Rendering algorithms
- Export/import operations
- Data transformations

### Example: TileCanvas Web Component

```javascript
// ui/src/components/TileCanvas/TileCanvas.js
class TileCanvas extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.zoom = 16;
    this.gridEnabled = true;
    this.activePalette = 0;
  }

  connectedCallback() {
    this.render();
    this.setupCanvas();
    this.attachEventListeners();
  }

  static get observedAttributes() {
    return ["zoom", "grid", "active-palette"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "zoom") {
      this.zoom = parseInt(newValue);
      this.redraw();
    }
    if (name === "grid") {
      this.gridEnabled = newValue === "true";
      this.redraw();
    }
    if (name === "active-palette") {
      this.activePalette = parseInt(newValue);
      this.redraw();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./TileCanvas.css">
      <div class="tile-canvas-container">
        <canvas id="canvas" width="128" height="128"></canvas>
      </div>
    `;
  }

  setupCanvas() {
    this.canvas = this.shadowRoot.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d", { alpha: false });
    this.initializeWasm();
  }

  async initializeWasm() {
    const { TileEditor } = await import("../../lib/wasm-loader.js");
    this.editor = new TileEditor();
    this.redraw();
  }

  setPixel(x, y, colorIndex) {
    this.editor.set_pixel(x, y, colorIndex);
    this.redraw();
    this.dispatchEvent(
      new CustomEvent("pixel-changed", {
        detail: { x, y, colorIndex },
        bubbles: true,
        composed: true,
      }),
    );
  }

  redraw() {
    // Render tile to canvas using WASM editor
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const colorIdx = this.editor.get_pixel(x, y);
        const rgb = this.editor.get_color_rgb(this.activePalette, colorIdx);
        this.ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        this.ctx.fillRect(x * this.zoom, y * this.zoom, this.zoom, this.zoom);
      }
    }

    if (this.gridEnabled) {
      this.drawGrid();
    }
  }

  drawGrid() {
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const pos = i * this.zoom;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, 8 * this.zoom);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(8 * this.zoom, pos);
      this.ctx.stroke();
    }
  }

  attachEventListeners() {
    let isDrawing = false;

    this.canvas.addEventListener("mousedown", (e) => {
      isDrawing = true;
      this.handleDraw(e);
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (isDrawing) this.handleDraw(e);
    });

    this.canvas.addEventListener("mouseup", () => {
      isDrawing = false;
    });
  }

  handleDraw(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.zoom);
    const y = Math.floor((e.clientY - rect.top) / this.zoom);

    if (x >= 0 && x < 8 && y >= 0 && y < 8) {
      this.setPixel(x, y, this.activeColorIndex || 0);
    }
  }
}

customElements.define("tile-canvas", TileCanvas);
export default TileCanvas;
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

    <script type="module" src="./app.js"></script>
  </body>
</html>
```

```javascript
// ui/src/standalone/app.js
import "../components/TileCanvas/TileCanvas.js";
import "../components/PaletteEditor/PaletteEditor.js";
import "../components/ColorPicker/ColorPicker.js";
import "../components/ToolPanel/ToolPanel.js";

// Initialize components
const tileCanvas = document.getElementById("tile-canvas");
const paletteEditor = document.getElementById("palette");
const colorPicker = document.getElementById("color-picker");
const toolPanel = document.getElementById("tools");

// Wire up events
tileCanvas.addEventListener("pixel-changed", (e) => {
  console.log("Pixel changed:", e.detail);
});

paletteEditor.addEventListener("color-selected", (e) => {
  tileCanvas.activeColorIndex = e.detail.colorIndex;
  colorPicker.setAttribute("color-index", e.detail.colorIndex);
});

colorPicker.addEventListener("color-changed", (e) => {
  paletteEditor.updateColor(
    e.detail.paletteIdx,
    e.detail.colorIdx,
    e.detail.r,
    e.detail.g,
    e.detail.b,
  );
  tileCanvas.redraw();
});

toolPanel.addEventListener("tool-selected", (e) => {
  console.log("Tool selected:", e.detail.tool);
});

// File operations
document.getElementById("save-file").addEventListener("click", () => {
  // Export project data
  const data = {
    tile: tileCanvas.editor.export_planar(),
    palette: paletteEditor.exportPalette(),
  };
  // Save to IndexedDB or download
});
```

### Usage in React (Future Semikit Website)

```jsx
// ui/src/react/TileCanvasReact.jsx
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

```jsx
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

#### 2.2 - TileEditor WASM Bindings

- Implement `TileEditor` struct in `web/src/lib.rs`
- Expose pixel manipulation methods: `set_pixel()`, `get_pixel()`
- Expose tile import/export: `export_planar()`, `import_planar()`
- Expose color methods: `get_color_rgb()`, `set_color()`
- Expose palette methods: `export_palette()`, `import_palette()`
- Set up panic hook for better debugging in browser

#### 2.3 - WASM Module Building & Testing

- Build WASM module with `wasm-pack build --target web`
- Create simple HTML test page to verify WASM loads correctly
- Test all exposed methods from JavaScript console
- Verify memory management (no leaks with repeated calls)

**Deliverable:** Working WASM module with JavaScript API

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

- Create `ui/src/lib/wasm-loader.js`
- Implement async WASM module initialization
- Export singleton instance for components to use
- Add error handling for WASM load failures

**Deliverable:** UI build system with design tokens and WASM loader

---

### Stage 4: TileCanvas Component (MVP)

**Goal:** Create the first working component - the tile editing canvas

**Tasks:**

#### 4.1 - TileCanvas Web Component Structure

- Create `ui/src/components/TileCanvas/` directory
- Implement basic Web Component class structure
- Set up Shadow DOM
- Implement `connectedCallback()` lifecycle

#### 4.2 - Canvas Setup & Rendering

- Create canvas element in Shadow DOM
- Initialize 2D rendering context
- Implement `redraw()` method to render tile from WASM
- Implement pixel-perfect rendering at configurable zoom
- Add image-rendering CSS for crisp pixels

#### 4.3 - Grid Overlay

- Implement `drawGrid()` method
- Make grid toggleable via attribute
- Style grid with semi-transparent lines

#### 4.4 - Mouse Interaction

- Implement mouse event listeners (mousedown, mousemove, mouseup)
- Convert mouse coordinates to tile pixel coordinates
- Implement basic pencil drawing tool
- Add drawing state management (isDrawing flag)

#### 4.5 - Component Attributes & Events

- Implement `observedAttributes` for reactive updates
- Add `zoom`, `grid`, `active-palette` attributes
- Dispatch custom `pixel-changed` event
- Add component styles in `TileCanvas.css`

**Deliverable:** Working tile canvas where users can draw with a pencil tool

---

### Stage 5: PaletteEditor Component

**Goal:** Allow users to view and select colors from a palette

**Tasks:**

#### 5.1 - PaletteEditor Structure

- Create `ui/src/components/PaletteEditor/` directory
- Implement Web Component class
- Set up Shadow DOM with grid layout

#### 5.2 - Palette Grid Rendering

- Render 16 color swatches for active sub-palette
- Display colors using data from WASM
- Highlight selected color
- Show color index numbers

#### 5.3 - Color Selection

- Implement click handlers for color swatches
- Track selected color index
- Dispatch `color-selected` custom event
- Update visual selection indicator

#### 5.4 - Sub-Palette Switching

- Add sub-palette selector dropdown (0-15)
- Update displayed colors when sub-palette changes
- Persist selected sub-palette

#### 5.5 - Styling

- Create `PaletteEditor.css` with grid layout
- Style color swatches with borders and hover effects
- Add selection highlighting
- Add transparency indicator for color index 0

**Deliverable:** Palette viewer with color selection

---

### Stage 6: ColorPicker Component

**Goal:** Allow users to edit individual colors in RGB555 format

**Tasks:**

#### 6.1 - ColorPicker Structure

- Create `ui/src/components/ColorPicker/` directory
- Implement Web Component class
- Set up Shadow DOM with form layout

#### 6.2 - RGB555 Sliders

- Create three range inputs for R, G, B (0-31 range)
- Display current color value as RGB555 hex
- Show live color preview swatch
- Display 8-bit RGB values for reference

#### 6.3 - Color Editing

- Load current color when selection changes
- Update WASM palette when sliders change
- Dispatch `color-changed` custom event
- Debounce slider updates for performance

#### 6.4 - Hex Input (Optional)

- Add text input for direct RGB555 hex entry
- Validate hex input format
- Update sliders from hex input

#### 6.5 - Styling

- Create `ColorPicker.css`
- Style sliders with custom track colors
- Add color preview swatch
- Show value labels

**Deliverable:** Functional RGB555 color editor

---

### Stage 7: Standalone App Integration

**Goal:** Wire up components into a working standalone application

**Tasks:**

#### 7.1 - HTML Structure

- Create `ui/src/standalone/index.html`
- Set up semantic HTML structure (header, main, aside)
- Create layout grid for component placement
- Add navigation buttons (New, Save, Export)

#### 7.2 - Component Integration

- Create `ui/src/standalone/app.js`
- Import all Web Components
- Initialize component instances
- Wire up event listeners between components

#### 7.3 - Component Communication

- Connect TileCanvas ↔ PaletteEditor (color selection)
- Connect PaletteEditor ↔ ColorPicker (color editing)
- Connect ColorPicker → TileCanvas (trigger redraw on color change)
- Implement shared state management

#### 7.4 - Layout & Styling

- Create `ui/src/standalone/styles.css`
- Implement responsive layout
- Style header and navigation
- Add panel styling for component containers

#### 7.5 - WASM Integration

- Initialize WASM module on page load
- Pass WASM instance to all components
- Add loading state while WASM initializes
- Handle WASM initialization errors

**Deliverable:** Working standalone tile editor with all core features

---

### Stage 8: ToolPanel & Drawing Tools

**Goal:** Add additional drawing tools beyond basic pencil

**Tasks:**

#### 8.1 - ToolPanel Component

- Create `ui/src/components/ToolPanel/` directory
- Implement Web Component class
- Add tool selection buttons (Pencil, Fill, Line, Rectangle)
- Dispatch `tool-selected` event

#### 8.2 - Fill Tool

- Implement flood fill algorithm
- Add fill tool to TileCanvas
- Handle fill on mouse click

#### 8.3 - Line Tool

- Implement Bresenham's line algorithm
- Add line drawing mode to TileCanvas
- Show preview line while dragging

#### 8.4 - Rectangle Tool

- Implement rectangle drawing (filled and outline)
- Add mode toggle for filled vs outline
- Show preview rectangle while dragging

#### 8.5 - Tool Options

- Add tool-specific options (e.g., filled vs outline for rectangle)
- Add grid toggle checkbox
- Add zoom slider

**Deliverable:** Complete drawing toolset

---

### Stage 9: File Operations & Export

**Goal:** Enable saving, loading, and exporting work

**Tasks:**

#### 9.1 - Export Manager Utility

- Create `ui/src/lib/ExportManager.js` class
- Implement binary tile data export (.bin)
- Implement binary palette export (.pal)
- Implement C header generation
- Implement Assembly header generation

#### 9.2 - File Download

- Implement browser file download functionality
- Add download buttons to UI
- Generate appropriate filenames with extensions

#### 9.3 - Project Format

- Define JSON-based project file format
  - Tile data (planar format base64 encoded)
  - Palette data (RGB555 values)
  - Metadata (name, version, etc.)
- Implement project serialization/deserialization

#### 9.4 - IndexedDB Storage

- Create `ui/src/lib/storage.js` wrapper
- Implement auto-save to IndexedDB
- Add save/load UI
- Show list of saved projects

#### 9.5 - File Import

- Add file input for loading projects
- Parse and validate project files
- Load tile and palette data into WASM
- Trigger component updates

**Deliverable:** Complete file management system

---

### Stage 10: Tile Bank

**Goal:** Manage multiple tiles instead of just one

**Tasks:**

#### 10.1 - Tile Bank Data Structure

- Extend WASM bindings to support multiple tiles
- Implement tile array/vector in TileEditor
- Add methods: `add_tile()`, `delete_tile()`, `get_tile()`, `set_active_tile()`

#### 10.2 - Tile Bank UI Component

- Create mini-grid of tile thumbnails
- Implement tile selection
- Add new/delete tile buttons
- Show active tile indicator

#### 10.3 - Tile Operations

- Implement copy/paste tiles
- Implement duplicate tile
- Implement clear tile
- Add tile reordering (drag & drop)

#### 10.4 - Tile Bank Integration

- Update TileCanvas to work with active tile from bank
- Update file operations to save/load all tiles
- Export all tiles in batch

**Deliverable:** Multi-tile editing capability

---

### Stage 11: TilemapEditor Component

**Goal:** Arrange tiles into tilemaps

**Tasks:**

#### 11.1 - TilemapEditor Component Structure

- Create `ui/src/components/TilemapEditor/` directory
- Implement Web Component class
- Create canvas for tilemap display

#### 11.2 - Tilemap Rendering

- Render grid of tiles from Tile Bank
- Implement scrolling/panning
- Show tile boundaries
- Render with proper palette per tile

#### 11.3 - Tile Placement

- Implement tile selection from bank
- Place tiles on click
- Show tile preview while hovering

#### 11.4 - Tile Attributes

- Add attribute editing panel
- Implement H-Flip toggle
- Implement V-Flip toggle
- Implement palette selection (0-7)
- Implement priority toggle

#### 11.5 - Tilemap Export

- Export tilemap as binary data
- Export as C/Assembly arrays
- Include tilemap dimensions in export

**Deliverable:** Complete tilemap editor

---

### Stage 12: Advanced Features & Polish

**Goal:** Add quality-of-life features and polish

**Tasks:**

#### 12.1 - Undo/Redo System

- Implement command pattern for actions
- Add undo/redo stack
- Wire up keyboard shortcuts (Ctrl+Z, Ctrl+Y)

#### 12.2 - Keyboard Shortcuts

- Add keyboard navigation
- Implement tool hotkeys (P=Pencil, F=Fill, etc.)
- Add color selection shortcuts (0-9 for first 10 colors)

#### 12.3 - PNG Import/Export

- Implement PNG import with palette quantization
- Implement PNG export of current tile
- Support batch PNG export of tile bank

#### 12.4 - UI Polish

- Add tooltips to all buttons and controls
- Improve loading states
- Add error messages for invalid operations
- Improve responsive layout for different screen sizes

#### 12.5 - Testing & Bug Fixes

- Test all features end-to-end
- Fix rendering bugs
- Optimize performance
- Test on different browsers

**Deliverable:** Polished, production-ready standalone app

---

### Stage 13: React Wrappers

**Goal:** Create React components for semikit website integration

**Tasks:**

#### 13.1 - React Wrapper Components

- Create `ui/src/react/TileCanvasReact.jsx`
- Create `ui/src/react/PaletteEditorReact.jsx`
- Create `ui/src/react/ColorPickerReact.jsx`
- Create `ui/src/react/ToolPanelReact.jsx`
- Create `ui/src/react/TilemapEditorReact.jsx`

#### 13.2 - React Integration Patterns

- Implement proper useEffect cleanup
- Handle ref management for Web Components
- Implement prop → attribute synchronization
- Convert custom events to React callbacks

#### 13.3 - React Example Page

- Create example React app demonstrating usage
- Document all component props
- Show event handling patterns

#### 13.4 - TypeScript Definitions

- Create `.d.ts` files for all components
- Type all props and events
- Document component APIs

**Deliverable:** React-ready component library

---

### Stage 14: Documentation & Publishing

**Goal:** Prepare for public release and npm publishing

**Tasks:**

#### 14.1 - Documentation

- Write comprehensive README
- Document all Web Components (attributes, events, methods)
- Document React wrappers
- Create usage examples
- Write integration guide for semikit website

#### 14.2 - API Documentation

- Document WASM API
- Document export formats
- Document file formats
- Create Cicada-16 integration guide

#### 14.3 - Build & Package

- Configure production build
- Optimize WASM size
- Minify JavaScript/CSS
- Generate source maps

#### 14.4 - NPM Publishing

- Finalize `package.json` metadata
- Create `.npmignore`
- Publish to npm as `semitile-ui`
- Verify package installation and imports

#### 14.5 - Demo Deployment

- Deploy standalone app to GitHub Pages or Netlify
- Create public demo URL
- Add demo to semikit website

**Deliverable:** Published npm package and public demo

---

### Stage 15: Future Iterations

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

1. **Core → WASM → UI**: Building from the inside out ensures a solid foundation
2. **MVP First**: TileCanvas + PaletteEditor + ColorPicker = minimum viable product
3. **Iterative**: Each stage produces a working artifact
4. **Testable**: Each component can be tested independently

### Testing Strategy

- **Unit Tests**: Rust core (planar conversion, color conversion, packing)
- **Integration Tests**: WASM bindings (JavaScript ↔ Rust)
- **Manual Testing**: Web Components (visual and interaction)
- **E2E Testing**: Standalone app (full workflow)

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
