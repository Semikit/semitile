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
import type { TileBank } from "../views/TileBank/TileBank.js";
import type { TileBankModel } from "../models/TileBankModel.js";
import type { PaletteModel } from "../models/PaletteModel.js";
import "../views/TileBank/TileBank.js";

export interface TileBankReactProps {
  /**
   * The TileBankModel instance (required)
   */
  tileBankModel: TileBankModel;

  /**
   * The PaletteModel instance (required)
   */
  paletteModel: PaletteModel;

  /**
   * Callback when user clicks add tile button
   */
  onTileAdd?: () => void;

  /**
   * Callback when user clicks tile to select it
   */
  onTileSelect?: (detail: { index: number }) => void;

  /**
   * Callback when user duplicates a tile
   */
  onTileDuplicate?: (detail: { index: number }) => void;

  /**
   * Callback when user deletes a tile
   */
  onTileDelete?: (detail: { index: number }) => void;

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
 * TileBankReact - React wrapper for the TileBank Web Component
 *
 * @example
 * ```tsx
 * import { TileBankReact } from 'semitile-ui/react';
 * import { useTileBankModel, usePaletteModel } from 'semitile-ui/react/hooks';
 *
 * function MyTileBank({ tileBankModel, paletteModel }) {
 *   useTileBankModel(tileBankModel);
 *   usePaletteModel(paletteModel);
 *
 *   return (
 *     <TileBankReact
 *       tileBankModel={tileBankModel}
 *       paletteModel={paletteModel}
 *       onTileSelect={(detail) => console.log('Selected tile', detail.index)}
 *     />
 *   );
 * }
 * ```
 */
export const TileBankReact: React.FC<TileBankReactProps> = ({
  tileBankModel,
  paletteModel,
  onTileAdd,
  onTileSelect,
  onTileDuplicate,
  onTileDelete,
  className,
  style,
}) => {
  const ref = useRef<TileBank>(null);

  // Inject Models into the Web Component
  useEffect(() => {
    if (ref.current && tileBankModel && paletteModel) {
      ref.current.setModels(tileBankModel, paletteModel);
    }
  }, [tileBankModel, paletteModel]);

  // Set up event listeners
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTileAddEvent = () => {
      if (onTileAdd) {
        onTileAdd();
      }
    };

    const handleTileSelectEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      if (onTileSelect) {
        onTileSelect(customEvent.detail);
      }
    };

    const handleTileDuplicateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      if (onTileDuplicate) {
        onTileDuplicate(customEvent.detail);
      }
    };

    const handleTileDeleteEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      if (onTileDelete) {
        onTileDelete(customEvent.detail);
      }
    };

    element.addEventListener("tile-add-clicked", handleTileAddEvent);
    element.addEventListener("tile-select-clicked", handleTileSelectEvent);
    element.addEventListener("tile-duplicate-clicked", handleTileDuplicateEvent);
    element.addEventListener("tile-delete-clicked", handleTileDeleteEvent);

    return () => {
      element.removeEventListener("tile-add-clicked", handleTileAddEvent);
      element.removeEventListener("tile-select-clicked", handleTileSelectEvent);
      element.removeEventListener("tile-duplicate-clicked", handleTileDuplicateEvent);
      element.removeEventListener("tile-delete-clicked", handleTileDeleteEvent);
    };
  }, [onTileAdd, onTileSelect, onTileDuplicate, onTileDelete]);

  return (
    <tile-bank
      ref={ref}
      className={className}
      style={style}
    />
  );
};
