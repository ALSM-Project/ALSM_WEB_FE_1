export const sessionKeys = {
  root: ['sessions'] as const,
  byUser: (userId: string) => ['sessions', userId] as const,
};
