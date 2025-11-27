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

/// Represents an 8×8 tile with 4-bit color indices (0-15)
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Tile {
    pixels: [[u8; 8]; 8],
}

impl Tile {
    /// Creates a new tile with all pixels set to color index 0
    pub fn new() -> Self {
        Self {
            pixels: [[0; 8]; 8],
        }
    }

    /// Sets a pixel at the given coordinates to the specified color index (0-15)
    ///
    /// # Arguments
    /// * `x` - X coordinate (0-7)
    /// * `y` - Y coordinate (0-7)
    /// * `color` - Color index (0-15)
    ///
    /// If coordinates are out of bounds or color > 15, the operation is ignored
    pub fn set_pixel(&mut self, x: usize, y: usize, color: u8) {
        if x < 8 && y < 8 && color < 16 {
            self.pixels[y][x] = color;
        }
    }

    /// Gets the color index of a pixel at the given coordinates
    ///
    /// # Arguments
    /// * `x` - X coordinate (0-7)
    /// * `y` - Y coordinate (0-7)
    ///
    /// Returns 0 if coordinates are out of bounds
    pub fn get_pixel(&self, x: usize, y: usize) -> u8 {
        if x < 8 && y < 8 { self.pixels[y][x] } else { 0 }
    }

    /// Converts the tile to 4bpp planar format (32 bytes)
    ///
    /// The planar format organizes data into four 8-byte bit planes:
    /// - Bytes 0-7: Bit Plane 0 (LSB of color index)
    /// - Bytes 8-15: Bit Plane 1
    /// - Bytes 16-23: Bit Plane 2
    /// - Bytes 24-31: Bit Plane 3 (MSB of color index)
    ///
    /// Within each plane, each byte represents one row of 8 pixels,
    /// with bit 7 being the leftmost pixel (MSB first)
    pub fn to_planar(&self) -> [u8; 32] {
        let mut planar = [0u8; 32];

        for y in 0..8 {
            for x in 0..8 {
                let color = self.pixels[y][x];
                let bit_pos = 7 - x; // MSB first (bit 7 = leftmost pixel)

                // Distribute each bit of the 4-bit color across the four planes
                if color & 0b0001 != 0 {
                    planar[y] |= 1 << bit_pos; // Plane 0
                }
                if color & 0b0010 != 0 {
                    planar[8 + y] |= 1 << bit_pos; // Plane 1
                }
                if color & 0b0100 != 0 {
                    planar[16 + y] |= 1 << bit_pos; // Plane 2
                }
                if color & 0b1000 != 0 {
                    planar[24 + y] |= 1 << bit_pos; // Plane 3
                }
            }
        }

        planar
    }

    /// Creates a tile from 4bpp planar format data (32 bytes)
    ///
    /// See `to_planar()` for format description
    pub fn from_planar(data: &[u8; 32]) -> Self {
        let mut tile = Tile::new();

        for y in 0..8 {
            for x in 0..8 {
                let bit_pos = 7 - x;
                let mut color = 0u8;

                // Reconstruct 4-bit color from the four planes
                if data[y] & (1 << bit_pos) != 0 {
                    color |= 0b0001;
                }
                if data[8 + y] & (1 << bit_pos) != 0 {
                    color |= 0b0010;
                }
                if data[16 + y] & (1 << bit_pos) != 0 {
                    color |= 0b0100;
                }
                if data[24 + y] & (1 << bit_pos) != 0 {
                    color |= 0b1000;
                }

                tile.pixels[y][x] = color;
            }
        }

        tile
    }
}

impl Default for Tile {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_tile_is_empty() {
        let tile = Tile::new();
        for y in 0..8 {
            for x in 0..8 {
                assert_eq!(tile.get_pixel(x, y), 0);
            }
        }
    }

    #[test]
    fn test_set_and_get_pixel() {
        let mut tile = Tile::new();
        tile.set_pixel(3, 4, 7);
        assert_eq!(tile.get_pixel(3, 4), 7);
        assert_eq!(tile.get_pixel(0, 0), 0);
    }

    #[test]
    fn test_set_pixel_bounds_checking() {
        let mut tile = Tile::new();

        // Out of bounds - should be ignored
        tile.set_pixel(8, 0, 5);
        tile.set_pixel(0, 8, 5);
        tile.set_pixel(10, 10, 5);

        // Color too large - should be ignored
        tile.set_pixel(0, 0, 16);
        assert_eq!(tile.get_pixel(0, 0), 0);
    }

