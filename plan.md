# AI AGENT MASTER INSTRUCTIONS & PROJECT PLAN

## Read This First: User Context
The user interacting with you has **ZERO coding knowledge**.
- Do not assume they know how to open a terminal, change directories, or start a local server.
- Every terminal command must be explicitly provided.
- Tell them exactly *which file* to open, *where* to create it, and *what* to paste.
- Do not use jargon without explaining it simply.
- Break every task into small steps. After each step, STOP and ask: "Did that work? Say 'ready' to continue or tell me any errors."

## AI Behavioral Guidelines
1. **Message in Parts & Ask Before Deploying.** After providing code for a step, STOP and ask if it worked.
2. **Think Before Coding.** If something is unclear, ask. Prefer simplicity.
3. **Simplicity First.** Minimal code that solves the problem. No speculative features.
4. **Surgical Changes.** Tell user whether to replace entire file or a block.
5. **Goal-Driven Execution.** Work through phases one by one. Loop until verified.

---

## PROJECT CONTEXT
A UK childminder invoicing web app. Generates monthly invoices with funded vs private hour calculations.

### Tech Stack
- React + Vite (`npm run dev` to start)
- Tailwind CSS v4 + DaisyUI v5 (`data-theme="corporate"` set on `<html>`)
- Tailwind is loaded via `@tailwindcss/vite` plugin (configured in `vite.config.js`)
- DaisyUI is loaded via `@import "daisyui/daisyui.css"` in `src/index.css` (NOT `@plugin`, which causes ESM errors with this version)
- Supabase (PostgreSQL) — client in `src/supabaseClient.js`
- react-to-print for PDF/print export
- NOT yet deployed (Vercel planned)

### Source Files
```
src/
  App.jsx                  — tab layout (Invoice / Families / Schedules)
  index.css                — Tailwind + DaisyUI imports + print helpers
  main.jsx                 — entry point
  pages/
    ParentsForm.jsx         — add a parent
    ChildrenForm.jsx        — add a child (links to parent)
    ScheduleForm.jsx        — set term-time AND holiday days per child
    InvoiceCalculator.jsx   — main invoice calculator (see below)
  supabaseClient.js
```

### Database (Supabase)
Tables: `parents`, `children`, `child_schedules`, `term_dates`, `rates`
(`sessions` and `invoices` tables exist but are unused)

- `parents`: id, name, email, phone, address
- `children`: id, parent_id, name, dob, funding_type (`None` / `15hr` / `30hr`), is_stretched_funding (unused)
- `child_schedules`: id, child_id, day_of_week (0=Mon … 4=Fri), schedule_type (`term` or `holiday`)
  - Unique constraint on `(child_id, day_of_week, schedule_type)`
  - Children can have DIFFERENT days for term time vs holidays
- `term_dates`: id, start_date, end_date
  - Contains actual 38-week Kent school term dates (NOT funding period dates):
    - 2025-09-03 to 2025-10-24 (Autumn 1)
    - 2025-11-03 to 2025-12-19 (Autumn 2)
    - 2026-01-06 to 2026-02-13 (Spring 1)
    - 2026-02-23 to 2026-04-01 (Spring 2)
    - 2026-04-22 to 2026-05-22 (Summer 1)
    - 2026-06-01 to 2026-07-17 (Summer 2)
- `rates`: id, standard_rate (£7.00), consumables_rate (£0.00)

