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
import type { PaletteEditor } from "../views/PaletteEditor/PaletteEditor.js";
import type { PaletteModel } from "../models/PaletteModel.js";
import "../views/PaletteEditor/PaletteEditor.js";

export interface PaletteEditorReactProps {
  /**
   * The PaletteModel instance (required)
   */
  paletteModel: PaletteModel;

  /**
   * Callback when user clicks on a color swatch
   */
  onColorSelect?: (detail: { colorIndex: number }) => void;

  /**
   * Callback when user changes the active sub-palette
   */
  onSubPaletteChange?: (detail: { subPaletteIndex: number }) => void;

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
 * PaletteEditorReact - React wrapper for the PaletteEditor Web Component
 *
 * This component wraps the pure Web Component and provides a React-friendly API.
 * It handles Model injection and event handling.
 *
 * @example
 * ```tsx
 * import { PaletteEditorReact } from 'semitile-ui/react';
 * import { usePaletteModel } from 'semitile-ui/react/hooks';
 *
 * function MyPaletteDisplay({ paletteModel }) {
 *   // Use hook to sync React state with Model
 *   usePaletteModel(paletteModel);
 *
 *   const handleColorSelect = (detail) => {
 *     console.log('Color selected:', detail.colorIndex);
 *   };
 *
 *   return (
 *     <PaletteEditorReact
 *       paletteModel={paletteModel}
 *       onColorSelect={handleColorSelect}
 *     />
 *   );
 * }
 * ```
 */
export const PaletteEditorReact: React.FC<PaletteEditorReactProps> = ({
  paletteModel,
  onColorSelect,
  onSubPaletteChange,
  className,
  style,
}) => {
  const ref = useRef<PaletteEditor>(null);

  // Inject Model into the Web Component
  useEffect(() => {
    if (ref.current && paletteModel) {
      ref.current.setModel(paletteModel);
    }
  }, [paletteModel]);

  // Set up event listeners
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleColorSelectEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ colorIndex: number }>;
      if (onColorSelect) {
        onColorSelect(customEvent.detail);
      }
    };

    const handleSubPaletteChangeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ subPaletteIndex: number }>;
      if (onSubPaletteChange) {
        onSubPaletteChange(customEvent.detail);
      }
    };

    element.addEventListener("color-select-clicked", handleColorSelectEvent);
    element.addEventListener("subpalette-change-clicked", handleSubPaletteChangeEvent);

    return () => {
      element.removeEventListener("color-select-clicked", handleColorSelectEvent);
      element.removeEventListener("subpalette-change-clicked", handleSubPaletteChangeEvent);
    };
  }, [onColorSelect, onSubPaletteChange]);

  return (
    <palette-editor
      ref={ref}
      className={className}
      style={style}
    />
  );
};
