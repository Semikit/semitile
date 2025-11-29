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

/**
 * Available drawing tools
 */
export enum Tool {
  Pencil = "pencil",
  Fill = "fill",
  Line = "line",
  Rectangle = "rectangle",
}

/**
 * Event data for tool changes
 */
export interface ToolChangedEvent {
  tool: Tool;
}

/**
 * Event data for zoom changes
 */
export interface ZoomChangedEvent {
  zoom: number;
}

/**
 * Event data for grid toggle
 */
export interface GridToggledEvent {
  enabled: boolean;
}

/**
 * EditorState - Observable state container for editor settings
 *
 * Manages global editor state like the current drawing tool, zoom level,
 * and grid visibility.
 *
 * Events emitted:
 * - 'toolChanged': When the active tool changes (data: ToolChangedEvent)
 * - 'zoomChanged': When the zoom level changes (data: ZoomChangedEvent)
 * - 'gridToggled': When grid visibility is toggled (data: GridToggledEvent)
 *
 * Usage:
 * ```typescript
 * const editorState = new EditorState();
 *
 * editorState.on('toolChanged', (data) => {
 *   console.log(`Tool changed to: ${data.tool}`);
 * });
 *
 * editorState.setTool(Tool.Fill); // Triggers 'toolChanged' event
 * ```
 */
export class EditorState extends EventEmitter {
  private currentTool: Tool = Tool.Pencil;
  private zoom: number = 16;
  private gridEnabled: boolean = true;

  /**
   * Sets the current drawing tool and emits a 'toolChanged' event
   *
   * @param tool - The tool to activate
   */
  setTool(tool: Tool): void {
    this.currentTool = tool;
    this.emit<ToolChangedEvent>("toolChanged", { tool });
  }

  /**
   * Gets the current drawing tool
   *
   * @returns The active tool
   */
  getTool(): Tool {
    return this.currentTool;
  }

  /**
   * Sets the zoom level and emits a 'zoomChanged' event
   *
   * Zoom is clamped to the range 1-32.
   *
   * @param zoom - Zoom level (pixels per tile pixel)
   */
  setZoom(zoom: number): void {
    this.zoom = Math.max(1, Math.min(32, Math.floor(zoom)));
    this.emit<ZoomChangedEvent>("zoomChanged", { zoom: this.zoom });
  }

  /**
   * Gets the current zoom level
   *
   * @returns Zoom level (pixels per tile pixel)
   */
  getZoom(): number {
    return this.zoom;
  }

  /**
   * Sets grid visibility and emits a 'gridToggled' event
   *
   * @param enabled - Whether the grid should be visible
   */
  setGridEnabled(enabled: boolean): void {
    this.gridEnabled = enabled;
    this.emit<GridToggledEvent>("gridToggled", { enabled });
  }

  /**
   * Gets whether the grid is currently enabled
   *
   * @returns true if grid is visible, false otherwise
   */
  isGridEnabled(): boolean {
    return this.gridEnabled;
  }

  /**
   * Cleanup method - removes all event listeners
   *
   * Call this when the EditorState is no longer needed.
   */
  dispose(): void {
    this.removeAllListeners();
  }
}
