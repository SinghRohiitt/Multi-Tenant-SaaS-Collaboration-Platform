import type { Project, Task, TaskPriority, TaskStatus } from '@/types/api';
import type { ActivityPoint, DashboardMetrics } from './dashboard.types';

const taskStatuses: TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'CANCELLED',
  'ARCHIVED',
];
const taskPriorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const pendingStatuses: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW'];

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createActivity(projects: Project[], tasks: Task[]): ActivityPoint[] {
  const now = new Date();
  const points = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString(undefined, { month: 'short' }),
      projects: 0,
      tasks: 0,
    };
  });
  const pointsByKey = new Map(points.map((point) => [point.key, point]));

  projects.forEach((project) => {
    const date = new Date(project.createdAt);
    const point = pointsByKey.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (point) point.projects += 1;
  });
  tasks.forEach((task) => {
    const date = new Date(task.createdAt);
    const point = pointsByKey.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (point) point.tasks += 1;
  });

  return points.map((point) => ({
    label: point.label,
    projects: point.projects,
    tasks: point.tasks,
  }));
}

export function buildDashboardMetrics(
  projects: Project[],
  tasks: Task[],
  teamMembers: number,
): DashboardMetrics {
  const countBy = <T extends string>(values: T[]) =>
    values.reduce<Record<string, number>>((counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    }, {});
  const statusCounts = countBy(tasks.map((task) => task.status));
  const priorityCounts = countBy(tasks.map((task) => task.priority));

  return {
    projects,
    totalProjects: projects.length,
    activeProjects: projects.filter((project) => project.status === 'ACTIVE').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.status === 'DONE').length,
    pendingTasks: tasks.filter((task) => pendingStatuses.includes(task.status)).length,
    teamMembers,
    tasksByStatus: taskStatuses.map((status) => ({
      label: titleCase(status),
      status,
      value: statusCounts[status] ?? 0,
    })),
    tasksByPriority: taskPriorities.map((priority) => ({
      label: titleCase(priority),
      priority,
      value: priorityCounts[priority] ?? 0,
    })),
    activity: createActivity(projects, tasks),
  };
}
