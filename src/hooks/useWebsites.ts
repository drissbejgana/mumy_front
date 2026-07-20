import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TransporterWebsite } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['websites'];

export function useWebsites() {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch<TransporterWebsite[]>('/api/websites') });
}

export function useUpdateWebsite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ transporterId, updated }: { transporterId: string; updated: Partial<TransporterWebsite> }) =>
      apiFetch<TransporterWebsite>(`/api/websites/${transporterId}`, { method: 'PUT', body: JSON.stringify(updated) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
