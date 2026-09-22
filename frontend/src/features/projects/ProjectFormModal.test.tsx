import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Project } from '@/types/api';
import { ProjectFormModal } from './ProjectFormModal';

const project: Project = {
  id: 'project-1',
  tenantId: 'tenant-1',
  key: 'APP',
  name: 'App',
  description: 'An app',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderModal({
  mode = 'create',
  modalProject = null,
  onSubmit = () => Promise.resolve(true),
}: {
  mode?: 'create' | 'edit';
  modalProject?: Project | null;
  onSubmit?: () => Promise<boolean>;
} = {}) {
  const onClose = vi.fn();
  render(
    <ProjectFormModal
      mode={mode}
      onClose={onClose}
      onSubmit={onSubmit}
      open
      project={modalProject}
    />,
  );
  return { onClose };
}

describe('ProjectFormModal', () => {
  it('submits a create payload and closes the dialog', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.resolve(true));
    const { onClose } = renderModal({ onSubmit });

    await user.type(screen.getByLabelText('Project key'), 'WEB');
    await user.type(screen.getByLabelText('Project name'), 'Web app');
    await user.click(screen.getByRole('button', { name: 'Create project' }));

    expect(onSubmit).toHaveBeenCalledWith({
      key: 'WEB',
      name: 'Web app',
      description: null,
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('keeps the modal open when submission fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.resolve(false));
    const { onClose } = renderModal({ onSubmit });

    await user.type(screen.getByLabelText('Project key'), 'WEB');
    await user.type(screen.getByLabelText('Project name'), 'Web app');
    await user.click(screen.getByRole('button', { name: 'Create project' }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Create project' })).toBeInTheDocument();
  });

  it('shows validation errors without submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderModal({ onSubmit });

    await user.click(screen.getByRole('button', { name: 'Create project' }));

    expect(await screen.findByText('Project name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prefills and submits an edit payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.resolve(true));
    renderModal({ mode: 'edit', modalProject: project, onSubmit });

    expect(screen.getByLabelText('Project key')).toHaveValue('APP');
    expect(screen.getByLabelText('Project name')).toHaveValue('App');
    expect(screen.getByLabelText('Project key')).toBeDisabled();

    await user.type(screen.getByLabelText('Project name'), ' Platform');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'App Platform',
      description: 'An app',
      status: 'ACTIVE',
    });
  });

  it('surfaces the mutation error inside the modal', () => {
    render(
      <ProjectFormModal
        error="Project action failed"
        mode="create"
        onClose={vi.fn()}
        onSubmit={() => Promise.resolve(false)}
        open
      />,
    );
    expect(screen.getByText('Project update failed')).toBeInTheDocument();
  });
});
