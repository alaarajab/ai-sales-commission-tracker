-- Base tables: run this FIRST on a new Supabase project, before the other files.
-- (The live project was created in the Supabase dashboard; this file recreates
-- the same tables and columns the app uses, so a fresh setup works.)

create extension if not exists pgcrypto; -- for gen_random_uuid()

-- Sales reps and admins. A login is linked later via user_id (phase3_auth_step1.sql).
create table if not exists public.agents (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  role       text not null default 'agent' check (role in ('admin', 'agent')),
  created_at timestamptz not null default now(),
  constraint agents_email_unique unique (email)
);

-- One row per property sale. Status moves pending → approved → paid.
create table if not exists public.sales (
  id               uuid primary key default gen_random_uuid(),
  property_address text not null,
  sale_amount      numeric(12, 2) not null check (sale_amount > 0),
  sale_date        date not null,
  status           text not null default 'pending' check (status in ('pending', 'approved', 'paid')),
  agent_id         uuid not null references public.agents (id),
  created_at       timestamptz not null default now()
);

-- One commission per sale (3% of sale_amount). paid_at is set when the sale is marked paid.
create table if not exists public.commissions (
  id         uuid primary key default gen_random_uuid(),
  sale_id    uuid not null unique references public.sales (id),
  agent_id   uuid not null references public.agents (id),
  amount     numeric(12, 2) not null,
  paid_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sales_agent_id_idx on public.sales (agent_id);
create index if not exists commissions_agent_id_idx on public.commissions (agent_id);

-- Row Level Security is turned on, with read rules, in phase3_auth_step1.sql.

-- Add your first admin so you can sign up (sign-up is invite-only):
-- insert into public.agents (name, email, role) values ('Your Name', 'you@example.com', 'admin');
