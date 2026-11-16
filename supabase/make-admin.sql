-- =====================================================================
--  অ্যাডমিন বানানোর স্ক্রিপ্ট
-- =====================================================================
--  ধাপ ১  Supabase → Authentication → Users → Add user → Create new user
--          ইমেইল + পাসওয়ার্ড দাও, ✅ Auto Confirm User টিক দাও
--
--  ধাপ ২  নিচের 'admin@example.com' এর জায়গায় সেই ইমেইল বসাও
--
--  ধাপ ৩  পুরো ফাইলটা SQL Editor-এ পেস্ট করে Run করো
--
--  কেন দরকার?
--    প্রথম ইউজার নিজে থেকেই owner হয়। কিন্তু আগে যদি কেউ (টেস্টে) সাইনআপ
--    করে ফেলে, তাহলে নতুন ইউজার 'viewer' হয়ে যাবে — তখন এই স্ক্রিপ্ট দিয়ে
--    তাকে owner বানাতে হবে।
-- =====================================================================

-- ১) রোল-গার্ড ঠিক করা
--    আগে SQL Editor থেকেও রোল বদলানো যেত না (কেননা ওখানে auth.uid() থাকে না)।
--    এখন ড্যাশবোর্ড/SQL Editor থেকে বদলানো যাবে, কিন্তু অ্যাপ থেকে চেষ্টা করলে
--    আগের মতোই ব্লক থাকবে।
create or replace function public.guard_role_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'শুধু অ্যাডমিন রোল পরিবর্তন করতে পারবেন';
  end if;
  return new;
end $$;

-- ২) তোমার ইমেইলটা এখানে বসাও 👇
update public.profiles
set role = 'owner'
where id = (select id from auth.users where email = 'admin@example.com');

-- ৩) যাচাই — সব ইউজার ও তাদের রোল দেখাবে
select u.email, p.full_name, p.role
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at;
