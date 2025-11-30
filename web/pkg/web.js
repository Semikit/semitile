let wasm;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}
/**
 * Initialize panic hook for better error messages in browser console
 */
export function init_panic_hook() {
    wasm.init_panic_hook();
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

const WasmColorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmcolor_free(ptr >>> 0, 1));

export class WasmColor {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmColor.prototype);
        obj.__wbg_ptr = ptr;
        WasmColorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmColorFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmcolor_free(ptr, 0);
    }
    /**
     * Creates a new color with RGB values (0-31 for 5-bit color)
     *
     * Values are automatically clamped to 0-31 range
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    constructor(r, g, b) {
        const ret = wasm.wasmcolor_new(r, g, b);
        this.__wbg_ptr = ret >>> 0;
        WasmColorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Creates a color from RGB888 format (8-bit per channel)
     *
     * Converts 8-bit RGB values to 5-bit by discarding the lower 3 bits
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @returns {WasmColor}
     */
    static fromRgb888(r, g, b) {
        const ret = wasm.wasmcolor_fromRgb888(r, g, b);
        return WasmColor.__wrap(ret);
    }
    /**
     * Converts the color to RGB888 format for display in browser
     *
     * Returns an array [r, g, b] with 8-bit values (0-255)
     * @returns {Uint8Array}
     */
    toRgb888() {
        const ret = wasm.wasmcolor_toRgb888(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Creates a color from RGB555 format (16-bit)
     * @param {number} value
     * @returns {WasmColor}
     */
    static fromRgb555(value) {
        const ret = wasm.wasmcolor_fromRgb555(value);
        return WasmColor.__wrap(ret);
    }
    /**
     * Converts the color to RGB555 format (16-bit)
     * @returns {number}
     */
    toRgb555() {
        const ret = wasm.wasmcolor_toRgb555(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the individual RGB components (0-31 range)
     *
     * Returns an array [r, g, b]
     * @returns {Uint8Array}
     */
    rgb() {
        const ret = wasm.wasmcolor_rgb(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
}
if (Symbol.dispose) WasmColor.prototype[Symbol.dispose] = WasmColor.prototype.free;

const WasmPaletteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpalette_free(ptr >>> 0, 1));

export class WasmPalette {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPalette.prototype);
        obj.__wbg_ptr = ptr;
        WasmPaletteFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPaletteFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpalette_free(ptr, 0);
    }
    /**
     * Creates a new palette with all colors set to black
     */
    constructor() {
        const ret = wasm.wasmpalette_new();
        this.__wbg_ptr = ret >>> 0;
        WasmPaletteFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Gets a color from the palette
     *
     * # Arguments
     * * `palette_idx` - Sub-palette index (0-15)
     * * `color_idx` - Color index within sub-palette (0-15)
     *
     * Indices are wrapped modulo 16 if out of bounds
     * @param {number} palette_idx
     * @param {number} color_idx
     * @returns {WasmColor}
     */
    getColor(palette_idx, color_idx) {
        const ret = wasm.wasmpalette_getColor(this.__wbg_ptr, palette_idx, color_idx);
        return WasmColor.__wrap(ret);
    }
    /**
     * Sets a color in the palette
     *
     * # Arguments
     * * `palette_idx` - Sub-palette index (0-15)
     * * `color_idx` - Color index within sub-palette (0-15)
     * * `color` - The color to set
     *
     * Indices are wrapped modulo 16 if out of bounds
     * @param {number} palette_idx
     * @param {number} color_idx
     * @param {WasmColor} color
     */
    setColor(palette_idx, color_idx, color) {
        _assertClass(color, WasmColor);
        wasm.wasmpalette_setColor(this.__wbg_ptr, palette_idx, color_idx, color.__wbg_ptr);
    }
    /**
     * Exports the entire palette as binary data (512 bytes)
     *
     * Format: 256 colors × 2 bytes (RGB555, little-endian)
     * Can be directly loaded into Cicada-16 CRAM (F200-F3FF)
     * @returns {Uint8Array}
     */
    exportBinary() {
        const ret = wasm.wasmpalette_exportBinary(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Imports a palette from binary data (512 bytes)
     *
     * Returns null if data length is not exactly 512 bytes
     * @param {Uint8Array} data
     * @returns {WasmPalette | undefined}
     */
    static importBinary(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmpalette_importBinary(ptr0, len0);
        return ret === 0 ? undefined : WasmPalette.__wrap(ret);
    }
}
if (Symbol.dispose) WasmPalette.prototype[Symbol.dispose] = WasmPalette.prototype.free;

const WasmTileFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtile_free(ptr >>> 0, 1));

export class WasmTile {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmTile.prototype);
        obj.__wbg_ptr = ptr;
        WasmTileFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmTileFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtile_free(ptr, 0);
    }
    /**
     * Creates a new empty tile (all pixels set to color index 0)
     */
    constructor() {
        const ret = wasm.wasmtile_new();
        this.__wbg_ptr = ret >>> 0;
        WasmTileFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Sets a pixel at the given coordinates to the specified color index (0-15)
     *
     * If coordinates are out of bounds (>= 8) or color > 15, the operation is ignored
     * @param {number} x
     * @param {number} y
     * @param {number} color
     */
    setPixel(x, y, color) {
        wasm.wasmtile_setPixel(this.__wbg_ptr, x, y, color);
    }
    /**
     * Gets the color index of a pixel at the given coordinates
     *
     * Returns 0 if coordinates are out of bounds
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    getPixel(x, y) {
        const ret = wasm.wasmtile_getPixel(this.__wbg_ptr, x, y);
        return ret;
    }
    /**
     * Converts the tile to 4bpp planar format (32 bytes)
     *
     * Returns a Uint8Array that can be used in JavaScript
     * @returns {Uint8Array}
     */
    toPlanar() {
        const ret = wasm.wasmtile_toPlanar(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Creates a tile from 4bpp planar format data (32 bytes)
     *
     * Returns null if data length is not exactly 32 bytes
     * @param {Uint8Array} data
     * @returns {WasmTile | undefined}
     */
    static fromPlanar(data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmtile_fromPlanar(ptr0, len0);
        return ret === 0 ? undefined : WasmTile.__wrap(ret);
    }
}
if (Symbol.dispose) WasmTile.prototype[Symbol.dispose] = WasmTile.prototype.free;

const WasmTilemapFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtilemap_free(ptr >>> 0, 1));

export class WasmTilemap {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmTilemap.prototype);
        obj.__wbg_ptr = ptr;
        WasmTilemapFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmTilemapFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtilemap_free(ptr, 0);
    }
    /**
     * Creates a new tilemap with the specified dimensions
     *
     * # Arguments
     * * `width` - Width in tiles (1-256)
     * * `height` - Height in tiles (1-256)
     *
     * All entries are initialized to default (tile 0, palette 0, no flips)
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        const ret = wasm.wasmtilemap_new(width, height);
        this.__wbg_ptr = ret >>> 0;
        WasmTilemapFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Returns the width of the tilemap in tiles
     * @returns {number}
     */
    width() {
        const ret = wasm.wasmtilemap_width(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Returns the height of the tilemap in tiles
     * @returns {number}
     */
    height() {
        const ret = wasm.wasmtilemap_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Gets a tilemap entry at the specified coordinates
     *
     * Returns null if coordinates are out of bounds
     * @param {number} x
     * @param {number} y
     * @returns {WasmTilemapEntry | undefined}
     */
    getEntry(x, y) {
        const ret = wasm.wasmtilemap_getEntry(this.__wbg_ptr, x, y);
        return ret === 0 ? undefined : WasmTilemapEntry.__wrap(ret);
    }
    /**
     * Sets a tilemap entry at the specified coordinates
     *
     * Does nothing if coordinates are out of bounds
     * @param {number} x
     * @param {number} y
     * @param {WasmTilemapEntry} entry
     */
    setEntry(x, y, entry) {
        _assertClass(entry, WasmTilemapEntry);
        wasm.wasmtilemap_setEntry(this.__wbg_ptr, x, y, entry.__wbg_ptr);
    }
    /**
     * Exports the tilemap as binary data (2 bytes per entry, little-endian)
     *
     * Returns a Vec of size `width * height * 2` bytes
     * @returns {Uint8Array}
     */
    exportBinary() {
        const ret = wasm.wasmtilemap_exportBinary(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Imports a tilemap from binary data
     *
     * # Arguments
     * * `data` - Binary data (must be exactly `width * height * 2` bytes)
     * * `width` - Width in tiles (1-256)
     * * `height` - Height in tiles (1-256)
     *
     * Returns null if data length doesn't match dimensions
     * @param {Uint8Array} data
     * @param {number} width
     * @param {number} height
     * @returns {WasmTilemap | undefined}
     */
    static importBinary(data, width, height) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmtilemap_importBinary(ptr0, len0, width, height);
        return ret === 0 ? undefined : WasmTilemap.__wrap(ret);
    }
    /**
     * Resizes the tilemap to new dimensions
     *
     * # Arguments
     * * `new_width` - New width in tiles (1-256)
     * * `new_height` - New height in tiles (1-256)
     *
     * Existing entries are preserved where possible. New entries are initialized to default.
     * @param {number} new_width
     * @param {number} new_height
     */
    resize(new_width, new_height) {
        wasm.wasmtilemap_resize(this.__wbg_ptr, new_width, new_height);
    }
    /**
     * Clears the entire tilemap (sets all entries to default)
     */
    clear() {
        wasm.wasmtilemap_clear(this.__wbg_ptr);
    }
    /**
     * Fills the entire tilemap with a specific entry
     * @param {WasmTilemapEntry} entry
     */
    fill(entry) {
        _assertClass(entry, WasmTilemapEntry);
        wasm.wasmtilemap_fill(this.__wbg_ptr, entry.__wbg_ptr);
    }
}
if (Symbol.dispose) WasmTilemap.prototype[Symbol.dispose] = WasmTilemap.prototype.free;

const WasmTilemapEntryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtilemapentry_free(ptr >>> 0, 1));

export class WasmTilemapEntry {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmTilemapEntry.prototype);
        obj.__wbg_ptr = ptr;
        WasmTilemapEntryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmTilemapEntryFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtilemapentry_free(ptr, 0);
    }
    /**
     * Creates a new tilemap entry
     *
     * # Arguments
     * * `tile_index` - Tile index (0-1023), will be clamped to 1023
     * * `palette_idx` - Palette index (0-7), will be clamped to 7 (backgrounds use palettes 0-7)
     * * `h_flip` - Horizontal flip flag
     * * `v_flip` - Vertical flip flag
     * * `priority` - Priority flag (vs. sprites)
     * @param {number} tile_index
     * @param {number} palette_idx
     * @param {boolean} h_flip
     * @param {boolean} v_flip
     * @param {boolean} priority
     */
    constructor(tile_index, palette_idx, h_flip, v_flip, priority) {
        const ret = wasm.wasmtilemapentry_new(tile_index, palette_idx, h_flip, v_flip, priority);
        this.__wbg_ptr = ret >>> 0;
        WasmTilemapEntryFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Converts the tilemap entry to 16-bit format (little-endian)
     * @returns {number}
     */
    toU16() {
        const ret = wasm.wasmtilemapentry_toU16(this.__wbg_ptr);
        return ret;
    }
    /**
     * Creates a tilemap entry from a 16-bit value
     * @param {number} value
     * @returns {WasmTilemapEntry}
     */
    static fromU16(value) {
        const ret = wasm.wasmtilemapentry_fromU16(value);
        return WasmTilemapEntry.__wrap(ret);
    }
    /**
     * Returns the tile index (0-1023)
     * @returns {number}
     */
    tileIndex() {
        const ret = wasm.wasmtilemapentry_tileIndex(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns the palette index (0-7)
     * @returns {number}
     */
    paletteIdx() {
        const ret = wasm.wasmtilemapentry_paletteIdx(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns whether the tile is horizontally flipped
     * @returns {boolean}
     */
    hFlip() {
        const ret = wasm.wasmtilemapentry_hFlip(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns whether the tile is vertically flipped
     * @returns {boolean}
     */
    vFlip() {
        const ret = wasm.wasmtilemapentry_vFlip(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Returns the priority flag
     * @returns {boolean}
     */
    priority() {
        const ret = wasm.wasmtilemapentry_priority(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Sets the tile index (will be clamped to 0-1023)
     * @param {number} tile_index
     */
    setTileIndex(tile_index) {
        wasm.wasmtilemapentry_setTileIndex(this.__wbg_ptr, tile_index);
    }
    /**
     * Sets the palette index (will be clamped to 0-7)
     * @param {number} palette_idx
     */
    setPaletteIdx(palette_idx) {
        wasm.wasmtilemapentry_setPaletteIdx(this.__wbg_ptr, palette_idx);
    }
    /**
     * Sets the horizontal flip flag
     * @param {boolean} h_flip
     */
    setHFlip(h_flip) {
        wasm.wasmtilemapentry_setHFlip(this.__wbg_ptr, h_flip);
    }
    /**
     * Sets the vertical flip flag
     * @param {boolean} v_flip
     */
    setVFlip(v_flip) {
        wasm.wasmtilemapentry_setVFlip(this.__wbg_ptr, v_flip);
    }
    /**
     * Sets the priority flag
     * @param {boolean} priority
     */
    setPriority(priority) {
        wasm.wasmtilemapentry_setPriority(this.__wbg_ptr, priority);
    }
}
if (Symbol.dispose) WasmTilemapEntry.prototype[Symbol.dispose] = WasmTilemapEntry.prototype.free;

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg___wbindgen_throw_b855445ff6a94295 = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
        const ret = new Error();
        return ret;
    };
    imports.wbg.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
        const ret = arg1.stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_externrefs;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };

    return imports;
}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('web_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
