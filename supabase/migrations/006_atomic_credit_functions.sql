-- YUY-69 review fix: アトミックなクレジット消費関数
-- read-then-write の race condition を排除するため、
-- 上限チェックとインクリメントを1つのDB操作で行う。
create or replace function check_and_consume_credit(
  p_user_id uuid,
  p_daily_limit int,
  p_monthly_limit int,
  p_today date,
  p_this_month date
) returns text
language plpgsql
security definer
as $$
declare
  v_daily_used   int;
  v_monthly_used int;
  v_daily_reset  date;
  v_monthly_reset date;
begin
  -- 行ロックを取得してから読み取る
  select daily_used, monthly_used, daily_reset_at, monthly_reset_at
    into v_daily_used, v_monthly_used, v_daily_reset, v_monthly_reset
    from user_credits
   where user_id = p_user_id
     for update;

  -- レコードなし → 初期化して即消費
  if not found then
    insert into user_credits (
      user_id, daily_used, daily_limit,
      monthly_used, monthly_limit,
      daily_reset_at, monthly_reset_at
    ) values (
      p_user_id, 1, p_daily_limit,
      1, p_monthly_limit,
      p_today, p_this_month
    );
    return 'ok';
  end if;

  -- 遅延リセット
  if v_daily_reset < p_today then
    v_daily_used := 0;
  end if;
  if v_monthly_reset < p_this_month then
    v_monthly_used := 0;
  end if;

  -- 上限チェック
  if v_daily_used >= p_daily_limit then
    return 'daily_limit';
  end if;
  if v_monthly_used >= p_monthly_limit then
    return 'monthly_limit';
  end if;

  -- アトミックにインクリメント
  update user_credits set
    daily_used      = v_daily_used + 1,
    monthly_used    = v_monthly_used + 1,
    daily_limit     = p_daily_limit,
    monthly_limit   = p_monthly_limit,
    daily_reset_at  = p_today,
    monthly_reset_at = p_this_month,
    updated_at      = now()
  where user_id = p_user_id;

  return 'ok';
end;
$$;
