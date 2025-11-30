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

import type { PaletteModel } from "../../models/PaletteModel.js";

/**
 * PaletteEditor - Pure View component for displaying and selecting colors
 *
 * This Web Component displays a grid of color swatches from the active sub-palette
 * and allows users to select colors and switch between sub-palettes.
 *
 * Following the MVC pattern, this is a pure View - it only renders state from
 * the PaletteModel and dispatches events for user interactions.
 *
 * Custom Events Dispatched:
 * - 'color-select-clicked': User clicked on a color swatch
 *   - detail: { colorIndex: number }
 * - 'subpalette-change-clicked': User changed the active sub-palette
 *   - detail: { subPaletteIndex: number }
 *
 * Usage:
 * ```html
 * <palette-editor></palette-editor>
 * ```
 *
 * ```typescript
 * const paletteEditor = document.querySelector('palette-editor');
 * paletteEditor.setModel(paletteModel);
 *
 * paletteEditor.addEventListener('color-select-clicked', (e) => {
 *   console.log(`Color ${e.detail.colorIndex} selected`);
 * });
 * ```
 */
export class PaletteEditor extends HTMLElement {
  private paletteModel: PaletteModel | null = null;

  // Bound event handlers
  private handleModelChange = () => this.render();

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  /**
   * Called when the element is added to the DOM
   */
  connectedCallback(): void {
    this.render();
  }

  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback(): void {
    this.cleanupModelListeners();
  }

  /**
   * Inject model dependency and subscribe to events
   *
   * @param paletteModel - The palette data model
   */
  setModel(paletteModel: PaletteModel): void {
    // Clean up old listeners if model was already set
    this.cleanupModelListeners();

    // Store model reference
    this.paletteModel = paletteModel;

    // Subscribe to model events
    this.paletteModel.on("colorChanged", this.handleModelChange);
    this.paletteModel.on("colorSelected", this.handleModelChange);
    this.paletteModel.on("subPaletteChanged", this.handleModelChange);
    this.paletteModel.on("paletteImported", this.handleModelChange);

    // Initial render
    this.render();
  }

  /**
   * Remove all model event listeners
   */
  private cleanupModelListeners(): void {
    if (this.paletteModel) {
      this.paletteModel.off("colorChanged", this.handleModelChange);
      this.paletteModel.off("colorSelected", this.handleModelChange);
      this.paletteModel.off("subPaletteChanged", this.handleModelChange);
      this.paletteModel.off("paletteImported", this.handleModelChange);
    }
  }

