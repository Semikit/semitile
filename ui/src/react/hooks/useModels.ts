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

import type { TileBankModel } from "../../models/TileBankModel.js";
import type { PaletteModel } from "../../models/PaletteModel.js";
import type { EditorState } from "../../models/EditorState.js";
import type { TilemapModel } from "../../models/TilemapModel.js";
import { useModelState } from "./useModelState.js";

/**
 * React hook for TileBankModel
 *
 * Synchronizes React component state with TileBankModel events.
 * Component will re-render when any of these events occur:
 * - tileChanged
 * - tileAdded
 * - tileDeleted
 * - activeTileChanged
 * - tileBankImported
 *
 * @param model - The TileBankModel instance to observe
 * @returns The model (for convenience)
 *
 * @example
 * ```tsx
 * const MyTileEditor = ({ tileBankModel }) => {
 *   useTileBankModel(tileBankModel);
 *
 *   const activeTile = tileBankModel.getActiveTileIndex();
 *   const tileCount = tileBankModel.getTileCount();
 *
 *   return (
 *     <div>
 *       <p>Active tile: {activeTile}</p>
 *       <p>Total tiles: {tileCount}</p>
 *     </div>
 *   );
 * };
 * ```
 */
export function useTileBankModel(model: TileBankModel | null): TileBankModel | null {
  useModelState(model, [
    "tileChanged",
    "tileAdded",
    "tileDeleted",
    "activeTileChanged",
    "tileBankImported",
  ]);
  return model;
}

/**
 * React hook for PaletteModel
 *
 * Synchronizes React component state with PaletteModel events.
 * Component will re-render when any of these events occur:
 * - colorChanged
 * - colorSelected
 * - subPaletteChanged
 * - paletteImported
 *
 * @param model - The PaletteModel instance to observe
 * @returns The model (for convenience)
 *
 * @example
 * ```tsx
 * const MyPaletteDisplay = ({ paletteModel }) => {
 *   usePaletteModel(paletteModel);
 *
 *   const selectedColor = paletteModel.getSelectedColorIndex();
 *   const activePalette = paletteModel.getActiveSubPalette();
 *
 *   return (
 *     <div>
 *       <p>Selected color: {selectedColor}</p>
 *       <p>Active palette: {activePalette}</p>
 *     </div>
 *   );
 * };
 * ```
 */
export function usePaletteModel(model: PaletteModel | null): PaletteModel | null {
  useModelState(model, [
    "colorChanged",
    "colorSelected",
    "subPaletteChanged",
    "paletteImported",
  ]);
  return model;
}

/**
 * React hook for EditorState
 *
 * Synchronizes React component state with EditorState events.
 * Component will re-render when any of these events occur:
 * - toolChanged
 * - zoomChanged
 * - gridToggled
 *
 * @param model - The EditorState instance to observe
 * @returns The model (for convenience)
 *
 * @example
 * ```tsx
 * const MyToolbar = ({ editorState }) => {
 *   useEditorState(editorState);
 *
 *   const currentTool = editorState.getTool();
 *   const zoom = editorState.getZoom();
 *
 *   return (
 *     <div>
 *       <p>Tool: {currentTool}</p>
 *       <p>Zoom: {zoom}x</p>
 *     </div>
 *   );
 * };
 * ```
 */
export function useEditorState(model: EditorState | null): EditorState | null {
  useModelState(model, ["toolChanged", "zoomChanged", "gridToggled"]);
  return model;
}

/**
 * React hook for TilemapModel
 *
 * Synchronizes React component state with TilemapModel events.
 * Component will re-render when any of these events occur:
 * - entryChanged
 * - tilemapResized
 * - tilemapCleared
 * - tilemapFilled
 * - tilemapImported
 *
 * @param model - The TilemapModel instance to observe
 * @returns The model (for convenience)
 *
 * @example
 * ```tsx
 * const MyTilemapInfo = ({ tilemapModel }) => {
 *   useTilemapModel(tilemapModel);
 *
 *   const width = tilemapModel.getWidth();
 *   const height = tilemapModel.getHeight();
 *
 *   return (
 *     <div>
 *       <p>Tilemap size: {width} × {height}</p>
 *     </div>
 *   );
 * };
 * ```
 */
export function useTilemapModel(model: TilemapModel | null): TilemapModel | null {
  useModelState(model, [
    "entryChanged",
    "tilemapResized",
    "tilemapCleared",
    "tilemapFilled",
    "tilemapImported",
  ]);
  return model;
}
