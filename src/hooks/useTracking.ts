import { useQuery } from '@tanstack/react-query';
import type { PublicTrackingView } from '../types';
import { apiFetch } from '../lib/apiClient';

// The redacted mission view behind the public ?track= page. Clients read their own mission's
// driver and vehicle through it: /api/drivers is transporter/admin-only, and a client has no
// other way to learn who is actually coming to pick them up.
export function useMissionTracking(requestId: string, enabled = true) {
  return useQuery({
    queryKey: ['tracking', requestId],
    queryFn: () => apiFetch<PublicTrackingView>(`/api/track/${requestId}`),
    enabled: enabled && Boolean(requestId),
    refetchInterval: 15000,
  });
}
