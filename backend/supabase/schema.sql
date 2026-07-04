-- =====================================================================
-- HRMS Database Schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor to set up all tables
-- =====================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- COMPANIES
-- ---------------------------------------------------------------------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  logo_url text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- EMPLOYEES (Users)
-- login_id format: CC + FirstTwoLettersOfFirstAndLastName + YYYY + Serial
-- Example: OC JODO 2025 0001  ->  OCJODO20250001
-- ---------------------------------------------------------------------
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  login_id text unique not null,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  phone text,
  password_hash text not null,
  must_change_password boolean default true,
  role text not null default 'employee' check (role in ('admin', 'hr', 'employee')),
  department text,
  designation text,
  manager_id uuid references employees(id),
  profile_picture_url text,
  status text default 'absent' check (status in ('present', 'on_leave', 'absent')),
  date_of_birth date,
  personal_email text,
  residential_address text,
  blood_group text,
  about text,
  skills text[],
  certifications text[],
  interests_hobbies text,
  what_i_love_about_my_job text,
  date_of_joining date default current_date,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_employees_company on employees(company_id);
create index if not exists idx_employees_manager on employees(manager_id);

-- ---------------------------------------------------------------------
-- SALARY STRUCTURE (Admin-only visibility)
-- ---------------------------------------------------------------------
create table if not exists salary_structures (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade unique,
  monthly_wage numeric(12,2) default 0,
  yearly_wage numeric(12,2) default 0,
  compensation_type text default 'fixed' check (compensation_type in ('fixed', 'percentage')),
  basic_salary numeric(12,2) default 0,
  house_rent_allowance numeric(12,2) default 0,
  standard_allowance numeric(12,2) default 0,
  performance_bonus numeric(12,2) default 0,
  leave_travel_allowance numeric(12,2) default 0,
  food_allowance numeric(12,2) default 0,
  provident_fund_rate numeric(5,2) default 12.00,
  professional_tax numeric(12,2) default 200,
  number_of_working_days int default 22,
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- ATTENDANCE
-- ---------------------------------------------------------------------
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  attendance_date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  work_hours numeric(5,2) default 0,
  extra_hours numeric(5,2) default 0,
  status text default 'absent' check (status in ('present', 'absent', 'half_day', 'leave')),
  created_at timestamptz default now(),
  unique (employee_id, attendance_date)
);

create index if not exists idx_attendance_employee_date on attendance(employee_id, attendance_date);

-- ---------------------------------------------------------------------
-- TIME OFF ALLOCATION (per employee, per year)
-- ---------------------------------------------------------------------
create table if not exists timeoff_allocations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  year int not null default extract(year from current_date),
  paid_time_off_total int default 24,
  paid_time_off_used int default 0,
  sick_leave_total int default 7,
  sick_leave_used int default 0,
  unpaid_leave_used int default 0,
  unique (employee_id, year)
);

-- ---------------------------------------------------------------------
-- TIME OFF REQUESTS
-- ---------------------------------------------------------------------
create table if not exists timeoff_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  time_off_type text not null check (time_off_type in ('paid_time_off', 'sick_leave', 'unpaid_leave')),
  start_date date not null,
  end_date date not null,
  days_requested numeric(4,1) not null,
  remarks text,
  attachment_url text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references employees(id),
  reviewer_comments text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_timeoff_employee on timeoff_requests(employee_id);
create index if not exists idx_timeoff_status on timeoff_requests(status);

-- ---------------------------------------------------------------------
-- updated_at auto-touch trigger helper
-- ---------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_employees_updated
  before update on employees
  for each row execute function touch_updated_at();

create trigger trg_timeoff_updated
  before update on timeoff_requests
  for each row execute function touch_updated_at();

-- Row Level Security is left disabled here because the Express backend
-- uses the Supabase service-role key and enforces authorization itself.
-- If you plan to call Supabase directly from the frontend, enable RLS
-- and add policies before going to production.
