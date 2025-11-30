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

import type { TileModel } from "../../models/TileModel.js";
import type { PaletteModel } from "../../models/PaletteModel.js";
import type { EditorState } from "../../models/EditorState.js";

/**
 * TileCanvas - Pure View component for rendering and editing a single tile
 *
 * This is a Web Component that provides a pixel-perfect canvas for editing
 * 8×8 tiles. It follows the MVC pattern as a pure View - it only renders
 * state from Models and dispatches events for user interactions.
 *
 * The component does NOT maintain its own state or modify Models directly.
 * All user interactions are dispatched as custom events for Controllers to handle.
 *
 * Custom Events Dispatched:
 * - 'draw-start': User started drawing (mousedown)
 * - 'draw-move': User is drawing (mousemove while mouse is down)
 * - 'draw-end': User stopped drawing (mouseup)
 *
 * Event detail: { x: number, y: number } - tile pixel coordinates (0-7)
 *
 * Usage:
 * ```html
 * <tile-canvas></tile-canvas>
 * ```
 *
 * ```typescript
 * const canvas = document.querySelector('tile-canvas');
 * canvas.setModels(tileModel, paletteModel, editorState);
 *
 * canvas.addEventListener('draw-start', (e) => {
 *   console.log(`Drawing started at (${e.detail.x}, ${e.detail.y})`);
 * });
 * ```
 */
export class TileCanvas extends HTMLElement {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private tileModel: TileModel | null = null;
  private paletteModel: PaletteModel | null = null;
  private editorState: EditorState | null = null;

  // Bound event handlers (so we can remove them later)
  private handleModelChange = () => this.redraw();
  private handleStateChange = () => this.redraw();

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  /**
   * Called when the element is added to the DOM
   */
  connectedCallback(): void {
    this.render();
    this.setupCanvas();
    this.attachEventListeners();
  }

  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback(): void {
    this.cleanupModelListeners();
  }

  /**
   * Inject model dependencies and subscribe to their events
   *
   * This method should be called by the Controller to wire up the View to the Models.
   *
   * @param tileModel - The tile data model
   * @param paletteModel - The palette data model
   * @param editorState - The editor state model
   */
  setModels(
    tileModel: TileModel,
    paletteModel: PaletteModel,
    editorState: EditorState
  ): void {
    // Clean up old listeners if models were already set
    this.cleanupModelListeners();

    // Store model references
    this.tileModel = tileModel;
    this.paletteModel = paletteModel;
    this.editorState = editorState;

    // Subscribe to model events
    this.tileModel.on("pixelChanged", this.handleModelChange);
    this.tileModel.on("tileImported", this.handleModelChange);
    this.tileModel.on("tileCleared", this.handleModelChange);

    this.paletteModel.on("colorChanged", this.handleModelChange);
    this.paletteModel.on("paletteImported", this.handleModelChange);
    this.paletteModel.on("subPaletteChanged", this.handleModelChange);

    this.editorState.on("zoomChanged", this.handleStateChange);
    this.editorState.on("gridToggled", this.handleStateChange);

    // Initial render
    this.redraw();
  }

  /**
   * Remove all model event listeners
   */
  private cleanupModelListeners(): void {
    if (this.tileModel) {
      this.tileModel.off("pixelChanged", this.handleModelChange);
      this.tileModel.off("tileImported", this.handleModelChange);
      this.tileModel.off("tileCleared", this.handleModelChange);
    }

    if (this.paletteModel) {
      this.paletteModel.off("colorChanged", this.handleModelChange);
      this.paletteModel.off("paletteImported", this.handleModelChange);
      this.paletteModel.off("subPaletteChanged", this.handleModelChange);
    }

    if (this.editorState) {
      this.editorState.off("zoomChanged", this.handleStateChange);
      this.editorState.off("gridToggled", this.handleStateChange);
    }
  }

