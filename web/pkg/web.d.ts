/* tslint:disable */
/* eslint-disable */
/**
 * Initialize panic hook for better error messages in browser console
 */
export function init_panic_hook(): void;
export class WasmColor {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Creates a new color with RGB values (0-31 for 5-bit color)
   *
   * Values are automatically clamped to 0-31 range
   */
  constructor(r: number, g: number, b: number);
  /**
   * Creates a color from RGB888 format (8-bit per channel)
   *
   * Converts 8-bit RGB values to 5-bit by discarding the lower 3 bits
   */
  static fromRgb888(r: number, g: number, b: number): WasmColor;
  /**
   * Converts the color to RGB888 format for display in browser
   *
   * Returns an array [r, g, b] with 8-bit values (0-255)
   */
  toRgb888(): Uint8Array;
  /**
   * Creates a color from RGB555 format (16-bit)
   */
  static fromRgb555(value: number): WasmColor;
  /**
   * Converts the color to RGB555 format (16-bit)
   */
  toRgb555(): number;
  /**
   * Returns the individual RGB components (0-31 range)
   *
   * Returns an array [r, g, b]
   */
  rgb(): Uint8Array;
}
export class WasmPalette {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Creates a new palette with all colors set to black
   */
  constructor();
  /**
   * Gets a color from the palette
   *
   * # Arguments
   * * `palette_idx` - Sub-palette index (0-15)
   * * `color_idx` - Color index within sub-palette (0-15)
   *
   * Indices are wrapped modulo 16 if out of bounds
   */
  getColor(palette_idx: number, color_idx: number): WasmColor;
  /**
   * Sets a color in the palette
   *
   * # Arguments
   * * `palette_idx` - Sub-palette index (0-15)
   * * `color_idx` - Color index within sub-palette (0-15)
   * * `color` - The color to set
   *
   * Indices are wrapped modulo 16 if out of bounds
   */
  setColor(palette_idx: number, color_idx: number, color: WasmColor): void;
  /**
   * Exports the entire palette as binary data (512 bytes)
   *
   * Format: 256 colors × 2 bytes (RGB555, little-endian)
   * Can be directly loaded into Cicada-16 CRAM (F200-F3FF)
   */
  exportBinary(): Uint8Array;
  /**
   * Imports a palette from binary data (512 bytes)
   *
   * Returns null if data length is not exactly 512 bytes
   */
  static importBinary(data: Uint8Array): WasmPalette | undefined;
}
export class WasmTile {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Creates a new empty tile (all pixels set to color index 0)
   */
  constructor();
  /**
   * Sets a pixel at the given coordinates to the specified color index (0-15)
   *
   * If coordinates are out of bounds (>= 8) or color > 15, the operation is ignored
   */
  setPixel(x: number, y: number, color: number): void;
  /**
   * Gets the color index of a pixel at the given coordinates
   *
   * Returns 0 if coordinates are out of bounds
   */
  getPixel(x: number, y: number): number;
  /**
   * Converts the tile to 4bpp planar format (32 bytes)
   *
   * Returns a Uint8Array that can be used in JavaScript
   */
  toPlanar(): Uint8Array;
  /**
   * Creates a tile from 4bpp planar format data (32 bytes)
   *
   * Returns null if data length is not exactly 32 bytes
   */
  static fromPlanar(data: Uint8Array): WasmTile | undefined;
}
export class WasmTilemap {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Creates a new tilemap with the specified dimensions
   *
   * # Arguments
   * * `width` - Width in tiles (1-256)
   * * `height` - Height in tiles (1-256)
   *
   * All entries are initialized to default (tile 0, palette 0, no flips)
   */
  constructor(width: number, height: number);
  /**
   * Returns the width of the tilemap in tiles
   */
  width(): number;
  /**
   * Returns the height of the tilemap in tiles
   */
  height(): number;
  /**
   * Gets a tilemap entry at the specified coordinates
   *
   * Returns null if coordinates are out of bounds
   */
  getEntry(x: number, y: number): WasmTilemapEntry | undefined;
  /**
   * Sets a tilemap entry at the specified coordinates
   *
   * Does nothing if coordinates are out of bounds
   */
  setEntry(x: number, y: number, entry: WasmTilemapEntry): void;
  /**
   * Exports the tilemap as binary data (2 bytes per entry, little-endian)
   *
   * Returns a Vec of size `width * height * 2` bytes
   */
  exportBinary(): Uint8Array;
  /**
   * Imports a tilemap from binary data
   *
   * # Arguments
   * * `data` - Binary data (must be exactly `width * height * 2` bytes)
   * * `width` - Width in tiles (1-256)
   * * `height` - Height in tiles (1-256)
   *
   * Returns null if data length doesn't match dimensions
   */
  static importBinary(data: Uint8Array, width: number, height: number): WasmTilemap | undefined;
  /**
   * Resizes the tilemap to new dimensions
   *
   * # Arguments
   * * `new_width` - New width in tiles (1-256)
   * * `new_height` - New height in tiles (1-256)
   *
   * Existing entries are preserved where possible. New entries are initialized to default.
   */
  resize(new_width: number, new_height: number): void;
  /**
   * Clears the entire tilemap (sets all entries to default)
   */
  clear(): void;
  /**
   * Fills the entire tilemap with a specific entry
   */
  fill(entry: WasmTilemapEntry): void;
}
export class WasmTilemapEntry {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Creates a new tilemap entry
   *
   * # Arguments
   * * `tile_index` - Tile index (0-1023), will be clamped to 1023
   * * `palette_idx` - Palette index (0-7), will be clamped to 7 (backgrounds use palettes 0-7)
   * * `h_flip` - Horizontal flip flag
   * * `v_flip` - Vertical flip flag
   * * `priority` - Priority flag (vs. sprites)
   */
  constructor(tile_index: number, palette_idx: number, h_flip: boolean, v_flip: boolean, priority: boolean);
  /**
   * Converts the tilemap entry to 16-bit format (little-endian)
   */
  toU16(): number;
  /**
   * Creates a tilemap entry from a 16-bit value
   */
  static fromU16(value: number): WasmTilemapEntry;
  /**
   * Returns the tile index (0-1023)
   */
  tileIndex(): number;
  /**
   * Returns the palette index (0-7)
   */
  paletteIdx(): number;
  /**
   * Returns whether the tile is horizontally flipped
   */
  hFlip(): boolean;
  /**
   * Returns whether the tile is vertically flipped
   */
  vFlip(): boolean;
  /**
   * Returns the priority flag
   */
  priority(): boolean;
  /**
   * Sets the tile index (will be clamped to 0-1023)
   */
  setTileIndex(tile_index: number): void;
  /**
   * Sets the palette index (will be clamped to 0-7)
   */
  setPaletteIdx(palette_idx: number): void;
  /**
   * Sets the horizontal flip flag
   */
  setHFlip(h_flip: boolean): void;
  /**
   * Sets the vertical flip flag
   */
  setVFlip(v_flip: boolean): void;
  /**
   * Sets the priority flag
   */
  setPriority(priority: boolean): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmtile_free: (a: number, b: number) => void;
  readonly wasmtile_new: () => number;
  readonly wasmtile_setPixel: (a: number, b: number, c: number, d: number) => void;
  readonly wasmtile_getPixel: (a: number, b: number, c: number) => number;
  readonly wasmtile_toPlanar: (a: number) => [number, number];
  readonly wasmtile_fromPlanar: (a: number, b: number) => number;
  readonly __wbg_wasmcolor_free: (a: number, b: number) => void;
  readonly wasmcolor_new: (a: number, b: number, c: number) => number;
  readonly wasmcolor_fromRgb888: (a: number, b: number, c: number) => number;
  readonly wasmcolor_toRgb888: (a: number) => [number, number];
  readonly wasmcolor_fromRgb555: (a: number) => number;
  readonly wasmcolor_toRgb555: (a: number) => number;
  readonly wasmcolor_rgb: (a: number) => [number, number];
  readonly __wbg_wasmpalette_free: (a: number, b: number) => void;
  readonly wasmpalette_new: () => number;
  readonly wasmpalette_getColor: (a: number, b: number, c: number) => number;
  readonly wasmpalette_setColor: (a: number, b: number, c: number, d: number) => void;
  readonly wasmpalette_exportBinary: (a: number) => [number, number];
  readonly wasmpalette_importBinary: (a: number, b: number) => number;
  readonly __wbg_wasmtilemapentry_free: (a: number, b: number) => void;
  readonly wasmtilemapentry_new: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly wasmtilemapentry_toU16: (a: number) => number;
  readonly wasmtilemapentry_fromU16: (a: number) => number;
  readonly wasmtilemapentry_tileIndex: (a: number) => number;
  readonly wasmtilemapentry_paletteIdx: (a: number) => number;
  readonly wasmtilemapentry_hFlip: (a: number) => number;
  readonly wasmtilemapentry_vFlip: (a: number) => number;
  readonly wasmtilemapentry_priority: (a: number) => number;
  readonly wasmtilemapentry_setTileIndex: (a: number, b: number) => void;
  readonly wasmtilemapentry_setPaletteIdx: (a: number, b: number) => void;
  readonly wasmtilemapentry_setHFlip: (a: number, b: number) => void;
  readonly wasmtilemapentry_setVFlip: (a: number, b: number) => void;
  readonly wasmtilemapentry_setPriority: (a: number, b: number) => void;
  readonly __wbg_wasmtilemap_free: (a: number, b: number) => void;
  readonly wasmtilemap_new: (a: number, b: number) => number;
  readonly wasmtilemap_width: (a: number) => number;
  readonly wasmtilemap_height: (a: number) => number;
  readonly wasmtilemap_getEntry: (a: number, b: number, c: number) => number;
  readonly wasmtilemap_setEntry: (a: number, b: number, c: number, d: number) => void;
  readonly wasmtilemap_exportBinary: (a: number) => [number, number];
  readonly wasmtilemap_importBinary: (a: number, b: number, c: number, d: number) => number;
  readonly wasmtilemap_resize: (a: number, b: number, c: number) => void;
  readonly wasmtilemap_clear: (a: number) => void;
  readonly wasmtilemap_fill: (a: number, b: number) => void;
  readonly init_panic_hook: () => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
