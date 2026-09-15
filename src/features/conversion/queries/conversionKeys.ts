/** Query key factory for the conversion feature (FE guideline 02 §6.1). Keep all conversion query keys here so cache invalidation never relies on hand-typed arrays scattered across components. */
export const conversionKeys = {
  all: ['conversion'] as const,
  job: (projectId: string, screenId: string) => [...conversionKeys.all, 'job', projectId, screenId] as const,
  result: (jobId: string) => [...conversionKeys.all, 'result', jobId] as const,
  exportPreview: (projectId: string, config: unknown) =>
    [...conversionKeys.all, 'export-preview', projectId, config] as const,
};
