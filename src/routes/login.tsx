import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Maison Aurèle" },
      { name: "description", content: "Sign in to the Maison Aurèle staff area." },
      { property: "og:title", content: "Admin Login — Maison Aurèle" },
      { property: "og:description", content: "Sign in to manage the menu and orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

const input =
  "w-full border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";

function Login() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    if (error) {
      setBusy(false);
      return setMsg(error.message);
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    setBusy(false);
    if (isAdmin) {
      navigate({ to: "/admin" });
    } else {
      setMsg("This account doesn't have admin access.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl tracking-[0.3em] text-primary">
            MAISON AURÈLE
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
           <h1 className="text-center font-display text-4xl text-primary">Admin Login</h1>
          <p className="text-center text-sm text-muted-foreground">
            Sign in to manage the menu and see incoming orders.
          </p>
          <label className="block space-y-2 text-sm">
            Email
            <input name="email" type="email" autoComplete="email" required placeholder="Email" className={input} />
          </label>
          <label className="block space-y-2 text-sm">
            Password
            <input name="password" type="password" autoComplete="current-password" required placeholder="Password" className={input} />
          </label>
          <Button disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          {msg && <p role="alert" className="text-center text-sm text-muted-foreground">{msg}</p>}
          <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-primary">
            ← Back to the menu
          </Link>
        </form>
      </main>
    </div>
  );
}
