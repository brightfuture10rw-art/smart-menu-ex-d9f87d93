import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

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

type Dish = { id: string; name: string; desc: string; price: number };
const MENU: { course: string; note: string; dishes: Dish[] }[] = [
  {
    course: "Caviar & Raw Bar",
    note: "Served with blinis and crème fraîche",
    dishes: [
      { id: "c1", name: "Beluga Imperial, 50g", desc: "Iranian Beluga, warm buckwheat blinis, chive crème", price: 420 },
      { id: "c2", name: "Oscietra Royal, 30g", desc: "Golden Oscietra, quail egg mimosa, brioche soldiers", price: 185 },
      { id: "c3", name: "Gillardeau Oysters", desc: "Half dozen, mignonette of shallot and champagne", price: 68 },
    ],
  },
  {
    course: "Entrées",
    note: "To begin",
    dishes: [
      { id: "e1", name: "Foie Gras Torchon", desc: "Sauternes gel, toasted brioche, fig compote", price: 64 },
      { id: "e2", name: "Langoustine Carpaccio", desc: "Yuzu, Kristal caviar, shiso blossom", price: 72 },
      { id: "e3", name: "White Truffle Velouté", desc: "Alba truffle shaved tableside, Jerusalem artichoke", price: 95 },
    ],
  },
  {
    course: "Plats Principaux",
    note: "The heart of the meal",
    dishes: [
      { id: "m1", name: "A5 Kobe Wagyu, 150g", desc: "Charcoal-seared, smoked bone marrow jus, pommes soufflées", price: 290 },
      { id: "m2", name: "Blue Lobster Thermidor", desc: "Brittany lobster, cognac cream, gruyère gratin", price: 168 },
      { id: "m3", name: "Bresse Chicken en Vessie", desc: "Black truffle, vin jaune sauce, morels", price: 145 },
      { id: "m4", name: "Wild Turbot", desc: "Champagne beurre blanc, sea herbs, Oscietra pearls", price: 128 },
    ],
  },
  {
    course: "Desserts",
    note: "To finish",
    dishes: [
      { id: "d1", name: "Gold Leaf Chocolate Sphere", desc: "Grand cru Valrhona, 24k gold, warm caramel pour", price: 48 },
      { id: "d2", name: "Soufflé au Grand Marnier", desc: "Vanilla bean crème anglaise", price: 36 },
      { id: "d3", name: "Cheese Trolley Selection", desc: "Five affinés from Maître Antony, honeycomb", price: 42 },
    ],
  },
  {
    course: "Cellar",
    note: "By the bottle",
    dishes: [
      { id: "w1", name: "Dom Pérignon 2013", desc: "Champagne, France", price: 520 },
      { id: "w2", name: "Château Margaux 2010", desc: "Premier Grand Cru Classé, Bordeaux", price: 1450 },
      { id: "w3", name: "Krug Grande Cuvée", desc: "Champagne, France", price: 480 },
    ],
  },
];
const ALL = MENU.flatMap((c) => c.dishes);
const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

function Index() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [placed, setPlaced] = useState<string | null>(null);

  const items = useMemo(
    () => ALL.filter((d) => cart[d.id]).map((d) => ({ ...d, qty: cart[d.id] ?? 0 })),
    [cart],
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
        {MENU.map((c) => (
          <section key={c.course}>
            <div className="mb-10 text-center">
              <h2 className="font-display text-4xl text-primary">{c.course}</h2>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">{c.note}</p>
            </div>
            <ul className="space-y-8">
              {c.dishes.map((d) => (
                <li key={d.id} className="group flex items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3">
                      <h3 className="font-display text-2xl">{d.name}</h3>
                      <span className="flex-1 border-b border-dotted" />
                      <span className="font-display text-xl text-primary">{fmt(d.price)}</span>
                    </div>
                    <p className="mt-1 text-sm font-light text-muted-foreground">{d.desc}</p>
                  </div>
                  <button
                    onClick={() => add(d.id)}
                    aria-label={`Add ${d.name}`}
                    className="mt-1 h-9 w-9 shrink-0 border text-primary transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    {cart[d.id] ? cart[d.id] : "+"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <footer className="border-t py-10 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Maison Aurèle · 12 Avenue Montaigne · Daily 18:00 – 23:30
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
