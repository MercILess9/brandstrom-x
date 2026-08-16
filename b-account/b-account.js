function fmtNum(n) { return n != null && !isNaN(+n) ? Number(n).toLocaleString('en-US') : '—'; }
function fmtAmt(n) { return n != null && !isNaN(+n) && +n > 0 ? Number(n).toLocaleString('en-US') + ' ฿' : '—'; }
function gpPct(gp, amt) { return (gp && amt && +amt > 0) ? (+gp / +amt * 100).toFixed(1) + '%' : null; }

const B_ACCOUNT_CONFIG = {
    projectName: "B-ACCOUNT",
    version: "1.0.4",
    accessKey: 'baccount',
    menus: [
        { name: "Account",     link: "b-account-list.html" },
        { name: "Opportunity", link: "b-opportunity-list.html" },
        { name: "Dashboard",   link: "b-account-dashboard.html" },
        { name: "Settings",    link: "b-account-settings.html", perm: "setting" },
    ]
};

async function loadBaccountPerms() {
    const user = getBxUser();
    if (!user) return null;

    if (user.level === 'god') {
        const godPerms = { ae: true, new: true, edit: true, delete: true, setting: true, _god: true };
        sessionStorage.setItem('bx_perms_baccount', JSON.stringify(godPerms));
        return godPerms;
    }

    const cached = sessionStorage.getItem('bx_perms_baccount');
    if (cached) return JSON.parse(cached);

    const { data, error } = await supabaseClient
        .from('b-account-setting')
        .select('*')
        .eq('codename', user.codename)
        .single();

    const perms = (!error && data) ? data : null;
    sessionStorage.setItem('bx_perms_baccount', JSON.stringify(perms));
    return perms;
}

function getBaccountPerms() {
    try { return JSON.parse(sessionStorage.getItem('bx_perms_baccount')); }
    catch { return null; }
}

function canBaccount(perm) {
    const p = getBaccountPerms();
    if (!p) return false;
    if (p._god) return true;
    return !!p[perm];
}

function guardBaccountPage(perm) {
    if (!canBaccount(perm)) window.location.replace('b-opportunity-list.html');
}

B_ACCOUNT_CONFIG.getMenuPerms = loadBaccountPerms;