  /**
   * Render the Shadow DOM structure
   */
  private render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
        }

        .tile-canvas-container {
          display: flex;
          justify-content: center;
          align-items: center;
          background: #0a0a0f;
          border: 2px solid #0f3460;
          border-radius: 4px;
          padding: 8px;
          cursor: crosshair;
        }

        .tile-canvas-container:hover {
          border-color: #00d4ff;
        }

        canvas {
          display: block;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
          background: #000;
        }
      </style>
      <div class="tile-canvas-container">
        <canvas id="canvas" width="128" height="128"></canvas>
      </div>
    `;
  }

  /**
   * Set up the canvas and rendering context
   */
  private setupCanvas(): void {
    if (!this.shadowRoot) return;

    this.canvas = this.shadowRoot.getElementById("canvas") as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext("2d", { alpha: false });
    }
  }

  /**
   * Pure rendering method - reads from Models and draws to canvas
   *
   * This method has no side effects and does not modify any state.
   */
  private redraw(): void {
    if (
      !this.canvas ||
      !this.ctx ||
      !this.tileModel ||
      !this.paletteModel ||
      !this.editorState
    ) {
      return;
    }

    const zoom = this.editorState.getZoom();
    const activePalette = this.paletteModel.getActiveSubPalette();

    // Resize canvas to match zoom level
    this.canvas.width = 8 * zoom;
    this.canvas.height = 8 * zoom;

    // Render all pixels
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const colorIdx = this.tileModel.getPixel(x, y);
        const color = this.paletteModel.getColor(activePalette, colorIdx);
        this.ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
        this.ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }

    // Draw grid if enabled
    if (this.editorState.isGridEnabled()) {
      this.drawGrid(zoom);
    }
  }

  /**
   * Draw grid overlay on the canvas
   *
   * @param zoom - Current zoom level (pixels per tile pixel)
   */
  private drawGrid(zoom: number): void {
    if (!this.ctx) return;

    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    this.ctx.lineWidth = 1;

    // Draw vertical lines
    for (let i = 0; i <= 8; i++) {
      const pos = i * zoom;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, 8 * zoom);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let i = 0; i <= 8; i++) {
      const pos = i * zoom;
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(8 * zoom, pos);
      this.ctx.stroke();
    }
  }

  /**
   * Attach mouse event listeners to the canvas
   */
  private attachEventListeners(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener("mousedown", (e) => {
      this.dispatchInteractionEvent("draw-start", e);
    });

    this.canvas.addEventListener("mousemove", (e) => {
      this.dispatchInteractionEvent("draw-move", e);
    });

    this.canvas.addEventListener("mouseup", (e) => {
      this.dispatchInteractionEvent("draw-end", e);
    });

    // Also handle mouse leaving the canvas
    this.canvas.addEventListener("mouseleave", (e) => {
      this.dispatchInteractionEvent("draw-end", e);
    });
  }

  /**
   * Convert mouse event to tile coordinates and dispatch custom event
   *
   * This is the only way the View communicates user interactions - it does NOT
   * modify Models directly.
   *
   * @param type - Event type ('draw-start', 'draw-move', 'draw-end')
   * @param e - Mouse event
   */
  private dispatchInteractionEvent(type: string, e: MouseEvent): void {
    if (!this.canvas || !this.editorState) return;

    const rect = this.canvas.getBoundingClientRect();
    const zoom = this.editorState.getZoom();

    // Convert mouse coordinates to tile pixel coordinates
    const x = Math.floor((e.clientX - rect.left) / zoom);
    const y = Math.floor((e.clientY - rect.top) / zoom);

    // Only dispatch if coordinates are within bounds
    if (x >= 0 && x < 8 && y >= 0 && y < 8) {
      this.dispatchEvent(
        new CustomEvent(type, {
          detail: { x, y },
          bubbles: true,
          composed: true, // Allow event to cross shadow DOM boundary
        })
      );
    }
  }
}

// Register the custom element
customElements.define("tile-canvas", TileCanvas);
