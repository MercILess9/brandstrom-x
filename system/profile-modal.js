// Self-injecting "Edit Profile" modal. Save now does real work:
// - Full Name / Nick Name / Department: real profiles.update(), codename
//   recomputed from nick_name (same formula system/setting.html's admin
//   edit uses). Needs supabase/migrations/20260930000001_profiles_self_
//   update_rls.sql applied first (self-update RLS policy + a trigger
//   guarding employee_id/level/codename from a non-admin) — until then
//   this update silently affects 0 rows (RLS blocks it), same failure
//   mode documented in that migration's own comment.
// - Change Password: real auth.signInWithPassword() (to verify Current
//   Password) + auth.updateUser() (to actually change it) — no DB
//   migration needed for this part, Supabase Auth doesn't go through
//   profiles/RLS at all.
// - Avatar: uploads the cropped photo to the "Brandbox" Storage bucket
//   (avatars/<user.id>.jpg, upsert) and saves the public URL to
//   profiles.avatar_url. Needs supabase/migrations/20261001000001_
//   profiles_avatar_url.sql applied first (adds the column) — until then
//   the profiles.update() below fails outright (unknown column), same
//   "needs its migration applied" situation as the self-update RLS one.
//
// Follows the self-injecting convention of color-picker.js/select-picker.js:
// this file injects its OWN complete <style> (not just markup) rather than
// depending on b-quest.css's .bq-* classes — those only exist on B-Quest
// pages, and this modal is triggered from the account dropdown that's
// present on EVERY page (index.html, every project, system/setting.html),
// so it can't assume any project's own stylesheet is loaded. First attempt
// at this file reused .bq-* class names by reference and rendered
// completely unstyled everywhere outside b-quest/ — same class of bug as
// b-quest-view.html's missing-Bootstrap issue earlier this session, just
// for CSS instead of a CDN script. Visual language (spacing, radii, colors)
// is still modeled on b-quest-modal.js's own — just redefined locally under
// pfm- names.
//
// Department dropdown uses the same openSelectPicker() call shape as
// auth/signup.html's own Department field. Avatar upload slot mirrors
// system/setting.html's Branding logo-upload-slot markup, sized/rounded for
// a circular avatar instead of a wordmark.
//
// To remove this feature entirely: delete this file, delete the
// system/profile-modal.js <script> block in injectAssets() (system/
// system.js), and revert handleEditProfile() back to its old
// notify(...'coming soon'...) stub.

// Same show/hide eye icons + toggle behavior as auth/signup.html's own
// togglePass() — copied rather than shared, since signup.html isn't
// loaded alongside this file (auth pages don't call initLayout()).
const PFM_EYE_OFF_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
const PFM_EYE_ON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

