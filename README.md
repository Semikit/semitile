# Semitile

**A web-based tile and tilemap editor for the Cicada-16 fantasy console**

Semitile is a focused, browser-based tool for creating graphics assets for the Cicada-16 system. It provides an accessible entry point for users to create tiles, palettes, and tilemaps without requiring any installation.

![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)

## Features

- **Tile Editing** - 8×8 pixel tile editor with pencil, fill, line, and rectangle tools
- **4bpp Planar Format** - Native support for Cicada-16's 4-bit planar tile encoding
- **RGB555 Palette System** - 16 sub-palettes of 16 colors each (256 total colors)
- **Tilemap Editor** - Arrange tiles into scenes with support for all Cicada-16 BG_MODE sizes
- **Screen Viewport Overlay** - Visualize the 30×20 tile (240×160 pixel) screen area with draggable overlay and SCX0/SCY0 register values
- **Tile Attributes** - Configure palette, horizontal/vertical flip, and priority per tile
- **Multi-Tile Management** - Tile bank with add, delete, duplicate, and reorder operations
- **Multi-Tilemap Support** - Create and manage multiple tilemaps in a single project
- **Export Formats** - Binary, C headers, Assembly, and PNG exports for tiles, palettes, and tilemaps
- **Project Management** - Save/load projects to browser storage or export as JSON
- **Undo/Redo** - Full command history for all editing operations
- **MVC Architecture** - Clean separation of Models, Views, and Controllers
- **React Components** - Framework-agnostic Web Components with React wrappers
- **WASM Core** - Rust-based core for fast tile/palette operations

## Quick Start

### Running the Standalone Web Application

The easiest way to use Semitile is through the standalone web application:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/semikit-org/semitile.git
   cd semitile
   ```

2. **Build the WASM core:**

   ```bash
   cd web
   wasm-pack build --target web
   cd ..
   ```

3. **Install UI dependencies:**

   ```bash
   cd ui
   npm install
   ```

4. **Start the development server:**

   ```bash
   # (in ui/ directory)
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173/src/standalone/` (or the URL shown in the terminal)

The standalone application will load with a full tile and tilemap editor interface.

### Building for Production

To create a production build of the standalone application:

```bash
cd ui
npm run build
```

The built files will be in `ui/dist/` and can be served from any static web server.

## Integrating React Components

Semitile's UI components can be integrated into React applications using the provided React wrappers.

### Installation

First, install Semitile UI and React dependencies in your project:

```bash
npm install react react-dom
```

Then, build the Semitile WASM module and copy it to your project:

```bash
# In the semitile repository
cd web
wasm-pack build --target web

# Copy the built WASM files to your project
cp -r pkg/ /path/to/your/project/public/wasm/
```

Copy the Semitile UI source files to your project:

```bash
# Copy the UI source to your project
cp -r ui/src/ /path/to/your/project/src/semitile-ui/
```

### Basic Usage Example

```tsx
import React, { useEffect, useState } from "react";
import { initWasm } from "./semitile-ui/lib/wasm-loader";
import { TileBankModel, PaletteModel, EditorState } from "./semitile-ui/models";
import {
  TileCanvasReact,
  PaletteEditorReact,
  ColorPickerReact,
  ToolPanelReact,
  useTileBankModel,
  usePaletteModel,
  useEditorState,
} from "./semitile-ui/react";

function TileEditorApp() {
  const [models, setModels] = useState(null);

  // Initialize WASM and create Models
  useEffect(() => {
    async function init() {
      const wasm = await initWasm();
      const tileBankModel = new TileBankModel();
      const paletteModel = new PaletteModel(new wasm.WasmPalette());
      const editorState = new EditorState();

      setModels({ tileBankModel, paletteModel, editorState });
    }
    init();
  }, []);

  if (!models) return <div>Loading WASM...</div>;

  return (
    <EditorContent
      tileBankModel={models.tileBankModel}
      paletteModel={models.paletteModel}
      editorState={models.editorState}
    />
  );
}

