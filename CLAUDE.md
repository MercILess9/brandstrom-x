# Brandbox — Brandstrom X Portal

## Stack
- Static HTML + Vanilla JS (no framework)
- Supabase (auth + database)
- Vercel (`cleanUrls: true`)
- Domain: `bx.brandboxplatform.com` (Google Cloud)

## Project Structure

```
system/
  config.js         — Supabase credentials, SITE_URL, LOGO_URL
  system.js         — Auth guard, layout init, header inject, shared utils
  header.html       — Fixed header template (injected via JS)
  setting.html      — System Settings (Users & Access + Departments)
auth/
  auth.js           — Login / Signup / Forgot / Reset password functions
  *.html            — Auth pages (signup.html loads departments from DB)
index.html          — Portal home (project cards grid + top-right gear/logout icons)
b-quest/
  b-quest.js            — Config, permission loader, God mode logic; also shared
                          helpers for other B-Quest pages: hexToRgba() and
                          createRoleSegControl() (sliding role-segment filter)
  b-quest-assign-picker.js — Shared assign-picker popup (search + pick-a-person
                          list, clear-to-unassign), self-injecting CSS/markup
                          convention like system/multi-select.js. Loaded by any
                          page that needs it (currently b-quest-assignment.html).
  b-quest-modal.js      — Task create/edit modal (IIFE: BQuestApp)
  b-quest-list.html     — Task list with infinite scroll + filter
  b-quest-assignment.html — Unassigned task queue
  b-quest-settings.html — Member permissions management
  b-quest-dashboard.html — Charts & capacity overview (uses Chart.js CDN)
vercel.json
```

## Database Schema (Supabase)

| Table | Key Columns |
|---|---|
| `profiles` | id (uuid), codename, employee_id, nick_name, full_name, email, department, level, created_at |
| `departments` | name (text, PK) — list of departments, RLS: SELECT open to authenticated |
| `b-quest-list` | id, account_name, opportunity_name, task_name, detail, link, publish_date, designer, designer_weight, designer_type, designer_deadline, designer_assign, designer_status, creative, creative_weight, creative_type, creative_deadline, creative_assign, creative_status, owner, create_date, last_update |
| `b-quest-work` | role, work, day, weight |
| `b_quest_capacity` | role, max_capacity |
| `b-quest-setting` | codename (PK), ae, creative, designer, new, edit, delete, assign, setting |
| `setting_project` | codename (PK), bquest, bdashboard, baccount, bcommission, bfinance, system_setting |

## Auth & Permission System

**Auth guard:** `initLayout()` → `initAuthGuard()` called on every page. Redirects to `/auth/login.html` if no session.

**User profile:** Stored in `sessionStorage` as `bx_user` after login.

**God mode:** `profiles.level === 'god'` → bypasses all permission checks, never shown in member lists (always filter `.neq('level', 'god')`). God user is not listed in any project's member/setting table.

**Per-project permissions:** Each project has its own settings table (e.g. `b-quest-setting`). Permissions are cached in `sessionStorage` with key `bx_perms_<project>` (e.g. `bx_perms_bquest`). Cleared on index and on every project page load to ensure fresh perms on refresh.

**Permission columns in b-quest-setting:**
- ROLE: `ae`, `creative`, `designer`
- TASK: `new`, `edit`, `delete`
- ADMIN: `assign`, `setting`

**System-level access (`setting_project`):**
- Per-project toggles: `bquest`, `bdashboard`, `baccount`, `bcommission`, `bfinance`
- `system_setting` — access to `/system/setting.html`

## JS Architecture Rules

- **Shared JS** → separate `.js` file (used across multiple pages of same project)
- **Page-specific JS** → inline `<script>` at bottom of that HTML file
- **System-level JS** → `system/system.js` and `system/config.js` (loaded on every page)
- Each project has its own config object (e.g. `B_QUEST_CONFIG`) in its `.js` file

## Page Init Pattern

Every project page follows this exact order:
```js
async function initPage() {
    sessionStorage.removeItem('bx_perms_<project>');  // clear cache ก่อนเสมอ
    await initLayout(CONFIG);                          // fetch perms + render header
    // guard หลัง initLayout — ตรวจ perms แล้ว redirect ถ้าไม่มีสิทธิ์
    // ตัวอย่าง: if (!perms?.setting) window.location.replace('...');
    await loadMasterData();                            // filter/dropdown data ครบก่อน render
    await fetchData(true);                             // โหลด list แรก — ต้อง await
}
// IntersectionObserver ต้อง active หลัง initPage เสร็จเท่านั้น
initPage().then(() => observer.observe(triggerEl));
```
- `initLayout` เรียก `getMenuPerms` (= `loadPerms`) อยู่แล้ว → perms set ใน sessionStorage ก่อน guard รัน
- **ห้าม guard ก่อน initLayout** — perms ยังไม่โหลด จะ redirect ผิด
- **ห้าม observer.observe ก่อน initPage เสร็จ** — observer จะ trigger fetchData ก่อน perms/masterData พร้อม ทำให้ 10 card แรกไม่มีปุ่ม Edit
- Auth pages และ index.html ไม่ต้องทำ pattern นี้

