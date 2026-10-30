create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users
  for each row execute function public.handle_new_user_role();

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  course text not null,
  name text not null,
  description text not null default '',
  price integer not null default 0,
  image_key text,
  image_url text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;
grant all on public.menu_items to service_role;
alter table public.menu_items enable row level security;
create policy "anyone reads menu" on public.menu_items for select to anon, authenticated using (true);
create policy "admins insert menu" on public.menu_items for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "admins update menu" on public.menu_items for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admins delete menu" on public.menu_items for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

insert into public.menu_items (course, name, description, price, image_key, sort) values
('Caviar & Raw Bar','Beluga Imperial, 50g','Iranian Beluga, warm buckwheat blinis, chive crème',609000,'c1',1),
('Caviar & Raw Bar','Oscietra Royal, 30g','Golden Oscietra, quail egg mimosa, brioche soldiers',268000,'c2',2),
('Caviar & Raw Bar','Gillardeau Oysters','Half dozen, mignonette of shallot and champagne',99000,'c3',3),
('Entrées','Foie Gras Torchon','Sauternes gel, toasted brioche, fig compote',93000,'e1',4),
('Entrées','Langoustine Carpaccio','Yuzu, Kristal caviar, shiso blossom',104000,'e2',5),
('Entrées','White Truffle Velouté','Alba truffle shaved tableside, Jerusalem artichoke',138000,'e3',6),
('Plats Principaux','A5 Kobe Wagyu, 150g','Charcoal-seared, smoked bone marrow jus, pommes soufflées',421000,'m1',7),
('Plats Principaux','Blue Lobster Thermidor','Brittany lobster, cognac cream, gruyère gratin',244000,'m2',8),
('Plats Principaux','Bresse Chicken en Vessie','Black truffle, vin jaune sauce, morels',210000,'m3',9),
('Plats Principaux','Wild Turbot','Champagne beurre blanc, sea herbs, Oscietra pearls',186000,'m4',10),
('Desserts','Gold Leaf Chocolate Sphere','Grand cru Valrhona, 24k gold, warm caramel pour',70000,'d1',11),
('Desserts','Soufflé au Grand Marnier','Vanilla bean crème anglaise',52000,'d2',12),
('Desserts','Cheese Trolley Selection','Five affinés from Maître Antony, honeycomb',61000,'d3',13),
('Cellar','Dom Pérignon 2013','Champagne, France',754000,'w1',14),
('Cellar','Château Margaux 2010','Premier Grand Cru Classé, Bordeaux',2103000,'w2',15),
('Cellar','Krug Grande Cuvée','Champagne, France',696000,'w3',16);