function EditorContent({ tileBankModel, paletteModel, editorState }) {
  // Hooks sync React state with Models (triggers re-renders on Model changes)
  useTileBankModel(tileBankModel);
  usePaletteModel(paletteModel);
  useEditorState(editorState);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr 200px",
        gap: "20px",
      }}
    >
      {/* Left Panel - Tools */}
      <div>
        <ToolPanelReact editorState={editorState} />
      </div>

      {/* Center Panel - Tile Canvas */}
      <div>
        <TileCanvasReact
          tileBankModel={tileBankModel}
          paletteModel={paletteModel}
          editorState={editorState}
        />
      </div>

      {/* Right Panel - Palette */}
      <div>
        <PaletteEditorReact paletteModel={paletteModel} />
        <ColorPickerReact paletteModel={paletteModel} />
      </div>
    </div>
  );
}

export default TileEditorApp;
```

### Available React Components

All Semitile components are available as React wrappers:

- `TileCanvasReact` - Tile editing canvas
- `PaletteEditorReact` - Palette grid viewer
- `ColorPickerReact` - RGB555 color picker
- `ToolPanelReact` - Tool selection panel
- `TileBankReact` - Tile bank management
- `TilemapEditorReact` - Tilemap editing canvas
- `TilemapBankReact` - Tilemap bank management
- `TileAttributesPanelReact` - Tile attributes panel

### React Hooks

Semitile provides hooks for syncing React state with Models:

- `useTileBankModel(model)` - Syncs with TileBankModel
- `usePaletteModel(model)` - Syncs with PaletteModel
- `useEditorState(model)` - Syncs with EditorState
- `useTilemapModel(model)` - Syncs with TilemapModel

See `ui/src/react/README.md` for complete React integration documentation.

## Architecture

Semitile uses a **Model-View-Controller (MVC)** architecture:

### Models (Observable State)

- Single source of truth for all application data
- Emit events when state changes
- Integrate with WASM for performance-critical operations
- Framework-agnostic (can be used in any JavaScript framework)

### Views (Web Components)

- Pure presentation components
- Listen to Model events and re-render when state changes
- Dispatch user interaction events to Controllers
- Framework-agnostic custom elements with Shadow DOM
- Can be used directly or wrapped for React/Vue/etc.

### Controllers (Business Logic)

- Coordinate between Views and Models
- Handle user interaction events from Views
- Update Models based on user actions
- Contain tool logic, validation, and business rules

### WASM Core (Rust)

- High-performance tile/palette operations
- 4bpp planar encoding/decoding
- RGB555 color conversion
- Tilemap encoding

## Project Structure

```
semitile/
├── web/                           # WASM module (Rust → WebAssembly)
│   ├── src/
│   │   └── lib.rs                # WASM bindings
│   └── Cargo.toml
├── ui/                            # UI components (TypeScript)
│   ├── src/
│   │   ├── models/               # MODEL LAYER - Observable state
│   │   │   ├── TileBankModel.ts
│   │   │   ├── PaletteModel.ts
│   │   │   ├── EditorState.ts
│   │   │   └── TilemapModel.ts
│   │   ├── views/                # VIEW LAYER - Web Components
│   │   │   ├── TileCanvas/
│   │   │   ├── PaletteEditor/
│   │   │   ├── ColorPicker/
│   │   │   ├── ToolPanel/
│   │   │   └── TilemapEditor/
│   │   ├── controllers/          # CONTROLLER LAYER - Business logic
│   │   │   ├── TileEditorController.ts
│   │   │   ├── PaletteController.ts
│   │   │   └── TilemapController.ts
│   │   ├── standalone/           # Standalone web app
│   │   │   ├── index.html
│   │   │   ├── app.ts
│   │   │   └── styles.css
│   │   ├── react/                # React wrappers
│   │   │   ├── hooks/
│   │   │   ├── TileCanvasReact.tsx
│   │   │   └── ...
│   │   └── lib/                  # Utilities
│   │       └── wasm-loader.ts
│   ├── package.json
│   └── vite.config.js
└── cicada-16/                     # Cicada-16 hardware specs
    └── HardwareSpec/
        └── PPU_Architecture.md    # PPU specification
