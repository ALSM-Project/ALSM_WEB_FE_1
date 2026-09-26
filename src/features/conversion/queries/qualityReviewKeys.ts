export const qualityReviewKeys = {
  all: ['quality-reviews'] as const,
  byJob: (projectId: string, conversionJobId: string) =>
    [...qualityReviewKeys.all, projectId, conversionJobId] as const,
};
