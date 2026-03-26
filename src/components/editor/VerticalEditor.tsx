import { useEffect, useRef } from "react";
import type { ClipboardEvent } from "react";

type VerticalEditorProps = {
  initialText: string;
  onChange: (text: string) => void;
  fontSize?: number;
  lineHeight?: number;
};

// CRLF を LF に正規化するだけ。末尾の \n は一切除去しない。
// contentEditable が付加する合成 \n も、ユーザーが意図した末尾改行も、
// 同じ raw 値として扱うことで strip による情報損失を避ける。
const normalizeLineEndings = (v: string) => v.replace(/\r\n/g, "\n");

const SCROLLBAR_STYLE = `
  .vertical-editor-outer::-webkit-scrollbar { width: 6px; height: 6px; }
  .vertical-editor-outer::-webkit-scrollbar-track { background: transparent; }
  .vertical-editor-outer::-webkit-scrollbar-thumb { background: #1e2d42; border-radius: 3px; }
  .vertical-editor-outer::-webkit-scrollbar-thumb:hover { background: #2a4060; }
  .vertical-editor-outer::-webkit-scrollbar-corner { background: transparent; }
`;

// contentEditable が生成するブロック要素タグ。
// スパン等のインライン要素は改行を挿入しない（P2対応）。
const BLOCK_TAGS = new Set(["DIV", "P", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "UL", "OL"]);

// DOM からテキストを読む。textContent は layout reflow を起こさないため
// innerText より高速だが、<br> や block 要素の改行を拾えない。
// contentEditable が生成する block 要素/<br> を \n に変換してから textContent を返す。
// インライン要素（IME が生成する <span> 等）は改行を挿入しない。
function readDomText(el: HTMLElement): string {
  let result = "";
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName;
      if (tag === "BR") {
        result += "\n";
      } else if (BLOCK_TAGS.has(tag)) {
        // ブロック要素のみ改行セパレータを追加（P2: インライン要素には追加しない）
        if (result.length > 0 && !result.endsWith("\n")) {
          result += "\n";
        }
        result += readDomText(node as HTMLElement);
      } else {
        // インライン要素（span 等）— 改行なしで子要素を再帰処理
        result += readDomText(node as HTMLElement);
      }
    }
  }
  return normalizeLineEndings(result);
}

// ノード列の文字数を readDomText と同じルールでカウント。
// endsNewline: 直前の文字が \n かどうかを伝播させ、ブロック境界 \n を正確にカウントする。
function countCharsWithBoundaries(
  children: Iterable<Node>,
  endsNewline: { v: boolean }
): number {
  let total = 0;
  for (const node of children) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      total += text.length;
      if (text.length > 0) endsNewline.v = text.endsWith("\n");
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName;
      if (tag === "BR") {
        total += 1;
        endsNewline.v = true;
      } else if (BLOCK_TAGS.has(tag)) {
        // readDomText と同じ: 直前が \n でなければブロック境界 \n を挿入
        if (total > 0 && !endsNewline.v) { total += 1; endsNewline.v = true; }
        const inner = { v: true };
        total += countCharsWithBoundaries((node as HTMLElement).childNodes, inner);
        endsNewline.v = inner.v;
      } else {
        // インライン要素: 改行なしで再帰
        const inner = { v: endsNewline.v };
        total += countCharsWithBoundaries((node as HTMLElement).childNodes, inner);
        endsNewline.v = inner.v;
      }
    }
  }
  return total;
}

