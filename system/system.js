
let supabaseClient;

function esc(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function safeLink(url) { if (!url) return '#'; const u = url.trim(); return (u.startsWith('http://') || u.startsWith('https://')) ? u : '#'; }

if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_KEY !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

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

    const currentPath = window.location.pathname.split('/').pop();
    menuBar.innerHTML = config.menus.filter(menu => {
        if (!menu.perm) return true;
        if (!perms) return false;
        if (perms._god) return true;
        return !!perms[menu.perm];
    }).map(menu => {
        const isActive = (currentPath === menu.link) ? 'active' : '';
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