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

/**
 * TypeScript declarations for Semitile Web Components
 *
 * This file extends the global JSX namespace to include type definitions
 * for all Semitile custom elements, allowing them to be used in JSX/TSX
 * with proper type checking.
 */

import type { TileCanvas } from "../views/TileCanvas/TileCanvas.js";
import type { PaletteEditor } from "../views/PaletteEditor/PaletteEditor.js";
import type { ColorPicker } from "../views/ColorPicker/ColorPicker.js";
import type { ToolPanel } from "../views/ToolPanel/ToolPanel.js";
import type { TileBank } from "../views/TileBank/TileBank.js";
import type { TilemapEditor } from "../views/TilemapEditor/TilemapEditor.js";
import type { TilemapBank } from "../views/TilemapBank/TilemapBank.js";
import type { TileAttributesPanel } from "../views/TileAttributesPanel/TileAttributesPanel.js";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "tile-canvas": React.DetailedHTMLProps<
        React.HTMLAttributes<TileCanvas>,
        TileCanvas
      >;
      "palette-editor": React.DetailedHTMLProps<
        React.HTMLAttributes<PaletteEditor>,
        PaletteEditor
      >;
      "color-picker": React.DetailedHTMLProps<
        React.HTMLAttributes<ColorPicker>,
        ColorPicker
      >;
      "tool-panel": React.DetailedHTMLProps<
        React.HTMLAttributes<ToolPanel>,
        ToolPanel
      >;
      "tile-bank": React.DetailedHTMLProps<
        React.HTMLAttributes<TileBank>,
        TileBank
      >;
      "tilemap-editor": React.DetailedHTMLProps<
        React.HTMLAttributes<TilemapEditor>,
        TilemapEditor
      >;
      "tilemap-bank": React.DetailedHTMLProps<
        React.HTMLAttributes<TilemapBank>,
        TilemapBank
      >;
      "tile-attributes-panel": React.DetailedHTMLProps<
        React.HTMLAttributes<TileAttributesPanel>,
        TileAttributesPanel
      >;
    }
  }
}
