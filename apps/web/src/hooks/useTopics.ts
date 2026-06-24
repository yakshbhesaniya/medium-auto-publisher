'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, TopicFilters, CreateTopicDto, UpdateTopicDto } from '@/lib/api';

export function useTopics(filters?: TopicFilters) {
  return useQuery({
    queryKey: ['topics', filters],
    queryFn: () => api.topics.list(filters),
    staleTime: 30 * 1000,
  });
}

export function useTopic(id: string) {
  return useQuery({
    queryKey: ['topics', id],
    queryFn: () => api.topics.get(id),
    enabled: !!id,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTopicDto) => api.topics.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Topic created successfully!');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to create topic');
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTopicDto }) =>
      api.topics.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Topic updated!');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to update topic');
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.topics.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Topic deleted');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to delete topic');
    },
  });
}

export function useApproveTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.topics.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Topic approved! ✅');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to approve topic');
    },
  });
}

export function useRejectTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.topics.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Topic rejected');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to reject topic');
    },
  });
}

export function useTriggerResearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.topics.triggerResearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Research triggered! 🔍 This may take a few minutes.');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to trigger research');
    },
  });
}

export function useTriggerGenerate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, opts }: { id: string; opts?: Record<string, unknown> }) =>
      api.topics.triggerGenerate(id, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog generation started! 🚀');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to generate blog');
    },
  });
}

export function useGenerateProposedBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, index, opts }: { id: string; index: number; opts?: Record<string, unknown> }) =>
      api.topics.generateProposed(id, index, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Proposed blog generation started! 🚀');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to generate proposed blog');
    },
  });
}
