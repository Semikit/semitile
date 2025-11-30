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

import type { EditorState } from "../../models/EditorState.js";
import { Tool } from "../../models/EditorState.js";

/**
 * ToolPanel - Pure View component for editor tools and settings
 *
 * This Web Component displays drawing tools, zoom control, and grid toggle.
 * It follows the MVC pattern as a pure View - it only renders state from
 * EditorState and dispatches events for user interactions.
 *
 * Custom Events Dispatched:
 * - 'tool-selected': User selected a drawing tool
 *   - detail: { tool: Tool }
 * - 'zoom-changed': User adjusted the zoom level
 *   - detail: { zoom: number }
 * - 'grid-toggled': User toggled the grid
 *   - detail: { enabled: boolean }
 *
 * Usage:
 * ```html
 * <tool-panel></tool-panel>
 * ```
 *
 * ```typescript
 * const toolPanel = document.querySelector('tool-panel');
 * toolPanel.setModel(editorState);
 *
 * toolPanel.addEventListener('tool-selected', (e) => {
 *   console.log(`Tool selected: ${e.detail.tool}`);
 * });
 * ```
 */
export class ToolPanel extends HTMLElement {
  private editorState: EditorState | null = null;

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
   * @param editorState - The editor state model
   */
  setModel(editorState: EditorState): void {
    // Clean up old listeners if model was already set
    this.cleanupModelListeners();

    // Store model reference
    this.editorState = editorState;

    // Subscribe to model events
    this.editorState.on("toolChanged", this.handleModelChange);
    this.editorState.on("zoomChanged", this.handleModelChange);
    this.editorState.on("gridToggled", this.handleModelChange);

    // Initial render
    this.render();
  }

  /**
   * Remove all model event listeners
   */
  private cleanupModelListeners(): void {
    if (this.editorState) {
      this.editorState.off("toolChanged", this.handleModelChange);
      this.editorState.off("zoomChanged", this.handleModelChange);
      this.editorState.off("gridToggled", this.handleModelChange);
    }
  }

  /**
   * Render the component
   */
  private render(): void {
    if (!this.shadowRoot) return;

    const currentTool = this.editorState?.getTool() ?? Tool.Pencil;
    const currentZoom = this.editorState?.getZoom() ?? 16;
    const gridEnabled = this.editorState?.isGridEnabled() ?? true;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .tool-panel-container {
          background: #0a0a0f;
          border: 2px solid #0f3460;
          border-radius: 4px;
          padding: 12px;
        }

        .panel-section {
          margin-bottom: 16px;
        }

        .panel-section:last-child {
          margin-bottom: 0;
        }

        .section-header {
          color: #00d4ff;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 8px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .tool-button {
          width: 100%;
          background: #16213e;
          color: #ffffff;
          border: 2px solid #0f3460;
          padding: 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          margin: 4px 0;
          font-size: 0.9rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tool-button:hover {
          border-color: #00d4ff;
          background: #0f3460;
        }

        .tool-button.active {
          background: #00ff88;
          color: #1a1a2e;
          border-color: #00ff88;
          font-weight: 600;
        }

        .tool-icon {
          font-size: 1.2rem;
        }

        .zoom-control {
          margin-top: 8px;
        }

        .zoom-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 0.85rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .zoom-label-text {
          color: #b8b8b8;
        }

        .zoom-value {
          color: #00ff88;
          font-family: "SF Mono", "Courier New", monospace;
          font-weight: 600;
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

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #16213e;
          border: 2px solid #0f3460;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .checkbox-container:hover {
          border-color: #00d4ff;
          background: #0f3460;
        }

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .checkbox-label {
          color: #ffffff;
          font-size: 0.9rem;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .divider {
          height: 1px;
          background: #0f3460;
          margin: 12px 0;
        }
      </style>

      <div class="tool-panel-container">
        <div class="panel-section">
          <div class="section-header">Drawing Tools</div>
          ${this.renderToolButtons(currentTool)}
        </div>

        <div class="divider"></div>

        <div class="panel-section">
          <div class="section-header">View</div>
          <div class="zoom-control">
            <div class="zoom-label">
              <span class="zoom-label-text">Zoom</span>
              <span class="zoom-value">${currentZoom}×</span>
            </div>
            <input
              type="range"
              id="zoom-slider"
              min="1"
              max="32"
              value="${currentZoom}"
              step="1"
            />
          </div>
        </div>

        <div class="panel-section">
          <label class="checkbox-container">
            <input
              type="checkbox"
              id="grid-toggle"
              ${gridEnabled ? "checked" : ""}
            />
            <span class="checkbox-label">Show Grid</span>
          </label>
        </div>
      </div>
    `;

    // Attach event listeners after rendering
    this.attachEventListeners();
  }

  /**
   * Render tool buttons
   */
  private renderToolButtons(currentTool: Tool): string {
    const tools = [
      { tool: Tool.Pencil, icon: "✏️", label: "Pencil" },
      { tool: Tool.Fill, icon: "🪣", label: "Fill" },
      { tool: Tool.Line, icon: "📏", label: "Line" },
      { tool: Tool.Rectangle, icon: "⬜", label: "Rectangle" },
    ];

    return tools
      .map(
        ({ tool, icon, label }) => `
        <button
          class="tool-button ${tool === currentTool ? "active" : ""}"
          data-tool="${tool}"
        >
          <span class="tool-icon">${icon}</span>
          <span>${label}</span>
        </button>
      `
      )
      .join("");
  }

  /**
   * Attach event listeners to interactive elements
   */
  private attachEventListeners(): void {
    if (!this.shadowRoot) return;

    // Tool button clicks
    const toolButtons = this.shadowRoot.querySelectorAll(".tool-button");
    toolButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const tool = (button as HTMLElement).dataset.tool as Tool;
        this.dispatchToolSelectedEvent(tool);
      });
    });

    // Zoom slider
    const zoomSlider = this.shadowRoot.getElementById(
      "zoom-slider"
    ) as HTMLInputElement;
    if (zoomSlider) {
      zoomSlider.addEventListener("input", () => {
        const zoom = parseInt(zoomSlider.value);
        this.dispatchZoomChangedEvent(zoom);
      });
    }

    // Grid toggle
    const gridToggle = this.shadowRoot.getElementById(
      "grid-toggle"
    ) as HTMLInputElement;
    if (gridToggle) {
      gridToggle.addEventListener("change", () => {
        this.dispatchGridToggledEvent(gridToggle.checked);
      });
    }
  }

  /**
   * Dispatch tool selected event
   */
  private dispatchToolSelectedEvent(tool: Tool): void {
    this.dispatchEvent(
      new CustomEvent("tool-selected", {
        detail: { tool },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Dispatch zoom changed event
   */
  private dispatchZoomChangedEvent(zoom: number): void {
    this.dispatchEvent(
      new CustomEvent("zoom-changed", {
        detail: { zoom },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Dispatch grid toggled event
   */
  private dispatchGridToggledEvent(enabled: boolean): void {
    this.dispatchEvent(
      new CustomEvent("grid-toggled", {
        detail: { enabled },
        bubbles: true,
        composed: true,
      })
    );
  }
}

// Register the custom element
customElements.define("tool-panel", ToolPanel);
