-- YUY-65: APIレート制限テーブル
create table if not exists api_rate_limits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  ip_address text not null,
  window_start timestamptz not null,
  request_count integer not null default 1,
  created_at timestamptz default now(),
  unique (user_id, ip_address, window_start)
);

alter table api_rate_limits enable row level security;

-- サービスロールのみ書き込み可（クライアントからは読み書き不可）
-- RLSポリシーは設定しない = 全行アクセス拒否（サービスロールはRLSをバイパス）

-- 古いウィンドウのレコードを自動削除するためのインデックス
create index if not exists api_rate_limits_window_start_idx on api_rate_limits (window_start);
