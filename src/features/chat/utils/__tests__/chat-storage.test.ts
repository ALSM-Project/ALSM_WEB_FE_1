import { describe, it, expect } from 'vitest';
import { saveChatDraft, getChatDraft } from '../chat-storage';
describe('chat-storage', () => { it('saves and retrieves chat drafts', () => { saveChatDraft('test'); expect(getChatDraft()).toBe('test'); }); });
