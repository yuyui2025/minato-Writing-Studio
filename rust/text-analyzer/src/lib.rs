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

// ============================================================
// Document structure parser
// ============================================================

/// Parse a Japanese manuscript into structured sections.
/// Returns a JSON string: { title: string, sections: [{chapter, title, content}] }
/// No external crates required — JSON is built manually.
#[wasm_bindgen]
pub fn parse_document(text: &str) -> String {
    let sections = extract_sections(text);
    let doc_title = infer_title(text, &sections);

    let sections_json: Vec<String> = sections
        .iter()
        .map(|s| {
            format!(
                r#"{{"chapter":{},"title":{},"content":{}}}"#,
                json_str(&s.chapter),
                json_str(&s.title),
                json_str(&s.content),
            )
        })
        .collect();

    format!(
        r#"{{"title":{},"sections":[{}]}}"#,
        json_str(&doc_title),
        sections_json.join(",")
    )
}

struct Section {
    chapter: String,
    title: String,
    content: String,
}

struct SplitPoint {
    header_line_idx: usize,
    line_idx: usize,
    chapter: String,
    title: String,
    score: u8,
}

/// Escape a Rust string into a JSON string literal (with surrounding quotes).
fn json_str(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '"'  => out.push_str("\\\""),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => {
                out.push_str(&format!("\\u{:04x}", c as u32));
            }
            c    => out.push(c),
        }
    }
    out.push('"');
    out
}

fn infer_title(text: &str, sections: &[Section]) -> String {
    // First H1 heading (# ...) that is NOT also H2+ wins
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("# ") && !trimmed.starts_with("## ") {
            return trimmed[2..].trim().to_string();
        }
    }
    // Fallback: first non-empty section title
    if let Some(first) = sections.first() {
        if !first.title.is_empty() {
            return first.title.clone();
        }
    }
    String::new()
}

/// Returns true if this line (trimmed) is a scene-break sentinel.
fn is_scene_break(line: &str) -> bool {
    let t = line.trim();
    matches!(t, "---" | "***" | "◇" | "○" | "＊" | "* * *" | "- - -")
        || (!t.is_empty()
            && t.len() <= 9
            && t.chars().all(|c| matches!(c, '◇' | '○' | '＊' | '*' | '-' | ' ')))
}

/// Detect a chapter-level label from a plain-text line.
/// Examples: "第一章", "第3章", "Chapter 2"
fn detect_chapter_label(line: &str) -> Option<String> {
    let t = line.trim();
    if t.starts_with('第') && (t.contains('章') || t.contains('節')) {
        return Some(t.to_string());
    }
    let lower = t.to_lowercase();
    if lower.starts_with("chapter ") || lower.starts_with("chap ") {
        return Some(t.to_string());
    }
    None
}

fn is_blank(line: &str) -> bool {
    line.trim().is_empty()
}

fn looks_like_markdown_title(line: &str) -> Option<String> {
    let trimmed = line.trim();
    if let Some(title) = trimmed.strip_prefix("## ") {
        return Some(title.trim().to_string());
    }
    if let Some(title) = trimmed.strip_prefix("### ") {
        return Some(title.trim().to_string());
    }
    None
}

fn looks_like_standalone_scene_title(line: &str) -> bool {
    let t = line.trim();
    if t.is_empty() || t.len() > 40 {
        return false;
    }
    if t.starts_with('#') || detect_chapter_label(t).is_some() || is_scene_break(t) {
        return false;
    }
    if t.contains('。') || t.contains('、') || t.contains('！') || t.contains('？') {
        return false;
    }
    let non_space = t.chars().filter(|c| !c.is_whitespace()).count();
    if non_space == 0 || non_space > 24 {
        return false;
    }
    true
}

fn next_non_empty_line(lines: &[&str], start: usize) -> Option<usize> {
    let mut i = start;
    while i < lines.len() {
        if !is_blank(lines[i]) {
            return Some(i);
        }
        i += 1;
    }
    None
}

fn prev_non_empty_line(lines: &[&str], start: usize) -> Option<usize> {
    if start == 0 {
        return None;
    }
    let mut i = start - 1;
    loop {
        if !is_blank(lines[i]) {
            return Some(i);
        }
        if i == 0 {
            break;
        }
        i -= 1;
    }
    None
}

fn is_strong_scene_cue(line: &str) -> bool {
    let t = line.trim();
    let lower = t.to_lowercase();
    lower.starts_with("scene ")
        || lower.starts_with("scene:")
        || t.starts_with("シーン")
        || t.starts_with("場面")
        || (t.starts_with('【') && t.ends_with('】'))
}

