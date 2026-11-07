import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { COURSES, addonsQuery, imageFor, menuQuery, type AddonRow, type MenuRow } from "@/lib/menu";
import { finishOrder, ordersQuery, type OrderRow } from "@/lib/orders";
import { fmtRwf } from "@/lib/menu";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, RefreshCw, Save, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Staff Area — Maison Aurèle" },
      { name: "description", content: "Staff area for managing the Maison Aurèle menu and orders." },
      { property: "og:title", content: "Staff Area — Maison Aurèle" },
      { property: "og:description", content: "Manage dishes, prices, extras and orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const input =
  "w-full border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";
const fmt = fmtRwf;

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
            <button
              className="border border-primary px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary transition hover:bg-primary hover:text-primary-foreground"
              onClick={() => supabase.auth.signOut()}
            >
              Sign out
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-12">
        {!ready ? null : !session ? (
          <div className="mx-auto max-w-sm text-center">
            <h1 className="font-display text-4xl text-primary">Staff Area</h1>
            <p className="mt-4 text-sm text-muted-foreground">You need to sign in to continue.</p>
            <Button asChild className="mt-6"><Link to="/login">Go to login</Link></Button>
          </div>
        ) : isAdmin === null ? (
          <p className="text-muted-foreground">Checking access…</p>
        ) : !isAdmin ? (
          <p className="text-muted-foreground">This account doesn't have admin access.</p>
        ) : (
          <StaffArea />
        )}
      </main>
    </div>
  );
}

function StaffArea() {
  const [tab, setTab] = useState<"orders" | "menu">("orders");
  const { data: orders = [] } = useQuery(ordersQuery);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTab("orders")}
          className={`border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${tab === "orders" ? "border-primary bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"}`}
        >
          Orders{pendingCount > 0 ? ` (${pendingCount} new)` : ""}
        </button>
        <button
          onClick={() => setTab("menu")}
          className={`border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${tab === "menu" ? "border-primary bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"}`}
        >
          Menu
        </button>
      </div>
      {tab === "orders" ? <OrdersPanel /> : <MenuEditor />}
    </div>
  );
}

function OrdersPanel() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading, error, refetch, isFetching } = useQuery({
    ...ordersQuery,
    refetchInterval: 15000,
  });
  const pending = orders.filter((o) => o.status === "pending");
  const finished = orders.filter((o) => o.status === "finished");

  async function done(id: string) {
    try {
      await finishOrder(id);
      qc.invalidateQueries({ queryKey: ["orders"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update the order.");
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-primary">Orders</h1>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw />{isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading orders…</p>}
      {error && <p role="alert" className="text-destructive">Orders could not be loaded. Please try again.</p>}

      <h2 className="mb-4 font-display text-2xl text-accent">Pending ({pending.length})</h2>
      <div className="space-y-4">
        {pending.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">No pending orders right now.</p>
        )}
        {pending.map((o) => <OrderCard key={o.id} order={o} onDone={() => done(o.id)} />)}
      </div>

      <h2 className="mb-4 mt-12 font-display text-2xl text-accent">Finished ({finished.length})</h2>
      <div className="space-y-4">
        {finished.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">No finished orders yet.</p>
        )}
        {finished.map((o) => <OrderCard key={o.id} order={o} />)}
      </div>
    </div>
  );
}

function OrderCard({ order, onDone }: { order: OrderRow; onDone?: () => void }) {
  return (
    <div className="border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="border border-primary px-3 py-1 font-display text-lg text-primary">
            Table {order.table_number}
          </span>
          <span className="ml-3 font-display text-xl">{order.customer_name}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(order.created_at).toLocaleString()}
        </span>
      </div>
      <ul className="mt-4 space-y-1 text-sm">
        {order.items.map((i, idx) => (
          <li key={idx}>
            <div className="flex justify-between">
              <span>{i.qty} × {i.name}</span>
              <span>{fmt(i.line)}</span>
            </div>
            {i.addons.map((a) => (
              <p key={a.name} className="pl-6 text-xs text-muted-foreground">
                + {a.name} ({fmt(a.price)})
              </p>
            ))}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <span className="font-display text-xl text-primary">Total {fmt(order.total)}</span>
        {onDone && <Button onClick={onDone}>Mark as served</Button>}
      </div>
    </div>
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
        <AddonsEditor dishId={row.id} />
        {message && <p role="alert" className="text-sm text-destructive md:col-span-2">{message}</p>}
      </div>
      <div className="flex gap-2 md:flex-col">
        <Button type="submit" disabled={!dirty || busy}><Save />{busy ? "Saving…" : saved ? "Saved" : "Save"}</Button>
        <Button type="button" variant="ghost" className="text-destructive" disabled={busy} onClick={remove}><Trash2 />Delete</Button>
      </div>
    </form>
  );
}

function AddonsEditor({ dishId }: { dishId: string }) {
  const qc = useQueryClient();
  const { data: addons = [] } = useQuery(addonsQuery);
  const mine = addons.filter((a) => a.menu_item_id === dishId);
  const refresh = () => qc.invalidateQueries({ queryKey: ["addons"] });

  async function add() {
    const { error } = await supabase
      .from("menu_addons")
      .insert({ menu_item_id: dishId, name: "New extra", price: 0, sort: mine.length + 1 });
    if (error) alert(error.message);
    refresh();
  }

  return (
    <div className="space-y-2 md:col-span-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Extras (add-ons) — guests pick these and the price adds up automatically</span>
        <button type="button" onClick={add} className="shrink-0 text-xs text-primary hover:underline">+ Add extra</button>
      </div>
      {mine.map((a) => <AddonEditor key={a.id} addon={a} onChange={refresh} />)}
    </div>
  );
}

function AddonEditor({ addon, onChange }: { addon: AddonRow; onChange: () => void }) {
  const [name, setName] = useState(addon.name);
  const [price, setPrice] = useState(addon.price);
  const [busy, setBusy] = useState(false);
  const dirty = name !== addon.name || price !== addon.price;

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("menu_addons")
      .update({ name, price: Math.max(0, Math.round(price)) })
      .eq("id", addon.id);
    setBusy(false);
    if (error) return alert(error.message);
    onChange();
  }
  async function remove() {
    if (!confirm(`Remove the extra "${addon.name}"?`)) return;
    setBusy(true);
    const { error } = await supabase.from("menu_addons").delete().eq("id", addon.id);
    setBusy(false);
    if (error) return alert(error.message);
    onChange();
  }

  return (
    <div className="flex items-center gap-2">
      <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Extra name" />
      <input className={`${input} w-32`} type="number" min={0} step={1} value={price}
        onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price" />
      <Button type="button" variant="outline" disabled={!dirty || busy} onClick={save}>Save</Button>
      <Button type="button" variant="ghost" className="text-destructive" disabled={busy} onClick={remove}><Trash2 /></Button>
    </div>
  );
}
