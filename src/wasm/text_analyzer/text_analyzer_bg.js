export class TextMetrics {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TextMetrics.prototype);
        obj.__wbg_ptr = ptr;
        TextMetricsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TextMetricsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_textmetrics_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get char_count() {
        const ret = wasm.__wbg_get_textmetrics_char_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get kanji_rate() {
        const ret = wasm.__wbg_get_textmetrics_kanji_rate(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get paragraph_count() {
        const ret = wasm.__wbg_get_textmetrics_paragraph_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get reading_time_sec() {
        const ret = wasm.__wbg_get_textmetrics_reading_time_sec(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get sentence_count() {
        const ret = wasm.__wbg_get_textmetrics_sentence_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set char_count(arg0) {
        wasm.__wbg_set_textmetrics_char_count(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set kanji_rate(arg0) {
        wasm.__wbg_set_textmetrics_kanji_rate(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set paragraph_count(arg0) {
        wasm.__wbg_set_textmetrics_paragraph_count(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set reading_time_sec(arg0) {
        wasm.__wbg_set_textmetrics_reading_time_sec(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set sentence_count(arg0) {
        wasm.__wbg_set_textmetrics_sentence_count(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) TextMetrics.prototype[Symbol.dispose] = TextMetrics.prototype.free;

/**
 * Analyze Japanese text and return writing statistics.
 *
 * - char_count: non-whitespace character count
 * - sentence_count: count of sentence-ending punctuation （。！？…‥）
 * - paragraph_count: count of non-empty blocks separated by blank lines
 * - kanji_rate: percentage of CJK ideographs among non-whitespace chars (0–100)
 * - reading_time_sec: estimated reading time in seconds at 400 chars/min
 * @param {string} text
 * @returns {TextMetrics}
 */
export function analyze(text) {
    const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.analyze(ptr0, len0);
    return TextMetrics.__wrap(ret);
}
export function __wbg___wbindgen_throw_6ddd609b62940d55(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
}
export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
}
const TextMetricsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_textmetrics_free(ptr >>> 0, 1));

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
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

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;


let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}
