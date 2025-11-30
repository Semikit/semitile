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
import { WasmTilemap, WasmTilemapEntry } from "../lib/wasm-loader.js";

/**
 * TilemapModel - Observable state container for tilemap data
 *
 * This Model wraps a WASM Tilemap instance and provides an observable API.
 * It emits events when tilemap entries are modified, allowing Views to
 * automatically update when the state changes.
 *
 * Events emitted:
 * - entryChanged: { x, y, tileIndex, paletteIdx, hFlip, vFlip }
 * - tilemapResized: { width, height }
 * - tilemapCleared: {}
 * - tilemapFilled: { tileIndex, paletteIdx, hFlip, vFlip }
 * - tilemapImported: {}
 *
 * Usage:
 * ```typescript
 * const tilemapModel = new TilemapModel(new WasmTilemap(32, 32));
 *
 * tilemapModel.on('entryChanged', ({ x, y }) => {
 *   console.log(`Entry changed at ${x}, ${y}`);
 * });
 *
 * tilemapModel.setEntry(5, 10, 42, 0, false, false);
 * ```
 */
export class TilemapModel extends EventEmitter {
  private tilemap: WasmTilemap;

  constructor(wasmTilemap: WasmTilemap) {
    super();
    this.tilemap = wasmTilemap;
  }

  /**
   * Get tilemap width in tiles
   */
  getWidth(): number {
    return this.tilemap.width();
  }

  /**
   * Get tilemap height in tiles
   */
  getHeight(): number {
    return this.tilemap.height();
  }

  /**
   * Get tilemap entry at coordinates
   *
   * @returns Entry data or null if out of bounds
   */
  getEntry(x: number, y: number): {
    tileIndex: number;
    paletteIdx: number;
    hFlip: boolean;
    vFlip: boolean;
  } | null {
    const entry = this.tilemap.getEntry(x, y);
    if (!entry) return null;

    return {
      tileIndex: entry.tileIndex(),
      paletteIdx: entry.paletteIdx(),
      hFlip: entry.hFlip(),
      vFlip: entry.vFlip(),
    };
  }

  /**
   * Set tilemap entry at coordinates
   *
   * Emits 'entryChanged' event
   */
  setEntry(
    x: number,
    y: number,
    tileIndex: number,
    paletteIdx: number,
    hFlip: boolean,
    vFlip: boolean
  ): void {
    const entry = new WasmTilemapEntry(tileIndex, paletteIdx, hFlip, vFlip);
    this.tilemap.setEntry(x, y, entry);
    this.emit("entryChanged", { x, y, tileIndex, paletteIdx, hFlip, vFlip });
  }

  /**
   * Set tilemap entry using a WasmTilemapEntry instance
   *
   * Emits 'entryChanged' event
   */
  setEntryDirect(x: number, y: number, entry: WasmTilemapEntry): void {
    this.tilemap.setEntry(x, y, entry);
    this.emit("entryChanged", {
      x,
      y,
      tileIndex: entry.tileIndex(),
      paletteIdx: entry.paletteIdx(),
      hFlip: entry.hFlip(),
      vFlip: entry.vFlip(),
    });
  }

  /**
   * Resize the tilemap
   *
   * Emits 'tilemapResized' event
   */
  resize(newWidth: number, newHeight: number): void {
    this.tilemap.resize(newWidth, newHeight);
    this.emit("tilemapResized", { width: newWidth, height: newHeight });
  }

  /**
   * Clear the tilemap (set all entries to default)
   *
   * Emits 'tilemapCleared' event
   */
  clear(): void {
    this.tilemap.clear();
    this.emit("tilemapCleared", {});
  }

  /**
   * Fill the tilemap with a specific entry
   *
   * Emits 'tilemapFilled' event
   */
  fill(tileIndex: number, paletteIdx: number, hFlip: boolean, vFlip: boolean): void {
    const entry = new WasmTilemapEntry(tileIndex, paletteIdx, hFlip, vFlip);
    this.tilemap.fill(entry);
    this.emit("tilemapFilled", { tileIndex, paletteIdx, hFlip, vFlip });
  }

  /**
   * Export tilemap as binary data (2 bytes per entry, little-endian)
   */
  exportBinary(): Uint8Array {
    return this.tilemap.exportBinary();
  }

  /**
   * Import tilemap from binary data
   *
   * Emits 'tilemapImported' event
   *
   * @returns true if import succeeded, false otherwise
   */
  importBinary(data: Uint8Array, width: number, height: number): boolean {
    const imported = WasmTilemap.importBinary(data, width, height);
    if (imported) {
      this.tilemap = imported;
      this.emit("tilemapImported", {});
      return true;
    }
    return false;
  }

  /**
   * Get the underlying WASM tilemap instance
   *
   * Use with caution - prefer using the Model API for automatic event emission
   */
  getWasmTilemap(): WasmTilemap {
    return this.tilemap;
  }
}
