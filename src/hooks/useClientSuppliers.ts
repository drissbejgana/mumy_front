import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClientSupplier } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['clientSuppliers'];

export function useClientSuppliers(enabled = true) {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<ClientSupplier[]>('/api/client-suppliers'),
    enabled,
  });
}

export function useAddClientSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partner: Omit<ClientSupplier, 'id' | 'transporterId'>) =>
      apiFetch<ClientSupplier>('/api/client-suppliers', { method: 'POST', body: JSON.stringify(partner) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateClientSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<ClientSupplier> }) =>
      apiFetch<ClientSupplier>(`/api/client-suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(updated) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteClientSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/client-suppliers/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
