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
import type { TileCanvas } from "../views/TileCanvas/TileCanvas.js";
import type { TileBankModel } from "../models/TileBankModel.js";
import type { PaletteModel } from "../models/PaletteModel.js";
import type { EditorState } from "../models/EditorState.js";
import "../views/TileCanvas/TileCanvas.js";

export interface TileCanvasReactProps {
  /**
   * The TileBankModel instance (required)
   */
  tileBankModel: TileBankModel;

  /**
   * The PaletteModel instance (required)
   */
  paletteModel: PaletteModel;

  /**
   * The EditorState instance (required)
   */
  editorState: EditorState;

  /**
   * Callback when user starts drawing
   */
  onDrawStart?: (detail: { x: number; y: number }) => void;

  /**
   * Callback when user continues drawing (mouse move)
   */
  onDrawMove?: (detail: { x: number; y: number }) => void;

  /**
   * Callback when user stops drawing
   */
  onDrawEnd?: (detail: { x: number; y: number }) => void;

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
 * TileCanvasReact - React wrapper for the TileCanvas Web Component
 *
 * This component wraps the pure Web Component and provides a React-friendly API.
 * It handles Model injection and event handling.
 *
 * @example
 * ```tsx
 * import { TileCanvasReact } from 'semitile-ui/react';
 * import { useTileBankModel, usePaletteModel, useEditorState } from 'semitile-ui/react/hooks';
 *
 * function MyTileEditor({ tileBankModel, paletteModel, editorState }) {
 *   // Use hooks to sync React state with Models
 *   useTileBankModel(tileBankModel);
 *   usePaletteModel(paletteModel);
 *   useEditorState(editorState);
 *
 *   const handleDrawStart = (detail) => {
 *     console.log('Drawing at', detail.x, detail.y);
 *   };
 *
 *   return (
 *     <TileCanvasReact
 *       tileBankModel={tileBankModel}
 *       paletteModel={paletteModel}
 *       editorState={editorState}
 *       onDrawStart={handleDrawStart}
 *     />
 *   );
 * }
 * ```
 */
export const TileCanvasReact: React.FC<TileCanvasReactProps> = ({
  tileBankModel,
  paletteModel,
  editorState,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  className,
  style,
}) => {
  const ref = useRef<TileCanvas>(null);

  // Inject Models into the Web Component
  useEffect(() => {
    if (ref.current && tileBankModel && paletteModel && editorState) {
      ref.current.setModels(tileBankModel, paletteModel, editorState);
    }
  }, [tileBankModel, paletteModel, editorState]);

  // Set up event listeners
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleDrawStartEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      if (onDrawStart) {
        onDrawStart(customEvent.detail);
      }
    };

    const handleDrawMoveEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      if (onDrawMove) {
        onDrawMove(customEvent.detail);
      }
    };

    const handleDrawEndEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      if (onDrawEnd) {
        onDrawEnd(customEvent.detail);
      }
    };

    element.addEventListener("draw-start", handleDrawStartEvent);
    element.addEventListener("draw-move", handleDrawMoveEvent);
    element.addEventListener("draw-end", handleDrawEndEvent);

    return () => {
      element.removeEventListener("draw-start", handleDrawStartEvent);
      element.removeEventListener("draw-move", handleDrawMoveEvent);
      element.removeEventListener("draw-end", handleDrawEndEvent);
    };
  }, [onDrawStart, onDrawMove, onDrawEnd]);

  return (
    <tile-canvas
      ref={ref}
      className={className}
      style={style}
    />
  );
};
