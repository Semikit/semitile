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

import React, { useEffect, useRef } from "react";
import type { ToolPanel } from "../views/ToolPanel/ToolPanel.js";
import type { EditorState } from "../models/EditorState.js";
import "../views/ToolPanel/ToolPanel.js";

export interface ToolPanelReactProps {
  /**
   * The EditorState instance (required)
   */
  editorState: EditorState;

  /**
   * Callback when user selects a tool
   */
  onToolSelected?: (detail: { tool: string }) => void;

  /**
   * Callback when user changes zoom level
   */
  onZoomChanged?: (detail: { zoom: number }) => void;

  /**
   * Callback when user toggles grid
   */
  onGridToggled?: (detail: { enabled: boolean }) => void;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;
}

/**
 * ToolPanelReact - React wrapper for the ToolPanel Web Component
 *
 * This component wraps the pure Web Component and provides a React-friendly API.
 * It handles Model injection and event handling for tool selection, zoom, and grid toggle.
 *
 * @example
 * ```tsx
 * import { ToolPanelReact } from 'semitile-ui/react';
 * import { useEditorState } from 'semitile-ui/react/hooks';
 *
 * function MyToolbar({ editorState }) {
 *   // Use hook to sync React state with Model
 *   useEditorState(editorState);
 *
 *   const handleToolSelected = (detail) => {
 *     console.log('Tool selected:', detail.tool);
 *   };
 *
 *   return (
 *     <ToolPanelReact
 *       editorState={editorState}
 *       onToolSelected={handleToolSelected}
 *     />
 *   );
 * }
 * ```
 */
export const ToolPanelReact: React.FC<ToolPanelReactProps> = ({
  editorState,
  onToolSelected,
  onZoomChanged,
  onGridToggled,
  className,
  style,
}) => {
  const ref = useRef<ToolPanel>(null);

  // Inject Model into the Web Component
  useEffect(() => {
    if (ref.current && editorState) {
      ref.current.setModel(editorState);
    }
  }, [editorState]);

  // Set up event listeners
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleToolSelectedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ tool: string }>;
      if (onToolSelected) {
        onToolSelected(customEvent.detail);
      }
    };

    const handleZoomChangedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ zoom: number }>;
      if (onZoomChanged) {
        onZoomChanged(customEvent.detail);
      }
    };

    const handleGridToggledEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (onGridToggled) {
        onGridToggled(customEvent.detail);
      }
    };

    element.addEventListener("tool-selected", handleToolSelectedEvent);
    element.addEventListener("zoom-changed", handleZoomChangedEvent);
    element.addEventListener("grid-toggled", handleGridToggledEvent);

    return () => {
      element.removeEventListener("tool-selected", handleToolSelectedEvent);
      element.removeEventListener("zoom-changed", handleZoomChangedEvent);
      element.removeEventListener("grid-toggled", handleGridToggledEvent);
    };
  }, [onToolSelected, onZoomChanged, onGridToggled]);

  return (
    <tool-panel
      ref={ref}
      className={className}
      style={style}
    />
  );
};
