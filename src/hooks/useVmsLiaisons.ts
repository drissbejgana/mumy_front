import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VmsLiaison } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['vmsLiaisons'];

export function useVmsLiaisons(enabled = true) {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<VmsLiaison[]>('/api/vms-liaisons'),
    enabled,
  });
}

export function useAddVmsLiaison() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (liaison: Omit<VmsLiaison, 'id' | 'transporterId'>) =>
      apiFetch<VmsLiaison>('/api/vms-liaisons', { method: 'POST', body: JSON.stringify(liaison) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteVmsLiaison() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/vms-liaisons/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
