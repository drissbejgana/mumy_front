import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExcursionBooking } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['excursionBookings'];

// Only transporter/admin accounts can list bookings server-side; callers on other roles
// should pass enabled: false (ClientHub receives this prop but never actually reads it).
export function useExcursionBookings(enabled = true) {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<ExcursionBooking[]>('/api/excursion-bookings'),
    enabled,
  });
}

export function useBookExcursion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (booking: Omit<ExcursionBooking, 'id' | 'status' | 'createdAt' | 'excursionTitle' | 'transporterId' | 'transporterName'>) =>
      apiFetch<ExcursionBooking>('/api/excursion-bookings', { method: 'POST', body: JSON.stringify(booking) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}
