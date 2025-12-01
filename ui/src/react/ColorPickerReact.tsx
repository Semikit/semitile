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
import type { ColorPicker } from "../views/ColorPicker/ColorPicker.js";
import type { PaletteModel } from "../models/PaletteModel.js";
import "../views/ColorPicker/ColorPicker.js";

export interface ColorPickerReactProps {
  /**
   * The PaletteModel instance (required)
   */
  paletteModel: PaletteModel;

  /**
   * Callback when user edits a color
   */
  onColorEdit?: (detail: {
    paletteIdx: number;
    colorIdx: number;
    r: number;
    g: number;
    b: number;
  }) => void;

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
 * ColorPickerReact - React wrapper for the ColorPicker Web Component
 *
 * This component wraps the pure Web Component and provides a React-friendly API.
 * It handles Model injection and event handling for RGB555 color editing.
 *
 * @example
 * ```tsx
 * import { ColorPickerReact } from 'semitile-ui/react';
 * import { usePaletteModel } from 'semitile-ui/react/hooks';
 *
 * function MyColorEditor({ paletteModel }) {
 *   // Use hook to sync React state with Model
 *   usePaletteModel(paletteModel);
 *
 *   const handleColorEdit = (detail) => {
 *     console.log('Color edited:', detail);
 *   };
 *
 *   return (
 *     <ColorPickerReact
 *       paletteModel={paletteModel}
 *       onColorEdit={handleColorEdit}
 *     />
 *   );
 * }
 * ```
 */
export const ColorPickerReact: React.FC<ColorPickerReactProps> = ({
  paletteModel,
  onColorEdit,
  className,
  style,
}) => {
  const ref = useRef<ColorPicker>(null);

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

    const handleColorEditEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        paletteIdx: number;
        colorIdx: number;
        r: number;
        g: number;
        b: number;
      }>;
      if (onColorEdit) {
        onColorEdit(customEvent.detail);
      }
    };

    element.addEventListener("color-edit", handleColorEditEvent);

    return () => {
      element.removeEventListener("color-edit", handleColorEditEvent);
    };
  }, [onColorEdit]);

  return (
    <color-picker
      ref={ref}
      className={className}
      style={style}
    />
  );
};
