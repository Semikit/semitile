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

import { EventEmitter } from "./EventEmitter.js";
import { TilemapModel } from "./TilemapModel.js";
import { WasmTilemap } from "../lib/wasm-loader.js";

/**
 * TilemapBankModel - Manages multiple tilemaps with observable interface
 *
 * This Model maintains an array of TilemapModel instances and tracks which
 * one is currently active. It emits events when tilemaps are added, removed,
 * or when the active tilemap changes.
 *
 * Events emitted:
 * - tilemapAdded: { index: number }
 * - tilemapDeleted: { index: number }
 * - activeTilemapChanged: { index: number }
 * - tilemapDuplicated: { originalIndex: number, newIndex: number }
 *
 * Usage:
 * ```typescript
 * const tilemapBank = new TilemapBankModel();
 *
 * tilemapBank.on('activeTilemapChanged', ({ index }) => {
 *   console.log(`Active tilemap: ${index}`);
 * });
 *
 * const newIndex = tilemapBank.addTilemap(32, 32);
 * tilemapBank.setActiveTilemap(newIndex);
 * ```
 */
export class TilemapBankModel extends EventEmitter {
  private tilemaps: TilemapModel[] = [];
  private activeTilemapIndex: number = 0;

  constructor() {
    super();
    // Start with one default 32×32 tilemap
    this.addTilemap(32, 32);
  }

  /**
   * Get the active tilemap
   */
  getActiveTilemap(): TilemapModel {
    return this.tilemaps[this.activeTilemapIndex];
  }

  /**
   * Get the active tilemap index
   */
  getActiveTilemapIndex(): number {
    return this.activeTilemapIndex;
  }

  /**
   * Get a tilemap by index
   *
   * @returns TilemapModel or undefined if index out of bounds
   */
  getTilemap(index: number): TilemapModel | undefined {
    return this.tilemaps[index];
  }

  /**
   * Get all tilemaps
   */
  getAllTilemaps(): TilemapModel[] {
    return [...this.tilemaps];
  }

  /**
   * Get the number of tilemaps
   */
  getTilemapCount(): number {
    return this.tilemaps.length;
  }

  /**
   * Add a new tilemap
   *
   * @param width - Width in tiles (1-256)
   * @param height - Height in tiles (1-256)
   * @returns Index of the new tilemap
   */
  addTilemap(width: number = 32, height: number = 32): number {
    const newTilemap = new TilemapModel(new WasmTilemap(width, height));
    const index = this.tilemaps.length;
    this.tilemaps.push(newTilemap);
    this.emit("tilemapAdded", { index });
    return index;
  }

  /**
   * Delete a tilemap by index
   *
   * Cannot delete if it's the last tilemap.
   *
   * @returns true if deleted, false if cannot delete
   */
  deleteTilemap(index: number): boolean {
    // Cannot delete the last tilemap
    if (this.tilemaps.length <= 1) {
      return false;
    }

    // Bounds check
    if (index < 0 || index >= this.tilemaps.length) {
      return false;
    }

    // Remove the tilemap
    this.tilemaps.splice(index, 1);

    // Adjust active index if needed
    if (this.activeTilemapIndex >= this.tilemaps.length) {
      this.activeTilemapIndex = this.tilemaps.length - 1;
      this.emit("activeTilemapChanged", { index: this.activeTilemapIndex });
    } else if (this.activeTilemapIndex > index) {
      this.activeTilemapIndex--;
      this.emit("activeTilemapChanged", { index: this.activeTilemapIndex });
    }

    this.emit("tilemapDeleted", { index });
    return true;
  }

  /**
   * Set the active tilemap by index
   */
  setActiveTilemap(index: number): void {
    if (index >= 0 && index < this.tilemaps.length) {
      this.activeTilemapIndex = index;
      this.emit("activeTilemapChanged", { index });
    }
  }

  /**
   * Duplicate a tilemap
   *
   * @param index - Index of tilemap to duplicate
   * @returns Index of the new tilemap, or -1 if failed
   */
  duplicateTilemap(index: number): number {
    if (index < 0 || index >= this.tilemaps.length) {
      return -1;
    }

    const original = this.tilemaps[index];
    const width = original.getWidth();
    const height = original.getHeight();
    const data = original.exportBinary();

    // Create new tilemap and import the data
    const newTilemap = new TilemapModel(new WasmTilemap(width, height));
    newTilemap.importBinary(data, width, height);

    const newIndex = this.tilemaps.length;
    this.tilemaps.push(newTilemap);

    this.emit("tilemapDuplicated", { originalIndex: index, newIndex });
    this.emit("tilemapAdded", { index: newIndex });

    return newIndex;
  }

  /**
   * Export all tilemaps as binary data
   *
   * @returns Array of { width, height, data } objects
   */
  exportAllTilemaps(): Array<{
    width: number;
    height: number;
    data: Uint8Array;
  }> {
    return this.tilemaps.map((tilemap) => ({
      width: tilemap.getWidth(),
      height: tilemap.getHeight(),
      data: tilemap.exportBinary(),
    }));
  }

  /**
   * Import tilemaps from array of data
   *
   * Clears existing tilemaps and replaces with imported ones.
   */
  importTilemaps(
    tilemaps: Array<{ width: number; height: number; data: Uint8Array }>
  ): void {
    // Clear existing tilemaps
    this.tilemaps = [];

    // Import all tilemaps
    tilemaps.forEach(({ width, height, data }) => {
      const tilemap = new TilemapModel(new WasmTilemap(width, height));
      tilemap.importBinary(data, width, height);
      this.tilemaps.push(tilemap);
    });

    // Ensure at least one tilemap exists
    if (this.tilemaps.length === 0) {
      this.addTilemap(32, 32);
    }

    // Reset active index
    this.activeTilemapIndex = 0;
    this.emit("activeTilemapChanged", { index: 0 });
  }
}
