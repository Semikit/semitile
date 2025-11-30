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

import { PaletteModel } from "../models/PaletteModel.js";
import type { PaletteEditor } from "../views/PaletteEditor/PaletteEditor.js";
import type { ColorPicker } from "../views/ColorPicker/ColorPicker.js";

/**
 * PaletteController - Business logic for palette color selection and editing
 *
 * This Controller coordinates between the PaletteEditor, ColorPicker Views and the PaletteModel.
 * It handles user interactions from the Views and updates the Model accordingly.
 *
 * Responsibilities:
 * - Wire up Views to Model
 * - Handle color selection events from PaletteEditor
 * - Handle sub-palette change events from PaletteEditor
 * - Handle color editing events from ColorPicker
 * - Update PaletteModel based on user actions
 * - Provide public API for external control
 *
 * Usage:
 * ```typescript
 * const controller = new PaletteController(
 *   paletteModel,
 *   paletteEditorView,
 *   colorPickerView // optional
 * );
 *
 * // The controller is now active and handling all interactions
 * // You can call public methods:
 * controller.selectColor(5);
 * controller.setActiveSubPalette(3);
 * ```
 */
export class PaletteController {
  private colorPicker: ColorPicker | null = null;

  constructor(
    private paletteModel: PaletteModel,
    private view: PaletteEditor,
    colorPicker?: ColorPicker
  ) {
    if (colorPicker) {
      this.colorPicker = colorPicker;
    }

    this.setupViews();
    this.attachViewListeners();
  }

  /**
   * Inject Model into Views to wire up the MVC connection
   */
  private setupViews(): void {
    this.view.setModel(this.paletteModel);

    if (this.colorPicker) {
      this.colorPicker.setModel(this.paletteModel);
    }
  }

  /**
   * Attach listeners to View events
   */
  private attachViewListeners(): void {
    this.view.addEventListener("color-select-clicked", this.handleColorSelect);
    this.view.addEventListener(
      "subpalette-change-clicked",
      this.handleSubPaletteChange
    );

    if (this.colorPicker) {
      this.colorPicker.addEventListener("color-edit", this.handleColorEdit);
    }
  }

  /**
   * Handle color selection event from View
   */
  private handleColorSelect = (e: Event): void => {
    const customEvent = e as CustomEvent<{ colorIndex: number }>;
    const { colorIndex } = customEvent.detail;

    // Update the Model - this will trigger View re-render via events
    this.paletteModel.selectColor(colorIndex);
  };

  /**
   * Handle sub-palette change event from View
   */
  private handleSubPaletteChange = (e: Event): void => {
    const customEvent = e as CustomEvent<{ subPaletteIndex: number }>;
    const { subPaletteIndex } = customEvent.detail;

    // Update the Model - this will trigger View re-render via events
    this.paletteModel.setActiveSubPalette(subPaletteIndex);
  };

  /**
   * Handle color edit event from ColorPicker
   */
  private handleColorEdit = (e: Event): void => {
    const customEvent = e as CustomEvent<{
      paletteIdx: number;
      colorIdx: number;
      r: number;
      g: number;
      b: number;
    }>;
    const { paletteIdx, colorIdx, r, g, b } = customEvent.detail;

    // Update the Model - this will trigger View re-render via events
    this.paletteModel.setColor(paletteIdx, colorIdx, r, g, b);
  };

  /**
   * Programmatically select a color
   *
   * Public API method for external control.
   *
   * @param colorIndex - Color index to select (0-15)
   */
  public selectColor(colorIndex: number): void {
    this.paletteModel.selectColor(colorIndex);
  }

  /**
   * Programmatically change the active sub-palette
   *
   * Public API method for external control.
   *
   * @param subPaletteIndex - Sub-palette index to activate (0-15)
   */
  public setActiveSubPalette(subPaletteIndex: number): void {
    this.paletteModel.setActiveSubPalette(subPaletteIndex);
  }

  /**
   * Get the currently selected color index
   *
   * @returns Selected color index (0-15)
   */
  public getSelectedColorIndex(): number {
    return this.paletteModel.getSelectedColorIndex();
  }

  /**
   * Get the currently active sub-palette index
   *
   * @returns Active sub-palette index (0-15)
   */
  public getActiveSubPalette(): number {
    return this.paletteModel.getActiveSubPalette();
  }

  /**
   * Cleanup method - removes event listeners
   *
   * Call this when the controller is no longer needed.
   */
  public dispose(): void {
    this.view.removeEventListener("color-select-clicked", this.handleColorSelect);
    this.view.removeEventListener(
      "subpalette-change-clicked",
      this.handleSubPaletteChange
    );

    if (this.colorPicker) {
      this.colorPicker.removeEventListener("color-edit", this.handleColorEdit);
    }
  }
}
