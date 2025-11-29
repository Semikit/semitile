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
import { WasmPalette, WasmColor } from "../../../web/pkg/web.js";

/**
 * RGB color representation for display
 */
export interface RgbColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * Event data for color changes
 */
export interface ColorChangedEvent {
  paletteIdx: number;
  colorIdx: number;
  r: number;
  g: number;
  b: number;
}

/**
 * Event data for color selection
 */
export interface ColorSelectedEvent {
  colorIndex: number;
}

/**
 * Event data for sub-palette changes
 */
export interface SubPaletteChangedEvent {
  index: number;
}

/**
 * PaletteModel - Observable state container for the color palette
 *
 * Wraps the WASM Palette implementation and provides an observable interface.
 * Manages 16 sub-palettes of 16 colors each (256 colors total).
 *
 * Events emitted:
 * - 'colorChanged': When a color is modified (data: ColorChangedEvent)
 * - 'colorSelected': When the selected color index changes (data: ColorSelectedEvent)
 * - 'subPaletteChanged': When the active sub-palette changes (data: SubPaletteChangedEvent)
 * - 'paletteImported': When palette data is imported
 *
 * Usage:
 * ```typescript
 * const palette = new PaletteModel(new WasmPalette());
 *
 * palette.on('colorChanged', (data) => {
 *   console.log(`Color [${data.paletteIdx}][${data.colorIdx}] changed to RGB(${data.r}, ${data.g}, ${data.b})`);
 * });
 *
 * palette.setColor(0, 1, 255, 0, 0); // Set color to red, triggers 'colorChanged' event
 * ```
 */
export class PaletteModel extends EventEmitter {
  private palette: WasmPalette;
  private activeSubPalette: number = 0;
  private selectedColorIndex: number = 1; // 0 is transparent

  /**
   * Creates a new PaletteModel wrapping a WASM palette instance
   *
   * @param wasmPalette - The WASM palette instance to wrap
   */
  constructor(wasmPalette: WasmPalette) {
    super();
    this.palette = wasmPalette;
  }

  /**
   * Gets a color from the palette in RGB888 format for display
   *
   * @param paletteIdx - Sub-palette index (0-15)
   * @param colorIdx - Color index within sub-palette (0-15)
   * @returns RGB color with 8-bit values (0-255)
   */
  getColor(paletteIdx: number, colorIdx: number): RgbColor {
    const color = this.palette.getColor(paletteIdx, colorIdx);
    const rgb = color.toRgb888();
    return {
      r: rgb[0],
      g: rgb[1],
      b: rgb[2],
    };
  }

  /**
   * Gets the active sub-palette index
   *
   * @returns Active sub-palette index (0-15)
   */
  getActiveSubPalette(): number {
    return this.activeSubPalette;
  }

  /**
   * Gets the selected color index within the active sub-palette
   *
   * @returns Selected color index (0-15)
   */
  getSelectedColorIndex(): number {
    return this.selectedColorIndex;
  }

  /**
   * Sets a color in the palette and emits a 'colorChanged' event
   *
   * @param paletteIdx - Sub-palette index (0-15)
   * @param colorIdx - Color index within sub-palette (0-15)
   * @param r - Red component (0-255, will be converted to 5-bit)
   * @param g - Green component (0-255, will be converted to 5-bit)
   * @param b - Blue component (0-255, will be converted to 5-bit)
   */
  setColor(
    paletteIdx: number,
    colorIdx: number,
    r: number,
    g: number,
    b: number
  ): void {
    const color = WasmColor.fromRgb888(r, g, b);
    this.palette.setColor(paletteIdx, colorIdx, color);
    this.emit<ColorChangedEvent>("colorChanged", {
      paletteIdx,
      colorIdx,
      r,
      g,
      b,
    });

    // Clean up the temporary color object
    if (typeof color.free === "function") {
      color.free();
    }
  }

  /**
   * Sets the active sub-palette and emits a 'subPaletteChanged' event
   *
   * @param index - Sub-palette index (0-15)
   */
  setActiveSubPalette(index: number): void {
    // Clamp to valid range
    this.activeSubPalette = Math.max(0, Math.min(15, Math.floor(index)));
    this.emit<SubPaletteChangedEvent>("subPaletteChanged", {
      index: this.activeSubPalette,
    });
  }

  /**
   * Selects a color index and emits a 'colorSelected' event
   *
   * This is used to track which color the user is currently painting with.
   *
   * @param colorIndex - Color index (0-15)
   */
  selectColor(colorIndex: number): void {
    // Clamp to valid range
    this.selectedColorIndex = Math.max(0, Math.min(15, Math.floor(colorIndex)));
    this.emit<ColorSelectedEvent>("colorSelected", {
      colorIndex: this.selectedColorIndex,
    });
  }

  /**
   * Imports palette data from binary format (512 bytes)
   *
   * This replaces the internal palette with a new palette created from the binary data.
   * Emits a 'paletteImported' event on success.
   *
   * @param data - Binary palette data (must be exactly 512 bytes, RGB555 format)
   * @returns true if import succeeded, false if data is invalid
   */
  importBinary(data: Uint8Array): boolean {
    const newPalette = WasmPalette.importBinary(data);

    if (newPalette) {
      // Free the old palette if needed
      if (this.palette && typeof this.palette.free === "function") {
        this.palette.free();
      }

      this.palette = newPalette;
      this.emit("paletteImported");
      return true;
    }

    return false;
  }

  /**
   * Exports the palette to binary format (512 bytes)
   *
   * The returned data can be directly loaded into Cicada-16 CRAM (F200-F3FF) via DMA.
   *
   * @returns 512-byte array (256 colors × 2 bytes RGB555, little-endian)
   */
  exportBinary(): Uint8Array {
    return this.palette.exportBinary();
  }

  /**
   * Gets the raw WASM palette instance
   *
   * This should only be used for low-level operations. Prefer using the
   * PaletteModel methods to ensure events are emitted correctly.
   *
   * @returns The underlying WASM palette
   */
  getWasmPalette(): WasmPalette {
    return this.palette;
  }

  /**
   * Cleanup method - frees the WASM palette instance
   *
   * Call this when the PaletteModel is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    if (this.palette && typeof this.palette.free === "function") {
      this.palette.free();
    }
    this.removeAllListeners();
  }
}
