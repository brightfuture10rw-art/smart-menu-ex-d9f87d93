import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { COURSES, imageFor, menuQuery, type MenuRow } from "@/lib/menu";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Staff Login — Maison Aurèle" },
      { name: "description", content: "Staff area for managing the Maison Aurèle menu." },
      { property: "og:title", content: "Staff Login — Maison Aurèle" },
      { property: "og:description", content: "Manage dishes, prices and photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const input =
  "w-full border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";
const btn =
  "border border-primary px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50";

function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setIsAdmin(null);
    supabase
      .rpc("has_role", { _user_id: session.user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl tracking-[0.3em] text-primary">MAISON AURÈLE</Link>
          {session && (
            <button className={btn} onClick={() => supabase.auth.signOut()}>Sign out</button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">
        {!ready ? null : !session ? (
          <LoginForm />
        ) : isAdmin === null ? (
          <p className="text-muted-foreground">Checking access…</p>
        ) : !isAdmin ? (
          <p className="text-muted-foreground">This account doesn't have admin access.</p>
        ) : (
          <MenuEditor />
        )}
      </main>
    </div>
  );
}

function LoginForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    setBusy(true);
    setMsg(null);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === "up" && !data.session) setMsg("Check your email to confirm your account, then sign in.");
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4">
      <h1 className="text-center font-display text-4xl text-primary">
        {mode === "in" ? "Staff Sign In" : "Create Admin Account"}
      </h1>
      <input name="email" type="email" required placeholder="Email" className={input} />
      <input name="password" type="password" required minLength={6} placeholder="Password" className={input} />
      <button disabled={busy} className={`${btn} w-full`}>{mode === "in" ? "Sign in" : "Create account"}</button>
      {msg && <p className="text-center text-sm text-muted-foreground">{msg}</p>}
      <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="w-full text-center text-xs text-muted-foreground hover:text-primary">
        {mode === "in" ? "First time? Create the admin account" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}

function MenuEditor() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery(menuQuery);
  const refresh = () => qc.invalidateQueries({ queryKey: ["menu"] });

  async function addDish() {
    const sort = Math.max(0, ...rows.map((r) => r.sort)) + 1;
    const { error } = await supabase.from("menu_items").insert({ course: COURSES[0]!, name: "New dish", price: 0, sort });
    if (error) alert(error.message);
    refresh();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-4xl text-primary">Edit the Menu</h1>
        <button className={btn} onClick={addDish}>+ Add dish</button>
      </div>
      <div className="space-y-4">
        {rows.map((r) => <DishRow key={r.id} row={r} onChange={refresh} />)}
      </div>
    </div>
  );
}

function DishRow({ row, onChange }: { row: MenuRow; onChange: () => void }) {
  const [d, setD] = useState(row);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(row);

  async function save() {
    const { error } = await supabase.from("menu_items").update({
      course: d.course, name: d.name, description: d.description,
      price: Math.max(0, Math.round(d.price)), image_url: d.image_url || null,
    }).eq("id", row.id);
    if (error) return alert(error.message);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onChange();
  }
  async function remove() {
    if (!confirm(`Remove "${row.name}" from the menu?`)) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", row.id);
    if (error) return alert(error.message);
    onChange();
  }

  return (
    <div className="flex flex-col gap-4 border bg-card p-4 md:flex-row">
      <img src={imageFor(d)} alt={d.name} className="h-28 w-28 shrink-0 object-cover" />
      <div className="grid flex-1 gap-3 md:grid-cols-2">
        <input className={input} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Name" />
        <select className={`${input} bg-card`} value={d.course} onChange={(e) => setD({ ...d, course: e.target.value })}>
          {COURSES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className={`${input} md:col-span-2`} value={d.description}
          onChange={(e) => setD({ ...d, description: e.target.value })} placeholder="Description" />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          RWF
          <input className={input} type="number" min={0} step={1000} value={d.price}
            onChange={(e) => setD({ ...d, price: Number(e.target.value) })} />
        </label>
        <input className={input} value={d.image_url ?? ""} placeholder="Photo link (optional)"
          onChange={(e) => setD({ ...d, image_url: e.target.value })} />
      </div>
      <div className="flex gap-2 md:flex-col">
        <button className={btn} disabled={!dirty} onClick={save}>{saved ? "Saved" : "Save"}</button>
        <button className="px-4 py-2 text-xs uppercase tracking-[0.2em] text-destructive" onClick={remove}>Delete</button>
      </div>
    </div>
  );
}
