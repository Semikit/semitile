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

import { TilemapModel } from "../models/TilemapModel.js";
import { TileBankModel } from "../models/TileBankModel.js";
import type { TilemapEditor } from "../views/TilemapEditor/TilemapEditor.js";

/**
 * TilemapController - Business logic for tilemap editing
 *
 * This Controller coordinates between the TilemapEditor View and the Models.
 * It handles user interactions from the View and updates Models accordingly.
 *
 * Responsibilities:
 * - Wire up TilemapEditor View to Models
 * - Handle tile placement events from View
 * - Update TilemapModel with selected tile from TileBankModel
 * - Track tile attributes (palette, flips)
 *
 * Usage:
 * ```typescript
 * const controller = new TilemapController(
 *   tilemapModel,
 *   tileBankModel,
 *   paletteModel,
 *   tilemapEditorView
 * );
 *
 * // Controller now handles all tilemap interactions
 * ```
 */
export class TilemapController {
  // Tile attributes for placement
  private currentPaletteIdx: number = 0;
  private currentHFlip: boolean = false;
  private currentVFlip: boolean = false;

  constructor(
    private tilemapModel: TilemapModel,
    private tileBankModel: TileBankModel,
    private view: TilemapEditor
  ) {
    this.attachViewListeners();
  }

  /**
   * Attach listeners to View events
   */
  private attachViewListeners(): void {
    this.view.addEventListener("tile-place-start", this.handleTilePlaceStart);
    this.view.addEventListener("tile-place-move", this.handleTilePlaceMove);
    this.view.addEventListener("tile-place-end", this.handleTilePlaceEnd);
  }

  /**
   * Handle tile placement start
   */
  private handleTilePlaceStart = (e: Event): void => {
    const customEvent = e as CustomEvent<{ x: number; y: number }>;
    const { x, y } = customEvent.detail;
    this.placeTile(x, y);
  };

  /**
   * Handle tile placement move (dragging)
   */
  private handleTilePlaceMove = (e: Event): void => {
    const customEvent = e as CustomEvent<{ x: number; y: number }>;
    const { x, y } = customEvent.detail;
    this.placeTile(x, y);
  };

  /**
   * Handle tile placement end
   */
  private handleTilePlaceEnd = (e: Event): void => {
    const customEvent = e as CustomEvent<{ x: number; y: number }>;
    const { x, y } = customEvent.detail;
    this.placeTile(x, y);
  };

  /**
   * Place the active tile at the specified tilemap coordinates
   */
  private placeTile(x: number, y: number): void {
    const activeTileIndex = this.tileBankModel.getActiveTileIndex();

    this.tilemapModel.setEntry(
      x,
      y,
      activeTileIndex,
      this.currentPaletteIdx,
      this.currentHFlip,
      this.currentVFlip
    );
  }

  /**
   * Set palette index for tile placement
   */
  setPaletteIdx(paletteIdx: number): void {
    this.currentPaletteIdx = Math.max(0, Math.min(15, paletteIdx));
  }

  /**
   * Set horizontal flip for tile placement
   */
  setHFlip(hFlip: boolean): void {
    this.currentHFlip = hFlip;
  }

  /**
   * Set vertical flip for tile placement
   */
  setVFlip(vFlip: boolean): void {
    this.currentVFlip = vFlip;
  }

  /**
   * Get current palette index
   */
  getPaletteIdx(): number {
    return this.currentPaletteIdx;
  }

  /**
   * Get current horizontal flip
   */
  getHFlip(): boolean {
    return this.currentHFlip;
  }

  /**
   * Get current vertical flip
   */
  getVFlip(): boolean {
    return this.currentVFlip;
  }

  /**
   * Clear the entire tilemap
   */
  clear(): void {
    this.tilemapModel.clear();
  }

  /**
   * Fill the entire tilemap with the active tile
   */
  fill(): void {
    const activeTileIndex = this.tileBankModel.getActiveTileIndex();
    this.tilemapModel.fill(
      activeTileIndex,
      this.currentPaletteIdx,
      this.currentHFlip,
      this.currentVFlip
    );
  }

  /**
   * Resize the tilemap
   */
  resize(width: number, height: number): void {
    this.tilemapModel.resize(width, height);
  }

  /**
   * Cleanup method - removes event listeners
   */
  dispose(): void {
    this.view.removeEventListener("tile-place-start", this.handleTilePlaceStart);
    this.view.removeEventListener("tile-place-move", this.handleTilePlaceMove);
    this.view.removeEventListener("tile-place-end", this.handleTilePlaceEnd);
  }
}