const PROFILE_MODAL_HTML = `
<div class="modal fade" id="edit-profile-modal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog modal-dialog-centered pfm-dialog">
        <div class="modal-content pfm-modal-content">
            <div class="pfm-header">
                <div class="pfm-header-title"><i class="bi bi-person-circle"></i>Edit Profile</div>
                <button type="button" class="pfm-close-btn" data-bs-dismiss="modal"><i class="bi bi-x"></i></button>
            </div>

            <div class="pfm-body">
                <div id="pfm-normal-body">
                    <div class="pfm-identity-row">
                        <label class="pfm-avatar-wrap" for="pfm-avatar-file" title="Change Photo — square image recommended">
                            <div class="pfm-avatar-preview" id="pfm-avatar-preview"><i class="bi bi-person-fill"></i></div>
                            <span class="pfm-avatar-edit-badge"><i class="bi bi-camera-fill"></i></span>
                        </label>
                        <input type="file" accept="image/png,image/jpeg,image/webp" style="display:none" id="pfm-avatar-file" onchange="ProfileModal.onAvatarFileChange(event)">
                        <div class="pfm-identity-fields">
                            <label class="pfm-label">Full Name</label>
                            <input type="text" class="pfm-input" id="pfm-full-name" placeholder="Full name...">
                            <label class="pfm-label">Nick Name</label>
                            <input type="text" class="pfm-input" id="pfm-nick-name" placeholder="Nickname...">
                        </div>
                    </div>

                    <label class="pfm-label">Department</label>
                    <div class="pfm-select-wrap">
                        <select class="pfm-input" id="pfm-department"></select>
                        <button type="button" class="pfm-select-trigger placeholder" id="pfm-department-trigger" onclick="ProfileModal.openDeptPicker(this)">Select...</button>
                    </div>

                    <div class="pfm-section-title"><i class="bi bi-shield-lock"></i><span>Change Password</span></div>

                    <label class="pfm-label">Current Password</label>
                    <div class="pfm-input-wrap">
                        <input type="password" class="pfm-input" id="pfm-current-password" autocomplete="current-password">
                        <button type="button" class="pfm-pass-toggle" onclick="ProfileModal.togglePass('pfm-current-password', this)">${PFM_EYE_OFF_ICON}</button>
                    </div>

                    <label class="pfm-label">New Password</label>
                    <div class="pfm-input-wrap">
                        <input type="password" class="pfm-input" id="pfm-new-password" autocomplete="new-password">
                        <button type="button" class="pfm-pass-toggle" onclick="ProfileModal.togglePass('pfm-new-password', this)">${PFM_EYE_OFF_ICON}</button>
                    </div>

                    <label class="pfm-label">Confirm Password</label>
                    <div class="pfm-input-wrap">
                        <input type="password" class="pfm-input" id="pfm-confirm-password" autocomplete="new-password">
                        <button type="button" class="pfm-pass-toggle" onclick="ProfileModal.togglePass('pfm-confirm-password', this)">${PFM_EYE_OFF_ICON}</button>
                    </div>
                </div>

                <div id="pfm-crop-overlay" style="display:none;">
                    <div class="pfm-crop-stage"><img id="pfm-crop-image" src="" alt=""></div>
                    <div class="pfm-crop-hint">Drag to reposition, scroll to zoom</div>
                </div>
            </div>

            <div class="pfm-footer" id="pfm-footer-normal">
                <button type="button" class="pfm-save-btn" onclick="ProfileModal.save()"><i class="bi bi-floppy2-fill"></i><span>Save</span></button>
            </div>
            <div class="pfm-footer" id="pfm-footer-crop" style="display:none;">
                <button type="button" class="pfm-cancel-btn" onclick="ProfileModal.cancelCrop()">Cancel</button>
                <button type="button" class="pfm-save-btn" onclick="ProfileModal.confirmCrop()"><i class="bi bi-check-lg"></i><span>Use Photo</span></button>
            </div>
        </div>
    </div>
</div>
`;

if (!document.getElementById('edit-profile-modal')) {
    document.body.insertAdjacentHTML('beforeend', PROFILE_MODAL_HTML);
}

// Cropper.js (CDN) — lets someone reposition/zoom an oversized photo
// instead of it just getting a blind center-crop. Loaded the same
// dynamic-<link>/<script>-append way injectAssets() (system.js) loads
// Bootstrap, since this file has no <head> of its own to put a static
// tag in. onAvatarFileChange() below checks `typeof Cropper` and falls
// back to the old raw-preview behavior if the CDN fails.
if (!document.querySelector('link[href*="cropperjs"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://cdn.jsdelivr.net/npm/cropperjs@1.6.2/dist/cropper.min.css';
    document.head.appendChild(l);
}
if (!document.querySelector('script[src*="cropperjs"]')) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/cropperjs@1.6.2/dist/cropper.min.js';
    document.head.appendChild(s);
}

