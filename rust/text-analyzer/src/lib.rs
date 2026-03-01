use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct TextMetrics {
    pub char_count: u32,
    pub sentence_count: u32,
    pub paragraph_count: u32,
    pub kanji_rate: f32,
    pub reading_time_sec: u32,
}

/// Analyze Japanese text and return writing statistics.
///
/// - char_count: non-whitespace character count
/// - sentence_count: count of sentence-ending punctuation （。！？…‥）
/// - paragraph_count: count of non-empty blocks separated by blank lines
/// - kanji_rate: percentage of CJK ideographs among non-whitespace chars (0–100)
/// - reading_time_sec: estimated reading time in seconds at 400 chars/min
#[wasm_bindgen]
pub fn analyze(text: &str) -> TextMetrics {
    let char_count = text.chars().filter(|c| !c.is_whitespace()).count() as u32;

    let sentence_count = {
        let n = text
            .chars()
            .filter(|&c| matches!(c, '。' | '！' | '？' | '…' | '‥' | '!' | '?'))
            .count() as u32;
        if n == 0 && char_count > 0 { 1 } else { n }
    };

    let paragraph_count = {
        let n = text
            .split("\n\n")
            .filter(|p| !p.trim().is_empty())
            .count() as u32;
        if n == 0 && char_count > 0 { 1 } else { n }
    };

    let kanji_count = text
        .chars()
        .filter(|c| !c.is_whitespace() && is_cjk(*c))
        .count() as u32;

    let kanji_rate = if char_count > 0 {
        (kanji_count as f32 / char_count as f32) * 100.0
    } else {
        0.0
    };

    let reading_time_sec = if char_count > 0 {
        ((char_count as f32 / 400.0) * 60.0).ceil() as u32
    } else {
        0
    };

    TextMetrics {
        char_count,
        sentence_count,
        paragraph_count,
        kanji_rate,
        reading_time_sec,
    }
}

fn is_cjk(c: char) -> bool {
    matches!(c,
        '\u{4E00}'..='\u{9FFF}'   // CJK Unified Ideographs
        | '\u{3400}'..='\u{4DBF}' // CJK Extension A
        | '\u{F900}'..='\u{FAFF}' // CJK Compatibility Ideographs
    )
}
