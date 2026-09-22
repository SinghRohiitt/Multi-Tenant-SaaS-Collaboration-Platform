import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Project, Task } from '@/types/api';
import { TaskFormModal } from './TaskFormModal';

const project: Project = {
  id: 'project-1',
  tenantId: 'tenant-1',
  key: 'APP',
  name: 'App',
  description: null,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const task: Task = {
  id: 'task-1',
  tenantId: 'tenant-1',
  projectId: 'project-1',
  assigneeId: null,
  title: 'Ship',
  description: 'Release',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  dueDate: '2026-02-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  assignee: null,
};

function renderModal({
  mode = 'create',
  taskModal = null,
  onSubmit = () => Promise.resolve(true),
}: {
  mode?: 'create' | 'edit';
  taskModal?: Task | null;
  onSubmit?: () => Promise<boolean>;
} = {}) {
  const onClose = vi.fn();
  render(
    <TaskFormModal
      mode={mode}
      onClose={onClose}
      onSubmit={onSubmit}
      open
      projects={[project]}
      task={taskModal}
    />,
  );
  return { onClose };
}

describe('TaskFormModal', () => {
  it('submits a create payload with defaults and closes the dialog', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.resolve(true));
    const { onClose } = renderModal({ onSubmit });

    await user.type(screen.getByLabelText('Title'), 'New feature');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(onSubmit).toHaveBeenCalledWith({
      projectId: 'project-1',
      title: 'New feature',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: '',
      assigneeId: '',
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('keeps the modal open when submission fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.resolve(false));
    const { onClose } = renderModal({ onSubmit });

    await user.type(screen.getByLabelText('Title'), 'New feature');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Create task' })).toBeInTheDocument();
  });

  it('shows validation errors without submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderModal({ onSubmit });

    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(await screen.findByText('Task title is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prefills and submits an edit payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.resolve(true));
    renderModal({ mode: 'edit', taskModal: task, onSubmit });

    expect(screen.getByLabelText('Title')).toHaveValue('Ship');
    expect(screen.getByLabelText('Project')).toBeDisabled();
    expect(screen.getByLabelText('Status')).toHaveValue('IN_PROGRESS');
    expect(screen.getByLabelText('Priority')).toHaveValue('HIGH');

    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Shipped');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSubmit).toHaveBeenCalledWith({
      projectId: 'project-1',
      title: 'Shipped',
      description: 'Release',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '2026-02-01',
      assigneeId: '',
    });
  });

  it('surfaces the mutation error inside the modal', () => {
    render(
      <TaskFormModal
        error="Task action failed"
        mode="create"
        onClose={vi.fn()}
        onSubmit={() => Promise.resolve(false)}
        open
        projects={[project]}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getAllByText('Task action failed')).toHaveLength(2);
  });
});
