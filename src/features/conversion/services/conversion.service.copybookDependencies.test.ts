import { describe, it, expect, vi } from 'vitest';
import type { ProgramAnalysis } from '@/features/screens/types/copybookDependency';
import { ConversionService } from './conversion.service';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/services/api/apiClient', () => ({
  apiClient: { get: mocks.get },
}));

describe('ConversionService.getCopybookDependencies', () => {
  it('calls the real backend endpoint and returns the analysis as-is (no mock fallback)', async () => {
    const analysis: ProgramAnalysis = {
      program: 'CBACT01C.cbl',
      status: 'BLOCKED',
      dependencies: [{ copyName: 'ACCTFILE-STATUS', status: 'MISSING' }],
    };
    mocks.get.mockResolvedValue(analysis);

    const result = await new ConversionService().getCopybookDependencies('scr-1');

    expect(mocks.get).toHaveBeenCalledWith('/screens/scr-1/copybook-dependencies');
    expect(result).toEqual(analysis);
  });

  it('propagates a real request failure instead of swallowing it', async () => {
    mocks.get.mockRejectedValue(new Error('network down'));

    await expect(new ConversionService().getCopybookDependencies('scr-1')).rejects.toThrow('network down');
  });
});
