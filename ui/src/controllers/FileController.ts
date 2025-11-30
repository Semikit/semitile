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

import { TileBankModel } from "../models/TileBankModel.js";
import { PaletteModel } from "../models/PaletteModel.js";
import { TilemapModel } from "../models/TilemapModel.js";
import { ExportManager } from "../lib/ExportManager.js";
import { getStorage, type ProjectData } from "../lib/storage.js";

/**
 * FileController - Business logic for file operations
 *
 * This Controller handles all file-related operations:
 * - Saving/loading projects to IndexedDB
 * - Exporting to binary formats
 * - Exporting to C/Assembly headers
 * - Importing from files
 *
 * Usage:
 * ```typescript
 * const fileController = new FileController(tileBankModel, paletteModel);
 *
 * // Save project
 * await fileController.saveProject("my_tile");
 *
 * // Export binary
 * fileController.exportTileBinary("my_tile");
 * ```
 */
export class FileController {
  private currentProjectName: string = "untitled";

  constructor(
    private tileBankModel: TileBankModel,
    private paletteModel: PaletteModel,
    private tilemapModel?: TilemapModel
  ) {}

  /**
   * Save current project to IndexedDB
   */
  async saveProject(name?: string): Promise<void> {
    const projectName = name || this.currentProjectName;

    // Encode all tiles to base64
    const allTiles = this.tileBankModel.exportAllTiles();
    const tilesBase64 = allTiles.map((tile) => this.arrayToBase64(tile));
    const paletteBinary = this.paletteModel.exportBinary();

    const projectData: ProjectData = {
      name: projectName,
      version: "1.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tiles: tilesBase64,
      activeTileIndex: this.tileBankModel.getActiveTileIndex(),
      palette: {
        binary: this.arrayToBase64(paletteBinary),
      },
    };

    const storage = await getStorage();
    await storage.saveProject(projectData);

    this.currentProjectName = projectName;

    console.log(`[FileController] Project saved: ${projectName} (${tilesBase64.length} tiles)`);
  }

  /**
   * Load project from IndexedDB
   */
  async loadProject(name: string): Promise<boolean> {
    const storage = await getStorage();
    const projectData = await storage.loadProject(name);

    if (!projectData) {
      console.error(`[FileController] Project not found: ${name}`);
      return false;
    }

    // Decode tiles from base64
    const tiles = projectData.tiles.map((tileBase64) =>
      this.base64ToArray(tileBase64)
    );
    const paletteBinary = this.base64ToArray(projectData.palette.binary);

    // Import into models
    this.tileBankModel.importTiles(tiles);
    const paletteImported = this.paletteModel.importBinary(paletteBinary);

    if (!paletteImported) {
      console.error(`[FileController] Failed to import palette data`);
      return false;
    }

    // Restore active tile index
    if (
      projectData.activeTileIndex !== undefined &&
      projectData.activeTileIndex >= 0 &&
      projectData.activeTileIndex < tiles.length
    ) {
      this.tileBankModel.setActiveTile(projectData.activeTileIndex);
    }

    this.currentProjectName = name;

    console.log(`[FileController] Project loaded: ${name} (${tiles.length} tiles)`);
    return true;
  }

  /**
   * List all saved projects
   */
  async listProjects(): Promise<ProjectData[]> {
    const storage = await getStorage();
    return await storage.listProjects();
  }

  /**
   * Delete a project
   */
  async deleteProject(name: string): Promise<void> {
    const storage = await getStorage();
    await storage.deleteProject(name);
    console.log(`[FileController] Project deleted: ${name}`);
  }

  /**
   * Export active tile to binary file (.bin)
   */
  exportTileBinary(filename: string = "tile.bin"): void {
    const activeTile = this.tileBankModel.getActiveTile();
    const data = ExportManager.exportTileBinary(activeTile);
    ExportManager.downloadFile(data, filename);
    console.log(`[FileController] Exported active tile binary: ${filename}`);
  }

  /**
   * Export all tiles to a single binary file (.bin)
   */
  exportAllTilesBinary(filename: string = "tiles.bin"): void {
    const allTiles = this.tileBankModel.exportAllTiles();

    // Concatenate all tile data (32 bytes each)
    const totalSize = allTiles.length * 32;
    const combined = new Uint8Array(totalSize);

    allTiles.forEach((tileData, index) => {
      combined.set(tileData, index * 32);
    });

    ExportManager.downloadFile(combined, filename);
    console.log(`[FileController] Exported ${allTiles.length} tiles to binary: ${filename}`);
  }

