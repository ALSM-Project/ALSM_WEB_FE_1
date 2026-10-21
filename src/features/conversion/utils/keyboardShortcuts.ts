/**
 * Helper to handle keyboard shortcuts for code modernization workflow.
 */
export interface ShortcutAction {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
}

export function handleWorkflowKeyboardShortcut(
  event: KeyboardEvent,
  shortcuts: ShortcutAction[],
): boolean {
  for (const shortcut of shortcuts) {
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
    const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : true;
    const altMatch = shortcut.altKey ? event.altKey : true;
    const shiftMatch = shortcut.shiftKey ? event.shiftKey : true;

    if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
      event.preventDefault();
      shortcut.action();
      return true;
    }
  }
  return false;
}
