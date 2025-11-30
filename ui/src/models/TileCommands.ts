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

import type { Command } from "./CommandHistory.js";
import type { TileModel } from "./TileModel.js";

/**
 * SetPixelCommand - Sets a single pixel in the tile
 */
export class SetPixelCommand implements Command {
  private oldColor: number;

  constructor(
    private tileModel: TileModel,
    private x: number,
    private y: number,
    private newColor: number
  ) {
    this.oldColor = tileModel.getPixel(x, y);
  }

  execute(): void {
    this.tileModel.setPixel(this.x, this.y, this.newColor);
  }

  undo(): void {
    this.tileModel.setPixel(this.x, this.y, this.oldColor);
  }

  getDescription(): string {
    return `Set pixel (${this.x}, ${this.y}) to color ${this.newColor}`;
  }
}

/**
 * FillCommand - Flood fills an area with a color
 */
export class FillCommand implements Command {
  private changedPixels: Array<{ x: number; y: number; oldColor: number }> = [];

  constructor(
    private tileModel: TileModel,
    private startX: number,
    private startY: number,
    private newColor: number
  ) {
    // Store the state before fill for undo
    this.captureChangedPixels();
  }

  private captureChangedPixels(): void {
    const targetColor = this.tileModel.getPixel(this.startX, this.startY);
    if (targetColor === this.newColor) {
      return; // No change needed
    }

    const visited = new Set<string>();
    const stack: Array<{ x: number; y: number }> = [
      { x: this.startX, y: this.startY },
    ];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (x < 0 || x >= 8 || y < 0 || y >= 8) continue;

      const currentColor = this.tileModel.getPixel(x, y);
      if (currentColor !== targetColor) continue;

      visited.add(key);
      this.changedPixels.push({ x, y, oldColor: currentColor });

      // Add neighbors
      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }
  }

  execute(): void {
    for (const pixel of this.changedPixels) {
      this.tileModel.setPixel(pixel.x, pixel.y, this.newColor);
    }
  }

  undo(): void {
    for (const pixel of this.changedPixels) {
      this.tileModel.setPixel(pixel.x, pixel.y, pixel.oldColor);
    }
  }

  getDescription(): string {
    return `Fill from (${this.startX}, ${this.startY}) with color ${this.newColor} (${this.changedPixels.length} pixels)`;
  }
}

/**
 * LineCommand - Draws a line between two points
 */
export class LineCommand implements Command {
  private changedPixels: Array<{ x: number; y: number; oldColor: number }> = [];

  constructor(
    private tileModel: TileModel,
    private startX: number,
    private startY: number,
    private endX: number,
    private endY: number,
    private color: number
  ) {
    this.captureChangedPixels();
  }

  private captureChangedPixels(): void {
    // Bresenham's line algorithm
    const dx = Math.abs(this.endX - this.startX);
    const dy = Math.abs(this.endY - this.startY);
    const sx = this.startX < this.endX ? 1 : -1;
    const sy = this.startY < this.endY ? 1 : -1;
    let err = dx - dy;

    let x = this.startX;
    let y = this.startY;

    while (true) {
      if (x >= 0 && x < 8 && y >= 0 && y < 8) {
        this.changedPixels.push({
          x,
          y,
          oldColor: this.tileModel.getPixel(x, y),
        });
      }

      if (x === this.endX && y === this.endY) break;

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

  execute(): void {
    for (const pixel of this.changedPixels) {
      this.tileModel.setPixel(pixel.x, pixel.y, this.color);
    }
  }

  undo(): void {
    for (const pixel of this.changedPixels) {
      this.tileModel.setPixel(pixel.x, pixel.y, pixel.oldColor);
    }
  }

  getDescription(): string {
    return `Draw line from (${this.startX}, ${this.startY}) to (${this.endX}, ${this.endY})`;
  }
}

/**
 * RectangleCommand - Draws a filled rectangle
 */
export class RectangleCommand implements Command {
  private changedPixels: Array<{ x: number; y: number; oldColor: number }> = [];

  constructor(
    private tileModel: TileModel,
    private startX: number,
    private startY: number,
    private endX: number,
    private endY: number,
    private color: number
  ) {
    this.captureChangedPixels();
  }

  private captureChangedPixels(): void {
    const x1 = Math.min(this.startX, this.endX);
    const x2 = Math.max(this.startX, this.endX);
    const y1 = Math.min(this.startY, this.endY);
    const y2 = Math.max(this.startY, this.endY);

    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (x >= 0 && x < 8 && y >= 0 && y < 8) {
          this.changedPixels.push({
            x,
            y,
            oldColor: this.tileModel.getPixel(x, y),
          });
        }
      }
    }
  }

  execute(): void {
    for (const pixel of this.changedPixels) {
      this.tileModel.setPixel(pixel.x, pixel.y, this.color);
    }
  }

  undo(): void {
    for (const pixel of this.changedPixels) {
      this.tileModel.setPixel(pixel.x, pixel.y, pixel.oldColor);
    }
  }

  getDescription(): string {
    return `Draw rectangle from (${this.startX}, ${this.startY}) to (${this.endX}, ${this.endY})`;
  }
}

/**
 * ClearTileCommand - Clears the entire tile
 */
export class ClearTileCommand implements Command {
  private oldTileData: Uint8Array;

  constructor(private tileModel: TileModel) {
    // Save the current tile state
    this.oldTileData = tileModel.exportPlanar();
  }

  execute(): void {
    this.tileModel.clear();
  }

  undo(): void {
    this.tileModel.importPlanar(this.oldTileData);
  }

  getDescription(): string {
    return "Clear tile";
  }
}
