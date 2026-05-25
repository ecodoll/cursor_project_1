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

create table if not exists public.memo_category_learn (
  id uuid primary key default gen_random_uuid(),
  household_code text not null,
  keyword text not null,
  l1 text not null,
  l2 text not null,
  l3 text not null,
  category_id uuid,
  updated_at timestamptz not null default now(),
  unique (household_code, keyword)
);

create index if not exists idx_household_users_code on public.household_users (household_code);
create index if not exists idx_categories_code on public.categories (household_code);
create index if not exists idx_transactions_code_date on public.transactions (household_code, date desc);
create index if not exists idx_transactions_code_asset_type_date on public.transactions (household_code, asset_type, date desc);
create index if not exists idx_asset_types_code_name on public.asset_types (household_code, name);
create index if not exists idx_memo_category_learn_code_keyword on public.memo_category_learn (household_code, keyword);

alter table public.household_users enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.asset_types enable row level security;
alter table public.memo_category_learn enable row level security;

drop policy if exists "anon household_users all" on public.household_users;
drop policy if exists "anon categories all" on public.categories;
drop policy if exists "anon transactions all" on public.transactions;
drop policy if exists "anon asset_types all" on public.asset_types;
drop policy if exists "anon memo_category_learn all" on public.memo_category_learn;

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

create policy "anon memo_category_learn all"
on public.memo_category_learn
for all
to anon
using (true)
with check (true);

-- Supabase Auth로 로그인하면 요청 역할이 anon이 아니라 authenticated 입니다.
drop policy if exists "auth household_users all" on public.household_users;
drop policy if exists "auth categories all" on public.categories;
drop policy if exists "auth transactions all" on public.transactions;
drop policy if exists "auth asset_types all" on public.asset_types;
drop policy if exists "auth memo_category_learn all" on public.memo_category_learn;

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

create policy "auth memo_category_learn all"
on public.memo_category_learn
for all
to authenticated
using (true)
with check (true);

-- 가계부 관리 · 가입 승인 · 이메일 인증 (supabase_migration_household_auth.sql 과 동일)
create table if not exists public.households (
  household_code text primary key,
  admin_email text not null,
  admin_user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_code text not null references public.households (household_code) on delete cascade,
  user_id uuid not null,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'active' check (status in ('active', 'pending', 'rejected')),
  created_at timestamptz not null default now(),
  unique (household_code, user_id)
);

create table if not exists public.household_join_requests (
  id uuid primary key default gen_random_uuid(),
  household_code text not null references public.households (household_code) on delete cascade,
  requester_email text not null,
  requester_user_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (household_code, requester_user_id)
);

create index if not exists idx_household_members_user on public.household_members (user_id, status);
create index if not exists idx_household_join_requests_code_status on public.household_join_requests (household_code, status);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_join_requests enable row level security;

drop policy if exists "anon households all" on public.households;
drop policy if exists "auth households all" on public.households;
drop policy if exists "anon household_members all" on public.household_members;
drop policy if exists "auth household_members all" on public.household_members;
drop policy if exists "anon household_join_requests all" on public.household_join_requests;
drop policy if exists "auth household_join_requests all" on public.household_join_requests;
create policy "anon households all" on public.households for all to anon using (true) with check (true);
create policy "auth households all" on public.households for all to authenticated using (true) with check (true);
create policy "anon household_members all" on public.household_members for all to anon using (true) with check (true);
create policy "auth household_members all" on public.household_members for all to authenticated using (true) with check (true);
create policy "anon household_join_requests all" on public.household_join_requests for all to anon using (true) with check (true);
create policy "auth household_join_requests all" on public.household_join_requests for all to authenticated using (true) with check (true);
