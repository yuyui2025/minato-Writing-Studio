-- YUY-62: レート制限インクリメントをアトミックに実行するRPC関数
-- read-then-writeの競合状態を解消する
create or replace function increment_rate_limit(
  p_user_id uuid,
  p_ip_address text,
  p_window_start timestamptz
) returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  insert into api_rate_limits (user_id, ip_address, window_start, request_count)
  values (p_user_id, p_ip_address, p_window_start, 1)
  on conflict (user_id, ip_address, window_start)
  do update set request_count = api_rate_limits.request_count + 1
  returning request_count into new_count;

  return new_count;
end;
$$;
