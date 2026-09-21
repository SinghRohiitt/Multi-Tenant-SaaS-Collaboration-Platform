import type { Project, ProjectStatus, TaskPriority, TaskStatus } from '@/types/api';

export type DashboardChartPoint = {
  label: string;
  value: number;
};

export type ActivityPoint = {
  label: string;
  projects: number;
  tasks: number;
};

export type DashboardMetrics = {
  projects: Project[];
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  teamMembers: number;
  tasksByStatus: Array<DashboardChartPoint & { status: TaskStatus }>;
  tasksByPriority: Array<DashboardChartPoint & { priority: TaskPriority }>;
  activity: ActivityPoint[];
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};
