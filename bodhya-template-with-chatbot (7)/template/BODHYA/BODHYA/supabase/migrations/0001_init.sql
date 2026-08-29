-- AI Learning Companion — starter schema
-- Run once in the Supabase SQL editor. Extend per-feature as needed
-- (add columns/tables in a NEW migration file, don't edit this one
-- once teammates have run it).

create extension if not exists vector;

-- 1. Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age_band text check (age_band in ('child','teen','adult')) default 'teen',
  favorite_character text,          -- e.g. 'spiderman', 'naruto'
  created_at timestamptz default now()
);

-- 2. Gamification: streaks + sticker rewards
create table if not exists streaks (
  user_id uuid references profiles(id) on delete cascade primary key,
  current_streak int default 0,
  longest_streak int default 0,
  last_active_date date,
  points int default 0
);

create table if not exists sticker_rewards (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  sticker_name text,
  sticker_pack text,                -- e.g. 'anime', 'comic'
  earned_at timestamptz default now()
);

-- 3. Personal knowledge graph
create table if not exists knowledge_nodes (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  topic text not null,
  mastery_level real default 0,     -- 0..1
  created_at timestamptz default now()
);

create table if not exists knowledge_edges (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  from_node bigint references knowledge_nodes(id) on delete cascade,
  to_node bigint references knowledge_nodes(id) on delete cascade,
  relationship text                 -- e.g. 'prerequisite_of'
);

-- 4. Quizzes ("Boss Battle") + assessment
create table if not exists quiz_questions (
  id bigint generated always as identity primary key,
  topic text,
  question text not null,
  options jsonb,                    -- for MCQ
  answer text,
  difficulty text check (difficulty in ('easy','medium','boss')) default 'easy'
);

create table if not exists quiz_attempts (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  question_id bigint references quiz_questions(id),
  correct boolean,
  attempted_at timestamptz default now()
);

-- 5. Real-time collaborative research rooms
create table if not exists study_rooms (
  id uuid primary key default gen_random_uuid(),
  topic text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists room_messages (
  id bigint generated always as identity primary key,
  room_id uuid references study_rooms(id) on delete cascade,
  user_id uuid references profiles(id),
  content text,
  created_at timestamptz default now()
);
-- Enable Supabase Realtime on room_messages from the dashboard so the
-- frontend can subscribe to new rows for live collaboration.

-- 6. File upload + RAG
create table if not exists uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  file_name text,
  storage_path text,                -- path in Supabase Storage bucket
  source_type text check (source_type in ('pdf','doc','image','webscrape','book')),
  uploaded_at timestamptz default now()
);

create table if not exists document_chunks (
  id bigint generated always as identity primary key,
  document_id uuid references uploaded_documents(id) on delete cascade,
  content text,
  embedding vector(768)             -- match your embedding model's dimension
);

-- 7. Study tools
create table if not exists todos (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text,
  is_done boolean default false,
  due_date date
);

create table if not exists study_schedule_items (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  topic text,
  scheduled_for timestamptz,
  duration_minutes int
);

create table if not exists time_logs (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  topic text,
  minutes int,
  logged_at timestamptz default now()
);

-- 8. Reviews / feedback
create table if not exists reviews (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  feature text,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Remember to enable Row Level Security + policies per table before
-- going beyond the hackathon stage (e.g. "users can only read their own rows").
