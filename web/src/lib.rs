// Copyright (C) 2025 Connor Nolan connor@cnolandev.com
//
// This file is part of the Semikit project.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

use wasm_bindgen::prelude::*;
use semitile_core::{Tile, Color, Palette, Tilemap, TilemapEntry};

/// Initialize panic hook for better error messages in browser console
#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

//=============================================================================
// Tile WASM Bindings
//=============================================================================

#[wasm_bindgen]
pub struct WasmTile {
    inner: Tile,
}

#[wasm_bindgen]
impl WasmTile {
    /// Creates a new empty tile (all pixels set to color index 0)
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: Tile::new(),
        }
    }

    /// Sets a pixel at the given coordinates to the specified color index (0-15)
    ///
    /// If coordinates are out of bounds (>= 8) or color > 15, the operation is ignored
    #[wasm_bindgen(js_name = setPixel)]
    pub fn set_pixel(&mut self, x: usize, y: usize, color: u8) {
        self.inner.set_pixel(x, y, color);
    }

    /// Gets the color index of a pixel at the given coordinates
    ///
    /// Returns 0 if coordinates are out of bounds
    #[wasm_bindgen(js_name = getPixel)]
    pub fn get_pixel(&self, x: usize, y: usize) -> u8 {
        self.inner.get_pixel(x, y)
    }

    /// Converts the tile to 4bpp planar format (32 bytes)
    ///
    /// Returns a Uint8Array that can be used in JavaScript
    #[wasm_bindgen(js_name = toPlanar)]
    pub fn to_planar(&self) -> Vec<u8> {
        self.inner.to_planar().to_vec()
    }

    /// Creates a tile from 4bpp planar format data (32 bytes)
    ///
    /// Returns null if data length is not exactly 32 bytes
    #[wasm_bindgen(js_name = fromPlanar)]
    pub fn from_planar(data: &[u8]) -> Option<WasmTile> {
        if data.len() != 32 {
            return None;
        }
        let arr: [u8; 32] = data.try_into().ok()?;
        Some(Self {
            inner: Tile::from_planar(&arr),
        })
    }
}

//=============================================================================
// Color WASM Bindings
//=============================================================================

#[wasm_bindgen]
pub struct WasmColor {
    inner: Color,
}

#[wasm_bindgen]
impl WasmColor {
    /// Creates a new color with RGB values (0-31 for 5-bit color)
    ///
    /// Values are automatically clamped to 0-31 range
    #[wasm_bindgen(constructor)]
    pub fn new(r: u8, g: u8, b: u8) -> Self {
        Self {
            inner: Color::new(r, g, b),
        }
    }

    /// Creates a color from RGB888 format (8-bit per channel)
    ///
    /// Converts 8-bit RGB values to 5-bit by discarding the lower 3 bits
    #[wasm_bindgen(js_name = fromRgb888)]
    pub fn from_rgb888(r: u8, g: u8, b: u8) -> Self {
        Self {
            inner: Color::from_rgb888(r, g, b),
        }
    }

    /// Converts the color to RGB888 format for display in browser
    ///
    /// Returns an array [r, g, b] with 8-bit values (0-255)
    #[wasm_bindgen(js_name = toRgb888)]
    pub fn to_rgb888(&self) -> Vec<u8> {
        let (r, g, b) = self.inner.to_rgb888();
        vec![r, g, b]
    }

    /// Creates a color from RGB555 format (16-bit)
    #[wasm_bindgen(js_name = fromRgb555)]
    pub fn from_rgb555(value: u16) -> Self {
        Self {
            inner: Color::from_rgb555(value),
        }
    }

    /// Converts the color to RGB555 format (16-bit)
    #[wasm_bindgen(js_name = toRgb555)]
    pub fn to_rgb555(&self) -> u16 {
        self.inner.to_rgb555()
    }

    /// Returns the individual RGB components (0-31 range)
    ///
    /// Returns an array [r, g, b]
    pub fn rgb(&self) -> Vec<u8> {
        let (r, g, b) = self.inner.rgb();
        vec![r, g, b]
    }
}

