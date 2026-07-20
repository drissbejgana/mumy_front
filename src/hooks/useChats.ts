import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatMessage } from '../types';
import { apiFetch } from '../lib/apiClient';

const KEY = ['chats', 'public'];

export function useCollabChats() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<ChatMessage[]>('/api/chats?threadId=public'),
    refetchInterval: 8000,
  });
}

export function useSendCollabMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      apiFetch<ChatMessage>('/api/chats', { method: 'POST', body: JSON.stringify({ message, threadId: 'public' }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
