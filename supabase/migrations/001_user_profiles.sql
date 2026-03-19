-- YUY-66: ユーザープロファイル（プラン管理）
create table if not exists user_profiles (
  user_id uuid references auth.users primary key,
  plan text not null default 'free' check (plan in ('free', 'pro', 'byok')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_profiles enable row level security;

-- ユーザーは自分のプロファイルを SELECT のみ可（書き込みはサービスロールのみ）
create policy "users can read own profile"
  on user_profiles for select
  using (auth.uid() = user_id);
