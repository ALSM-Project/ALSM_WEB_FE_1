export const validationKeys = {
  all: ['validation'] as const,
  runs: (projectId: string, conversionJobId: string) =>
    [...validationKeys.all, 'runs', projectId, conversionJobId] as const,
  run: (projectId: string, validationRunId: string) =>
    [...validationKeys.all, 'run', projectId, validationRunId] as const,
  findings: (projectId: string, validationRunId: string) =>
    [...validationKeys.all, 'findings', projectId, validationRunId] as const,
};
