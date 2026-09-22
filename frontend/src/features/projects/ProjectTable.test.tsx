import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProjectTable } from './ProjectTable';

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
  {
    id: 'project-2',
    tenantId: 'tenant-1',
    key: 'WEB',
    name: 'Web',
    description: 'description',
    status: 'ON_HOLD' as const,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

function renderTable(canManage = true) {
  const onEdit = vi.fn();
  const onArchive = vi.fn();
  render(
    <MemoryRouter>
      <ProjectTable
        canManage={canManage}
        onArchive={onArchive}
        onEdit={onEdit}
        projects={projects}
      />
    </MemoryRouter>,
  );
  return { onEdit, onArchive };
}

describe('ProjectTable', () => {
  it('renders project names, keys, and statuses', () => {
    renderTable();
    expect(screen.getByText('App')).toBeInTheDocument();
    expect(screen.getByText('APP')).toBeInTheDocument();
    expect(screen.getByText('Web')).toBeInTheDocument();
    expect(screen.getByText('WEB')).toBeInTheDocument();
    expect(screen.getByText('ON HOLD')).toBeInTheDocument();
  });

  it('invokes edit and archive callbacks for managers', async () => {
    const user = userEvent.setup();
    const { onEdit, onArchive } = renderTable(true);

    await user.click(screen.getByRole('button', { name: 'Edit App' }));
    await user.click(screen.getByRole('button', { name: 'Archive App' }));

    expect(onEdit).toHaveBeenCalledWith(projects[0]);
    expect(onArchive).toHaveBeenCalledWith(projects[0]);
  });

  it('hides management actions for users without manager access', () => {
    renderTable(false);
    expect(screen.queryByRole('button', { name: 'Edit App' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archive App' })).not.toBeInTheDocument();
  });
});
