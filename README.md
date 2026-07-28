# Emmanuel Medical Center — Entebbe
### Hospital Management & Pharmacy POS System

A 5-page (+ About) hospital management system: login, dashboard, patients &
appointments, doctor consultation, pharmacy POS & inventory, laboratory,
billing & finance, and reports/users/settings — combined into these files:

| File | Covers |
|---|---|
| `index.html` | Login & authentication, forgot password, security logs |
| `dashboard.html` | Hospital stats, charts, quick actions |
| `patients.html` | Patient registration & profiles, appointments, reception queue |
| `clinical.html` | Doctor consultation: history, diagnosis, prescriptions, lab requests |
| `pharmacy.html` | Pharmacy POS (sales) + medicine/inventory management |
| `laboratory.html` | Lab test requests, results entry, notify doctor |
| `billing.html` | Invoices, payments, receipts, revenue |
| `admin.html` | Reports, user/role management, notifications, settings, security logs |
| `about.html` | Hospital info, services offered |

## Getting started
Open `index.html` in a browser (or serve the folder with any static file
server). First login:

- **Username:** `admin`
- **Password:** `admin123`

You'll be asked to set a new password immediately — this is a real account,
not a demo mode, and no sample patients/sales/inventory are pre-loaded.
Everything you see is data you enter.

## How data is stored
All 20 tables (`users`, `roles`, `permissions`, `patients`, `doctors`,
`staff`, `departments`, `appointments`, `medical_records`, `prescriptions`,
`medicines`, `inventory`, `sales`, `sale_items`, `payments`, `invoices`,
`laboratory_tests`, `laboratory_results`, `notifications`, `audit_logs`,
`settings`) live in the browser's `localStorage`. Use **Reports, Users &
Settings → Settings → Backup & restore** to export/import a JSON backup —
do this regularly, since clearing browser data clears the hospital's records.

## Editing the system
Everything is plain HTML/CSS/JS — no build step, no framework lock-in:
- Colors, gradients and fonts: `css/style.css` (CSS variables at the top)
- Data layer: `js/db.js`
- Login/session/roles: `js/auth.js`
- Notifications: `js/notifications.js`
- Shared sidebar/topbar: `js/shell.js`
- Favicon: `assets/favicon.svg`

## Being honest about notifications
Notifications save straight to the `notifications` table and appear
instantly across every open tab/window **on the same device** (via
`BroadcastChannel` + storage events). Because this is a static,
serverless, browser-only build, a notification sent from one physical
device is **not** pushed live to a different physical device — there is
no shared server. Any device that opens the app will see notifications
once its own local data includes them (e.g. after a backup/restore, or
once a proper backend is added). If true real-time, cross-device
notifications are required, the next step is a small backend (e.g. a
lightweight API + database, or a service like Firebase/Supabase) that
this front end can be pointed at — happy to help wire that up if wanted.
