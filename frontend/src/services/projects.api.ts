import { api } from './api';
import type { ApiListResponse, ApiSuccess, ListParams, Project, ProjectStatus } from '@/types/api';

export type CreateProjectPayload = {
  key: string;
  name: string;
  description?: string | null;
};

export type UpdateProjectPayload = Partial<Pick<CreateProjectPayload, 'name' | 'description'>> & {
  status?: ProjectStatus;
};

export type ProjectListParams = ListParams & { search?: string; status?: ProjectStatus };

export const projectsApi = {
  async list(params?: ProjectListParams) {
    const response = await api.get<ApiListResponse<Project>>('/projects', { params });
    return response.data;
  },
  async getById(projectId: string) {
    const response = await api.get<ApiSuccess<Project>>(`/projects/${projectId}`);
    return response.data.data;
  },
  async create(payload: CreateProjectPayload) {
    const response = await api.post<ApiSuccess<Project>>('/projects', payload);
    return response.data.data;
  },
  async update(projectId: string, payload: UpdateProjectPayload) {
    const response = await api.patch<ApiSuccess<Project>>(`/projects/${projectId}`, payload);
    return response.data.data;
  },
  async archive(projectId: string) {
    const response = await api.delete<ApiSuccess<Project>>(`/projects/${projectId}`);
    return response.data.data;
  },
};
