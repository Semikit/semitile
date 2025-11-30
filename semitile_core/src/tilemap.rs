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

/// Represents a tilemap entry (16-bit value)
///
/// Format (Cicada-16 Hardware Spec):
/// - Bit 15: Priority (vs. Sprites)
/// - Bit 14: V-Flip
/// - Bit 13: H-Flip
/// - Bits 10-12: Palette index (0-7) - 3 bits
/// - Bit 9: Tile index bit 9
/// - Bit 8: Tile index bit 8
/// - Bits 0-7: Tile index bits 0-7
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TilemapEntry {
    tile_index: u16, // 0-1023 (10 bits)
    h_flip: bool,
    v_flip: bool,
    priority: bool,
    palette_idx: u8, // 0-7 (3 bits)
}

impl TilemapEntry {
    /// Creates a new tilemap entry
    ///
    /// # Arguments
    /// * `tile_index` - Tile index (0-1023), will be clamped to 1023
    /// * `palette_idx` - Palette index (0-7), will be clamped to 7
    /// * `h_flip` - Horizontal flip flag
    /// * `v_flip` - Vertical flip flag
    /// * `priority` - Priority flag (vs. sprites)
    pub fn new(tile_index: u16, palette_idx: u8, h_flip: bool, v_flip: bool, priority: bool) -> Self {
        Self {
            tile_index: tile_index.min(1023),
            h_flip,
            v_flip,
            priority,
            palette_idx: palette_idx.min(7),
        }
    }

    /// Converts the tilemap entry to 16-bit format (little-endian)
    ///
    /// Format per Cicada-16 Hardware Spec:
    /// - Bit 15: Priority
    /// - Bit 14: V-Flip
    /// - Bit 13: H-Flip
    /// - Bits 10-12: Palette index (3 bits)
    /// - Bits 8-9: Tile index bits 8-9
    /// - Bits 0-7: Tile index bits 0-7
    pub fn to_u16(&self) -> u16 {
        let mut value = self.tile_index & 0x3FF; // 10 bits for tile index (bits 0-9)
        value |= (self.palette_idx as u16 & 0x7) << 10; // 3 bits for palette (bits 10-12)
        if self.h_flip {
            value |= 1 << 13;
        }
        if self.v_flip {
            value |= 1 << 14;
        }
        if self.priority {
            value |= 1 << 15;
        }
        value
    }

    /// Creates a tilemap entry from a 16-bit value
    pub fn from_u16(value: u16) -> Self {
        Self {
            tile_index: value & 0x3FF,
            palette_idx: ((value >> 10) & 0x7) as u8,
            h_flip: (value & (1 << 13)) != 0,
            v_flip: (value & (1 << 14)) != 0,
            priority: (value & (1 << 15)) != 0,
        }
    }

    /// Returns the tile index (0-1023)
    pub fn tile_index(&self) -> u16 {
        self.tile_index
    }

    /// Returns the palette index (0-7)
    pub fn palette_idx(&self) -> u8 {
        self.palette_idx
    }

    /// Returns whether the tile is horizontally flipped
    pub fn h_flip(&self) -> bool {
        self.h_flip
    }

    /// Returns whether the tile is vertically flipped
    pub fn v_flip(&self) -> bool {
        self.v_flip
    }

    /// Returns the priority flag
    pub fn priority(&self) -> bool {
        self.priority
    }

    /// Sets the tile index (will be clamped to 0-1023)
    pub fn set_tile_index(&mut self, tile_index: u16) {
        self.tile_index = tile_index.min(1023);
    }

    /// Sets the palette index (will be clamped to 0-7)
    pub fn set_palette_idx(&mut self, palette_idx: u8) {
        self.palette_idx = palette_idx.min(7);
    }

    /// Sets the horizontal flip flag
    pub fn set_h_flip(&mut self, h_flip: bool) {
        self.h_flip = h_flip;
    }

    /// Sets the vertical flip flag
    pub fn set_v_flip(&mut self, v_flip: bool) {
        self.v_flip = v_flip;
    }

    /// Sets the priority flag
    pub fn set_priority(&mut self, priority: bool) {
        self.priority = priority;
    }
}

impl Default for TilemapEntry {
    fn default() -> Self {
        Self {
            tile_index: 0,
            h_flip: false,
            v_flip: false,
            priority: false,
            palette_idx: 0,
        }
    }
}

/// Represents a tilemap with configurable dimensions
///
/// Cicada-16 supports tilemaps up to 256×256 tiles (65536 entries)
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Tilemap {
    width: usize,
    height: usize,
    entries: Vec<TilemapEntry>,
}