// カーソルの文字オフセットを取得。readDomText と同じブロック境界ルールを適用し、
// restoreCaretOffset との一貫性を保証する。
function getCaretOffset(container: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return -1;
  // 選択がこのエディタ内にある場合のみ処理する
  if (!container.contains(sel.anchorNode)) return -1;
  const range = sel.getRangeAt(0);
  const targetNode = range.startContainer;
  const targetOffset = range.startOffset;
  let count = 0;
  let found = false;
  // readDomText と同じ: 空文字列は「\n 済み」扱い
  let endsNewline = true;
  // P2: startContainer がエディタルート自身の場合（空エディタ、トップレベルノード間）
  // walk は childNodes に対して node === targetNode を判定するため一致しない。
  // startOffset は子インデックスなので、最初の startOffset 個の子の文字数を返す。
  if (targetNode === container) {
    const en = { v: endsNewline };
    const slice = Array.from(container.childNodes).slice(0, targetOffset);
    return countCharsWithBoundaries(slice, en);
  }
  function walk(node: Node): void {
    if (found) return;
    if (node === targetNode) {
      if (node.nodeType === Node.TEXT_NODE) {
        count += targetOffset;
      } else {
        // 要素ノード上のカーソル — startOffset は子インデックスを示す。
        // BLOCK 要素なら境界 \n を先に加算してから子をカウント。
        if (BLOCK_TAGS.has((node as HTMLElement).tagName) && count > 0 && !endsNewline) {
          count += 1;
        }
        const en = { v: endsNewline };
        const slice = Array.from((node as HTMLElement).childNodes).slice(0, targetOffset);
        count += countCharsWithBoundaries(slice, en);
      }
      found = true;
      return;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      count += text.length;
      if (text.length > 0) endsNewline = text.endsWith("\n");
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName;
      if (tag === "BR") {
        count += 1;
        endsNewline = true;
      } else if (BLOCK_TAGS.has(tag)) {
        // readDomText と同じ: 直前が \n でなければブロック境界 \n を挿入
        if (count > 0 && !endsNewline) { count += 1; endsNewline = true; }
        for (const child of node.childNodes) {
          walk(child);
          if (found) return;
        }
      } else {
        // インライン要素
        for (const child of node.childNodes) {
          walk(child);
          if (found) return;
        }
      }
    }
  }
  for (const child of container.childNodes) {
    walk(child);
    if (found) break;
  }
  return found ? count : -1;
}

// 文字オフセットからカーソルを復元。
// getCaretOffset と同じブロック境界ルールを適用し、一貫性を保証する。
function restoreCaretOffset(container: HTMLElement, offset: number) {
  if (offset < 0) return;
  const sel = window.getSelection();
  if (!sel) return;
  // TypeScript の narrowing は nested function 内で失われるため非null アサーションを使う
  const selNN = sel;
  let remaining = offset;
  let found = false;
  // getCaretOffset と同じ: 空文字列は「\n 済み」扱い
  let endsNewline = true;
  function walk(node: Node): void {
    if (found) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      const len = text.length;
      if (remaining <= len) {
        const range = document.createRange();
        range.setStart(node, remaining);
        range.collapse(true);
        selNN.removeAllRanges();
        selNN.addRange(range);
        found = true;
        return;
      }
      remaining -= len;
      if (len > 0) endsNewline = text.endsWith("\n");
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName;
      if (tag === "BR") {
        if (remaining === 0) {
          const range = document.createRange();
          range.setStartBefore(node);
          range.collapse(true);
          selNN.removeAllRanges();
          selNN.addRange(range);
          found = true;
          return;
        }
        remaining -= 1;
        endsNewline = true;
      } else if (BLOCK_TAGS.has(tag)) {
        // getCaretOffset と同じ: 直前が \n でなければブロック境界 \n を消費する
        if (!endsNewline && remaining > 0) {
          remaining -= 1;
          endsNewline = true;
        }
        for (const child of node.childNodes) {
          walk(child);
          if (found) return;
        }
      } else {
        // インライン要素: 境界なしで再帰
        for (const child of node.childNodes) {
          walk(child);
          if (found) return;
        }
      }
    }
  }
  for (const child of container.childNodes) {
    walk(child);
    if (found) return;
  }
  // offset が全長を超えた場合は末尾に配置
  const range = document.createRange();
  range.selectNodeContents(container);
  range.collapse(false);
  selNN.removeAllRanges();
  selNN.addRange(range);
}

