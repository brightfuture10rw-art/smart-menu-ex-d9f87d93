CREATE TABLE public.menu_addons (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null,
  price integer not null default 0,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.menu_addons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_addons TO authenticated;
GRANT ALL ON public.menu_addons TO service_role;
ALTER TABLE public.menu_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads addons" ON public.menu_addons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins insert addons" ON public.menu_addons FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update addons" ON public.menu_addons FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete addons" ON public.menu_addons FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  table_number text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal integer not null default 0,
  service integer not null default 0,
  total integer not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone places order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));