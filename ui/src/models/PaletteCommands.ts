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
import type { PaletteModel } from "./PaletteModel.js";

/**
 * SetColorCommand - Sets a single color in the palette
 */
export class SetColorCommand implements Command {
  private oldColor: { r: number; g: number; b: number };

  constructor(
    private paletteModel: PaletteModel,
    private paletteIdx: number,
    private colorIdx: number,
    private r: number,
    private g: number,
    private b: number
  ) {
    this.oldColor = paletteModel.getColor(paletteIdx, colorIdx);
  }

  execute(): void {
    this.paletteModel.setColor(
      this.paletteIdx,
      this.colorIdx,
      this.r,
      this.g,
      this.b
    );
  }

  undo(): void {
    this.paletteModel.setColor(
      this.paletteIdx,
      this.colorIdx,
      this.oldColor.r,
      this.oldColor.g,
      this.oldColor.b
    );
  }

  getDescription(): string {
    return `Set palette ${this.paletteIdx} color ${this.colorIdx} to RGB(${this.r}, ${this.g}, ${this.b})`;
  }
}

/**
 * ImportPaletteCommand - Imports palette data
 */
export class ImportPaletteCommand implements Command {
  private oldPaletteData: Uint8Array;

  constructor(
    private paletteModel: PaletteModel,
    private newPaletteData: Uint8Array
  ) {
    // Save current palette state
    this.oldPaletteData = paletteModel.exportBinary();
  }

  execute(): void {
    this.paletteModel.importBinary(this.newPaletteData);
  }

  undo(): void {
    this.paletteModel.importBinary(this.oldPaletteData);
  }

  getDescription(): string {
    return "Import palette";
  }
}
