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

import { TilemapBankModel } from "../models/TilemapBankModel.js";
import type { TilemapBank } from "../views/TilemapBank/TilemapBank.js";

/**
 * TilemapBankController - Business logic for tilemap bank management
 *
 * This Controller coordinates between the TilemapBank View and TilemapBankModel.
 * It handles user interactions from the View and updates the Model accordingly.
 *
 * Responsibilities:
 * - Wire up TilemapBank View to TilemapBankModel
 * - Handle tilemap selection, add, delete, duplicate events
 * - Update Model based on user actions
 *
 * Usage:
 * ```typescript
 * const controller = new TilemapBankController(
 *   tilemapBankModel,
 *   tilemapBankView
 * );
 * ```
 */
export class TilemapBankController {
  constructor(
    private tilemapBankModel: TilemapBankModel,
    private view: TilemapBank
  ) {
    this.setupView();
    this.attachViewListeners();
  }

  /**
   * Inject Model into View
   */
  private setupView(): void {
    this.view.setModel(this.tilemapBankModel);
  }

  /**
   * Attach listeners to View events
   */
  private attachViewListeners(): void {
    this.view.addEventListener("tilemap-select-clicked", this.handleTilemapSelect);
    this.view.addEventListener("tilemap-add-clicked", this.handleTilemapAdd);
    this.view.addEventListener("tilemap-delete-clicked", this.handleTilemapDelete);
    this.view.addEventListener("tilemap-duplicate-clicked", this.handleTilemapDuplicate);
  }

  /**
   * Handle tilemap selection
   */
  private handleTilemapSelect = (e: Event): void => {
    const customEvent = e as CustomEvent<{ index: number }>;
    this.tilemapBankModel.setActiveTilemap(customEvent.detail.index);
  };

  /**
   * Handle adding a new tilemap
   */
  private handleTilemapAdd = (): void => {
    const newIndex = this.tilemapBankModel.addTilemap(32, 32);
    this.tilemapBankModel.setActiveTilemap(newIndex);
  };

  /**
   * Handle deleting a tilemap
   */
  private handleTilemapDelete = (e: Event): void => {
    const customEvent = e as CustomEvent<{ index: number }>;
    const success = this.tilemapBankModel.deleteTilemap(customEvent.detail.index);

    if (!success) {
      console.warn("[TilemapBankController] Cannot delete last tilemap");
    }
  };

  /**
   * Handle duplicating a tilemap
   */
  private handleTilemapDuplicate = (e: Event): void => {
    const customEvent = e as CustomEvent<{ index: number }>;
    const newIndex = this.tilemapBankModel.duplicateTilemap(customEvent.detail.index);

    if (newIndex >= 0) {
      this.tilemapBankModel.setActiveTilemap(newIndex);
    }
  };

  /**
   * Cleanup method - removes event listeners
   */
  dispose(): void {
    this.view.removeEventListener("tilemap-select-clicked", this.handleTilemapSelect);
    this.view.removeEventListener("tilemap-add-clicked", this.handleTilemapAdd);
    this.view.removeEventListener("tilemap-delete-clicked", this.handleTilemapDelete);
    this.view.removeEventListener("tilemap-duplicate-clicked", this.handleTilemapDuplicate);
  }
}