fn detect_standalone_scene_heading(lines: &[&str], idx: usize) -> Option<(String, usize, u8)> {
    let line = lines[idx].trim();
    if !looks_like_standalone_scene_title(line) {
        return None;
    }

    let prev_is_blank = idx == 0 || is_blank(lines[idx - 1]);
    let next_idx = next_non_empty_line(lines, idx + 1)?;
    let next_line = lines[next_idx].trim();
    if next_line.is_empty() || looks_like_standalone_scene_title(next_line) {
        return None;
    }

    let prev_non_empty = prev_non_empty_line(lines, idx);
    if let Some(prev) = prev_non_empty {
        if idx.saturating_sub(prev) <= 1 && !prev_is_blank {
            return None;
        }
    }

    let mut score = 0;
    if prev_is_blank {
        score += 35;
    }
    let has_trailing_blank = next_idx > idx + 1;
    if has_trailing_blank {
        score += 15;
    }
    if is_strong_scene_cue(line) {
        score += 40;
    } else {
        score += 20;
    }
    if !line.chars().any(|c| c.is_ascii_lowercase()) {
        score += 10;
    }

    if !has_trailing_blank && !is_strong_scene_cue(line) {
        return None;
    }

    if score < 55 {
        return None;
    }

    Some((line.to_string(), next_idx, score))
}

