import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2, Wrench } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { MaintenanceStatus, MaintenanceTask } from "@/lib/types";

export const Route = createFileRoute("/_app/maintenance")({
  component: MaintenancePage,
});

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

function MaintenancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const qc = useQueryClient();
  const [shipFilter, setShipFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["maintenance"],
    queryFn: () => api.listMaintenance(),
  });

  const tasks = data?.tasks ?? [];
  const ships = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of tasks) m.set(t.shipId, t.ship?.name ?? `Ship #${t.shipId}`);
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const filtered = tasks.filter((t) => {
    if (shipFilter !== "all" && String(t.shipId) !== shipFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const updateStatus = useMutation({
    mutationFn: (input: { id: number; status: MaintenanceStatus; notes?: string }) =>
      api.updateMaintenance(input.id, { status: input.status, notes: input.notes }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("Task updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteMaintenance(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("Task deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Operations
          </p>
          <h1 className="font-display text-4xl">Maintenance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Schedule, assign, and track maintenance work across the fleet."
              : "View assigned work and update status as you complete it."}
          </p>
        </div>
        {isAdmin && <NewTaskDialog />}
      </header>

      <div className="flex flex-wrap gap-3">
        <FilterSelect
          label="Ship"
          value={shipFilter}
          onChange={setShipFilter}
          options={[
            { value: "all", label: "All ships" },
            ...ships.map((s) => ({ value: String(s.id), label: s.name })),
          ]}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "All statuses" },
            { value: "PENDING", label: "Pending" },
            { value: "IN_PROGRESS", label: "In progress" },
            { value: "COMPLETED", label: "Completed" },
          ]}
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load tasks"}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border bg-card">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Wrench className="mx-auto mb-2 h-6 w-6 opacity-40" />
            No maintenance tasks match your filters.
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                isAdmin={isAdmin}
                onUpdate={(status) => updateStatus.mutate({ id: t.id, status })}
                onDelete={() => {
                  if (confirm("Delete this task?")) remove.mutate(t.id);
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function statusTone(s: MaintenanceStatus): string {
  if (s === "COMPLETED") return "bg-success/15 text-success border-success/30";
  if (s === "IN_PROGRESS") return "bg-primary/10 text-primary border-primary/20";
  return "bg-gold/15 text-gold-foreground border-gold/30";
}

function TaskRow({
  task,
  isAdmin,
  onUpdate,
  onDelete,
}: {
  task: MaintenanceTask;
  isAdmin: boolean;
  onUpdate: (status: MaintenanceStatus) => void;
  onDelete: () => void;
}) {
  const overdue = task.status !== "COMPLETED" && new Date(task.dueDate).getTime() < Date.now();
  return (
    <li className="grid gap-4 px-6 py-4 md:grid-cols-[1fr_auto_auto_auto]">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium">{task.title}</p>
          <Badge variant="outline" className="text-[10px]">
            {task.ship?.name ?? `Ship #${task.shipId}`}
          </Badge>
          {overdue && (
            <Badge className="border-destructive/30 bg-destructive/10 text-destructive text-[10px]">
              Overdue
            </Badge>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
          {task.description}
        </p>
      </div>
      <div className="text-sm">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Due
        </p>
        <p>{new Date(task.dueDate).toLocaleDateString()}</p>
      </div>
      <div>
        <Select
          value={task.status}
          onValueChange={(v) => onUpdate(v as MaintenanceStatus)}
        >
          <SelectTrigger className={`w-[150px] border ${statusTone(task.status)}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_LABELS) as MaintenanceStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </li>
  );
}

function NewTaskDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [shipId, setShipId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.createMaintenance({
        shipId: Number(shipId),
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["maintenance"] });
      toast.success("Task created");
      setOpen(false);
      setShipId("");
      setTitle("");
      setDescription("");
      setDueDate("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Create failed"),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New maintenance task</DialogTitle>
          <DialogDescription>
            Schedule work on a specific ship with a due date.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="shipId">Ship ID</Label>
            <Input
              id="shipId"
              type="number"
              min={1}
              value={shipId}
              onChange={(e) => setShipId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
