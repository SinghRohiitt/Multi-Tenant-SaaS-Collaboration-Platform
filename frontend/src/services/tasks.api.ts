import { api } from './api';
import type {
  ApiListResponse,
  ApiSuccess,
  ListParams,
  Task,
  TaskPriority,
  TaskStatus,
} from '@/types/api';

export type CreateTaskPayload = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
};

export type UpdateTaskPayload = Partial<Omit<CreateTaskPayload, 'assigneeId'>>;
export type TaskListParams = ListParams & {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
};

export const tasksApi = {
  async listByProject(projectId: string, params?: TaskListParams) {
    const response = await api.get<ApiListResponse<Task>>(`/projects/${projectId}/tasks`, {
      params,
    });
    return response.data;
  },
  async create(projectId: string, payload: CreateTaskPayload) {
    const response = await api.post<ApiSuccess<Task>>(`/projects/${projectId}/tasks`, payload);
    return response.data.data;
  },
  async getById(taskId: string) {
    const response = await api.get<ApiSuccess<Task>>(`/tasks/${taskId}`);
    return response.data.data;
  },
  async update(taskId: string, payload: UpdateTaskPayload) {
    const response = await api.patch<ApiSuccess<Task>>(`/tasks/${taskId}`, payload);
    return response.data.data;
  },
  async assign(taskId: string, assigneeId: string | null) {
    const response = await api.patch<ApiSuccess<Task>>(`/tasks/${taskId}/assignee`, { assigneeId });
    return response.data.data;
  },
  async archive(taskId: string) {
    const response = await api.delete<ApiSuccess<Task>>(`/tasks/${taskId}`);
    return response.data.data;
  },
};