if (!document.getElementById('pfm-styles')) {
    const style = document.createElement('style');
    style.id = 'pfm-styles';
    style.textContent = `
        .pfm-dialog { max-width: 400px; }
        .pfm-modal-content { background: #f8fafc; border-radius: 20px; border: none; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.14); }
        .pfm-header { background: #fff; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
        .pfm-header-title { font-weight: 800; font-size: 1.02rem; color: var(--c-dark, #1e293b); }
        .pfm-header-title i { margin-right: 8px; color: var(--c-accent, #bdc432); }
        .pfm-close-btn { background: #f1f5f9; border: none; border-radius: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #94a3b8; transition: background 0.15s, color 0.15s; }
        .pfm-close-btn:hover { background: #e2e8f0; color: #1e293b; }

        .pfm-body { padding: 18px 24px; max-height: 70vh; overflow-y: auto; }

        .pfm-identity-row { display: flex; align-items: center; gap: 18px; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid #eef2f7; }
        .pfm-avatar-wrap { position: relative; width: 92px; height: 92px; flex-shrink: 0; cursor: pointer; }
        .pfm-avatar-preview { width: 100%; height: 100%; border-radius: 50%; background: var(--c-accent-light); border: 1px solid #eef2f7; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 2.2rem; overflow: hidden; transition: opacity 0.15s, box-shadow 0.2s, transform 0.2s; }
        .pfm-avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
        .pfm-avatar-wrap:hover .pfm-avatar-preview { opacity: 0.92; transform: scale(1.03); box-shadow: 0 0 0 4px var(--c-accent-light), 0 6px 20px rgba(var(--c-accent-rgb, 189, 196, 50), 0.35); }
        .pfm-avatar-initials { color: var(--c-accent-dark); font-weight: 800; font-size: 1.7rem; letter-spacing: 0.5px; }
        .pfm-avatar-edit-badge { position: absolute; bottom: -2px; right: -2px; width: 28px; height: 28px; border-radius: 50%; background: var(--c-dark, #1e293b); color: var(--c-accent, #bdc432); border: 2px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; }
        .pfm-identity-fields { flex: 1; min-width: 0; }
        .pfm-identity-fields .pfm-input { height: 28px; padding: 2px 10px; font-size: 0.8rem; margin-bottom: 8px; }
        .pfm-identity-fields .pfm-input:last-child { margin-bottom: 0; }
        .pfm-identity-fields .pfm-label { margin-bottom: 4px; }

        .pfm-label { display: block; font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; }
        .pfm-input { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 12px; font-size: 0.85rem; height: 37px; margin-bottom: 14px; font-family: inherit; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; box-sizing: border-box; }
        .pfm-input:hover { border-color: #cbd5e1; }
        .pfm-input:focus { outline: none; border-color: var(--c-accent, #bdc432); background: #fff; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb, 189,196,50), 0.12); }

        /* Ref auth/signup.html's own .input-wrapper/.password-toggle-btn —
           same show/hide-password affordance, same icon set. */
        /* margin-bottom moved from the input to the wrap itself — the input's
           own 14px margin was inflating .pfm-input-wrap's auto height (input
           is inline-block-ish, so its bottom margin counts toward the
           parent's height), which meant the toggle button's top:50% centered
           against that taller box instead of the input's own box, landing
           visibly below center. */
        .pfm-input-wrap { position: relative; margin-bottom: 12px; }
        .pfm-input-wrap:last-child { margin-bottom: 0; }
        .pfm-input-wrap .pfm-input { padding-right: 36px; margin-bottom: 0; }
        .pfm-pass-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; align-items: center; justify-content: center; padding: 0; line-height: 0; transition: color 0.15s; }
        .pfm-pass-toggle:hover { color: var(--c-slate, #626e7f); }

        .pfm-select-wrap { position: relative; margin-bottom: 14px; }
        .pfm-select-wrap select { position: absolute; inset: 0; opacity: 0; pointer-events: none; margin: 0; }
        .pfm-select-trigger { width: 100%; text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 30px 5px 12px; height: 37px; font-size: 0.85rem; font-family: inherit; color: var(--c-dark, #1e293b); cursor: pointer; position: relative; transition: border-color 0.15s, background 0.15s; }
        .pfm-select-trigger.placeholder { color: #94a3b8; }
        .pfm-select-trigger::after { content: ""; position: absolute; right: 12px; top: 50%; width: 8px; height: 8px; border-right: 1.5px solid #94a3b8; border-bottom: 1.5px solid #94a3b8; transform: translateY(-65%) rotate(45deg); pointer-events: none; }
        .pfm-select-trigger:hover { border-color: #cbd5e1; }

        .pfm-section-title { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; padding-top: 12px; border-top: 1px solid #f1f5f9; font-size: 0.72rem; font-weight: 800; color: var(--c-slate, #626e7f); text-transform: uppercase; letter-spacing: 0.6px; }
        .pfm-section-title i { color: #c7c7cc; }

        .pfm-footer { padding: 14px 24px; display: flex; align-items: center; justify-content: flex-end; gap: 8px; background: #fff; border-top: 1px solid #f1f5f9; }
        .pfm-save-btn { height: 38px; padding: 0 18px; border-radius: 10px; background: var(--c-dark, #1e293b); color: var(--c-accent, #bdc432); border: none; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 800; font-family: inherit; cursor: pointer; transition: transform 0.15s, background 0.15s; }
        .pfm-save-btn:hover { transform: translateY(-1px); background: #0f172a; }
        .pfm-save-btn:active { transform: translateY(0); }
        .pfm-cancel-btn { height: 38px; padding: 0 18px; border-radius: 10px; background: none; border: 1px solid var(--c-border, #e2e8f0); color: var(--c-slate, #626e7f); font-size: 0.85rem; font-weight: 700; font-family: inherit; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
        .pfm-cancel-btn:hover { background: var(--c-bg, #f8fafc); border-color: #cbd5e1; }

        /* Crop step — swaps in for #pfm-normal-body while picking a photo.
           Round viewport is Cropper.js's standard CSS trick: its own
           .cropper-view-box/.cropper-face get border-radius:50% so the
           visible crop area previews as a circle even though the library
           itself only knows rectangles (getCroppedCanvas() below still
           reads the square selection — the circular *avatar* mask is what
           .pfm-avatar-preview applies afterward, same as any other photo). */
        .pfm-crop-stage { width: 100%; height: 280px; background: #111; border-radius: 12px; overflow: hidden; }
        .pfm-crop-stage img { display: block; max-width: 100%; }
        .pfm-crop-stage .cropper-view-box { border-radius: 50%; outline: 1px solid var(--c-accent, #bdc432); }
        .pfm-crop-stage .cropper-face { border-radius: 50%; }
        .pfm-crop-hint { font-size: 0.72rem; color: var(--c-muted, #94a3b8); text-align: center; margin-top: 10px; }
    `;
    document.head.appendChild(style);
}

