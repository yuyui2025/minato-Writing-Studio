-- 001/002 の create policy が冪等でなかったため、
-- DROP IF EXISTS → CREATE の形に置き換える

-- user_profiles ポリシー
drop policy if exists "users can read own profile" on user_profiles;
create policy "users can read own profile"
  on user_profiles for select
  using (auth.uid() = user_id);

-- user_credits ポリシー
drop policy if exists "users can read own credits" on user_credits;
create policy "users can read own credits"
  on user_credits for select
  using (auth.uid() = user_id);
