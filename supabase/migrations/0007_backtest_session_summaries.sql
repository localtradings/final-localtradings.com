alter table public.backtest_sessions
add column if not exists order_type text,
add column if not exists volume double precision,
add column if not exists exit_price double precision,
add column if not exists result_amount double precision,
add column if not exists balance_after_trade double precision;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'backtest_sessions'
      and column_name = 'session_state_json'
  ) then
    update public.backtest_sessions
    set
      order_type = coalesce(
        order_type,
        nullif(session_state_json #>> '{execution,orderType}', '')
      ),
      volume = coalesce(
        volume,
        nullif(session_state_json #>> '{execution,volume}', '')::double precision
      ),
      exit_price = coalesce(
        exit_price,
        nullif(session_state_json #>> '{execution,exitPrice}', '')::double precision
      ),
      result_amount = coalesce(
        result_amount,
        nullif(session_state_json #>> '{execution,resultAmount}', '')::double precision
      ),
      balance_after_trade = coalesce(
        balance_after_trade,
        nullif(session_state_json #>> '{execution,balanceAfterTrade}', '')::double precision
      );
  end if;
end $$;

create index if not exists backtest_sessions_user_started_idx
on public.backtest_sessions (user_id, started_at desc);

with ranked_completed_sessions as (
  select
    id,
    row_number() over (
      partition by user_id
      order by started_at desc
    ) as row_num
  from public.backtest_sessions
  where status in ('target_hit', 'stop_hit', 'manual_close', 'breakeven')
)
delete from public.backtest_sessions
using ranked_completed_sessions
where public.backtest_sessions.id = ranked_completed_sessions.id
  and ranked_completed_sessions.row_num > 5;

alter table public.backtest_sessions
drop column if exists thesis,
drop column if exists review_notes,
drop column if exists session_state_json;