```

## Development

### Prerequisites

- **Rust** (for WASM compilation) - Install from [rustup.rs](https://rustup.rs)
- **wasm-pack** - Install with `cargo install wasm-pack`
- **Node.js** (v20.19+ or v22.12+) - For UI development
- **npm** or **yarn** - Package manager

### Building WASM Module

```bash
cd web
wasm-pack build --target web
```

This generates the WASM module in `web/pkg/` which the UI will import.

### Running the Development Server

```bash
cd ui
npm install
npm run dev
```

Open `http://localhost:5173/src/standalone/` in your browser.

### Building for Production

```bash
# Build WASM
cd web
wasm-pack build --target web --release

# Build UI
cd ../ui
npm run build
```

### Running Tests

```bash
# Test WASM core
cd web
cargo test

# Test UI (if tests are added)
cd ../ui
npm test
```

## Cicada-16 Specifications

Semitile is designed specifically for the Cicada-16 fantasy console and follows its hardware specifications:

- **Tile Format**: 8×8 pixels, 4bpp planar encoding (32 bytes per tile)
- **Palette**: RGB555 color format (16-bit per color)
- **Sub-Palettes**: 16 sub-palettes of 16 colors each (256 total)
- **Tilemap Entry**: 16-bit format with tile index, palette select, flips, and priority
- **BG_MODE Sizes**: 32×32, 64×32, 32×64, 64×64 tiles

See `cicada-16/HardwareSpec/PPU_Architecture.md` for complete PPU specifications.

## Export Formats

Semitile can export assets in multiple formats:

### Binary Exports

- **Tile Binary (.bin)** - Raw 32-byte planar format per tile
- **Palette Binary (.bin)** - 512 bytes (256 colors × 2 bytes RGB555)
- **Tilemap Binary (.bin)** - 2 bytes per entry, little-endian

### C Header Exports

- **Tile C Header (.h)** - C array with planar tile data
- **Palette C Header (.h)** - C array with RGB555 palette data
- **Tilemap C Header (.h)** - C array with tilemap entries

### Assembly Exports

- **Tile Assembly (.asm)** - Assembly data directives
- **Palette Assembly (.asm)** - Assembly data directives
- **Tilemap Assembly (.asm)** - Assembly data directives

### Image Exports

- **Tilemap PNG (.png)** - Rendered tilemap as PNG image with configurable pixel size

### Project Format

- **Project JSON (.json)** - Complete project with all tiles, palettes, and tilemaps

All binary formats are compatible with direct DMA loading to Cicada-16 VRAM/CRAM.

## Browser Compatibility

Semitile requires modern browser features:

- ✅ **Chrome/Edge** 90+ - Full support
- ✅ **Firefox** 88+ - Full support
- ✅ **Safari** 14+ - Full support
- ❌ **Internet Explorer** - Not supported (Web Components not polyfillable)

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

Copyright (C) 2025 Connor Nolan (connor@cnolandev.com)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## Related Projects

- **Cicada-16** - The fantasy console system that Semitile targets
- **Semikit** - Comprehensive development toolkit for Cicada-16
- **Semikit Studio** - Desktop IDE for Cicada-16 development (planned)

## Acknowledgments

- Inspired by classic tile editors for retro game consoles
- Built with modern web technologies for accessibility and ease of use
- Designed to complement the Cicada-16 hardware architecture

## Support

For questions, issues, or feature requests:

- Open an issue on [GitHub Issues](https://github.com/semikit-org/semitile/issues)
- Contact: connor@cnolandev.com
