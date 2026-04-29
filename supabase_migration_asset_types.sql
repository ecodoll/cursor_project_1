-- 자산 종류 기능 추가 마이그레이션
-- 안전하게 여러 번 실행할 수 있도록 IF NOT EXISTS / DROP IF EXISTS 패턴 사용

create extension if not exists "pgcrypto";

-- 1) 거래 테이블에 자산 종류 컬럼 추가
alter table if exists public.transactions
  add column if not exists asset_type text;

-- 기존 데이터 백필: 값이 비어 있으면 기본값 '현금' 지정
update public.transactions
set asset_type = '현금'
where coalesce(trim(asset_type), '') = '';

-- 컬럼 제약 강화
alter table if exists public.transactions
  alter column asset_type set not null;

-- 조회 성능 보강 인덱스
create index if not exists idx_transactions_code_asset_type_date
  on public.transactions (household_code, asset_type, date desc);

-- 2) 자산 종류 마스터 테이블 추가
create table if not exists public.asset_types (
  id uuid primary key default gen_random_uuid(),
  household_code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (household_code, name)
);

create index if not exists idx_asset_types_code_name
  on public.asset_types (household_code, name);

-- 3) 기존 가계별 기본 자산 종류 시드
insert into public.asset_types (household_code, name)
select distinct t.household_code, v.name
from public.transactions t
cross join (
  values ('현금'), ('토스뱅크'), ('하나은행'), ('파주페이')
) as v(name)
where coalesce(trim(t.household_code), '') <> ''
on conflict (household_code, name) do nothing;

insert into public.asset_types (household_code, name)
select distinct c.household_code, v.name
from public.categories c
cross join (
  values ('현금'), ('토스뱅크'), ('하나은행'), ('파주페이')
) as v(name)
where coalesce(trim(c.household_code), '') <> ''
on conflict (household_code, name) do nothing;

insert into public.asset_types (household_code, name)
select distinct u.household_code, v.name
from public.household_users u
cross join (
  values ('현금'), ('토스뱅크'), ('하나은행'), ('파주페이')
) as v(name)
where coalesce(trim(u.household_code), '') <> ''
on conflict (household_code, name) do nothing;

-- 4) RLS 정책 추가
alter table public.asset_types enable row level security;

drop policy if exists "anon asset_types all" on public.asset_types;
create policy "anon asset_types all"
on public.asset_types
for all
to anon
using (true)
with check (true);

drop policy if exists "auth asset_types all" on public.asset_types;
create policy "auth asset_types all"
on public.asset_types
for all
to authenticated
using (true)
with check (true);
