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
import { WasmTile } from "../lib/wasm-loader.js";
import { TileModel } from "./TileModel.js";

/**
 * TileBankModel - Manages multiple tiles with observable interface
 *
 * This Model manages an array of TileModel instances, tracks the active tile,
 * and provides methods for adding, deleting, and selecting tiles.
 *
 * Events emitted:
 * - 'tileAdded': { index: number } - When a new tile is added
 * - 'tileDeleted': { index: number } - When a tile is deleted
 * - 'activeTileChanged': { index: number } - When the active tile changes
 * - 'tileBankCleared': {} - When all tiles are cleared
 *
 * Usage:
 * ```typescript
 * const tileBank = new TileBankModel();
 *
 * // Add a tile
 * tileBank.addTile();
 *
 * // Get the active tile
 * const activeTile = tileBank.getActiveTile();
 *
 * // Listen to events
 * tileBank.on('activeTileChanged', ({ index }) => {
 *   console.log(`Active tile changed to ${index}`);
 * });
 * ```
 */
export class TileBankModel extends EventEmitter {
  private tiles: TileModel[] = [];
  private activeTileIndex: number = 0;

  constructor() {
    super();
    // Start with one empty tile
    this.addTile();
  }

  /**
   * Get the active tile
   */
  getActiveTile(): TileModel {
    return this.tiles[this.activeTileIndex];
  }

  /**
   * Get a tile by index
   */
  getTile(index: number): TileModel | null {
    if (index >= 0 && index < this.tiles.length) {
      return this.tiles[index];
    }
    return null;
  }

  /**
   * Get all tiles
   */
  getAllTiles(): TileModel[] {
    return this.tiles;
  }

  /**
   * Get the number of tiles
   */
  getTileCount(): number {
    return this.tiles.length;
  }

  /**
   * Get the active tile index
   */
  getActiveTileIndex(): number {
    return this.activeTileIndex;
  }

  /**
   * Set the active tile by index
   */
  setActiveTile(index: number): void {
    if (index >= 0 && index < this.tiles.length && index !== this.activeTileIndex) {
      this.activeTileIndex = index;
      this.emit("activeTileChanged", { index });
      console.log(`[TileBankModel] Active tile changed to ${index}`);
    }
  }

  /**
   * Add a new tile
   * @returns The index of the newly added tile
   */
  addTile(): number {
    const newTile = new TileModel(new WasmTile());
    const index = this.tiles.length;
    this.tiles.push(newTile);
    this.emit("tileAdded", { index });
    console.log(`[TileBankModel] Tile added at index ${index}`);
    return index;
  }

  /**
   * Delete a tile by index
   * @returns true if the tile was deleted, false otherwise
   */
  deleteTile(index: number): boolean {
    // Can't delete if it's the only tile
    if (this.tiles.length <= 1) {
      console.warn("[TileBankModel] Cannot delete the last tile");
      return false;
    }

    if (index >= 0 && index < this.tiles.length) {
      // Clean up the WASM tile
      const tile = this.tiles[index];
      if (tile && typeof (tile as any).dispose === "function") {
        (tile as any).dispose();
      }

      this.tiles.splice(index, 1);

      // Adjust active tile index if necessary
      if (this.activeTileIndex >= this.tiles.length) {
        this.activeTileIndex = this.tiles.length - 1;
        this.emit("activeTileChanged", { index: this.activeTileIndex });
      } else if (this.activeTileIndex > index) {
        this.activeTileIndex--;
        this.emit("activeTileChanged", { index: this.activeTileIndex });
      }

      this.emit("tileDeleted", { index });
      console.log(`[TileBankModel] Tile deleted at index ${index}`);
      return true;
    }

    return false;
  }

