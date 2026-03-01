/* @ts-self-types="./text_analyzer.d.ts" */

import * as wasm from "./text_analyzer_bg.wasm";
import { __wbg_set_wasm } from "./text_analyzer_bg.js";
__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    TextMetrics, analyze
} from "./text_analyzer_bg.js";
