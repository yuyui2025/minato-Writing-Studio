-- YUY-94: 既存ユーザーへのバックフィル
--
-- 008 のトリガーは新規サインアップにしか効かないため、
-- すでに auth.users にいるが user_profiles がないユーザーを埋める。
-- ON CONFLICT DO NOTHING でべき等（再実行しても安全）。

insert into public.user_profiles (user_id, plan)
select id, 'free'
from auth.users
where id not in (select user_id from public.user_profiles)
on conflict (user_id) do nothing;
