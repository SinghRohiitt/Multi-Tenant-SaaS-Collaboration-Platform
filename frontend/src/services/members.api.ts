import { api } from './api';
import type { ApiListResponse, ApiSuccess, ListParams, ProjectMember } from '@/types/api';

export type AddMemberPayload = { userId: string };

export const membersApi = {
  async listByProject(projectId: string, params?: ListParams) {
    const response = await api.get<ApiListResponse<ProjectMember>>(
      `/projects/${projectId}/members`,
      { params },
    );
    return response.data;
  },
  async getById(projectId: string, userId: string) {
    const response = await api.get<ApiSuccess<ProjectMember>>(
      `/projects/${projectId}/members/${userId}`,
    );
    return response.data.data;
  },
  async add(projectId: string, payload: AddMemberPayload) {
    const response = await api.post<ApiSuccess<ProjectMember>>(
      `/projects/${projectId}/members`,
      payload,
    );
    return response.data.data;
  },
  async remove(projectId: string, userId: string) {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },
};
