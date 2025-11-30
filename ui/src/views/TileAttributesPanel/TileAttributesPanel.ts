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

import styles from "./TileAttributesPanel.css?inline";

/**
 * TileAttributesPanel - Pure view component for tile attribute controls
 *
 * This View displays controls for setting tile attributes:
 * - Palette index (0-15)
 * - Horizontal flip
 * - Vertical flip
 *
 * It is a pure presentation component:
 * - Dispatches events for attribute changes
 * - Does NOT maintain state (stateless)
 *
 * Events dispatched:
 * - palette-changed: { paletteIdx: number }
 * - h-flip-changed: { hFlip: boolean }
 * - v-flip-changed: { vFlip: boolean }
 *
 * Usage:
 * ```typescript
 * const panel = document.getElementById('tile-attributes');
 *
 * panel.addEventListener('palette-changed', (e) => {
 *   console.log('Palette:', e.detail.paletteIdx);
 * });
 * ```
 */
export class TileAttributesPanel extends HTMLElement {
  private paletteSelect: HTMLSelectElement | null = null;
  private hFlipCheckbox: HTMLInputElement | null = null;
  private vFlipCheckbox: HTMLInputElement | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.render();
    this.attachEventListeners();
  }

  /**
   * Render Shadow DOM structure
   */
  private render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="tile-attributes-panel">
        <h3 class="panel-title">Tile Attributes</h3>

        <div class="attribute-group">
          <label for="palette-select" class="attribute-label">Palette:</label>
          <select id="palette-select" class="palette-select">
            ${Array.from({ length: 16 }, (_, i) =>
              `<option value="${i}">Palette ${i}</option>`
            ).join('')}
          </select>
        </div>

        <div class="attribute-group">
          <label class="checkbox-label">
            <input type="checkbox" id="h-flip" class="flip-checkbox" />
            <span>Horizontal Flip</span>
          </label>
        </div>

        <div class="attribute-group">
          <label class="checkbox-label">
            <input type="checkbox" id="v-flip" class="flip-checkbox" />
            <span>Vertical Flip</span>
          </label>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    this.paletteSelect = this.shadowRoot?.getElementById("palette-select") as HTMLSelectElement;
    this.hFlipCheckbox = this.shadowRoot?.getElementById("h-flip") as HTMLInputElement;
    this.vFlipCheckbox = this.shadowRoot?.getElementById("v-flip") as HTMLInputElement;

    if (this.paletteSelect) {
      this.paletteSelect.addEventListener("change", this.handlePaletteChange);
    }

    if (this.hFlipCheckbox) {
      this.hFlipCheckbox.addEventListener("change", this.handleHFlipChange);
    }

    if (this.vFlipCheckbox) {
      this.vFlipCheckbox.addEventListener("change", this.handleVFlipChange);
    }
  }

  /**
   * Handle palette selection change
   */
  private handlePaletteChange = (): void => {
    if (!this.paletteSelect) return;

    const paletteIdx = parseInt(this.paletteSelect.value, 10);
    this.dispatchEvent(
      new CustomEvent("palette-changed", {
        detail: { paletteIdx },
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Handle horizontal flip change
   */
  private handleHFlipChange = (): void => {
    if (!this.hFlipCheckbox) return;

    this.dispatchEvent(
      new CustomEvent("h-flip-changed", {
        detail: { hFlip: this.hFlipCheckbox.checked },
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Handle vertical flip change
   */
  private handleVFlipChange = (): void => {
    if (!this.vFlipCheckbox) return;

    this.dispatchEvent(
      new CustomEvent("v-flip-changed", {
        detail: { vFlip: this.vFlipCheckbox.checked },
        bubbles: true,
        composed: true,
      })
    );
  };

  /**
   * Set palette index (update UI)
   */
  setPaletteIdx(paletteIdx: number): void {
    if (this.paletteSelect) {
      this.paletteSelect.value = paletteIdx.toString();
    }
  }

  /**
   * Set horizontal flip (update UI)
   */
  setHFlip(hFlip: boolean): void {
    if (this.hFlipCheckbox) {
      this.hFlipCheckbox.checked = hFlip;
    }
  }

  /**
   * Set vertical flip (update UI)
   */
  setVFlip(vFlip: boolean): void {
    if (this.vFlipCheckbox) {
      this.vFlipCheckbox.checked = vFlip;
    }
  }
}

customElements.define("tile-attributes-panel", TileAttributesPanel);
