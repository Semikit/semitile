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

import { TileModel } from "../models/TileModel.js";
import { PaletteModel } from "../models/PaletteModel.js";
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
 * const fileController = new FileController(tileModel, paletteModel);
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
    private tileModel: TileModel,
    private paletteModel: PaletteModel
  ) {}

  /**
   * Save current project to IndexedDB
   */
  async saveProject(name?: string): Promise<void> {
    const projectName = name || this.currentProjectName;

    // Encode data to base64
    const tilePlanar = this.tileModel.exportPlanar();
    const paletteBinary = this.paletteModel.exportBinary();

    const projectData: ProjectData = {
      name: projectName,
      version: "1.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tile: {
        planar: this.arrayToBase64(tilePlanar),
      },
      palette: {
        binary: this.arrayToBase64(paletteBinary),
      },
    };

    const storage = await getStorage();
    await storage.saveProject(projectData);

    this.currentProjectName = projectName;

    console.log(`[FileController] Project saved: ${projectName}`);
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

    // Decode data from base64
    const tilePlanar = this.base64ToArray(projectData.tile.planar);
    const paletteBinary = this.base64ToArray(projectData.palette.binary);

    // Import into models
    const tileImported = this.tileModel.importPlanar(tilePlanar);
    const paletteImported = this.paletteModel.importBinary(paletteBinary);

    if (!tileImported || !paletteImported) {
      console.error(`[FileController] Failed to import project data`);
      return false;
    }

    this.currentProjectName = name;

    console.log(`[FileController] Project loaded: ${name}`);
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
   * Export tile to binary file (.bin)
   */
  exportTileBinary(filename: string = "tile.bin"): void {
    const data = ExportManager.exportTileBinary(this.tileModel);
    ExportManager.downloadFile(data, filename);
    console.log(`[FileController] Exported tile binary: ${filename}`);
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
   * Export tile to C header (.h)
   */
  exportTileCHeader(filename: string = "tile.h"): void {
    const name = filename.replace(/\.h$/, "");
    const header = ExportManager.generateTileCHeader(this.tileModel, name);
    ExportManager.downloadFile(header, filename);
    console.log(`[FileController] Exported tile C header: ${filename}`);
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
   * Export tile to Assembly file (.asm)
   */
  exportTileASM(filename: string = "tile.asm"): void {
    const name = filename.replace(/\.asm$/, "");
    const asm = ExportManager.generateTileASM(this.tileModel, name);
    ExportManager.downloadFile(asm, filename);
    console.log(`[FileController] Exported tile ASM: ${filename}`);
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

    const projectData: ProjectData = {
      name: projectName,
      version: "1.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tile: {
        planar: this.arrayToBase64(this.tileModel.exportPlanar()),
      },
      palette: {
        binary: this.arrayToBase64(this.paletteModel.exportBinary()),
      },
    };

    const json = JSON.stringify(projectData, null, 2);
    ExportManager.downloadFile(json, filename, "application/json");
    console.log(`[FileController] Exported project JSON: ${filename}`);
  }

  /**
   * Import project from JSON file
   */
  async importProjectJSON(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const projectData: ProjectData = JSON.parse(text);

      // Decode and import data
      const tilePlanar = this.base64ToArray(projectData.tile.planar);
      const paletteBinary = this.base64ToArray(projectData.palette.binary);

      const tileImported = this.tileModel.importPlanar(tilePlanar);
      const paletteImported = this.paletteModel.importBinary(paletteBinary);

      if (!tileImported || !paletteImported) {
        console.error(`[FileController] Failed to import project data`);
        return false;
      }

      this.currentProjectName = projectData.name;
      console.log(`[FileController] Imported project: ${projectData.name}`);
      return true;
    } catch (error) {
      console.error(`[FileController] Failed to import project:`, error);
      return false;
    }
  }

  /**
   * Import tile from binary file (.bin)
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

      const imported = this.tileModel.importPlanar(data);
      if (imported) {
        console.log(`[FileController] Imported tile binary`);
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
}
