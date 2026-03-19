-- YUY-69 review fix: user_byok_key_hints ビューを security_definer に変更
-- security_invoker のままでは base table の RLS SELECT ポリシーがないため
-- 認証済みユーザーが自分のヒント行を読めない。
-- security_definer にすることでビュー所有者権限で RLS をバイパスしつつ、
-- WHERE auth.uid() = user_id によりユーザー自身の行のみ返す。
create or replace view user_byok_key_hints
  with (security_invoker = false)  -- security_definer 相当
as
  select user_id, key_hint, last_verified_at, created_at, updated_at
  from user_byok_keys
  where auth.uid() = user_id;