  /**
   * Export palette to binary file (.bin)
   */
  exportPaletteBinary(filename: string = "palette.bin"): void {
    const data = ExportManager.exportPaletteBinary(this.paletteModel);
    ExportManager.downloadFile(data, filename);
    console.log(`[FileController] Exported palette binary: ${filename}`);
  }

  /**
   * Export active tile to C header (.h)
   */
  exportTileCHeader(filename: string = "tile.h"): void {
    const activeTile = this.tileBankModel.getActiveTile();
    const name = filename.replace(/\.h$/, "");
    const header = ExportManager.generateTileCHeader(activeTile, name);
    ExportManager.downloadFile(header, filename);
    console.log(`[FileController] Exported active tile C header: ${filename}`);
  }

  /**
   * Export all tiles to a single C header file (.h)
   */
  exportAllTilesCHeader(filename: string = "tiles.h"): void {
    const allTiles = this.tileBankModel.getAllTiles();
    const name = filename.replace(/\.h$/, "");
    const variableName = this.sanitizeName(name);

    let header = `// Tile bank data: ${name}\n`;
    header += `// ${allTiles.length} tiles, 8x8 pixels each, 4bpp planar format\n`;
    header += `// Generated by Semitile\n\n`;
    header += `#ifndef TILES_${variableName.toUpperCase()}_H\n`;
    header += `#define TILES_${variableName.toUpperCase()}_H\n\n`;
    header += `#define ${variableName.toUpperCase()}_COUNT ${allTiles.length}\n\n`;
    header += `const unsigned char ${variableName}[${allTiles.length}][32] = {\n`;

    allTiles.forEach((tile, tileIndex) => {
      const data = tile.exportPlanar();
      header += `    // Tile ${tileIndex}\n    {\n`;

      for (let i = 0; i < 4; i++) {
        header += `        // Plane ${i}\n        `;
        for (let j = 0; j < 8; j++) {
          const byte = data[i * 8 + j];
          header += `0x${byte.toString(16).toUpperCase().padStart(2, "0")}`;
          if (i < 3 || j < 7) header += ", ";
        }
        header += "\n";
      }

      header += `    }`;
      if (tileIndex < allTiles.length - 1) header += ",";
      header += "\n";
    });

    header += `};\n\n`;
    header += `#endif // TILES_${variableName.toUpperCase()}_H\n`;

    ExportManager.downloadFile(header, filename);
    console.log(`[FileController] Exported ${allTiles.length} tiles to C header: ${filename}`);
  }

  private sanitizeName(name: string): string {
    // Remove file extension if present
    name = name.replace(/\.[^.]+$/, "");
    // Replace non-alphanumeric characters with underscores
    name = name.replace(/[^a-zA-Z0-9_]/g, "_");
    // Ensure it doesn't start with a number
    if (/^[0-9]/.test(name)) {
      name = "_" + name;
    }
    return name || "data";
  }

  /**
   * Export palette to C header (.h)
   */
  exportPaletteCHeader(filename: string = "palette.h"): void {
    const name = filename.replace(/\.h$/, "");
    const header = ExportManager.generatePaletteCHeader(this.paletteModel, name);
    ExportManager.downloadFile(header, filename);
    console.log(`[FileController] Exported palette C header: ${filename}`);
  }

  /**
   * Export active tile to Assembly file (.asm)
   */
  exportTileASM(filename: string = "tile.asm"): void {
    const activeTile = this.tileBankModel.getActiveTile();
    const name = filename.replace(/\.asm$/, "");
    const asm = ExportManager.generateTileASM(activeTile, name);
    ExportManager.downloadFile(asm, filename);
    console.log(`[FileController] Exported active tile ASM: ${filename}`);
  }

