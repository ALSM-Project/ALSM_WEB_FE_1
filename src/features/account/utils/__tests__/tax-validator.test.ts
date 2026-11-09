import { describe, it, expect } from 'vitest';
import { isValidTaxId } from '../tax-validator';
describe('tax-validator', () => { it('validates 10-digit tax IDs', () => { expect(isValidTaxId('0101234567')).toBe(true); expect(isValidTaxId('invalid')).toBe(false); }); });
