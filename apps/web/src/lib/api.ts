import axios from 'axios';
import Cookies from 'js-cookie';

export * from '@medium-publisher/types';

export interface BlogFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  mode?: string;
  tone?: string;
}

export interface TopicFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  isTrending?: boolean;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const api = {
  auth: {
    login: async (dto: any) => (await apiClient.post('/auth/login', dto)).data,
    register: async (dto: any) => (await apiClient.post('/auth/register', dto)).data,
    me: async () => (await apiClient.get('/auth/me')).data,
  },
  topics: {
    list: async (params?: any) => (await apiClient.get('/topics', { params })).data,
    get: async (id: string) => (await apiClient.get(`/topics/${id}`)).data,
    create: async (dto: any) => (await apiClient.post('/topics', dto)).data,
    update: async (id: string, dto: any) => (await apiClient.patch(`/topics/${id}`, dto)).data,
    delete: async (id: string) => (await apiClient.delete(`/topics/${id}`)).data,
    approve: async (id: string) => (await apiClient.patch(`/topics/${id}/approve`)).data,
    reject: async (id: string) => (await apiClient.patch(`/topics/${id}/reject`)).data,
    triggerResearch: async (id: string) => (await apiClient.post(`/topics/${id}/research`)).data,
    triggerGenerate: async (id: string, opts?: any) => (await apiClient.post(`/topics/${id}/generate`, opts)).data,
    generateProposed: async (id: string, index: number, opts?: any) => (await apiClient.post(`/topics/${id}/generate-proposed`, { proposedBlogIndex: index, ...opts })).data,
  },
  blogs: {
    list: async (params?: any) => (await apiClient.get('/blogs', { params })).data,
    get: async (id: string) => (await apiClient.get(`/blogs/${id}`)).data,
    create: async (dto: any) => (await apiClient.post('/blogs', dto)).data,
    update: async (id: string, dto: any) => (await apiClient.patch(`/blogs/${id}`, dto)).data,
    delete: async (id: string) => (await apiClient.delete(`/blogs/${id}`)).data,
    getVersions: async (id: string) => (await apiClient.get(`/blogs/${id}/versions`)).data,
    restoreVersion: async (id: string, versionId: string) => (await apiClient.post(`/blogs/${id}/versions/${versionId}/restore`)).data,
    publish: async (id: string) => (await apiClient.post(`/blogs/${id}/publish`)).data,
    schedule: async (id: string, scheduledAt: string) => (await apiClient.post(`/blogs/${id}/schedule`, { scheduledAt })).data,
    humanize: async (id: string) => (await apiClient.post(`/blogs/${id}/humanize`)).data,
    generateImage: async (id: string) => (await apiClient.post(`/blogs/${id}/generate-image`)).data,
  },
  playlists: {
    list: async () => (await apiClient.get('/playlists')).data,
    get: async (id: string) => (await apiClient.get(`/playlists/${id}`)).data,
    create: async (dto: any) => (await apiClient.post('/playlists', dto)).data,
    update: async (id: string, dto: any) => (await apiClient.patch(`/playlists/${id}`, dto)).data,
    delete: async (id: string) => (await apiClient.delete(`/playlists/${id}`)).data,
    addBlog: async (id: string, blogId: string) => (await apiClient.post(`/playlists/${id}/blogs`, { blogId })).data,
    removeBlog: async (id: string, blogId: string) => (await apiClient.delete(`/playlists/${id}/blogs/${blogId}`)).data,
    reorder: async (id: string, orderedBlogIds: string[]) => (await apiClient.patch(`/playlists/${id}/reorder`, { orderedBlogIds })).data,
  },
  analytics: {
    dashboard: async () => (await apiClient.get('/analytics/dashboard')).data,
    charts: async () => (await apiClient.get('/analytics/dashboard/charts')).data,
    blog: async (id: string) => (await apiClient.get(`/analytics/blogs/${id}`)).data,
  },
  users: {
    updateMediumToken: async (token: string) => (await apiClient.patch('/users/me/medium-token', { mediumToken: token })).data,
  }
};

export default apiClient;
