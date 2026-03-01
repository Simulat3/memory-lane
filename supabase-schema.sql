-- ============================================
-- Nostalgia Calendar — Supabase Schema Setup
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Users table (populated automatically on sign-up via trigger)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
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

-- Submissions: anyone can read approved
create policy "Approved submissions are publicly readable"
  on public.submissions for select
  using (status = 'approved');

-- Submissions: authenticated users can read their own (any status)
create policy "Users can read own submissions"
  on public.submissions for select
  using (auth.uid() = user_id);

-- Submissions: authenticated users can insert
create policy "Authenticated users can submit"
  on public.submissions for insert
  with check (auth.uid() = user_id);

-- 5. Indexes for performance
create index idx_submissions_status on public.submissions(status);
create index idx_submissions_user_id on public.submissions(user_id);
create index idx_submissions_date on public.submissions(date);
