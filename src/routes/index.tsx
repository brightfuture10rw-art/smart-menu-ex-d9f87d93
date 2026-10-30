import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { COURSES, fmtRwf, imageFor, menuQuery } from "@/lib/menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maison Aurèle — The Menu & Online Ordering" },
      { name: "description", content: "Explore the tasting menu of Maison Aurèle and order haute cuisine for delivery or collection." },
      { property: "og:title", content: "Maison Aurèle — The Menu" },
      { property: "og:description", content: "Haute cuisine, champagne and caviar — ordered online from Maison Aurèle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Dish = { id: string; name: string; desc: string; price: number; img?: string };
const fmt = fmtRwf;
function Index() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [placed, setPlaced] = useState<string | null>(null);
  const { data: rows = [], isLoading } = useQuery(menuQuery);
  const ALL: Dish[] = rows.map((r) => ({ id: r.id, name: r.name, desc: r.description, price: r.price, img: imageFor(r) }));
  const courses = [...COURSES, ...rows.map((r) => r.course).filter((c) => !COURSES.includes(c))];
  const MENU = courses
    .map((course) => ({ course, dishes: ALL.filter((_, i) => rows[i]!.course === course) }))
    .filter((c) => c.dishes.length);

  const items = useMemo(
    () => ALL.filter((d) => cart[d.id]).map((d) => ({ ...d, qty: cart[d.id] ?? 0 })),
    [cart, rows],
  );
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const service = Math.round(subtotal * 0.15);
  const add = (id: string, n = 1) =>
    setCart((c) => {
      const q = (c[id] ?? 0) + n;
      const next = { ...c };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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
          Three Michelin stars of quiet indulgence — now delivered to your table, wherever it may be.
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
              {c.dishes.map((d) => (
                <li key={d.id} className="flex flex-col border bg-card">
                  <img src={d.img} alt={d.name} loading="lazy" width={816} height={816}
                    className="aspect-[4/3] w-full object-cover" />
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-2xl">{d.name}</h3>
                    <p className="mt-1 flex-1 text-sm font-light text-muted-foreground">{d.desc}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-display text-xl text-primary">{fmt(d.price)}</span>
                      <button
                        onClick={() => add(d.id)}
                        className={`border border-primary px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${cart[d.id] ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary hover:text-primary-foreground"}`}
                      >
                        {cart[d.id] ? `Selected · ${cart[d.id]}` : "Select"}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <footer className="border-t py-10 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Maison Aurèle · 12 Avenue Montaigne · Daily 18:00 – 23:30 ·{" "}
        <Link to="/admin" className="hover:text-primary">Staff</Link>
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
                  Your order has been received. Our maître d' will call to confirm within minutes.
                </p>
              </div>
            ) : items.length === 0 ? (
              <p className="mt-10 text-sm text-muted-foreground">Your order is empty. Choose from La Carte.</p>
            ) : (
              <>
                <ul className="mt-8 flex-1 space-y-5 overflow-y-auto">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-display text-lg">{i.name}</p>
                        <p className="text-xs text-muted-foreground">{fmt(i.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => add(i.id, -1)} className="h-7 w-7 border">−</button>
                        <span className="w-5 text-center">{i.qty}</span>
                        <button onClick={() => add(i.id)} className="h-7 w-7 border">+</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="space-y-1 border-t pt-4 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Service (15%)</span><span>{fmt(service)}</span></div>
                  <div className="flex justify-between font-display text-2xl text-primary"><span>Total</span><span>{fmt(subtotal + service)}</span></div>
                </div>
                <form
                  className="mt-6 space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    setPlaced(String(f.get("name")));
                    setCart({});
                  }}
                >
                  {[
                    ["name", "Full name", "text"],
                    ["phone", "Phone", "tel"],
                    ["address", "Delivery address or suite number", "text"],
                  ].map(([n, p, t]) => (
                    <input key={n} name={n} type={t} required placeholder={p}
                      className="w-full border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary" />
                  ))}
                  <button type="submit"
                    className="w-full bg-primary py-3 text-xs uppercase tracking-[0.3em] text-primary-foreground transition hover:bg-accent">
                    Place Order
                  </button>
                </form>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
