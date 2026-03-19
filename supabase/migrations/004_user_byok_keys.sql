-- YUY-69: BYOKクラウドキー（サーバー側暗号化保存）
create table if not exists user_byok_keys (
  user_id uuid references auth.users primary key,
  encrypted_key text not null,
  iv text not null,
  key_hint text,            -- 末尾4文字などのヒント（平文表示用）
  last_verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_byok_keys enable row level security;

-- クライアントは encrypted_key と iv を取得できない（key_hint のみ参照可能）
-- クライアント向けビュー（encrypted_key と iv は除外）
create or replace view user_byok_key_hints with (security_invoker = true) as
  select user_id, key_hint, last_verified_at, created_at, updated_at
  from user_byok_keys
  where auth.uid() = user_id;

-- RLS: サービスロールのみ読み書き可（クライアントはビュー経由のみ）
-- ビューはsecurity_invokerなのでauth.uid()チェックが適用される
