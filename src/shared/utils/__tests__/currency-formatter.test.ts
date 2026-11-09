import { describe, it, expect } from 'vitest';
import { formatCurrencyVND } from '../currency-formatter';
describe('formatCurrencyVND', () => { it('formats VND currency amounts', () => { expect(formatCurrencyVND(5000000)).toContain('₫'); }); });
