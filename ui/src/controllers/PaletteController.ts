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

/**
 * PaletteController - Business logic for palette color selection
 *
 * This Controller coordinates between the PaletteEditor View and the PaletteModel.
 * It handles user interactions from the View and updates the Model accordingly.
 *
 * Responsibilities:
 * - Wire up View to Model
 * - Handle color selection events from View
 * - Handle sub-palette change events from View
 * - Update PaletteModel based on user actions
 * - Provide public API for external control
 *
 * Usage:
 * ```typescript
 * const controller = new PaletteController(
 *   paletteModel,
 *   paletteEditorView
 * );
 *
 * // The controller is now active and handling all interactions
 * // You can call public methods:
 * controller.selectColor(5);
 * controller.setActiveSubPalette(3);
 * ```
 */
export class PaletteController {
  constructor(
    private paletteModel: PaletteModel,
    private view: PaletteEditor
  ) {
    this.setupView();
    this.attachViewListeners();
  }

  /**
   * Inject Model into View to wire up the MVC connection
   */
  private setupView(): void {
    this.view.setModel(this.paletteModel);
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
  }
}
