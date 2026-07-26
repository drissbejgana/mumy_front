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

// Stable id for a one-to-one thread: both participants derive the same value, and the
// backend checks the caller is one of the two before serving it.
export function directThreadId(userIdA: string, userIdB: string): string {
  return `dm:${[userIdA, userIdB].sort().join(':')}`;
}

export function useThreadChats(threadId: string | null) {
  return useQuery({
    queryKey: ['chats', threadId],
    queryFn: () => apiFetch<ChatMessage[]>(`/api/chats?threadId=${encodeURIComponent(threadId!)}`),
    enabled: Boolean(threadId),
    refetchInterval: 8000,
  });
}

export function useSendThreadMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, message }: { threadId: string; message: string }) =>
      apiFetch<ChatMessage>('/api/chats', { method: 'POST', body: JSON.stringify({ message, threadId }) }),
    onSuccess: (_data, { threadId }) => qc.invalidateQueries({ queryKey: ['chats', threadId] }),
  });
}
