import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Menu, PanelLeftClose, Copy, Check, Zap, Code2, FileText, Lightbulb, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  { icon: Code2,      label: 'Write code',  hint: 'Build a component, script, or query',       color: 'var(--accent)'  },
  { icon: FileText,   label: 'Summarize',   hint: 'Paste text or upload a file to digest',      color: 'var(--accent2)' },
  { icon: Lightbulb,  label: 'Brainstorm',  hint: 'Generate ideas for projects or problems',   color: '#f7b55d'         },
  { icon: BarChart2,  label: 'Analyze',     hint: 'Interpret data, results, or patterns',       color: '#5df7b5'         },
];

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-lang">{language}</span>
        <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copy}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="syntax-scroll">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          PreTag="div"
          customStyle={{ margin: 0, background: 'transparent', padding: '1rem 1.2rem', fontSize: '0.84em', lineHeight: 1.65 }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

const mdComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match) {
      return <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />;
    }
    return <code className={className} {...props}>{children}</code>;
  },
};

function UserMessage({ msg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        maxWidth: '72%',
        background: 'var(--user-bg)',
        border: '1px solid var(--user-ring)',
        borderRadius: '18px 18px 5px 18px',
        padding: '11px 16px',
        fontSize: 14, lineHeight: 1.7,
        color: 'var(--user-text)',
        wordBreak: 'break-word', whiteSpace: 'pre-wrap',
        transition: 'background 0.25s, border-color 0.25s, color 0.25s',
      }}>
        {msg.displayContent ?? msg.content}
        {msg.images?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {msg.images.map((img, i) => (
              <img key={i} src={`data:image/png;base64,${img}`} alt=""
                style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssistantMessage({ msg, streaming }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginTop: 2,
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 10px var(--accent-glow)',
      }}>
        <Zap size={12} style={{ color: 'white' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--asst-name)', marginBottom: 8, letterSpacing: '0.02em' }}>
          Assistant
        </div>
        <div className="chat-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {msg.content}
          </ReactMarkdown>
          {streaming && msg.content && <span className="typing-cursor" />}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 10px var(--accent-glow)',
      }}>
        <Zap size={12} style={{ color: 'white' }} />
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', paddingTop: 2 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="dot-pulse"
            style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--dot)' }} />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({ icon: Icon, label, hint, color }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--suggest-hbg)' : 'var(--suggest-bg)',
        border: `1px solid ${hovered ? color : 'var(--suggest-border)'}`,
        borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
        textAlign: 'left', transition: 'all 0.18s',
        opacity: hovered ? 1 : 0.85,
      }}
    >
      <Icon size={17} style={{ color, marginBottom: 9 }} />
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--suggest-text)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: 'var(--suggest-hint)', lineHeight: 1.45 }}>{hint}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 580, textAlign: 'center' }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 18, margin: '0 auto 1.5rem',
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 48px var(--accent-glow)',
        }}>
          <Zap size={24} style={{ color: 'white' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--empty-title)', margin: '0 0 0.4rem', letterSpacing: '-0.03em' }}>
          What can I help you with?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--empty-sub)', margin: '0 0 2rem' }}>
          Ask anything, or try one of the suggestions below
        </p>
        <div className="suggest-grid">
          {SUGGESTIONS.map(s => <SuggestionCard key={s.label} {...s} />)}
        </div>
      </motion.div>
    </div>
  );
}

export default function ChatWindow({ messages, generating, sidebarOpen, onToggleSidebar, title, model }) {
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, generating]);

  const showTyping = generating
    && messages.length > 0
    && messages[messages.length - 1].role === 'assistant'
    && messages[messages.length - 1].content === '';

  const isEmpty = messages.length === 0 && !generating;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', background: 'var(--bg)', transition: 'background 0.25s ease' }}>

      {/* Header */}
      <div style={{
        height: 52, display: 'flex', alignItems: 'center', padding: '0 14px',
        borderBottom: '1px solid var(--divider)',
        background: 'var(--header-bg)', backdropFilter: 'blur(12px)',
        flexShrink: 0, zIndex: 10, gap: 10,
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}>
        <button
          onClick={onToggleSidebar}
          className="tap-target"
          style={{
            padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--toggle-color)',
            flexShrink: 0, transition: 'all 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--toggle-hover)'; e.currentTarget.style.color = 'var(--toggle-hover-c)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--toggle-color)'; }}
        >
          {sidebarOpen ? <PanelLeftClose size={17} /> : <Menu size={17} />}
        </button>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--header-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </div>
        </div>

        <div
          className="model-pill-header"
          style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
            color: 'var(--pill-text)',
            background: 'var(--pill-bg)', border: '1px solid var(--pill-border)',
            borderRadius: 99, padding: '3px 10px',
            whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0,
            transition: 'background 0.25s, color 0.25s, border-color 0.25s',
          }}>
          {model}
        </div>
      </div>

      {/* Body */}
      {isEmpty ? (
        <EmptyState />
      ) : (
        <div ref={scrollContainerRef} className="scroll-touch" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1rem 0.5rem' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const isLastAsst = i === messages.length - 1 && msg.role === 'assistant';
                const streaming  = isLastAsst && generating;
                if (isLastAsst && msg.content === '' && generating) return null;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {msg.role === 'user'
                      ? <UserMessage msg={msg} />
                      : <AssistantMessage msg={msg} streaming={streaming} />
                    }
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {showTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <TypingIndicator />
              </motion.div>
            )}

            <div style={{ height: 4 }} />
          </div>
        </div>
      )}
    </div>
  );
}
