'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache les données pendant 5 minutes (données fraîches)
        staleTime: 5 * 60 * 1000,
        // Garde les données en cache pendant 10 minutes (gcTime remplace cacheTime dans React Query v5)
        gcTime: 10 * 60 * 1000,
        // Ne pas refetch automatiquement quand la fenêtre reprend le focus
        refetchOnWindowFocus: false,
        // Retry 1 fois en cas d'erreur
        retry: 1,
        // Déduplication automatique des requêtes
        refetchOnMount: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools pour débugger le cache en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
