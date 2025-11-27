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

/// Represents a color in RGB555 format (5 bits per channel)
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Color {
    r: u8, // 0-31 (5 bits)
    g: u8, // 0-31 (5 bits)
    b: u8, // 0-31 (5 bits)
}

impl Color {
    /// Creates a new color with RGB values clamped to 0-31
    pub fn new(r: u8, g: u8, b: u8) -> Self {
        Self {
            r: r.min(31),
            g: g.min(31),
            b: b.min(31),
        }
    }

    /// Converts the color to RGB555 format (16-bit)
    ///
    /// Format: `RRRRRGGGGGBBBBB`
    /// - Bits 10-14: Red (5 bits)
    /// - Bits 5-9: Green (5 bits)
    /// - Bits 0-4: Blue (5 bits)
    pub fn to_rgb555(&self) -> u16 {
        ((self.r as u16) << 10) | ((self.g as u16) << 5) | (self.b as u16)
    }

    /// Creates a color from RGB555 format (16-bit)
    pub fn from_rgb555(value: u16) -> Self {
        Self {
            r: ((value >> 10) & 0x1F) as u8,
            g: ((value >> 5) & 0x1F) as u8,
            b: (value & 0x1F) as u8,
        }
    }

    /// Converts the color to RGB888 format for display in browser
    ///
    /// Scales 5-bit values (0-31) to 8-bit values (0-255) using proper expansion:
    /// `rgb888 = (rgb555 << 3) | (rgb555 >> 2)`
    ///
    /// Returns: (r, g, b) tuple with 8-bit values
    pub fn to_rgb888(&self) -> (u8, u8, u8) {
        (
            (self.r << 3) | (self.r >> 2),
            (self.g << 3) | (self.g >> 2),
            (self.b << 3) | (self.b >> 2),
        )
    }

    /// Creates a color from RGB888 format (8-bit per channel)
    ///
    /// Converts 8-bit RGB values to 5-bit by discarding the lower 3 bits
    pub fn from_rgb888(r: u8, g: u8, b: u8) -> Self {
        Self {
            r: r >> 3,
            g: g >> 3,
            b: b >> 3,
        }
    }

    /// Returns the individual RGB components (0-31 range)
    pub fn rgb(&self) -> (u8, u8, u8) {
        (self.r, self.g, self.b)
    }
}

impl Default for Color {
    fn default() -> Self {
        Self::new(0, 0, 0)
    }
}

/// Represents the complete palette with 256 colors organized into 16 sub-palettes
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Palette {
    sub_palettes: [[Color; 16]; 16],
}

impl Palette {
    /// Creates a new palette with all colors set to black
    pub fn new() -> Self {
        Self {
            sub_palettes: [[Color::default(); 16]; 16],
        }
    }

    /// Gets a color from the palette
    ///
    /// # Arguments
    /// * `palette_idx` - Sub-palette index (0-15)
    /// * `color_idx` - Color index within sub-palette (0-15)
    ///
    /// Indices are wrapped modulo 16 if out of bounds
    pub fn get_color(&self, palette_idx: u8, color_idx: u8) -> Color {
        self.sub_palettes[palette_idx as usize % 16][color_idx as usize % 16]
    }

    /// Sets a color in the palette
    ///
    /// # Arguments
    /// * `palette_idx` - Sub-palette index (0-15)
    /// * `color_idx` - Color index within sub-palette (0-15)
    /// * `color` - The color to set
    ///
    /// Indices are wrapped modulo 16 if out of bounds
    pub fn set_color(&mut self, palette_idx: u8, color_idx: u8, color: Color) {
        self.sub_palettes[palette_idx as usize % 16][color_idx as usize % 16] = color;
    }

    /// Exports the entire palette as binary data (512 bytes)
    ///
    /// Format: 256 colors × 2 bytes (RGB555, little-endian)
    /// Can be directly loaded into Cicada-16 CRAM (F200-F3FF)
    pub fn export_binary(&self) -> Vec<u8> {
        let mut data = Vec::with_capacity(512);
        for sub_palette in &self.sub_palettes {
            for color in sub_palette {
                let rgb555 = color.to_rgb555();
                data.push((rgb555 & 0xFF) as u8); // Low byte
                data.push(((rgb555 >> 8) & 0xFF) as u8); // High byte
            }
        }
        data
    }

    /// Imports a palette from binary data (512 bytes)
    ///
    /// Returns None if data length is not exactly 512 bytes
    pub fn import_binary(data: &[u8]) -> Option<Self> {
        if data.len() != 512 {
            return None;
        }

        let mut palette = Palette::new();
        for palette_idx in 0..16 {
            for color_idx in 0..16 {
                let offset = (palette_idx * 16 + color_idx) * 2;
                let low = data[offset] as u16;
                let high = data[offset + 1] as u16;
                let rgb555 = (high << 8) | low;
                palette.sub_palettes[palette_idx][color_idx] = Color::from_rgb555(rgb555);
            }
        }

        Some(palette)
    }
}

impl Default for Palette {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_color_new() {
        let color = Color::new(15, 20, 25);
        assert_eq!(color.rgb(), (15, 20, 25));
    }

