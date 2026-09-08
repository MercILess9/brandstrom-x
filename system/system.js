
let supabaseClient;

function esc(s) { return (s ?? '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function safeLink(url) { if (!url) return '#'; const u = url.trim(); return (u.startsWith('http://') || u.startsWith('https://')) ? u : '#'; }

// Body scroll lock for the many custom fixed-overlay popups across the
// app (Settings, Members, assign-picker, ...) — Bootstrap's own modals
// already lock scroll via their .modal-open class, so this is only for
// everything else. Reference-counted so one overlay closing while
// another is still open (e.g. a confirm dialog over a modal) doesn't
// unlock the page underneath both.
let _scrollLockCount = 0;
function lockBodyScroll() {
    _scrollLockCount++;
    document.body.style.overflow = 'hidden';
}
function unlockBodyScroll() {
    _scrollLockCount = Math.max(0, _scrollLockCount - 1);
    if (_scrollLockCount === 0) document.body.style.overflow = '';
}

// Shared number formatting — was duplicated as ~6 slightly-different
// fmtN()/fmtAmt()/fmtGP()/fNum() functions across b-account.js,
// b-opportunity-modal.js, b-account-dashboard.html, b-opportunity-list.html,
// b-opportunity-view.html, b-finance-list.html. Neither function ever
// includes a currency symbol (฿, $, ...) — that's presentational and
// always added by the caller's own HTML/template, e.g. `${fmtMoney(n)} ฿`,
// so switching currency (or a locale needing a different one) never
// requires touching this file.
//
// _fmtNum is the shared core, not meant to be called directly — fmtMoney/
// fmtQty are the two callers actually use.
function _fmtNum(n, { decimals = 0, allowNegative = true, fallback = '—' } = {}) {
    if (n == null || n === '' || isNaN(+n)) return fallback;
    let v = +n;
    if (!allowNegative) v = Math.max(0, v);
    return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Money amounts — 2 decimals, comma-separated. Decimal count is hardcoded
// for now (per-project Setting planned later — when that's built, this is
// the one place to change, every call site updates automatically).
function fmtMoney(n) { return _fmtNum(n, { decimals: 2 }); }

// Quantities — always a whole number, never negative, never has a decimal
// point. This is a rule of the data type itself (a quantity can't be
// fractional or negative), not a per-project preference, so it's NOT
// wired to the future decimals Setting the way fmtMoney is.
function fmtQty(n) { return _fmtNum(n, { decimals: 0, allowNegative: false, fallback: '0' }); }

// Safety-net for infinite-scroll pages built on IntersectionObserver.
// Reported flakiness (Safari, intermittent) on pages combining
// IntersectionObserver with a position:sticky filter header — the
// observer occasionally stops firing after a page or two, silently
// halting pagination with no console error. This checks the trigger
// element's position directly on every scroll event as a redundant
// fallback; the caller's own guard (fetching/hasMore flags, via
// shouldLoad()) still fully controls whether a load actually happens, so
// this can never cause a duplicate fetch even when the observer is
// working fine and firing normally alongside it.
//
// Usage: setupScrollFallback(document.getElementById('load-more-trigger'), () => !isFetching && hasMore, fetchQuests);
function setupScrollFallback(triggerEl, shouldLoad, loadMore) {
    if (!triggerEl) return;
    window.addEventListener('scroll', () => {
        if (shouldLoad() && triggerEl.getBoundingClientRect().top < window.innerHeight + 300) loadMore();
    }, { passive: true });
}

if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_KEY !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ── Global SweetAlert2 theme override — every Swal.fire()/notify() call
// across the app (Auth, B-Quest, B-Account, B-Finance, System, Save Bar)
// picks this up automatically, no per-call-site changes needed. Runs at
// script-load time (not inside initLayout) so it also covers the two auth
// pages that skip the initLayout pattern (signup, reset-password).
// Shape/font/shadow use !important since no call site sets those inline.
// Button COLOR defaults deliberately don't use !important — a call that
// already passes its own confirmButtonColor (e.g. red for a delete
// confirm) sets that as an inline style, which still wins over a plain
// class rule, so existing danger-red confirms are left untouched. Icon
// colors DO use !important though: SweetAlert2's own default icon colors
// come from its bundled stylesheet at the same selector specificity
// (.swal2-icon.swal2-success etc), and whether that stylesheet is injected
// eagerly or lazily on first Swal.fire() isn't guaranteed across versions —
// !important there is what makes the retint reliable regardless of
// injection order. No call site sets a per-call iconColor today, so this
// isn't presently in tension with anything.
(function injectSwalTheme() {
    if (document.getElementById('bx-swal-theme')) return;
    const s = document.createElement('style');
    s.id = 'bx-swal-theme';
    s.textContent = `
        .swal2-container { background: rgba(15,23,42,0.45) !important; backdrop-filter: blur(4px); }
        .swal2-popup {
            position: relative !important;
            width: 400px !important;
            border-radius: 22px !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
            box-shadow: 0 30px 70px -12px rgba(0,0,0,0.28) !important;
            padding: 34px 26px 30px !important;
        }
        /* Gradient accent bar across the top, tinted to the popup's own
           icon type via :has() — the one touch that makes this read as a
           deliberately-designed piece instead of a generic system alert. */
        .swal2-popup::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px;
            border-radius: 22px 22px 0 0;
            background: linear-gradient(90deg, #475569, #64748b);
        }
        .swal2-popup:has(.swal2-icon.swal2-success)::before { background: linear-gradient(90deg, #a8b02c, #bdc432); }
        .swal2-popup:has(.swal2-icon.swal2-warning)::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
        .swal2-popup:has(.swal2-icon.swal2-error)::before   { background: linear-gradient(90deg, #dc2626, #ef4444); }
        .swal2-title { font-size: 1.5rem !important; font-weight: 800 !important; color: #1e293b !important; padding: 0 !important; margin: 14px 0 0 !important; }
        .swal2-html-container { font-size: 1rem !important; color: #64748b !important; font-weight: 500 !important; margin: 10px 0 0 !important; }

        /* Flat filled circle with a soft colored glow underneath, not a
           thin outline ring — the ring read as a dated "Windows dialog"
           style; a flat tint + ambient glow is the modern-premium version
           of the same soft-tint language every badge/avatar/chip in the
           app already uses (bqc-role-badge, am-avatar, status-chip, etc.).
           NOTE: never resize .swal2-icon itself (width/height/transform) —
           the check/x/exclamation marks inside are positioned with
           hardcoded em offsets calibrated for the default icon size, so
           resizing the container throws their alignment off. */
        .swal2-icon { border: none !important; }
        .swal2-icon.swal2-success { color: #7a8500 !important; background: #f2f4d1 !important; box-shadow: 0 12px 26px -8px rgba(189,196,50,0.55) !important; }
        .swal2-icon.swal2-success [class^='swal2-success-line'] { background-color: #7a8500 !important; }
        .swal2-icon.swal2-success .swal2-success-ring { border-color: rgba(189,196,50,0.25) !important; }
        .swal2-icon.swal2-warning { color: #b45309 !important; background: #fef3d6 !important; box-shadow: 0 12px 26px -8px rgba(245,158,11,0.5) !important; }
        .swal2-icon.swal2-error { color: #dc2626 !important; background: #fde2e2 !important; box-shadow: 0 12px 26px -8px rgba(239,68,68,0.5) !important; }
        .swal2-icon.swal2-error [class^='swal2-x-mark-line'] { background-color: #dc2626 !important; }
        .swal2-icon.swal2-info, .swal2-icon.swal2-question { color: #334155 !important; background: #e7ebf1 !important; box-shadow: 0 12px 26px -8px rgba(51,65,85,0.4) !important; }

        .swal2-actions { gap: 10px !important; margin-top: 26px !important; }
        .swal2-styled {
            border-radius: 999px !important;
            font-size: 0.95rem !important;
            font-weight: 700 !important;
            padding: 12px 30px !important;
            border: none !important;
            box-shadow: none !important;
            transition: filter 0.15s, transform 0.15s !important;
        }
        .swal2-styled:hover { transform: translateY(-1px); }
        .swal2-styled:active { transform: translateY(0); }
        .swal2-styled:focus-visible { box-shadow: 0 0 0 3px rgba(189,196,50,0.35) !important; }
        .swal2-styled.swal2-confirm { background: var(--c-dark, #1e293b); color: var(--c-accent, #bdc432); }
        .swal2-styled.swal2-confirm:hover { filter: brightness(1.3); }
        .swal2-styled.swal2-cancel { background: #f1f5f9; color: #64748b; }
        .swal2-styled.swal2-cancel:hover { background: #e2e8f0; }
        .swal2-styled.swal2-deny { background: #fee2e2; color: #ef4444; }
        .swal2-styled.swal2-deny:hover { background: #fecaca; }

        .swal2-close { color: #94a3b8 !important; border-radius: 8px !important; transition: 0.2s !important; }
        .swal2-close:hover { color: #1e293b !important; background: #f1f5f9 !important; }
        .swal2-timer-progress-bar { background: #bdc432 !important; }

        /* Future text-input popups (Swal.fire({ input: 'text', ... })) */
        .swal2-input, .swal2-textarea, .swal2-select {
            border-radius: 12px !important;
            border: 1px solid #e2e8f0 !important;
            font-size: 0.85rem !important;
            font-family: inherit !important;
            box-shadow: none !important;
        }
        .swal2-input:focus, .swal2-textarea:focus, .swal2-select:focus {
            border-color: #bdc432 !important;
            box-shadow: 0 0 0 3px rgba(189,196,50,0.15) !important;
        }
    `;
    document.head.appendChild(s);
})();

// ── BX Loader HTML (branded loading spinner — use for popups or inline placeholders) ──
function bxLoader(label) {
    return `
        <svg width="0" height="0" style="position:absolute">
            <defs>
                <linearGradient id="bx-grad" x1="0" x2="1">
                    <stop offset="0%"   stop-color="#b8d137" stop-opacity="0"/>
                    <stop offset="100%" stop-color="#b8d137" stop-opacity="1"/>
                </linearGradient>
            </defs>
        </svg>
        <style>
            .bx-loader { position:relative; width:160px; height:160px; margin:12px auto 20px; }
            .bx-loader__arc { position:absolute; inset:0; width:100%; height:100%; animation:bx-rotate 1s linear infinite; }
            .bx-loader__arc circle { fill:none; stroke:url(#bx-grad); stroke-width:6; stroke-linecap:round; stroke-dasharray:320; stroke-dashoffset:90; }
            .bx-loader__logo { position:absolute; inset:0; width:80px; height:80px; object-fit:contain; margin:auto; top:0; left:0; right:0; bottom:0; }
            @keyframes bx-rotate { to { transform: rotate(360deg); } }
            .bx-label { font-size:1.5rem; font-weight:700; color:#1e293b; margin-top:4px; text-align:center; }
        </style>
        <div class="bx-loader" role="status" aria-label="Loading">
            <svg class="bx-loader__arc" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46"/>
            </svg>
            <img class="bx-loader__logo" src="/favicon.ico" alt=""/>
        </div>
        <div class="bx-label">${label}</div>
    `;
}

function notify(title, text, icon = 'success') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: 'rgb(45, 71, 57)'
        });
    }
}


