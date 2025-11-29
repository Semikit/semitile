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
import { WasmTile } from "../../../web/pkg/web.js";

/**
 * Event data for pixel changes
 */
export interface PixelChangedEvent {
  x: number;
  y: number;
  colorIndex: number;
}

/**
 * TileModel - Observable state container for a single tile
 *
 * Wraps the WASM Tile implementation and provides an observable interface
 * for Views to listen to state changes.
 *
 * Events emitted:
 * - 'pixelChanged': When a pixel is modified (data: PixelChangedEvent)
 * - 'tileImported': When tile data is imported from planar format
 * - 'tileCleared': When the tile is cleared to all zeros
 *
 * Usage:
 * ```typescript
 * const tile = new TileModel(new WasmTile());
 *
 * tile.on('pixelChanged', (data) => {
 *   console.log(`Pixel at (${data.x}, ${data.y}) changed to color ${data.colorIndex}`);
 * });
 *
 * tile.setPixel(0, 0, 5); // Triggers 'pixelChanged' event
 * ```
 */
export class TileModel extends EventEmitter {
  private tile: WasmTile;

  /**
   * Creates a new TileModel wrapping a WASM tile instance
   *
   * @param wasmTile - The WASM tile instance to wrap
   */
  constructor(wasmTile: WasmTile) {
    super();
    this.tile = wasmTile;
  }

  /**
   * Gets the color index of a pixel at the given coordinates
   *
   * @param x - X coordinate (0-7)
   * @param y - Y coordinate (0-7)
   * @returns Color index (0-15), or 0 if coordinates are out of bounds
   */
  getPixel(x: number, y: number): number {
    return this.tile.getPixel(x, y);
  }

  /**
   * Sets a pixel to the specified color index and emits a 'pixelChanged' event
   *
   * @param x - X coordinate (0-7)
   * @param y - Y coordinate (0-7)
   * @param colorIndex - Color index (0-15)
   */
  setPixel(x: number, y: number, colorIndex: number): void {
    this.tile.setPixel(x, y, colorIndex);
    this.emit<PixelChangedEvent>("pixelChanged", { x, y, colorIndex });
  }

  /**
   * Imports tile data from 4bpp planar format (32 bytes)
   *
   * This replaces the internal tile with a new tile created from the planar data.
   * Emits a 'tileImported' event on success.
   *
   * @param data - Planar format data (must be exactly 32 bytes)
   * @returns true if import succeeded, false if data is invalid
   */
  importPlanar(data: Uint8Array): boolean {
    const newTile = WasmTile.fromPlanar(data);

    if (newTile) {
      // Free the old tile if needed
      if (this.tile && typeof this.tile.free === "function") {
        this.tile.free();
      }

      this.tile = newTile;
      this.emit("tileImported");
      return true;
    }

    return false;
  }

  /**
   * Exports the tile to 4bpp planar format (32 bytes)
   *
   * The returned data can be directly loaded into Cicada-16 VRAM via DMA.
   *
   * @returns 32-byte array in planar format
   */
  exportPlanar(): Uint8Array {
    return this.tile.toPlanar();
  }

  /**
   * Clears the entire tile (sets all pixels to color index 0)
   *
   * Emits a 'tileCleared' event.
   */
  clear(): void {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        this.tile.setPixel(x, y, 0);
      }
    }
    this.emit("tileCleared");
  }

  /**
   * Gets the raw WASM tile instance
   *
   * This should only be used for low-level operations. Prefer using the
   * TileModel methods to ensure events are emitted correctly.
   *
   * @returns The underlying WASM tile
   */
  getWasmTile(): WasmTile {
    return this.tile;
  }

  /**
   * Cleanup method - frees the WASM tile instance
   *
   * Call this when the TileModel is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    if (this.tile && typeof this.tile.free === "function") {
      this.tile.free();
    }
    this.removeAllListeners();
  }
}
