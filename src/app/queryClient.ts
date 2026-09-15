import { QueryClient } from '@tanstack/react-query';

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
};

export const queryClient = new QueryClient(queryClientConfig);
