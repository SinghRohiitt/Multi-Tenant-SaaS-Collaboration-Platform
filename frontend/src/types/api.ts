export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiListResponse<T> = {
  success: true;
  data: T[];
  meta: PaginationMeta;
};

export type ApiError = {
  success?: false;
  message: string;
  details?: unknown;
  statusCode?: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListParams = { page?: number; limit?: number };
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type TaskStatus =
  'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED' | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type Project = {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

export type UserSummary = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  role?: string;
};

export type Task = {
  id: string;
  tenantId: string;
  projectId: string;
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: UserSummary | null;
};

export type ProjectMember = {
  projectId: string;
  userId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  user: UserSummary;
  role?: string;
};
