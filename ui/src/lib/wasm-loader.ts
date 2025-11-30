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

import init, {
  WasmTile,
  WasmColor,
  WasmPalette,
  WasmTilemapEntry,
  WasmTilemap,
} from '../../../web/pkg/web.js';

// Re-export classes for use in Models and Views
export { WasmTile, WasmColor, WasmPalette, WasmTilemapEntry, WasmTilemap };

/**
 * WASM module state
 */
let wasmInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the WASM module
 *
 * This function can be called multiple times safely - it will only
 * initialize once and return the same promise for concurrent calls.
 *
 * @returns Promise that resolves when WASM is ready
 */
export async function initWasm(): Promise<void> {
  // If already initialized, return immediately
  if (wasmInitialized) {
    return;
  }

  // If initialization is in progress, return the existing promise
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      // Initialize the WASM module
      // In development, Vite serves from /web/pkg/
      // In production, this will be bundled appropriately
      await init();
      wasmInitialized = true;
      console.log('[WASM] Module initialized successfully');
    } catch (error) {
      console.error('[WASM] Failed to initialize module:', error);
      throw new Error(
        `Failed to load WASM module: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  })();

  return initPromise;
}

/**
 * Check if WASM is initialized
 */
export function isWasmInitialized(): boolean {
  return wasmInitialized;
}

/**
 * Ensure WASM is initialized before proceeding
 *
 * Throws an error if WASM is not initialized.
 * Use this in Model constructors to ensure WASM is ready.
 */
export function ensureWasmInitialized(): void {
  if (!wasmInitialized) {
    throw new Error(
      'WASM module not initialized. Call initWasm() before using Models.'
    );
  }
}
