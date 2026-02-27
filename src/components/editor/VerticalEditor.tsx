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

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "vertical-input") {
        lastTextRef.current = e.data.text;
        onChangeRef.current(e.data.text);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Update iframe when initialText changes from outside
  useEffect(() => {
    if (initialText !== lastTextRef.current) {
      lastTextRef.current = initialText;
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'vertical-update', text: initialText }, '*');
      }
    }
  }, [initialText]);

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
</style></head>
<body><div id="editor" contenteditable="true">${escaped}</div>
<script>
  const editor = document.getElementById('editor');
  editor.addEventListener('input', () => {
    window.parent.postMessage({ type: 'vertical-input', text: editor.innerText }, '${parentOrigin}');
  });
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'vertical-update') {
      editor.innerText = e.data.text;
    }
  });
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
