# Semitile React Components

React wrappers for Semitile Web Components with MVC architecture support.

## Installation

```bash
npm install semitile-ui react react-dom
```

## Overview

Semitile provides:
- **Web Components** - Framework-agnostic UI components
- **Models** - Observable state containers with WASM integration
- **Controllers** - Business logic coordinators
- **React Wrappers** - React-friendly components that wrap Web Components
- **React Hooks** - Hooks for syncing React state with Models

## Quick Start

```tsx
import React, { useEffect, useState } from 'react';
import { initWasm } from 'semitile-ui/wasm';
import { TileBankModel, PaletteModel, EditorState } from 'semitile-ui/models';
import {
  TileCanvasReact,
  PaletteEditorReact,
  useTileBankModel,
  usePaletteModel,
  useEditorState
} from 'semitile-ui/react';

function TileEditor() {
  const [models, setModels] = useState<{
    tileBankModel: TileBankModel;
    paletteModel: PaletteModel;
    editorState: EditorState;
  } | null>(null);

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

  if (!models) return <div>Loading...</div>;

  return (
    <EditorContent
      tileBankModel={models.tileBankModel}
      paletteModel={models.paletteModel}
      editorState={models.editorState}
    />
  );
}

function EditorContent({ tileBankModel, paletteModel, editorState }) {
  // Use hooks to sync React state with Models
  useTileBankModel(tileBankModel);
  usePaletteModel(paletteModel);
  useEditorState(editorState);

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <TileCanvasReact
        tileBankModel={tileBankModel}
        paletteModel={paletteModel}
        editorState={editorState}
      />
      <PaletteEditorReact paletteModel={paletteModel} />
    </div>
  );
}

export default TileEditor;
```

## React Hooks

### useModelState(model, events)

Base hook that synchronizes Model state with React component state.

```tsx
import { useModelState } from 'semitile-ui/react';

function MyComponent({ tileModel }) {
  // Re-render when tileModel emits 'pixelChanged' or 'tileCleared'
  useModelState(tileModel, ['pixelChanged', 'tileCleared']);

  return <div>Pixel: {tileModel.getPixel(0, 0)}</div>;
}
```

### useTileBankModel(model)

Hook for TileBankModel. Listens to:
- `tileChanged`
- `tileAdded`
- `tileDeleted`
- `activeTileChanged`
- `tileBankImported`

```tsx
import { useTileBankModel } from 'semitile-ui/react';

function MyComponent({ tileBankModel }) {
  useTileBankModel(tileBankModel);

  const activeTile = tileBankModel.getActiveTileIndex();
  const tileCount = tileBankModel.getTileCount();

  return <div>Active: {activeTile} / Total: {tileCount}</div>;
}
```

### usePaletteModel(model)

Hook for PaletteModel. Listens to:
- `colorChanged`
- `colorSelected`
- `subPaletteChanged`
- `paletteImported`

### useEditorState(model)

Hook for EditorState. Listens to:
- `toolChanged`
- `zoomChanged`
- `gridToggled`

### useTilemapModel(model)

Hook for TilemapModel. Listens to:
- `entryChanged`
- `tilemapResized`
- `tilemapCleared`
- `tilemapFilled`
- `tilemapImported`

## React Components

### TileCanvasReact

Renders the tile editing canvas.

**Props:**
- `tileBankModel: TileBankModel` - Required
- `paletteModel: PaletteModel` - Required
- `editorState: EditorState` - Required
- `onDrawStart?: (detail: { x, y }) => void` - Drawing started callback
- `onDrawMove?: (detail: { x, y }) => void` - Drawing move callback
- `onDrawEnd?: (detail: { x, y }) => void` - Drawing ended callback

```tsx
<TileCanvasReact
  tileBankModel={tileBankModel}
  paletteModel={paletteModel}
  editorState={editorState}
  onDrawStart={({ x, y }) => console.log('Draw at', x, y)}
/>
```

### PaletteEditorReact

Displays palette grid and allows color selection.

**Props:**
- `paletteModel: PaletteModel` - Required
- `onColorSelect?: (detail: { colorIndex }) => void`
- `onSubPaletteChange?: (detail: { subPaletteIndex }) => void`

### ColorPickerReact

RGB555 color picker with sliders.

**Props:**
- `paletteModel: PaletteModel` - Required
- `onColorEdit?: (detail: { paletteIdx, colorIdx, r, g, b }) => void`

### ToolPanelReact

Tool selection panel (pencil, fill, line, rectangle).

**Props:**
- `editorState: EditorState` - Required
- `onToolSelected?: (detail: { tool }) => void`
- `onZoomChanged?: (detail: { zoom }) => void`
- `onGridToggled?: (detail: { enabled }) => void`

### TileBankReact

Tile bank management UI.

