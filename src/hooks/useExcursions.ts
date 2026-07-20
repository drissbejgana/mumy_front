import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Excursion } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['excursions'];

export function useExcursions() {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch<Excursion[]>('/api/excursions') });
}

export function useAddExcursion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exc: Omit<Excursion, 'id' | 'transporterId' | 'transporterName'>) =>
      apiFetch<Excursion>('/api/excursions', { method: 'POST', body: JSON.stringify(exc) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateExcursion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<Excursion> }) =>
      apiFetch<Excursion>(`/api/excursions/${id}`, { method: 'PATCH', body: JSON.stringify(updated) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteExcursion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/excursions/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
