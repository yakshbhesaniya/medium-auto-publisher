'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, BlogFilters, CreateBlogDto, UpdateBlogDto } from '@/lib/api';

export function useBlogs(filters?: BlogFilters) {
  return useQuery({
    queryKey: ['blogs', filters],
    queryFn: () => api.blogs.list(filters),
    staleTime: 30 * 1000,
  });
}

export function useBlog(id: string) {
  return useQuery({
    queryKey: ['blogs', id],
    queryFn: () => api.blogs.get(id),
    enabled: !!id,
  });
}

export function useCreateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBlogDto) => api.blogs.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog created!');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to create blog');
    },
  });
}

export function useUpdateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBlogDto }) =>
      api.blogs.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', id] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog saved!');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to save blog');
    },
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.blogs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog deleted');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to delete blog');
    },
  });
}

export function usePublishBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.blogs.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', id] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog published to Medium! 🎉');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to publish blog');
    },
  });
}

export function useScheduleBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      api.blogs.schedule(id, scheduledAt),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', id] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog scheduled! 📅');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to schedule blog');
    },
  });
}

export function useHumanizeBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.blogs.humanize(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', id] });
      toast.success('Content humanized! ✨');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to humanize content');
    },
  });
}

export function useGenerateImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.blogs.generateImage(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', id] });
      toast.success('Cover image generated! 🎨');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to generate image');
    },
  });
}

export function useBlogVersions(blogId: string) {
  return useQuery({
    queryKey: ['blogs', blogId, 'versions'],
    queryFn: () => api.blogs.getVersions(blogId),
    enabled: !!blogId,
  });
}

export function useRestoreVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ blogId, versionId }: { blogId: string; versionId: string }) =>
      api.blogs.restoreVersion(blogId, versionId),
    onSuccess: (_, { blogId }) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', blogId] });
      toast.success('Version restored!');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to restore version');
    },
  });
}
