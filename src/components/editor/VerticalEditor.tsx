import { useRef, useEffect } from "react";

type VerticalEditorProps = {
  initialText: string;
  onChange: (text: string) => void;
  fontSize?: number;
  lineHeight?: number;
};

export function VerticalEditor({ initialText, onChange, fontSize = 16, lineHeight = 2.2 }: VerticalEditorProps) {
  const onChangeRef = useRef(onChange);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastTextRef = useRef(initialText);
  const normalizeText = (value: string) => value.replace(/\r\n/g, "\n");

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "vertical-input") {
        const nextText = typeof e.data.text === "string" ? e.data.text : "";
        lastTextRef.current = normalizeText(nextText);
        onChangeRef.current(nextText);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Update iframe when initialText changes from outside
  useEffect(() => {
    if (normalizeText(initialText) !== lastTextRef.current) {
      lastTextRef.current = normalizeText(initialText);
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'vertical-update', text: initialText }, '*');
      }
    }
  }, [initialText]);

  // YUY-57: fontSize / lineHeight 変更をリアルタイムで反映
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'vertical-style', fontSize, lineHeight }, '*');
    }
  }, [fontSize, lineHeight]);

  const srcDocRef = useRef<string | null>(null);
  if (!srcDocRef.current) {
    const escaped = initialText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br>");
    const parentOrigin = window.location.origin;
    srcDocRef.current = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body { height:100%; background:#070a14; overflow-x:auto; overflow-y:hidden; }
body { display:flex; align-items:stretch; padding:20px; }
#editor {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: 'Noto Serif JP', Georgia, serif;
  font-size: ${fontSize}px; line-height: ${lineHeight}; color: #c8d8e8;
  letter-spacing: 0.1em; white-space: pre-wrap;
  min-height: calc(100% - 0px); min-width: max-content;
  outline: none; caret-color: #7ab3e0;
}
/* YUY-55: 縦組み専用スクロールバー */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #1e2d42; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #2a4060; }
::-webkit-scrollbar-corner { background: transparent; }
</style></head>
<body><div id="editor" contenteditable="true">${escaped}</div>
<script>
  const normalizeText = (value) => value.replace(/\r\n/g, '\n');
  const isEquivalentText = (a, b) => normalizeText(a) === normalizeText(b);
  const getCaretOffset = (root) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!root.contains(range.startContainer)) return null;
    const pre = range.cloneRange();
    pre.selectNodeContents(root);
    pre.setEnd(range.startContainer, range.startOffset);
    return pre.toString().length;
  };
  const setCaretOffset = (root, offset) => {
    const sel = window.getSelection();
    if (!sel) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let remain = offset;
    let node = walker.nextNode();
    while (node) {
      const len = node.textContent ? node.textContent.length : 0;
      if (remain <= len) {
        const r = document.createRange();
        r.setStart(node, Math.max(0, remain));
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        return;
      }
      remain -= len;
      node = walker.nextNode();
    }
    const tail = document.createRange();
    tail.selectNodeContents(root);
    tail.collapse(false);
    sel.removeAllRanges();
    sel.addRange(tail);
  };
  const editor = document.getElementById('editor');
  editor.addEventListener('input', () => {
    window.parent.postMessage({ type: 'vertical-input', text: editor.innerText }, '${parentOrigin}');
  });
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'vertical-update') {
      const nextText = typeof e.data.text === 'string' ? e.data.text : '';
      // YUY-73: 同一内容の再代入を避け、キャレットが文末へ飛ぶ副作用を防ぐ
      if (!isEquivalentText(editor.innerText, nextText)) {
        const root = document.scrollingElement || document.documentElement;
        const prevLeft = root.scrollLeft;
        const prevTop = root.scrollTop;
        const caret = getCaretOffset(editor);
        editor.innerText = nextText;
        if (caret !== null) {
          setCaretOffset(editor, Math.min(caret, nextText.length));
        }
        // YUY-73: 同期反映後も表示位置（特に横スクロール）を維持
        root.scrollLeft = prevLeft;
        root.scrollTop = prevTop;
      }
    }
    // YUY-57: フォントサイズ・行間のリアルタイム更新
    if (e.data?.type === 'vertical-style') {
      editor.style.fontSize = e.data.fontSize + 'px';
      editor.style.lineHeight = String(e.data.lineHeight);
    }
  });
  // YUY-56: マウス縦スクロールを横スクロールへ変換（trackpadの横スクロールは維持）
  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return; // pinch-zoom gestures
    if (e.deltaY === 0) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerWidth : 1;
    const delta = e.deltaY * unit;
    const beforeWindowX = window.scrollX;
    window.scrollBy({ left: delta, top: 0, behavior: 'auto' });
    if (window.scrollX !== beforeWindowX) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const root = document.scrollingElement || document.documentElement;
    const beforeRoot = root.scrollLeft;
    root.scrollLeft += delta;
    if (root.scrollLeft !== beforeRoot) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false, capture: true });
</script></body></html>`;
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDocRef.current}
      style={{ flex: 1, border: "1px solid #1a2535", borderRadius: 6, width: "100%", minHeight: 400 }}
    />
  );
}
