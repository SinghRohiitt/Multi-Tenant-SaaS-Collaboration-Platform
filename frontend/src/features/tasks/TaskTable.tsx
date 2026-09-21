import { Archive, ExternalLink, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import type { Project, Task } from '@/types/api';

type TaskTableProps = {
  tasks: Task[];
  projects: Project[];
  canManage: boolean;
  onEdit: (task: Task) => void;
  onArchive: (task: Task) => void;
};

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

export function TaskTable({ tasks, projects, canManage, onEdit, onArchive }: TaskTableProps) {
  const projectNames = new Map(
    projects.map((project) => [project.id, `${project.key} - ${project.name}`]),
  );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Due date</TableHead>
          {canManage && (
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              <Link
                className="font-semibold text-slate-100 hover:text-cyan-300"
                to={`/tasks/${task.id}`}
              >
                {task.title}
              </Link>
              <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                {task.description || 'No description'}
              </p>
            </TableCell>
            <TableCell className="max-w-40 truncate text-slate-400">
              {projectNames.get(task.projectId) ?? task.projectId}
            </TableCell>
            <TableCell>
              <Badge tone={statusTone[task.status]}>{task.status.replace('_', ' ')}</Badge>
            </TableCell>
            <TableCell>
              <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
            </TableCell>
            <TableCell>
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar name={task.assignee.displayName} size="sm" />
                  <span className="max-w-28 truncate text-slate-300">
                    {task.assignee.displayName}
                  </span>
                </div>
              ) : (
                <span className="text-slate-500">Unassigned</span>
              )}
            </TableCell>
            <TableCell className="whitespace-nowrap text-slate-500">
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
            </TableCell>
            {canManage && (
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    aria-label={`Edit ${task.title}`}
                    onClick={() => onEdit(task)}
                    size="sm"
                    variant="ghost"
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    aria-label={`Archive ${task.title}`}
                    onClick={() => onArchive(task)}
                    size="sm"
                    variant="ghost"
                  >
                    <Archive aria-hidden="true" className="size-4" />
                  </Button>
                  <Link
                    aria-label={`Open ${task.title}`}
                    className="inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    to={`/tasks/${task.id}`}
                  >
                    <ExternalLink aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
