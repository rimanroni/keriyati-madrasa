-- =====================================================================
--  মাদ্রাসা হিসাব — Supabase Database Schema
--  Supabase Dashboard → SQL Editor → New query → পুরোটা পেস্ট → Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ============================ ১. মাদ্রাসা ============================
create table if not exists public.madrasas (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'আমার মাদ্রাসা',
  address     text,
  phone       text,
  logo_url    text,
  theme       text not null default 'green',   -- green | blue | maroon | purple | dark
  created_at  timestamptz not null default now()
);

-- ============================ ২. ইউজার / রোল =========================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  madrasa_id  uuid references public.madrasas(id) on delete cascade,
  full_name   text not null default '',
  phone       text,
  avatar_url  text,
  role        text not null default 'viewer'
              check (role in ('owner','admin','treasurer','viewer')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================ ৩. সদস্য (দাতা) =======================
create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  madrasa_id  uuid not null references public.madrasas(id) on delete cascade,
  full_name   text not null,
  phone       text,
  avatar_url  text,
  note        text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================ ৪. জমা ================================
create table if not exists public.donations (
  id          uuid primary key default gen_random_uuid(),
  madrasa_id  uuid not null references public.madrasas(id) on delete cascade,
  member_id   uuid references public.members(id) on delete set null,
  donor_name  text not null,
  amount      numeric(12,2) not null check (amount > 0),
  method      text not null default 'cash'
              check (method in ('cash','bkash','nagad','bank','other')),
  month       text not null,                    -- '2026-10'
  donated_on  date not null default current_date,
  note        text,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
create index if not exists donations_month_idx on public.donations(madrasa_id, month);

-- ============================ ৫. খরচের খাত ==========================
create table if not exists public.expense_categories (
  id          uuid primary key default gen_random_uuid(),
  madrasa_id  uuid not null references public.madrasas(id) on delete cascade,
  name        text not null,
  icon        text default '💸',
  sort_order  int not null default 0
);

-- ============================ ৬. খরচ ================================
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  madrasa_id  uuid not null references public.madrasas(id) on delete cascade,
  category_id uuid references public.expense_categories(id) on delete set null,
  title       text not null,
  amount      numeric(12,2) not null check (amount > 0),
  month       text not null,
  spent_on    date not null default current_date,
  note        text,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
create index if not exists expenses_month_idx on public.expenses(madrasa_id, month);

-- ============================ ৭. বিগত মাসের বহন =====================
create table if not exists public.opening_balances (
  id          uuid primary key default gen_random_uuid(),
  madrasa_id  uuid not null references public.madrasas(id) on delete cascade,
  month       text not null,
  amount      numeric(12,2) not null default 0,
  unique (madrasa_id, month)
);

-- ============================ ৮. নোটিশ ==============================
create table if not exists public.notices (
  id          uuid primary key default gen_random_uuid(),
  madrasa_id  uuid not null references public.madrasas(id) on delete cascade,
  title       text not null,
  body        text,
  pinned      boolean not null default false,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

-- ============================ ৯. অডিট লগ ============================
create table if not exists public.audit_logs (
  id          bigserial primary key,
  madrasa_id  uuid references public.madrasas(id) on delete cascade,
  actor       uuid references auth.users(id),
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  detail      jsonb,
  created_at  timestamptz not null default now()
);

-- =====================================================================
--  হেল্পার ফাংশন (RLS-এ ব্যবহারের জন্য)
-- =====================================================================
create or replace function public.my_madrasa_id() returns uuid
language sql stable security definer set search_path = public as $$
  select madrasa_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.can_write() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('owner','admin','treasurer')
                   from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('owner','admin')
                   from public.profiles where id = auth.uid()), false);
$$;

-- =====================================================================
--  Row Level Security
-- =====================================================================
alter table public.madrasas            enable row level security;
alter table public.profiles            enable row level security;
alter table public.members             enable row level security;
alter table public.donations           enable row level security;
alter table public.expense_categories  enable row level security;
alter table public.expenses            enable row level security;
alter table public.opening_balances    enable row level security;
alter table public.notices             enable row level security;
alter table public.audit_logs          enable row level security;

-- ---------- madrasas ----------
drop policy if exists "madrasa read" on public.madrasas;
drop policy if exists "madrasa public read" on public.madrasas;
create policy "madrasa public read" on public.madrasas
  for select to anon, authenticated using (true);

drop policy if exists "madrasa update" on public.madrasas;
create policy "madrasa update" on public.madrasas
  for update to authenticated
  using (id = public.my_madrasa_id() and public.is_admin())
  with check (id = public.my_madrasa_id() and public.is_admin());

-- ---------- profiles ----------
drop policy if exists "profile read" on public.profiles;
create policy "profile read" on public.profiles
  for select to authenticated
  using (id = auth.uid() or madrasa_id = public.my_madrasa_id());

drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or (madrasa_id = public.my_madrasa_id() and public.is_admin()))
  with check (madrasa_id = public.my_madrasa_id());

