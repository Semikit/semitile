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

import type { TilemapModel } from "../../models/TilemapModel.js";
import type { TileBankModel } from "../../models/TileBankModel.js";
import type { PaletteModel } from "../../models/PaletteModel.js";
import styles from "./TilemapEditor.css?inline";

/**
 * TilemapEditor - Pure view component for tilemap editing
 *
 * This View displays a grid of tiles from the tilemap, renders each tile
 * from the tile bank, and allows users to place tiles by clicking.
 *
 * It is a pure presentation component:
 * - Reads data from Models only
 * - Dispatches events for user interactions
 * - Does NOT modify Models directly
 *
 * Events dispatched:
 * - tile-place-start: { x, y } - Mouse down on tilemap grid
 * - tile-place-move: { x, y } - Mouse move while placing
 * - tile-place-end: { x, y } - Mouse up
 *
 * Usage:
 * ```typescript
 * const tilemapEditor = document.getElementById('tilemap-editor');
 * tilemapEditor.setModels(tilemapModel, tileBankModel, paletteModel);
 *
 * tilemapEditor.addEventListener('tile-place-start', (e) => {
 *   const { x, y } = e.detail;
 *   // Handle tile placement via Controller
 * });
 * ```
 */
export class TilemapEditor extends HTMLElement {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private tilemapModel: TilemapModel | null = null;
  private tileBankModel: TileBankModel | null = null;
  private paletteModel: PaletteModel | null = null;

