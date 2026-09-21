import { membersApi } from '@/services/members.api';
import { projectsApi } from '@/services/projects.api';
import { tasksApi } from '@/services/tasks.api';
import type { Project, ProjectMember, Task } from '@/types/api';

const PAGE_SIZE = 100;

type Page<T> = { data: T[]; meta: { totalPages: number } };

async function fetchAllPages<T>(fetchPage: (page: number) => Promise<Page<T>>) {
  const firstPage = await fetchPage(1);
  if (firstPage.meta.totalPages <= 1) return firstPage.data;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) => fetchPage(index + 2)),
  );
  return [firstPage.data, ...remainingPages.map((page) => page.data)].flat();
}

export type DashboardData = {
  projects: Project[];
  tasks: Task[];
  members: ProjectMember[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const projects = await fetchAllPages((page) => projectsApi.list({ page, limit: PAGE_SIZE }));

  if (projects.length === 0) return { projects, tasks: [], members: [] };

  const [taskPages, memberPages] = await Promise.all([
    Promise.all(
      projects.map((project) =>
        fetchAllPages((page) => tasksApi.listByProject(project.id, { page, limit: PAGE_SIZE })),
      ),
    ),
    Promise.all(
      projects.map((project) =>
        fetchAllPages((page) => membersApi.listByProject(project.id, { page, limit: PAGE_SIZE })),
      ),
    ),
  ]);

  const membersByUserId = new Map<string, ProjectMember>();
  memberPages.flat().forEach((member) => membersByUserId.set(member.userId, member));

  return {
    projects,
    tasks: taskPages.flat(),
    members: [...membersByUserId.values()],
  };
}
