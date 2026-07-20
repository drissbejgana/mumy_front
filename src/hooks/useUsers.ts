import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['users'];

export function useUsers() {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch<User[]>('/api/users') });
}

export function useAddUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (user: Omit<User, 'id'> & { password?: string }) =>
      apiFetch<User>('/api/users', {
        method: 'POST',
        body: JSON.stringify({ password: 'Mumy2026!Onboarding', ...user }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<User> }) =>
      apiFetch<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(updated) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useVerifyUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<User>(`/api/users/${id}/verify`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<User>(`/api/users/${id}/ban`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
