import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { COURSES, addonsQuery, fmtRwf, imageFor, menuQuery, type AddonRow } from "@/lib/menu";
import { placeOrder, type OrderItem } from "@/lib/orders";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maison Aurèle — The Menu & Online Ordering" },
      { name: "description", content: "Explore the tasting menu of Maison Aurèle and order haute cuisine to your table." },
      { property: "og:title", content: "Maison Aurèle — The Menu" },
      { property: "og:description", content: "Haute cuisine, champagne and caviar — ordered online from Maison Aurèle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Dish = { id: string; name: string; desc: string; price: number; img?: string | undefined };
type Sel = { qty: number; addons: string[] };
const fmt = fmtRwf;

function Index() {
  const [cart, setCart] = useState<Record<string, Sel>>({});
  const [open, setOpen] = useState(false);
  const [placed, setPlaced] = useState<string | null>(null);
  const { data: rows = [], isLoading } = useQuery(menuQuery);
  const { data: addonRows = [] } = useQuery(addonsQuery);

  const addonById = useMemo(
    () => Object.fromEntries(addonRows.map((a) => [a.id, a])),
    [addonRows],
  );
  const addonsFor = (dishId: string): AddonRow[] =>
    addonRows.filter((a) => a.menu_item_id === dishId);

  const ALL: Dish[] = rows.map((r) => ({ id: r.id, name: r.name, desc: r.description, price: r.price, img: imageFor(r) }));
  const courses = [...new Set([...COURSES, ...rows.map((r) => r.course)])];
  const MENU = courses
    .map((course) => ({ course, dishes: ALL.filter((_, i) => rows[i]!.course === course) }))
    .filter((c) => c.dishes.length);

  const unitPrice = (d: Dish, sel: Sel) =>
    d.price + sel.addons.reduce((s, id) => s + (addonById[id]?.price ?? 0), 0);

  const items = useMemo(
    () =>
      ALL.filter((d) => cart[d.id]).map((d) => {
        const sel = cart[d.id]!;
        const unit = unitPrice(d, sel);
        return {
          ...d,
          qty: sel.qty,
          unit,
          addonList: sel.addons
            .map((id) => addonById[id])
            .filter((a): a is AddonRow => !!a)
            .map((a) => ({ name: a.name, price: a.price })),
        };
      }),
    [cart, rows, addonById],
  );
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit, 0);
  const service = Math.round(subtotal * 0.15);

  const add = (id: string, n = 1) =>
    setCart((c) => {
      const cur = c[id] ?? { qty: 0, addons: [] };
      const q = cur.qty + n;
      const next = { ...c };
      if (q <= 0) delete next[id];
      else next[id] = { ...cur, qty: q };
      return next;
    });

  const toggleAddon = (dishId: string, addonId: string) =>
    setCart((c) => {
      const cur = c[dishId];
      if (!cur) return c;
      const has = cur.addons.includes(addonId);
      return {
        ...c,
        [dishId]: {
          ...cur,
          addons: has ? cur.addons.filter((a) => a !== addonId) : [...cur.addons, addonId],
        },
      };
    });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <span className="font-display text-2xl tracking-[0.3em] text-primary">MAISON AURÈLE</span>
          <button
            onClick={() => setOpen(true)}
            className="border border-primary px-5 py-2 text-xs uppercase tracking-[0.25em] text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            Your Order ({count})
          </button>
        </div>
      </header>

      <section className="px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-muted-foreground">Est. 1924 · Paris · Monaco</p>
        <h1 className="mt-6 font-display text-6xl font-light italic text-accent md:text-8xl">La Carte</h1>
        <div className="mx-auto my-8 h-px w-24 bg-primary" />
        <p className="mx-auto max-w-xl font-display text-xl text-muted-foreground">
          Three Michelin stars of quiet indulgence — served at your table, the moment you order.
        </p>
      </section>

      <main className="mx-auto max-w-3xl space-y-24 px-6 pb-32">
        {isLoading && <p className="text-center text-muted-foreground">Preparing the menu…</p>}
        {MENU.map((c) => (
          <section key={c.course}>
            <div className="mb-10 text-center">
              <h2 className="font-display text-4xl text-primary">{c.course}</h2>
            </div>
            <ul className="grid gap-8 sm:grid-cols-2">
              {c.dishes.map((d) => {
                const sel = cart[d.id];
                const extras = addonsFor(d.id);
                return (
                  <li key={d.id} className="flex flex-col border bg-card">
                    <img src={d.img} alt={d.name} loading="lazy" width={816} height={816}
                      className="aspect-[4/3] w-full object-cover" />
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-2xl">{d.name}</h3>
                      <p className="mt-1 flex-1 text-sm font-light text-muted-foreground">{d.desc}</p>

                      {sel && extras.length > 0 && (
                        <fieldset className="mt-4 space-y-2 border-t pt-4">
                          <legend className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Make it yours
                          </legend>
                          {extras.map((a) => (
                            <label key={a.id} className="flex cursor-pointer items-center justify-between gap-2 text-sm">
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={sel.addons.includes(a.id)}
                                  onChange={() => toggleAddon(d.id, a.id)}
                                  className="accent-[hsl(var(--primary))]"
                                />
                                {a.name}
                              </span>
                              <span className="text-muted-foreground">+{fmt(a.price)}</span>
                            </label>
                          ))}
                        </fieldset>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <span className="font-display text-xl text-primary">
                          {fmt(sel ? unitPrice(d, sel) : d.price)}
                        </span>
                        <button
                          onClick={() => add(d.id)}
                          className={`border border-primary px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${sel ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary hover:text-primary-foreground"}`}
                        >
                          {sel ? `Selected · ${sel.qty}` : "Select"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>

      <footer className="border-t py-10 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Maison Aurèle · 12 Avenue Montaigne · Daily 18:00 – 23:30
        <div className="mt-4"><Link to="/login" className="text-primary hover:underline">Login</Link></div>
      </footer>

      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-overlay" onClick={() => setOpen(false)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col border-l bg-card p-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-3xl text-primary">Your Order</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            {placed ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="font-display text-3xl italic text-accent">Merci, {placed}.</p>
                <p className="mt-4 text-sm text-muted-foreground">
                  Your order has been sent to the kitchen. Our staff will bring it to your table shortly.
                </p>
              </div>
            ) : items.length === 0 ? (
              <p className="mt-10 text-sm text-muted-foreground">Your order is empty. Choose from La Carte.</p>
            ) : (
              <OrderForm
                items={items}
                subtotal={subtotal}
                service={service}
                onQty={add}
                onPlaced={(name) => {
                  setPlaced(name);
                  setCart({});
                }}
              />
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function OrderForm({
  items,
  subtotal,
  service,
  onQty,
  onPlaced,
}: {
  items: { id: string; name: string; qty: number; unit: number; addonList: { name: string; price: number }[] }[];
  subtotal: number;
  service: number;
  onQty: (id: string, n?: number) => void;
  onPlaced: (name: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const orderItems: OrderItem[] = items.map((i) => ({
      name: i.name,
      qty: i.qty,
      unit: i.unit,
      addons: i.addonList,
      line: i.qty * i.unit,
    }));
    setBusy(true);
    setError(null);
    try {
      await placeOrder({
        customer_name: String(f.get("name")),
        phone: String(f.get("phone")),
        table_number: String(f.get("table")),
        items: orderItems,
        subtotal,
        service,
        total: subtotal + service,
      });
      onPlaced(String(f.get("name")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The order could not be sent. Please try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <ul className="mt-8 flex-1 space-y-5 overflow-y-auto">
        {items.map((i) => (
          <li key={i.id} className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg">{i.name}</p>
              {i.addonList.map((a) => (
                <p key={a.name} className="text-xs text-muted-foreground">
                  + {a.name} ({fmt(a.price)})
                </p>
              ))}
              <p className="text-xs text-muted-foreground">{fmt(i.unit)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onQty(i.id, -1)} className="h-7 w-7 border">−</button>
              <span className="w-5 text-center">{i.qty}</span>
              <button onClick={() => onQty(i.id)} className="h-7 w-7 border">+</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="space-y-1 border-t pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>Service (15%)</span><span>{fmt(service)}</span></div>
        <div className="flex justify-between font-display text-2xl text-primary"><span>Total</span><span>{fmt(subtotal + service)}</span></div>
      </div>
      <form className="mt-6 space-y-3" onSubmit={submit}>
        {[
          ["name", "Full name", "text", true],
          ["phone", "Phone (optional)", "tel", false],
          ["table", "Your table number", "text", true],
        ].map(([n, p, t, req]) => (
          <input key={n} name={n} type={t} required={req as boolean} placeholder={p as string}
            className="w-full border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" />
        ))}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={busy}
          className="w-full bg-primary py-3 text-xs uppercase tracking-[0.3em] text-primary-foreground transition hover:bg-accent disabled:opacity-50">
          {busy ? "Sending…" : "Place Order"}
        </button>
      </form>
    </>
  );
}
