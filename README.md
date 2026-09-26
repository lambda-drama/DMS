# DMS — Dealer Management System

A [Frappe](https://frappeframework.com) / [ERPNext](https://erpnext.com) v16 app for vehicle dealerships. It covers the whole aftersales workshop — booking, inspection, estimation, job cards, parts, quality control, warranty, delivery and invoicing — and ships a dealership CRM for leads, deals, test drives, delivery readiness, loyalty, campaigns and service retention.

Everything runs in one app with **two workspaces**:

| Workspace | For | Entry point |
| --- | --- | --- |
| **DMS** | Workshop & aftersales (service advisors, technicians, parts, accounts) | `/dms` → *Dashboard* |
| **DMS CRM** | Sales & customer care (sales staff, call centre, CRM managers) | `/dms` → *CRM Overview* |

The app is a modern web application (Next.js) served by Frappe at `/dms`, plus the standard Frappe Desk workspaces **Dealer Management** and **DMS CRM** for power users.

## Contents

- [What you get](#what-you-get)
- [Requirements](#requirements)
- [Installation](#installation)
- [First-time setup](#first-time-setup)
- [Getting around the app](#getting-around-the-app)
- [Roles and access](#roles-and-access)
- [DMS Settings reference](#dms-settings-reference)
- [Data import tools](#data-import-tools)
- [Background jobs](#background-jobs)
- [Rebuilding the web app](#rebuilding-the-web-app)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [For developers](#for-developers)

## What you get

### DMS — workshop & aftersales

| Menu section | Screens |
| --- | --- |
| **Overview** | Dashboard |
| **Workshop** | Appointments, Inspections, Service Estimates, Job Cards, Parts Requisition, Technicians, Delivery |
| **Management** | Customers, Vehicles (VIN), Invoices, Orders, Payment Entries, Reconciliation Hub, Follow-ups |
| **Master** | Service Advisors, Parts Advisors, Spare Parts, Vehicle Models, Services, Service Packages, Item Prices, Job Card Terms, Sales Invoice Terms |
| **Inventory** | Inventory Dashboard, Stock Entry, Stock Reconciliation, Material Request, Pending Requests, Purchase Receipt, Spare Part Sales, Proforma Invoices |
| **User & Permissions** | User, Permission, Advanced Permission |
| **Reports** | Executive, Workshop, Service Advisor, Technician, Parts & Inventory, Warranty, Quality Control, Customer & CRM, Finance, Compliance |

### DMS CRM — sales & customer care

Dashboard, Leads, Deals (opportunities), Appointments, Contacts, Customers (Customer 360), Vehicles (Vehicle 360), Activities, Approvals, Call Logs, Call Center, Test Drives, Delivery Readiness, Bookings, Accounts, Tenders, Fleet Aftersales, Service Retention, Calendar, Cases, Campaigns, Quotations, Referrals, Loyalty, Segments, Staff Audit, and CRM report groups (Executive, Sales, Aftersales, Call Centre & Campaign).

### ERPNext integration

DMS builds on standard ERPNext documents instead of duplicating them:

- **Items ↔ Vehicle Service Item** — labour and parts masters become ERPNext Items, with FRT, category and model fields.
- **Sales Invoice ↔ DMS Job Card** — invoices raised from a job card are linked back on submit/cancel, and linked payments sync automatically.
- **Payment Entry, Sales Order, Material Request, Stock Entry, Stock Reconciliation, Purchase Receipt** — carry DMS flags so the app can list only its own records.
- **Serial / Batch Bundle → VIN** — outgoing serial numbers can create and sync **VIN No** records (see *Auto-create Vin from Serial* in DMS Settings).

### Seeded out of the box

Fixtures install a starter **QC Checklist Template**, **Bay Type**, **Working Time** schedules, the **Vehicle Inspection - Terms** and **Service Estimate - Terms** print formats, and the DMS roles.

## Requirements

| Component | Version |
| --- | --- |
| Frappe | v16 (`>=16.0.0,<17.0.0`) |
| ERPNext | v16 (`>=16.0.0,<17.0.0`) — required |
| Python | 3.14+ |
| MariaDB | 11.x (11.8 is used in CI) with Redis |
| Node.js + Yarn | only needed if you rebuild the web app |

The compiled web app (`dms/public/frontend/_next` and `dms/www/dms_frontend.html`) is committed, so a plain install does **not** require Node.

## Installation

1. Add the app to your bench and install it on a site:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app https://github.com/lambda-drama/DMS.git --branch version-16
bench --site your-site.local install-app dms
```

2. Build assets, run migrations and clear the cache:

```bash
bench build --app dms
bench --site your-site.local migrate
bench --site your-site.local clear-cache
```

3. Enable the scheduler so reminders and CRM background jobs run:

```bash
bench --site your-site.local enable-scheduler
```

`bench migrate` creates the DMS runtime custom fields (Sales Order / Payment Entry / Quotation / Vehicle Labour Item flags, the VIN link, and the "force password change" field) as Administrator. If one fails, the error is logged in **Error Log** and retried on the next migrate.

## First-time setup

### 1. Configure DMS Settings

Open **DMS Settings** (in Desk, search *DMS Settings*; it is a single settings record). At minimum set your **Company**, then the defaults used across estimates, invoices and stock — see the [DMS Settings reference](#dms-settings-reference).

### 2. Load your masters

Before you can raise a job card you need the workshop structure and catalogue:

1. **Workshop** and **Service Bay** (with **Bay Type**), plus **Working Time** schedules.
2. **Technician**, **Service Advisor** and **Parts Advisor** records (these can be linked to Frappe users).
3. **Vehicle Model**, **Vehicle Service Category** / **Vehicle Service Type**, **Vehicle Service Item** (services and labour), **Spare Part**, **Vehicle Service Package**.
4. **Customer** and **VIN No** (vehicle) records — VINs are usually created automatically from serial numbers or imports.
5. Optional: **QC Checklist Template**, **Road Test Template**, **Delivery Checklist Template**, **Vehicle Warranty Rule**, **DMS Customer Terms and Conditions**.

> Tip: the fastest way to load a model's labour catalogue is the **Import FRT labour sheet** tool — see [Data import tools](#data-import-tools).

### 3. Create users and grant access

Use **User & Permissions → User** in the DMS web app (Dealer Manager, System Manager and Administrator can do this), or the **Permission** page for per-user section access. Passwords set by an admin are temporary: the user is asked to choose their own password at first sign-in.

### 4. Optional extras

- **Quality control / road test / delivery checklists** — seed the templates, then link them per vehicle model.
- **Service reminders** — turn on *Send Reminders for Servicing* in DMS Settings. WhatsApp reminders additionally require the optional `nextlayer` app.
- **Print formats** — add dealer-specific templates and select them in DMS Settings (sales and purchase receipt print formats are multi-select).

## Getting around the app

### URLs

| Location | URL |
| --- | --- |
| DMS / DMS CRM web app | `https://your-site.local/dms` |
| Frappe Desk (Dealer Management, DMS CRM workspaces) | `https://your-site.local/app` |

Users sign in with their normal Frappe credentials. The DMS app is a single-page app: the whole UI lives behind `/dms`, and deep links such as `/dms/job-cards` work.

### Switching between DMS and CRM

Use the workspace switcher at the top of the sidebar to move between **DMS** and **DMS CRM**. If a user can access only one workspace (set on the *Permission* page), the switcher is hidden.

### Hiding ERPNext stock screens

Some dealers do not want staff creating Stock Entry / Stock Reconciliation / Purchase Receipt / Material Request documents by hand. Turn on the matching *Hide …* option in DMS Settings and those menus disappear for everyone.

## Roles and access

The app ships four roles:

| Role | Use it for |
| --- | --- |
| **Dealer Manager** | Dealership administrator — full DMS access, manages users, sees Dashboard and Reports |
| **Spare Parts Manager** | Parts and inventory management |
| **DMS CRM User** | Sales / customer-care staff working in the DMS CRM workspace |
| **DMS CRM Manager** | CRM team lead — full CRM access |

Notes:

- **Dashboard** and **Reports** require a management role (`Dealer Manager`, `System Manager` or `Administrator`).
- Screen-level access follows normal Frappe role permissions: if a user's role cannot read a DocType, that menu item is hidden in the app.
- The **Permission** page (*User & Permissions → Permission*, backed by **DMS CRM User Settings**) controls which of the ten report/section groups each user can see: Executive, Workshop, Service Advisor, Technician, Parts & Inventory, Warranty, Quality Control, Customer & CRM, Finance, Compliance.
- The **Advanced Permission** page manages roles, role profiles and role permissions without leaving the app.

## DMS Settings reference

| Group | Setting | What it does |
| --- | --- | --- |
| General | Company | One or more ERPNext companies served by the app |
| General | Company Defaults | Per-company overrides |
| General | Posting Date | Default posting date for generated documents |
| Pricing | Spare Part Markup | Markup % applied to spare-part prices |
| Pricing | Default Price List | Price list used for sales |
| Pricing | Default Diagnostic Fee / Diagnostic Fee Item | Default inspection/diagnostic charge and its item |
| Pricing | Default Service Fee | Default labour/service fee |
| Pricing | Default VAT Rate (Estimates) | Tax rate pre-filled on estimates |
| Pricing | Default Item Group, Default Supplier Group, Default Supplier, Default Customer Group, Default Customer | Defaults used when creating items, suppliers and customers on the fly |
| Taxes | Default Taxes and Charges Template, Default Tax Withholding Category, Tax Withholding Group, Use Withholding Group | Tax behaviour for invoices raised from job cards and orders |
| Warranty | Warranty Period (Years), Warranty Mileage (Kms) | Fallback warranty terms; per-model rules live in **Vehicle Warranty Rule** |
| Warranty | Add Full Warranty Item on Invoice | Add the warranty item automatically on invoices |
| Reminders | Send Reminders for Servicing | Daily service-due reminders based on Vehicle Model service intervals |
| Printing | Sales Print Format, Purchase Receipt Print Format | Print templates offered in the app |
| Visibility | Hide Stock Entry / Hide Stock Reconciliation / Hide Purchase Receipt / Hide Material Request | Remove the manual stock screens from the menu |
| Vehicles | Auto-create Vin from Serial | Create and update **VIN No** records from serial numbers on stock movements |
| Compliance | After Repair Probation Period (Days) | Follow-up window after a repair |

## Data import tools

| Tool | Where | Imports |
| --- | --- | --- |
| **Import FRT labour sheet** | DMS → Settings | FRT Excel workbooks: each model tab creates one **Vehicle Model**, and its service rows become **Vehicle Service Items** |
| **Import Service Packages** | DMS Settings → *Imports* in Desk | Service-package definitions |
| **Inventory import** | DMS API / Desk import tools | Spare parts and opening stock |

## Background jobs

With `bench enable-scheduler`, the app runs:

| Frequency | Job |
| --- | --- |
| Daily | Service-due reminders (`dms.tasks.daily`) — email, plus WhatsApp when the optional `nextlayer` app is installed |
| Daily | CRM: quotation expiry, ownership-journey reminders, service retention, case SLA, activity engine, pipeline snapshot |
| Every few minutes | CRM: reassign leads that were not accepted within the allocation window |

Reminders are recorded as comments on the VIN so the same reminder is never sent twice, and every failure is written to **Error Log**.

## Rebuilding the web app

The compiled frontend is committed. Rebuild it only if you change files under `frontend/`:

```bash
cd $PATH_TO_YOUR_BENCH/apps/dms
yarn install          # first time only
yarn build            # = next build --webpack + node scripts/copy-to-frappe.js
bench build --app dms
bench --site your-site.local clear-cache
```

`yarn build` copies the Next.js static export into `dms/public/frontend/_next` (served as `/assets/dms/frontend/...`) and regenerates `dms/www/dms_frontend.html` with the CSRF token injected. Users may need a hard refresh to pick up new assets.

### Running the frontend in development

```bash
cd apps/dms/frontend
FRAPPE_URL=http://localhost:8000 yarn dev
```

The dev server runs at `http://localhost:3000/dms` and proxies `/api`, `/files` and `/assets/dms` to your Frappe site (`FRAPPE_URL`, default `http://localhost:8000`).

## Updating

```bash
cd $PATH_TO_YOUR_BENCH
bench update --apps dms      # pulls the app and runs migrate
bench build --app dms
bench --site your-site.local clear-cache
```

Or manually:

```bash
cd apps/dms && git pull
bench --site your-site.local migrate
bench build --app dms
```

Migrations are listed in `dms/patches.txt` and run in order; they seed templates, repair workspaces and icons, backfill DMS flags on documents (including spare-part Sales Orders), and apply the *Disable Rounded Total on DMS Sales Orders* patch.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `/dms` returns 404 or a blank page | Run `bench build --app dms` and `bench --site <site> clear-cache`; confirm `dms/www/dms_frontend.html` exists and the app is installed on the site |
| Static assets 404 (chunks, CSS) | Check that `dms/public/frontend/_next` exists on disk and that `bench build --app dms` was run after the last pull |
| Sidebar menus are missing for a user | Grant the DocType permissions for that user's role, or enable the section on the *Permission* page |
| Dashboard / Reports are not visible | The user needs `Dealer Manager`, `System Manager` or `Administrator` |
| Service reminders are not sent | Turn on *Send Reminders for Servicing*, run `bench --site <site> enable-scheduler`, and check the outgoing **Email Account**; WhatsApp needs the `nextlayer` app |
| `DMS runtime custom field setup failed` in Error Log | Run `bench --site <site> migrate` (as Administrator); the fields are retried on every migrate |
| A DMS workspace or desktop icon disappeared | Run `bench --site <site> migrate` — the repair patches restore them |

> ⚠️ Never edit files under `dms/public/frontend/_next` or `dms/www/dms_frontend.html` — they are generated by `yarn build` and are overwritten on every rebuild.

## License

MIT — see `license.txt`.

## For developers

This app uses `pre-commit` for formatting and linting. Install it and enable the hooks before your first commit:

```bash
cd apps/dms
pre-commit install
pre-commit run --all-files
```

Hooks: ruff (lint + format), prettier, eslint, pyupgrade and Frappe's standard checks. Generated frontend build output (`dms/public/frontend/_next/**`) is excluded from the JS hooks — rebuild it with `yarn build` instead of formatting it.

CI (GitHub Actions) runs on every push to `version-16` and every pull request:

- **CI** — installs the app on a fresh site and runs unit tests.
- **Linters** — `pre-commit`, [Frappe Semgrep rules](https://github.com/frappe/semgrep-rules) and `pip-audit`.

### Repository layout

```
dms/                                  Frappe app (Python)
├── api/                              Aftersales REST/RPC endpoints used by the web app
├── crm_api/                          CRM endpoints and CRM scheduled jobs
├── dealer_management_system/         Aftersales DocTypes, workspace, print formats
├── customer_relationship_management/ CRM DocTypes and workspace
├── patches/                          Migration steps listed in patches.txt
├── public/frontend/                  Compiled web app (generated)
├── www/dms_frontend.html             SPA entry point (generated)
├── hooks.py                          Fixtures, doc events, scheduler and routes
└── install.py                        Runtime custom-field setup on install/migrate
frontend/                             Next.js + React source for the /dms web app
```
