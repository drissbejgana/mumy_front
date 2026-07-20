import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EmptyReturn } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['emptyReturns'];

export function useEmptyReturns() {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch<EmptyReturn[]>('/api/empty-returns'), refetchInterval: 8000 });
}

export function usePublishEmptyReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ret: Omit<EmptyReturn, 'id' | 'transporterId' | 'transporterName' | 'status' | 'createdAt'>) =>
      apiFetch<EmptyReturn>('/api/empty-returns', { method: 'POST', body: JSON.stringify(ret) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useBookEmptyReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/empty-returns/${id}/book`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['finances'] });
    },
  });
}