  // View state (does NOT belong in Models)
  private scrollX: number = 0;
  private scrollY: number = 0;
  private tileSize: number = 16; // Pixels per tile for display
  private isPlacing: boolean = false;
  private rafPending: boolean = false; // Tracks if a redraw is already scheduled
  private dirtyTiles: Set<string> = new Set(); // Track which tiles need rerendering
  private fullRedrawNeeded: boolean = false; // Flag for full redraws

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.render();
    this.setupCanvas();
    this.attachEventListeners();
  }

  disconnectedCallback(): void {
    this.cleanup();
  }

  /**
   * Inject Models into View
   *
   * Called by Controller to wire up MVC dependencies
   */
  setModels(
    tilemapModel: TilemapModel,
    tileBankModel: TileBankModel,
    paletteModel: PaletteModel
  ): void {
    // Clean up old listeners
    this.cleanup();

    // Store model references
    this.tilemapModel = tilemapModel;
    this.tileBankModel = tileBankModel;
    this.paletteModel = paletteModel;

    // Subscribe to model events
    this.tilemapModel.on("entryChanged", this.handleEntryChanged);
    this.tilemapModel.on("tilemapResized", this.handleFullRedraw);
    this.tilemapModel.on("tilemapCleared", this.handleFullRedraw);
    this.tilemapModel.on("tilemapFilled", this.handleFullRedraw);
    this.tilemapModel.on("tilemapImported", this.handleFullRedraw);

    this.tileBankModel.on("tileChanged", this.handleFullRedraw);
    this.tileBankModel.on("tileAdded", this.handleFullRedraw);
    this.tileBankModel.on("tileDeleted", this.handleFullRedraw);

    this.paletteModel.on("colorChanged", this.handleFullRedraw);
    this.paletteModel.on("paletteImported", this.handleFullRedraw);
    this.paletteModel.on("subPaletteChanged", this.handleFullRedraw);

    // Initial render
    this.fullRedrawNeeded = true;
    this.scheduleRedraw();
  }

  /**
   * Handle individual tile entry changes (optimized)
   */
  private handleEntryChanged = (data: { x: number; y: number }): void => {
    this.dirtyTiles.add(`${data.x},${data.y}`);
    this.scheduleRedraw();
  };

  /**
   * Handle events that require full redraw
   */
  private handleFullRedraw = (): void => {
    this.fullRedrawNeeded = true;
    this.dirtyTiles.clear();
    this.scheduleRedraw();
  };

  /**
   * Schedule a redraw using requestAnimationFrame
   * Multiple calls within the same frame will only trigger one redraw
   */
  private scheduleRedraw(): void {
    if (this.rafPending) {
      return;
    }

    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      this.performRedraw();
    });
  }

  /**
   * Perform the actual redraw - either incremental or full
   */
  private performRedraw(): void {
    if (this.fullRedrawNeeded) {
      this.redraw();
      this.fullRedrawNeeded = false;
    } else if (this.dirtyTiles.size > 0) {
      // Incremental redraw - only redraw changed tiles
      for (const key of this.dirtyTiles) {
        const [x, y] = key.split(',').map(Number);
        this.renderTile(x, y);
      }
      this.dirtyTiles.clear();
    }
  }

  /**
   * Cleanup model listeners
   */
  private cleanup(): void {
    if (this.tilemapModel) {
      this.tilemapModel.off("entryChanged", this.handleEntryChanged);
      this.tilemapModel.off("tilemapResized", this.handleFullRedraw);
      this.tilemapModel.off("tilemapCleared", this.handleFullRedraw);
      this.tilemapModel.off("tilemapFilled", this.handleFullRedraw);
      this.tilemapModel.off("tilemapImported", this.handleFullRedraw);
    }

    if (this.tileBankModel) {
      this.tileBankModel.off("tileChanged", this.handleFullRedraw);
      this.tileBankModel.off("tileAdded", this.handleFullRedraw);
      this.tileBankModel.off("tileDeleted", this.handleFullRedraw);
    }

    if (this.paletteModel) {
      this.paletteModel.off("colorChanged", this.handleFullRedraw);
      this.paletteModel.off("paletteImported", this.handleFullRedraw);
      this.paletteModel.off("subPaletteChanged", this.handleFullRedraw);
    }
  }

  /**
   * Render Shadow DOM structure
   */
  private render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="tilemap-editor">
        <canvas id="tilemap-canvas"></canvas>
      </div>
    `;
  }

  /**
   * Setup canvas element
   */
  private setupCanvas(): void {
    this.canvas = this.shadowRoot?.getElementById("tilemap-canvas") as HTMLCanvasElement;
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d", { alpha: false });
    if (!this.ctx) return;

    // Set initial canvas size
    this.canvas.width = 512;
    this.canvas.height = 512;
  }

  /**
   * Pure rendering - reads from Models only
   */
  private redraw(): void {
    if (!this.ctx || !this.canvas || !this.tilemapModel || !this.tileBankModel || !this.paletteModel) {
      return;
    }

    const width = this.tilemapModel.getWidth();
    const height = this.tilemapModel.getHeight();

    // Update canvas size to match tilemap dimensions
    const canvasWidth = width * this.tileSize;
    const canvasHeight = height * this.tileSize;

    if (this.canvas.width !== canvasWidth || this.canvas.height !== canvasHeight) {
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      // Need to get context again after resizing
      this.ctx = this.canvas.getContext("2d", { alpha: false });
      if (!this.ctx) return;
    }

    // Clear canvas
    this.ctx.fillStyle = "#1a1a2e";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate visible tile range based on scroll
    const startX = Math.max(0, Math.floor(this.scrollX / this.tileSize));
    const startY = Math.max(0, Math.floor(this.scrollY / this.tileSize));
    const endX = Math.min(width, Math.ceil((this.scrollX + this.canvas.width) / this.tileSize));
    const endY = Math.min(height, Math.ceil((this.scrollY + this.canvas.height) / this.tileSize));

    // Render visible tiles
    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        this.renderTile(tx, ty);
      }
    }

    // Draw grid
    this.drawGrid(width, height);
  }

  /**
   * Render a single tile from the tilemap
   * Optimized using ImageData for faster rendering
   */
  private renderTile(tilemapX: number, tilemapY: number): void {
    if (!this.ctx || !this.tilemapModel || !this.tileBankModel || !this.paletteModel) {
      return;
    }

    const entry = this.tilemapModel.getEntry(tilemapX, tilemapY);
    if (!entry) return;

    const tile = this.tileBankModel.getTile(entry.tileIndex);
    if (!tile) return;

    // Calculate screen position
    const screenX = tilemapX * this.tileSize - this.scrollX;
    const screenY = tilemapY * this.tileSize - this.scrollY;

    const pixelSize = this.tileSize / 8;

    // For small pixel sizes, use direct fillRect (faster for tiny pixels)
    if (pixelSize <= 2) {
      for (let py = 0; py < 8; py++) {
        for (let px = 0; px < 8; px++) {
          const actualPx = entry.hFlip ? (7 - px) : px;
          const actualPy = entry.vFlip ? (7 - py) : py;

          const colorIndex = tile.getPixel(actualPx, actualPy);
          const color = this.paletteModel.getColor(entry.paletteIdx, colorIndex);

          this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
          this.ctx.fillRect(
            screenX + px * pixelSize,
            screenY + py * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
      return;
    }

    // For larger pixel sizes, use ImageData (much faster)
    const imageData = this.ctx.createImageData(this.tileSize, this.tileSize);
    const data = imageData.data;

    for (let py = 0; py < 8; py++) {
      for (let px = 0; px < 8; px++) {
        // Apply flips if needed
        const actualPx = entry.hFlip ? (7 - px) : px;
        const actualPy = entry.vFlip ? (7 - py) : py;

        const colorIndex = tile.getPixel(actualPx, actualPy);
        const color = this.paletteModel.getColor(entry.paletteIdx, colorIndex);

        // Fill the pixel block in ImageData
        const startPixelX = Math.floor(px * pixelSize);
        const startPixelY = Math.floor(py * pixelSize);
        const endPixelX = Math.floor((px + 1) * pixelSize);
        const endPixelY = Math.floor((py + 1) * pixelSize);

        for (let y = startPixelY; y < endPixelY; y++) {
          for (let x = startPixelX; x < endPixelX; x++) {
            const idx = (y * this.tileSize + x) * 4;
            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255; // Alpha
          }
        }
      }
    }

    this.ctx.putImageData(imageData, screenX, screenY);
  }

  /**
   * Draw grid overlay
   */
  private drawGrid(width: number, height: number): void {
    if (!this.ctx) return;

    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x++) {
      const screenX = x * this.tileSize - this.scrollX;
      if (screenX >= 0 && screenX <= this.canvas!.width) {
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, 0);
        this.ctx.lineTo(screenX, this.canvas!.height);
        this.ctx.stroke();
      }
    }

    // Horizontal lines
    for (let y = 0; y <= height; y++) {
      const screenY = y * this.tileSize - this.scrollY;
      if (screenY >= 0 && screenY <= this.canvas!.height) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, screenY);
        this.ctx.lineTo(this.canvas!.width, screenY);
        this.ctx.stroke();
      }
    }
  }

  /**
   * Attach event listeners for user interaction
   */
  private attachEventListeners(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("mouseleave", this.handleMouseUp);
  }

  /**
   * Handle mouse down - start placing tiles
   */
  private handleMouseDown = (e: MouseEvent): void => {
    this.isPlacing = true;
    this.dispatchTilePlaceEvent("tile-place-start", e);
  };

  /**
   * Handle mouse move - continue placing tiles
   */
  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isPlacing) return;
    this.dispatchTilePlaceEvent("tile-place-move", e);
  };

  /**
   * Handle mouse up - stop placing tiles
   */
  private handleMouseUp = (e: MouseEvent): void => {
    if (!this.isPlacing) return;
    this.isPlacing = false;
    this.dispatchTilePlaceEvent("tile-place-end", e);
  };

  /**
   * Dispatch tile placement event with tilemap coordinates
   */
  private dispatchTilePlaceEvent(type: string, e: MouseEvent): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to tilemap coordinates
    const tilemapX = Math.floor((mouseX + this.scrollX) / this.tileSize);
    const tilemapY = Math.floor((mouseY + this.scrollY) / this.tileSize);

    // Bounds check
    if (this.tilemapModel) {
      const width = this.tilemapModel.getWidth();
      const height = this.tilemapModel.getHeight();

      if (tilemapX >= 0 && tilemapX < width && tilemapY >= 0 && tilemapY < height) {
        this.dispatchEvent(
          new CustomEvent(type, {
            detail: { x: tilemapX, y: tilemapY },
            bubbles: true,
            composed: true,
          })
        );
      }
    }
  }

  /**
   * Set scroll position (for panning)
   */
  setScroll(x: number, y: number): void {
    this.scrollX = x;
    this.scrollY = y;
    this.redraw();
  }

  /**
   * Set tile size for display (zoom)
   */
  setTileSize(size: number): void {
    this.tileSize = Math.max(8, Math.min(64, size));
    this.redraw();
  }
}

customElements.define("tilemap-editor", TilemapEditor);
