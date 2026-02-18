

# EzyHelpers Internal Ops Dashboard

## Overview
An internal operations dashboard for managing **New Placements** and **Replacements** leads, with persistent database storage and multi-user access via Supabase.

---

## Page: Dashboard (Single Page with Tabs)

### Layout
- **Top navigation bar** with app title "EzyHelpers Ops"
- **Two tabs**: New Placements | Replacements
- Each tab has a **form section** (collapsible or modal) and a **data table** below

---

## Tab 1: New Placements

### Form – New Placement Entry
A clean form with the following fields:
- **Lead-in Date** – Date picker (DD/MM/YYYY)
- **Area of Requirement** – Text input
- **Apartment / Society** – Text input
- **Job Type** – Dropdown (Live-in, Full-time, Part-time)
- **Tasks** – Multi-select tags (Housekeeping, Dusting, Cooking, editable)
- **Language** – Multi-select (Hindi, Kannada)
- **Salary** – Text input
- **Lead Priority** – Dropdown (Hot, Warm, Cold) with confirmation dialog
- **Lead Status** – Dropdown (In-progress, Won, Lost) with confirmation dialog
- **Sales Person** – Dropdown (Laxmi, Anjum, Saritha, Rashmi) with confirmation dialog

All fields mandatory. Submit button disabled until all filled. Success toast + auto-reset on submit.

### Table – New Placements
- Displays all placement leads with sticky header, row hover, and sorting
- **Inline editing** for Lead Priority, Lead Status, and Sales Person — each triggers a confirmation dialog before saving
- Lead Priority is **color-coded** (Hot=Red, Warm=Amber, Cold=Blue)

---

## Tab 2: Replacements

### Form – Replacement Entry
Inherits all fields from New Placements, plus:
- **Assign To** – Dropdown (for ops executive / field officer) with confirmation dialog
- **Age of Lead** – Auto-calculated read-only field (days since Lead-in Date)

### Table – Replacements
- Same columns as New Placements plus **Age of Lead** and **Assign To**
- Age of Lead is **color-coded**: Green (0–3 days), Amber (4–7 days), Red (8+ days)
- Sortable by Age of Lead
- Inline editing for Priority, Status, Sales Person, and Assign To with confirmations

---

## Confirmation Dialogs
Any change to Lead Priority, Lead Status, Sales Person, or Assign To will trigger a modal confirmation (e.g., "Confirm assignment to Laxmi?") before saving.

---

## Backend (Supabase / Lovable Cloud)
- **Database tables**: `new_placements` and `replacements` storing all lead data
- **Authentication**: Basic auth so team members can log in
- **RLS policies**: Authenticated users can read/write all leads

---

## Design Style
- Clean, minimal, neutral colors
- Desktop-first, responsive layout
- Speed-focused with smart visual highlights (priority badges, age indicators)
- No heavy graphics

---

## Future-Ready (Not Built Now)
- Filters by area, salesperson, status
- Export to Excel
- Daily ageing alerts
- KPI summary cards