### Domain / Funding Logic (implemented and verified)
- Each contracted day = 10 hours (07:30–17:30 full day)
- Funding caps: 15hr = 1 funded day/week, 30hr = 3 funded days/week (term-time only)
- Holiday days are always fully private (no funding applies)
- No stretched funding — term time only
- Day-of-week is stored as 0=Monday … 4=Friday (NOT JavaScript's 0=Sunday)
- The calculator converts JS `d.getDay()` using `(d.getDay() + 6) % 7` to match
- Weekends are explicitly skipped in the calculation loop
- Date strings are built manually (`YYYY-MM-DD`) to avoid UTC/BST timezone shift bugs

---

## CURRENT STATE — What Is Built and Working

### Tab Layout (`App.jsx`)
Three DaisyUI tabs: **🧾 Invoice**, **👨‍👩‍👧 Families**, **📅 Schedules**
- Layout is narrow (`max-w-2xl`) — mobile-first, tablet-width on desktop
- Navbar shows app name + "Beth Fisher & Callum Fackrell" subtitle
- Families tab: ParentsForm + ChildrenForm side by side on desktop
- Schedules tab: ScheduleForm centred

### Invoice Calculator (`InvoiceCalculator.jsx`)
Pick a month + parent → Calculate → shows:

1. **Stats bar** (vertical): Amount Due, Funded Hours, Chargeable Hours
2. **Breakdown card** with a **Calendar / Table toggle**:
   - **Calendar view** (default): monthly grid per child
     - Green squares = funded days
     - Amber squares = private term days (over weekly cap)
     - Orange squares = holiday days (always private)
     - Blank weekdays = not contracted that day
     - Below the grid: 2×2 stat tiles (total days/hours, funded hrs, chargeable hrs, amount due)
   - **Table view**: compact table with days, funded hrs, chargeable hrs, cost, due
3. **Extra charges card**: add/remove extra charges or deductions (local state only, not saved to DB)
4. **Print / Save as PDF button**: opens print dialog

### Print Invoice Layout
- Provider details (top right)
- Billed to (parent details)
- Per-child section: calendar grid + cost breakdown side by side
  - Shows: total days × hrs × rate, funded deduction (green), consumables, subtotal
- Additional charges (if any)
- Grand total
- Bank details:
  - Monzo / Callum Fackrell / 74052519 / 04-00-03 / MONZGB2L / GB18 MONZ 0400 0374 0525 19
- Payment terms
- "Thank you for choosing us to care for your child. 💛"

### CSS / Print Helpers (`index.css`)
```css
.screen-only { display: block; }      /* hidden in print */
.print-only  { display: none !important; }  /* hidden on screen */
@media print {
  .screen-only { display: none !important; }
  .print-only  { display: block !important; }
}
```
Use these classes instead of Tailwind's `print:` variants (more reliable with this setup).

---

## WHAT STILL NEEDS TO BE BUILT

### Phase 10: Families Tab — Inline Editing & Management
Currently the Families tab just shows "Add Parent" and "Add Child" forms.
It needs to become a proper management view:

1. **Parent list**: show all parents as expandable cards/rows
2. **Inline edit**: click to edit parent name, email, phone, address → save to Supabase
3. **Children list per parent**: expand a parent to see their children
4. **Inline edit child**: name, DOB, funding type, term-time days, holiday days
5. **Add new parent / child**: modal or inline toggle form
6. **Delete parent / child**: with confirmation

Use DaisyUI: `collapse`, `modal`, `table`, `form-control`, `badge`, `btn`.

### Phase 11: Invoices Tab — Mass Generation (all families at once)
Currently the invoice tab calculates one parent at a time.

The goal is:
1. Month picker → "Generate All Invoices" button
2. Calculate invoices for **all parents** concurrently
3. Show a summary list: one row per parent with base total + grand total
4. Each row expands to show per-child breakdown + extra charges form
5. "Print All Invoices" button — one invoice per family, CSS `page-break-after: always` between them

### Phase 12: Deployment
1. Create a private GitHub repo
2. Connect to Vercel
3. Set environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Vercel dashboard

---

## KNOWN ISSUES / THINGS TO VERIFY
- Term dates (loaded manually via SQL) should be verified against the official KCC school calendar
- The `is_stretched_funding` field on children exists but is unused — stretched funding is not offered
- `sessions` and `invoices` tables exist in Supabase but are not used by the app
- Bank details are hardcoded in the print template (Callum Fackrell's Monzo account)

---

## AI START HERE
Resume at **Phase 10: Families Tab — Inline Editing**.

Begin by reading `src/App.jsx` and `src/pages/ParentsForm.jsx` to understand the current structure, then ask the user if they are ready to start building the Families management view.
