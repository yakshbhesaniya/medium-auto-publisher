'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.analytics.dashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useDashboardCharts() {
  return useQuery({
    queryKey: ['analytics', 'charts'],
    queryFn: () => api.analytics.charts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBlogAnalytics(blogId: string) {
  return useQuery({
    queryKey: ['analytics', 'blog', blogId],
    queryFn: () => api.analytics.blog(blogId),
    enabled: !!blogId,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: () => api.playlists.list(),
    staleTime: 60 * 1000,
  });
}

export function usePlaylist(id: string) {
  return useQuery({
    queryKey: ['playlists', id],
    queryFn: () => api.playlists.get(id),
    enabled: !!id,
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; description?: string }) =>
      api.playlists.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist created!');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to create playlist');
    },
  });
}

export function useUpdatePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { name?: string; description?: string } }) =>
      api.playlists.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist updated!');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to update playlist');
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.playlists.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist deleted');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to delete playlist');
    },
  });
}

export function useAddBlogToPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, blogId }: { playlistId: string; blogId: string }) =>
      api.playlists.addBlog(playlistId, blogId),
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', playlistId] });
      toast.success('Blog added to playlist!');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to add blog to playlist');
    },
  });
}

export function useRemoveBlogFromPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, blogId }: { playlistId: string; blogId: string }) =>
      api.playlists.removeBlog(playlistId, blogId),
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', playlistId] });
      toast.success('Blog removed from playlist');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to remove blog from playlist');
    },
  });
}

export function useReorderPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, orderedBlogIds }: { playlistId: string; orderedBlogIds: string[] }) =>
      api.playlists.reorder(playlistId, orderedBlogIds),
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ['playlists', playlistId] });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error?.message || 'Failed to reorder playlist');
    },
  });
}
