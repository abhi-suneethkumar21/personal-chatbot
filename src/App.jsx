import { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';

const OLLAMA_BASE = 'https://b818-2405-201-d01c-1085-8c73-7ef-c133-f30d.ngrok-free.app';
const STORAGE_KEY = 'ab_v1';
const ACTIVE_KEY = 'ab_active';
const SYSTEM_PROMPT =
  'You are an elite personal AI assistant. Help with work, coding, and personal tasks. ' +
  'Be highly analytical, direct, and conversational. Never hallucinate data. Avoid filler phrases.';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function newSession(model = 'llama3.1') {
  return { id: uid(), title: 'New Chat', model, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
}

function hydrate() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function persist(sessions) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); } catch (e) { console.warn('persist failed', e); }
}

export default function App() {
  const [sessions, setSessions] = useState(() => {
    const s = hydrate();
    return s.length ? s : [newSession()];
  });

  const [activeId, setActiveId] = useState(() => {
    const s = hydrate();
    if (!s.length) return null;
    const saved = localStorage.getItem(ACTIVE_KEY);
    return s.find(x => x.id === saved) ? saved : [...s].sort((a, b) => b.updatedAt - a.updatedAt)[0].id;
  });

  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('ab_theme') || 'dark');
  const abortRef = useRef(null);

  useEffect(() => { persist(sessions); }, [sessions]);
  useEffect(() => { if (activeId) localStorage.setItem(ACTIVE_KEY, activeId); }, [activeId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('ab_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(true); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Ensure activeId always points to a valid session
  useEffect(() => {
    if (sessions.length && !sessions.find(s => s.id === activeId)) {
      setActiveId(sessions[0].id);
    }
  }, [sessions, activeId]);

  const active = sessions.find(s => s.id === activeId) ?? sessions[0];

  const patch = useCallback((id, fn) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...fn(s), updatedAt: Date.now() } : s));
  }, []);

  const handleNew = () => {
    const s = newSession(active?.model);
    setSessions(prev => [s, ...prev]);
    setActiveId(s.id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDelete = (id) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (!next.length) {
        const fresh = newSession(active?.model);
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const handleModelChange = useCallback((model) => {
    if (active) patch(active.id, s => ({ ...s, model }));
  }, [active, patch]);

  const handleSend = async (text, attachments = []) => {
    if (!active || generating) return;
    setGenerating(true);
    const id = active.id;

    let content = text;
    attachments.filter(a => a.type !== 'image').forEach(a => {
      content += `\n\n--- ${a.name} ---\n${a.content}`;
    });
    const images = attachments.filter(a => a.type === 'image').map(a => a.data);

    const userMsg = { role: 'user', content, displayContent: text, ...(images.length && { images }) };
    const asstMsg = { role: 'assistant', content: '' };
    const isFirst = !active.messages.length;
    const title = isFirst ? text.slice(0, 60) + (text.length > 60 ? '…' : '') : null;
    const prevMsgs = [...active.messages];

    patch(id, s => ({ ...s, ...(title && { title }), messages: [...s.messages, userMsg, asstMsg] }));

    const apiMsgs = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...prevMsgs.map(({ role, content, images }) => ({ role, content, ...(images && { images }) })),
      { role: 'user', content, ...(images.length && { images }) },
    ];

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: active.model, messages: apiMsgs }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const { message } = JSON.parse(line);
            if (message?.content) {
              patch(id, s => {
                const msgs = [...s.messages];
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + message.content };
                return { ...s, messages: msgs };
              });
            }
          } catch (e) { void e; }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        patch(id, s => {
          const msgs = [...s.messages];
          msgs[msgs.length - 1] = {
            ...msgs[msgs.length - 1],
            content: `**Connection error:** ${e.message}\n\nMake sure your Ollama server is running and the model \`${active.model}\` is installed.`,
          };
          return { ...s, messages: msgs };
        });
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        sessions={sessions}
        activeId={active?.id}
        onSelect={(id) => { setActiveId(id); if (window.innerWidth < 768) setSidebarOpen(false); }}
        onNew={handleNew}
        onDelete={handleDelete}
        currentModel={active?.model ?? 'llama3.1'}
        onModelChange={handleModelChange}
        ollamaBase={OLLAMA_BASE}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <ChatWindow
          messages={active?.messages ?? []}
          generating={generating}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
          title={active?.title ?? 'New Chat'}
          model={active?.model ?? 'llama3.1'}
        />
        <ChatInput
          onSend={handleSend}
          generating={generating}
          onStop={() => abortRef.current?.abort()}
        />
      </div>
    </div>
  );
}
