/* tslint:disable */
/* eslint-disable */

export class TextMetrics {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    char_count: number;
    kanji_rate: number;
    paragraph_count: number;
    reading_time_sec: number;
    sentence_count: number;
}

/**
 * Analyze Japanese text and return writing statistics.
 *
 * - char_count: non-whitespace character count
 * - sentence_count: count of sentence-ending punctuation （。！？…‥）
 * - paragraph_count: count of non-empty blocks separated by blank lines
 * - kanji_rate: percentage of CJK ideographs among non-whitespace chars (0–100)
 * - reading_time_sec: estimated reading time in seconds at 400 chars/min
 */
export function analyze(text: string): TextMetrics;

/**
 * Parse a Japanese manuscript into structured sections.
 * Returns a JSON string: { title: string, sections: [{chapter, title, content}] }
 * No external crates required — JSON is built manually.
 */
export function parse_document(text: string): string;
