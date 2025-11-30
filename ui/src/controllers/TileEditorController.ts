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

import { TileBankModel } from "../models/TileBankModel.js";
import { PaletteModel } from "../models/PaletteModel.js";
import { EditorState, Tool } from "../models/EditorState.js";
import type { TileCanvas } from "../views/TileCanvas/TileCanvas.js";
import { CommandHistory } from "../models/CommandHistory.js";
import {
  SetPixelCommand,
  FillCommand,
  LineCommand,
  RectangleCommand,
  ClearTileCommand,
} from "../models/TileCommands.js";

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
 *   tileBankModel,
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
  private commandHistory: CommandHistory;

  constructor(
    private tileBankModel: TileBankModel,
    private paletteModel: PaletteModel,
    private editorState: EditorState,
    private view: TileCanvas,
    commandHistory?: CommandHistory
  ) {
    this.commandHistory = commandHistory || new CommandHistory();
    this.setupView();
    this.attachViewListeners();
    this.attachTileBankListeners();
  }

  /**
   * Inject Models into View to wire up the MVC connection
   */
  private setupView(): void {
    const activeTile = this.tileBankModel.getActiveTile();
    this.view.setModels(activeTile, this.paletteModel, this.editorState);
  }

  /**
   * Listen to TileBankModel events to update View when active tile changes
   */
  private attachTileBankListeners(): void {
    this.tileBankModel.on("activeTileChanged", this.handleActiveTileChanged);
  }

  /**
   * Handle active tile change - update the View to point to the new active tile
   */
  private handleActiveTileChanged = (): void => {
    const activeTile = this.tileBankModel.getActiveTile();
    this.view.setModels(activeTile, this.paletteModel, this.editorState);
    console.log("[TileEditorController] Active tile changed, View updated");
  };

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
    const activeTile = this.tileBankModel.getActiveTile();
    const colorIndex = this.paletteModel.getSelectedColorIndex();
    const command = new SetPixelCommand(activeTile, x, y, colorIndex);
    this.commandHistory.executeCommand(command);
  }

  /**
   * Flood fill algorithm
   *
   * Fills all connected pixels of the same color with the selected color.
   */
  private floodFill(startX: number, startY: number): void {
    const activeTile = this.tileBankModel.getActiveTile();
    const newColor = this.paletteModel.getSelectedColorIndex();
    const command = new FillCommand(activeTile, startX, startY, newColor);
    this.commandHistory.executeCommand(command);
  }

  /**
   * Draw a line using Bresenham's line algorithm
   */
  private drawLine(x0: number, y0: number, x1: number, y1: number): void {
    const activeTile = this.tileBankModel.getActiveTile();
    const colorIndex = this.paletteModel.getSelectedColorIndex();
    const command = new LineCommand(activeTile, x0, y0, x1, y1, colorIndex);
    this.commandHistory.executeCommand(command);
  }

  /**
   * Draw a filled rectangle
   */
  private drawRectangle(x0: number, y0: number, x1: number, y1: number): void {
    const activeTile = this.tileBankModel.getActiveTile();
    const colorIndex = this.paletteModel.getSelectedColorIndex();
    const command = new RectangleCommand(
      activeTile,
      x0,
      y0,
      x1,
      y1,
      colorIndex
    );
    this.commandHistory.executeCommand(command);
  }

  /**
   * Clear the active tile
   *
   * Public API method for external control.
   */
  public clear(): void {
    const activeTile = this.tileBankModel.getActiveTile();
    const command = new ClearTileCommand(activeTile);
    this.commandHistory.executeCommand(command);
  }

  /**
   * Undo the last action
   */
  public undo(): void {
    this.commandHistory.undo();
  }

  /**
   * Redo the last undone action
   */
  public redo(): void {
    this.commandHistory.redo();
  }

  /**
   * Check if undo is available
   */
  public canUndo(): boolean {
    return this.commandHistory.canUndo();
  }

  /**
   * Check if redo is available
   */
  public canRedo(): boolean {
    return this.commandHistory.canRedo();
  }

  /**
   * Get the command history instance
   */
  public getCommandHistory(): CommandHistory {
    return this.commandHistory;
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
    this.tileBankModel.off("activeTileChanged", this.handleActiveTileChanged);
  }
}
