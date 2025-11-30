/*
 * Copyright (C) 2025 Connor Nolan connor@cnolandev.com
 *
 * This file is part of the Semikit project.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// WASM Loader
import { initWasm, WasmTile, WasmPalette } from "../lib/wasm-loader.js";

// Models
import { TileModel } from "../models/TileModel.js";
import { PaletteModel } from "../models/PaletteModel.js";
import { EditorState } from "../models/EditorState.js";

// Views
import { TileCanvas } from "../views/TileCanvas/TileCanvas.js";
import { PaletteEditor } from "../views/PaletteEditor/PaletteEditor.js";
import { ColorPicker } from "../views/ColorPicker/ColorPicker.js";
import { ToolPanel } from "../views/ToolPanel/ToolPanel.js";

// Controllers
import { TileEditorController } from "../controllers/TileEditorController.js";
import { PaletteController } from "../controllers/PaletteController.js";

/**
 * Main application entry point
 *
 * This initializes the complete MVC architecture:
 * 1. Initialize WASM module
 * 2. Create Models (single source of truth)
 * 3. Get View elements from DOM
 * 4. Create Controllers to wire Views to Models
 * 5. Set up UI event handlers
 */
async function main() {
  const loadingScreen = document.getElementById("loading-screen");
  const appContainer = document.getElementById("app-container");

  try {
    // Initialize WASM
    console.log("[App] Initializing WASM module...");
    await initWasm();
    console.log("[App] WASM module initialized");

    // ===== CREATE MODELS (Single Source of Truth) =====
    console.log("[App] Creating Models...");

    const tileModel = new TileModel(new WasmTile());
    const paletteModel = new PaletteModel(new WasmPalette());
    const editorState = new EditorState();

    console.log("[App] Models created");

    // Set up default palette
    setupDefaultPalette(paletteModel);

    // ===== GET VIEW ELEMENTS =====
    console.log("[App] Getting View elements...");

    const tileCanvas = document.getElementById("tile-canvas") as TileCanvas;
    const paletteEditor = document.getElementById("palette-editor") as PaletteEditor;
    const colorPicker = document.getElementById("color-picker") as ColorPicker;
    const toolPanel = document.getElementById("tool-panel") as ToolPanel;

    if (!tileCanvas || !paletteEditor || !colorPicker || !toolPanel) {
      throw new Error("Failed to get View elements from DOM");
    }

    console.log("[App] View elements retrieved");

    // ===== CREATE CONTROLLERS (Wire Views to Models) =====
    console.log("[App] Creating Controllers...");

    // Tile Editor Controller - handles tile editing
    const tileEditorController = new TileEditorController(
      tileModel,
      paletteModel,
      editorState,
      tileCanvas
    );

    // Palette Controller - handles palette and color editing
    const paletteController = new PaletteController(
      paletteModel,
      paletteEditor,
      colorPicker
    );

    console.log("[App] Controllers created and wired");

    // ===== WIRE UP TOOL PANEL =====
    // The ToolPanel doesn't need a Controller - we can handle its events directly
    // since it only updates EditorState

    toolPanel.setModel(editorState);

    toolPanel.addEventListener("tool-selected", (e) => {
      const customEvent = e as CustomEvent<{ tool: string }>;
      editorState.setTool(customEvent.detail.tool as any);
    });

    toolPanel.addEventListener("zoom-changed", (e) => {
      const customEvent = e as CustomEvent<{ zoom: number }>;
      editorState.setZoom(customEvent.detail.zoom);
    });

    toolPanel.addEventListener("grid-toggled", (e) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      editorState.setGridEnabled(customEvent.detail.enabled);
    });

    console.log("[App] ToolPanel wired to EditorState");

    // ===== WIRE UP NAVIGATION BUTTONS =====

    const btnClear = document.getElementById("btn-clear");
    const btnUndo = document.getElementById("btn-undo");
    const btnRedo = document.getElementById("btn-redo");

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        tileEditorController.clear();
      });
    }

    if (btnUndo) {
      btnUndo.addEventListener("click", () => {
        tileEditorController.undo();
      });
    }

    if (btnRedo) {
      btnRedo.addEventListener("click", () => {
        tileEditorController.redo();
      });
    }

    console.log("[App] Navigation buttons wired");

    // ===== HIDE LOADING, SHOW APP =====

    if (loadingScreen) {
      loadingScreen.style.display = "none";
    }

    if (appContainer) {
      appContainer.style.display = "flex";
    }

    console.log("[App] Application initialized successfully!");
    console.log("[App] MVC Architecture:");
    console.log("  Models: TileModel, PaletteModel, EditorState");
    console.log("  Views: TileCanvas, PaletteEditor, ColorPicker, ToolPanel");
    console.log("  Controllers: TileEditorController, PaletteController");
  } catch (error) {
    console.error("[App] Initialization failed:", error);

    if (loadingScreen) {
      const loadingText = loadingScreen.querySelector(".loading-text");
      if (loadingText) {
        loadingText.textContent = `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        loadingText.style.color = "#ff0088";
      }
    }
  }
}

/**
 * Set up default palette with varied colors
 */
function setupDefaultPalette(paletteModel: PaletteModel): void {
  // Sub-palette 0: Basic colors
  const palette0 = [
    { r: 0, g: 0, b: 0 }, // 0: Black (transparent)
    { r: 255, g: 255, b: 255 }, // 1: White
    { r: 255, g: 0, b: 0 }, // 2: Red
    { r: 0, g: 255, b: 0 }, // 3: Green
    { r: 0, g: 0, b: 255 }, // 4: Blue
    { r: 255, g: 255, b: 0 }, // 5: Yellow
    { r: 255, g: 0, b: 255 }, // 6: Magenta
    { r: 0, g: 255, b: 255 }, // 7: Cyan
    { r: 128, g: 128, b: 128 }, // 8: Gray
    { r: 255, g: 128, b: 0 }, // 9: Orange
    { r: 128, g: 0, b: 255 }, // 10: Purple
    { r: 0, g: 128, b: 128 }, // 11: Teal
    { r: 128, g: 64, b: 0 }, // 12: Brown
    { r: 255, g: 192, b: 203 }, // 13: Pink
    { r: 64, g: 64, b: 64 }, // 14: Dark Gray
    { r: 192, g: 192, b: 192 }, // 15: Light Gray
  ];

  palette0.forEach((color, idx) => {
    paletteModel.setColor(0, idx, color.r, color.g, color.b);
  });

  // Sub-palette 1: Warm gradient
  for (let i = 0; i < 16; i++) {
    const r = Math.floor(128 + (i / 15) * 127);
    const g = Math.floor((i / 15) * 128);
    const b = 0;
    paletteModel.setColor(1, i, r, g, b);
  }

  // Sub-palette 2: Cool gradient
  for (let i = 0; i < 16; i++) {
    const r = 0;
    const g = Math.floor((i / 15) * 128);
    const b = Math.floor(128 + (i / 15) * 127);
    paletteModel.setColor(2, i, r, g, b);
  }

  // Sub-palette 3: Green gradient
  for (let i = 0; i < 16; i++) {
    const r = 0;
    const g = Math.floor((i / 15) * 255);
    const b = 0;
    paletteModel.setColor(3, i, r, g, b);
  }

  // Sub-palette 4: Grayscale
  for (let i = 0; i < 16; i++) {
    const gray = Math.floor((i / 15) * 255);
    paletteModel.setColor(4, i, gray, gray, gray);
  }

  // Select white by default
  paletteModel.selectColor(1);

  console.log("[App] Default palette configured (5 sub-palettes)");
}

// Initialize the application
main();
