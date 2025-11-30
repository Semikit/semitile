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

import type { TileBankModel } from "../../models/TileBankModel.js";
import type { PaletteModel } from "../../models/PaletteModel.js";

/**
 * TileBank - Pure View component for displaying tile thumbnails
 *
 * This is a Web Component that displays a grid of tile thumbnails.
 * It's a pure View component that:
 * - Renders tile thumbnails from TileBankModel
 * - Listens to Model events and re-renders
 * - Dispatches user interaction events
 * - Does NOT modify Models directly
 *
 * Events dispatched:
 * - 'tile-select-clicked': { index: number } - When a tile is clicked
 * - 'tile-add-clicked': {} - When the add button is clicked
 * - 'tile-delete-clicked': { index: number } - When a tile delete button is clicked
 * - 'tile-duplicate-clicked': { index: number } - When a tile duplicate button is clicked
 */
export class TileBank extends HTMLElement {
  private tileBankModel: TileBankModel | null = null;
  private paletteModel: PaletteModel | null = null;
  private container: HTMLElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    this.cleanupModelListeners();
  }

  /**
   * Set the Models (dependency injection from Controller)
   */
  setModels(tileBankModel: TileBankModel, paletteModel: PaletteModel): void {
    this.cleanupModelListeners();

    this.tileBankModel = tileBankModel;
    this.paletteModel = paletteModel;

    // Subscribe to TileBankModel events
    this.tileBankModel.on("tileAdded", this.handleModelChange);
    this.tileBankModel.on("tileDeleted", this.handleModelChange);
    this.tileBankModel.on("activeTileChanged", this.handleModelChange);
    this.tileBankModel.on("tileBankCleared", this.handleModelChange);
    this.tileBankModel.on("tilesImported", this.handleModelChange);

    // Subscribe to PaletteModel events (for re-rendering thumbnails)
    this.paletteModel.on("colorChanged", this.handleModelChange);
    this.paletteModel.on("paletteImported", this.handleModelChange);
    this.paletteModel.on("subPaletteChanged", this.handleModelChange);

    // Subscribe to each TileModel's events
    for (const tileModel of this.tileBankModel.getAllTiles()) {
      tileModel.on("pixelChanged", this.handleModelChange);
      tileModel.on("tileImported", this.handleModelChange);
      tileModel.on("tileCleared", this.handleModelChange);
    }

    this.redraw();
  }

  private cleanupModelListeners(): void {
    if (this.tileBankModel) {
      this.tileBankModel.off("tileAdded", this.handleModelChange);
      this.tileBankModel.off("tileDeleted", this.handleModelChange);
      this.tileBankModel.off("activeTileChanged", this.handleModelChange);
      this.tileBankModel.off("tileBankCleared", this.handleModelChange);
      this.tileBankModel.off("tilesImported", this.handleModelChange);

      // Unsubscribe from TileModel events
      for (const tileModel of this.tileBankModel.getAllTiles()) {
        tileModel.off("pixelChanged", this.handleModelChange);
        tileModel.off("tileImported", this.handleModelChange);
        tileModel.off("tileCleared", this.handleModelChange);
      }
    }

    if (this.paletteModel) {
      this.paletteModel.off("colorChanged", this.handleModelChange);
      this.paletteModel.off("paletteImported", this.handleModelChange);
      this.paletteModel.off("subPaletteChanged", this.handleModelChange);
    }
  }

  private handleModelChange = (): void => {
    this.redraw();
  };

  private render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--font-sans, sans-serif);
        }

        .tile-bank-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm, 8px);
        }

        .tile-bank-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm, 8px);
        }

        .tile-bank-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--c16-text-secondary, #b8b8b8);
        }

        .tile-count {
          font-size: 0.8rem;
          color: var(--c16-text-muted, #666);
        }

        .add-tile-button {
          background: var(--c16-primary, #00ff88);
          color: var(--c16-bg-dark, #1a1a2e);
          border: none;
          padding: 4px 12px;
          border-radius: var(--radius-sm, 2px);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .add-tile-button:hover {
          background: var(--c16-primary-dark, #00cc6a);
        }

        .tile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
          gap: var(--spacing-sm, 8px);
          max-height: 300px;
          overflow-y: auto;
          padding: var(--spacing-xs, 4px);
        }

        .tile-item {
          position: relative;
          border: 2px solid var(--c16-bg-light, #0f3460);
          border-radius: var(--radius-sm, 2px);
          cursor: pointer;
          transition: all 0.2s;
          background: var(--c16-bg-darkest, #0a0a0f);
        }

        .tile-item:hover {
          border-color: var(--c16-accent, #00d4ff);
        }

        .tile-item.active {
          border-color: var(--c16-primary, #00ff88);
          box-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
        }

        .tile-thumbnail {
          width: 100%;
          aspect-ratio: 1;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
          display: block;
        }

        .tile-index {
          position: absolute;
          top: 2px;
          left: 2px;
          background: rgba(0, 0, 0, 0.7);
          color: var(--c16-text-primary, white);
          font-size: 0.7rem;
          padding: 1px 4px;
          border-radius: 2px;
          font-family: var(--font-mono, monospace);
        }

        .tile-actions {
          position: absolute;
          top: 2px;
          right: 2px;
          display: none;
          gap: 2px;
        }

        .tile-item:hover .tile-actions {
          display: flex;
        }

        .tile-action-btn {
          background: rgba(0, 0, 0, 0.8);
          border: none;
          color: white;
          font-size: 0.7rem;
          padding: 2px 4px;
          cursor: pointer;
          border-radius: 2px;
          transition: background 0.2s;
        }

        .tile-action-btn:hover {
          background: rgba(0, 0, 0, 0.95);
        }

        .tile-action-btn.duplicate {
          color: var(--c16-accent, #00d4ff);
        }

        .tile-action-btn.delete {
          color: var(--c16-secondary, #ff0088);
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-lg, 24px);
          color: var(--c16-text-muted, #666);
          font-size: 0.85rem;
        }
      </style>

      <div class="tile-bank-container">
        <div class="tile-bank-header">
          <div>
            <div class="tile-bank-title">Tile Bank</div>
            <div class="tile-count" id="tile-count">0 tiles</div>
          </div>
          <button class="add-tile-button" id="add-tile-btn">+ Add</button>
        </div>
        <div class="tile-grid" id="tile-grid">
          <div class="empty-state">No tiles</div>
        </div>
      </div>
    `;

    this.container = this.shadowRoot.querySelector("#tile-grid");

    // Wire up add button
    const addBtn = this.shadowRoot.querySelector("#add-tile-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("tile-add-clicked", {
            bubbles: true,
            composed: true,
          })
        );
      });
    }
  }

  private redraw(): void {
    if (!this.tileBankModel || !this.paletteModel || !this.container) return;

    const tiles = this.tileBankModel.getAllTiles();
    const activeTileIndex = this.tileBankModel.getActiveTileIndex();
    const activePalette = this.paletteModel.getActiveSubPalette();

    // Update tile count
    const tileCountEl = this.shadowRoot?.querySelector("#tile-count");
    if (tileCountEl) {
      tileCountEl.textContent = `${tiles.length} tile${tiles.length !== 1 ? "s" : ""}`;
    }

    // Clear container
    this.container.innerHTML = "";

    if (tiles.length === 0) {
      this.container.innerHTML = '<div class="empty-state">No tiles</div>';
      return;
    }

    // Render each tile
    tiles.forEach((tileModel, index) => {
      const tileItem = document.createElement("div");
      tileItem.className = "tile-item";
      if (index === activeTileIndex) {
        tileItem.classList.add("active");
      }

      // Create canvas for thumbnail
      const canvas = document.createElement("canvas");
      canvas.className = "tile-thumbnail";
      canvas.width = 8;
      canvas.height = 8;
      const ctx = canvas.getContext("2d", { alpha: false });

      if (ctx) {
        // Render tile pixels
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const colorIdx = tileModel.getPixel(x, y);
            const { r, g, b } = this.paletteModel.getColor(activePalette, colorIdx);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // Tile index label
      const indexLabel = document.createElement("div");
      indexLabel.className = "tile-index";
      indexLabel.textContent = index.toString();

      // Action buttons
      const actions = document.createElement("div");
      actions.className = "tile-actions";

      const duplicateBtn = document.createElement("button");
      duplicateBtn.className = "tile-action-btn duplicate";
      duplicateBtn.textContent = "⧉";
      duplicateBtn.title = "Duplicate";
      duplicateBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.dispatchEvent(
          new CustomEvent("tile-duplicate-clicked", {
            detail: { index },
            bubbles: true,
            composed: true,
          })
        );
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "tile-action-btn delete";
      deleteBtn.textContent = "×";
      deleteBtn.title = "Delete";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.dispatchEvent(
          new CustomEvent("tile-delete-clicked", {
            detail: { index },
            bubbles: true,
            composed: true,
          })
        );
      });

      actions.appendChild(duplicateBtn);

      // Only show delete button if there's more than one tile
      if (tiles.length > 1) {
        actions.appendChild(deleteBtn);
      }

      tileItem.appendChild(canvas);
      tileItem.appendChild(indexLabel);
      tileItem.appendChild(actions);

      // Click to select tile
      tileItem.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("tile-select-clicked", {
            detail: { index },
            bubbles: true,
            composed: true,
          })
        );
      });

      this.container.appendChild(tileItem);
    });
  }
}

customElements.define("tile-bank", TileBank);
