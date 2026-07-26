import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Driver } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['drivers'];

export function useDrivers(enabled = true) {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch<Driver[]>('/api/drivers'), enabled });
}

// Resolves the Driver record linked to the logged-in driver account — fixes the original
// app's hardcoded `drivers.find(d => d.id === 'd-1')` lookup in DriverHub.
export function useMyDriver() {
  return useQuery({ queryKey: ['drivers', 'me'], queryFn: () => apiFetch<Driver>('/api/drivers/me') });
}

// A driver toggling their own availability. Separate from useUpdateDriver, which is the
// employing transporter editing an employee record they own.
export function useUpdateMyDriverStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isOnline: boolean) =>
      apiFetch<Driver>('/api/drivers/me', { method: 'PATCH', body: JSON.stringify({ isOnline }) }),
    onSuccess: (driver) => qc.setQueryData(['drivers', 'me'], driver),
  });
}

export function useAddDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driver: Omit<Driver, 'id' | 'transporterId'>) =>
      apiFetch<Driver>('/api/drivers', { method: 'POST', body: JSON.stringify(driver) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<Driver> }) =>
      apiFetch<Driver>(`/api/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(updated) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/drivers/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
