-- 메모 키워드 → 카테고리 학습 (가족 코드별, 기기·브라우저 공유)
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

create index if not exists idx_memo_category_learn_code_keyword
  on public.memo_category_learn (household_code, keyword);

alter table public.memo_category_learn enable row level security;

drop policy if exists "anon memo_category_learn all" on public.memo_category_learn;
drop policy if exists "auth memo_category_learn all" on public.memo_category_learn;

create policy "anon memo_category_learn all"
on public.memo_category_learn
for all
to anon
using (true)
with check (true);

create policy "auth memo_category_learn all"
on public.memo_category_learn
for all
to authenticated
using (true)
with check (true);
