-- ============================================================
-- BODHYA
-- FEATURE 2: PARENTAL LOCK & USAGE CONTROL
-- ============================================================

-- ============================================================
-- 1. PARENTAL LOCK SETTINGS
-- ============================================================

create table if not exists public.parental_lock_settings (
  id bigint generated always as identity primary key,

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  pin_hash text,

  pin_salt text,

  enabled boolean not null default false,

  app_locked boolean not null default false,

  daily_limit_minutes integer,

  lock_on_limit boolean not null default true,

  limit_override_until timestamptz,

  created_at timestamptz
    not null default now(),

  updated_at timestamptz
    not null default now(),

  constraint parental_lock_daily_limit_valid
    check (
      daily_limit_minutes is null
      or (
        daily_limit_minutes >= 5
        and daily_limit_minutes <= 720
      )
    ),

  constraint parental_lock_pin_hash_valid
    check (
      pin_hash is null
      or length(pin_hash) > 0
    ),

  constraint parental_lock_pin_salt_valid
    check (
      pin_salt is null
      or length(pin_salt) > 0
    ),

  constraint parental_lock_user_unique
    unique(user_id)
);


-- ============================================================
-- 2. FEATURE RESTRICTIONS
-- ============================================================

create table if not exists public.feature_restrictions (
  id bigint generated always as identity primary key,

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  feature_key text not null,

  restricted boolean not null default false,

  created_at timestamptz
    not null default now(),

  updated_at timestamptz
    not null default now(),

  constraint feature_restrictions_unique
    unique(
      user_id,
      feature_key
    ),

  constraint feature_restrictions_key_valid
    check (
      length(trim(feature_key)) > 0
    )
);


-- ============================================================
-- 3. EMERGENCY CONTACTS
-- ============================================================

create table if not exists public.emergency_contacts (
  id bigint generated always as identity primary key,

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  name text not null,

  phone text,

  email text,

  created_at timestamptz
    not null default now(),

  constraint emergency_contact_name_valid
    check (
      length(trim(name)) > 0
    ),

  constraint emergency_contact_method_valid
    check (
      (
        phone is not null
        and length(trim(phone)) > 0
      )
      or
      (
        email is not null
        and length(trim(email)) > 0
      )
    )
);


-- ============================================================
-- 4. INDEXES
-- ============================================================

create index if not exists
idx_parental_lock_settings_user
on public.parental_lock_settings(
  user_id
);


create index if not exists
idx_feature_restrictions_user
on public.feature_restrictions(
  user_id
);


create index if not exists
idx_emergency_contacts_user
on public.emergency_contacts(
  user_id
);


-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.parental_lock_settings
enable row level security;

alter table public.feature_restrictions
enable row level security;

alter table public.emergency_contacts
enable row level security;


-- ============================================================
-- 6. SETTINGS POLICIES
-- ============================================================

drop policy if exists
"parental_lock_settings_select_own"
on public.parental_lock_settings;

drop policy if exists
"parental_lock_settings_insert_own"
on public.parental_lock_settings;

drop policy if exists
"parental_lock_settings_update_own"
on public.parental_lock_settings;

drop policy if exists
"parental_lock_settings_delete_own"
on public.parental_lock_settings;


create policy
"parental_lock_settings_select_own"
on public.parental_lock_settings
for select
to authenticated
using (
  auth.uid() = user_id
);


create policy
"parental_lock_settings_insert_own"
on public.parental_lock_settings
for insert
to authenticated
with check (
  auth.uid() = user_id
);


create policy
"parental_lock_settings_update_own"
on public.parental_lock_settings
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


create policy
"parental_lock_settings_delete_own"
on public.parental_lock_settings
for delete
to authenticated
using (
  auth.uid() = user_id
);


-- ============================================================
-- 7. FEATURE RESTRICTION POLICIES
-- ============================================================

drop policy if exists
"feature_restrictions_select_own"
on public.feature_restrictions;

drop policy if exists
"feature_restrictions_insert_own"
on public.feature_restrictions;

drop policy if exists
"feature_restrictions_update_own"
on public.feature_restrictions;

drop policy if exists
"feature_restrictions_delete_own"
on public.feature_restrictions;


create policy
"feature_restrictions_select_own"
on public.feature_restrictions
for select
to authenticated
using (
  auth.uid() = user_id
);


create policy
"feature_restrictions_insert_own"
on public.feature_restrictions
for insert
to authenticated
with check (
  auth.uid() = user_id
);


create policy
"feature_restrictions_update_own"
on public.feature_restrictions
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


create policy
"feature_restrictions_delete_own"
on public.feature_restrictions
for delete
to authenticated
using (
  auth.uid() = user_id
);


-- ============================================================
-- 8. EMERGENCY CONTACT POLICIES
-- ============================================================

drop policy if exists
"emergency_contacts_select_own"
on public.emergency_contacts;

drop policy if exists
"emergency_contacts_insert_own"
on public.emergency_contacts;

drop policy if exists
"emergency_contacts_update_own"
on public.emergency_contacts;

drop policy if exists
"emergency_contacts_delete_own"
on public.emergency_contacts;


create policy
"emergency_contacts_select_own"
on public.emergency_contacts
for select
to authenticated
using (
  auth.uid() = user_id
);


create policy
"emergency_contacts_insert_own"
on public.emergency_contacts
for insert
to authenticated
with check (
  auth.uid() = user_id
);


create policy
"emergency_contacts_update_own"
on public.emergency_contacts
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


create policy
"emergency_contacts_delete_own"
on public.emergency_contacts
for delete
to authenticated
using (
  auth.uid() = user_id
);