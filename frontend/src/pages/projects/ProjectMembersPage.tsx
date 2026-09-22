import { ArrowLeft, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
} from '@/components/ui';
import { AddMemberModal, MemberTable, useProjectMembers } from '@/features/members';
import type { AddMemberFormValues } from '@/features/members/member.schemas';
import type { ProjectMember } from '@/types/api';
import { useAppSelector } from '@/store/hooks';
import { selectCanManageWorkspace } from '@/features/auth/auth.selectors';

export function ProjectMembersPage() {
  const { projectId } = useParams();
  const canManage = useAppSelector(selectCanManageWorkspace);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ProjectMember | null>(null);
  const {
    members,
    meta,
    loading,
    error,
    mutationError,
    mutationLoading,
    addMember,
    removeMember,
    reload,
    clearMutationError,
  } = useProjectMembers(projectId, page);

  async function submitMember(values: AddMemberFormValues) {
    return addMember(values);
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    if (await removeMember(removeTarget.userId)) setRemoveTarget(null);
  }

  if (loading) {
    return (
      <div aria-label="Loading members" className="space-y-4" role="status">
        <Skeleton className="h-8 w-56" />
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="h-16" key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        action={<Button onClick={reload}>Try again</Button>}
        description={error}
        title="Members unavailable"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100"
        to={projectId ? `/projects/${projectId}` : '/projects'}
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Back to project
      </Link>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">
            Project access
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Members</h1>
          <p className="mt-2 text-sm text-slate-400">People who can access this project.</p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              clearMutationError();
              setAddOpen(true);
            }}
          >
            <UserPlus aria-hidden="true" className="size-4" /> Add member
          </Button>
        )}
      </header>
      {mutationError && (
        <Alert title="Member action failed" tone="danger">
          {mutationError}
        </Alert>
      )}
      {members.length === 0 ? (
        <EmptyState
          description="No project members are available to display."
          title="No members yet"
          action={
            canManage ? (
              <Button onClick={() => setAddOpen(true)}>
                <UserPlus aria-hidden="true" className="size-4" /> Add member
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <MemberTable canManage={canManage} members={members} onRemove={setRemoveTarget} />
          {meta.totalPages > 1 && (
            <Pagination onPageChange={setPage} page={meta.page} totalPages={meta.totalPages} />
          )}
        </>
      )}
      <AddMemberModal
        error={mutationError}
        loading={mutationLoading}
        onClose={() => setAddOpen(false)}
        onSubmit={submitMember}
        open={addOpen}
      />
      <ConfirmDialog
        description={
          removeTarget
            ? `Remove ${removeTarget.user.displayName} from this project? They will lose project access.`
            : ''
        }
        loading={mutationLoading}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => void confirmRemove()}
        open={removeTarget !== null}
        title="Remove project member"
      />
    </div>
  );
}
