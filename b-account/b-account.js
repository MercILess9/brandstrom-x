function fmtNum(n) { return n != null && !isNaN(+n) ? fmtMoney(n) : '—'; }
function fmtAmt(n) { return n != null && !isNaN(+n) && +n > 0 ? fmtMoney(n) + ' ฿' : '—'; }
function gpPct(gp, amt) { return (gp && amt && +amt > 0) ? (+gp / +amt * 100).toFixed(1) + '%' : null; }

const B_ACCOUNT_CONFIG = {
    projectName: "B-ACCOUNT",
    version: "2.2.2",
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
        .from('b_account_setting')
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

// Shared single-select sliding segment control — ref B-Quest's
// createRoleSegControl() in b-quest.js, generalized here since B-Account's
// use (Opportunity Status) has no per-item color like B-Quest's Role does.
// wrapId/outerId/sliderId are the scroll/outer/slider element ids;
// getButtons() returns [{value,label}], getActiveValue() the current
// value, onSelect(value) the click handler.
function createSegControl({ wrapId, outerId, sliderId, btnClass, getButtons, getActiveValue, onSelect }) {
    function currentDomValue() {
        return document.querySelector(`#${wrapId} .${btnClass}.active`)?.dataset.value || '';
    }

    function render() {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return;
        const buttons = getButtons();
        const activeValue = getActiveValue ? (getActiveValue() || '') : currentDomValue();

        wrap.querySelectorAll(`.${btnClass}`).forEach(b => b.remove());
        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.className = btnClass + (b.value === activeValue ? ' active' : '');
            btn.dataset.value = b.value;
            btn.textContent = b.label;
            btn.onclick = () => onSelect(b.value);
            wrap.appendChild(btn);
        });
        reposition();
    }

    function reposition() {
        const wrap = document.getElementById(wrapId);
        const active = wrap?.querySelector(`.${btnClass}.active`);
        const slider = document.getElementById(sliderId);
        if (!active || !slider) return;
        slider.style.left = active.offsetLeft + 'px';
        slider.style.width = active.offsetWidth + 'px';
        active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        updateFade();
    }

    function updateFade() {
        const scroll = document.getElementById(wrapId);
        const outer = document.getElementById(outerId);
        if (!scroll || !outer) return;
        outer.classList.toggle('fade-left', scroll.scrollLeft > 2);
        outer.classList.toggle('fade-right', scroll.scrollLeft + scroll.clientWidth < scroll.scrollWidth - 2);
    }

    return { render, reposition, updateFade, getValue: currentDomValue };
}

B_ACCOUNT_CONFIG.getMenuPerms = loadBaccountPerms;
