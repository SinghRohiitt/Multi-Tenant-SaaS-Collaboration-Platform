import { Archive, ExternalLink, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import type { Project } from '@/types/api';

type ProjectTableProps = {
  projects: Project[];
  canManage: boolean;
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
};

const statusTone = {
  PLANNING: 'neutral',
  ACTIVE: 'success',
  ON_HOLD: 'warning',
  COMPLETED: 'info',
  ARCHIVED: 'danger',
} as const;

export function ProjectTable({ projects, canManage, onEdit, onArchive }: ProjectTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Updated</TableHead>
          {canManage && (
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <div>
                <Link
                  className="font-semibold text-slate-100 hover:text-cyan-300"
                  to={`/projects/${project.id}`}
                >
                  {project.name}
                </Link>
                <p className="mt-1 text-xs text-slate-500">{project.key}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge tone={statusTone[project.status]}>{project.status.replace('_', ' ')}</Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap text-slate-500">
              {new Date(project.updatedAt).toLocaleDateString()}
            </TableCell>
            {canManage && (
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    aria-label={`Edit ${project.name}`}
                    onClick={() => onEdit(project)}
                    size="sm"
                    variant="ghost"
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                  </Button>
                  <Button
                    aria-label={`Archive ${project.name}`}
                    onClick={() => onArchive(project)}
                    size="sm"
                    variant="ghost"
                  >
                    <Archive aria-hidden="true" className="size-4" />
                  </Button>
                  <Link
                    aria-label={`Open ${project.name}`}
                    className="inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    to={`/projects/${project.id}`}
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
