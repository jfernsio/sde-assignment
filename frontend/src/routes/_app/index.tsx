import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Anchor,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { MaintenanceTask, SafetyDrill, Ship } from "@/lib/types";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

interface ShipBucket {
  ship: Ship;
  tasks: MaintenanceTask[];
  drills: SafetyDrill[];
}

function bucketByShip(
  tasks: MaintenanceTask[],
  drills: SafetyDrill[],
): ShipBucket[] {
  const map = new Map<number, ShipBucket>();
  const ensure = (id: number, name: string) => {
    if (!map.has(id)) {
      map.set(id, { ship: { id, name }, tasks: [], drills: [] });
    }
    return map.get(id)!;
  };
  for (const t of tasks) {
    const b = ensure(t.shipId, t.ship?.name ?? `Ship #${t.shipId}`);
    b.tasks.push(t);
  }
  for (const d of drills) {
    const b = ensure(d.shipId, d.ship?.name ?? `Ship #${d.shipId}`);
    b.drills.push(d);
  }
  return Array.from(map.values()).sort((a, b) => a.ship.id - b.ship.id);
}

function isOverdue(t: MaintenanceTask): boolean {
  return t.status !== "COMPLETED" && new Date(t.dueDate).getTime() < Date.now();
}

function isMissedDrill(d: SafetyDrill): boolean {
  return (
    d.status !== "COMPLETED" &&
    new Date(d.scheduledDate).getTime() < Date.now()
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const tasksQ = useQuery({
    queryKey: ["maintenance"],
    queryFn: () => api.listMaintenance(),
  });
  const drillsQ = useQuery({
    queryKey: ["drills"],
    queryFn: () => api.listDrills(),
  });

  const tasks = tasksQ.data?.tasks ?? [];
  const drills = drillsQ.data?.drills ?? [];
  const buckets = bucketByShip(tasks, drills);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdueTasks = tasks.filter(isOverdue).length;
  const totalDrills = drills.length;
  const missedDrills = drills.filter(isMissedDrill).length;

  const completionRate = totalTasks ? completedTasks / totalTasks : 0;
  const allAttendance = drills.flatMap((d) => d.attendance ?? []);
  const attendanceRate = allAttendance.length
    ? allAttendance.filter((a) => a.attended).length / allAttendance.length
    : 0;
  const overallScore = Math.round(
    completionRate * 50 + attendanceRate * 50,
  );

  const statusData = [
    {
      name: "Completed",
      value: tasks.filter((t) => t.status === "COMPLETED").length,
      fill: "var(--color-chart-4)",
    },
    {
      name: "In progress",
      value: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      fill: "var(--color-chart-3)",
    },
    {
      name: "Pending",
      value: tasks.filter((t) => t.status === "PENDING").length,
      fill: "var(--color-chart-2)",
    },
  ];

  const shipScores = buckets.map((b) => {
    const total = b.tasks.length;
    const done = b.tasks.filter((t) => t.status === "COMPLETED").length;
    const compRate = total ? done / total : 0;
    const att = b.drills.flatMap((d) => d.attendance ?? []);
    const attRate = att.length
      ? att.filter((a) => a.attended).length / att.length
      : 0;
    return {
      name: b.ship.name,
      score: Math.round(compRate * 50 + attRate * 50),
    };
  });

  const isLoading = tasksQ.isLoading || drillsQ.isLoading;
  const error = tasksQ.error ?? drillsQ.error;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Bridge view
          </p>
          <h1 className="font-display text-4xl">
            Welcome back, <em className="text-primary not-italic">{user?.email.split("@")[0]}</em>.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live operations across {buckets.length} ship{buckets.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="rounded-2xl border bg-card px-6 py-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Fleet compliance
          </p>
          <p className="font-display text-5xl text-primary">{overallScore}</p>
          <p className="text-xs text-muted-foreground">
            {overallScore >= 80 ? "Good · sailing clean" : overallScore >= 60 ? "Fair · monitor closely" : "At risk · act now"}
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load data"}
          <p className="mt-1 text-xs opacity-80">
            Check the API endpoint in Settings.
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Maintenance tasks"
          value={totalTasks}
          sub={`${completedTasks} completed`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue tasks"
          value={overdueTasks}
          sub="Past due date"
          tone={overdueTasks > 0 ? "warn" : "ok"}
        />
        <StatCard
          icon={ShieldCheck}
          label="Safety drills"
          value={totalDrills}
          sub={`${missedDrills} missed`}
          tone={missedDrills > 0 ? "warn" : "ok"}
        />
        <StatCard
          icon={TrendingUp}
          label="Attendance"
          value={`${Math.round(attendanceRate * 100)}%`}
          sub="Across all drills"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">Fleet compliance</h2>
              <p className="text-xs text-muted-foreground">
                Score per ship · 0–100
              </p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton h={260} />
          ) : shipScores.length === 0 ? (
            <EmptyHint />
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shipScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "color-mix(in oklab, var(--primary) 5%, transparent)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {shipScores.map((s, i) => (
                      <Cell
                        key={i}
                        fill={
                          s.score >= 80
                            ? "var(--color-success)"
                            : s.score >= 60
                              ? "var(--color-gold)"
                              : "var(--color-destructive)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h2 className="font-display text-2xl">Task mix</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Status distribution across all maintenance tasks
          </p>
          {isLoading ? (
            <Skeleton h={220} />
          ) : totalTasks === 0 ? (
            <EmptyHint />
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <ul className="mt-2 space-y-1.5 text-xs">
            {statusData.map((s) => (
              <li key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.fill }} />
                  {s.name}
                </span>
                <span className="font-medium">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="font-display text-2xl">Ships at a glance</h2>
            <p className="text-xs text-muted-foreground">
              Per-vessel compliance breakdown
            </p>
          </div>
          <Anchor className="h-5 w-5 text-muted-foreground" />
        </div>
        {buckets.length === 0 ? (
          <EmptyHint />
        ) : (
          <ul className="divide-y">
            {buckets.map((b) => {
              const total = b.tasks.length;
              const done = b.tasks.filter((t) => t.status === "COMPLETED").length;
              const overdue = b.tasks.filter(isOverdue).length;
              const missed = b.drills.filter(isMissedDrill).length;
              const compRate = total ? done / total : 0;
              const att = b.drills.flatMap((d) => d.attendance ?? []);
              const attRate = att.length
                ? att.filter((a) => a.attended).length / att.length
                : 0;
              const score = Math.round(compRate * 50 + attRate * 50);
              const tone =
                score >= 80
                  ? "text-success"
                  : score >= 60
                    ? "text-gold"
                    : "text-destructive";
              return (
                <li key={b.ship.id} className="grid grid-cols-2 items-center gap-4 px-6 py-4 md:grid-cols-5">
                  <div className="md:col-span-2">
                    <p className="font-medium">{b.ship.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.tasks.length} tasks · {b.drills.length} drills
                    </p>
                  </div>
                  <Stat label="Done" value={`${done}/${total}`} />
                  <Stat label="Overdue" value={overdue} warn={overdue > 0} />
                  <div className="text-right">
                    <p className={`font-display text-3xl ${tone}`}>{score}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {missed} missed drills
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-medium ${warn ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "ok",
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number | string;
  sub: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
        <Icon
          className={`h-4 w-4 ${tone === "warn" ? "text-destructive" : "text-primary"}`}
        />
      </div>
      <p className="mt-2 font-display text-4xl">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Skeleton({ h }: { h: number }) {
  return (
    <div
      className="animate-pulse rounded-md bg-muted"
      style={{ height: h }}
    />
  );
}

function EmptyHint() {
  return (
    <div className="grid place-items-center px-6 py-10 text-center text-sm text-muted-foreground">
      <p>No data yet. Create maintenance tasks and drills to see compliance.</p>
    </div>
  );
}