impl Tilemap {
    /// Creates a new tilemap with the specified dimensions
    ///
    /// # Arguments
    /// * `width` - Width in tiles (1-256)
    /// * `height` - Height in tiles (1-256)
    ///
    /// All entries are initialized to default (tile 0, palette 0, no flips)
    pub fn new(width: usize, height: usize) -> Self {
        let width = width.clamp(1, 256);
        let height = height.clamp(1, 256);
        let entries = vec![TilemapEntry::default(); width * height];

        Self {
            width,
            height,
            entries,
        }
    }

    /// Returns the width of the tilemap in tiles
    pub fn width(&self) -> usize {
        self.width
    }

    /// Returns the height of the tilemap in tiles
    pub fn height(&self) -> usize {
        self.height
    }

    /// Gets a tilemap entry at the specified coordinates
    ///
    /// Returns None if coordinates are out of bounds
    pub fn get_entry(&self, x: usize, y: usize) -> Option<TilemapEntry> {
        if x < self.width && y < self.height {
            Some(self.entries[y * self.width + x])
        } else {
            None
        }
    }

    /// Sets a tilemap entry at the specified coordinates
    ///
    /// Does nothing if coordinates are out of bounds
    pub fn set_entry(&mut self, x: usize, y: usize, entry: TilemapEntry) {
        if x < self.width && y < self.height {
            self.entries[y * self.width + x] = entry;
        }
    }

    /// Exports the tilemap as binary data (2 bytes per entry, little-endian)
    ///
    /// Returns a Vec of size `width * height * 2` bytes
    pub fn export_binary(&self) -> Vec<u8> {
        let mut data = Vec::with_capacity(self.entries.len() * 2);
        for entry in &self.entries {
            let value = entry.to_u16();
            data.push((value & 0xFF) as u8); // Low byte
            data.push(((value >> 8) & 0xFF) as u8); // High byte
        }
        data
    }

    /// Imports a tilemap from binary data
    ///
    /// # Arguments
    /// * `data` - Binary data (must be exactly `width * height * 2` bytes)
    /// * `width` - Width in tiles (1-256)
    /// * `height` - Height in tiles (1-256)
    ///
    /// Returns None if data length doesn't match dimensions
    pub fn import_binary(data: &[u8], width: usize, height: usize) -> Option<Self> {
        let width = width.clamp(1, 256);
        let height = height.clamp(1, 256);
        let expected_size = width * height * 2;

        if data.len() != expected_size {
            return None;
        }

        let mut entries = Vec::with_capacity(width * height);
        for i in 0..(width * height) {
            let offset = i * 2;
            let low = data[offset] as u16;
            let high = data[offset + 1] as u16;
            let value = (high << 8) | low;
            entries.push(TilemapEntry::from_u16(value));
        }

        Some(Self {
            width,
            height,
            entries,
        })
    }

    /// Resizes the tilemap to new dimensions
    ///
    /// # Arguments
    /// * `new_width` - New width in tiles (1-256)
    /// * `new_height` - New height in tiles (1-256)
    ///
    /// Existing entries are preserved where possible. New entries are initialized to default.
    pub fn resize(&mut self, new_width: usize, new_height: usize) {
        let new_width = new_width.clamp(1, 256);
        let new_height = new_height.clamp(1, 256);

        if new_width == self.width && new_height == self.height {
            return; // No change needed
        }

        let mut new_entries = vec![TilemapEntry::default(); new_width * new_height];

        // Copy existing entries
        let min_width = self.width.min(new_width);
        let min_height = self.height.min(new_height);

        for y in 0..min_height {
            for x in 0..min_width {
                let old_idx = y * self.width + x;
                let new_idx = y * new_width + x;
                new_entries[new_idx] = self.entries[old_idx];
            }
        }

        self.width = new_width;
        self.height = new_height;
        self.entries = new_entries;
    }

    /// Clears the entire tilemap (sets all entries to default)
    pub fn clear(&mut self) {
        for entry in &mut self.entries {
            *entry = TilemapEntry::default();
        }
    }