**Props:**
- `tileBankModel: TileBankModel` - Required
- `paletteModel: PaletteModel` - Required
- `onTileAdd?: () => void`
- `onTileSelect?: (detail: { index }) => void`
- `onTileDuplicate?: (detail: { index }) => void`
- `onTileDelete?: (detail: { index }) => void`

### TilemapEditorReact

Tilemap editing canvas.

**Props:**
- `tilemapModel: TilemapModel` - Required
- `tileBankModel: TileBankModel` - Required
- `paletteModel: PaletteModel` - Required
- `onTilePlaceStart?: (detail: { x, y }) => void`
- `onTilePlaceMove?: (detail: { x, y }) => void`
- `onTilePlaceEnd?: (detail: { x, y }) => void`

### TilemapBankReact

Tilemap bank management UI.

**Props:**
- `tilemapBankModel: TilemapBankModel` - Required
- `onTilemapAdd?: () => void`
- `onTilemapSelect?: (detail: { index }) => void`
- `onTilemapDuplicate?: (detail: { index }) => void`
- `onTilemapDelete?: (detail: { index }) => void`

### TileAttributesPanelReact

Tile attribute controls (palette, flips, priority).

**Props:**
- `onPaletteChanged?: (detail: { paletteIdx }) => void`
- `onHFlipChanged?: (detail: { hFlip }) => void`
- `onVFlipChanged?: (detail: { vFlip }) => void`
- `onPriorityChanged?: (detail: { priority }) => void`

## MVC Architecture

Semitile uses the Model-View-Controller pattern:

### Models (Observable State)

Models are the single source of truth. They emit events when state changes.

```tsx
// Models emit events
tileBankModel.setPixel(0, 0, 5); // Emits 'pixelChanged' event
paletteModel.setColor(0, 1, 255, 0, 0); // Emits 'colorChanged' event
```

### Views (React Components)

React components use hooks to listen to Model events and automatically re-render.

```tsx
function MyView({ tileBankModel }) {
  // Hook makes component re-render on Model changes
  useTileBankModel(tileBankModel);

  // Always reads latest state
  return <div>{tileBankModel.getPixel(0, 0)}</div>;
}
```

### Controllers (Business Logic)

Controllers handle user interactions and update Models.

```tsx
import { TileEditorController } from 'semitile-ui/controllers';

const controller = new TileEditorController(
  tileBankModel,
  paletteModel,
  editorState,
  tileCanvasElement
);

// Controller handles drawing, tools, undo/redo, etc.
controller.undo();
controller.redo();
controller.clear();
```

## Complete Example

```tsx
import React, { useEffect, useState } from 'react';
import { initWasm } from 'semitile-ui/wasm';
import {
  TileBankModel,
  PaletteModel,
  EditorState,
  TilemapBankModel
} from 'semitile-ui/models';
import {
  TileEditorController,
  PaletteController,
  TilemapController
} from 'semitile-ui/controllers';
import {
  TileCanvasReact,
  PaletteEditorReact,
  ColorPickerReact,
  ToolPanelReact,
  TileBankReact,
  TilemapEditorReact,
  useTileBankModel,
  usePaletteModel,
  useEditorState
} from 'semitile-ui/react';

function SemitileApp() {
  const [models, setModels] = useState(null);
  const [controllers, setControllers] = useState(null);

  useEffect(() => {
    async function init() {
      const wasm = await initWasm();

      // Create Models
      const tileBankModel = new TileBankModel();
      const paletteModel = new PaletteModel(new wasm.WasmPalette());
      const editorState = new EditorState();
      const tilemapBankModel = new TilemapBankModel();

      setModels({ tileBankModel, paletteModel, editorState, tilemapBankModel });
    }
    init();
  }, []);

  if (!models) return <div>Loading WASM...</div>;

  return (
    <EditorUI
      tileBankModel={models.tileBankModel}
      paletteModel={models.paletteModel}
      editorState={models.editorState}
      tilemapBankModel={models.tilemapBankModel}
    />
  );
}

function EditorUI({ tileBankModel, paletteModel, editorState, tilemapBankModel }) {
  // Use hooks to sync React state
  useTileBankModel(tileBankModel);
  usePaletteModel(paletteModel);
  useEditorState(editorState);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 200px', gap: '20px' }}>
      {/* Left Panel */}
      <div>
        <ToolPanelReact editorState={editorState} />
        <TileBankReact tileBankModel={tileBankModel} paletteModel={paletteModel} />
      </div>

      {/* Center Panel */}
      <div>
        <TileCanvasReact
          tileBankModel={tileBankModel}
          paletteModel={paletteModel}
          editorState={editorState}
        />
      </div>

      {/* Right Panel */}
      <div>
        <PaletteEditorReact paletteModel={paletteModel} />
        <ColorPickerReact paletteModel={paletteModel} />
      </div>
    </div>
  );
}

export default SemitileApp;
```

## License

GPL-3.0 - See LICENSE for details
