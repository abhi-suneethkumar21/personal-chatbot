import { useState, useRef, useEffect } from 'react';
import { Paperclip, ArrowUp, Square, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function ChatInput({ onSend, generating, onStop }) {
  const [text, setText]             = useState('');
  const [attachments, setAttachments] = useState([]);
  const [focused, setFocused]       = useState(false);
  const textRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [text]);

  const submit = (e) => {
    e?.preventDefault();
    if ((!text.trim() && !attachments.length) || generating) return;
    onSend(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (textRef.current) textRef.current.style.height = 'auto';
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const handleFiles = (e) => {
    Array.from(e.target.files ?? []).forEach(file => {
      if (file.type.startsWith('image/')) {
        const r = new FileReader();
        r.onload = (ev) => {
          setAttachments(p => [...p, { type: 'image', name: file.name, data: ev.target.result.split(',')[1], url: ev.target.result }]);
        };
        r.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        const r = new FileReader();
        r.onload = async (ev) => {
          try {
            const pdf = await pdfjsLib.getDocument(new Uint8Array(ev.target.result)).promise;
            let content = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const tc = await page.getTextContent();
              content += `\n--- Page ${i} ---\n${tc.items.map(x => x.str).join(' ')}`;
            }
            setAttachments(p => [...p, { type: 'pdf', name: file.name, content }]);
          } catch (err) {
            console.error('PDF error', err);
            setAttachments(p => [...p, { type: 'pdf', name: file.name, content: '[Error extracting PDF]' }]);
          }
        };
        r.readAsArrayBuffer(file);
      } else {
        const r = new FileReader();
        r.onload = (ev) => setAttachments(p => [...p, { type: 'text', name: file.name, content: ev.target.result }]);
        r.readAsText(file);
      }
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const canSend = (text.trim() || attachments.length > 0) && !generating;

  return (
    <div
      className="safe-bottom"
      style={{
        padding: '10px 16px 0',
        background: 'linear-gradient(to top, var(--bg) 65%, transparent)',
        flexShrink: 0,
        transition: 'background 0.25s ease',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {attachments.map((att, i) => (
              <div key={i} style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--att-bg)', border: '1px solid var(--att-border)',
                borderRadius: 10, padding: '6px 10px', maxWidth: 180,
                transition: 'background 0.25s, border-color 0.25s',
              }}>
                {att.type === 'image' && (
                  <img src={att.url} alt="" style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                )}
                {att.type !== 'image' && (
                  <div style={{
                    width: 34, height: 34, borderRadius: 6, flexShrink: 0,
                    background: att.type === 'pdf' ? 'rgba(255,90,90,0.1)' : 'var(--accent-fade)',
                    color: att.type === 'pdf' ? '#ff8888' : 'var(--accent-text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                  }}>
                    {att.type.toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: 12, color: 'var(--att-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {att.name}
                </span>
                <button
                  onClick={() => setAttachments(p => p.filter((_, j) => j !== i))}
                  style={{
                    position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                    borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: 'var(--att-rm-bg)', color: 'var(--t2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--del-hover-bg)'; e.currentTarget.style.color = 'var(--del-hover-text)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--att-rm-bg)'; e.currentTarget.style.color = 'var(--t2)'; }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input box */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--input-bg)',
            border: `1px solid ${focused ? 'var(--accent-ring)' : 'var(--input-ring)'}`,
            borderRadius: 18, padding: '8px 8px 8px 12px',
            boxShadow: focused ? '0 0 0 3px var(--accent-focus)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s, background 0.25s',
          }}
        >
          <input type="file" multiple ref={fileRef} onChange={handleFiles} style={{ display: 'none' }} />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Attach file"
            className="tap-target"
            style={{
              padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--t3)', flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--t2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
          >
            <Paperclip size={17} />
          </button>

          <textarea
            ref={textRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Message AB…"
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              resize: 'none', color: 'var(--input-text)', fontSize: 14, lineHeight: 1.65,
              maxHeight: 180, overflowY: 'auto', padding: '5px 0', fontFamily: 'inherit',
              transition: 'color 0.25s',
            }}
          />

          <div style={{ flexShrink: 0, marginBottom: 2 }}>
            {generating ? (
              <button
                onClick={onStop}
                title="Stop"
                className="tap-target"
                style={{
                  width: 38, height: 38, borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: 'var(--elevated)', color: 'var(--t1)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--divider-strong)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--elevated)'}
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!canSend}
                className="tap-target"
                style={{
                  width: 38, height: 38, borderRadius: 11, border: 'none',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                  background: canSend ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'var(--elevated)',
                  color: canSend ? 'white' : 'var(--t3)',
                  boxShadow: canSend ? '0 2px 14px var(--accent-glow)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--footer-note)', marginTop: 8, marginBottom: 4,transition: 'color 0.25s' }}>
          Responses from a local Ollama instance · Verify important information
        </div>
      </div>
    </div>
  );
}