  /**
   * Duplicate a tile
   * @param index - Index of the tile to duplicate
   * @returns The index of the new tile, or -1 if failed
   */
  duplicateTile(index: number): number {
    if (index >= 0 && index < this.tiles.length) {
      const sourceTile = this.tiles[index];
      const planarData = sourceTile.exportPlanar();

      const newTile = new TileModel(new WasmTile());
      newTile.importPlanar(planarData);

      const newIndex = this.tiles.length;
      this.tiles.push(newTile);
      this.emit("tileAdded", { index: newIndex });
      console.log(`[TileBankModel] Tile ${index} duplicated to ${newIndex}`);
      return newIndex;
    }

    return -1;
  }

  /**
   * Copy tile data from one index to another
   * @param sourceIndex - Index of the source tile
   * @param targetIndex - Index of the target tile
   * @returns true if successful, false otherwise
   */
  copyTile(sourceIndex: number, targetIndex: number): boolean {
    if (
      sourceIndex >= 0 &&
      sourceIndex < this.tiles.length &&
      targetIndex >= 0 &&
      targetIndex < this.tiles.length
    ) {
      const planarData = this.tiles[sourceIndex].exportPlanar();
      this.tiles[targetIndex].importPlanar(planarData);
      console.log(`[TileBankModel] Copied tile ${sourceIndex} to ${targetIndex}`);
      return true;
    }

    return false;
  }

  /**
   * Move a tile from one index to another
   * @param fromIndex - Source index
   * @param toIndex - Target index
   * @returns true if successful, false otherwise
   */
  moveTile(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex >= 0 &&
      fromIndex < this.tiles.length &&
      toIndex >= 0 &&
      toIndex < this.tiles.length &&
      fromIndex !== toIndex
    ) {
      const tile = this.tiles.splice(fromIndex, 1)[0];
      this.tiles.splice(toIndex, 0, tile);

      // Adjust active tile index
      if (this.activeTileIndex === fromIndex) {
        this.activeTileIndex = toIndex;
        this.emit("activeTileChanged", { index: toIndex });
      } else if (fromIndex < this.activeTileIndex && toIndex >= this.activeTileIndex) {
        this.activeTileIndex--;
        this.emit("activeTileChanged", { index: this.activeTileIndex });
      } else if (fromIndex > this.activeTileIndex && toIndex <= this.activeTileIndex) {
        this.activeTileIndex++;
        this.emit("activeTileChanged", { index: this.activeTileIndex });
      }

      this.emit("tileMoved", { fromIndex, toIndex });
      console.log(`[TileBankModel] Moved tile from ${fromIndex} to ${toIndex}`);
      return true;
    }

    return false;
  }

  /**
   * Clear all tiles and start with one empty tile
   */
  clear(): void {
    // Clean up existing tiles
    for (const tile of this.tiles) {
      if (tile && typeof (tile as any).dispose === "function") {
        (tile as any).dispose();
      }
    }

    this.tiles = [];
    this.activeTileIndex = 0;
    this.addTile();

    this.emit("tileBankCleared");
    console.log("[TileBankModel] Tile bank cleared");
  }

  /**
   * Export all tiles as planar data
   * @returns Array of Uint8Array planar data (32 bytes each)
   */
  exportAllTiles(): Uint8Array[] {
    return this.tiles.map((tile) => tile.exportPlanar());
  }

  /**
   * Import tiles from planar data
   * @param tilesData - Array of Uint8Array planar data (32 bytes each)
   */
  importTiles(tilesData: Uint8Array[]): void {
    // Clean up existing tiles
    for (const tile of this.tiles) {
      if (tile && typeof (tile as any).dispose === "function") {
        (tile as any).dispose();
      }
    }

    this.tiles = [];
    this.activeTileIndex = 0;

    // Import new tiles
    for (const data of tilesData) {
      const newTile = new TileModel(new WasmTile());
      if (newTile.importPlanar(data)) {
        this.tiles.push(newTile);
      }
    }

    // Ensure at least one tile exists
    if (this.tiles.length === 0) {
      this.addTile();
    }

    this.emit("tilesImported", { count: this.tiles.length });
    console.log(`[TileBankModel] Imported ${this.tiles.length} tiles`);
  }
}
