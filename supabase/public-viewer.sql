-- =====================================================================
--  ভিউয়ার মোড — লগইন ছাড়াই সব হিসাব দেখা যাবে
--  ---------------------------------------------------------------
--  Supabase Dashboard → SQL Editor → New query → পুরোটা পেস্ট → Run
--
--  কী বদলাবে:
--    • সাধারণ সদস্য (anon) লগইন ছাড়াই পড়তে পারবে:
--      মাদ্রাসার তথ্য, সদস্য তালিকা, জমা, খরচ, খরচের খাত,
--      বিগত মাসের বহন, নোটিশ
--    • লেখা/বদলানো/মুছে ফেলা — আগের মতোই শুধু লগইন করা
--      owner/admin/treasurer পারবে (RLS আগেই সেটা আটকে রাখে)
--    • profiles (কে কোন রোল) — শুধু লগইন করা অ্যাডমিন দেখবে
--
--  বারবার চালালেও সমস্যা নেই।
-- =====================================================================

-- ---------- madrasas ----------
drop policy if exists "madrasa read" on public.madrasas;
drop policy if exists "madrasa public read" on public.madrasas;
create policy "madrasa public read" on public.madrasas
  for select to anon, authenticated using (true);

-- ---------- members ----------
drop policy if exists "member read" on public.members;
drop policy if exists "member public read" on public.members;
create policy "member public read" on public.members
  for select to anon, authenticated using (true);

-- ---------- donations ----------
drop policy if exists "donation read" on public.donations;
drop policy if exists "donation public read" on public.donations;
create policy "donation public read" on public.donations
  for select to anon, authenticated using (true);

-- ---------- expense_categories ----------
drop policy if exists "cat read" on public.expense_categories;
drop policy if exists "cat public read" on public.expense_categories;
create policy "cat public read" on public.expense_categories
  for select to anon, authenticated using (true);

-- ---------- expenses ----------
drop policy if exists "expense read" on public.expenses;
drop policy if exists "expense public read" on public.expenses;
create policy "expense public read" on public.expenses
  for select to anon, authenticated using (true);

-- ---------- opening_balances ----------
drop policy if exists "opening read" on public.opening_balances;
drop policy if exists "opening public read" on public.opening_balances;
create policy "opening public read" on public.opening_balances
  for select to anon, authenticated using (true);

-- ---------- notices ----------
drop policy if exists "notice read" on public.notices;
drop policy if exists "notice public read" on public.notices;
create policy "notice public read" on public.notices
  for select to anon, authenticated using (true);

-- ---------- profiles (শুধু লগইন করা ইউজার) ----------
drop policy if exists "profile read" on public.profiles;
create policy "profile read" on public.profiles
  for select to authenticated
  using (id = auth.uid() or madrasa_id = public.my_madrasa_id());

-- =====================================================================
--  যাচাই: নিচের কুয়েরি চালালে ৭টা টেবিলেই লিস্ট দেখাবে
-- =====================================================================
select
  'madrasas' as table_name, count(*) from public.madrasas
union all select 'members', count(*) from public.members
union all select 'donations', count(*) from public.donations
union all select 'expenses', count(*) from public.expenses
union all select 'expense_categories', count(*) from public.expense_categories
union all select 'opening_balances', count(*) from public.opening_balances
union all select 'notices', count(*) from public.notices;
