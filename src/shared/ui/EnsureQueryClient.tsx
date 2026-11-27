import React, { useContext, useState } from 'react';
import { QueryClientContext, QueryClientProvider, QueryClient } from '@tanstack/react-query';

export const EnsureQueryClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const client = useContext(QueryClientContext);
  const [localClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
        },
      })
  );

  if (!client) {
    return <QueryClientProvider client={localClient}>{children}</QueryClientProvider>;
  }
  return <>{children}</>;
};
