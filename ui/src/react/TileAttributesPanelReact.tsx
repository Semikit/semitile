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
import type { TileAttributesPanel } from "../views/TileAttributesPanel/TileAttributesPanel.js";
import "../views/TileAttributesPanel/TileAttributesPanel.js";

export interface TileAttributesPanelReactProps {
  /**
   * Callback when user changes the palette index
   */
  onPaletteChanged?: (detail: { paletteIdx: number }) => void;

  /**
   * Callback when user changes horizontal flip
   */
  onHFlipChanged?: (detail: { hFlip: boolean }) => void;

  /**
   * Callback when user changes vertical flip
   */
  onVFlipChanged?: (detail: { vFlip: boolean }) => void;

  /**
   * Callback when user changes priority
   */
  onPriorityChanged?: (detail: { priority: boolean }) => void;

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
 * TileAttributesPanelReact - React wrapper for the TileAttributesPanel Web Component
 *
 * This component wraps the pure Web Component and provides a React-friendly API
 * for controlling tilemap tile attributes (palette, flips, priority).
 *
 * @example
 * ```tsx
 * import { TileAttributesPanelReact } from 'semitile-ui/react';
 *
 * function MyTileAttributes() {
 *   const handlePaletteChange = (detail) => {
 *     console.log('Palette changed to', detail.paletteIdx);
 *   };
 *
 *   return (
 *     <TileAttributesPanelReact
 *       onPaletteChanged={handlePaletteChange}
 *       onHFlipChanged={(detail) => console.log('H-Flip:', detail.hFlip)}
 *       onVFlipChanged={(detail) => console.log('V-Flip:', detail.vFlip)}
 *       onPriorityChanged={(detail) => console.log('Priority:', detail.priority)}
 *     />
 *   );
 * }
 * ```
 */
export const TileAttributesPanelReact: React.FC<TileAttributesPanelReactProps> = ({
  onPaletteChanged,
  onHFlipChanged,
  onVFlipChanged,
  onPriorityChanged,
  className,
  style,
}) => {
  const ref = useRef<TileAttributesPanel>(null);

  // Set up event listeners
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handlePaletteChangedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ paletteIdx: number }>;
      if (onPaletteChanged) {
        onPaletteChanged(customEvent.detail);
      }
    };

    const handleHFlipChangedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ hFlip: boolean }>;
      if (onHFlipChanged) {
        onHFlipChanged(customEvent.detail);
      }
    };

    const handleVFlipChangedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ vFlip: boolean }>;
      if (onVFlipChanged) {
        onVFlipChanged(customEvent.detail);
      }
    };

    const handlePriorityChangedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ priority: boolean }>;
      if (onPriorityChanged) {
        onPriorityChanged(customEvent.detail);
      }
    };

    element.addEventListener("palette-changed", handlePaletteChangedEvent);
    element.addEventListener("h-flip-changed", handleHFlipChangedEvent);
    element.addEventListener("v-flip-changed", handleVFlipChangedEvent);
    element.addEventListener("priority-changed", handlePriorityChangedEvent);

    return () => {
      element.removeEventListener("palette-changed", handlePaletteChangedEvent);
      element.removeEventListener("h-flip-changed", handleHFlipChangedEvent);
      element.removeEventListener("v-flip-changed", handleVFlipChangedEvent);
      element.removeEventListener("priority-changed", handlePriorityChangedEvent);
    };
  }, [onPaletteChanged, onHFlipChanged, onVFlipChanged, onPriorityChanged]);

  return (
    <tile-attributes-panel
      ref={ref}
      className={className}
      style={style}
    />
  );
};
