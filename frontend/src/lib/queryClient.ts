import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 seconds — no refetch on window focus/remount during this period.
      staleTime: 30_000,
      // Keep unused query data in cache for 5 minutes before garbage collecting.
      gcTime: 5 * 60_000,
      // On error, retry once before surfacing the error to the UI.
      retry: 1,
      // Do not refetch just because the window regained focus (too aggressive for an ERP).
      refetchOnWindowFocus: false,
    },
  },
});