    #[test]
    fn test_get_pixel_out_of_bounds() {
        let tile = Tile::new();
        assert_eq!(tile.get_pixel(8, 0), 0);
        assert_eq!(tile.get_pixel(0, 8), 0);
        assert_eq!(tile.get_pixel(100, 100), 0);
    }

    #[test]
    fn test_planar_conversion_empty_tile() {
        let tile = Tile::new();
        let planar = tile.to_planar();

        // All bytes should be 0 for an empty tile
        for byte in planar.iter() {
            assert_eq!(*byte, 0);
        }

        // Round-trip conversion
        let tile2 = Tile::from_planar(&planar);
        assert_eq!(tile, tile2);
    }

    #[test]
    fn test_planar_conversion_single_pixel() {
        let mut tile = Tile::new();
        tile.set_pixel(0, 0, 0b1111); // Color 15 at top-left

        let planar = tile.to_planar();

        // Top-left pixel (bit 7) should be set in all four planes
        assert_eq!(planar[0], 0b10000000); // Plane 0, row 0
        assert_eq!(planar[8], 0b10000000); // Plane 1, row 0
        assert_eq!(planar[16], 0b10000000); // Plane 2, row 0
        assert_eq!(planar[24], 0b10000000); // Plane 3, row 0

        // Round-trip conversion
        let tile2 = Tile::from_planar(&planar);
        assert_eq!(tile, tile2);
    }

    #[test]
    fn test_planar_conversion_single_pixel_color_5() {
        let mut tile = Tile::new();
        tile.set_pixel(7, 0, 0b0101); // Color 5 at top-right

        let planar = tile.to_planar();

        // Top-right pixel (bit 0) should be set in planes 0 and 2 only
        // Color 5 = 0b0101 = planes 0 and 2
        assert_eq!(planar[0], 0b00000001); // Plane 0, row 0
        assert_eq!(planar[8], 0b00000000); // Plane 1, row 0
        assert_eq!(planar[16], 0b00000001); // Plane 2, row 0
        assert_eq!(planar[24], 0b00000000); // Plane 3, row 0

        // Round-trip conversion
        let tile2 = Tile::from_planar(&planar);
        assert_eq!(tile, tile2);
    }

    #[test]
    fn test_planar_conversion_full_row() {
        let mut tile = Tile::new();
        // Set first row to alternating colors
        for x in 0..8 {
            tile.set_pixel(x, 0, (x % 2) as u8);
        }

        let planar = tile.to_planar();

        // First row should be 0b01010101 in plane 0, 0 in others
        assert_eq!(planar[0], 0b01010101);
        assert_eq!(planar[8], 0b00000000);
        assert_eq!(planar[16], 0b00000000);
        assert_eq!(planar[24], 0b00000000);

        // Round-trip conversion
        let tile2 = Tile::from_planar(&planar);
        assert_eq!(tile, tile2);
    }

    #[test]
    fn test_planar_conversion_complex_pattern() {
        let mut tile = Tile::new();

        // Create a checkerboard pattern with different colors
        for y in 0..8 {
            for x in 0..8 {
                let color = ((x + y) % 16) as u8;
                tile.set_pixel(x, y, color);
            }
        }

        let planar = tile.to_planar();

        // Round-trip conversion should preserve all pixels
        let tile2 = Tile::from_planar(&planar);
        assert_eq!(tile, tile2);

        // Verify specific pixels
        for y in 0..8 {
            for x in 0..8 {
                assert_eq!(
                    tile2.get_pixel(x, y),
                    ((x + y) % 16) as u8,
                    "Mismatch at ({}, {})",
                    x,
                    y
                );
            }
        }
    }

    #[test]
    fn test_planar_all_colors() {
        // Test all 16 colors to ensure bit manipulation is correct
        for color in 0..16 {
            let mut tile = Tile::new();
            tile.set_pixel(3, 3, color);

            let planar = tile.to_planar();
            let tile2 = Tile::from_planar(&planar);

            assert_eq!(
                tile2.get_pixel(3, 3),
                color,
                "Round-trip failed for color {}",
                color
            );
        }
    }
}
