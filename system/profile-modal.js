// Self-injecting "Edit Profile" modal — UI PREVIEW ONLY for now, per user
// request ("ขอดูแค่ UI ก่อน... ถ้าไม่เวิคก็ลบง่ายๆ"). Nothing here writes to
// Supabase yet: no profiles.update(), no Storage upload, no auth.updateUser()
// — Save just closes the modal with a "preview only" toast. Wiring real saves
// needs a DB migration first (profiles.avatar_url column + a self-update RLS
// policy + a trigger protecting level/codename/employee_id — see the planned
// migration, not yet written/applied).
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

            <div class="pfm-footer">
                <button type="button" class="pfm-save-btn" onclick="ProfileModal.save()"><i class="bi bi-floppy2-fill"></i><span>Save</span></button>
            </div>
        </div>
    </div>
</div>
`;

if (!document.getElementById('edit-profile-modal')) {
    document.body.insertAdjacentHTML('beforeend', PROFILE_MODAL_HTML);
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

        .pfm-body { padding: 22px 24px; max-height: 70vh; overflow-y: auto; }

        .pfm-identity-row { display: flex; align-items: center; gap: 18px; padding-bottom: 18px; margin-bottom: 18px; border-bottom: 1px solid #eef2f7; }
        .pfm-avatar-wrap { position: relative; width: 92px; height: 92px; flex-shrink: 0; cursor: pointer; }
        .pfm-avatar-preview { width: 100%; height: 100%; border-radius: 50%; background: var(--c-accent-light); border: 1px solid #eef2f7; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 2.2rem; overflow: hidden; transition: opacity 0.15s; }
        .pfm-avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
        .pfm-avatar-wrap:hover .pfm-avatar-preview { opacity: 0.85; }
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
        .pfm-input-wrap { position: relative; margin-bottom: 14px; }
        .pfm-input-wrap .pfm-input { padding-right: 36px; margin-bottom: 0; }
        .pfm-pass-toggle { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; align-items: center; justify-content: center; padding: 0; line-height: 0; transition: color 0.15s; }
        .pfm-pass-toggle:hover { color: var(--c-slate, #626e7f); }

        .pfm-select-wrap { position: relative; margin-bottom: 18px; }
        .pfm-select-wrap select { position: absolute; inset: 0; opacity: 0; pointer-events: none; margin: 0; }
        .pfm-select-trigger { width: 100%; text-align: left; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 30px 5px 12px; height: 37px; font-size: 0.85rem; font-family: inherit; color: var(--c-dark, #1e293b); cursor: pointer; position: relative; transition: border-color 0.15s, background 0.15s; }
        .pfm-select-trigger.placeholder { color: #94a3b8; }
        .pfm-select-trigger::after { content: ""; position: absolute; right: 12px; top: 50%; width: 8px; height: 8px; border-right: 1.5px solid #94a3b8; border-bottom: 1.5px solid #94a3b8; transform: translateY(-65%) rotate(45deg); pointer-events: none; }
        .pfm-select-trigger:hover { border-color: #cbd5e1; }

        .pfm-section-title { display: flex; align-items: center; gap: 8px; margin: 4px 0 14px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 0.72rem; font-weight: 800; color: var(--c-slate, #626e7f); text-transform: uppercase; letter-spacing: 0.6px; }
        .pfm-section-title i { color: #c7c7cc; }

        .pfm-footer { padding: 14px 24px; display: flex; justify-content: flex-end; background: #fff; border-top: 1px solid #f1f5f9; }
        .pfm-save-btn { height: 38px; padding: 0 18px; border-radius: 10px; background: var(--c-dark, #1e293b); color: var(--c-accent, #bdc432); border: none; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 800; font-family: inherit; cursor: pointer; transition: transform 0.15s, background 0.15s; }
        .pfm-save-btn:hover { transform: translateY(-1px); background: #0f172a; }
        .pfm-save-btn:active { transform: translateY(0); }
    `;
    document.head.appendChild(style);
}

let pfmAvatarObjectUrl = null;

const ProfileModal = {
    open() {
        const user = (typeof getBxUser === 'function') ? getBxUser() : null;

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

    // Local-only preview (URL.createObjectURL) — nothing is uploaded to
    // Storage yet, that needs the Branding-style upload-on-save wiring
    // once the DB side (profiles.avatar_url column) exists.
    onAvatarFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (pfmAvatarObjectUrl) URL.revokeObjectURL(pfmAvatarObjectUrl);
        pfmAvatarObjectUrl = URL.createObjectURL(file);
        document.getElementById('pfm-avatar-preview').innerHTML = `<img src="${pfmAvatarObjectUrl}" alt="">`;
    },

    // UI preview only — see file header comment. Intentionally does not
    // touch Supabase (no .update(), no Storage, no auth.updateUser()).
    save() {
        const currentPw = document.getElementById('pfm-current-password').value;
        const newPw = document.getElementById('pfm-new-password').value;
        const confirmPw = document.getElementById('pfm-confirm-password').value;
        if (newPw && !currentPw) {
            return notify('', 'Enter your Current Password to change it', 'error');
        }
        if (newPw && newPw !== confirmPw) {
            return notify('', 'New Password and Confirm Password do not match', 'error');
        }
        notify('', 'Preview only — saving isn\'t wired up yet', 'info');
        bootstrap.Modal.getInstance(document.getElementById('edit-profile-modal'))?.hide();
    }
};

window.ProfileModal = ProfileModal;
window.openEditProfileModal = () => ProfileModal.open();
