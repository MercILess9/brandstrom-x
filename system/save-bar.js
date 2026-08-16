// Shared "staged changes" floating save bar — used by any project's
// settings/config page that lets users batch up edits before committing.
// Injects its own markup + styles on first use, so a page only needs to
// load this script (no HTML/CSS duplication per project).
//
// Usage:
//   const saveBar = createSaveBar({
//       label: 'B-Quest Settings',
//       onSave: async () => { ...write staged changes to DB... },
//       onCancel: () => { ...revert local staged state... }
//   });
//   saveBar.setCount(3);   // show "3 changes pending", reveal the bar
//   saveBar.clear();       // reset to 0, hide the bar

(function () {
    let injected = false;

    function injectMarkup() {
        if (injected) return;
        injected = true;

        const style = document.createElement('style');
        style.textContent = `
            .bx-save-bar { position: fixed; bottom: -120px; left: 50%; transform: translateX(-50%);
                width: calc(100% - 48px); max-width: 640px; background: #1e293b; border-radius: 16px;
                padding: 14px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
                box-shadow: 0 8px 40px rgba(0,0,0,0.25); transition: bottom 0.4s cubic-bezier(0.34,1.56,0.64,1); z-index: 999; }
            .bx-save-bar.visible { bottom: 24px; }
            .bx-save-bar-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
            .bx-save-bar-left i { font-size: 1.3rem; color: var(--c-accent, #bdc432); flex-shrink: 0; }
            .bx-save-bar-label { font-size: 0.78rem; font-weight: 800; color: #fff; letter-spacing: 0.3px; }
            .bx-save-bar-sub { font-size: 0.72rem; color: rgba(255,255,255,0.55); margin-top: 2px; font-weight: 600; }
            .bx-save-bar-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
            .bx-btn-group { display: flex; align-items: center; gap: 8px; }
            .bx-btn-undo { width: 36px; height: 36px; padding: 0; border-radius: 50%; background: rgba(255,255,255,0.08);
                color: rgba(255,255,255,0.7); border: none; cursor: pointer; font-size: 1rem; font-family: inherit;
                display: flex; align-items: center; justify-content: center; transition: 0.15s; flex-shrink: 0; }
            .bx-btn-undo:hover:not(:disabled) { background: rgba(255,255,255,0.18); color: #fff; }
            .bx-btn-cancel { background: rgba(239,68,68,0.12); color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); border-radius: 10px;
                padding: 9px 16px; cursor: pointer; font-size: 0.82rem; font-weight: 700; font-family: inherit; transition: 0.15s;
                display: inline-flex; align-items: center; gap: 6px; }
            .bx-btn-cancel:hover:not(:disabled) { background: rgba(239,68,68,0.2); color: #fecaca; border-color: rgba(239,68,68,0.35); }
            .bx-btn-save { background: var(--c-accent, #bdc432); color: var(--c-dark, #1e293b); border: none; border-radius: 10px;
                padding: 9px 26px; cursor: pointer; font-size: 0.84rem; font-weight: 800; font-family: inherit;
                display: inline-flex; align-items: center; gap: 6px; transition: 0.15s; }
            .bx-btn-save:hover:not(:disabled) { filter: brightness(1.08); }
            .bx-btn-save:disabled, .bx-btn-cancel:disabled, .bx-btn-undo:disabled { opacity: 0.5; cursor: not-allowed; }
            @keyframes bx-save-bar-shake {
                10%, 90% { transform: translateX(calc(-50% - 1px)); }
                20%, 80% { transform: translateX(calc(-50% + 2px)); }
                30%, 50%, 70% { transform: translateX(calc(-50% - 4px)); }
                40%, 60% { transform: translateX(calc(-50% + 4px)); }
            }
            .bx-save-bar.shake { animation: bx-save-bar-shake 0.4s; }
        `;
        document.head.appendChild(style);

        const bar = document.createElement('div');
        bar.className = 'bx-save-bar';
        bar.id = 'bxSaveBar';
        bar.innerHTML = `
            <div class="bx-save-bar-left">
                <i class="bi bi-check2-circle"></i>
                <div>
                    <div class="bx-save-bar-label" id="bxSaveBarLabel"></div>
                    <div class="bx-save-bar-sub" id="bxSaveBarSub"></div>
                </div>
            </div>
            <div class="bx-save-bar-right">
                <button class="bx-btn-undo" id="bxSaveBarUndo" title="Undo last change" disabled><i class="bi bi-arrow-counterclockwise"></i></button>
                <div class="bx-btn-group">
                    <button class="bx-btn-cancel" id="bxSaveBarCancel"><i class="bi bi-x-lg"></i> Cancel</button>
                    <button class="bx-btn-save" id="bxSaveBarSave"><i class="bi bi-floppy2-fill"></i> Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(bar);
    }

    window.createSaveBar = function ({
        onSave, onCancel, onUndo, label = 'Settings', confirmCancel = true,
        guardNavigation = true, warnOnUnload = true
    } = {}) {
        injectMarkup();

        let count = 0;
        let busy = false;
        let undoAvailable = false;

        const bar = document.getElementById('bxSaveBar');
        const labelEl = document.getElementById('bxSaveBarLabel');
        const subEl = document.getElementById('bxSaveBarSub');
        const saveBtn = document.getElementById('bxSaveBarSave');
        const cancelBtn = document.getElementById('bxSaveBarCancel');
        const undoBtn = document.getElementById('bxSaveBarUndo');

        function render() {
            labelEl.textContent = label;
            subEl.textContent = count > 0 ? `${count} change${count > 1 ? 's' : ''} pending` : 'Unsaved changes';
            bar.classList.toggle('visible', count > 0);
            undoBtn.disabled = busy || !undoAvailable;
        }

        saveBtn.onclick = async () => {
            if (busy || count === 0 || !onSave) return;
            busy = true;
            saveBtn.disabled = true;
            cancelBtn.disabled = true;
            undoBtn.disabled = true;
            const original = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving...';
            try {
                await onSave();
            } finally {
                busy = false;
                saveBtn.disabled = false;
                cancelBtn.disabled = false;
                saveBtn.innerHTML = original;
                render();
            }
        };

        undoBtn.onclick = () => {
            if (busy || !undoAvailable || !onUndo) return;
            onUndo();
        };

        cancelBtn.onclick = () => {
            if (busy || count === 0) return;
            const doCancel = () => { if (onCancel) onCancel(); api.clear(); };
            if (confirmCancel && typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Discard changes?',
                    text: 'This can\'t be undone.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Discard'
                }).then(res => { if (res.isConfirmed) doCancel(); });
            } else {
                doCancel();
            }
        };

        function shake() {
            bar.classList.remove('shake');
            void bar.offsetWidth; // force reflow so the animation can restart
            bar.classList.add('shake');
        }

        // Block in-app navigation (top menu links) while changes are staged
        // — leaving the page would silently lose them. Deliberately scoped
        // to the top nav only, not every link/button on the page, so modals
        // and unrelated in-page actions (e.g. Add Member) still work.
        if (guardNavigation) {
            document.addEventListener('click', e => {
                if (count === 0) return;
                const link = e.target.closest('a.sys-menu-link, .sys-brand-zone a');
                if (!link) return;
                e.preventDefault();
                e.stopPropagation();
                shake();
            }, true);
        }

        // Refresh / close tab / type a new URL — can't preserve staged JS
        // state across that, so at least warn via the browser's native
        // "leave site?" prompt instead of silently discarding.
        if (warnOnUnload) {
            window.addEventListener('beforeunload', e => {
                if (count === 0) return;
                e.preventDefault();
                e.returnValue = '';
            });
        }

        const api = {
            setCount(n) { count = Math.max(0, n); render(); },
            markDirty(n = 1) { count += n; render(); },
            clear() { count = 0; undoAvailable = false; render(); },
            getCount() { return count; },
            setUndoAvailable(v) { undoAvailable = !!v; render(); },
            shake
        };
        render();
        return api;
    };
})();
