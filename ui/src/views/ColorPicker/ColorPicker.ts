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
 * ColorPicker - Pure View component for editing individual colors
 *
 * This Web Component provides RGB555 color editing with sliders and hex input.
 * It displays the currently selected color from the PaletteModel and allows
 * editing with live preview.
 *
 * Following the MVC pattern, this is a pure View - it only renders state from
 * the PaletteModel and dispatches events for user interactions.
 *
 * Custom Events Dispatched:
 * - 'color-edit': User edited the color via sliders or hex input
 *   - detail: { paletteIdx: number, colorIdx: number, r: number, g: number, b: number }
 *
 * Usage:
 * ```html
 * <color-picker></color-picker>
 * ```
 *
 * ```typescript
 * const colorPicker = document.querySelector('color-picker');
 * colorPicker.setModel(paletteModel);
 *
 * colorPicker.addEventListener('color-edit', (e) => {
 *   console.log(`Color edited: RGB(${e.detail.r}, ${e.detail.g}, ${e.detail.b})`);
 * });
 * ```
 */
export class ColorPicker extends HTMLElement {
  private paletteModel: PaletteModel | null = null;
  private isUpdatingFromModel: boolean = false;

  // Bound event handlers
  private handleModelChange = () => this.updateFromModel();

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
    this.updateFromModel();
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
   * Render the component structure
   */
  private render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .color-picker-container {
          background: #0a0a0f;
          border: 2px solid #0f3460;
          border-radius: 4px;
          padding: 12px;
        }

        .picker-header {
          color: #00d4ff;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 12px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .color-preview {
          width: 100%;
          height: 60px;
          border: 2px solid #0f3460;
          border-radius: 4px;
          margin-bottom: 12px;
          transition: border-color 0.2s;
        }

        .color-preview:hover {
          border-color: #00d4ff;
        }

        .slider-group {
          margin: 10px 0;
        }

        .slider-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          font-size: 0.85rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .slider-label-text {
          color: #b8b8b8;
          font-weight: 600;
        }

        .slider-value {
          color: #00ff88;
          font-family: "SF Mono", "Courier New", monospace;
          font-size: 0.8rem;
          min-width: 60px;
          text-align: right;
        }

        input[type="range"] {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
        }

        input[type="range"]::-webkit-slider-track {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #16213e;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00ff88;
          cursor: pointer;
          transition: background 0.2s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          background: #00cc6a;
        }

        input[type="range"]::-moz-range-track {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #16213e;
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00ff88;
          cursor: pointer;
          border: none;
          transition: background 0.2s;
        }

        input[type="range"]::-moz-range-thumb:hover {
          background: #00cc6a;
        }

