import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api/apiClient';
import { CommandItem } from '../features/menus/types/menu';

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [commands, setCommands] = useState<CommandItem[]>([]);
  const [loading, setLoading] = useState(false);

  const searchCommands = useCallback(async (q: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: CommandItem[] }>(
        `/commands/search?q=${encodeURIComponent(q)}`,
      );
      if (response && response.data) {
        setCommands(response.data);
      }
    } catch (err) {
      console.error('Failed to search commands:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      searchCommands(query);
    }
  }, [isOpen, query, searchCommands]);

  // Global Keyboard Listener for Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    commands,
    loading,
    searchCommands,
  };
}
