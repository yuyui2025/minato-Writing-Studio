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

// DOM からテキストを読む。textContent は layout reflow を起こさないため
// innerText より高速だが、<br> や block 要素の改行を拾えない。
// contentEditable が生成する <div>/<br> を \n に変換してから textContent を返す。
function readDomText(el: HTMLElement): string {
  let result = "";
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName;
      if (tag === "BR") {
        result += "\n";
      } else {
        // <div>, <p> etc. — block elements add a newline separator
        if (result.length > 0 && !result.endsWith("\n")) {
          result += "\n";
        }
        result += readDomText(node as HTMLElement);
      }
    }
  }
  return normalizeLineEndings(result);
}

// カーソルの文字オフセットを取得
function getCaretOffset(container: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return -1;
  const range = sel.getRangeAt(0);
  const preRange = document.createRange();
  preRange.selectNodeContents(container);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().length;
}

// 文字オフセットからカーソルを復元
function restoreCaretOffset(container: HTMLElement, offset: number) {
  if (offset < 0) return;
  const sel = window.getSelection();
  if (!sel) return;

  let remaining = offset;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const len = node.length;
    if (remaining <= len) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    remaining -= len;
  }
  // offset が全テキスト長を超えた場合は末尾に配置
  const range = document.createRange();
  range.selectNodeContents(container);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
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
      outer.scrollBy({ left: -delta * unit, behavior: "instant" as ScrollBehavior });
      e.preventDefault();
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
