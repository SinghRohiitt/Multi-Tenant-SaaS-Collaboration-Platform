import { ArrowLeft, Archive, Pencil, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  ErrorState,
  Skeleton,
} from '@/components/ui';
import { ProjectFormModal } from '@/features/projects';
import { useProject } from '@/features/projects/useProjects';
import { useAppSelector } from '@/store/hooks';
import type { UpdateProjectPayload } from '@/services/projects.api';

const statusTone = {
  PLANNING: 'neutral',
  ACTIVE: 'success',
  ON_HOLD: 'warning',
  COMPLETED: 'info',
  ARCHIVED: 'danger',
} as const;

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    project,
    loading,
    error,
    retry,
    mutationError,
    mutationLoading,
    updateProject,
    archiveProject,
  } = useProject(projectId);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const roles = currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []);
  const canManage = roles.some((role) => role === 'ADMIN' || role === 'MANAGER');
  const [editing, setEditing] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  async function submitProject(payload: UpdateProjectPayload) {
    const updated = await updateProject(payload);
    if (updated) setEditing(false);
    return updated;
  }

  async function confirmArchive() {
    if (await archiveProject()) navigate('/projects', { replace: true });
  }

  if (loading) {
    return (
      <div aria-label="Loading project" className="space-y-5" role="status">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <ErrorState
        action={<Button onClick={retry}>Try again</Button>}
        description={error ?? 'This project could not be found.'}
        title="Project unavailable"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100"
        to="/projects"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Back to projects
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">
              {project.key}
            </p>
            <Badge tone={statusTone[project.status]}>{project.status.replace('_', ' ')}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{project.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {project.description || 'No description provided.'}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button onClick={() => setEditing(true)} variant="outline">
              <Pencil aria-hidden="true" className="size-4" /> Edit
            </Button>
            <Button onClick={() => setConfirmingArchive(true)} variant="danger">
              <Archive aria-hidden="true" className="size-4" /> Archive
            </Button>
          </div>
        )}
        {!canManage && (
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-transparent px-4 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            to={`/projects/${project.id}/members`}
          >
            <Users aria-hidden="true" className="size-4" /> Members
          </Link>
        )}
      </header>

      {mutationError && (
        <Alert title="Project action failed" tone="danger">
          {mutationError}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-100">Project information</h2>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Project key</p>
            <p className="mt-1 text-sm text-slate-200">{project.key}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Created</p>
            <p className="mt-1 text-sm text-slate-200">
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Last updated</p>
            <p className="mt-1 text-sm text-slate-200">
              {new Date(project.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <ProjectFormModal
        error={mutationError}
        loading={mutationLoading}
        mode="edit"
        onClose={() => setEditing(false)}
        onSubmit={(payload) => submitProject(payload as UpdateProjectPayload)}
        open={editing}
        project={project}
      />
      <ConfirmDialog
        description={`Archive ${project.name}? It will no longer appear in active project work.`}
        loading={mutationLoading}
        onClose={() => setConfirmingArchive(false)}
        onConfirm={() => void confirmArchive()}
        open={confirmingArchive}
        title="Archive project"
      />
    </div>
  );
}
