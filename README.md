🏢 نظام إدارة الموارد البشرية - HR Cloud

نظام سحابي لإدارة حسابات الموظفين، يشمل:

إدارة بيانات الموظفين.

تتبع الرواتب، العلاوات، الخصومات، والسلف.

تسجيل حضور وغياب وإجازات الموظفين.

لوحة تحكم للمحاسب وإدارة العمليات المالية.

⚙️ المتطلبات

Node.js v18 أو أحدث

NPM أو Yarn

قاعدة بيانات PostgreSQL (يفضل Supabase)

🗄️ قواعد البيانات

قم بإنشاء مشروع جديد على Supabase، ثم أضف الجداول التالية في SQL Editor:

-- جدول مسؤولي النظام
create table public.admin_users (
id uuid not null default extensions.uuid_generate_v4 (),
username text not null,
password text not null,
created_at timestamp without time zone null default now(),
constraint admin_users_pkey primary key (id),
constraint admin_users_username_key unique (username)
) TABLESPACE pg_default;

-- جدول الموظفين
create table public.employees (
id uuid not null default extensions.uuid_generate_v4 (),
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

-- جدول تاريخ الرواتب
create table public.salary_history (
id uuid not null default extensions.uuid_generate_v4 (),
employee_id uuid null,
base_salary numeric not null,
start_date date not null,
end_date date null,
created_at timestamp without time zone null default now(),
constraint salary_history_pkey primary key (id),
constraint salary_history_employee_id_fkey foreign key (employee_id) references employees (id) on delete cascade
) TABLESPACE pg_default;

-- جدول المعاملات (علاوات، خصومات، سلف، إجازات)
create table public.transactions (
id uuid not null default extensions.uuid_generate_v4 (),
employee_id uuid null,
amount numeric not null,
type text null,
note text null,
date date not null default CURRENT_DATE,
created_at timestamp without time zone null default now(),
leave_day boolean null default false,
absence_day boolean null default false,
constraint transactions_pkey primary key (id),
constraint transactions_employee_id_fkey foreign key (employee_id) references employees (id) on delete cascade,
constraint transactions_type_check check (
type = any (array['bonus'::text, 'deduction'::text, 'advance'::text])
)
) TABLESPACE pg_default;

💻 التشغيل المحلي

انسخ المشروع على جهازك:

git clone <repo-url>
cd <project-folder>

تثبيت الحزم:

npm install

# أو

yarn

إعداد متغيرات البيئة .env:

NEXT_PUBLIC_SUPABASE_URL=<Your Supabase URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Your Supabase ANON Key>

تشغيل المشروع محليًا:

npm run dev

# أو

yarn dev

افتح المتصفح على:

http://localhost:3000

🧩 هيكل المشروع

pages/admin/

login.js : صفحة تسجيل الدخول للمحاسب

dashboard.js : لوحة التحكم

employees/new.js : إضافة موظف جديد

employees/edit/[id].js : تعديل بيانات الموظف

employees/transactions/[id].js : سجل المعاملات

lib/supabase.js : تهيئة اتصال Supabase

components/ : مكونات مشتركة (مثل الجداول، الفورمات، البطاقات)

🔐 مميزات النظام

تسجيل دخول للمحاسب فقط

حماية صفحات الإدارة

إدارة الموظفين (إضافة، تعديل، أرشفة)

إدارة الرواتب والمعاملات المالية

عرض تفاصيل الحضور، الإجازات، الغياب

تقارير شهرية للرواتب والصافي بعد الخصومات

📌 ملاحظات

تأكد من تثبيت UUID extension في قاعدة بيانات PostgreSQL:

create extension if not exists "uuid-ossp";

كلمة السر مخزنة كنص عادي، يمكنك لاحقًا استخدام bcrypt لتشفيرها.
