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

type MaintenanceLog = NonNullable<Vehicle['maintenanceLogs']>[number];
type FuelLog = NonNullable<Vehicle['fuelLogs']>[number];

// Dedicated append endpoints. Re-sending the whole log array through PATCH (as the fleet
// forms used to) rewrites every subdocument on each save and loses concurrent entries.
export function useAddMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, log }: { vehicleId: string; log: Omit<MaintenanceLog, 'id'> }) =>
      apiFetch<Vehicle>(`/api/vehicles/${vehicleId}/maintenance-logs`, {
        method: 'POST',
        body: JSON.stringify(log),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAddFuelLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, log }: { vehicleId: string; log: Omit<FuelLog, 'id'> }) =>
      apiFetch<Vehicle>(`/api/vehicles/${vehicleId}/fuel-logs`, {
        method: 'POST',
        body: JSON.stringify(log),
      }),
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
