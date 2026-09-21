import { ListFilter, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { TaskFormModal, TaskTable, useTasks } from '@/features/tasks';
import type { TaskFormValues } from '@/features/tasks/task.schemas';
import type { Task, TaskPriority, TaskStatus } from '@/types/api';
import { useAppSelector } from '@/store/hooks';

const statuses: Array<{ label: string; value: TaskStatus | '' }> = [
  { label: 'All statuses', value: '' },
  { label: 'To do', value: 'TODO' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Done', value: 'DONE' },
];
const priorities: Array<{ label: string; value: TaskPriority | '' }> = [
  { label: 'All priorities', value: '' },
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
];

function readEnumParam<T extends string>(value: string | null, allowed: readonly T[]) {
  return value && allowed.includes(value as T) ? (value as T) : undefined;
}

export function TasksPage() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const roles = currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []);
  const canManage = roles.some((role) => role === 'ADMIN' || role === 'MANAGER');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchDraft, setSearchDraft] = useState(searchParams.get('search') ?? '');
  const [assigneeDraft, setAssigneeDraft] = useState(searchParams.get('assigneeId') ?? '');
  const [modal, setModal] = useState<'create' | Task | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Task | null>(null);
  const search = searchParams.get('search') ?? '';
  const projectId = searchParams.get('projectId') ?? '';
  const status = readEnumParam(
    searchParams.get('status'),
    statuses.slice(1).map((item) => item.value) as TaskStatus[],
  );
  const priority = readEnumParam(
    searchParams.get('priority'),
    priorities.slice(1).map((item) => item.value) as TaskPriority[],
  );
  const assigneeId = searchParams.get('assigneeId') ?? '';
  const parsedPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const {
    tasks,
    projects,
    meta,
    loading,
    error,
    mutationError,
    mutationLoading,
    clearMutationError,
    createTask,
    updateTask,
    archiveTask,
    reload,
  } = useTasks({
    page,
    limit: 20,
    projectId: projectId || undefined,
    search: search || undefined,
    status,
    priority,
    assigneeId: assigneeId || undefined,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = searchDraft.trim();
      if (nextSearch === search) return;
      const nextParams = new URLSearchParams(searchParams);
      if (nextSearch) nextParams.set('search', nextSearch);
      else nextParams.delete('search');
      nextParams.delete('page');
      setSearchParams(nextParams, { replace: true });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search, searchDraft, searchParams, setSearchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextAssignee = assigneeDraft.trim();
      if (nextAssignee === assigneeId) return;
      updateFilters({ assigneeId: nextAssignee || undefined });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [assigneeDraft, assigneeId]);

  function updateFilters(updates: Record<string, string | undefined>) {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });
    if (!('page' in updates)) nextParams.delete('page');
    setSearchParams(nextParams, { replace: true });
  }

  function clearFilters() {
    setSearchDraft('');
    setAssigneeDraft('');
    setSearchParams({}, { replace: true });
  }

  async function submitTask(values: TaskFormValues) {
    if (modal === 'create') {
      const { projectId: selectedProject, ...payload } = values;
      return createTask(selectedProject, {
        ...payload,
        description: payload.description || null,
        dueDate: payload.dueDate || null,
        assigneeId: payload.assigneeId || null,
      });
    }
    if (modal) {
      return updateTask(modal.id, {
        title: values.title,
        description: values.description || null,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate || null,
      });
    }
    return false;
  }

  async function confirmArchive() {
    if (archiveTarget && (await archiveTask(archiveTarget.id))) setArchiveTarget(null);
  }

  function openCreate() {
    clearMutationError();
    setModal('create');
  }
  function openEdit(task: Task) {
    clearMutationError();
    setModal(task);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Tasks</h1>
          <p className="mt-2 text-sm text-slate-400">
            Track work across the projects available to your account.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" className="size-4" /> New task
          </Button>
        )}
      </header>
      {mutationError && (
        <Alert title="Task action failed" tone="danger">
          {mutationError}
        </Alert>
      )}
      <section
        aria-label="Task filters"
        className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="sm:col-span-2 lg:col-span-1">
          <label
            className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500"
            htmlFor="task-search"
          >
            Search tasks
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
            />
            <Input
              className="pl-9"
              id="task-search"
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search title or description"
              value={searchDraft}
            />
          </div>
        </div>
        <Select
          label="Project"
          onChange={(event) => {
            updateFilters({ projectId: event.target.value || undefined });
          }}
          value={projectId}
        >
          {<option value="">All projects</option>}
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.key} - {project.name}
            </option>
          ))}
        </Select>
        <Select
          label="Status"
          onChange={(event) => {
            updateFilters({ status: event.target.value || undefined });
          }}
          value={status ?? ''}
        >
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select
          label="Priority"
          onChange={(event) => {
            updateFilters({ priority: event.target.value || undefined });
          }}
          value={priority ?? ''}
        >
          {priorities.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Input
          label="Assignee ID"
          onChange={(event) => setAssigneeDraft(event.target.value)}
          placeholder="Optional user ID"
          value={assigneeDraft}
        />
        {(search || projectId || status || priority || assigneeId) && (
          <div className="flex items-end">
            <Button className="w-full" onClick={clearFilters} type="button" variant="ghost">
              Clear filters
            </Button>
          </div>
        )}
      </section>
      {loading ? (
        <div aria-label="Loading tasks" className="space-y-3" role="status">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton className="h-20" key={index} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          action={<Button onClick={reload}>Try again</Button>}
          description={error}
          title="Tasks unavailable"
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          description={
            search || projectId || status || priority || assigneeId
              ? 'Try changing your filters.'
              : 'Create a task to start tracking work.'
          }
          title={
            search || projectId || status || priority || assigneeId
              ? 'No matching tasks'
              : 'No tasks yet'
          }
          action={
            canManage && !search && !projectId && !status && !priority && !assigneeId ? (
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" className="size-4" /> Create task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <TaskTable
            canManage={canManage}
            onArchive={setArchiveTarget}
            onEdit={openEdit}
            projects={projects}
            tasks={tasks}
          />
          {meta.totalPages > 1 && (
            <Pagination
              onPageChange={(nextPage) => updateFilters({ page: String(nextPage) })}
              page={meta.page}
              totalPages={meta.totalPages}
            />
          )}
        </>
      )}
      <TaskFormModal
        error={mutationError}
        loading={mutationLoading}
        mode={modal === 'create' ? 'create' : 'edit'}
        onClose={() => setModal(null)}
        onSubmit={submitTask}
        open={modal !== null}
        projects={projects}
        task={modal === 'create' || modal === null ? null : modal}
      />
      <ConfirmDialog
        description={
          archiveTarget
            ? `Archive ${archiveTarget.title}? It will no longer appear in active task work.`
            : ''
        }
        loading={mutationLoading}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void confirmArchive()}
        open={archiveTarget !== null}
        title="Archive task"
      />
      <div className="sr-only">
        <ListFilter aria-hidden="true" />
      </div>
    </div>
  );
}
