import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — Maison Aurèle" },
      { name: "description", content: "Choose a new password for your Maison Aurèle staff account." },
      { property: "og:title", content: "Set New Password — Maison Aurèle" },
      { property: "og:description", content: "Choose a new staff password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

const input =
  "w-full border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";

function ResetPassword() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password !== String(f.get("confirm"))) return setMsg("Passwords don't match.");
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMsg(error.message);
    navigate({ to: "/admin" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-center font-display text-4xl text-primary">New Password</h1>
        <label className="block space-y-2 text-sm">
          New password
          <input name="password" type="password" minLength={6} required autoComplete="new-password" className={input} />
        </label>
        <label className="block space-y-2 text-sm">
          Confirm password
          <input name="confirm" type="password" minLength={6} required autoComplete="new-password" className={input} />
        </label>
        <Button disabled={busy} className="w-full">
          {busy ? "Saving…" : "Save and open admin"}
        </Button>
        {msg && <p role="alert" className="text-center text-sm text-muted-foreground">{msg}</p>}
        <Link to="/login" className="block text-center text-xs text-muted-foreground hover:text-primary">
          ← Back to login
        </Link>
      </form>
    </main>
  );
}
