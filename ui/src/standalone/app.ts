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
import { initWasm, WasmPalette } from "../lib/wasm-loader.js";

// Models
import { TileBankModel } from "../models/TileBankModel.js";
import { PaletteModel } from "../models/PaletteModel.js";
import { EditorState } from "../models/EditorState.js";
import { TilemapBankModel } from "../models/TilemapBankModel.js";

// Views
import { TileCanvas } from "../views/TileCanvas/TileCanvas.js";
import { PaletteEditor } from "../views/PaletteEditor/PaletteEditor.js";
import { ColorPicker } from "../views/ColorPicker/ColorPicker.js";
import { ToolPanel } from "../views/ToolPanel/ToolPanel.js";
import { TileBank } from "../views/TileBank/TileBank.js";
import { TilemapEditor } from "../views/TilemapEditor/TilemapEditor.js";
import { TileAttributesPanel } from "../views/TileAttributesPanel/TileAttributesPanel.js";
import { TilemapBank } from "../views/TilemapBank/TilemapBank.js";

// Controllers
import { TileEditorController } from "../controllers/TileEditorController.js";
import { PaletteController } from "../controllers/PaletteController.js";
import { FileController } from "../controllers/FileController.js";
import { TileBankController } from "../controllers/TileBankController.js";
import { TilemapController } from "../controllers/TilemapController.js";
import { TilemapBankController } from "../controllers/TilemapBankController.js";

