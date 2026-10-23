import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { toast } from '@/shared/ui';
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
      toast.info(`Executed command: ${cmd.label}`);
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
          <Search className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            type="text"
            className="command-palette-input"
            placeholder="Type a command or keyword (e.g. BMS, Project, Mapping, Convert)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="esc-badge">ESC</kbd>
        </div>

        {loading ? (
          <div className="command-palette-empty">Searching...</div>
        ) : commands.length === 0 ? (
          <div className="command-palette-empty">No matching command found</div>
        ) : (
          <ul className="command-palette-list">
            {commands.map((cmd, idx) => (
              <li
                key={cmd.id}
                className={`command-palette-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="command-item-main">
                  <span className="command-item-label">{cmd.label}</span>
                  {cmd.description && <span className="command-item-desc">{cmd.description}</span>}
                </div>
                {cmd.category && <span className="command-item-category">{cmd.category}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
