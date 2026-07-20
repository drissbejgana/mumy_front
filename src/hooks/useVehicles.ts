import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Vehicle } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['vehicles'];

export function useVehicles(enabled = true) {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch<Vehicle[]>('/api/vehicles'), enabled });
}

export function useAddVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vehicle: Omit<Vehicle, 'id' | 'transporterId'>) =>
      apiFetch<Vehicle>('/api/vehicles', { method: 'POST', body: JSON.stringify(vehicle) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<Vehicle> }) =>
      apiFetch<Vehicle>(`/api/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(updated) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/vehicles/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