function formatDate(dateStr) {
    if (!dateStr || dateStr === '-' || dateStr === '') return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr; 
        return d.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    } catch (e) { return '-'; }
}


async function initLayout(config = {}) {
    injectAssets();

    if (!supabaseClient) {
        console.error("❌ Supabase Client not initialized");
        document.body.classList.add('auth-ready');
        return;
    }

    await initAuthGuard();
    const path = window.location.pathname.toLowerCase();
    const isAuthPage = path.includes('/auth/');
    const isIndex = path === '/' || path.endsWith('/index.html') || path.endsWith('/');

    // 3. ถ้าเป็นหน้า Auth หรือ Index ไม่ต้องโหลด Header ระบบ
    if (!isAuthPage && !isIndex && config.accessKey) {
        const allowed = await guardProjectAccess(config.accessKey);
        if (!allowed) return;
    }

    if (isAuthPage || isIndex) {
        // ล้าง permission cache ทุกครั้งที่กลับมาหน้า Index เพื่อให้ตอนเข้า project ใหม่จะ fetch ใหม่เสมอ
        if (isIndex) {
            Object.keys(sessionStorage).filter(k => k.startsWith('bx_perms_') || k === 'bx_sys_access').forEach(k => sessionStorage.removeItem(k));
        }
        document.body.classList.add('auth-ready');
        return;
    }
    await renderSystemUI(config);
}


