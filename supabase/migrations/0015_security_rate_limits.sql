create table if not exists public.security_rate_limits (
  scope text not null,
  identifier_hash text not null,
  window_starts_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (scope, identifier_hash, window_starts_at)
);

alter table public.security_rate_limits enable row level security;

revoke all on public.security_rate_limits from public;
revoke all on public.security_rate_limits from anon;
revoke all on public.security_rate_limits from authenticated;

create index if not exists security_rate_limits_window_starts_at_idx
on public.security_rate_limits (window_starts_at);

create or replace function public.consume_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer,
  p_now timestamptz default timezone('utc', now())
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz,
  retry_after_seconds integer,
  current_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_reset_at timestamptz;
  v_attempts integer;
begin
  if coalesce(length(trim(p_scope)), 0) = 0 then
    raise exception 'p_scope is required';
  end if;

  if coalesce(length(trim(p_identifier_hash)), 0) = 0 then
    raise exception 'p_identifier_hash is required';
  end if;

  if p_limit < 1 then
    raise exception 'p_limit must be greater than 0';
  end if;

  if p_window_seconds < 1 then
    raise exception 'p_window_seconds must be greater than 0';
  end if;

  v_window_start := timezone(
    'utc',
    to_timestamp(floor(extract(epoch from p_now) / p_window_seconds) * p_window_seconds)
  );
  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  insert into public.security_rate_limits (
    scope,
    identifier_hash,
    window_starts_at,
    attempts,
    created_at,
    updated_at
  )
  values (
    p_scope,
    p_identifier_hash,
    v_window_start,
    1,
    timezone('utc', p_now),
    timezone('utc', p_now)
  )
  on conflict (scope, identifier_hash, window_starts_at)
  do update
  set attempts = public.security_rate_limits.attempts + 1,
      updated_at = excluded.updated_at
  returning attempts into v_attempts;

  allowed := v_attempts <= p_limit;
  remaining := greatest(p_limit - v_attempts, 0);
  reset_at := v_reset_at;
  retry_after_seconds := greatest(ceil(extract(epoch from (v_reset_at - p_now)))::integer, 0);
  current_count := v_attempts;

  return next;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer, timestamptz) from public;
revoke all on function public.consume_rate_limit(text, text, integer, integer, timestamptz) from anon;
revoke all on function public.consume_rate_limit(text, text, integer, integer, timestamptz) from authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer, timestamptz) to service_role;
