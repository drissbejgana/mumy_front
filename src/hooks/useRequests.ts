import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TransportRequest } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['requests'];

export function useRequests() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<TransportRequest[]>('/api/requests'),
    refetchInterval: 8000,
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: Omit<TransportRequest, 'id' | 'clientId' | 'clientName' | 'status' | 'createdAt'>) =>
      apiFetch<TransportRequest>('/api/requests', { method: 'POST', body: JSON.stringify(req) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// Transporter-side "direct lead": a booking taken off-platform, owned by the transporter
// from creation (the backend fills in transporterId and leaves clientId null).
export function useCreateDirectLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: Partial<TransportRequest> & { clientName: string }) =>
      apiFetch<TransportRequest>('/api/requests', { method: 'POST', body: JSON.stringify(req) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

// Post-dispatch edits to a mission: proof of delivery, attached paperwork, price, notes.
export function useUpdateRequestDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, updated }: { requestId: string; updated: Partial<TransportRequest> }) =>
      apiFetch<TransportRequest>(`/api/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify(updated),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAssignDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, driverId }: { requestId: string; driverId: string }) =>
      apiFetch<TransportRequest>(`/api/requests/${requestId}/assign-driver`, {
        method: 'PATCH',
        body: JSON.stringify({ driverId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: TransportRequest['status'] }) =>
      apiFetch<TransportRequest>(`/api/requests/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['finances'] });
    },
  });
}

export function useRateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      driverRating,
      driverComment,
      transporterRating,
      transporterComment,
    }: {
      requestId: string;
      driverRating: number;
      driverComment: string;
      transporterRating: number;
      transporterComment: string;
    }) =>
      apiFetch<TransportRequest>(`/api/requests/${requestId}/rating`, {
        method: 'POST',
        body: JSON.stringify({ driverRating, driverComment, transporterRating, transporterComment }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useFlagReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      apiFetch<TransportRequest>(`/api/requests/${requestId}/flag-review`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