    #[test]
    fn test_color_new_clamps() {
        let color = Color::new(50, 100, 255);
        assert_eq!(color.rgb(), (31, 31, 31)); // All clamped to max
    }

    #[test]
    fn test_color_rgb555_conversion() {
        let color = Color::new(31, 16, 8);
        let rgb555 = color.to_rgb555();

        // 31 << 10 | 16 << 5 | 8 = 0b11111_10000_01000
        assert_eq!(rgb555, 0b11111_10000_01000);

        let color2 = Color::from_rgb555(rgb555);
        assert_eq!(color, color2);
    }

    #[test]
    fn test_color_rgb555_black() {
        let color = Color::new(0, 0, 0);
        assert_eq!(color.to_rgb555(), 0x0000);

        let color2 = Color::from_rgb555(0x0000);
        assert_eq!(color, color2);
    }

    #[test]
    fn test_color_rgb555_white() {
        let color = Color::new(31, 31, 31);
        assert_eq!(color.to_rgb555(), 0x7FFF);

        let color2 = Color::from_rgb555(0x7FFF);
        assert_eq!(color, color2);
    }

    #[test]
    fn test_color_rgb888_conversion() {
        let color = Color::new(31, 0, 0); // Max red
        let (r, g, b) = color.to_rgb888();

        // 31 << 3 | 31 >> 2 = 248 | 7 = 255
        assert_eq!(r, 255);
        assert_eq!(g, 0);
        assert_eq!(b, 0);
    }

    #[test]
    fn test_color_rgb888_round_trip() {
        // Note: RGB888 -> RGB555 -> RGB888 may not be exact due to precision loss
        let color = Color::from_rgb888(255, 128, 64);
        assert_eq!(color.rgb(), (31, 16, 8)); // 255>>3=31, 128>>3=16, 64>>3=8
    }

    #[test]
    fn test_color_default() {
        let color = Color::default();
        assert_eq!(color.rgb(), (0, 0, 0));
    }

    #[test]
    fn test_palette_new() {
        let palette = Palette::new();

        // All colors should be black by default
        for p in 0..16 {
            for c in 0..16 {
                assert_eq!(palette.get_color(p, c), Color::default());
            }
        }
    }

    #[test]
    fn test_palette_set_and_get() {
        let mut palette = Palette::new();
        let color = Color::new(15, 20, 25);

        palette.set_color(3, 7, color);
        assert_eq!(palette.get_color(3, 7), color);
        assert_eq!(palette.get_color(0, 0), Color::default()); // Others unchanged
    }

    #[test]
    fn test_palette_wrapping() {
        let mut palette = Palette::new();
        let color = Color::new(10, 10, 10);

        // Indices > 15 should wrap
        palette.set_color(18, 20, color); // Wraps to (2, 4)
        assert_eq!(palette.get_color(2, 4), color);
    }

    #[test]
    fn test_palette_binary_export() {
        let mut palette = Palette::new();

        // Set a few colors
        palette.set_color(0, 0, Color::new(31, 31, 31)); // White
        palette.set_color(0, 1, Color::new(31, 0, 0)); // Red
        palette.set_color(1, 0, Color::new(0, 31, 0)); // Green
        palette.set_color(1, 1, Color::new(0, 0, 31)); // Blue

        let binary = palette.export_binary();
        assert_eq!(binary.len(), 512);

        // Check white (0x7FFF) at position 0
        assert_eq!(binary[0], 0xFF); // Low byte
        assert_eq!(binary[1], 0x7F); // High byte

        // Check red (31 << 10 = 0x7C00) at position 1
        assert_eq!(binary[2], 0x00);
        assert_eq!(binary[3], 0x7C);
    }

    #[test]
    fn test_palette_binary_import() {
        let mut palette1 = Palette::new();

        // Set up a pattern
        for p in 0..16 {
            for c in 0..16 {
                let color = Color::new((p + c) as u8, p as u8, c as u8);
                palette1.set_color(p as u8, c as u8, color);
            }
        }

        let binary = palette1.export_binary();
        let palette2 = Palette::import_binary(&binary).unwrap();

        assert_eq!(palette1, palette2);
    }

    #[test]
    fn test_palette_binary_import_wrong_size() {
        let data = vec![0u8; 256]; // Wrong size
        assert!(Palette::import_binary(&data).is_none());

        let data = vec![0u8; 1024]; // Wrong size
        assert!(Palette::import_binary(&data).is_none());
    }

    #[test]
    fn test_palette_binary_round_trip() {
        let palette1 = Palette::new();
        let binary = palette1.export_binary();
        let palette2 = Palette::import_binary(&binary).unwrap();

        assert_eq!(palette1, palette2);
    }

    #[test]
    fn test_color_all_values() {
        // Test all possible 5-bit values for RGB555 conversion
        for r in 0..32 {
            for g in 0..32 {
                for b in 0..32 {
                    let color = Color::new(r, g, b);
                    let rgb555 = color.to_rgb555();
                    let color2 = Color::from_rgb555(rgb555);
                    assert_eq!(
                        color, color2,
                        "Round-trip failed for RGB({}, {}, {})",
                        r, g, b
                    );
                }
            }
        }
    }
}