let pfmAvatarObjectUrl = null;
let pfmCropper = null;
let pfmAvatarBlob = null; // cropped (or raw, if Cropper failed to load) file pending upload on Save

// Mirrors the initials-fallback/avatar-img rendering that system.js's
// initLayout() and index.html's initIndex() each do inline for their own
// header avatar circles (profile-avatar-*/portal-avatar-*) — duplicated
// here rather than calling into either, since this modal is loaded on
// every page and can't assume which one (if either) is even present.
// Called right after a successful Save so the header reflects a new
// photo/name immediately, without needing a full page reload.
function pfmRefreshAvatarUI(user) {
    ['profile-avatar-btn', 'profile-avatar-lg', 'portal-avatar-btn', 'portal-avatar-lg'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '';
        if (user?.avatar_url) {
            const img = document.createElement('img');
            img.src = user.avatar_url;
            img.alt = '';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
            el.appendChild(img);
        } else {
            const span = document.createElement('span');
            span.className = id.startsWith('portal') ? 'portal-avatar-initials' : 'sys-avatar-initials';
            span.textContent = getInitials(user?.nick_name || user?.full_name);
            el.appendChild(span);
        }
    });
}

const ProfileModal = {
    open() {
        const user = (typeof getBxUser === 'function') ? getBxUser() : null;

        // In case the modal was closed mid-crop last time.
        this.closeCrop();
        document.getElementById('pfm-avatar-file').value = '';
        pfmAvatarBlob = null;

        document.getElementById('pfm-full-name').value = user?.full_name || '';
        document.getElementById('pfm-nick-name').value = user?.nick_name || '';

        // Reset value AND visibility state (type + icon) — a password left
        // toggled to visible on a previous open() shouldn't carry over.
        ['pfm-current-password', 'pfm-new-password', 'pfm-confirm-password'].forEach(id => {
            const input = document.getElementById(id);
            input.value = '';
            input.type = 'password';
            const toggleBtn = input.nextElementSibling;
            if (toggleBtn) toggleBtn.innerHTML = PFM_EYE_OFF_ICON;
        });

        // DOM methods (not innerHTML string-building) for both branches —
        // profile-modal.js is loaded on every page, so it can't assume a
        // page-local esc() helper exists yet (CLAUDE.md: esc() is defined
        // per-page, not in system.js) or has run before this does.
        const preview = document.getElementById('pfm-avatar-preview');
        preview.innerHTML = '';
        if (user?.avatar_url) {
            const img = document.createElement('img');
            img.src = user.avatar_url;
            img.alt = '';
            preview.appendChild(img);
        } else {
            const span = document.createElement('span');
            span.className = 'pfm-avatar-initials';
            span.textContent = getInitials(user?.nick_name || user?.full_name);
            preview.appendChild(span);
        }

        this.loadDepartments(user?.department || '');

        bootstrap.Modal.getOrCreateInstance(document.getElementById('edit-profile-modal')).show();
    },

    async loadDepartments(current) {
        const sel = document.getElementById('pfm-department');
        const trigger = document.getElementById('pfm-department-trigger');
        sel.innerHTML = '<option value="" disabled selected hidden></option>';

        const { data } = await supabaseClient.from('system_department').select('name').order('name', { ascending: true });
        (data || []).forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.name;
            opt.textContent = d.name;
            sel.appendChild(opt);
        });

        if (current) {
            sel.value = current;
            trigger.textContent = current;
            trigger.classList.remove('placeholder');
        } else {
            trigger.textContent = 'Select...';
            trigger.classList.add('placeholder');
        }
    },

    openDeptPicker(triggerBtn) {
        const sel = document.getElementById('pfm-department');
        openSelectPicker(triggerBtn, {
            // Default width (220) reads narrow next to the trigger's full
            // 352px (400px dialog - 48px .pfm-body padding) — match it.
            width: 352,
            getOptions: () => [...sel.options].filter(o => o.value !== '').map(o => ({ value: o.value, label: o.textContent })),
            getValue: () => sel.value,
            onSelect: (value) => {
                sel.value = value;
                triggerBtn.textContent = value;
                triggerBtn.classList.remove('placeholder');
            }
        });
    },

    // Same behavior as auth/signup.html's togglePass().
    togglePass(id, btn) {
        const input = document.getElementById(id);
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.innerHTML = isPass ? PFM_EYE_ON_ICON : PFM_EYE_OFF_ICON;
    },

    // Opens the crop step instead of previewing the raw file directly — a
    // blind center-crop (which is all a plain object-fit:cover circle
    // gives you) can cut off exactly the part of the photo that mattered.
    // Falls back to the old raw-preview behavior if the Cropper.js CDN
    // failed to load, same "degrade instead of break" reasoning as
    // handleEditProfile()'s own typeof guard in system.js.
    onAvatarFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (pfmAvatarObjectUrl) URL.revokeObjectURL(pfmAvatarObjectUrl);
        pfmAvatarObjectUrl = URL.createObjectURL(file);

        if (typeof Cropper === 'undefined') {
            pfmAvatarBlob = file;
            document.getElementById('pfm-avatar-preview').innerHTML = `<img src="${pfmAvatarObjectUrl}" alt="">`;
            return;
        }

        document.getElementById('pfm-normal-body').style.display = 'none';
        document.getElementById('pfm-crop-overlay').style.display = 'block';
        document.getElementById('pfm-footer-normal').style.display = 'none';
        document.getElementById('pfm-footer-crop').style.display = 'flex';

        const img = document.getElementById('pfm-crop-image');
        if (pfmCropper) { pfmCropper.destroy(); pfmCropper = null; }
        img.onload = () => {
            pfmCropper = new Cropper(img, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 1,
                background: false,
                guides: false,
                center: false,
                highlight: false,
            });
        };
        img.src = pfmAvatarObjectUrl;
    },

    confirmCrop() {
        if (!pfmCropper) return;
        pfmCropper.getCroppedCanvas({ width: 300, height: 300 }).toBlob(blob => {
            pfmAvatarBlob = blob;
            if (pfmAvatarObjectUrl) URL.revokeObjectURL(pfmAvatarObjectUrl);
            pfmAvatarObjectUrl = URL.createObjectURL(blob);
            const preview = document.getElementById('pfm-avatar-preview');
            preview.innerHTML = '';
            const img = document.createElement('img');
            img.src = pfmAvatarObjectUrl;
            img.alt = '';
            preview.appendChild(img);
            this.closeCrop();
        }, 'image/jpeg', 0.92);
    },

    // File input reset so re-picking the exact same file still fires
    // onchange next time — the browser otherwise treats an unchanged
    // selection as a no-op event.
    cancelCrop() {
        this.closeCrop();
        document.getElementById('pfm-avatar-file').value = '';
    },

    closeCrop() {
        if (pfmCropper) { pfmCropper.destroy(); pfmCropper = null; }
        document.getElementById('pfm-normal-body').style.display = '';
        document.getElementById('pfm-crop-overlay').style.display = 'none';
        document.getElementById('pfm-footer-normal').style.display = '';
        document.getElementById('pfm-footer-crop').style.display = 'none';
    },

    // Profile fields (name/nick/department/avatar) need no password and
    // save independently of any password change attempted in the same
    // Save click. A staged avatar (pfmAvatarBlob) uploads to the same
    // "Brandbox" Storage bucket system/setting.html's Branding section
    // already uses (supabase/migrations/20260922000005_system_config_
    // branding.sql — public read, authenticated write, no per-user path
    // restriction) under avatars/<user.id>.jpg — a fixed filename so
    // re-uploading never needs to know/delete a previous one, same
    // upsert:true reasoning as that migration's own logic. Needs
    // supabase/migrations/20261001000001_profiles_avatar_url.sql applied
    // (adds the avatar_url column) in addition to the self-update RLS
    // migration below.
    //
    // Password change order matches what was asked for: check New ==
    // Confirm first (cheap, no network), THEN verify Current Password is
    // actually correct (via signInWithPassword — Supabase has no
    // standalone "verify password" call, this is the standard pattern;
    // it does refresh the session to a new token as a side effect, which
    // is harmless here since it's still the same signed-in user), and
    // only then call auth.updateUser() to actually change it. A wrong
    // Current Password clears just that one field — New/Confirm are left
    // alone since they weren't the problem.
    async save() {
        const user = (typeof getBxUser === 'function') ? getBxUser() : null;
        if (!user) return;

        const fullName = document.getElementById('pfm-full-name').value.trim();
        const nickName = document.getElementById('pfm-nick-name').value.trim();
        const department = document.getElementById('pfm-department').value;
        const currentPw = document.getElementById('pfm-current-password').value;
        const newPw = document.getElementById('pfm-new-password').value;
        const confirmPw = document.getElementById('pfm-confirm-password').value;

        if (newPw) {
            if (newPw !== confirmPw) {
                return notify('', 'New Password and Confirm Password do not match', 'error');
            }
            if (!currentPw) {
                return notify('', 'Enter your Current Password to change it', 'error');
            }
        }

        const btn = document.querySelector('#pfm-footer-normal .pfm-save-btn');
        btn.disabled = true;
        let allOk = true;

        // Upload first (if a photo was staged) so the resulting public URL
        // can go into the same profiles.update() call below as everything
        // else — one row write, not two. A failed upload doesn't block the
        // other fields from saving; it just leaves avatar_url unchanged.
        let avatarUrl = user.avatar_url || null;
        if (pfmAvatarBlob) {
            const path = `avatars/${user.id}.jpg`;
            const { error: upErr } = await supabaseClient.storage.from('Brandbox').upload(path, pfmAvatarBlob, { upsert: true, contentType: 'image/jpeg' });
            if (upErr) {
                allOk = false;
                notify('', 'Could not upload photo — ' + upErr.message, 'error');
            } else {
                const { data: pub } = supabaseClient.storage.from('Brandbox').getPublicUrl(path);
                // Cache-bust — the filename is reused on every re-upload
                // (upsert), so without this the browser/CDN would keep
                // showing the old cached image at the same URL.
                avatarUrl = pub.publicUrl + '?t=' + Date.now();
            }
        }

        // Same buildCodename() formula as system/setting.html's admin
        // edit flow (nick_name + employee_id) — the DB trigger added in
        // 20260930000001_profiles_self_update_rls.sql only allows a
        // self-edit's codename to change to exactly this computed value,
        // never an arbitrary one, and the existing cascade-rename trigger
        // then propagates it everywhere else codename is stored.
        const codename = user.employee_id ? `${nickName} (${user.employee_id})` : nickName;
        const { error: profileErr } = await supabaseClient
            .from('profiles')
            .update({ full_name: fullName, nick_name: nickName, department, codename, avatar_url: avatarUrl })
            .eq('id', user.id);

        if (profileErr) {
            allOk = false;
            notify('', 'Could not save profile — ' + profileErr.message, 'error');
        } else {
            const updatedUser = { ...user, full_name: fullName, nick_name: nickName, department, codename, avatar_url: avatarUrl };
            sessionStorage.setItem('bx_user', JSON.stringify(updatedUser));
            pfmRefreshAvatarUI(updatedUser);
            pfmAvatarBlob = null;
        }

        if (newPw) {
            const { error: signInErr } = await supabaseClient.auth.signInWithPassword({ email: user.email, password: currentPw });
            if (signInErr) {
                allOk = false;
                document.getElementById('pfm-current-password').value = '';
                notify('', 'Current Password is incorrect', 'error');
            } else {
                const { error: pwErr } = await supabaseClient.auth.updateUser({ password: newPw });
                if (pwErr) {
                    allOk = false;
                    notify('', 'Could not update password — ' + pwErr.message, 'error');
                }
            }
        }

        btn.disabled = false;

        if (allOk) {
            notify('', 'Profile saved', 'success');
            bootstrap.Modal.getInstance(document.getElementById('edit-profile-modal'))?.hide();
            // Updating sessionStorage/pfmRefreshAvatarUI only fixes the
            // header/portal avatar instantly — everywhere else a page
            // fetches profiles itself (list cards, member tables, assign
            // pickers, ...) read the OLD name/photo until their own query
            // re-runs, which on a static multi-page site only happens on a
            // fresh load. A short delay lets the toast/modal-close actually
            // show before the reload cuts them off.
            setTimeout(() => window.location.reload(), 700);
        }
    }
};

window.ProfileModal = ProfileModal;
window.openEditProfileModal = () => ProfileModal.open();
