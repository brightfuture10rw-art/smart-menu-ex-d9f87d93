import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { COURSES, imageFor, menuQuery, type MenuRow } from "@/lib/menu";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

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

  async function submit(e: FormEvent<HTMLFormElement>) {
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
        {mode === "in" ? "Admin Login" : "Create Staff Account"}
      </h1>
      <label className="block space-y-2 text-sm">Email<input name="email" type="email" autoComplete="email" required placeholder="Email" className={input} /></label>
      <label className="block space-y-2 text-sm">Password<input name="password" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} required minLength={6} placeholder="Password" className={input} /></label>
      <Button disabled={busy} className="w-full">{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</Button>
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
  const { data: rows = [], isLoading, error } = useQuery(menuQuery);
  const [adding, setAdding] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["menu"] });

  async function addDish() {
    setAdding(true);
    const sort = Math.max(0, ...rows.map((r) => r.sort)) + 1;
    const { error } = await supabase.from("menu_items").insert({ course: COURSES[0] ?? "Entrées", name: "New dish", price: 0, sort });
    setAdding(false);
    if (error) alert(error.message);
    refresh();
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-primary">Manage Menu</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/"><ArrowLeft /> View menu</Link></Button>
          <Button onClick={addDish} disabled={adding || isLoading}><Plus />{adding ? "Adding…" : "Add item"}</Button>
        </div>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading menu…</p>}
      {error && <p role="alert" className="text-destructive">The menu could not be loaded. Please try again.</p>}
      <div className="space-y-4">
        {rows.map((r) => <DishRow key={r.id} row={r} onChange={refresh} />)}
      </div>
    </div>
  );
}

function DishRow({ row, onChange }: { row: MenuRow; onChange: () => void }) {
  const [d, setD] = useState(row);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dirty = JSON.stringify(d) !== JSON.stringify(row);

  async function save() {
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.from("menu_items").update({
      course: d.course, name: d.name, description: d.description,
      price: Math.max(0, Math.round(d.price)), image_url: d.image_url || null, sort: d.sort,
    }).eq("id", row.id);
    setBusy(false);
    if (error) return setMessage(error.message);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onChange();
  }
  async function remove() {
    if (!confirm(`Remove "${row.name}" from the menu?`)) return;
    setBusy(true);
    const { error } = await supabase.from("menu_items").delete().eq("id", row.id);
    setBusy(false);
    if (error) return setMessage(error.message);
    onChange();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="flex flex-col gap-4 border bg-card p-4 md:flex-row">
      <img src={imageFor(d)} alt={d.name} className="h-28 w-28 shrink-0 object-cover" />
      <div className="grid flex-1 gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-muted-foreground">Name<input className={input} required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Name" /></label>
        <label className="space-y-1 text-sm text-muted-foreground">Category<input className={input} required list={`courses-${row.id}`} value={d.course} onChange={(e) => setD({ ...d, course: e.target.value })} />
          <datalist id={`courses-${row.id}`}>{COURSES.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="space-y-1 text-sm text-muted-foreground md:col-span-2">Description<textarea className={input} value={d.description}
          onChange={(e) => setD({ ...d, description: e.target.value })} placeholder="Description" /></label>
        <label className="space-y-1 text-sm text-muted-foreground">
          Price (RWF)
          <input className={input} required type="number" min={0} step={1} value={d.price}
            onChange={(e) => setD({ ...d, price: Number(e.target.value) })} />
        </label>
        <label className="space-y-1 text-sm text-muted-foreground">Display order<input className={input} required type="number" step={1} value={d.sort} onChange={(e) => setD({ ...d, sort: Number(e.target.value) })} /></label>
        <label className="space-y-1 text-sm text-muted-foreground md:col-span-2">Photo link<input className={input} type="url" value={d.image_url ?? ""} placeholder="https://…"
          onChange={(e) => setD({ ...d, image_url: e.target.value })} /></label>
        {message && <p role="alert" className="text-sm text-destructive md:col-span-2">{message}</p>}
      </div>
      <div className="flex gap-2 md:flex-col">
        <Button type="submit" disabled={!dirty || busy}><Save />{busy ? "Saving…" : saved ? "Saved" : "Save"}</Button>
        <Button type="button" variant="ghost" className="text-destructive" disabled={busy} onClick={remove}><Trash2 />Delete</Button>
      </div>
    </form>
  );
}
