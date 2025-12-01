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
import type { TilemapEditor } from "../views/TilemapEditor/TilemapEditor.js";
import type { TilemapModel } from "../models/TilemapModel.js";
import type { TileBankModel } from "../models/TileBankModel.js";
import type { PaletteModel } from "../models/PaletteModel.js";
import "../views/TilemapEditor/TilemapEditor.js";

export interface TilemapEditorReactProps {
  /**
   * The TilemapModel instance (required)
   */
  tilemapModel: TilemapModel;

  /**
   * The TileBankModel instance (required)
   */
  tileBankModel: TileBankModel;

  /**
   * The PaletteModel instance (required)
   */
  paletteModel: PaletteModel;

  /**
   * Callback when user starts placing tiles
   */
  onTilePlaceStart?: (detail: { x: number; y: number }) => void;

  /**
   * Callback when user continues placing tiles (mouse move)
   */
  onTilePlaceMove?: (detail: { x: number; y: number }) => void;

  /**
   * Callback when user stops placing tiles
   */
  onTilePlaceEnd?: (detail: { x: number; y: number }) => void;

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
 * TilemapEditorReact - React wrapper for the TilemapEditor Web Component
 *
 * This component wraps the pure Web Component and provides a React-friendly API.
 * It handles Model injection and event handling for tilemap editing.
 *
 * @example
 * ```tsx
 * import { TilemapEditorReact } from 'semitile-ui/react';
 * import { useTilemapModel, useTileBankModel, usePaletteModel } from 'semitile-ui/react/hooks';
 *
 * function MyTilemapEditor({ tilemapModel, tileBankModel, paletteModel }) {
 *   // Use hooks to sync React state with Models
 *   useTilemapModel(tilemapModel);
 *   useTileBankModel(tileBankModel);
 *   usePaletteModel(paletteModel);
 *
 *   const handleTilePlaceStart = (detail) => {
 *     console.log('Placing tile at', detail.x, detail.y);
 *   };
 *
 *   return (
 *     <TilemapEditorReact
 *       tilemapModel={tilemapModel}
 *       tileBankModel={tileBankModel}
 *       paletteModel={paletteModel}
 *       onTilePlaceStart={handleTilePlaceStart}
 *     />
 *   );
 * }
 * ```
 */
export const TilemapEditorReact: React.FC<TilemapEditorReactProps> = ({
  tilemapModel,
  tileBankModel,
  paletteModel,
  onTilePlaceStart,
  onTilePlaceMove,
  onTilePlaceEnd,
  className,
  style,
}) => {
  const ref = useRef<TilemapEditor>(null);

  // Inject Models into the Web Component
  useEffect(() => {
    if (ref.current && tilemapModel && tileBankModel && paletteModel) {
      ref.current.setModels(tilemapModel, tileBankModel, paletteModel);
    }
  }, [tilemapModel, tileBankModel, paletteModel]);

  // Set up event listeners
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTilePlaceStartEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      if (onTilePlaceStart) {
        onTilePlaceStart(customEvent.detail);
      }
    };

    const handleTilePlaceMoveEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      if (onTilePlaceMove) {
        onTilePlaceMove(customEvent.detail);
      }
    };

    const handleTilePlaceEndEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      if (onTilePlaceEnd) {
        onTilePlaceEnd(customEvent.detail);
      }
    };

    element.addEventListener("tile-place-start", handleTilePlaceStartEvent);
    element.addEventListener("tile-place-move", handleTilePlaceMoveEvent);
    element.addEventListener("tile-place-end", handleTilePlaceEndEvent);

    return () => {
      element.removeEventListener("tile-place-start", handleTilePlaceStartEvent);
      element.removeEventListener("tile-place-move", handleTilePlaceMoveEvent);
      element.removeEventListener("tile-place-end", handleTilePlaceEndEvent);
    };
  }, [onTilePlaceStart, onTilePlaceMove, onTilePlaceEnd]);

  return (
    <tilemap-editor
      ref={ref}
      className={className}
      style={style}
    />
  );
};
