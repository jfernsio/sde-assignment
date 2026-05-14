import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Plus, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";
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
import type { SafetyDrill } from "@/lib/types";

export const Route = createFileRoute("/_app/drills")({
  component: DrillsPage,
});

function DrillsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const qc = useQueryClient();
  const [shipFilter, setShipFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["drills"],
    queryFn: () => api.listDrills(),
  });

  const drills = data?.drills ?? [];
  const ships = useMemo(() => {
    const m = new Map<number, string>();
    for (const d of drills) m.set(d.shipId, d.ship?.name ?? `Ship #${d.shipId}`);
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }));
  }, [drills]);

  const filtered = drills.filter(
    (d) => shipFilter === "all" || String(d.shipId) === shipFilter,
  );

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteDrill(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["drills"] });
      toast.success("Drill deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const attend = useMutation({
    mutationFn: (input: { drillId: number; attended: boolean }) =>
      api.recordAttendance(input.drillId, input.attended),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["drills"] });
      toast.success("Attendance recorded");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Failed to record attendance"),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Safety
          </p>
          <h1 className="font-display text-4xl">Drills</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Schedule safety drills and track crew participation."
              : "View upcoming drills and mark your attendance."}
          </p>
        </div>
        {isAdmin && <NewDrillDialog />}
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Ship
          </Label>
          <Select value={shipFilter} onValueChange={setShipFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ships</SelectItem>
              {ships.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load drills"}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          <ShieldCheck className="mx-auto mb-2 h-6 w-6 opacity-40" />
          No drills scheduled.
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {filtered.map((d) => (
            <DrillCard
              key={d.id}
              drill={d}
              currentUserId={user?.id ?? 0}
              isAdmin={isAdmin}
              onAttend={(attended) =>
                attend.mutate({ drillId: d.id, attended })
              }
              onDelete={() => {
                if (confirm("Delete this drill?")) remove.mutate(d.id);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function DrillCard({
  drill,
  currentUserId,
  isAdmin,
  onAttend,
  onDelete,
}: {
  drill: SafetyDrill;
  currentUserId: number;
  isAdmin: boolean;
  onAttend: (attended: boolean) => void;
  onDelete: () => void;
}) {
  const scheduled = new Date(drill.scheduledDate);
  const missed =
    drill.status !== "COMPLETED" && scheduled.getTime() < Date.now();
  const myRecord = drill.attendance?.find((a) => a.crewId === currentUserId);
  const attendCount = drill.attendance?.filter((a) => a.attended).length ?? 0;
  const totalCount = drill.attendance?.length ?? drill._count?.attendance ?? 0;

  return (
    <li className="rounded-2xl border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl">{drill.title}</h3>
            {missed && (
              <Badge className="border-destructive/30 bg-destructive/10 text-destructive text-[10px]">
                Missed
              </Badge>
            )}
            {drill.status === "COMPLETED" && (
              <Badge className="border-success/30 bg-success/15 text-success text-[10px]">
                Completed
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {drill.ship?.name ?? `Ship #${drill.shipId}`} · {scheduled.toLocaleString()}
          </p>
        </div>
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{drill.description}</p>

      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <div className="text-xs">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Attendance
          </p>
          <p className="font-medium">
            {attendCount} of {totalCount} attended
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={myRecord?.attended ? "default" : "outline"}
            onClick={() => onAttend(true)}
          >
            <UserCheck className="mr-1 h-3.5 w-3.5" /> Present
          </Button>
          <Button
            size="sm"
            variant={myRecord && !myRecord.attended ? "default" : "outline"}
            onClick={() => onAttend(false)}
          >
            <UserX className="mr-1 h-3.5 w-3.5" /> Absent
          </Button>
        </div>
      </div>
    </li>
  );
}

function NewDrillDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [shipId, setShipId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.createDrill({
        shipId: Number(shipId),
        title,
        description,
        scheduledDate: new Date(scheduledDate).toISOString(),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["drills"] });
      toast.success("Drill scheduled");
      setOpen(false);
      setShipId("");
      setTitle("");
      setDescription("");
      setScheduledDate("");
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
          <Plus className="mr-1 h-4 w-4" /> Schedule drill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Schedule safety drill</DialogTitle>
          <DialogDescription>
            Plan a drill (e.g., fire, evacuation) for a specific ship.
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
              placeholder="Fire drill"
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
            <Label htmlFor="scheduledDate">Scheduled date</Label>
            <Input
              id="scheduledDate"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Scheduling…" : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
