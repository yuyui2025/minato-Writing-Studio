-- YUY-94: 新規ユーザーサインアップ時に user_profiles を自動作成するトリガー
--
-- 問題: user_profiles に自動作成トリガーがなかったため、
--       Google OAuth でサインアップした直後のユーザーは user_profiles レコードを持たない。
--       その状態で AI リクエストを行うと credits.ts がデフォルト "free" に fallback し、
--       user_credits だけが孤立して INSERT される（user_profiles なしで UID が取り込まれる）。
--
-- 修正: auth.users への INSERT 後に user_profiles(plan='free') を自動生成する。

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- 既存トリガーがあれば差し替え
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
