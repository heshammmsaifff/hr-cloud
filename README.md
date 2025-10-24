# 🏢 HR Cloud - Human Resources Management System

A cloud-based system for managing employee accounts, including:

- Managing employee data
- Tracking salaries, bonuses, deductions, and advances
- Recording attendance, absence, and leave
- Accountant dashboard and financial operations management

---

## ⚙️ Requirements

- Node.js v18 or later
- NPM or Yarn
- PostgreSQL database (Supabase recommended)

---

## 🗄️ Database Setup

Create a new project on **Supabase**, then add the following tables in the **SQL Editor**:

```sql
-- Admin Users Table
create table public.admin_users (
  id uuid not null default extensions.uuid_generate_v4(),
  username text not null,
  password text not null,
  created_at timestamp without time zone null default now(),
  constraint admin_users_pkey primary key (id),
  constraint admin_users_username_key unique (username)
) TABLESPACE pg_default;

-- Employees Table
create table public.employees (
  id uuid not null default extensions.uuid_generate_v4(),
  username text not null,
  password text not null,
  name text not null,
  phone text null,
  job_title text null,
  hire_date date not null,
  is_active boolean null default true,
  created_at timestamp without time zone null default now(),
  branch text null,
  constraint employees_pkey primary key (id),
  constraint employees_username_key unique (username)
) TABLESPACE pg_default;

-- Salary History Table
create table public.salary_history (
  id uuid not null default extensions.uuid_generate_v4(),
  employee_id uuid null,
  base_salary numeric not null,
  start_date date not null,
  end_date date null,
  created_at timestamp without time zone null default now(),
  constraint salary_history_pkey primary key (id),
  constraint salary_history_employee_id_fkey
    foreign key (employee_id) references employees (id) on delete cascade
) TABLESPACE pg_default;

-- Transactions Table (Bonuses, Deductions, Advances, Leaves)
create table public.transactions (
  id uuid not null default extensions.uuid_generate_v4(),
  employee_id uuid null,
  amount numeric not null,
  type text null,
  note text null,
  date date not null default CURRENT_DATE,
  created_at timestamp without time zone null default now(),
  leave_day boolean null default false,
  absence_day boolean null default false,
  constraint transactions_pkey primary key (id),
  constraint transactions_employee_id_fkey
    foreign key (employee_id) references employees (id) on delete cascade,
  constraint transactions_type_check check (
    type = any (array['bonus'::text, 'deduction'::text, 'advance'::text])
  )
) TABLESPACE pg_default;
💻 Local Development
Clone the project:

bash

git clone <repo-url>
cd <project-folder>
Install dependencies:

bash

npm install
# or
yarn
Set up environment variables in .env:

ini

NEXT_PUBLIC_SUPABASE_URL=<Your Supabase URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Your Supabase ANON Key>
Run the development server:

bash

npm run dev
# or
yarn dev
Then open your browser at:

👉 http://localhost:3000

🧩 Project Structure
bash

pages/admin/
│
├── login.js                 # Accountant login page
├── dashboard.js             # Admin dashboard
│
├── employees/
│   ├── new.js               # Add new employee
│   ├── edit/[id].js         # Edit employee details
│   └── transactions/[id].js # Employee transactions history
│
├── lib/
│   └── supabase.js          # Supabase client configuration
│
├── components/              # Shared UI components (tables, forms, cards, etc.)
🔐 System Features
Accountant-only login

Secure admin pages

Employee management (Add, Edit, Archive)

Salary and financial transaction management

Attendance, absence, and leave tracking

Monthly salary reports with net pay after deductions

📌 Notes
Make sure the UUID extension is enabled in your PostgreSQL database:

sql

create extension if not exists "uuid-ossp";
Passwords are currently stored in plain text.
You can later implement bcrypt or another hashing library for encryption.

💼 Built with Next.js + Supabase to simplify HR and payroll management.

yaml

```
