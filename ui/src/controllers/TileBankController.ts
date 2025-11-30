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
import type { TileBank } from "../views/TileBank/TileBank.js";

/**
 * TileBankController - Business logic for tile bank management
 *
 * This Controller coordinates between the TileBank View and the Models.
 * It handles user interactions from the View and updates Models accordingly.
 *
 * Responsibilities:
 * - Wire up View to Models
 * - Handle tile selection events from View
 * - Handle add/delete/duplicate tile events from View
 * - Update TileBankModel based on user actions
 * - Provide public API for external control
 *
 * Usage:
 * ```typescript
 * const controller = new TileBankController(
 *   tileBankModel,
 *   paletteModel,
 *   tileBankView
 * );
 *
 * // The controller is now active and handling all interactions
 * // You can call public methods:
 * controller.selectTile(5);
 * controller.addTile();
 * ```
 */
export class TileBankController {
  constructor(
    private tileBankModel: TileBankModel,
    private paletteModel: PaletteModel,
    private view: TileBank
  ) {
    this.setupView();
    this.attachViewListeners();
  }

  /**
   * Inject Models into View to wire up the MVC connection
   */
  private setupView(): void {
    this.view.setModels(this.tileBankModel, this.paletteModel);
  }

  /**
   * Attach listeners to View events
   */
  private attachViewListeners(): void {
    this.view.addEventListener("tile-select-clicked", this.handleTileSelect);
    this.view.addEventListener("tile-add-clicked", this.handleTileAdd);
    this.view.addEventListener("tile-delete-clicked", this.handleTileDelete);
    this.view.addEventListener("tile-duplicate-clicked", this.handleTileDuplicate);
  }

  /**
   * Handle tile selection event from View
   */
  private handleTileSelect = (e: Event): void => {
    const customEvent = e as CustomEvent<{ index: number }>;
    const { index } = customEvent.detail;

    // Update the Model - this will trigger View re-render via events
    this.tileBankModel.setActiveTile(index);
  };

  /**
   * Handle tile add event from View
   */
  private handleTileAdd = (): void => {
    const newIndex = this.tileBankModel.addTile();
    // Automatically select the new tile
    this.tileBankModel.setActiveTile(newIndex);
  };

  /**
   * Handle tile delete event from View
   */
  private handleTileDelete = (e: Event): void => {
    const customEvent = e as CustomEvent<{ index: number }>;
    const { index } = customEvent.detail;

    // Delete the tile - Model will handle active tile adjustment
    this.tileBankModel.deleteTile(index);
  };

  /**
   * Handle tile duplicate event from View
   */
  private handleTileDuplicate = (e: Event): void => {
    const customEvent = e as CustomEvent<{ index: number }>;
    const { index } = customEvent.detail;

    const newIndex = this.tileBankModel.duplicateTile(index);
    if (newIndex >= 0) {
      // Automatically select the new tile
      this.tileBankModel.setActiveTile(newIndex);
    }
  };

  /**
   * Programmatically select a tile
   *
   * Public API method for external control.
   *
   * @param index - Tile index to select
   */
  public selectTile(index: number): void {
    this.tileBankModel.setActiveTile(index);
  }

  /**
   * Programmatically add a new tile
   *
   * Public API method for external control.
   *
   * @returns The index of the newly added tile
   */
  public addTile(): number {
    return this.tileBankModel.addTile();
  }

  /**
   * Programmatically delete a tile
   *
   * Public API method for external control.
   *
   * @param index - Tile index to delete
   * @returns true if deleted, false otherwise
   */
  public deleteTile(index: number): boolean {
    return this.tileBankModel.deleteTile(index);
  }

  /**
   * Programmatically duplicate a tile
   *
   * Public API method for external control.
   *
   * @param index - Tile index to duplicate
   * @returns The index of the new tile, or -1 if failed
   */
  public duplicateTile(index: number): number {
    return this.tileBankModel.duplicateTile(index);
  }

  /**
   * Get the currently selected tile index
   *
   * @returns Active tile index
   */
  public getActiveTileIndex(): number {
    return this.tileBankModel.getActiveTileIndex();
  }

  /**
   * Get the total number of tiles
   *
   * @returns Tile count
   */
  public getTileCount(): number {
    return this.tileBankModel.getTileCount();
  }

  /**
   * Cleanup method - removes event listeners
   *
   * Call this when the controller is no longer needed.
   */
  public dispose(): void {
    this.view.removeEventListener("tile-select-clicked", this.handleTileSelect);
    this.view.removeEventListener("tile-add-clicked", this.handleTileAdd);
    this.view.removeEventListener("tile-delete-clicked", this.handleTileDelete);
    this.view.removeEventListener("tile-duplicate-clicked", this.handleTileDuplicate);
  }
}