  /**
   * Export all tiles to a single Assembly file (.asm)
   */
  exportAllTilesASM(filename: string = "tiles.asm"): void {
    const allTiles = this.tileBankModel.getAllTiles();
    const name = filename.replace(/\.asm$/, "");
    const labelName = this.sanitizeName(name);

    let asm = `; Tile bank data: ${name}\n`;
    asm += `; ${allTiles.length} tiles, 8x8 pixels each, 4bpp planar format\n`;
    asm += `; Generated by Semitile\n\n`;
    asm += `${labelName}_count .equ ${allTiles.length}\n\n`;
    asm += `${labelName}:\n`;

    allTiles.forEach((tile, tileIndex) => {
      const data = tile.exportPlanar();
      asm += `    ; Tile ${tileIndex}\n`;

      for (let i = 0; i < 4; i++) {
        asm += `    ; Plane ${i}\n`;
        asm += `    .db `;
        for (let j = 0; j < 8; j++) {
          const byte = data[i * 8 + j];
          asm += `$${byte.toString(16).toUpperCase().padStart(2, "0")}`;
          if (j < 7) asm += ", ";
        }
        asm += "\n";
      }

      if (tileIndex < allTiles.length - 1) {
        asm += "\n";
      }
    });

    ExportManager.downloadFile(asm, filename);
    console.log(`[FileController] Exported ${allTiles.length} tiles to ASM: ${filename}`);
  }

  /**
   * Export palette to Assembly file (.asm)
   */
  exportPaletteASM(filename: string = "palette.asm"): void {
    const name = filename.replace(/\.asm$/, "");
    const asm = ExportManager.generatePaletteASM(this.paletteModel, name);
    ExportManager.downloadFile(asm, filename);
    console.log(`[FileController] Exported palette ASM: ${filename}`);
  }

  /**
   * Export project as JSON file (.json)
   */
  async exportProjectJSON(filename: string = "project.json"): Promise<void> {
    const projectName = filename.replace(/\.json$/, "");

    // Export all tiles
    const allTiles = this.tileBankModel.exportAllTiles();
    const tilesBase64 = allTiles.map((tile) => this.arrayToBase64(tile));

    const projectData: ProjectData = {
      name: projectName,
      version: "1.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tiles: tilesBase64,
      activeTileIndex: this.tileBankModel.getActiveTileIndex(),
      palette: {
        binary: this.arrayToBase64(this.paletteModel.exportBinary()),
      },
    };

    const json = JSON.stringify(projectData, null, 2);
    ExportManager.downloadFile(json, filename, "application/json");
    console.log(`[FileController] Exported project JSON: ${filename} (${tilesBase64.length} tiles)`);
  }