export function VerticalEditor({ initialText, onChange, fontSize = 16, lineHeight = 2.2 }: VerticalEditorProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const composingRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  // Tracks the last text committed to the store so we can distinguish our own
  // debounce round-trips (initialText == lastFlushed) from external updates like
  // undo/redo (initialText != lastFlushed).
  const lastFlushedRef = useRef<string>("");
  // DOM 上の現在テキストをキャッシュ。readDomText() の呼び出し（軽量だが不要なら避けたい）を減らし、
  // initialText effect での不要な DOM 置換をスキップする。
  const domTextRef = useRef<string>("");

  const readEditorText = () => {
    const text = editorRef.current ? readDomText(editorRef.current) : "";
    domTextRef.current = text;
    return text;
  };

  const flushChange = (text: string) => {
    lastFlushedRef.current = text;
    domTextRef.current = text;
    onChangeRef.current(text);
  };

  const scheduleChange = (text: string) => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    domTextRef.current = text;
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      flushChange(text);
    }, 180);
  };

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Inject scrollbar styles once on mount
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = SCROLLBAR_STYLE;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Sync the DOM when initialText changes.
  //
  // Two cases while a debounce is pending (user is actively typing):
  //   a) storeText === lastFlushed  →  stale round-trip from our own previous
  //      flush; the editor is already ahead — skip to preserve the cursor.
  //   b) storeText !== lastFlushed  →  external update (undo/redo, scene switch
  //      etc.); cancel the in-flight debounce so the external value wins, then sync.
  //
  // No trailing-\n stripping is done anywhere: the raw innerText (including
  // the browser's synthetic trailing \n) is stored as-is, so the comparison
  // here is a direct equality check after CRLF normalisation only.
  useEffect(() => {
    const editor = editorRef.current;
    const outer = outerRef.current;
    if (!editor || !outer) return;

    const storeText = normalizeLineEndings(initialText);

    if (debounceTimerRef.current !== null) {
      if (storeText === lastFlushedRef.current) return; // (a) round-trip
      // (b) external update — cancel pending debounce so stale text isn't committed
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // domTextRef による高速比較。DOM を読まずに済むため layout reflow を回避。
    if (storeText !== domTextRef.current) {
      const prevLeft = outer.scrollLeft;
      const prevTop = outer.scrollTop;
      const caretOff = getCaretOffset(editor);
      editor.innerText = initialText;
      domTextRef.current = storeText;
      restoreCaretOffset(editor, caretOff);
      outer.scrollLeft = prevLeft;
      outer.scrollTop = prevTop;
    }
  }, [initialText]);

  // Flush any pending debounced change on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        flushChange(readEditorText());
      }
    };
  }, []);

  // Initialize domTextRef on mount
  useEffect(() => {
    domTextRef.current = normalizeLineEndings(initialText);
  }, []);

  const handleInput = () => {
    const nextText = readEditorText();
    if (!composingRef.current) {
      scheduleChange(nextText);
    }
  };

  const handleBlur = () => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    flushChange(readEditorText());
  };

  const handleCompositionStart = () => {
    composingRef.current = true;
  };

  const handleCompositionEnd = () => {
    composingRef.current = false;
    handleInput();
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    scheduleChange(readEditorText());
  };

  // Wheel handler on OUTER scroll container.
  // scrollBy() handles RTL sign conventions correctly for vertical-rl.
  // Delta is negated because vertical-rl reading direction flows right→left (negative X).
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const handler = (e: globalThis.WheelEvent) => {
      if (e.ctrlKey) return;
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? outer.clientWidth : 1;
      const before = outer.scrollLeft;
      outer.scrollBy({ left: -delta * unit, behavior: "instant" as ScrollBehavior });
      // スクロール位置が実際に変化した時のみ preventDefault。
      // 端まで達した場合は親要素のスクロールに委ねる。
      if (outer.scrollLeft !== before) {
        e.preventDefault();
      }
    };
    outer.addEventListener("wheel", handler, { passive: false });
    return () => outer.removeEventListener("wheel", handler);
  }, []);

  return (
    <div
      ref={outerRef}
      className="vertical-editor-outer"
      style={{
        flex: 1,
        border: "1px solid #1a2535",
        borderRadius: 6,
        width: "100%",
        minHeight: 400,
        background: "#070a14",
        overflowX: "auto",
        overflowY: "hidden",
        boxSizing: "border-box",
        contain: "content",
      }}
    >
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onInput={handleInput}
        onBlur={handleBlur}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onPaste={handlePaste}
        style={{
          minWidth: "max-content",
          minHeight: "100%",
          padding: 20,
          boxSizing: "border-box",
          outline: "none",
          color: "#c8d8e8",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          whiteSpace: "pre-wrap",
          fontFamily: "'Noto Serif JP', Georgia, serif",
          fontSize,
          lineHeight,
          letterSpacing: "0.1em",
          caretColor: "#7ab3e0",
        }}
      />
    </div>
  );
}