function getBxUser() {
    try { return JSON.parse(sessionStorage.getItem('bx_user')); }
    catch { return null; }
}

async function loadUserProfile(userId) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (!error && data) {
        sessionStorage.setItem('bx_user', JSON.stringify(data));
    }
    return data;
}

async function initAuthGuard() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const path = window.location.pathname.toLowerCase();
    const isAuthPage = path.includes('/auth/');

    if (!session && !isAuthPage) {
        window.location.replace("/auth/login.html");
        return;
    }
    if (session && isAuthPage) {
        window.location.replace("/index.html");
        return;
    }

    if (session) {
        const profile = await loadUserProfile(session.user.id);
        console.log('[AuthGuard] profile:', profile, '| userId:', session.user.id);
        if (!profile) {
            console.log('[AuthGuard] No profile found — signing out');
            await supabaseClient.auth.signOut();
            sessionStorage.clear();
            window.location.replace("/auth/login.html");
            return;
        }
    }
}

async function guardProjectAccess(accessKey) {
    const user = getBxUser();
    if (!user || user.level === 'god') return true;

    let access = null;
    const cached = sessionStorage.getItem('bx_sys_access');
    if (cached) {
        access = JSON.parse(cached);
    } else {
        const { data } = await supabaseClient
            .from('setting_project')
            .select('*')
            .eq('codename', user.codename)
            .single();
        access = data || {};
        sessionStorage.setItem('bx_sys_access', JSON.stringify(access));
    }

    if (access[accessKey] !== true) {
        window.location.replace('/index.html');
        return false;
    }
    return true;
}

