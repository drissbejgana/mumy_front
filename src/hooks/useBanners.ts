import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdBanner } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['banners'];

export function useBanners() {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch<AdBanner[]>('/api/banners') });
}

export function useAddBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (banner: Omit<AdBanner, 'id' | 'spent' | 'impressions' | 'clicks' | 'createdAt'>) =>
      apiFetch<AdBanner>('/api/banners', { method: 'POST', body: JSON.stringify(banner) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<AdBanner> }) =>
      apiFetch<AdBanner>(`/api/banners/${id}`, { method: 'PATCH', body: JSON.stringify(updated) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/banners/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRegisterImpression() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<AdBanner>(`/api/banners/${id}/impression`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRegisterClick() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<AdBanner>(`/api/banners/${id}/click`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