        #red-slider::-webkit-slider-thumb {
          background: #ff0088;
        }

        #red-slider::-moz-range-thumb {
          background: #ff0088;
        }

        #green-slider::-webkit-slider-thumb {
          background: #00ff88;
        }

        #green-slider::-moz-range-thumb {
          background: #00ff88;
        }

        #blue-slider::-webkit-slider-thumb {
          background: #00d4ff;
        }

        #blue-slider::-moz-range-thumb {
          background: #00d4ff;
        }

        .hex-input-group {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #0f3460;
        }

        .hex-label {
          color: #b8b8b8;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 4px;
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .hex-input {
          width: 100%;
          background: #16213e;
          color: #ffffff;
          border: 1px solid #0f3460;
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 0.9rem;
          font-family: "SF Mono", "Courier New", monospace;
          outline: none;
          transition: border-color 0.2s;
        }

        .hex-input:hover {
          border-color: #00d4ff;
        }

        .hex-input:focus {
          border-color: #00ff88;
        }

        .hex-input.invalid {
          border-color: #ff0088;
        }

        .info-text {
          color: #666;
          font-size: 0.75rem;
          margin-top: 4px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
      </style>

      <div class="color-picker-container">
        <div class="picker-header">Edit Color</div>

        <div id="color-preview" class="color-preview"></div>

        <div class="slider-group">
          <div class="slider-label">
            <span class="slider-label-text">Red (5-bit)</span>
            <span class="slider-value" id="red-value">0 (0)</span>
          </div>
          <input type="range" id="red-slider" min="0" max="31" value="0" />
        </div>

        <div class="slider-group">
          <div class="slider-label">
            <span class="slider-label-text">Green (5-bit)</span>
            <span class="slider-value" id="green-value">0 (0)</span>
          </div>
          <input type="range" id="green-slider" min="0" max="31" value="0" />
        </div>

        <div class="slider-group">
          <div class="slider-label">
            <span class="slider-label-text">Blue (5-bit)</span>
            <span class="slider-value" id="blue-value">0 (0)</span>
          </div>
          <input type="range" id="blue-slider" min="0" max="31" value="0" />
        </div>

        <div class="hex-input-group">
          <label class="hex-label">RGB555 Hex</label>
          <input
            type="text"
            id="hex-input"
            class="hex-input"
            placeholder="0x0000"
            maxlength="6"
          />
          <div class="info-text">Format: 0xRRRR (15-bit RGB555)</div>
        </div>
      </div>
    `;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Attach event listeners to interactive elements
   */
  private attachEventListeners(): void {
    if (!this.shadowRoot) return;

    const redSlider = this.shadowRoot.getElementById("red-slider") as HTMLInputElement;
    const greenSlider = this.shadowRoot.getElementById("green-slider") as HTMLInputElement;
    const blueSlider = this.shadowRoot.getElementById("blue-slider") as HTMLInputElement;
    const hexInput = this.shadowRoot.getElementById("hex-input") as HTMLInputElement;

    if (redSlider) {
      redSlider.addEventListener("input", () => this.handleSliderChange());
    }

    if (greenSlider) {
      greenSlider.addEventListener("input", () => this.handleSliderChange());
    }

    if (blueSlider) {
      blueSlider.addEventListener("input", () => this.handleSliderChange());
    }

    if (hexInput) {
      hexInput.addEventListener("input", () => this.handleHexInput());
      hexInput.addEventListener("blur", () => this.validateAndApplyHex());
    }
  }

  /**
   * Update the UI from the current Model state
   */
  private updateFromModel(): void {
    if (!this.paletteModel || !this.shadowRoot) return;

    this.isUpdatingFromModel = true;

    const paletteIdx = this.paletteModel.getActiveSubPalette();
    const colorIdx = this.paletteModel.getSelectedColorIndex();
    const color = this.paletteModel.getColor(paletteIdx, colorIdx);

    // Convert RGB888 to RGB555 (5-bit)
    const r5 = color.r >> 3;
    const g5 = color.g >> 3;
    const b5 = color.b >> 3;

    // Update sliders
    const redSlider = this.shadowRoot.getElementById("red-slider") as HTMLInputElement;
    const greenSlider = this.shadowRoot.getElementById("green-slider") as HTMLInputElement;
    const blueSlider = this.shadowRoot.getElementById("blue-slider") as HTMLInputElement;

    if (redSlider) redSlider.value = r5.toString();
    if (greenSlider) greenSlider.value = g5.toString();
    if (blueSlider) blueSlider.value = b5.toString();

    // Update displays
    this.updateDisplay(r5, g5, b5);

    this.isUpdatingFromModel = false;
  }

  /**
   * Handle slider changes
   */
  private handleSliderChange(): void {
    if (this.isUpdatingFromModel || !this.shadowRoot) return;

    const redSlider = this.shadowRoot.getElementById("red-slider") as HTMLInputElement;
    const greenSlider = this.shadowRoot.getElementById("green-slider") as HTMLInputElement;
    const blueSlider = this.shadowRoot.getElementById("blue-slider") as HTMLInputElement;

    const r5 = parseInt(redSlider.value);
    const g5 = parseInt(greenSlider.value);
    const b5 = parseInt(blueSlider.value);

    // Update display
    this.updateDisplay(r5, g5, b5);

    // Convert to RGB888 and dispatch event
    const r8 = (r5 << 3) | (r5 >> 2);
    const g8 = (g5 << 3) | (g5 >> 2);
    const b8 = (b5 << 3) | (b5 >> 2);

    this.dispatchColorEditEvent(r8, g8, b8);
  }

  /**
   * Handle hex input changes (live preview)
   */
  private handleHexInput(): void {
    if (this.isUpdatingFromModel || !this.shadowRoot) return;

    const hexInput = this.shadowRoot.getElementById("hex-input") as HTMLInputElement;
    let hexValue = hexInput.value.trim();

    // Remove 0x prefix if present
    if (hexValue.startsWith("0x") || hexValue.startsWith("0X")) {
      hexValue = hexValue.substring(2);
    }

    // Validate hex format
    if (!/^[0-9A-Fa-f]{0,4}$/.test(hexValue)) {
      hexInput.classList.add("invalid");
      return;
    }

    hexInput.classList.remove("invalid");

    // Only update if we have a complete 4-digit hex value
    if (hexValue.length === 4) {
      this.applyHexValue(hexValue);
    }
  }

  /**
   * Validate and apply hex value on blur
   */
  private validateAndApplyHex(): void {
    if (this.isUpdatingFromModel || !this.shadowRoot) return;

    const hexInput = this.shadowRoot.getElementById("hex-input") as HTMLInputElement;
    let hexValue = hexInput.value.trim();

    // Remove 0x prefix
    if (hexValue.startsWith("0x") || hexValue.startsWith("0X")) {
      hexValue = hexValue.substring(2);
    }

    // Pad with zeros if needed
    if (hexValue.length > 0 && hexValue.length < 4) {
      hexValue = hexValue.padStart(4, "0");
      hexInput.value = "0x" + hexValue;
    }

    if (hexValue.length === 4) {
      this.applyHexValue(hexValue);
    }
  }

  /**
   * Apply a hex RGB555 value
   */
  private applyHexValue(hexValue: string): void {
    if (!this.shadowRoot) return;

    const rgb555 = parseInt(hexValue, 16);

    // Extract RGB555 components
    const r5 = (rgb555 >> 10) & 0x1f;
    const g5 = (rgb555 >> 5) & 0x1f;
    const b5 = rgb555 & 0x1f;

    // Update sliders
    const redSlider = this.shadowRoot.getElementById("red-slider") as HTMLInputElement;
    const greenSlider = this.shadowRoot.getElementById("green-slider") as HTMLInputElement;
    const blueSlider = this.shadowRoot.getElementById("blue-slider") as HTMLInputElement;

    if (redSlider) redSlider.value = r5.toString();
    if (greenSlider) greenSlider.value = g5.toString();
    if (blueSlider) blueSlider.value = b5.toString();

    // Update display
    this.updateDisplay(r5, g5, b5);

    // Convert to RGB888 and dispatch event
    const r8 = (r5 << 3) | (r5 >> 2);
    const g8 = (g5 << 3) | (g5 >> 2);
    const b8 = (b5 << 3) | (b5 >> 2);

    this.dispatchColorEditEvent(r8, g8, b8);
  }

  /**
   * Update all display elements
   */
  private updateDisplay(r5: number, g5: number, b5: number): void {
    if (!this.shadowRoot) return;

    // Convert to RGB888 for display
    const r8 = (r5 << 3) | (r5 >> 2);
    const g8 = (g5 << 3) | (g5 >> 2);
    const b8 = (b5 << 3) | (b5 >> 2);

    // Update preview
    const preview = this.shadowRoot.getElementById("color-preview");
    if (preview) {
      preview.style.backgroundColor = `rgb(${r8}, ${g8}, ${b8})`;
    }

    // Update slider values
    const redValue = this.shadowRoot.getElementById("red-value");
    const greenValue = this.shadowRoot.getElementById("green-value");
    const blueValue = this.shadowRoot.getElementById("blue-value");

    if (redValue) redValue.textContent = `${r5} (${r8})`;
    if (greenValue) greenValue.textContent = `${g5} (${g8})`;
    if (blueValue) blueValue.textContent = `${b5} (${b8})`;

    // Update hex input
    const hexInput = this.shadowRoot.getElementById("hex-input") as HTMLInputElement;
    if (hexInput && !hexInput.matches(":focus")) {
      const rgb555 = (r5 << 10) | (g5 << 5) | b5;
      hexInput.value = "0x" + rgb555.toString(16).toUpperCase().padStart(4, "0");
    }
  }

  /**
   * Dispatch color edit event
   */
  private dispatchColorEditEvent(r: number, g: number, b: number): void {
    if (!this.paletteModel) return;

    const paletteIdx = this.paletteModel.getActiveSubPalette();
    const colorIdx = this.paletteModel.getSelectedColorIndex();

    this.dispatchEvent(
      new CustomEvent("color-edit", {
        detail: { paletteIdx, colorIdx, r, g, b },
        bubbles: true,
        composed: true,
      })
    );
  }
}

// Register the custom element
customElements.define("color-picker", ColorPicker);