// Command History
import { CommandHistory } from "../models/CommandHistory.js";

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

    const tileBankModel = new TileBankModel(); // Starts with one empty tile
    const paletteModel = new PaletteModel(new WasmPalette());
    const editorState = new EditorState();
    const tilemapBankModel = new TilemapBankModel(); // Starts with one 32×32 tilemap

    console.log("[App] Models created");

    // Set up default palette
    setupDefaultPalette(paletteModel);

    // ===== GET VIEW ELEMENTS =====
    console.log("[App] Getting View elements...");

    const tileCanvas = document.getElementById("tile-canvas") as TileCanvas;
    const paletteEditor = document.getElementById("palette-editor") as PaletteEditor;
    const colorPicker = document.getElementById("color-picker") as ColorPicker;
    const toolPanel = document.getElementById("tool-panel") as ToolPanel;
    const tileBank = document.getElementById("tile-bank") as TileBank;
    const tilemapEditor = document.getElementById("tilemap-editor") as TilemapEditor;
    const tilemapBank = document.getElementById("tilemap-bank") as TilemapBank;
    const tileAttributesPanel = document.getElementById("tile-attributes") as TileAttributesPanel;

    if (!tileCanvas || !paletteEditor || !colorPicker || !toolPanel || !tileBank || !tilemapEditor || !tilemapBank || !tileAttributesPanel) {
      throw new Error("Failed to get View elements from DOM");
    }

    console.log("[App] View elements retrieved");

    // ===== CREATE SHARED COMMAND HISTORY =====
    // Both TileEditorController and PaletteController share the same history
    // This allows undo/redo to work across both tile and palette edits
    const commandHistory = new CommandHistory();

    // ===== CREATE CONTROLLERS (Wire Views to Models) =====
    console.log("[App] Creating Controllers...");

    // Tile Editor Controller - handles tile editing
    const tileEditorController = new TileEditorController(
      tileBankModel,
      paletteModel,
      editorState,
      tileCanvas,
      commandHistory
    );

    // Palette Controller - handles palette and color editing
    const paletteController = new PaletteController(
      paletteModel,
      paletteEditor,
      colorPicker,
      commandHistory
    );

    // Tile Bank Controller - handles tile bank management
    const tileBankController = new TileBankController(
      tileBankModel,
      paletteModel,
      tileBank
    );

    // Tilemap Bank Controller - handles tilemap bank management
    const tilemapBankController = new TilemapBankController(
      tilemapBankModel,
      tilemapBank
    );

    // Tilemap Controller - handles tilemap editing
    const tilemapController = new TilemapController(
      tilemapBankModel.getActiveTilemap(),
      tileBankModel,
      tilemapEditor
    );

    // Wire up TilemapEditor View to Models
    tilemapEditor.setModels(tilemapBankModel.getActiveTilemap(), tileBankModel, paletteModel);

    // Update TilemapEditor and TilemapController when active tilemap changes
    tilemapBankModel.on("activeTilemapChanged", () => {
      const activeTilemap = tilemapBankModel.getActiveTilemap();
      tilemapEditor.setModels(activeTilemap, tileBankModel, paletteModel);
      tilemapController.setModel(activeTilemap);
      console.log("[App] Active tilemap changed");
    });

    // File Controller - handles save/load/export operations (now with multi-tilemap support)
    const fileController = new FileController(tileBankModel, paletteModel, tilemapBankModel);

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

    // ===== WIRE UP TILE ATTRIBUTES PANEL =====

    tileAttributesPanel.addEventListener("palette-changed", (e) => {
      const customEvent = e as CustomEvent<{ paletteIdx: number }>;
      tilemapController.setPaletteIdx(customEvent.detail.paletteIdx);
    });

    tileAttributesPanel.addEventListener("h-flip-changed", (e) => {
      const customEvent = e as CustomEvent<{ hFlip: boolean }>;
      tilemapController.setHFlip(customEvent.detail.hFlip);
    });

    tileAttributesPanel.addEventListener("v-flip-changed", (e) => {
      const customEvent = e as CustomEvent<{ vFlip: boolean }>;
      tilemapController.setVFlip(customEvent.detail.vFlip);
    });

    console.log("[App] TileAttributesPanel wired to TilemapController");

    // ===== WIRE UP TILEMAP CONTROL BUTTONS =====

    const btnTilemapResize = document.getElementById("btn-tilemap-resize");
    const btnTilemapClear = document.getElementById("btn-tilemap-clear");
    const btnTilemapFill = document.getElementById("btn-tilemap-fill");

    if (btnTilemapResize) {
      btnTilemapResize.addEventListener("click", () => {
        const width = prompt("Enter tilemap width (1-256):", "32");
        const height = prompt("Enter tilemap height (1-256):", "32");

        if (width && height) {
          const w = parseInt(width, 10);
          const h = parseInt(height, 10);

          if (!isNaN(w) && !isNaN(h) && w >= 1 && w <= 256 && h >= 1 && h <= 256) {
            tilemapController.resize(w, h);
            console.log(`[App] Tilemap resized to ${w}×${h}`);
          } else {
            alert("Invalid dimensions. Please enter values between 1 and 256.");
          }
        }
      });
    }

    if (btnTilemapClear) {
      btnTilemapClear.addEventListener("click", () => {
        if (confirm("Clear entire tilemap? This cannot be undone.")) {
          tilemapController.clear();
          console.log("[App] Tilemap cleared");
        }
      });
    }

    if (btnTilemapFill) {
      btnTilemapFill.addEventListener("click", () => {
        if (confirm("Fill entire tilemap with active tile?")) {
          tilemapController.fill();
          console.log("[App] Tilemap filled with active tile");
        }
      });
    }

    console.log("[App] Tilemap control buttons wired");

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

    // Function to update undo/redo button states
    const updateUndoRedoButtons = () => {
      if (btnUndo) {
        btnUndo.disabled = !commandHistory.canUndo();
      }
      if (btnRedo) {
        btnRedo.disabled = !commandHistory.canRedo();
      }
    };

    // Listen to command history changes to update button states
    commandHistory.on("historyChanged", updateUndoRedoButtons);

    // Initial button state
    updateUndoRedoButtons();

    console.log("[App] Navigation buttons wired");

    // ===== KEYBOARD SHORTCUTS =====

    document.addEventListener("keydown", (e) => {
      // Don't process shortcuts if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        tileEditorController.undo();
        return;
      }

      // Redo: Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac)
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        tileEditorController.redo();
        return;
      }

      // Tool shortcuts (P, F, L, R)
      const key = e.key.toLowerCase();

      if (key === "p") {
        e.preventDefault();
        editorState.setTool("pencil" as any);
        console.log("[App] Switched to Pencil tool (P)");
        return;
      }

      if (key === "f") {
        e.preventDefault();
        editorState.setTool("fill" as any);
        console.log("[App] Switched to Fill tool (F)");
        return;
      }

      if (key === "l") {
        e.preventDefault();
        editorState.setTool("line" as any);
        console.log("[App] Switched to Line tool (L)");
        return;
      }

      if (key === "r") {
        e.preventDefault();
        editorState.setTool("rectangle" as any);
        console.log("[App] Switched to Rectangle tool (R)");
        return;
      }

      // Grid toggle (G)
      if (key === "g") {
        e.preventDefault();
        editorState.setGridEnabled(!editorState.isGridEnabled());
        console.log(`[App] Grid ${editorState.isGridEnabled() ? "enabled" : "disabled"} (G)`);
        return;
      }

      // Zoom in/out (+/-)
      if (key === "+" || key === "=") {
        e.preventDefault();
        const currentZoom = editorState.getZoom();
        editorState.setZoom(currentZoom + 2);
        console.log(`[App] Zoom in: ${editorState.getZoom()}x (+)`);
        return;
      }

      if (key === "-" || key === "_") {
        e.preventDefault();
        const currentZoom = editorState.getZoom();
        editorState.setZoom(currentZoom - 2);
        console.log(`[App] Zoom out: ${editorState.getZoom()}x (-)`);
        return;
      }

      // Color selection shortcuts (0-9)
      const numKey = parseInt(key, 10);
      if (!isNaN(numKey) && numKey >= 0 && numKey <= 9) {
        e.preventDefault();
        paletteModel.selectColor(numKey);
        console.log(`[App] Selected color ${numKey} (${key})`);
        return;
      }
    });

    console.log("[App] Keyboard shortcuts registered");
    console.log("[App] - Tools: P (Pencil), F (Fill), L (Line), R (Rectangle)");
    console.log("[App] - Colors: 0-9 (select first 10 colors)");
    console.log("[App] - View: G (toggle grid), +/- (zoom)");
    console.log("[App] - Edit: Ctrl+Z (undo), Ctrl+Y (redo)");

    // ===== WIRE UP FILE OPERATIONS =====

    // Get dialog elements
    const saveDialog = document.getElementById("save-dialog");
    const loadDialog = document.getElementById("load-dialog");
    const exportDialog = document.getElementById("export-dialog");

    // Helper functions for dialogs
    const showDialog = (dialog: HTMLElement | null) => {
      if (dialog) dialog.style.display = "flex";
    };

    const hideDialog = (dialog: HTMLElement | null) => {
      if (dialog) dialog.style.display = "none";
    };

    // Save button - open save dialog
    const btnSave = document.getElementById("btn-save");
    if (btnSave) {
      btnSave.addEventListener("click", () => {
        const input = document.getElementById("project-name-input") as HTMLInputElement;
        if (input) {
          input.value = fileController.getCurrentProjectName();
        }
        showDialog(saveDialog);
      });
    }

    // Save dialog - confirm button
    const btnSaveConfirm = document.getElementById("save-confirm");
    if (btnSaveConfirm) {
      btnSaveConfirm.addEventListener("click", async () => {
        const input = document.getElementById("project-name-input") as HTMLInputElement;
        if (input && input.value.trim()) {
          try {
            await fileController.saveProject(input.value.trim());
            console.log(`[App] Project saved: ${input.value.trim()}`);
            hideDialog(saveDialog);
          } catch (error) {
            console.error("[App] Failed to save project:", error);
            alert("Failed to save project. Check console for details.");
          }
        }
      });
    }

    // Save dialog - close button
    const btnSaveClose = document.getElementById("save-close");
    if (btnSaveClose) {
      btnSaveClose.addEventListener("click", () => {
        hideDialog(saveDialog);
      });
    }

    // Load button - open load dialog and populate project list
    const btnLoad = document.getElementById("btn-load");
    if (btnLoad) {
      btnLoad.addEventListener("click", async () => {
        await populateProjectList();
        showDialog(loadDialog);
      });
    }

    // Function to populate project list
    async function populateProjectList() {
      const projectList = document.getElementById("project-list");
      if (!projectList) return;

      try {
        const projects = await fileController.listProjects();

        if (projects.length === 0) {
          projectList.innerHTML = '<p class="empty-state">No saved projects</p>';
          return;
        }

        projectList.innerHTML = "";

        projects.forEach((project) => {
          const item = document.createElement("div");
          item.className = "project-item";

          const info = document.createElement("div");
          info.className = "project-info";

          const name = document.createElement("div");
          name.className = "project-name";
          name.textContent = project.name;

          const date = document.createElement("div");
          date.className = "project-date";
          date.textContent = new Date(project.updatedAt).toLocaleString();

          info.appendChild(name);
          info.appendChild(date);

          const deleteBtn = document.createElement("button");
          deleteBtn.className = "project-delete";
          deleteBtn.textContent = "Delete";
          deleteBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (confirm(`Delete project "${project.name}"?`)) {
              await fileController.deleteProject(project.name);
              await populateProjectList();
            }
          });

          item.appendChild(info);
          item.appendChild(deleteBtn);

          item.addEventListener("click", async () => {
            try {
              const success = await fileController.loadProject(project.name);
              if (success) {
                console.log(`[App] Project loaded: ${project.name}`);
                hideDialog(loadDialog);
              } else {
                alert("Failed to load project. Check console for details.");
              }
            } catch (error) {
              console.error("[App] Failed to load project:", error);
              alert("Failed to load project. Check console for details.");
            }
          });

          projectList.appendChild(item);
        });
      } catch (error) {
        console.error("[App] Failed to list projects:", error);
        projectList.innerHTML = '<p class="empty-state">Error loading projects</p>';
      }
    }

    // Import project button
    const btnImportProject = document.getElementById("import-project-btn");
    const inputImportProject = document.getElementById("import-project") as HTMLInputElement;

    if (btnImportProject && inputImportProject) {
      btnImportProject.addEventListener("click", () => {
        inputImportProject.click();
      });

      inputImportProject.addEventListener("change", async () => {
        if (inputImportProject.files && inputImportProject.files.length > 0) {
          const file = inputImportProject.files[0];
          try {
            const success = await fileController.importProjectJSON(file);
            if (success) {
              console.log("[App] Project imported successfully");
              hideDialog(loadDialog);
            } else {
              alert("Failed to import project. Check console for details.");
            }
          } catch (error) {
            console.error("[App] Failed to import project:", error);
            alert("Failed to import project. Check console for details.");
          }
          inputImportProject.value = "";
        }
      });
    }

    // Load dialog - close button
    const btnLoadClose = document.getElementById("load-close");
    if (btnLoadClose) {
      btnLoadClose.addEventListener("click", () => {
        hideDialog(loadDialog);
      });
    }

    // Export button - open export dialog
    const btnExport = document.getElementById("btn-export");
    if (btnExport) {
      btnExport.addEventListener("click", () => {
        showDialog(exportDialog);
      });
    }

    // Export tile binary
    const btnExportTileBin = document.getElementById("export-tile-bin");
    if (btnExportTileBin) {
      btnExportTileBin.addEventListener("click", () => {
        const name = fileController.getCurrentProjectName();
        fileController.exportTileBinary(`${name}.bin`);
      });
    }

    // Export tile C header
    const btnExportTileH = document.getElementById("export-tile-h");
    if (btnExportTileH) {
      btnExportTileH.addEventListener("click", () => {
        const name = fileController.getCurrentProjectName();
        fileController.exportTileCHeader(`${name}.h`);
      });
    }

    // Export tile ASM
    const btnExportTileAsm = document.getElementById("export-tile-asm");
    if (btnExportTileAsm) {
      btnExportTileAsm.addEventListener("click", () => {
        const name = fileController.getCurrentProjectName();
        fileController.exportTileASM(`${name}.asm`);
      });
    }

    // Export all tiles binary
    const btnExportAllTilesBin = document.getElementById("export-all-tiles-bin");
    if (btnExportAllTilesBin) {
      btnExportAllTilesBin.addEventListener("click", () => {
        const name = fileController.getCurrentProjectName();
        fileController.exportAllTilesBinary(`${name}_tiles.bin`);
      });
    }

    // Export all tiles C header
    const btnExportAllTilesH = document.getElementById("export-all-tiles-h");
    if (btnExportAllTilesH) {
      btnExportAllTilesH.addEventListener("click", () => {
        const name = fileController.getCurrentProjectName();
        fileController.exportAllTilesCHeader(`${name}_tiles.h`);
      });
    }

    // Export all tiles ASM
    const btnExportAllTilesAsm = document.getElementById("export-all-tiles-asm");
    if (btnExportAllTilesAsm) {
      btnExportAllTilesAsm.addEventListener("click", () => {
        const name = fileController.getCurrentProjectName();
        fileController.exportAllTilesASM(`${name}_tiles.asm`);
      });
    }

    // Export palette binary
    const btnExportPaletteBin = document.getElementById("export-palette-bin");
    if (btnExportPaletteBin) {
      btnExportPaletteBin.addEventListener("click", () => {
        const name = fileController.getCurrentProjectName();
        fileController.exportPaletteBinary(`${name}_palette.bin`);
      });
    }

    // Export palette C header
    const btnExportPaletteH = document.getElementById("export-palette-h");
    if (btnExportPaletteH) {
      btnExportPaletteH.addEventListener("click", () => {
        const name = fileController.getCurrentProjectName();
        fileController.exportPaletteCHeader(`${name}_palette.h`);
      });
    }

    // Export palette ASM
    const btnExportPaletteAsm = document.getElementById("export-palette-asm");
    if (btnExportPaletteAsm) {
      btnExportPaletteAsm.addEventListener("click", () => {
        const name = fileController.getCurrentProjectName();
        fileController.exportPaletteASM(`${name}_palette.asm`);
      });
    }

    // Export tilemap binary
    const btnExportTilemapBin = document.getElementById("export-tilemap-bin");
    if (btnExportTilemapBin) {
      btnExportTilemapBin.addEventListener("click", () => {
        const name = fileController.getCurrentProjectName();
        fileController.exportTilemapBinary(`${name}_tilemap.bin`);
      });
    }

    // Export tilemap C header
    const btnExportTilemapH = document.getElementById("export-tilemap-h");
    if (btnExportTilemapH) {
      btnExportTilemapH.addEventListener("click", () => {
        const name = fileController.getCurrentProjectName();
        fileController.exportTilemapCHeader(`${name}_tilemap.h`);
      });
    }

    // Export tilemap ASM
    const btnExportTilemapAsm = document.getElementById("export-tilemap-asm");
    if (btnExportTilemapAsm) {
      btnExportTilemapAsm.addEventListener("click", () => {
        const name = fileController.getCurrentProjectName();
        fileController.exportTilemapASM(`${name}_tilemap.asm`);
      });
    }

    // Export project JSON
    const btnExportProjectJson = document.getElementById("export-project-json");
    if (btnExportProjectJson) {
      btnExportProjectJson.addEventListener("click", async () => {
        const name = fileController.getCurrentProjectName();
        await fileController.exportProjectJSON(`${name}.json`);
      });
    }

    // Bulk export - all as binary
    const btnExportAllBin = document.getElementById("export-all-bin");
    if (btnExportAllBin) {
      btnExportAllBin.addEventListener("click", async () => {
        const name = fileController.getCurrentProjectName();
        await fileController.exportAllAsZip('bin', name);
      });
    }

    // Bulk export - all as C headers
    const btnExportAllH = document.getElementById("export-all-h");
    if (btnExportAllH) {
      btnExportAllH.addEventListener("click", async () => {
        const name = fileController.getCurrentProjectName();
        await fileController.exportAllAsZip('h', name);
      });
    }

    // Bulk export - all as Assembly
    const btnExportAllAsm = document.getElementById("export-all-asm");
    if (btnExportAllAsm) {
      btnExportAllAsm.addEventListener("click", async () => {
        const name = fileController.getCurrentProjectName();
        await fileController.exportAllAsZip('asm', name);
      });
    }

    // Export dialog - close button
    const btnExportClose = document.getElementById("export-close");
    if (btnExportClose) {
      btnExportClose.addEventListener("click", () => {
        hideDialog(exportDialog);
      });
    }

    // Close dialogs when clicking backdrop
    if (saveDialog) {
      const backdrop = saveDialog.querySelector(".dialog-backdrop");
      if (backdrop) {
        backdrop.addEventListener("click", () => hideDialog(saveDialog));
      }
    }

    if (loadDialog) {
      const backdrop = loadDialog.querySelector(".dialog-backdrop");
      if (backdrop) {
        backdrop.addEventListener("click", () => hideDialog(loadDialog));
      }
    }

    if (exportDialog) {
      const backdrop = exportDialog.querySelector(".dialog-backdrop");
      if (backdrop) {
        backdrop.addEventListener("click", () => hideDialog(exportDialog));
      }
    }

    console.log("[App] File operations wired");

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
