create extension if not exists "pgcrypto";

create table if not exists public.household_users (
  id uuid primary key default gen_random_uuid(),
  household_code text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  household_code text not null,
  l1 text not null,
  l2 text not null,
  l3 text not null,
  created_at timestamptz not null default now(),
  unique (household_code, l1, l2, l3)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_code text not null,
  date date not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount >= 0),
  asset_type text not null,
  owner text not null,
  memo text,
  category_id uuid,
  l1 text not null,
  l2 text not null,
  l3 text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.asset_types (
  id uuid primary key default gen_random_uuid(),
  household_code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (household_code, name)
);

create index if not exists idx_household_users_code on public.household_users (household_code);
create index if not exists idx_categories_code on public.categories (household_code);
create index if not exists idx_transactions_code_date on public.transactions (household_code, date desc);
create index if not exists idx_transactions_code_asset_type_date on public.transactions (household_code, asset_type, date desc);
create index if not exists idx_asset_types_code_name on public.asset_types (household_code, name);

alter table public.household_users enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.asset_types enable row level security;

drop policy if exists "anon household_users all" on public.household_users;
drop policy if exists "anon categories all" on public.categories;
drop policy if exists "anon transactions all" on public.transactions;
drop policy if exists "anon asset_types all" on public.asset_types;

create policy "anon household_users all"
on public.household_users
for all
to anon
using (true)
with check (true);

create policy "anon categories all"
on public.categories
for all
to anon
using (true)
with check (true);

create policy "anon transactions all"
on public.transactions
for all
to anon
using (true)
with check (true);

create policy "anon asset_types all"
on public.asset_types
for all
to anon
using (true)
with check (true);

-- Supabase Auth로 로그인하면 요청 역할이 anon이 아니라 authenticated 입니다.
drop policy if exists "auth household_users all" on public.household_users;
drop policy if exists "auth categories all" on public.categories;
drop policy if exists "auth transactions all" on public.transactions;
drop policy if exists "auth asset_types all" on public.asset_types;

create policy "auth household_users all"
on public.household_users
for all
to authenticated
using (true)
with check (true);

create policy "auth categories all"
on public.categories
for all
to authenticated
using (true)
with check (true);

create policy "auth transactions all"
on public.transactions
for all
to authenticated
using (true)
with check (true);

create policy "auth asset_types all"
on public.asset_types
for all
to authenticated
using (true)
with check (true);