drop policy if exists "profile admin insert" on public.profiles;
create policy "profile admin insert" on public.profiles
  for insert to authenticated
  with check (madrasa_id = public.my_madrasa_id() and public.is_admin());

-- ---------- members ----------
drop policy if exists "member read" on public.members;
drop policy if exists "member public read" on public.members;
create policy "member public read" on public.members
  for select to anon, authenticated using (true);

drop policy if exists "member write" on public.members;
create policy "member write" on public.members
  for all to authenticated
  using (madrasa_id = public.my_madrasa_id() and public.can_write())
  with check (madrasa_id = public.my_madrasa_id() and public.can_write());

-- ---------- donations ----------
drop policy if exists "donation read" on public.donations;
drop policy if exists "donation public read" on public.donations;
create policy "donation public read" on public.donations
  for select to anon, authenticated using (true);

drop policy if exists "donation write" on public.donations;
create policy "donation write" on public.donations
  for all to authenticated
  using (madrasa_id = public.my_madrasa_id() and public.can_write())
  with check (madrasa_id = public.my_madrasa_id() and public.can_write());

-- ---------- expense_categories ----------
drop policy if exists "cat read" on public.expense_categories;
drop policy if exists "cat public read" on public.expense_categories;
create policy "cat public read" on public.expense_categories
  for select to anon, authenticated using (true);

drop policy if exists "cat write" on public.expense_categories;
create policy "cat write" on public.expense_categories
  for all to authenticated
  using (madrasa_id = public.my_madrasa_id() and public.can_write())
  with check (madrasa_id = public.my_madrasa_id() and public.can_write());

-- ---------- expenses ----------
drop policy if exists "expense read" on public.expenses;
drop policy if exists "expense public read" on public.expenses;
create policy "expense public read" on public.expenses
  for select to anon, authenticated using (true);

drop policy if exists "expense write" on public.expenses;
create policy "expense write" on public.expenses
  for all to authenticated
  using (madrasa_id = public.my_madrasa_id() and public.can_write())
  with check (madrasa_id = public.my_madrasa_id() and public.can_write());

-- ---------- opening_balances ----------
drop policy if exists "opening read" on public.opening_balances;
drop policy if exists "opening public read" on public.opening_balances;
create policy "opening public read" on public.opening_balances
  for select to anon, authenticated using (true);

drop policy if exists "opening write" on public.opening_balances;
create policy "opening write" on public.opening_balances
  for all to authenticated
  using (madrasa_id = public.my_madrasa_id() and public.can_write())
  with check (madrasa_id = public.my_madrasa_id() and public.can_write());

-- ---------- notices ----------
drop policy if exists "notice read" on public.notices;
drop policy if exists "notice public read" on public.notices;
create policy "notice public read" on public.notices
  for select to anon, authenticated using (true);

drop policy if exists "notice write" on public.notices;
create policy "notice write" on public.notices
  for all to authenticated
  using (madrasa_id = public.my_madrasa_id() and public.is_admin())
  with check (madrasa_id = public.my_madrasa_id() and public.is_admin());

-- ---------- audit_logs ----------
drop policy if exists "audit read" on public.audit_logs;
create policy "audit read" on public.audit_logs
  for select to authenticated
  using (madrasa_id = public.my_madrasa_id() and public.is_admin());

drop policy if exists "audit insert" on public.audit_logs;
create policy "audit insert" on public.audit_logs
  for insert to authenticated
  with check (madrasa_id = public.my_madrasa_id());

-- =====================================================================
--  নতুন ইউজার সাইন-আপ হলে প্রোফাইল তৈরি
--  (প্রথম ইউজার স্বয়ংক্রিয়ভাবে owner হবে)
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m_id uuid;
  new_role text;
begin
  select id into m_id from public.madrasas order by created_at limit 1;

  if m_id is null then
    insert into public.madrasas (name) values ('আমার মাদ্রাসা') returning id into m_id;
    insert into public.expense_categories (madrasa_id, name, icon, sort_order) values
      (m_id, 'হুজুরের বেতন', '👤', 1),
      (m_id, 'বিদ্যুৎ বিল',   '💡', 2),
      (m_id, 'খাবার',         '🍚', 3),
      (m_id, 'মেরামত',        '🔧', 4),
      (m_id, 'বই ও খাতা',     '📚', 5),
      (m_id, 'অন্যান্য',      '💸', 6);
  end if;

  if not exists (select 1 from public.profiles) then
    new_role := 'owner';
  else
    new_role := 'viewer';
  end if;

  insert into public.profiles (id, madrasa_id, full_name, phone, role)
  values (
    new.id,
    m_id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new_role
  );

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
--  রোল এস্কেলেশন ঠেকানো (নিজে নিজে admin হওয়া যাবে না)
-- =====================================================================
create or replace function public.guard_role_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'শুধু অ্যাডমিন রোল পরিবর্তন করতে পারবেন';
  end if;
  return new;
end $$;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.guard_role_change();
