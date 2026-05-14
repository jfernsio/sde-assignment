import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DEFAULT_API_BASE, getApiBase, setApiBase } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, logout } = useAuth();
  const [base, setBase] = useState(getApiBase());

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Settings
        </p>
        <h1 className="font-display text-4xl">Console preferences</h1>
      </header>

      <section className="max-w-xl space-y-4 rounded-2xl border bg-card p-6">
        <div>
          <h2 className="font-display text-2xl">API endpoint</h2>
          <p className="text-sm text-muted-foreground">
            The base URL of your maritime backend. Default:{" "}
            <code className="rounded bg-muted px-1">{DEFAULT_API_BASE}</code>
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="base">Base URL</Label>
          <Input
            id="base"
            value={base}
            onChange={(e) => setBase(e.target.value)}
            placeholder={DEFAULT_API_BASE}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setApiBase(base.trim() || DEFAULT_API_BASE);
              toast.success("API endpoint saved");
            }}
          >
            Save
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setApiBase(DEFAULT_API_BASE);
              setBase(DEFAULT_API_BASE);
              toast.success("Reset to default");
            }}
          >
            Reset
          </Button>
        </div>
      </section>

      <section className="max-w-xl space-y-4 rounded-2xl border bg-card p-6">
        <div>
          <h2 className="font-display text-2xl">Session</h2>
          <p className="text-sm text-muted-foreground">
            Signed in as <strong>{user?.email}</strong> ({user?.role})
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
      </section>
    </div>
  );
}
