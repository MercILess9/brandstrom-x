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

All table names are `snake_case` (no hyphens) — standardized 2026-08-27, see [[project:db-table-rename-2026-08]] memory for the full before/after list and why.

| Table | Key Columns |
|---|---|
| `profiles` | id (uuid), codename, employee_id, nick_name, full_name, email, department, level, created_at |
| `departments` | name (text, PK) — list of departments, RLS: SELECT open to authenticated |
| `b_quest_list` | id, account_name, opportunity_name, task_name, detail, link, publish_date, owner, create_date, last_update — per-role fields (deadline/assign/weight/status/etc.) live on `b_quest_task_role` instead, not flat columns here |
| `b_quest_task_role` | id, quest_id (FK → `b_quest_list.id`), role_id (FK → `b_quest_role.id`), role (denormalized name), status_id (FK → `b_quest_status.id`), status (denormalized name), work, type, deadline, weight, day, max_per_day, assign — one row per role a task has open |
| `b_quest_role` | id, name, color, icon, active, sort_order, max_capacity — dynamic role list (Designer/Creative/IT/...), `max_capacity` is the per-role daily cap Dashboard/Modal both read |
| `b_quest_status` | id, name, color, active, sort_order — dynamic status list |
| `b_quest_type` | id, name, active, sort_order |
| `b_quest_work` | role, work, day, weight |
| `b_quest_config` | rule, value — misc B-Quest-wide settings (e.g. Data Visibility mode) |
| `b_quest_member` | codename (PK), creative, designer, setting, permissions |
| `b_quest_member_role` | id, codename, role_id, new, edit, delete, assign, accept, edit_scope, delete_scope — per-role permission grants (replaces the old flat `b-quest-setting` table) |
| `setting_project` | codename (PK), bquest, bdashboard, baccount, bcommission, bfinance, system_setting |

`b_quest_capacity` (role, max_capacity) and 14 legacy flat designer_*/creative_* columns on `b_quest_list` were dropped 2026-08-27 — dead since the task-role cutover, nothing in the codebase read them anymore.

### Codename Cascade

`profiles.codename` is used as a soft join key (plain string match, no FK) across several tables. An `AFTER UPDATE` trigger on `profiles` (`trg_profiles_cascade_codename` → `fn_cascade_codename_rename()`, current version in `supabase/migrations/20260910000001_cascade_codename_opportunity.sql`) auto-propagates a codename rename into every table below — this is automatic, no manual step needed when a codename actually changes.

Tables currently covered: `setting_project.codename`, `b_account_setting.codename`, `b_finance_setting.codename`, `b_quest_member_role.codename`, `b_quest_member.codename`, `b_quest_task_role.assign`, `b_quest_list.owner`, `b_account_list.create_by`/`update_by`, `b_opportunity_list.owner`/`am`/`sub_am`/`create_by`/`update_by`.

**Standing rule:** any new table/column that stores a person's codename as free text (not a `profiles.id` FK) MUST be added to `fn_cascade_codename_rename()` in the same migration that creates it — otherwise a future codename rename will silently leave that column stale (this already happened once, after the 2026-08-27 snake_case table rename). When adding schema, check new column names like `codename`/`owner`/`assign`/`create_by` against this list, not just when a bug is reported.

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
- `:root` variables ทั้งหมดอยู่ใน `<project>.css` เท่านั้น (ยกเว้น theme tokens ด้านล่าง) — ห้ามประกาศซ้ำใน HTML
- แต่ละ HTML โหลด `<project>.css` แทน และมีแค่ style เฉพาะหน้านั้น
- โหลดลำดับ: supabase → sweetalert2 → config.js → system.js → `<project>.js` → `/system/theme.css` → `<project>.css`

### Shared Theme Tokens (`system/theme.css`)

- `--c-accent` (#bdc432), `--c-accent-light` (#f4f7a1), `--c-accent-dark` (#7a8500) — สีเขียวแบรนด์ที่ใช้ซ้ำทุก project (ปุ่ม/border/icon เต็มค่า, พื้น active-hover อ่อน, ตัวหนังสือบนพื้นอ่อน ตามลำดับ)
- `--c-on-accent` (#1e293b) — ตัวหนังสือที่วางทับพื้น `--c-accent` เต็มค่าโดยตรง (เช่น badge, ปุ่ม solid) แยกจาก `--c-dark` (สีตัวหนังสือทั่วไปของแต่ละ project) โดยตั้งใจ — วันนี้เผอิญค่าเท่ากัน แต่ธีมสีเข้มในอนาคตอาจต้องให้ `--c-on-accent` เป็นขาว ในขณะที่ `--c-dark` (หัวข้อ/เนื้อหาทั่วไป) ไม่ต้องเปลี่ยน
- `--c-accent-rgb` (`189, 196, 50`) — ค่า R,G,B ของ `--c-accent` แบบ comma-separated สำหรับ `rgba(var(--c-accent-rgb), 0.2)` ที่ต้องมี alpha (เงา/glow) — CSS variable เติม alpha เองไม่ได้ ต้องมีตัวนี้แยกไว้ และต้องอัปเดตคู่กับ `--c-accent` เองด้วยมือเสมอ (derive กันไม่ได้)
- โหลดทุกหน้า (ทุก project + `system/setting.html`) ก่อน `<project>.css` — ห้ามประกาศ `--c-accent`/`--c-accent-light`/`--c-accent-dark`/`--c-on-accent`/`--c-accent-rgb` ซ้ำใน `<project>.css` หรือ inline `<style>` อีก
- เวลาหา hardcode สีเขียวที่ยังไม่ผูกกับ theme — grep เลข `#bdc432` เฉยๆ ไม่พอ ต้อง grep `rgba(189` ด้วย เพราะ hardcode มักซ่อนอยู่ใน `rgba(189,196,50,...)` ของ box-shadow/glow ที่ grep หา hex ตรงๆ จะมองไม่เห็น
- สีความหมายอื่น (แดง danger, สี role แต่ละแบบ) ยังอยู่ใน `<project>.css` ของตัวเองเหมือนเดิม ไม่ย้ายเข้ามาที่นี่
- Text วางทับพื้น `--c-accent` เต็มค่าโดยตรง (ไม่ใช่ `--c-accent-light`) ต้องใช้ `--c-on-accent` เสมอ ห้ามใช้ `--c-dark`/hardcode hex ตรงๆ — ตอนสร้างหน้าเลือกสีธีมในอนาคต จุดที่ต้องคำนวณสี (เทียบ contrast ดำ/ขาว) คือ token นี้ตัวเดียว
- ออกแบบไว้ให้ future Setting เปลี่ยน theme สีหลักได้ — เปลี่ยน 3 ค่านี้พร้อมกันเป็นชุดเดียวเท่านั้น (ห้ามเปลี่ยนแค่ตัวเดียว จะพังคอนทราสต์)

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
