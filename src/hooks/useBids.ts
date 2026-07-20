import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Bid } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['bids'];

export function useBids() {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch<Bid[]>('/api/bids'), refetchInterval: 8000 });
}

export function useSubmitBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, priceDHS, vehicleType }: { requestId: string; priceDHS: number; vehicleType: string }) =>
      apiFetch<Bid>('/api/bids', { method: 'POST', body: JSON.stringify({ requestId, priceDHS, vehicleType }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAcceptBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bidId }: { bidId: string; requestId: string }) =>
      apiFetch(`/api/bids/${bidId}/accept`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}
