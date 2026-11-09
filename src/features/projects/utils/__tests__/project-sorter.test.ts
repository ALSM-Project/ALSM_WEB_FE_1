import { describe, it, expect } from 'vitest';
import { sortProjectsByDate } from '../project-sorter';
describe('project-sorter', () => { it('sorts projects by date descending', () => { const res = sortProjectsByDate([{ createdAt: '2026-01-01' }, { createdAt: '2026-02-01' }]); expect(res[0].createdAt).toBe('2026-02-01'); }); });
