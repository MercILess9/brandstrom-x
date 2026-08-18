const B_QUEST_CONFIG = {
    projectName: "B-QUEST",
    version: "1.0.4",
    accessKey: 'bquest',
    itemsPerPage_List: 10,
    itemsPerPage_Assign: 10,
    listTypes: ["New Task", "Revise 1", "Revise 2", "Revise 3", "Revise 4", "Revise 5"],
    menus: [
        { name: "Dashboard", link: "b-quest-dashboard.html", perm: "dashboard" },
        { name: "List", link: "b-quest-list.html" },
        { name: "Assignment", link: "b-quest-assignment.html", perm: "assign" },
        { name: "Settings", link: "b-quest-settings.html", perm: "setting" },
    ]
};

// Permissions are per-role: p.roles['Designer'] = { role_id, new, edit, delete, assign }.
// Special/global flags (e.g. "setting" access) live in p.permissions (a plain array of keys).
async function loadBquestPerms() {
    const user = getBxUser();
    if (!user) return null;

    if (user.level === 'god') {
        const { data: allRoles } = await supabaseClient.from('b-quest-role').select('id, name').eq('active', true);
        const roles = {};
        (allRoles || []).forEach(r => { roles[r.name] = { role_id: r.id, new: true, edit: true, delete: true, accept: true, assign: true }; });
        // "setting"/"assign"/"dashboard" flat fields are also kept alongside
        // permissions/roles — system.js's generic menu-perm gate reads
        // perms[menu.perm] directly (shared across every project, not
        // b-quest-aware), so it needs a flat lookup.
        const godPerms = { _god: true, permissions: ['setting', 'member', 'dashboard'], roles, setting: true, member: true, assign: true, dashboard: true };
        sessionStorage.setItem('bx_perms_bquest', JSON.stringify(godPerms));
        return godPerms;
    }

    const cached = sessionStorage.getItem('bx_perms_bquest');
    if (cached) return JSON.parse(cached);

    const [{ data: member }, { data: memberRoles }] = await Promise.all([
        supabaseClient.from('b-quest-member').select('codename, permissions').eq('codename', user.codename).single(),
        supabaseClient.from('b-quest-member-role').select('role_id, new, edit, delete, accept, assign, edit_scope, delete_scope, role:"b-quest-role"(name)').eq('codename', user.codename)
    ]);

    let perms = null;
    if (member) {
        const roles = {};
        (memberRoles || []).forEach(mr => {
            if (mr.role?.name) roles[mr.role.name] = { role_id: mr.role_id, new: mr.new, edit: mr.edit, delete: mr.delete, accept: mr.accept, assign: mr.assign, edit_scope: mr.edit_scope, delete_scope: mr.delete_scope };
        });
        const permissions = member.permissions || [];
        perms = {
            permissions,
            roles,
            setting: permissions.includes('setting'),
            member: permissions.includes('member'),
            dashboard: permissions.includes('dashboard'),
            assign: Object.values(roles).some(r => r.assign)
        };
    }

    sessionStorage.setItem('bx_perms_bquest', JSON.stringify(perms));
    return perms;
}

function getBquestPerms() {
    try { return JSON.parse(sessionStorage.getItem('bx_perms_bquest')); }
    catch { return null; }
}

// action: 'new' | 'edit' | 'delete' | 'assign' (true if granted on ANY role) |
// 'setting' | 'member' | 'duplicate' | 'share' (flat member-level flags, not per-role)
const BQUEST_FLAT_PERMS = ['setting', 'member', 'duplicate', 'share'];
function canBquest(action) {
    const p = getBquestPerms();
    if (!p) return false;
    if (p._god) return true;
    if (BQUEST_FLAT_PERMS.includes(action)) return (p.permissions || []).includes(action);
    return Object.values(p.roles || {}).some(r => !!r[action]);
}

// roleName must match "b-quest-role".name exactly (e.g. 'Designer').
function canBquestEditRole(roleName, action = 'edit') {
    const p = getBquestPerms();
    if (!p) return false;
    if (p._god) return true;
    return !!p.roles?.[roleName]?.[action];
}

// Scope-aware edit/delete check for a SPECIFIC role-row on a task (as
// opposed to canBquestEditRole, which only answers "does this user have
// edit/delete on this role at all"). assign is that row's
// b-quest-task-role.assign value. 'own' scope only grants access when
// assign matches the current user — an unassigned row isn't "yours"
// either; claiming one is a separate Accept flow, not modeled here yet.
function canBquestActOnRole(roleName, assign, action) {
    const p = getBquestPerms();
    if (!p) return false;
    if (p._god) return true;
    const r = p.roles?.[roleName];
    if (!r?.[action]) return false;
    if (r[`${action}_scope`] !== 'own') return true; // 'all'
    return !!assign && assign === getBxUser()?.codename;
}

function guardBquestPage(perm) {
    if (!canBquest(perm)) window.location.replace('b-quest-list.html');
}

B_QUEST_CONFIG.getMenuPerms = loadBquestPerms;

const BQ_ROLES = ['designer', 'creative'];

function bqCalcDayLoad(tasks, role, dl, excludeId = null) {
    const dlDate = new Date(dl);
    return tasks
        .filter(t => {
            if (excludeId && t.id === excludeId) return false;
            const deadline = t[`${role}_deadline`];
            if (!deadline) return false;
            const d = t[`${role}_day`] || 1;
            const deadlineDate = new Date(deadline);
            const startDate = new Date(deadlineDate);
            startDate.setDate(startDate.getDate() - d + 1);
            return startDate <= dlDate && deadlineDate >= dlDate;
        })
        .reduce((sum, t) => sum + (Number(t[`${role}_weight`]) || 0), 0);
}

function bqSpreadWeight(tasks, role, start, end, pad) {
    const weightMap = {}, dueCount = {}, ongoingCount = {};
    tasks.forEach(t => {
        const deadline = t[`${role}_deadline`];
        if (!deadline || deadline < start || deadline > end) return;
        const weight = t[`${role}_weight`] || 0;
        const day = t[`${role}_day`] || 1;
        const deadlineDate = new Date(deadline);
        for (let i = 0; i < day; i++) {
            const dt = new Date(deadlineDate);
            dt.setDate(dt.getDate() - i);
            const ds = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
            if (ds >= start && ds <= end) {
                weightMap[ds] = (weightMap[ds] || 0) + weight;
                if (i === 0) dueCount[ds] = (dueCount[ds] || 0) + 1;
                else ongoingCount[ds] = (ongoingCount[ds] || 0) + 1;
            }
        }
    });
    return { weightMap, dueCount, ongoingCount };
}

async function handleDeleteTask(id) {
    const res = await Swal.fire({
        title: 'Delete Task?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444'
    });
    if (res.isConfirmed) {
        await supabaseClient.from('b-quest-list').delete().eq('id', id);
        location.reload();
    }
}

// Permission + menu entry ship now; what a share link actually does
// (generate a URL, copy it, etc.) is designed later.
function handleShareTask(id) {
    notify('', 'Share coming soon', 'info');
}