  /**
   * Render the component
   */
  private render(): void {
    if (!this.shadowRoot) return;

    const activeSubPalette = this.paletteModel?.getActiveSubPalette() ?? 0;
    const selectedColorIndex = this.paletteModel?.getSelectedColorIndex() ?? 0;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .palette-container {
          background: #0a0a0f;
          border: 2px solid #0f3460;
          border-radius: 4px;
          padding: 12px;
        }

        .palette-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .palette-label {
          color: #00d4ff;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .subpalette-selector {
          background: #16213e;
          color: #ffffff;
          border: 1px solid #0f3460;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }

        .subpalette-selector:hover {
          border-color: #00d4ff;
        }

        .subpalette-selector:focus {
          border-color: #00ff88;
        }

        .palette-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 6px;
        }

        .color-swatch {
          aspect-ratio: 1;
          border: 2px solid #0f3460;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .color-swatch:hover {
          border-color: #00d4ff;
          transform: scale(1.1);
          z-index: 10;
        }

        .color-swatch.selected {
          border-color: #00ff88;
          border-width: 3px;
          box-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
        }

        .color-swatch.transparent {
          background-image:
            linear-gradient(45deg, #333 25%, transparent 25%),
            linear-gradient(-45deg, #333 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #333 75%),
            linear-gradient(-45deg, transparent 75%, #333 75%);
          background-size: 8px 8px;
          background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
        }

        .color-index {
          position: absolute;
          bottom: 2px;
          right: 2px;
          font-size: 9px;
          font-weight: 600;
          background: rgba(0, 0, 0, 0.75);
          color: #ffffff;
          padding: 1px 3px;
          border-radius: 2px;
          font-family: "SF Mono", "Courier New", monospace;
          pointer-events: none;
        }

        .palette-info {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #0f3460;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          color: #b8b8b8;
          font-size: 0.8rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .info-value {
          color: #00ff88;
          font-weight: 600;
          font-size: 0.85rem;
          font-family: "SF Mono", "Courier New", monospace;
        }
      </style>

      <div class="palette-container">
        <div class="palette-header">
          <span class="palette-label">Color Palette</span>
          <select class="subpalette-selector" id="subpalette-selector">
            ${this.renderSubPaletteOptions(activeSubPalette)}
          </select>
        </div>

        <div class="palette-grid">
          ${this.renderColorSwatches(activeSubPalette, selectedColorIndex)}
        </div>

        <div class="palette-info">
          <span class="info-label">Selected Color:</span>
          <span class="info-value">#${selectedColorIndex}</span>
        </div>
      </div>
    `;

    // Attach event listeners after rendering
    this.attachEventListeners();
  }

  /**
   * Render sub-palette selector options
   */
  private renderSubPaletteOptions(activeSubPalette: number): string {
    let html = "";
    for (let i = 0; i < 16; i++) {
      const selected = i === activeSubPalette ? "selected" : "";
      html += `<option value="${i}" ${selected}>Sub-Palette ${i}</option>`;
    }
    return html;
  }

  /**
   * Render color swatches grid
   */
  private renderColorSwatches(
    activeSubPalette: number,
    selectedColorIndex: number
  ): string {
    if (!this.paletteModel) {
      // Return empty swatches if no model
      return Array(16)
        .fill(0)
        .map((_, i) => this.renderEmptySwatch(i))
        .join("");
    }

    let html = "";
    for (let i = 0; i < 16; i++) {
      const color = this.paletteModel.getColor(activeSubPalette, i);
      const isSelected = i === selectedColorIndex;
      const isTransparent = i === 0;

      html += `
        <div
          class="color-swatch ${isSelected ? "selected" : ""} ${
        isTransparent ? "transparent" : ""
      }"
          style="background-color: rgb(${color.r}, ${color.g}, ${color.b})"
          data-color-index="${i}"
          title="Color ${i}: RGB(${color.r}, ${color.g}, ${color.b})"
        >
          <span class="color-index">${i}</span>
        </div>
      `;
    }
    return html;
  }

  /**
   * Render an empty swatch (when no model is set)
   */
  private renderEmptySwatch(index: number): string {
    return `
      <div
        class="color-swatch"
        style="background-color: #000"
        data-color-index="${index}"
      >
        <span class="color-index">${index}</span>
      </div>
    `;
  }

  /**
   * Attach event listeners to interactive elements
   */
  private attachEventListeners(): void {
    if (!this.shadowRoot) return;

    // Color swatch clicks
    const swatches = this.shadowRoot.querySelectorAll(".color-swatch");
    swatches.forEach((swatch) => {
      swatch.addEventListener("click", (e) => {
        const colorIndex = parseInt(
          (e.currentTarget as HTMLElement).dataset.colorIndex || "0"
        );
        this.dispatchColorSelectEvent(colorIndex);
      });
    });

    // Sub-palette selector change
    const selector = this.shadowRoot.getElementById("subpalette-selector");
    if (selector) {
      selector.addEventListener("change", (e) => {
        const subPaletteIndex = parseInt((e.target as HTMLSelectElement).value);
        this.dispatchSubPaletteChangeEvent(subPaletteIndex);
      });
    }
  }

  /**
   * Dispatch color selection event
   */
  private dispatchColorSelectEvent(colorIndex: number): void {
    this.dispatchEvent(
      new CustomEvent("color-select-clicked", {
        detail: { colorIndex },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Dispatch sub-palette change event
   */
  private dispatchSubPaletteChangeEvent(subPaletteIndex: number): void {
    this.dispatchEvent(
      new CustomEvent("subpalette-change-clicked", {
        detail: { subPaletteIndex },
        bubbles: true,
        composed: true,
      })
    );
  }
}

// Register the custom element
customElements.define("palette-editor", PaletteEditor);
