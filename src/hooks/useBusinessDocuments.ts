import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BusinessDocument } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['businessDocuments'];

// Totals (subtotal / TVA / TTC) and the document reference are computed server-side, so the
// caller only sends what the user actually filled in.
export type NewBusinessDocument = Omit<
  BusinessDocument,
  'id' | 'transporterId' | 'reference' | 'subtotal' | 'tvaAmount' | 'totalTtc' | 'status' | 'sharedWith' | 'createdAt'
>;

export function useBusinessDocuments(enabled = true) {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<BusinessDocument[]>('/api/business-documents'),
    enabled,
  });
}

export function useCreateBusinessDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (doc: NewBusinessDocument) =>
      apiFetch<BusinessDocument>('/api/business-documents', { method: 'POST', body: JSON.stringify(doc) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useShareBusinessDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sharedWith }: { id: string; sharedWith: string }) =>
      apiFetch<BusinessDocument>(`/api/business-documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'shared', sharedWith }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
