import { ArrowLeft, Archive, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  ErrorState,
  Input,
  Skeleton,
} from '@/components/ui';
import { TaskFormModal, useTask } from '@/features/tasks';
import type { TaskFormValues } from '@/features/tasks/task.schemas';
import { useAppSelector } from '@/store/hooks';

const statusTone = {
  BACKLOG: 'neutral',
  TODO: 'info',
  IN_PROGRESS: 'warning',
  IN_REVIEW: 'warning',
  DONE: 'success',
  CANCELLED: 'danger',
  ARCHIVED: 'danger',
} as const;
const priorityTone = { LOW: 'neutral', MEDIUM: 'info', HIGH: 'warning', URGENT: 'danger' } as const;

export function TaskDetailsPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const {
    task,
    loading,
    error,
    retry,
    mutationError,
    mutationLoading,
    updateTask,
    assignTask,
    archiveTask,
  } = useTask(taskId);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const roles = currentUser?.roles ?? (currentUser?.role ? [currentUser.role] : []);
  const canManage = roles.some((role) => role === 'ADMIN' || role === 'MANAGER');
  const [editing, setEditing] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');

  async function submitEdit(values: TaskFormValues) {
    const updated = await updateTask({
      title: values.title,
      description: values.description || null,
      status: values.status,
      priority: values.priority,
      dueDate: values.dueDate || null,
    });
    if (updated) setEditing(false);
    return updated;
  }

  async function saveAssignee() {
    const updated = await assignTask(assigneeId || null);
    if (updated) setAssigneeId('');
  }

  async function confirmArchive() {
    if (await archiveTask()) navigate('/tasks', { replace: true });
  }

  if (loading)
    return (
      <div aria-label="Loading task" className="space-y-5" role="status">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  if (error || !task)
    return (
      <ErrorState
        action={<Button onClick={retry}>Try again</Button>}
        description={error ?? 'This task could not be found.'}
        title="Task unavailable"
      />
    );

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100"
        to="/tasks"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Back to tasks
      </Link>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[task.status]}>{task.status.replace('_', ' ')}</Badge>
            <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{task.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {task.description || 'No description provided.'}
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
      </header>
      {mutationError && (
        <Alert title="Task action failed" tone="danger">
          {mutationError}
        </Alert>
      )}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-100">Task details</h2>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Project</p>
            <p className="mt-1 text-sm text-slate-200">{task.projectId}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Due date</p>
            <p className="mt-1 text-sm text-slate-200">
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Created</p>
            <p className="mt-1 text-sm text-slate-200">
              {new Date(task.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Assignee</p>
            {task.assignee ? (
              <div className="mt-1 flex items-center gap-2">
                <Avatar name={task.assignee.displayName} size="sm" />
                <span className="text-sm text-slate-200">{task.assignee.displayName}</span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Unassigned</p>
            )}
          </div>
        </CardContent>
      </Card>
      {canManage && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-100">Assignment</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <InputLabel value={assigneeId} onChange={setAssigneeId} />
            <Button loading={mutationLoading} onClick={() => void saveAssignee()}>
              Save assignee
            </Button>
          </CardContent>
        </Card>
      )}
      <TaskFormModal
        error={mutationError}
        loading={mutationLoading}
        mode="edit"
        onClose={() => setEditing(false)}
        onSubmit={submitEdit}
        open={editing}
        projects={[]}
        task={task}
      />
      <ConfirmDialog
        description={`Archive ${task.title}? It will no longer appear in active task work.`}
        loading={mutationLoading}
        onClose={() => setConfirmingArchive(false)}
        onConfirm={() => void confirmArchive()}
        open={confirmingArchive}
        title="Archive task"
      />
    </div>
  );
}

function InputLabel({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex-1">
      <Input
        id="task-assignee"
        label="Assignee user ID"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Leave empty to unassign"
        value={value}
      />
    </div>
  );
}
