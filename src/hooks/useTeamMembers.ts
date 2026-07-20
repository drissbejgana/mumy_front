import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TeamMember } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['teamMembers'];

export function useTeamMembers(enabled = true) {
  return useQuery({ queryKey: KEY, queryFn: () => apiFetch<TeamMember[]>('/api/team-members'), enabled });
}

export function useAddTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (member: Omit<TeamMember, 'id' | 'transporterId'>) =>
      apiFetch<TeamMember>('/api/team-members', { method: 'POST', body: JSON.stringify(member) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updated }: { id: string; updated: Partial<TeamMember> }) =>
      apiFetch<TeamMember>(`/api/team-members/${id}`, { method: 'PATCH', body: JSON.stringify(updated) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/team-members/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
