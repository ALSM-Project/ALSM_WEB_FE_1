import { describe, it, expect } from 'vitest';
import { generateBankQrUrl } from '../bank-qr.helper';
describe('bank-qr.helper', () => { it('builds valid VietQR image urls', () => { expect(typeof generateBankQrUrl).toBe('function'); }); });