## CSS Architecture Rules

- แต่ละ project มีไฟล์ CSS ของตัวเอง เช่น `b-quest.css`
- `:root` variables ทั้งหมดอยู่ใน `<project>.css` เท่านั้น — ห้ามประกาศซ้ำใน HTML
- แต่ละ HTML โหลด `<project>.css` แทน และมีแค่ style เฉพาะหน้านั้น
- โหลดลำดับ: supabase → sweetalert2 → config.js → system.js → `<project>.js` → `<project>.css`

## Performance Rules

- List pages use **infinite scroll**: 10–15 items per page via `IntersectionObserver`
- Filter/search must work across **all data** (not just current page) — fetch complete datasets for filter options separately
- Master data (work list, profiles, etc.) loaded once per page via `Promise.all`
- Modal helper data (profiles, capacity) cached per page load with `_loaded` flag — re-fetched on page refresh, not on every modal open

## Brand & UI

- **Brand lime:** `#bdc432` (also `rgb(189, 196, 50)`)
- **Brand dark:** `#1e293b` (headers, buttons) or `#111111` (portal)
- **Background:** `#f8fafc`
- **Font:** Outfit (portal/auth), Inter + Sarabun (project pages)
- **UI style:** Clean, modern, minimal — no clutter. Bootstrap 5 + Bootstrap Icons via CDN
- **Notifications:** SweetAlert2 via `notify()` wrapper in system.js

## User Display

Users are always shown as **codename** (nickname). Format reference: `codename : nickname (employee_id)`

## index.html — Portal Home

- Top-right: gear icon (⚙️ → `/system/setting.html`) shown only to god/system_setting users; logout icon shown to all
- Project cards rendered from `setting_project` access data
- God user sees all projects + gear icon automatically

## System Settings (`/system/setting.html`)

Two sections:
1. **Departments** — CRUD list, 2-column grid, add inline in grid, sort a-z after save. Data from `departments` table (name PK). Staging pattern same as b-quest-settings.
2. **Users & Access** — manage profiles + per-project toggles + system_setting flag. Department cell is dropdown from `departments` DB.

## Departments Table

- Table: `departments` — columns: `name` (text, PK only — no id, no sort_order)
- RLS: `SELECT` open to authenticated (`USING (true)`)
- Write policy: authenticated users (or manage via SQL Editor)
- Sorted a-z by `name` on query
- Used in: `system/setting.html` (manage), `auth/signup.html` (dropdown), Users & Access dept dropdown

## Adding a New Project

1. Add a card in `index.html` (app-grid section) + add key to `PROJECTS` array
2. Create a new folder `/<project-name>/`
3. Create `<project-name>.js` — config object, `loadPerms()`, `canProject(perm)`, `canProjectEditRole(role)` (follow `b-quest.js`)
4. Create `<project-name>.css` — `:root` variables + shared styles (follow `b-quest.css`)
5. Create HTML pages, each loading: supabase → sweetalert2 → config.js → system.js → `<project-name>.js` → `<project-name>.css`
6. Create a settings table in Supabase: `<project>-setting` with columns: codename (PK), role columns, task columns (new/edit/delete), admin columns (assign/setting)
7. Add column to `setting_project` table for the new project key
8. sessionStorage key: `bx_perms_<project>` — system.js clears all `bx_perms_*` keys on index automatically

## Security Patterns

- **HTML escaping:** All DB fields rendered via `innerHTML` must go through `esc(s)` — escapes `&`, `<`, `>`, `"`. Defined inline per page (not in system.js).
- **Safe links:** External URLs from DB must use `safeLink(url)` — allows only `http://` and `https://` protocols, returns `'#'` otherwise.
- **External links:** Always add `rel="noopener"` on `target="_blank"` anchors.
- **Input value attributes:** Escape `"` → `&quot;` when interpolating DB strings into HTML `value="..."` attributes.
- b-quest-assignment already uses `esc()` globally. b-quest-list applies it to all card render fields.

## B-QUEST List Filter Pattern

Advanced filter zone (`flt-advanced-row`) contains:
- **Status segmented control** — 3-button group (All / Progress / Done), single-select, default = All
  - `setStatusFilter(type)` toggles `.active` class and calls `applyFilters()`
  - Done filter: `or('designer.is.null,designer.eq.-,designer_status.eq.Done')` + same for creative — handles tasks with only one role (other role = null)
  - Progress filter: `or('designer_status.neq.Done,creative_status.neq.Done')`
- **Work / Type / Assign / Owner** dropdowns
- **RESET** resets all dropdowns + returns status to All

## Projects Status

| Project | Status |
|---|---|
| B-QUEST | Live |
| DASHBOARD | Coming Soon |
| B-ACCOUNT | Coming Soon |
| COMMISSION | Coming Soon |
| FINANCE | Coming Soon |

## Planned Features (Future)

- Email notifications
- Per-project dashboard with settings access
