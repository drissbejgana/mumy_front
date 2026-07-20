import { useQuery } from '@tanstack/react-query';
import type { FinancialRecord } from '../types';
import { apiFetch } from '../lib/apiClient';

export function useFinances(enabled = true) {
  return useQuery({ queryKey: ['finances'], queryFn: () => apiFetch<FinancialRecord[]>('/api/finances'), enabled });
}
