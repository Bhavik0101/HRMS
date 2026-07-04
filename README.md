# Human Resource Management System (HRMS)

"Every workday, perfectly aligned."

A full-stack HRMS covering authentication, role-based dashboards, employee profiles,
attendance check-in/out, leave/time-off management with approvals, and admin-only
payroll/salary visibility — built to match the provided wireframes and SRS document.

## Tech Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Express.js + Node.js
- **Database:** Supabase (PostgreSQL)
- **Auth:** JWT (issued by the Express backend), bcrypt password hashing

## Project Structure
```
hrms-project/
├── backend/                 Express API server
│   ├── src/
│   │   ├── config/           Supabase client
│   │   ├── controllers/      Business logic (auth, employees, attendance, timeoff)
│   │   ├── middleware/        JWT auth + role guards
│   │   ├── routes/            Express routers
│   │   ├── utils/             Login ID generator
│   │   └── server.js
│   ├── supabase/schema.sql   Full DB schema — run this in Supabase SQL editor
│   ├── .env.example
│   └── package.json
└── frontend/                 Next.js app
    ├── app/
    │   ├── signin/ signup/    Auth pages
    │   ├── dashboard/         Landing page after login (employee cards for Admin/HR)
    │   ├── profile/           My Profile (Private Info / Salary Info / Security tabs)
    │   ├── employees/         Employee directory + view-only employee detail + [id]
    │   ├── attendance/        Daily attendance list, check-in/out
    │   ├── timeoff/           Time-off requests, allocations, approvals
    │   └── layout.js, page.js, globals.css
    ├── components/Navbar.js
    ├── lib/api.js             API client (talks to the Express backend)
    ├── .env.local.example
    └── package.json
```

## 1. Set up Supabase
1. Create a project at https://supabase.com.
2. Open the SQL Editor and run the contents of `backend/supabase/schema.sql`.
3. Grab your Project URL and **service role key** from Project Settings → API.

## 2. Run the backend
```bash
cd backend
cp .env.example .env
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm install
npm run dev        # starts on http://localhost:5000
```

## 3. Run the frontend
```bash
cd frontend
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL should point at the backend, e.g. http://localhost:5000/api
npm install
npm run dev         # starts on http://localhost:3000
```

## How it maps to the wireframes / SRS

| Wireframe screen | Implementation |
|---|---|
| Sign In / Sign Up | `app/signin`, `app/signup` + `POST /api/auth/signin` / `signup` |
| Auto-generated Login ID | `backend/src/utils/loginId.js` — `CC` + first 2 letters of first+last name + joining year + serial |
| System-generated first password | `employeeController.createEmployee` generates a temp password; `must_change_password` flag forces reset |
| Dashboard with employee cards + status dot | `app/dashboard` — green/present, yellow/on leave, red/absent |
| Clickable card → view-only profile | `app/employees/[id]` (no editable inputs) |
| My Profile dropdown (avatar) | `components/Navbar.js` |
| Profile: Private Info / Salary Info tabs, Salary visible to Admin only | `app/profile` — salary tab only rendered for `admin`/`hr` roles, and enforced server-side in `getSalary` |
| Check In / Check Out, status dot turns green | `app/dashboard` buttons + `POST /api/attendance/check-in` / `check-out` |
| Attendance list view (Admin vs Employee) | `app/attendance` — admin sees all employees for a chosen date; employee sees own history |
| Time Off: Paid/Sick/Unpaid, calendar range, allocation counters | `app/timeoff` + `timeoff_allocations` / `timeoff_requests` tables |
| Approve/Reject buttons for Admin/HR | `app/timeoff` action buttons + `PATCH /api/timeoff/requests/:id` |
| Payroll — read-only for employees, editable by Admin | `employeeController.getSalary` / `updateSalary`, gated by `requireAdminOrHr` |

## Notes & Next Steps
- File uploads (profile picture, sick-leave attachment, company logo) are modeled as
  URL fields (`profile_picture_url`, `attachment_url`, `logo_url`). Wire up Supabase
  Storage buckets and swap in real upload endpoints when you're ready.
- Email delivery for system-generated Login IDs/passwords is stubbed — the API
  currently returns the temp password in the create-employee response so you can
  wire up an email provider (Resend, SendGrid, etc.) next.
- Row Level Security is left disabled in `schema.sql` because the backend uses the
  Supabase **service role** key and enforces authorization in Express. If you ever
  call Supabase directly from the browser, enable RLS and add policies first.
