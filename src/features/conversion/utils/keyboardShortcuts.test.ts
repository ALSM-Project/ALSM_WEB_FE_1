import { describe, it, expect, vi } from 'vitest';
import { handleWorkflowKeyboardShortcut } from './keyboardShortcuts';

describe('handleWorkflowKeyboardShortcut', () => {
  it('triggers registered shortcut action when keys match', () => {
    const actionMock = vi.fn();
    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });

    const handled = handleWorkflowKeyboardShortcut(event, [
      { key: 's', ctrlKey: true, description: 'Save code', action: actionMock },
    ]);

    expect(handled).toBe(true);
    expect(actionMock).toHaveBeenCalledTimes(1);
  });

  it('ignores unregistered keys', () => {
    const actionMock = vi.fn();
    const event = new KeyboardEvent('keydown', { key: 'x' });

    const handled = handleWorkflowKeyboardShortcut(event, [
      { key: 's', ctrlKey: true, description: 'Save code', action: actionMock },
    ]);

    expect(handled).toBe(false);
    expect(actionMock).not.toHaveBeenCalled();
  });
});