    /// Fills the entire tilemap with a specific entry
    pub fn fill(&mut self, entry: TilemapEntry) {
        for e in &mut self.entries {
            *e = entry;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tilemap_entry_new() {
        let entry = TilemapEntry::new(100, 5, true, false, false);
        assert_eq!(entry.tile_index(), 100);
        assert_eq!(entry.palette_idx(), 5);
        assert_eq!(entry.h_flip(), true);
        assert_eq!(entry.v_flip(), false);
        assert_eq!(entry.priority(), false);
    }

    #[test]
    fn test_tilemap_entry_new_clamps() {
        let entry = TilemapEntry::new(2000, 20, false, false, false);
        assert_eq!(entry.tile_index(), 1023); // Clamped to max
        assert_eq!(entry.palette_idx(), 7); // Clamped to max (backgrounds use 0-7)
    }

    #[test]
    fn test_tilemap_entry_u16_conversion() {
        let entry = TilemapEntry::new(512, 7, true, true, true);
        let value = entry.to_u16();

        // 512 | (7 << 10) | (1 << 13) | (1 << 14) | (1 << 15)
        // Per Cicada-16 spec: bits 0-9=tile, 10-12=palette, 13=hflip, 14=vflip, 15=priority
        let expected = 512 | (7 << 10) | (1 << 13) | (1 << 14) | (1 << 15);
        assert_eq!(value, expected);

        let entry2 = TilemapEntry::from_u16(value);
        assert_eq!(entry, entry2);
    }

    #[test]
    fn test_tilemap_entry_u16_no_flips() {
        let entry = TilemapEntry::new(123, 3, false, false, false);
        let value = entry.to_u16();

        // 123 | (3 << 10) per Cicada-16 spec
        let expected = 123 | (3 << 10);
        assert_eq!(value, expected);

        let entry2 = TilemapEntry::from_u16(value);
        assert_eq!(entry, entry2);
    }

    #[test]
    fn test_tilemap_entry_default() {
        let entry = TilemapEntry::default();
        assert_eq!(entry.tile_index(), 0);
        assert_eq!(entry.palette_idx(), 0);
        assert_eq!(entry.h_flip(), false);
        assert_eq!(entry.v_flip(), false);
        assert_eq!(entry.priority(), false);
    }

    #[test]
    fn test_tilemap_entry_setters() {
        let mut entry = TilemapEntry::default();

        entry.set_tile_index(456);
        entry.set_palette_idx(6);
        entry.set_h_flip(true);
        entry.set_v_flip(true);
        entry.set_priority(true);

        assert_eq!(entry.tile_index(), 456);
        assert_eq!(entry.palette_idx(), 6);
        assert_eq!(entry.h_flip(), true);
        assert_eq!(entry.v_flip(), true);
        assert_eq!(entry.priority(), true);
    }

    #[test]
    fn test_tilemap_new() {
        let tilemap = Tilemap::new(32, 30);
        assert_eq!(tilemap.width(), 32);
        assert_eq!(tilemap.height(), 30);

        // All entries should be default
        for y in 0..30 {
            for x in 0..32 {
                assert_eq!(tilemap.get_entry(x, y), Some(TilemapEntry::default()));
            }
        }
    }

    #[test]
    fn test_tilemap_dimensions_clamp() {
        let tilemap = Tilemap::new(300, 0);
        assert_eq!(tilemap.width(), 256); // Clamped to max
        assert_eq!(tilemap.height(), 1); // Clamped to min
    }

    #[test]
    fn test_tilemap_set_and_get() {
        let mut tilemap = Tilemap::new(10, 10);
        let entry = TilemapEntry::new(42, 3, true, false, false);

        tilemap.set_entry(5, 7, entry);
        assert_eq!(tilemap.get_entry(5, 7), Some(entry));
        assert_eq!(tilemap.get_entry(0, 0), Some(TilemapEntry::default()));
    }

    #[test]
    fn test_tilemap_out_of_bounds() {
        let mut tilemap = Tilemap::new(10, 10);
        let entry = TilemapEntry::new(100, 5, false, false, false);

        // Out of bounds set should do nothing
        tilemap.set_entry(10, 0, entry);
        tilemap.set_entry(0, 10, entry);
        tilemap.set_entry(20, 20, entry);

        // Out of bounds get should return None
        assert_eq!(tilemap.get_entry(10, 0), None);
        assert_eq!(tilemap.get_entry(0, 10), None);
        assert_eq!(tilemap.get_entry(20, 20), None);
    }

    #[test]
    fn test_tilemap_binary_export() {
        let mut tilemap = Tilemap::new(4, 4);

        tilemap.set_entry(0, 0, TilemapEntry::new(1, 0, false, false, false));
        tilemap.set_entry(1, 0, TilemapEntry::new(2, 1, true, false, false));
        tilemap.set_entry(0, 1, TilemapEntry::new(3, 2, false, true, false));

        let binary = tilemap.export_binary();
        assert_eq!(binary.len(), 4 * 4 * 2); // 32 bytes

        // Check first entry (tile 1, palette 0, no flips, no priority) = 0x0001
        assert_eq!(binary[0], 0x01);
        assert_eq!(binary[1], 0x00);

        // Check second entry (tile 2, palette 1, h_flip)
        // Per Cicada-16 spec: bits 0-9=tile(2), 10-12=pal(1), 13=hflip(1), 14=vflip(0), 15=priority(0)
        let expected = 2 | (1 << 10) | (1 << 13);
        assert_eq!(binary[2], (expected & 0xFF) as u8);
        assert_eq!(binary[3], ((expected >> 8) & 0xFF) as u8);
    }

    #[test]
    fn test_tilemap_binary_import() {
        let mut tilemap1 = Tilemap::new(8, 8);

        // Set up a pattern
        for y in 0..8 {
            for x in 0..8 {
                let entry =
                    TilemapEntry::new((y * 8 + x) as u16, (x % 8) as u8, x % 2 == 0, y % 2 == 0, (x + y) % 2 == 0);
                tilemap1.set_entry(x, y, entry);
            }
        }

        let binary = tilemap1.export_binary();
        let tilemap2 = Tilemap::import_binary(&binary, 8, 8).unwrap();

        assert_eq!(tilemap1, tilemap2);
    }

    #[test]
    fn test_tilemap_binary_import_wrong_size() {
        let data = vec![0u8; 100]; // Wrong size
        assert!(Tilemap::import_binary(&data, 10, 10).is_none());
    }

    #[test]
    fn test_tilemap_resize_grow() {
        let mut tilemap = Tilemap::new(4, 4);
        let entry = TilemapEntry::new(123, 5, true, true, false);
        tilemap.set_entry(2, 2, entry);

        tilemap.resize(8, 8);
        assert_eq!(tilemap.width(), 8);
        assert_eq!(tilemap.height(), 8);

        // Old entry should be preserved
        assert_eq!(tilemap.get_entry(2, 2), Some(entry));

        // New entries should be default
        assert_eq!(tilemap.get_entry(7, 7), Some(TilemapEntry::default()));
    }

    #[test]
    fn test_tilemap_resize_shrink() {
        let mut tilemap = Tilemap::new(10, 10);
        let entry1 = TilemapEntry::new(111, 3, false, false, false);
        let entry2 = TilemapEntry::new(222, 7, true, true, true);

        tilemap.set_entry(2, 2, entry1);
        tilemap.set_entry(8, 8, entry2);

        tilemap.resize(5, 5);
        assert_eq!(tilemap.width(), 5);
        assert_eq!(tilemap.height(), 5);

        // Entry within bounds should be preserved
        assert_eq!(tilemap.get_entry(2, 2), Some(entry1));

        // Entry that was outside new bounds is lost
        assert_eq!(tilemap.get_entry(8, 8), None);
    }

    #[test]
    fn test_tilemap_clear() {
        let mut tilemap = Tilemap::new(4, 4);
        let entry = TilemapEntry::new(100, 5, true, true, false);

        tilemap.fill(entry);
        assert_eq!(tilemap.get_entry(0, 0), Some(entry));
        assert_eq!(tilemap.get_entry(3, 3), Some(entry));

        tilemap.clear();
        assert_eq!(tilemap.get_entry(0, 0), Some(TilemapEntry::default()));
        assert_eq!(tilemap.get_entry(3, 3), Some(TilemapEntry::default()));
    }

    #[test]
    fn test_tilemap_fill() {
        let mut tilemap = Tilemap::new(5, 5);
        let entry = TilemapEntry::new(42, 7, false, true, true);

        tilemap.fill(entry);

        for y in 0..5 {
            for x in 0..5 {
                assert_eq!(tilemap.get_entry(x, y), Some(entry));
            }
        }
    }

    #[test]
    fn test_tilemap_entry_all_combinations() {
        // Test all flip combinations with various tile and palette values
        for priority in [false, true] {
            for h_flip in [false, true] {
                for v_flip in [false, true] {
                    for tile_idx in [0, 511, 1023] {
                        for pal_idx in [0, 3, 7] {
                            let entry = TilemapEntry::new(tile_idx, pal_idx, h_flip, v_flip, priority);
                            let value = entry.to_u16();
                            let entry2 = TilemapEntry::from_u16(value);
                            assert_eq!(
                                entry, entry2,
                                "Round-trip failed for tile={}, pal={}, h_flip={}, v_flip={}, priority={}",
                                tile_idx, pal_idx, h_flip, v_flip, priority
                            );
                        }
                    }
                }
            }
        }
    }
}