fn extract_sections(text: &str) -> Vec<Section> {
    let lines: Vec<&str> = text.lines().collect();
    if lines.is_empty() {
        return vec![];
    }

    let mut splits: Vec<SplitPoint> = Vec::new();
    let mut current_chapter = String::new();
    let mut i = 0;

    while i < lines.len() {
        let line = lines[i].trim();

        // H1 (document title) — skip, handled by infer_title
        if line.starts_with("# ") && !line.starts_with("## ") {
            i += 1;
            continue;
        }

        if let Some(section_title) = looks_like_markdown_title(line) {
            splits.push(SplitPoint {
                header_line_idx: i,
                line_idx: i + 1,
                chapter: current_chapter.clone(),
                title: section_title,
                score: 95,
            });
            i += 1;
            continue;
        }

        // 第X章 / Chapter N → update chapter; next non-empty non-heading line = title
        if let Some(chapter_label) = detect_chapter_label(line) {
            current_chapter = chapter_label;
            let header_at = i;
            let mut j = next_non_empty_line(&lines, i + 1).unwrap_or(lines.len());
            let section_title = if j < lines.len() {
                let next = lines[j].trim();
                if !next.starts_with('#')
                    && detect_chapter_label(next).is_none()
                    && !is_scene_break(next)
                    && looks_like_standalone_scene_title(next)
                {
                    j += 1;
                    next.to_string()
                } else {
                    String::new()
                }
            } else {
                String::new()
            };
            splits.push(SplitPoint {
                header_line_idx: header_at,
                line_idx: j,
                chapter: current_chapter.clone(),
                title: section_title,
                score: 90,
            });
            i = j;
            continue;
        }

        // Scene-break separator → new scene, same chapter, no title
        if is_scene_break(line) {
            splits.push(SplitPoint {
                header_line_idx: i,
                line_idx: i + 1,
                chapter: current_chapter.clone(),
                title: String::new(),
                score: 80,
            });
            i += 1;
            continue;
        }

        if let Some((section_title, line_idx, score)) = detect_standalone_scene_heading(&lines, i) {
            splits.push(SplitPoint {
                header_line_idx: i,
                line_idx,
                chapter: current_chapter.clone(),
                title: section_title,
                score,
            });
            i = line_idx;
            continue;
        }

        i += 1;
    }

    // No structural markers → one big section
    if splits.is_empty() {
        let content = text.trim().to_string();
        if content.is_empty() {
            return vec![];
        }
        return vec![Section {
            chapter: String::new(),
            title: String::new(),
            content,
        }];
    }

    // Extract content between split points.
    // First, check if there is preamble content before the first heading/separator.
    // Filter out H1 lines (# ...) — they are the document title, not body content.
    let mut sections: Vec<Section> = Vec::new();
    let preamble_end = splits[0].header_line_idx;
    if preamble_end > 0 {
        let preamble = lines[0..preamble_end]
            .iter()
            .filter(|l| {
                let t = l.trim();
                !(t.starts_with("# ") && !t.starts_with("## "))
            })
            .copied()
            .collect::<Vec<_>>()
            .join("\n")
            .trim()
            .to_string();
        if !preamble.is_empty() {
            sections.push(Section {
                chapter: String::new(),
                title: String::new(),
                content: preamble,
            });
        }
    }

    for k in 0..splits.len() {
        let start = splits[k].line_idx;
        let end = if k + 1 < splits.len() {
            splits[k + 1].header_line_idx
        } else {
            lines.len()
        };
        let content = lines[start..end.min(lines.len())]
            .join("\n")
            .trim()
            .to_string();
        if splits[k].score >= 55 {
            sections.push(Section {
                chapter: splits[k].chapter.clone(),
                title: splits[k].title.clone(),
                content,
            });
        }
    }

    // Drop trailing empty sections
    while sections.last().map(|s| s.content.is_empty()).unwrap_or(false) {
        sections.pop();
    }

    sections
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_no_structure_single_section() {
        let text = "これは構造のないテキストです。\n改行があります。";
        let sections = extract_sections(text);
        assert_eq!(sections.len(), 1);
        assert_eq!(sections[0].chapter, "");
        assert!(sections[0].content.contains("構造のない"));
    }

    #[test]
    fn test_markdown_h2_splits() {
        let text = "# 作品タイトル\n\n## 第一幕\n\n最初のシーン内容。\n\n## 第二幕\n\n次のシーン内容。";
        let sections = extract_sections(text);
        assert_eq!(sections.len(), 2);
        assert_eq!(sections[0].title, "第一幕");
        assert_eq!(sections[1].title, "第二幕");
    }

    #[test]
    fn test_chapter_pattern_detection() {
        let text = "第一章\nプロローグ\n\n物語の始まり。";
        let sections = extract_sections(text);
        assert!(!sections.is_empty());
        assert_eq!(sections[0].chapter, "第一章");
    }

    #[test]
    fn test_scene_break_splits() {
        let text = "シーンAの内容。\n\n---\n\nシーンBの内容。";
        let sections = extract_sections(text);
        assert_eq!(sections.len(), 2);
    }

    #[test]
    fn test_plain_text_standalone_title_splits() {
        let text = "導入\n\n朝の街は静かだった。\n\n対決\n\n二人は剣を構えた。";
        let sections = extract_sections(text);
        assert_eq!(sections.len(), 2);
        assert_eq!(sections[0].title, "導入");
        assert_eq!(sections[1].title, "対決");
    }

    #[test]
    fn test_regular_sentence_line_does_not_split_as_title() {
        let text = "これは説明文です\n次の行も本文です。";
        let sections = extract_sections(text);
        assert_eq!(sections.len(), 1);
        assert!(sections[0].title.is_empty());
    }

    #[test]
    fn test_json_str_escaping() {
        let s = json_str("hello\nworld\"\\");
        assert_eq!(s, r#""hello\nworld\"\\""#);
    }

    #[test]
    fn test_parse_document_returns_valid_json_shape() {
        let text = "## シーン1\n\nコンテンツ。";
        let json = parse_document(text);
        assert!(json.contains("\"sections\""));
        assert!(json.contains("\"title\""));
        assert!(json.contains("コンテンツ"));
    }

    #[test]
    fn test_empty_text_returns_empty_sections() {
        let text = "";
        let json = parse_document(text);
        assert!(json.contains("\"sections\":[]"));
    }

    #[test]
    fn test_chapter_content_does_not_bleed_into_next() {
        // YUY-53: 章ヘッダーが前セクションのコンテンツに混入しないことを確認
        let text = "第一章\nプロローグ\n\n物語の始まりだった。\n\n第二章\n本編\n\n続きの話。";
        let sections = extract_sections(text);
        assert_eq!(sections.len(), 2);
        assert!(!sections[0].content.contains("第二章"), "第二章 must not appear in section 0 content");
        assert!(!sections[0].content.contains("本編"), "section 1 title must not appear in section 0 content");
        assert!(sections[0].content.contains("物語の始まりだった"));
        assert!(sections[1].content.contains("続きの話"));
    }

    #[test]
    fn test_h2_content_does_not_include_next_header() {
        let text = "## 第一幕\n\n最初のシーン内容。\n\n## 第二幕\n\n次のシーン内容。";
        let sections = extract_sections(text);
        assert_eq!(sections.len(), 2);
        assert!(!sections[0].content.contains("第二幕"), "第二幕 must not appear in section 0 content");
        assert!(sections[0].content.contains("最初のシーン内容"));
    }
}
