import React, { useState, useEffect } from 'react';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import './CommandPaletteModal.css';

export const CommandPaletteModal: React.FC = () => {
  const { isOpen, setIsOpen, query, setQuery, commands, loading } = useCommandPalette();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (commands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (commands.length || 1)) % (commands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (commands[selectedIndex]) {
        executeCommand(commands[selectedIndex]);
      }
    }
  };

  const executeCommand = (cmd: any) => {
    setIsOpen(false);
    if (cmd.action === 'navigate' && cmd.data?.path) {
      window.location.href = cmd.data.path;
    } else if (cmd.data?.route) {
      window.location.href = cmd.data.route;
    } else {
      alert(`Đã thực thi lệnh: ${cmd.label}`);
    }
  };

  return (
    <div className="command-palette-backdrop" onClick={() => setIsOpen(false)}>
      <div
        className="command-palette-modal"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="command-palette-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="command-palette-input"
            placeholder="Nhập lệnh hoặc từ khóa (ví dụ: BMS, Project, Billing, Upgrade)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="esc-badge">ESC</kbd>
        </div>

        <div className="command-palette-results">
          {loading && <div className="command-loading">Đang tìm kiếm...</div>}
          {!loading && commands.length === 0 && (
            <div className="command-empty">Không tìm thấy lệnh khớp với "{query}"</div>
          )}
          {!loading &&
            commands.map((cmd, index) => (
              <div
                key={cmd.id}
                className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-item-main">
                  <span className="command-category">{cmd.category}</span>
                  <div className="command-label">{cmd.label}</div>
                  {cmd.description && (
                    <div className="command-desc">{cmd.description}</div>
                  )}
                </div>
                {cmd.shortcut && (
                  <div className="command-shortcuts">
                    {cmd.shortcut.map(s => (
                      <kbd key={s}>{s}</kbd>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
