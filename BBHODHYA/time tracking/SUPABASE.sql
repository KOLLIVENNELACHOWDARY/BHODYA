-- ============================================================
-- BODHYA
-- FEATURE 1: TIME & ACTIVITY TRACKING
-- ============================================================

-- This script extends the existing public.time_logs table.
-- It does not create a duplicate time_logs table.


-- ============================================================
-- 1. ADD TRACKING COLUMNS
-- ============================================================

alter table public.time_logs
  add column if not exists activity_type text;

alter table public.time_logs
  add column if not exists started_at timestamptz;

alter table public.time_logs
  add column if not exists ended_at timestamptz;

alter table public.time_logs
  add column if not exists duration_seconds integer
  not null default 0;

alter table public.time_logs
  add column if not exists active_seconds integer
  not null default 0;

alter table public.time_logs
  add column if not exists idle_seconds integer
  not null default 0;

alter table public.time_logs
  add column if not exists session_id uuid;


-- ============================================================
-- 2. BACKFILL EXISTING RECORDS
-- ============================================================

update public.time_logs
set started_at =
  coalesce(
    started_at,
    logged_at,
    now()
  )
where started_at is null;


update public.time_logs
set activity_type =
  coalesce(
    nullif(trim(activity_type), ''),
    'legacy'
  )
where activity_type is null
   or trim(activity_type) = '';


update public.time_logs
set duration_seconds =
  greatest(
    coalesce(duration_seconds, 0),
    coalesce(minutes, 0) * 60
  );


update public.time_logs
set active_seconds =
  greatest(
    coalesce(active_seconds, 0),
    coalesce(duration_seconds, 0)
  );


update public.time_logs
set idle_seconds =
  greatest(
    coalesce(idle_seconds, 0),
    0
  );


-- ============================================================
-- 3. DATA VALIDATION
-- ============================================================

alter table public.time_logs
  drop constraint if exists
  time_logs_duration_seconds_nonnegative;


alter table public.time_logs
  add constraint
  time_logs_duration_seconds_nonnegative
  check (
    duration_seconds >= 0
  );


alter table public.time_logs
  drop constraint if exists
  time_logs_active_seconds_nonnegative;


alter table public.time_logs
  add constraint
  time_logs_active_seconds_nonnegative
  check (
    active_seconds >= 0
  );


alter table public.time_logs
  drop constraint if exists
  time_logs_idle_seconds_nonnegative;


alter table public.time_logs
  add constraint
  time_logs_idle_seconds_nonnegative
  check (
    idle_seconds >= 0
  );


alter table public.time_logs
  drop constraint if exists
  time_logs_activity_type_not_blank;


alter table public.time_logs
  add constraint
  time_logs_activity_type_not_blank
  check (
    activity_type is null
    or length(trim(activity_type)) > 0
  );


-- ============================================================
-- 4. INDEXES
-- ============================================================

create index if not exists
idx_time_logs_user_started_at
on public.time_logs (
  user_id,
  started_at desc
);


create index if not exists
idx_time_logs_user_activity_started_at
on public.time_logs (
  user_id,
  activity_type,
  started_at desc
);


create index if not exists
idx_time_logs_session_id
on public.time_logs (
  session_id
);


-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.time_logs
enable row level security;


drop policy if exists
"time_logs_select_own"
on public.time_logs;


drop policy if exists
"time_logs_insert_own"
on public.time_logs;


drop policy if exists
"time_logs_update_own"
on public.time_logs;


drop policy if exists
"time_logs_delete_own"
on public.time_logs;


create policy
"time_logs_select_own"
on public.time_logs
for select
to authenticated
using (
  auth.uid() = user_id
);


create policy
"time_logs_insert_own"
on public.time_logs
for insert
to authenticated
with check (
  auth.uid() = user_id
);


create policy
"time_logs_update_own"
on public.time_logs
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


create policy
"time_logs_delete_own"
on public.time_logs
for delete
to authenticated
using (
  auth.uid() = user_id
);


-- ============================================================
-- 6. ACTIVITY ANALYTICS VIEW
-- ============================================================

create or replace view
public.time_tracking_activity_summary
with (security_invoker = true)
as
select
  user_id,
  activity_type,

  min(started_at)
    as first_activity_at,

  max(
    coalesce(
      ended_at,
      started_at
    )
  ) as last_activity_at,

  count(*)
    as session_count,

  sum(
    coalesce(
      active_seconds,
      0
    )
  ) as active_seconds,

  sum(
    coalesce(
      idle_seconds,
      0
    )
  ) as idle_seconds,

  sum(
    coalesce(
      duration_seconds,
      0
    )
  ) as duration_seconds

from public.time_logs

group by
  user_id,
  activity_type;