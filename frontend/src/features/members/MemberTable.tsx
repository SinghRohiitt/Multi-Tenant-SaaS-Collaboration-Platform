import { UserMinus } from 'lucide-react';
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
import type { ProjectMember } from '@/types/api';

type MemberTableProps = {
  members: ProjectMember[];
  canManage: boolean;
  onRemove: (member: ProjectMember) => void;
};

export function MemberTable({ members, canManage, onRemove }: MemberTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Status</TableHead>
          {canManage && (
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.userId}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar name={member.user.displayName} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">{member.user.displayName}</p>
                  <p className="truncate text-xs text-slate-500">{member.user.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge tone={member.user.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {member.user.status}
              </Badge>
            </TableCell>
            {canManage && (
              <TableCell>
                <div className="flex justify-end">
                  <Button
                    aria-label={`Remove ${member.user.displayName}`}
                    onClick={() => onRemove(member)}
                    size="sm"
                    variant="ghost"
                  >
                    <UserMinus aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
