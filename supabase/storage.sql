-- =====================================================================
--  ছবি আপলোড (Supabase Storage)
--  ---------------------------------------------------------------
--  Supabase Dashboard → SQL Editor → New query → পুরোটা পেস্ট → Run
--
--  কী করবে:
--    • media নামে একটা public bucket বানাবে (ছবি রাখার জায়গা)
--    • সবাই ছবি দেখতে পারবে (ভিউয়ারসহ, লগইন ছাড়াই)
--    • ছবি আপলোড/বদল/মুছতে পারবে শুধু লগইন করা
--      owner / admin / treasurer
--
--  বারবার চালালেও সমস্যা নেই।
-- =====================================================================

-- ---------- bucket ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880, -- ৫ MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ---------- সবাই ছবি দেখতে পারবে ----------
drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'media');

-- ---------- অ্যাডমিন/কোষাধ্যক্ষ ছবি আপলোড করতে পারবে ----------
drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.can_write());

-- ---------- ছবি বদলাতে পারবে ----------
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.can_write())
  with check (bucket_id = 'media' and public.can_write());

-- ---------- ছবি মুছতে পারবে ----------
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.can_write());

-- =====================================================================
--  যাচাই: নিচের কুয়েরি চালালে media bucket দেখা যাবে
-- =====================================================================
select id, name, public, file_size_limit from storage.buckets where id = 'media';
