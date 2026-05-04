import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, ChevronDown, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function groupSessions(sessions) {
  const now = Date.now();
  const D = 86400000;
  const groups = [
    { key: 'today',     label: 'Today',       items: [] },
    { key: 'yesterday', label: 'Yesterday',    items: [] },
    { key: 'week',      label: 'Past 7 days',  items: [] },
    { key: 'older',     label: 'Older',        items: [] },
  ];
  [...sessions].sort((a, b) => b.updatedAt - a.updatedAt).forEach(s => {
    const age = now - s.updatedAt;
    if      (age < D)     groups[0].items.push(s);
    else if (age < 2 * D) groups[1].items.push(s);
    else if (age < 7 * D) groups[2].items.push(s);
    else                  groups[3].items.push(s);
  });
  return groups.filter(g => g.items.length > 0);
}

function IconBtn({ onClick, title, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`tap-target ${className}`}
      style={{
        padding: 5, borderRadius: 7, border: 'none', cursor: 'pointer',
        background: 'transparent', color: 'var(--theme-btn)',
        transition: 'background 0.15s, color 0.15s',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-btn-hover)'; e.currentTarget.style.color = 'var(--theme-btn-hc)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--theme-btn)'; }}
    >
      {children}
    </button>
  );
}

export default function Sidebar({ open, onToggle, sessions, activeId, onSelect, onNew, onDelete, currentModel, onModelChange, ollamaBase, theme, onToggleTheme }) {
  const [models, setModels]     = useState([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [hoverId, setHoverId]   = useState(null);

  useEffect(() => {
    fetch(`${ollamaBase}/api/tags`)
      .then(r => r.json())
      .then(d => setModels((d.models ?? []).map(m => m.name)))
      .catch(() => setModels([currentModel]));
  }, [ollamaBase, currentModel]);

  const groups = groupSessions(sessions);
  const displayModels = models.length ? models : [currentModel];

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'var(--backdrop)', zIndex: 20, backdropFilter: 'blur(4px)' }}
            className="md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: open ? 252 : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--divider)',
          flexShrink: 0, overflow: 'hidden',
          zIndex: 30, position: 'relative',
          transition: 'background 0.25s ease',
        }}
        className="fixed md:relative h-full"
      >
        <div style={{ width: 252, height: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* Brand row */}
          <div style={{ padding: '13px 12px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px var(--accent-glow)',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 9h8" />
                <path d="M8 13h6" />
                <path d="M13 18l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v5.5" />
                <path d="M19 16l-2 3h4l-2 3" />
              </svg>
            </div>

            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em', flex: 1 }}>
              AB
            </span>

            {/* Theme toggle */}
            <IconBtn onClick={onToggleTheme} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </IconBtn>

            {/* Mobile close */}
            <IconBtn onClick={onToggle} title="Close sidebar" className="md:hidden">
              <X size={15} />
            </IconBtn>
          </div>

          {/* New chat */}
          <div style={{ padding: '0 10px 8px' }}>
            <button
              onClick={onNew}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 10,
                border: '1px solid var(--new-chat-border)',
                background: 'var(--new-chat-bg)', color: 'var(--new-chat-text)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--new-chat-hover)'; e.currentTarget.style.color = 'var(--new-chat-htext)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--new-chat-bg)'; e.currentTarget.style.color = 'var(--new-chat-text)'; }}
            >
              <Plus size={15} />
              New chat
            </button>
          </div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 8px' }}>
            {groups.map(group => (
              <div key={group.key} style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--t3)',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '4px 8px 6px',
                }}>
                  {group.label}
                </div>

                {group.items.map(s => {
                  const isActive = s.id === activeId;
                  const isHover  = hoverId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => onSelect(s.id)}
                      onMouseEnter={() => setHoverId(s.id)}
                      onMouseLeave={() => setHoverId(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        padding: '8px 10px', borderRadius: 9, cursor: 'pointer',
                        background: isActive ? 'var(--session-active)' : isHover ? 'var(--session-hover)' : 'transparent',
                        transition: 'background 0.12s',
                        marginBottom: 1,
                      }}
                    >
                      <MessageSquare
                        size={13}
                        style={{ color: isActive ? 'var(--session-icon-active)' : 'var(--session-icon)', flexShrink: 0 }}
                      />
                      <span style={{
                        fontSize: 13, flex: 1, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: isActive ? 'var(--session-text-active)' : 'var(--session-text)',
                      }}>
                        {s.title}
                      </span>

                      {(isHover || isActive) && (
                        <button
                          onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                          style={{
                            flexShrink: 0, padding: 4, borderRadius: 6, border: 'none',
                            background: 'transparent', cursor: 'pointer',
                            color: 'var(--t3)', display: 'flex',
                            transition: 'background 0.12s, color 0.12s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--del-hover-bg)'; e.currentTarget.style.color = 'var(--del-hover-text)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)'; }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {sessions.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--t3)', fontSize: 12, padding: '2rem 1rem' }}>
                No chats yet
              </div>
            )}
          </div>

          {/* Model selector */}
          <div style={{ padding: 10, borderTop: '1px solid var(--divider)' }}>
            <div
              onClick={() => setModelOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                borderRadius: 10, cursor: 'pointer',
                background: 'var(--model-sel-bg)', border: '1px solid var(--model-sel-border)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--session-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--model-sel-bg)'}
            >
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: 'var(--online)', boxShadow: '0 0 6px var(--online-glow)',
              }} />
              <span style={{
                fontSize: 12, fontWeight: 500, color: 'var(--model-sel-text)',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {currentModel}
              </span>
              <ChevronDown
                size={13}
                style={{
                  color: 'var(--t3)', flexShrink: 0,
                  transform: modelOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            </div>

            <AnimatePresence>
              {modelOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  style={{
                    marginTop: 6, borderRadius: 10, overflow: 'hidden',
                    background: 'var(--model-dd-bg)',
                    border: '1px solid var(--model-dd-border)',
                    boxShadow: 'var(--model-dd-shadow)',
                  }}
                >
                  {displayModels.map(m => {
                    const isSelected = m === currentModel;
                    return (
                      <div
                        key={m}
                        onClick={() => { onModelChange(m); setModelOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 12px', cursor: 'pointer', fontSize: 12,
                          color: isSelected ? 'var(--model-opt-active)' : 'var(--model-opt-text)',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--model-opt-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                          background: isSelected ? 'var(--model-dot-on)' : 'transparent',
                          border: isSelected ? 'none' : '1px solid var(--model-dot-off)',
                        }} />
                        {m}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
