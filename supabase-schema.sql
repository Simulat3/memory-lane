-- ============================================
-- Nostalgia Calendar — Supabase Schema Setup
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Users table (populated automatically on sign-up via trigger)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text default '',
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- 2. Submissions table
create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text default '',
  date date not null,
  category text not null,
  url text default '',
  image_url text default '',
  is_public boolean default true,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id)
);

-- 3. Trigger: auto-create a users row on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Row Level Security
alter table public.users enable row level security;
alter table public.submissions enable row level security;

-- Users: anyone can read
create policy "Users are publicly readable"
  on public.users for select
  using (true);

-- Users: users can update their own row
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Submissions: anyone can read approved public submissions
create policy "Approved submissions are publicly readable"
  on public.submissions for select
  using (status = 'approved' and is_public = true);

-- Submissions: authenticated users can read their own (any status)
create policy "Users can read own submissions"
  on public.submissions for select
  using (auth.uid() = user_id);

-- Submissions: authenticated users can insert
create policy "Authenticated users can submit"
  on public.submissions for insert
  with check (auth.uid() = user_id);

-- 5. Comments table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  memory_id text not null,
  memory_type text not null check (memory_type in ('preset', 'submission')),
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- 6. Comment flags table
create table public.comment_flags (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid references public.comments(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  reason text default 'Inappropriate content',
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);

alter table public.comments enable row level security;
alter table public.comment_flags enable row level security;

-- Comments: anyone can read
create policy "Comments are publicly readable"
  on public.comments for select
  using (true);

-- Comments: authenticated users can insert
create policy "Authenticated users can comment"
  on public.comments for insert
  with check (auth.uid() = user_id);

-- Comments: users can delete their own
create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Comment flags: anyone can read (for admin queries via service role)
create policy "Comment flags are readable"
  on public.comment_flags for select
  using (true);

-- Comment flags: authenticated users can insert
create policy "Authenticated users can flag"
  on public.comment_flags for insert
  with check (auth.uid() = user_id);

-- 7. Reactions table (pager emoji likes)
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  memory_id text not null,
  memory_type text not null check (memory_type in ('preset', 'submission')),
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(memory_id, memory_type, user_id)
);

alter table public.reactions enable row level security;

create policy "Reactions are publicly readable"
  on public.reactions for select
  using (true);

create policy "Authenticated users can react"
  on public.reactions for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own reactions"
  on public.reactions for delete
  using (auth.uid() = user_id);

-- 8. Indexes for performance
create index idx_submissions_status on public.submissions(status);
create index idx_submissions_user_id on public.submissions(user_id);
create index idx_submissions_date on public.submissions(date);
create index idx_comments_memory on public.comments(memory_id, memory_type);
create index idx_comments_user_id on public.comments(user_id);
create index idx_comment_flags_comment_id on public.comment_flags(comment_id);
create index idx_reactions_memory on public.reactions(memory_id, memory_type);

-- ============================================
-- Migration for existing deployments:
-- ============================================
-- ALTER TABLE public.submissions ADD COLUMN is_public boolean DEFAULT true;
-- ALTER TABLE public.submissions ADD COLUMN image_url text DEFAULT '';
-- ALTER TABLE public.users ADD COLUMN avatar_url text DEFAULT '';
--
-- DROP POLICY "Approved submissions are publicly readable" ON public.submissions;
-- CREATE POLICY "Approved submissions are publicly readable"
--   ON public.submissions FOR SELECT
--   USING (status = 'approved' AND is_public = true);

-- ── Notifications ──
-- create table public.notifications (
--   id uuid default gen_random_uuid() primary key,
--   user_id uuid references public.users(id) on delete cascade not null,
--   type text not null check (type in ('submission_approved', 'submission_rejected', 'upvote')),
--   submission_id uuid references public.submissions(id) on delete cascade,
--   actor_id uuid references public.users(id) on delete set null,
--   message text not null,
--   read boolean default false,
--   created_at timestamptz default now()
-- );
-- alter table public.notifications enable row level security;
-- create policy "Users can read own notifications" on public.notifications for select using (auth.uid() = user_id);
-- create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
-- create index idx_notifications_user_id on public.notifications(user_id);
-- create index idx_notifications_user_unread on public.notifications(user_id, read) where read = false;
