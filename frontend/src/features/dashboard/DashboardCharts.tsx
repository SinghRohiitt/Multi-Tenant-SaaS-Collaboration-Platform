import { Card, CardContent, CardHeader, EmptyState } from '@/components/ui';
import type { ActivityPoint, DashboardChartPoint } from './dashboard.types';
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const statusColors = ['#64748b', '#22d3ee', '#f59e0b', '#a78bfa', '#34d399', '#fb7185', '#475569'];

function ChartEmpty({ title }: { title: string }) {
  return (
    <EmptyState
      title={`No ${title.toLowerCase()} yet`}
      description="Data will appear as your workspace is used."
    />
  );
}

export function TasksByStatusChart({ data }: { data: DashboardChartPoint[] }) {
  const hasData = data.some((point) => point.value > 0);
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-slate-100">Tasks by status</h2>
        <p className="mt-1 text-xs text-slate-500">Tasks visible to your account</p>
      </CardHeader>
      <CardContent className="h-80">
        {hasData ? (
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius="55%"
                nameKey="label"
                outerRadius="78%"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell fill={statusColors[index % statusColors.length]} key={entry.label} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#e2e8f0',
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty title="task status data" />
        )}
      </CardContent>
    </Card>
  );
}

export function TasksByPriorityChart({ data }: { data: DashboardChartPoint[] }) {
  const hasData = data.some((point) => point.value > 0);
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-slate-100">Tasks by priority</h2>
        <p className="mt-1 text-xs text-slate-500">Current task distribution</p>
      </CardHeader>
      <CardContent className="h-80">
        {hasData ? (
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data} margin={{ bottom: 8, left: -20, right: 8, top: 12 }}>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#e2e8f0',
                }}
                cursor={{ fill: '#1e293b' }}
              />
              <Bar dataKey="value" fill="#22d3ee" name="Tasks" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty title="task priority data" />
        )}
      </CardContent>
    </Card>
  );
}

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const hasData = data.some((point) => point.projects > 0 || point.tasks > 0);
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <h2 className="text-sm font-semibold text-slate-100">Project and task activity</h2>
        <p className="mt-1 text-xs text-slate-500">Records created over the last six months</p>
      </CardHeader>
      <CardContent className="h-80">
        {hasData ? (
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data} margin={{ bottom: 8, left: -20, right: 8, top: 12 }}>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#e2e8f0',
                }}
                cursor={{ fill: '#1e293b' }}
              />
              <Legend iconType="circle" wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Bar dataKey="projects" fill="#22d3ee" name="Projects" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tasks" fill="#a78bfa" name="Tasks" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty title="activity" />
        )}
      </CardContent>
    </Card>
  );
}
