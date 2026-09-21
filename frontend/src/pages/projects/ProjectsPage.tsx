import { Plus, Search } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  Select,
  Skeleton,
} from '@/components/ui';
import type { CreateProjectPayload, UpdateProjectPayload } from '@/services/projects.api';
import type { Project, ProjectStatus } from '@/types/api';
import { ProjectFormModal, ProjectTable, useProjects } from '@/features/projects';
import { useAppSelector } from '@/store/hooks';

const statuses: Array<{ label: string; value: ProjectStatus | '' }> = [
  { label: 'All statuses', value: '' },
  { label: 'Planning', value: 'PLANNING' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

export function ProjectsPage() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const roles = currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []);
  const canManage = roles.some((role) => role === 'ADMIN' || role === 'MANAGER');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | undefined>();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'create' | Project | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Project | null>(null);
  const deferredSearch = useDeferredValue(search);
  const {
    data,
    meta,
    loading,
    error,
    mutationError,
    mutationLoading,
    clearMutationError,
    reload,
    createProject,
    updateProject,
    archiveProject,
  } = useProjects({
    page,
    limit: 20,
    search: deferredSearch.trim() || undefined,
    status,
  });

  useEffect(() => setPage(1), [deferredSearch, status]);

  async function submitProject(payload: CreateProjectPayload | UpdateProjectPayload) {
    if (modal === 'create') return createProject(payload as CreateProjectPayload);
    if (modal) return updateProject(modal.id, payload as UpdateProjectPayload);
    return false;
  }

  async function confirmArchive() {
    if (!archiveTarget) return;
    if (await archiveProject(archiveTarget.id)) setArchiveTarget(null);
  }

  function openCreate() {
    clearMutationError();
    setModal('create');
  }

  function openEdit(project: Project) {
    clearMutationError();
    setModal(project);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Projects</h1>
          <p className="mt-2 text-sm text-slate-400">
            Browse the projects available to your account.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" className="size-4" /> New project
          </Button>
        )}
      </header>

      {mutationError && (
        <Alert tone="danger" title="Project action failed">
          {mutationError}
        </Alert>
      )}

      <section
        aria-label="Project filters"
        className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <label
            className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500"
            htmlFor="project-search"
          >
            Search projects
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
            />
            <Input
              className="pl-9"
              id="project-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or key"
              value={search}
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select
            label="Status"
            onChange={(event) => {
              setStatus((event.target.value || undefined) as ProjectStatus | undefined);
              setPage(1);
            }}
            value={status ?? ''}
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
      </section>

      {loading ? (
        <div className="space-y-3" role="status" aria-label="Loading projects">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton className="h-20" key={index} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          description={error}
          action={<Button onClick={reload}>Try again</Button>}
          title="Projects unavailable"
        />
      ) : data.length === 0 ? (
        <EmptyState
          description={
            search || status
              ? 'Try changing your search or filters.'
              : 'Create a project to start organizing collaborative work.'
          }
          title={search || status ? 'No matching projects' : 'No projects yet'}
          action={
            canManage && !search && !status ? (
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" className="size-4" /> Create project
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ProjectTable
            canManage={canManage}
            onArchive={setArchiveTarget}
            onEdit={openEdit}
            projects={data}
          />
          {meta.totalPages > 1 && (
            <Pagination onPageChange={setPage} page={meta.page} totalPages={meta.totalPages} />
          )}
        </>
      )}

      <ProjectFormModal
        error={mutationError}
        loading={mutationLoading}
        mode={modal === 'create' ? 'create' : 'edit'}
        onClose={() => setModal(null)}
        onSubmit={submitProject}
        open={modal !== null}
        project={modal === 'create' || modal === null ? null : modal}
      />
      <ConfirmDialog
        description={
          archiveTarget
            ? `Archive ${archiveTarget.name}? It will no longer appear in active project work.`
            : ''
        }
        loading={mutationLoading}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void confirmArchive()}
        open={archiveTarget !== null}
        title="Archive project"
      />
    </div>
  );
}
