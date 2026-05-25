-- 가계부(가족) 관리 · 가입 승인 · 이메일 인증 코드

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

-- 회원가입 이메일 인증번호 테이블은 사용하지 않음. 이미 생성했다면 supabase_migration_drop_signup_email_verification.sql 실행.

create index if not exists idx_household_members_user on public.household_members (user_id, status);
create index if not exists idx_household_join_requests_code_status on public.household_join_requests (household_code, status);

-- 기존 categories 등에만 있던 가계부 코드를 households 로 등록 (관리자 이메일은 첫 승인 시 갱신)
insert into public.households (household_code, admin_email)
select distinct c.household_code, 'pending-admin@local'
from public.categories c
where coalesce(trim(c.household_code), '') <> ''
on conflict (household_code) do nothing;

insert into public.households (household_code, admin_email)
select distinct t.household_code, 'pending-admin@local'
from public.transactions t
where coalesce(trim(t.household_code), '') <> ''
on conflict (household_code) do nothing;

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
