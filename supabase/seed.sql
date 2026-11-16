-- =====================================================================
--  অক্টোবর ২০২৬ — আসল হিসাব বসানো (seed)
--  schema.sql চালানোর পরে এটা চালান।
--  বারবার চালালেও ডেটা ডাবল হবে না।
-- =====================================================================

do $$
declare
  m uuid;
  d record;
  cat_salary uuid;
begin
  -- মাদ্রাসা না থাকলে তৈরি করো
  select id into m from public.madrasas order by created_at limit 1;
  if m is null then
    insert into public.madrasas (name, address, theme)
    values ('বাইতুল আমান মাদ্রাসা', 'গ্রাম / বাজার, উপজেলা', 'green')
    returning id into m;
  end if;

  -- খরচের খাত
  insert into public.expense_categories (madrasa_id, name, icon, sort_order)
  select m, x.name, x.icon, x.ord
  from (values
    ('হুজুরের বেতন','👤',1),
    ('বিদ্যুৎ বিল','💡',2),
    ('খাবার','🍚',3),
    ('মেরামত','🔧',4),
    ('বই ও খাতা','📚',5),
    ('অন্যান্য','💸',6)
  ) as x(name, icon, ord)
  where not exists (
    select 1 from public.expense_categories c where c.madrasa_id = m and c.name = x.name
  );

  select id into cat_salary from public.expense_categories
  where madrasa_id = m and name = 'হুজুরের বেতন' limit 1;

  -- বিগত মাসের জমা (carry forward)
  insert into public.opening_balances (madrasa_id, month, amount)
  values (m, '2026-10', 2490)
  on conflict (madrasa_id, month) do nothing;

  -- সদস্য তালিকা
  for d in
    select * from (values
      ('ফারিদ শিউলি',    600),
      ('গুলজার হোসেন',   200),
      ('মাজেদ আলী',      200),
      ('জুয়েল রানা',     100),
      ('সারোয়ার',       200),
      ('জয়নাল আবেদীন',  500),
      ('বাবু',           100),
      ('সাইফুল্লাহ',      50),
      ('সবুজ',           200),
      ('হাসান',          200),
      ('ফিরোজ',           50),
      ('নাম নাই',        100),
      ('হাসানের অফিস',   300),
      ('উসমান ভাই',      200)
    ) as t(name, amount)
  loop
    -- সদস্য তৈরি (নাম না থাকলে)
    insert into public.members (madrasa_id, full_name)
    select m, d.name
    where not exists (
      select 1 from public.members mm where mm.madrasa_id = m and mm.full_name = d.name
    );

    -- জমা তৈরি
    insert into public.donations (madrasa_id, member_id, donor_name, amount, method, month, donated_on)
    select m,
           (select id from public.members mm where mm.madrasa_id = m and mm.full_name = d.name limit 1),
           d.name, d.amount, 'cash', '2026-10', date '2026-10-01'
    where not exists (
      select 1 from public.donations dd
      where dd.madrasa_id = m and dd.donor_name = d.name and dd.month = '2026-10'
    );
  end loop;

  -- খরচ: হুজুরের বেতন
  insert into public.expenses (madrasa_id, category_id, title, amount, month, spent_on)
  select m, cat_salary, 'হুজুরের বেতন', 2500, '2026-10', date '2026-10-05'
  where not exists (
    select 1 from public.expenses e
    where e.madrasa_id = m and e.title = 'হুজুরের বেতন' and e.month = '2026-10'
  );

  -- নোটিশ
  insert into public.notices (madrasa_id, title, body, pinned)
  select m, 'মাসিক সভা',
         'আগামী শুক্রবার বাদ জুমা মাদ্রাসায় মাসিক সভা হবে। সব সদস্যকে উপস্থিত থাকার জন্য অনুরোধ করা হলো।',
         true
  where not exists (
    select 1 from public.notices n where n.madrasa_id = m and n.title = 'মাসিক সভা'
  );
end $$;
