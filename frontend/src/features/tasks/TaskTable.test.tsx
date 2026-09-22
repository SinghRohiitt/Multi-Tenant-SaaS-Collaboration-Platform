import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TaskTable } from './TaskTable';

const projects = [
  {
    id: 'project-1',
    tenantId: 'tenant-1',
    key: 'APP',
    name: 'App',
    description: null,
    status: 'ACTIVE' as const,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const tasks = [
  {
    id: 'task-1',
    tenantId: 'tenant-1',
    projectId: 'project-1',
    assigneeId: 'user-1',
    title: 'Ship',
    description: 'Release notes',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    dueDate: '2026-02-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    assignee: { id: 'user-1', email: 'a@b.co', displayName: 'Alice', status: 'ACTIVE' },
  },
  {
    id: 'task-2',
    tenantId: 'tenant-1',
    projectId: 'project-1',
    assigneeId: null,
    title: 'Document',
    description: null,
    status: 'TODO' as const,
    priority: 'MEDIUM' as const,
    dueDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    assignee: null,
  },
];

function renderTable(canManage = true) {
  const onEdit = vi.fn();
  const onArchive = vi.fn();
  render(
    <MemoryRouter>
      <TaskTable
        canManage={canManage}
        onArchive={onArchive}
        onEdit={onEdit}
        projects={projects}
        tasks={tasks}
      />
    </MemoryRouter>,
  );
  return { onEdit, onArchive };
}

describe('TaskTable', () => {
  it('renders task titles, project names, status, priority and assignee', () => {
    renderTable();
    expect(screen.getByText('Ship')).toBeInTheDocument();
    expect(screen.getByText('Document')).toBeInTheDocument();
    expect(screen.getAllByText('APP - App')).toHaveLength(2);
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('invokes edit and archive callbacks for managers', async () => {
    const user = userEvent.setup();
    const { onEdit, onArchive } = renderTable(true);

    await user.click(screen.getByRole('button', { name: 'Edit Ship' }));
    await user.click(screen.getByRole('button', { name: 'Archive Ship' }));

    expect(onEdit).toHaveBeenCalledWith(tasks[0]);
    expect(onArchive).toHaveBeenCalledWith(tasks[0]);
  });

  it('hides management actions for users without manager access', () => {
    renderTable(false);
    expect(screen.queryByRole('button', { name: 'Edit Ship' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archive Ship' })).not.toBeInTheDocument();
  });
});