//=============================================================================
// Palette WASM Bindings
//=============================================================================

#[wasm_bindgen]
pub struct WasmPalette {
    inner: Palette,
}

#[wasm_bindgen]
impl WasmPalette {
    /// Creates a new palette with all colors set to black
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: Palette::new(),
        }
    }

    /// Gets a color from the palette
    ///
    /// # Arguments
    /// * `palette_idx` - Sub-palette index (0-15)
    /// * `color_idx` - Color index within sub-palette (0-15)
    ///
    /// Indices are wrapped modulo 16 if out of bounds
    #[wasm_bindgen(js_name = getColor)]
    pub fn get_color(&self, palette_idx: u8, color_idx: u8) -> WasmColor {
        WasmColor {
            inner: self.inner.get_color(palette_idx, color_idx),
        }
    }

    /// Sets a color in the palette
    ///
    /// # Arguments
    /// * `palette_idx` - Sub-palette index (0-15)
    /// * `color_idx` - Color index within sub-palette (0-15)
    /// * `color` - The color to set
    ///
    /// Indices are wrapped modulo 16 if out of bounds
    #[wasm_bindgen(js_name = setColor)]
    pub fn set_color(&mut self, palette_idx: u8, color_idx: u8, color: &WasmColor) {
        self.inner.set_color(palette_idx, color_idx, color.inner);
    }

    /// Exports the entire palette as binary data (512 bytes)
    ///
    /// Format: 256 colors × 2 bytes (RGB555, little-endian)
    /// Can be directly loaded into Cicada-16 CRAM (F200-F3FF)
    #[wasm_bindgen(js_name = exportBinary)]
    pub fn export_binary(&self) -> Vec<u8> {
        self.inner.export_binary()
    }

    /// Imports a palette from binary data (512 bytes)
    ///
    /// Returns null if data length is not exactly 512 bytes
    #[wasm_bindgen(js_name = importBinary)]
    pub fn import_binary(data: &[u8]) -> Option<WasmPalette> {
        Palette::import_binary(data).map(|inner| Self { inner })
    }
}

//=============================================================================
// TilemapEntry WASM Bindings
//=============================================================================

#[wasm_bindgen]
pub struct WasmTilemapEntry {
    inner: TilemapEntry,
}

#[wasm_bindgen]
impl WasmTilemapEntry {
    /// Creates a new tilemap entry
    ///
    /// # Arguments
    /// * `tile_index` - Tile index (0-1023), will be clamped to 1023
    /// * `palette_idx` - Palette index (0-15), will be clamped to 15
    /// * `h_flip` - Horizontal flip flag
    /// * `v_flip` - Vertical flip flag
    #[wasm_bindgen(constructor)]
    pub fn new(tile_index: u16, palette_idx: u8, h_flip: bool, v_flip: bool) -> Self {
        Self {
            inner: TilemapEntry::new(tile_index, palette_idx, h_flip, v_flip),
        }
    }

    /// Converts the tilemap entry to 16-bit format (little-endian)
    #[wasm_bindgen(js_name = toU16)]
    pub fn to_u16(&self) -> u16 {
        self.inner.to_u16()
    }

    /// Creates a tilemap entry from a 16-bit value
    #[wasm_bindgen(js_name = fromU16)]
    pub fn from_u16(value: u16) -> Self {
        Self {
            inner: TilemapEntry::from_u16(value),
        }
    }

    /// Returns the tile index (0-1023)
    #[wasm_bindgen(js_name = tileIndex)]
    pub fn tile_index(&self) -> u16 {
        self.inner.tile_index()
    }

    /// Returns the palette index (0-15)
    #[wasm_bindgen(js_name = paletteIdx)]
    pub fn palette_idx(&self) -> u8 {
        self.inner.palette_idx()
    }

    /// Returns whether the tile is horizontally flipped
    #[wasm_bindgen(js_name = hFlip)]
    pub fn h_flip(&self) -> bool {
        self.inner.h_flip()
    }

    /// Returns whether the tile is vertically flipped
    #[wasm_bindgen(js_name = vFlip)]
    pub fn v_flip(&self) -> bool {
        self.inner.v_flip()
    }

