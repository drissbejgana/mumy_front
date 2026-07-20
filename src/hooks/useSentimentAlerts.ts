import { useQuery } from '@tanstack/react-query';
import type { SentimentAlert } from '../types';
import { apiFetch } from '../lib/apiClient';

export function useSentimentAlerts() {
  return useQuery({ queryKey: ['sentimentAlerts'], queryFn: () => apiFetch<SentimentAlert[]>('/api/sentiment-alerts') });
}