  /**
   * Import project from JSON file
   */
  async importProjectJSON(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const projectData: ProjectData = JSON.parse(text);

      // Decode tiles and palette
      const tiles = projectData.tiles.map((tileBase64) =>
        this.base64ToArray(tileBase64)
      );
      const paletteBinary = this.base64ToArray(projectData.palette.binary);

      // Import into models
      this.tileBankModel.importTiles(tiles);
      const paletteImported = this.paletteModel.importBinary(paletteBinary);

      if (!paletteImported) {
        console.error(`[FileController] Failed to import palette data`);
        return false;
      }

      // Restore active tile index
      if (
        projectData.activeTileIndex !== undefined &&
        projectData.activeTileIndex >= 0 &&
        projectData.activeTileIndex < tiles.length
      ) {
        this.tileBankModel.setActiveTile(projectData.activeTileIndex);
      }

      this.currentProjectName = projectData.name;
      console.log(`[FileController] Imported project: ${projectData.name} (${tiles.length} tiles)`);
      return true;
    } catch (error) {
      console.error(`[FileController] Failed to import project:`, error);
      return false;
    }
  }

  /**
   * Import tile from binary file (.bin) into active tile
   */
  async importTileBinary(file: File): Promise<boolean> {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      if (data.length !== 32) {
        console.error(
          `[FileController] Invalid tile binary size: ${data.length} (expected 32)`
        );
        return false;
      }

      const activeTile = this.tileBankModel.getActiveTile();
      const imported = activeTile.importPlanar(data);
      if (imported) {
        console.log(`[FileController] Imported tile binary into active tile`);
      }
      return imported;
    } catch (error) {
      console.error(`[FileController] Failed to import tile:`, error);
      return false;
    }
  }

  /**
   * Import palette from binary file (.pal)
   */
  async importPaletteBinary(file: File): Promise<boolean> {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      if (data.length !== 512) {
        console.error(
          `[FileController] Invalid palette binary size: ${data.length} (expected 512)`
        );
        return false;
      }

      const imported = this.paletteModel.importBinary(data);
      if (imported) {
        console.log(`[FileController] Imported palette binary`);
      }
      return imported;
    } catch (error) {
      console.error(`[FileController] Failed to import palette:`, error);
      return false;
    }
  }

  /**
   * Get current project name
   */
  getCurrentProjectName(): string {
    return this.currentProjectName;
  }

  /**
   * Set current project name
   */
  setCurrentProjectName(name: string): void {
    this.currentProjectName = name;
  }

  /**
   * Convert Uint8Array to base64 string
   */
  private arrayToBase64(array: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < array.length; i++) {
      binary += String.fromCharCode(array[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to Uint8Array
   */
  private base64ToArray(base64: string): Uint8Array {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return array;
  }

  /**
   * Export tilemap to binary file (.bin)
   */
  exportTilemapBinary(filename: string = "tilemap.bin"): void {
    if (!this.tilemapModel) {
      console.error("[FileController] No tilemap model available");
      return;
    }

    const data = this.tilemapModel.exportBinary();
    ExportManager.downloadFile(data, filename);
    console.log(
      `[FileController] Exported tilemap binary: ${filename} (${this.tilemapModel.getWidth()}x${this.tilemapModel.getHeight()})`
    );
  }

  /**
   * Export tilemap to C header (.h)
   */
  exportTilemapCHeader(filename: string = "tilemap.h"): void {
    if (!this.tilemapModel) {
      console.error("[FileController] No tilemap model available");
      return;
    }

    const name = filename.replace(/\.h$/, "");
    const variableName = this.sanitizeName(name);
    const width = this.tilemapModel.getWidth();
    const height = this.tilemapModel.getHeight();
    const data = this.tilemapModel.exportBinary();

    let header = `// Tilemap data: ${name}\n`;
    header += `// ${width}x${height} tiles, 2 bytes per entry\n`;
    header += `// Generated by Semitile\n\n`;
    header += `#ifndef TILEMAP_${variableName.toUpperCase()}_H\n`;
    header += `#define TILEMAP_${variableName.toUpperCase()}_H\n\n`;
    header += `#define ${variableName.toUpperCase()}_WIDTH ${width}\n`;
    header += `#define ${variableName.toUpperCase()}_HEIGHT ${height}\n\n`;
    header += `const unsigned short ${variableName}[${width * height}] = {\n`;

    // Write tilemap entries (16-bit values)
    for (let i = 0; i < data.length; i += 2) {
      if (i > 0 && i % 32 === 0) {
        header += "\n";
      }
      if (i % 32 === 0) {
        header += "    ";
      }

      const low = data[i];
      const high = data[i + 1];
      const value = (high << 8) | low;
      header += `0x${value.toString(16).toUpperCase().padStart(4, "0")}`;

      if (i < data.length - 2) {
        header += ", ";
      }
    }

    header += `\n};\n\n`;
    header += `#endif // TILEMAP_${variableName.toUpperCase()}_H\n`;

    ExportManager.downloadFile(header, filename);
    console.log(`[FileController] Exported tilemap C header: ${filename}`);
  }

  /**
   * Export tilemap to Assembly file (.asm)
   */
  exportTilemapASM(filename: string = "tilemap.asm"): void {
    if (!this.tilemapModel) {
      console.error("[FileController] No tilemap model available");
      return;
    }

    const name = filename.replace(/\.asm$/, "");
    const labelName = this.sanitizeName(name);
    const width = this.tilemapModel.getWidth();
    const height = this.tilemapModel.getHeight();
    const data = this.tilemapModel.exportBinary();

    let asm = `; Tilemap data: ${name}\n`;
    asm += `; ${width}x${height} tiles, 2 bytes per entry\n`;
    asm += `; Generated by Semitile\n\n`;
    asm += `${labelName}_width .equ ${width}\n`;
    asm += `${labelName}_height .equ ${height}\n\n`;
    asm += `${labelName}:\n`;

    // Write tilemap entries (16-bit values)
    for (let i = 0; i < data.length; i += 32) {
      asm += "    .dw ";
      const end = Math.min(i + 32, data.length);

      for (let j = i; j < end; j += 2) {
        const low = data[j];
        const high = data[j + 1];
        const value = (high << 8) | low;
        asm += `$${value.toString(16).toUpperCase().padStart(4, "0")}`;

        if (j < end - 2) {
          asm += ", ";
        }
      }

      asm += "\n";
    }

    ExportManager.downloadFile(asm, filename);
    console.log(`[FileController] Exported tilemap ASM: ${filename}`);
  }
}
