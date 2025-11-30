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

import type { TilemapBankModel } from "../../models/TilemapBankModel.js";
import styles from "./TilemapBank.css?inline";

/**
 * TilemapBank - Pure view component for tilemap list
 *
 * This View displays a list of tilemaps in the tilemap bank with
 * buttons to add, delete, and duplicate tilemaps.
 *
 * It is a pure presentation component:
 * - Reads data from TilemapBankModel only
 * - Dispatches events for user interactions
 * - Does NOT modify Models directly
 *
 * Events dispatched:
 * - tilemap-select-clicked: { index: number }
 * - tilemap-add-clicked: {}
 * - tilemap-delete-clicked: { index: number }
 * - tilemap-duplicate-clicked: { index: number }
 *
 * Usage:
 * ```typescript
 * const tilemapBank = document.getElementById('tilemap-bank');
 * tilemapBank.setModel(tilemapBankModel);
 * ```
 */
export class TilemapBank extends HTMLElement {
  private tilemapBankModel: TilemapBankModel | null = null;
  private rafPending: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    this.cleanup();
  }

  /**
   * Inject Model into View
   */
  setModel(tilemapBankModel: TilemapBankModel): void {
    this.cleanup();

    this.tilemapBankModel = tilemapBankModel;

    // Subscribe to model events
    this.tilemapBankModel.on("tilemapAdded", this.handleModelChange);
    this.tilemapBankModel.on("tilemapDeleted", this.handleModelChange);
    this.tilemapBankModel.on("activeTilemapChanged", this.handleModelChange);
    this.tilemapBankModel.on("tilemapDuplicated", this.handleModelChange);

    this.scheduleRender();
  }

  /**
   * Handle model change - trigger re-render
   * Uses requestAnimationFrame to batch multiple rapid changes
   */
  private handleModelChange = (): void => {
    this.scheduleRender();
  };

  /**
   * Schedule a render using requestAnimationFrame
   * Multiple calls within the same frame will only trigger one render
   */
  private scheduleRender(): void {
    if (this.rafPending) {
      return;
    }

    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      this.render();
    });
  }

  /**
   * Cleanup model listeners
   */
  private cleanup(): void {
    if (this.tilemapBankModel) {
      this.tilemapBankModel.off("tilemapAdded", this.handleModelChange);
      this.tilemapBankModel.off("tilemapDeleted", this.handleModelChange);
      this.tilemapBankModel.off("activeTilemapChanged", this.handleModelChange);
      this.tilemapBankModel.off("tilemapDuplicated", this.handleModelChange);
    }
  }

  /**
   * Render Shadow DOM
   */
  private render(): void {
    if (!this.shadowRoot) return;

    const tilemaps = this.tilemapBankModel?.getAllTilemaps() || [];
    const activeIndex = this.tilemapBankModel?.getActiveTilemapIndex() ?? 0;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="tilemap-bank-container">
        <div class="bank-header">
          <h3 class="bank-title">Tilemaps</h3>
          <button class="add-button" id="add-tilemap" title="Add new tilemap (32×32)">
            ➕ Add
          </button>
        </div>

        <div class="tilemap-list">
          ${tilemaps
            .map(
              (tilemap, index) => `
            <div class="tilemap-item ${index === activeIndex ? "active" : ""}" data-index="${index}">
              <div class="tilemap-info">
                <span class="tilemap-label">Tilemap ${index}</span>
                <span class="tilemap-size">${tilemap.getWidth()}×${tilemap.getHeight()}</span>
              </div>
              <div class="tilemap-actions">
                <button class="action-button duplicate" data-index="${index}" title="Duplicate tilemap">
                  📋
                </button>
                <button class="action-button delete" data-index="${index}" title="Delete tilemap" ${tilemaps.length <= 1 ? "disabled" : ""}>
                  🗑️
                </button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Attach event listeners to buttons
   */
  private attachEventListeners(): void {
    if (!this.shadowRoot) return;

    // Add button
    const addButton = this.shadowRoot.getElementById("add-tilemap");
    if (addButton) {
      addButton.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("tilemap-add-clicked", {
            bubbles: true,
            composed: true,
          })
        );
      });
    }

    // Tilemap item clicks (for selection)
    const tilemapItems = this.shadowRoot.querySelectorAll(".tilemap-item");
    tilemapItems.forEach((item) => {
      const itemElement = item as HTMLElement;
      const index = parseInt(itemElement.dataset.index || "0", 10);

      itemElement.addEventListener("click", (e) => {
        // Don't trigger selection if clicking action buttons
        const target = e.target as HTMLElement;
        if (target.closest(".action-button")) {
          return;
        }

        this.dispatchEvent(
          new CustomEvent("tilemap-select-clicked", {
            detail: { index },
            bubbles: true,
            composed: true,
          })
        );
      });
    });

    // Duplicate buttons
    const duplicateButtons = this.shadowRoot.querySelectorAll(".duplicate");
    duplicateButtons.forEach((button) => {
      const btnElement = button as HTMLElement;
      const index = parseInt(btnElement.dataset.index || "0", 10);

      btnElement.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("tilemap-duplicate-clicked", {
            detail: { index },
            bubbles: true,
            composed: true,
          })
        );
      });
    });

    // Delete buttons
    const deleteButtons = this.shadowRoot.querySelectorAll(".delete");
    deleteButtons.forEach((button) => {
      const btnElement = button as HTMLElement;
      const index = parseInt(btnElement.dataset.index || "0", 10);

      btnElement.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("tilemap-delete-clicked", {
            detail: { index },
            bubbles: true,
            composed: true,
          })
        );
      });
    });
  }
}

customElements.define("tilemap-bank", TilemapBank);
