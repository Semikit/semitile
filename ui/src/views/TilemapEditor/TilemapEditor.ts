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
  private overlayCanvas: HTMLCanvasElement | null = null; // Separate canvas for viewport overlay
  private overlayCtx: CanvasRenderingContext2D | null = null;
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
  private viewportRedrawNeeded: boolean = false; // Flag for viewport-only redraws

  // Viewport overlay state (Cicada-16 screen reference)
  private viewportEnabled: boolean = false;
  private viewportX: number = 0; // Viewport position in pixels
  private viewportY: number = 0;
  private isDraggingViewport: boolean = false;
  private viewportDragOffsetX: number = 0;
  private viewportDragOffsetY: number = 0;
  private readonly VIEWPORT_WIDTH_PIXELS: number = 240; // Cicada-16 screen width in pixels
  private readonly VIEWPORT_HEIGHT_PIXELS: number = 160; // Cicada-16 screen height in pixels
  private readonly VIEWPORT_WIDTH_TILES: number = 30; // 240 / 8 = 30 tiles
  private readonly VIEWPORT_HEIGHT_TILES: number = 20; // 160 / 8 = 20 tiles

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
   * Perform the actual redraw - either incremental, full, or viewport-only
   */
  private performRedraw(): void {
    if (this.fullRedrawNeeded) {
      this.redraw();
      this.fullRedrawNeeded = false;
      // Also redraw viewport after full redraw
      if (this.viewportEnabled) {
        this.drawViewportOverlay();
      }
      this.viewportRedrawNeeded = false;
    } else if (this.dirtyTiles.size > 0) {
      // Incremental redraw - only redraw changed tiles
      for (const key of this.dirtyTiles) {
        const [x, y] = key.split(',').map(Number);
        this.renderTile(x, y);
      }
      this.dirtyTiles.clear();

      // If viewport also needs redraw, do it after tiles
      if (this.viewportRedrawNeeded && this.viewportEnabled) {
        this.drawViewportOverlay();
        this.viewportRedrawNeeded = false;
      }
    } else if (this.viewportRedrawNeeded) {
      // Viewport-only redraw - just redraw the overlay canvas (SUPER FAST)
      this.drawViewportOverlay();
      this.viewportRedrawNeeded = false;
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
      <style>
        ${styles}
        .canvas-container {
          position: relative;
          display: inline-block;
        }
        #overlay-canvas {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
        }
      </style>
      <div class="tilemap-editor">
        <div class="canvas-container">
          <canvas id="tilemap-canvas"></canvas>
          <canvas id="overlay-canvas"></canvas>
        </div>
      </div>
    `;
  }

  /**
   * Setup canvas elements
   */
  private setupCanvas(): void {
    this.canvas = this.shadowRoot?.getElementById("tilemap-canvas") as HTMLCanvasElement;
    this.overlayCanvas = this.shadowRoot?.getElementById("overlay-canvas") as HTMLCanvasElement;

    if (!this.canvas || !this.overlayCanvas) return;

    this.ctx = this.canvas.getContext("2d", { alpha: false });
    this.overlayCtx = this.overlayCanvas.getContext("2d", { alpha: true });

    if (!this.ctx || !this.overlayCtx) return;

    // Set initial canvas size
    this.canvas.width = 512;
    this.canvas.height = 512;
    this.overlayCanvas.width = 512;
    this.overlayCanvas.height = 512;
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
      // Also resize overlay canvas
      if (this.overlayCanvas) {
        this.overlayCanvas.width = canvasWidth;
        this.overlayCanvas.height = canvasHeight;
      }
      // Need to get context again after resizing
      this.ctx = this.canvas.getContext("2d", { alpha: false });
      if (this.overlayCanvas) {
        this.overlayCtx = this.overlayCanvas.getContext("2d", { alpha: true });
      }
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

    // Viewport overlay is drawn on separate canvas, not here
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
   * Handle mouse down - start placing tiles or dragging viewport
   */
  private handleMouseDown = (e: MouseEvent): void => {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicking inside viewport rectangle
    if (this.viewportEnabled && this.isInsideViewport(mouseX, mouseY)) {
      this.isDraggingViewport = true;
      this.viewportDragOffsetX = mouseX - (this.viewportX - this.scrollX);
      this.viewportDragOffsetY = mouseY - (this.viewportY - this.scrollY);
      e.preventDefault();
      return;
    }

    this.isPlacing = true;
    this.dispatchTilePlaceEvent("tile-place-start", e);
  };

  /**
   * Handle mouse move - continue placing tiles or dragging viewport
   */
  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.canvas) return;

    // Handle viewport dragging
    if (this.isDraggingViewport) {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - this.viewportDragOffsetX + this.scrollX;
      const newY = mouseY - this.viewportDragOffsetY + this.scrollY;

      this.setViewportPosition(Math.max(0, newX), Math.max(0, newY));
      e.preventDefault();
      return;
    }

    if (!this.isPlacing) return;
    this.dispatchTilePlaceEvent("tile-place-move", e);
  };

  /**
   * Handle mouse up - stop placing tiles or dragging viewport
   */
  private handleMouseUp = (e: MouseEvent): void => {
    if (this.isDraggingViewport) {
      this.isDraggingViewport = false;
      return;
    }

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

  /**
   * Toggle viewport overlay visibility
   */
  setViewportEnabled(enabled: boolean): void {
    this.viewportEnabled = enabled;

    if (!enabled) {
      // Immediately clear the overlay canvas when disabling
      if (this.overlayCtx && this.overlayCanvas) {
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      }
    } else {
      // When enabling, mark that viewport needs to be drawn
      this.viewportRedrawNeeded = true;
      this.scheduleRedraw();
    }
  }

  /**
   * Get viewport enabled state
   */
  getViewportEnabled(): boolean {
    return this.viewportEnabled;
  }

  /**
   * Set viewport position (in pixels)
   */
  setViewportPosition(x: number, y: number): void {
    this.viewportX = x;
    this.viewportY = y;

    // Only mark viewport redraw needed (not full redraw) for better performance
    this.viewportRedrawNeeded = true;
    // Use scheduled redraw to batch multiple position updates
    this.scheduleRedraw();

    // Dispatch event for external listeners
    this.dispatchEvent(
      new CustomEvent("viewport-changed", {
        detail: { x: this.viewportX, y: this.viewportY },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Get viewport position
   */
  getViewportPosition(): { x: number; y: number } {
    return { x: this.viewportX, y: this.viewportY };
  }

  /**
   * Check if a point is inside the viewport rectangle
   */
  private isInsideViewport(screenX: number, screenY: number): boolean {
    const viewportScreenX = this.viewportX - this.scrollX;
    const viewportScreenY = this.viewportY - this.scrollY;
    const viewportWidth = this.VIEWPORT_WIDTH_TILES * this.tileSize;
    const viewportHeight = this.VIEWPORT_HEIGHT_TILES * this.tileSize;

    return (
      screenX >= viewportScreenX &&
      screenX <= viewportScreenX + viewportWidth &&
      screenY >= viewportScreenY &&
      screenY <= viewportScreenY + viewportHeight
    );
  }

  /**
   * Draw viewport overlay on the separate overlay canvas
   * This is VERY fast because it doesn't touch the tilemap canvas at all
   */
  private drawViewportOverlay(): void {
    if (!this.overlayCtx || !this.overlayCanvas) return;

    // Clear the overlay canvas
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    if (!this.viewportEnabled) return;

    const screenX = this.viewportX - this.scrollX;
    const screenY = this.viewportY - this.scrollY;

    // Calculate viewport dimensions based on tile size (scales with zoom)
    const viewportWidth = this.VIEWPORT_WIDTH_TILES * this.tileSize;
    const viewportHeight = this.VIEWPORT_HEIGHT_TILES * this.tileSize;

    // Draw semi-transparent red rectangle
    this.overlayCtx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    this.overlayCtx.lineWidth = 2;
    this.overlayCtx.strokeRect(screenX, screenY, viewportWidth, viewportHeight);

    // Draw corner handles
    const handleSize = 8;
    this.overlayCtx.fillStyle = "rgba(255, 0, 0, 0.8)";

    // Top-left handle
    this.overlayCtx.fillRect(screenX - handleSize / 2, screenY - handleSize / 2, handleSize, handleSize);

    // Top-right handle
    this.overlayCtx.fillRect(screenX + viewportWidth - handleSize / 2, screenY - handleSize / 2, handleSize, handleSize);

    // Bottom-left handle
    this.overlayCtx.fillRect(screenX - handleSize / 2, screenY + viewportHeight - handleSize / 2, handleSize, handleSize);

    // Bottom-right handle
    this.overlayCtx.fillRect(screenX + viewportWidth - handleSize / 2, screenY + viewportHeight - handleSize / 2, handleSize, handleSize);

    // Draw label with scroll position
    const labelText = `Screen (${this.VIEWPORT_WIDTH_TILES}×${this.VIEWPORT_HEIGHT_TILES} tiles = ${this.VIEWPORT_WIDTH_PIXELS}×${this.VIEWPORT_HEIGHT_PIXELS}px) SCX0=${this.viewportX} SCY0=${this.viewportY}`;
    const labelWidth = Math.max(200, this.overlayCtx.measureText(labelText).width + 8);
    this.overlayCtx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.overlayCtx.fillRect(screenX, screenY - 20, labelWidth, 20);
    this.overlayCtx.fillStyle = "rgba(255, 255, 255, 1)";
    this.overlayCtx.font = "12px monospace";
    this.overlayCtx.fillText(labelText, screenX + 4, screenY - 6);
  }
}

customElements.define("tilemap-editor", TilemapEditor);