async function renderSystemUI(config) {
    const response = await fetch('/system/header.html');
    const headerHTML = await response.text();
    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    if (config.projectName) {
        document.getElementById('project-title').innerText = config.projectName;
    }
    if (config.version) {
        document.getElementById('project-version').innerText = 'v' + config.version;
    }

    const menuBar = document.getElementById('sys-nav-inject');
    if (config.menus && menuBar) {
        await renderSystemMenu(config);
    }

    const user = getBxUser();
    const userDisplay = document.getElementById('user-display');
    if (userDisplay) {
        userDisplay.innerText = user?.codename || user?.email || '-';
    }
    const userFullname = document.getElementById('user-fullname');
    if (userFullname) {
        userFullname.innerText = user?.full_name || '';
    }
    const userEmail = document.getElementById('user-email');
    if (userEmail) {
        userEmail.innerText = user?.email || '';
        userEmail.href = user?.email ? ('mailto:' + user.email) : '#';
    }
    const userDepartment = document.getElementById('user-department');
    if (userDepartment) {
        userDepartment.innerText = user?.department || '';
    }

    const avatarBtn = document.getElementById('profile-avatar-btn');
    const profileMenu = document.getElementById('profile-menu');
    if (avatarBtn && profileMenu) {
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!profileMenu.contains(e.target) && e.target !== avatarBtn) profileMenu.classList.remove('open');
        });
    }
}

function handleEditProfile() {
    notify('', 'Edit Profile coming soon', 'info');
}

async function renderSystemMenu(config) {
    const menuBar = document.getElementById('sys-nav-inject');
    if (!config.menus || !menuBar) return;

    let perms;
    if (typeof config.getMenuPerms === 'function') {
        perms = await config.getMenuPerms();
    } else {
        perms = null;
    }

    // vercel.json has cleanUrls:true, so the real browser pathname never
    // carries ".html" (e.g. "/b-quest/b-quest-list", not "b-quest-list.html")
    // — strip it from both sides before comparing, or this never matches on
    // any page and the active-menu underline never shows anywhere.
    const currentPath = window.location.pathname.split('/').pop().replace(/\.html$/, '');
    menuBar.innerHTML = config.menus.filter(menu => {
        if (!menu.perm) return true;
        if (!perms) return false;
        if (perms._god) return true;
        return !!perms[menu.perm];
    }).map(menu => {
        const isActive = (currentPath === menu.link.replace(/\.html$/, '')) ? 'active' : '';
        return `<a href="${menu.link}" class="sys-menu-link ${isActive}">${menu.name}</a>`;
    }).join('');
}

function injectAssets() {
const links = [
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
        "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
    ];
    links.forEach(url => {
        if (!document.querySelector(`link[href="${url}"]`)) {
            const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = url;
            document.head.appendChild(l);
        }
    });

    if (!document.querySelector('script[src*="bootstrap.bundle"]')) {
        const s = document.createElement('script');
        s.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js";
        document.head.appendChild(s);
    }

    if (!document.querySelector('#sys-core-layout')) {
        const s = document.createElement('style');
        s.id = 'sys-core-layout';
        s.innerText = `
            body {
                padding-top: 64px !important;
            }
            .flt-wrapper {
                top: 64px !important;
            }
        `;
        document.head.appendChild(s);
    }
}


async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('/auth/login.html');
    } catch (err) {
        console.error("Logout Error:", err);
    }
}