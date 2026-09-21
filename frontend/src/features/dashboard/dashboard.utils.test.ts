import { describe, expect, it } from 'vitest';
import { buildDashboardMetrics } from './dashboard.utils';

const project = {
  id: 'project-1',
  tenantId: 'tenant-1',
  key: 'COLLAB',
  name: 'Collaboration',
  description: null,
  status: 'ACTIVE' as const,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

function task(id: string, status: 'TODO' | 'DONE' | 'CANCELLED') {
  return {
    id,
    tenantId: 'tenant-1',
    projectId: 'project-1',
    assigneeId: null,
    title: id,
    description: null,
    status,
    priority: 'MEDIUM' as const,
    dueDate: null,
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
    assignee: null,
  };
}

describe('buildDashboardMetrics', () => {
  it('derives metrics only from the supplied backend records', () => {
    const metrics = buildDashboardMetrics(
      [project],
      [task('pending', 'TODO'), task('done', 'DONE'), task('cancelled', 'CANCELLED')],
      2,
    );

    expect(metrics.totalProjects).toBe(1);
    expect(metrics.activeProjects).toBe(1);
    expect(metrics.totalTasks).toBe(3);
    expect(metrics.completedTasks).toBe(1);
    expect(metrics.pendingTasks).toBe(1);
    expect(metrics.teamMembers).toBe(2);
    expect(metrics.tasksByStatus.find((point) => point.status === 'DONE')?.value).toBe(1);
  });
});
