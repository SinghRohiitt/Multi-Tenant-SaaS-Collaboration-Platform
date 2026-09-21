import { CheckCircle2, ClipboardList, FolderKanban, ListTodo, Users } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/components/ui';
import { useDashboardData } from '@/features/dashboard/useDashboardData';
import {
  ActivityChart,
  TasksByPriorityChart,
  TasksByStatusChart,
} from '@/features/dashboard/DashboardCharts';

const statIcons = {
  projects: FolderKanban,
  activeProjects: FolderKanban,
  tasks: ClipboardList,
  completed: CheckCircle2,
  pending: ListTodo,
  members: Users,
};

type StatCardProps = { label: string; value: number; icon: keyof typeof statIcons; tone: string };

function StatCard({ label, value, icon, tone }: StatCardProps) {
  const Icon = statIcons[icon];
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        <div className={`grid size-11 place-items-center rounded-lg ${tone}`}>
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" className="space-y-6" role="status">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-28" key={index} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export function DashboardPage() {
  const { error, loading, metrics, retry } = useDashboardData();

  if (loading) return <DashboardSkeleton />;
  if (error)
    return (
      <ErrorState
        description={error}
        action={<Button onClick={retry}>Try again</Button>}
        title="Dashboard unavailable"
      />
    );
  if (!metrics || metrics.totalProjects === 0) {
    return (
      <div className="space-y-6">
        <header>
          <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">
            Workspace overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Dashboard</h1>
        </header>
        <EmptyState
          description="Create your first project to start tracking work and team activity."
          title="No projects yet"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">
            Workspace overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">
            A live view of the projects and tasks available to your account.
          </p>
        </div>
        <Alert className="sm:max-w-xs" tone="info">
          Metrics reflect records your account is authorized to view.
        </Alert>
      </header>
      <section aria-label="Workspace metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          icon="projects"
          label="Total projects"
          tone="bg-cyan-400/10 text-cyan-300"
          value={metrics.totalProjects}
        />
        <StatCard
          icon="activeProjects"
          label="Active projects"
          tone="bg-emerald-400/10 text-emerald-300"
          value={metrics.activeProjects}
        />
        <StatCard
          icon="tasks"
          label="Total tasks"
          tone="bg-violet-400/10 text-violet-300"
          value={metrics.totalTasks}
        />
        <StatCard
          icon="completed"
          label="Completed tasks"
          tone="bg-emerald-400/10 text-emerald-300"
          value={metrics.completedTasks}
        />
        <StatCard
          icon="pending"
          label="Pending tasks"
          tone="bg-amber-400/10 text-amber-300"
          value={metrics.pendingTasks}
        />
        <StatCard
          icon="members"
          label="Team members"
          tone="bg-sky-400/10 text-sky-300"
          value={metrics.teamMembers}
        />
      </section>
      <section aria-label="Dashboard charts" className="grid gap-5 lg:grid-cols-2">
        <TasksByStatusChart data={metrics.tasksByStatus} />
        <TasksByPriorityChart data={metrics.tasksByPriority} />
        <ActivityChart data={metrics.activity} />
      </section>
    </div>
  );
}
