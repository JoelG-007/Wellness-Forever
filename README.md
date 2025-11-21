# Wellness Forever — Pharmacy Operations App

[![Status](https://img.shields.io/badge/status-planning-blue)](.#)
[![Scope](https://img.shields.io/badge/scope-pos%20%7C%20inventory%20%7C%20prescriptions%20%7C%20reports-forestgreen)](.#)
[![License](https://img.shields.io/badge/license-TBD-lightgrey)](./LICENSE)

A streamlined pharmacy operations app covering POS (point‑of‑sale), batch/expiry‑aware inventory, and prescription management for retail pharmacies. It enforces role‑based access (manager, pharmacist, stock controller, CSA), validates prescriptions for Rx‑only items, and maintains immutable audit logs for compliance. It also provides employee shift summaries/targets and actionable reports (sales, low‑stock, near‑expiry, performance) to improve day‑to‑day efficiency.

---

## Key Features

- Sales & Billing (POS)
  - Fast product search by name/SKU/barcode
  - Cart, taxes/discounts, payments, invoice print/PDF
  - Rx gating: Rx‑only items require a verified prescription before checkout
- Inventory Management
  - Batch‑level stock with expiry and cost/MRP
  - FEFO allocation (first‑expiry‑first‑out) at sale time
  - GRN/receipts, stock adjustments (damage/expiry), low‑stock & near‑expiry alerts
- Prescription Management
  - Capture prescription details with file attachment
  - Pharmacist verification workflow and customer history
- Employee Utilities
  - Clock‑in/out, shift summaries, sales/target tracking
  - Role‑aware access, notifications for tasks/alerts
- Reports & Analytics
  - Sales by period/employee/item/category
  - Inventory valuation, low‑stock, near‑expiry, dead stock
  - Orders: PO cycle time, supplier performance
- Compliance & Audit
  - RBAC, immutable audit logs, prescription safeguards for controlled drugs

---

## Architecture at a Glance

This project can be implemented as a modern web app with:
- Frontend: Next.js App Router (TypeScript), Tailwind + shadcn/ui, SWR for client cache
- Auth/DB/Storage: Supabase (Postgres) with Row Level Security (RLS) and Storage for attachments
- Background Jobs: Scheduled tasks (e.g., cron) for expiry/reorder checks and scheduled reports
- Printing/PDF: Server route for invoices (HTML print; optional PDF)

Design principles:
- Batch‑level inventory and FEFO to minimize wastage
- Strict RBAC with server‑side enforcement
- Transactional writes for sales, returns, and stock movements
- Observability and immutable audit for regulated workflows

---

## Data Model Snapshot

Core entities (not exhaustive):
- branches, roles, employees, employee_roles
- customers, feedback
- products, product_batches (batch_code, expiry, cost/mrp, qoh)
- suppliers, purchase_orders, goods_receipts
- prescriptions, prescription_items
- sales (invoices), sale_items, payments, returns, return_items
- stock_adjustments, shifts, alerts, audit_logs

Relationships highlight:
- Product 1–N Product Batches; FEFO applied when selling
- Customer 1–N Sales, 1–N Prescriptions
- Employee N–M Roles; branch‑scoped access via RLS
- Sale 1–N Sale Items, 1–N Payments; optional link to Prescription

---

## Core Workflows

1) POS (Sales & Billing)
- Search/add items → Rx check (if needed) → FEFO batch allocation → taxes/discounts → payment → invoice
- Atomic transaction: sale + items + payment + batch decrements + audit

2) Inventory Intake
- Purchase Order (draft → issued) → Goods Receipt (GRN) → create/update batches (expiry/MRP/cost) → stock on hand

3) Expiry & Reorder
- Daily checks for near‑expiry and low‑stock → alerts → optional auto‑PO suggestions

4) Prescription Management
- Upload and record → pharmacist verifies → link to sale for Rx items → maintain history by customer

5) Returns
- Policy validation → refund/reversal → batch‑aware restock where applicable → audit entry

---

## Getting Started

- Prerequisites
  - Node.js 18+, a Postgres database (e.g., Supabase), and a modern browser
- Environment variables (example)
  - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE (server)
  - NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL (email confirmation redirects)
- High‑level setup
  - Create database schema for core tables (products, batches, sales, prescriptions, etc.)
  - Configure RBAC/RLS by role and branch
  - Seed base data (roles, a test branch, a few products/batches)
  - Spin up the app and test E2E: create batch → sell OTC item → print invoice

---

## Roadmap

- Phase 1: Foundation & Auth (roles, RLS, branch context)
- Phase 2: Products & Batches (CRUD, FEFO, adjustments)
- Phase 3: Purchase → GRN (POs, receipts, reconciliation)
- Phase 4: POS (search, cart, taxes, invoice, returns)
- Phase 5: Prescriptions (upload, verification, Rx gating)
- Phase 6: Reports (sales, inventory, expiry/reorder, performance)
- Phase 7: Alerts, Targets & Polish (notifications, shift targets, hardening/tests)

---

## Contributing

- Open issues for bugs/feature requests
- Use descriptive PRs with screenshots or short clips for UX changes
- Add tests for critical workflows (sales, GRN, returns, Rx verification)

## License

TBD.

# Pharmacy Management System

This is a code bundle for Pharmacy Management System. The original project is available at https://www.figma.com/design/NoB3spEMGbIjMYwBjNaHV3/Pharmacy-Management-System.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.
  
