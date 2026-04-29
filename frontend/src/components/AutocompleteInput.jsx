import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * AutocompleteInput
 * Props:
 *   - value         : current string value
 *   - onChange      : (newValue: string) => void
 *   - suggestions   : string[]   — full list to filter from
 *   - placeholder   : string
 *   - id            : string
 */
export default function AutocompleteInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Type to search...',
  id = 'autocomplete-input',
}) {
  const [open, setOpen]           = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef              = useRef(null);
  const inputRef                  = useRef(null);

  // Filtered + ranked suggestions
  const filtered = useCallback(() => {
    if (!value || value.trim().length < 1) return [];
    const q = value.toLowerCase();
    return suggestions
      .filter(s => s.toLowerCase().includes(q))
      .sort((a, b) => {
        // Prefer names that START with the query
        const aStarts = a.toLowerCase().startsWith(q);
        const bStarts = b.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts)  return 1;
        return a.localeCompare(b);
      })
      .slice(0, 8);
  }, [value, suggestions]);

  const matches = filtered();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Open dropdown whenever there are matches
  useEffect(() => {
    setOpen(matches.length > 0);
    setActiveIdx(-1);
  }, [value]);

  const select = (name) => {
    onChange(name);
    setOpen(false);
    setActiveIdx(-1);
    inputRef.current?.blur();
  };

  const handleKey = (e) => {
    if (!open || !matches.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      select(matches[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  // Highlight the matching part of text
  const highlight = (text, query) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{
          background: 'rgba(59,130,246,0.25)',
          color: '#93c5fd',
          borderRadius: 3,
          padding: '0 1px',
          fontWeight: 700,
        }}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input */}
      <input
        ref={inputRef}
        id={id}
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={e => onChange(e.target.value)}
        onFocus={() => matches.length > 0 && setOpen(true)}
        onKeyDown={handleKey}
        style={{
          paddingRight: 36,
          borderColor: open ? 'var(--accent-blue)' : undefined,
          boxShadow: open ? '0 0 0 3px rgba(59,130,246,0.15)' : undefined,
        }}
      />

      {/* Search icon */}
      <span style={{
        position: 'absolute', right: 12, top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-muted)', fontSize: '0.9rem',
        pointerEvents: 'none',
      }}>
        🔍
      </span>

      {/* Dropdown */}
      {open && matches.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0, right: 0,
          background: 'rgba(10,14,26,0.98)',
          border: '1px solid rgba(59,130,246,0.35)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)',
          backdropFilter: 'blur(20px)',
          zIndex: 500,
          overflow: 'hidden',
          animation: 'fadeUp 0.15s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '8px 14px 6px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              {matches.length} suggestion{matches.length !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              ↑↓ navigate · ↵ select · esc close
            </span>
          </div>

          {/* Items */}
          {matches.map((name, i) => (
            <div
              key={name}
              onMouseDown={(e) => { e.preventDefault(); select(name); }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: i === activeIdx ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: i === activeIdx
                  ? 'rgba(59,130,246,0.12)'
                  : 'transparent',
                borderLeft: i === activeIdx
                  ? '2px solid var(--accent-blue)'
                  : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 0.1s, border-color 0.1s',
              }}
            >
              <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>🏢</span>
              <span>{highlight(name, value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
