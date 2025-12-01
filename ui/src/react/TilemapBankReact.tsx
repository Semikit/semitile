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
import type { TilemapBank } from "../views/TilemapBank/TilemapBank.js";
import type { TilemapBankModel } from "../models/TilemapBankModel.js";
import "../views/TilemapBank/TilemapBank.js";

export interface TilemapBankReactProps {
  /**
   * The TilemapBankModel instance (required)
   */
  tilemapBankModel: TilemapBankModel;

  /**
   * Callback when user clicks add tilemap button
   */
  onTilemapAdd?: () => void;

  /**
   * Callback when user clicks tilemap to select it
   */
  onTilemapSelect?: (detail: { index: number }) => void;

  /**
   * Callback when user duplicates a tilemap
   */
  onTilemapDuplicate?: (detail: { index: number }) => void;

  /**
   * Callback when user deletes a tilemap
   */
  onTilemapDelete?: (detail: { index: number }) => void;

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
 * TilemapBankReact - React wrapper for the TilemapBank Web Component
 *
 * @example
 * ```tsx
 * import { TilemapBankReact } from 'semitile-ui/react';
 *
 * function MyTilemapBank({ tilemapBankModel }) {
 *   return (
 *     <TilemapBankReact
 *       tilemapBankModel={tilemapBankModel}
 *       onTilemapSelect={(detail) => console.log('Selected tilemap', detail.index)}
 *     />
 *   );
 * }
 * ```
 */
export const TilemapBankReact: React.FC<TilemapBankReactProps> = ({
  tilemapBankModel,
  onTilemapAdd,
  onTilemapSelect,
  onTilemapDuplicate,
  onTilemapDelete,
  className,
  style,
}) => {
  const ref = useRef<TilemapBank>(null);

  // Inject Model into the Web Component
  useEffect(() => {
    if (ref.current && tilemapBankModel) {
      ref.current.setModel(tilemapBankModel);
    }
  }, [tilemapBankModel]);

  // Set up event listeners
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTilemapAddEvent = () => {
      if (onTilemapAdd) {
        onTilemapAdd();
      }
    };

    const handleTilemapSelectEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      if (onTilemapSelect) {
        onTilemapSelect(customEvent.detail);
      }
    };

    const handleTilemapDuplicateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      if (onTilemapDuplicate) {
        onTilemapDuplicate(customEvent.detail);
      }
    };

    const handleTilemapDeleteEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ index: number }>;
      if (onTilemapDelete) {
        onTilemapDelete(customEvent.detail);
      }
    };

    element.addEventListener("tilemap-add-clicked", handleTilemapAddEvent);
    element.addEventListener("tilemap-select-clicked", handleTilemapSelectEvent);
    element.addEventListener("tilemap-duplicate-clicked", handleTilemapDuplicateEvent);
    element.addEventListener("tilemap-delete-clicked", handleTilemapDeleteEvent);

    return () => {
      element.removeEventListener("tilemap-add-clicked", handleTilemapAddEvent);
      element.removeEventListener("tilemap-select-clicked", handleTilemapSelectEvent);
      element.removeEventListener("tilemap-duplicate-clicked", handleTilemapDuplicateEvent);
      element.removeEventListener("tilemap-delete-clicked", handleTilemapDeleteEvent);
    };
  }, [onTilemapAdd, onTilemapSelect, onTilemapDuplicate, onTilemapDelete]);

  return (
    <tilemap-bank
      ref={ref}
      className={className}
      style={style}
    />
  );
};
