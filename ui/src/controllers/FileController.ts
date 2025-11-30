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
import { TilemapBankModel } from "../models/TilemapBankModel.js";
import { ExportManager } from "../lib/ExportManager.js";
import { getStorage, type ProjectData } from "../lib/storage.js";
import JSZip from "jszip";

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
    private tilemapBankModel?: TilemapBankModel,
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

    // Encode all tilemaps to base64
    let tilemapsData:
      | Array<{ width: number; height: number; data: string }>
      | undefined = undefined;
    let activeTilemapIndex: number | undefined = undefined;
    if (this.tilemapBankModel) {
      const allTilemaps = this.tilemapBankModel.exportAllTilemaps();
      tilemapsData = allTilemaps.map((tilemap) => ({
        width: tilemap.width,
        height: tilemap.height,
        data: this.arrayToBase64(tilemap.data),
      }));
      activeTilemapIndex = this.tilemapBankModel.getActiveTilemapIndex();
    }

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
      tilemaps: tilemapsData,
      activeTilemapIndex,
    };

    const storage = await getStorage();
    await storage.saveProject(projectData);

    this.currentProjectName = projectName;

    console.log(
      `[FileController] Project saved: ${projectName} (${tilesBase64.length} tiles, ${tilemapsData?.length || 0} tilemaps)`,
    );
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
      this.base64ToArray(tileBase64),
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

    // Decode and import tilemaps if present
    if (this.tilemapBankModel && projectData.tilemaps) {
      const tilemaps = projectData.tilemaps.map((tilemapData) => ({
        width: tilemapData.width,
        height: tilemapData.height,
        data: this.base64ToArray(tilemapData.data),
      }));

      this.tilemapBankModel.importTilemaps(tilemaps);

      // Restore active tilemap index
      if (
        projectData.activeTilemapIndex !== undefined &&
        projectData.activeTilemapIndex >= 0 &&
        projectData.activeTilemapIndex < tilemaps.length
      ) {
        this.tilemapBankModel.setActiveTilemap(projectData.activeTilemapIndex);
      }
    }

    this.currentProjectName = name;

    console.log(
      `[FileController] Project loaded: ${name} (${tiles.length} tiles, ${projectData.tilemaps?.length || 0} tilemaps)`,
    );
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
   * Generate all tiles binary data
   */
  private generateAllTilesBinary(): Uint8Array {
    const allTiles = this.tileBankModel.exportAllTiles();
    const totalSize = allTiles.length * 32;
    const combined = new Uint8Array(totalSize);

    allTiles.forEach((tileData, index) => {
      combined.set(tileData, index * 32);
    });

    return combined;
  }

  /**
   * Export all tiles to a single binary file (.bin)
   */
  exportAllTilesBinary(filename: string = "tiles.bin"): void {
    const combined = this.generateAllTilesBinary();
    ExportManager.downloadFile(combined, filename);
    console.log(
      `[FileController] Exported ${combined.length / 32} tiles to binary: ${filename}`,
    );
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
   * Generate all tiles C header data
   */
  private generateAllTilesCHeader(name: string): string {
    const allTiles = this.tileBankModel.getAllTiles();
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

    return header;
  }

  /**
   * Export all tiles to a single C header file (.h)
   */
  exportAllTilesCHeader(filename: string = "tiles.h"): void {
    const name = filename.replace(/\.h$/, "");
    const header = this.generateAllTilesCHeader(name);
    ExportManager.downloadFile(header, filename);
    console.log(`[FileController] Exported tiles to C header: ${filename}`);
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
    const header = ExportManager.generatePaletteCHeader(
      this.paletteModel,
      name,
    );
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
   * Generate all tiles Assembly data
   */
  private generateAllTilesASM(name: string): string {
    const allTiles = this.tileBankModel.getAllTiles();
    const labelName = this.sanitizeName(name);

    let asm = `; Tile bank data: ${name}\n`;
    asm += `; ${allTiles.length} tiles, 8x8 pixels each, 4bpp planar format\n`;
    asm += `; Generated by Semitile\n\n`;
    asm += `.define ${labelName}_count ${allTiles.length}\n\n`;
    asm += `${labelName}:\n`;

    allTiles.forEach((tile, tileIndex) => {
      const data = tile.exportPlanar();
      asm += `    ; Tile ${tileIndex}\n`;

      for (let i = 0; i < 4; i++) {
        asm += `    ; Plane ${i}\n`;
        asm += `    .byte `;
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

    return asm;
  }

  /**
   * Export all tiles to a single Assembly file (.asm)
   */
  exportAllTilesASM(filename: string = "tiles.asm"): void {
    const name = filename.replace(/\.asm$/, "");
    const asm = this.generateAllTilesASM(name);
    ExportManager.downloadFile(asm, filename);
    console.log(`[FileController] Exported tiles to ASM: ${filename}`);
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
    console.log(
      `[FileController] Exported project JSON: ${filename} (${tilesBase64.length} tiles)`,
    );
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
        this.base64ToArray(tileBase64),
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
      console.log(
        `[FileController] Imported project: ${projectData.name} (${tiles.length} tiles)`,
      );
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
          `[FileController] Invalid tile binary size: ${data.length} (expected 32)`,
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
          `[FileController] Invalid palette binary size: ${data.length} (expected 512)`,
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
   * Export active tilemap to binary file (.bin)
   */
  exportTilemapBinary(filename: string = "tilemap.bin"): void {
    if (!this.tilemapBankModel) {
      console.error("[FileController] No tilemap bank model available");
      return;
    }

    const tilemap = this.tilemapBankModel.getActiveTilemap();
    const data = tilemap.exportBinary();
    ExportManager.downloadFile(data, filename);
    console.log(
      `[FileController] Exported tilemap binary: ${filename} (${tilemap.getWidth()}x${tilemap.getHeight()})`,
    );
  }

  /**
   * Generate tilemap C header data
   */
  private generateTilemapCHeader(tilemap: any, name: string): string {
    const variableName = this.sanitizeName(name);
    const width = tilemap.getWidth();
    const height = tilemap.getHeight();
    const data = tilemap.exportBinary();

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

    return header;
  }

  /**
   * Export active tilemap to C header (.h)
   */
  exportTilemapCHeader(filename: string = "tilemap.h"): void {
    if (!this.tilemapBankModel) {
      console.error("[FileController] No tilemap bank model available");
      return;
    }

    const tilemap = this.tilemapBankModel.getActiveTilemap();
    const name = filename.replace(/\.h$/, "");
    const header = this.generateTilemapCHeader(tilemap, name);
    ExportManager.downloadFile(header, filename);
    console.log(`[FileController] Exported tilemap C header: ${filename}`);
  }

  /**
   * Generate tilemap Assembly data
   */
  private generateTilemapASM(tilemap: any, name: string): string {
    const labelName = this.sanitizeName(name);
    const width = tilemap.getWidth();
    const height = tilemap.getHeight();
    const data = tilemap.exportBinary();

    let asm = `; Tilemap data: ${name}\n`;
    asm += `; ${width}x${height} tiles, 2 bytes per entry\n`;
    asm += `; Generated by Semitile\n\n`;
    asm += `.define ${labelName}_width ${width}\n`;
    asm += `.define ${labelName}_height ${height}\n\n`;
    asm += `${labelName}:\n`;

    // Write tilemap entries (16-bit values)
    for (let i = 0; i < data.length; i += 32) {
      asm += "    .word ";
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

    return asm;
  }

  /**
   * Export active tilemap to Assembly file (.asm)
   */
  exportTilemapASM(filename: string = "tilemap.asm"): void {
    if (!this.tilemapBankModel) {
      console.error("[FileController] No tilemap bank model available");
      return;
    }

    const tilemap = this.tilemapBankModel.getActiveTilemap();
    const name = filename.replace(/\.asm$/, "");
    const asm = this.generateTilemapASM(tilemap, name);
    ExportManager.downloadFile(asm, filename);
    console.log(`[FileController] Exported tilemap ASM: ${filename}`);
  }

  /**
   * Export all project data as a compressed zip file
   *
   * Creates a zip containing:
   * - All tiles in a single file (tiles.bin/h/asm)
   * - Palette in a single file (palette.bin/h/asm)
   * - Each tilemap in individual files (tilemap_0.bin/h/asm, tilemap_1.bin/h/asm, etc.)
   *
   * @param format - Export format: 'bin', 'h', or 'asm'
   * @param projectName - Name for the project (used in filenames)
   */
  async exportAllAsZip(
    format: "bin" | "h" | "asm",
    projectName?: string,
  ): Promise<void> {
    const name = projectName || this.currentProjectName;
    const zip = new JSZip();

    // Determine file extension
    const ext = format === "bin" ? "bin" : format === "h" ? "h" : "asm";

    // 1. Export all tiles to a single file
    if (format === "bin") {
      zip.file(`tiles.${ext}`, this.generateAllTilesBinary());
    } else if (format === "h") {
      zip.file(`tiles.${ext}`, this.generateAllTilesCHeader("tiles"));
    } else {
      zip.file(`tiles.${ext}`, this.generateAllTilesASM("tiles"));
    }

    // 2. Export palette
    if (format === "bin") {
      zip.file(
        `palette.${ext}`,
        ExportManager.exportPaletteBinary(this.paletteModel),
      );
    } else if (format === "h") {
      zip.file(
        `palette.${ext}`,
        ExportManager.generatePaletteCHeader(this.paletteModel, "palette"),
      );
    } else {
      zip.file(
        `palette.${ext}`,
        ExportManager.generatePaletteASM(this.paletteModel, "palette"),
      );
    }

    // 3. Export each tilemap as individual files
    if (this.tilemapBankModel) {
      const allTilemaps = this.tilemapBankModel.getAllTilemaps();

      allTilemaps.forEach((tilemap, index) => {
        const tilemapName = `tilemap_${index}`;

        if (format === "bin") {
          zip.file(`${tilemapName}.${ext}`, tilemap.exportBinary());
        } else if (format === "h") {
          zip.file(
            `${tilemapName}.${ext}`,
            this.generateTilemapCHeader(tilemap, tilemapName),
          );
        } else {
          zip.file(
            `${tilemapName}.${ext}`,
            this.generateTilemapASM(tilemap, tilemapName),
          );
        }
      });
    }

    // Generate zip file and download
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}_export.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const tilemapCount = this.tilemapBankModel?.getAllTilemaps().length || 0;
    console.log(
      `[FileController] Exported all project data as ${format.toUpperCase()} in zip: ${name}_export.zip (tiles + palette + ${tilemapCount} tilemaps)`,
    );
  }
}
