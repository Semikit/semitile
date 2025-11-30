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

import { TileModel } from "../models/TileModel.js";
import { PaletteModel } from "../models/PaletteModel.js";
import { EditorState, Tool } from "../models/EditorState.js";
import type { TileCanvas } from "../views/TileCanvas/TileCanvas.js";

/**
 * TileEditorController - Business logic for tile editing
 *
 * This Controller coordinates between the TileCanvas View and the Models.
 * It handles user interactions from the View and updates Models accordingly.
 *
 * Responsibilities:
 * - Wire up View to Models
 * - Handle drawing events from View
 * - Implement tool logic (Pencil, Fill, Line, Rectangle)
 * - Update TileModel based on user actions
 * - Provide public API for external control
 *
 * Usage:
 * ```typescript
 * const controller = new TileEditorController(
 *   tileModel,
 *   paletteModel,
 *   editorState,
 *   tileCanvasView
 * );
 *
 * // The controller is now active and handling all interactions
 * // You can call public methods:
 * controller.clear();
 * ```
 */
export class TileEditorController {
  private isDrawing: boolean = false;
  private lineStartX: number = -1;
  private lineStartY: number = -1;

  constructor(
    private tileModel: TileModel,
    private paletteModel: PaletteModel,
    private editorState: EditorState,
    private view: TileCanvas
  ) {
    this.setupView();
    this.attachViewListeners();
  }

  /**
   * Inject Models into View to wire up the MVC connection
   */
  private setupView(): void {
    this.view.setModels(this.tileModel, this.paletteModel, this.editorState);
  }

  /**
   * Attach listeners to View events
   */
  private attachViewListeners(): void {
    this.view.addEventListener("draw-start", this.handleDrawStart);
    this.view.addEventListener("draw-move", this.handleDrawMove);
    this.view.addEventListener("draw-end", this.handleDrawEnd);
  }

  /**
   * Handle draw-start event from View
   */
  private handleDrawStart = (e: Event): void => {
    const customEvent = e as CustomEvent<{ x: number; y: number }>;
    const { x, y } = customEvent.detail;

    this.isDrawing = true;
    const tool = this.editorState.getTool();

    // Store start position for line and rectangle tools
    if (tool === Tool.Line || tool === Tool.Rectangle) {
      this.lineStartX = x;
      this.lineStartY = y;
    }

    // Pencil and fill tools act immediately on mouse down
    if (tool === Tool.Pencil) {
      this.drawPixel(x, y);
    } else if (tool === Tool.Fill) {
      this.floodFill(x, y);
    }
  };

  /**
   * Handle draw-move event from View
   */
  private handleDrawMove = (e: Event): void => {
    if (!this.isDrawing) return;

    const customEvent = e as CustomEvent<{ x: number; y: number }>;
    const { x, y } = customEvent.detail;

    const tool = this.editorState.getTool();

    // Only pencil tool draws while moving
    if (tool === Tool.Pencil) {
      this.drawPixel(x, y);
    }
  };

  /**
   * Handle draw-end event from View
   */
  private handleDrawEnd = (e: Event): void => {
    if (!this.isDrawing) return;

    const customEvent = e as CustomEvent<{ x: number; y: number }>;
    const { x, y } = customEvent.detail;

    const tool = this.editorState.getTool();

    // Line and rectangle tools draw on mouse up
    if (tool === Tool.Line) {
      this.drawLine(this.lineStartX, this.lineStartY, x, y);
    } else if (tool === Tool.Rectangle) {
      this.drawRectangle(this.lineStartX, this.lineStartY, x, y);
    }

    this.isDrawing = false;
  };

  /**
   * Draw a single pixel with the selected color
   */
  private drawPixel(x: number, y: number): void {
    const colorIndex = this.paletteModel.getSelectedColorIndex();
    this.tileModel.setPixel(x, y, colorIndex);
  }

  /**
   * Flood fill algorithm
   *
   * Fills all connected pixels of the same color with the selected color.
   */
  private floodFill(startX: number, startY: number): void {
    const newColor = this.paletteModel.getSelectedColorIndex();
    const targetColor = this.tileModel.getPixel(startX, startY);

    // Nothing to do if colors are the same
    if (targetColor === newColor) return;

    // Use a stack-based approach to avoid recursion stack overflow
    const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;

      // Skip if out of bounds
      if (x < 0 || x >= 8 || y < 0 || y >= 8) continue;

      // Skip if not the target color
      if (this.tileModel.getPixel(x, y) !== targetColor) continue;

      // Fill this pixel
      this.tileModel.setPixel(x, y, newColor);

      // Add neighbors to stack
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }
  }

  /**
   * Draw a line using Bresenham's line algorithm
   */
  private drawLine(x0: number, y0: number, x1: number, y1: number): void {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {
      this.drawPixel(x, y);

      // Check if we've reached the end
      if (x === x1 && y === y1) break;

      const e2 = 2 * err;

      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }

      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /**
   * Draw a filled rectangle
   */
  private drawRectangle(x0: number, y0: number, x1: number, y1: number): void {
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (x >= 0 && x < 8 && y >= 0 && y < 8) {
          this.drawPixel(x, y);
        }
      }
    }
  }

  /**
   * Clear the entire tile
   *
   * Public API method for external control.
   */
  public clear(): void {
    this.tileModel.clear();
  }

  /**
   * Undo the last action
   *
   * TODO: Implement with CommandHistory (Stage 11)
   */
  public undo(): void {
    console.warn("Undo not yet implemented - will be added in Stage 11");
  }

  /**
   * Redo the last undone action
   *
   * TODO: Implement with CommandHistory (Stage 11)
   */
  public redo(): void {
    console.warn("Redo not yet implemented - will be added in Stage 11");
  }

  /**
   * Cleanup method - removes event listeners
   *
   * Call this when the controller is no longer needed.
   */
  public dispose(): void {
    this.view.removeEventListener("draw-start", this.handleDrawStart);
    this.view.removeEventListener("draw-move", this.handleDrawMove);
    this.view.removeEventListener("draw-end", this.handleDrawEnd);
  }
}
