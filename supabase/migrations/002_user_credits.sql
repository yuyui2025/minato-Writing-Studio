-- YUY-66: クレジット残量管理
create table if not exists user_credits (
  user_id uuid references auth.users primary key,
  daily_used integer not null default 0,
  daily_limit integer not null default 10,
  monthly_used integer not null default 0,
  monthly_limit integer not null default 100,
  daily_reset_at date not null default current_date,
  monthly_reset_at date not null default date_trunc('month', current_date)::date,
  updated_at timestamptz default now()
);

alter table user_credits enable row level security;

-- ユーザーは自分の残量を SELECT のみ可（消費はサービスロールのみ）
create policy "users can read own credits"
  on user_credits for select
  using (auth.uid() = user_id);
