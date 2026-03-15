import { useEffect, useRef } from "react";
import type { ClipboardEvent } from "react";

type VerticalEditorProps = {
  initialText: string;
  onChange: (text: string) => void;
  fontSize?: number;
  lineHeight?: number;
};

const SCROLLBAR_STYLE = `
  .vertical-editor-container::-webkit-scrollbar { width: 6px; height: 6px; }
  .vertical-editor-container::-webkit-scrollbar-track { background: transparent; }
  .vertical-editor-container::-webkit-scrollbar-thumb { background: #1e2d42; border-radius: 3px; }
  .vertical-editor-container::-webkit-scrollbar-thumb:hover { background: #2a4060; }
  .vertical-editor-container::-webkit-scrollbar-corner { background: transparent; }
`;

export function VerticalEditor({ initialText, onChange, fontSize = 16, lineHeight = 2.2 }: VerticalEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const composingRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);

  const normalizeText = (value: string) => value.replace(/\r\n/g, "\n");
  const readEditorText = () => editorRef.current?.innerText ?? "";

  const flushChange = (text: string) => {
    onChangeRef.current(text);
  };

  const scheduleChange = (text: string) => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
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

  // Initialize editor and sync when initialText changes from outside
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    // contentEditable は末尾に合成 \n を1つ付加する。両側から1つだけ除去して対称比較する
    const next = normalizeText(initialText).replace(/\n$/, "");
    const current = normalizeText(editor.innerText).replace(/\n$/, "");
    if (next !== current) {
      const prevLeft = editor.scrollLeft;
      const prevTop = editor.scrollTop;
      editor.innerText = initialText;
      editor.scrollLeft = prevLeft;
      editor.scrollTop = prevTop;
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

  // #140: native addEventListener with {passive:false} to ensure preventDefault() works
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const handler = (e: globalThis.WheelEvent) => {
      if (e.ctrlKey) return;
      if (e.deltaY === 0) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? editor.clientWidth : 1;
      const before = editor.scrollLeft;
      editor.scrollLeft += e.deltaY * unit;
      if (editor.scrollLeft !== before) {
        e.preventDefault();
      }
    };
    editor.addEventListener("wheel", handler, { passive: false });
    return () => editor.removeEventListener("wheel", handler);
  }, []);

  return (
    <div
      ref={editorRef}
      className="vertical-editor-container"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onInput={handleInput}
      onBlur={handleBlur}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onPaste={handlePaste}
      style={{
        flex: 1,
        border: "1px solid #1a2535",
        borderRadius: 6,
        width: "100%",
        minHeight: 400,
        background: "#070a14",
        color: "#c8d8e8",
        padding: 20,
        boxSizing: "border-box",
        overflowX: "auto",
        overflowY: "hidden",
        outline: "none",
        writingMode: "vertical-rl",
        textOrientation: "mixed",
        whiteSpace: "pre-wrap",
        minWidth: "max-content",
        fontFamily: "'Noto Serif JP', Georgia, serif",
        fontSize,
        lineHeight,
        letterSpacing: "0.1em",
        caretColor: "#7ab3e0",
      }}
    />
  );
}