    /// Sets the tile index (will be clamped to 0-1023)
    #[wasm_bindgen(js_name = setTileIndex)]
    pub fn set_tile_index(&mut self, tile_index: u16) {
        self.inner.set_tile_index(tile_index);
    }

    /// Sets the palette index (will be clamped to 0-15)
    #[wasm_bindgen(js_name = setPaletteIdx)]
    pub fn set_palette_idx(&mut self, palette_idx: u8) {
        self.inner.set_palette_idx(palette_idx);
    }

    /// Sets the horizontal flip flag
    #[wasm_bindgen(js_name = setHFlip)]
    pub fn set_h_flip(&mut self, h_flip: bool) {
        self.inner.set_h_flip(h_flip);
    }

    /// Sets the vertical flip flag
    #[wasm_bindgen(js_name = setVFlip)]
    pub fn set_v_flip(&mut self, v_flip: bool) {
        self.inner.set_v_flip(v_flip);
    }
}

//=============================================================================
// Tilemap WASM Bindings
//=============================================================================

#[wasm_bindgen]
pub struct WasmTilemap {
    inner: Tilemap,
}

#[wasm_bindgen]
impl WasmTilemap {
    /// Creates a new tilemap with the specified dimensions
    ///
    /// # Arguments
    /// * `width` - Width in tiles (1-256)
    /// * `height` - Height in tiles (1-256)
    ///
    /// All entries are initialized to default (tile 0, palette 0, no flips)
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize) -> Self {
        Self {
            inner: Tilemap::new(width, height),
        }
    }

    /// Returns the width of the tilemap in tiles
    pub fn width(&self) -> usize {
        self.inner.width()
    }

    /// Returns the height of the tilemap in tiles
    pub fn height(&self) -> usize {
        self.inner.height()
    }

    /// Gets a tilemap entry at the specified coordinates
    ///
    /// Returns null if coordinates are out of bounds
    #[wasm_bindgen(js_name = getEntry)]
    pub fn get_entry(&self, x: usize, y: usize) -> Option<WasmTilemapEntry> {
        self.inner.get_entry(x, y).map(|entry| WasmTilemapEntry { inner: entry })
    }

    /// Sets a tilemap entry at the specified coordinates
    ///
    /// Does nothing if coordinates are out of bounds
    #[wasm_bindgen(js_name = setEntry)]
    pub fn set_entry(&mut self, x: usize, y: usize, entry: &WasmTilemapEntry) {
        self.inner.set_entry(x, y, entry.inner);
    }

    /// Exports the tilemap as binary data (2 bytes per entry, little-endian)
    ///
    /// Returns a Vec of size `width * height * 2` bytes
    #[wasm_bindgen(js_name = exportBinary)]
    pub fn export_binary(&self) -> Vec<u8> {
        self.inner.export_binary()
    }

    /// Imports a tilemap from binary data
    ///
    /// # Arguments
    /// * `data` - Binary data (must be exactly `width * height * 2` bytes)
    /// * `width` - Width in tiles (1-256)
    /// * `height` - Height in tiles (1-256)
    ///
    /// Returns null if data length doesn't match dimensions
    #[wasm_bindgen(js_name = importBinary)]
    pub fn import_binary(data: &[u8], width: usize, height: usize) -> Option<WasmTilemap> {
        Tilemap::import_binary(data, width, height).map(|inner| Self { inner })
    }

    /// Resizes the tilemap to new dimensions
    ///
    /// # Arguments
    /// * `new_width` - New width in tiles (1-256)
    /// * `new_height` - New height in tiles (1-256)
    ///
    /// Existing entries are preserved where possible. New entries are initialized to default.
    pub fn resize(&mut self, new_width: usize, new_height: usize) {
        self.inner.resize(new_width, new_height);
    }

    /// Clears the entire tilemap (sets all entries to default)
    pub fn clear(&mut self) {
        self.inner.clear();
    }

    /// Fills the entire tilemap with a specific entry
    pub fn fill(&mut self, entry: &WasmTilemapEntry) {
        self.inner.fill(entry.inner);
    }
}
