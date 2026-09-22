// Shared color-picker popover — a 9-hue×6-shade "Quick Pick" swatch grid +
// a native color-wheel/hex "Custom" section, matching the app's own theme
// instead of relying on the OS/browser's native <input type="color">
// picker chrome. Same self-injecting CSS/markup convention as
// select-picker.js: no static backdrop markup needed on the host page —
// the panel is created fresh in document.body each time and removed on
// close, and it flips above the trigger instead of ever needing an
// internal scrollbar when there isn't room below.
//
// Usage:
//   <div class="cs-cp-swatch" style="background:${color}"
//        onclick="openColorPicker(this, {
//            getValue: () => color,
//            onSelect: (c) => { ...apply the pick... },
//        })"></div>
//
// closeColorPicker() is also exposed for a caller that needs to dismiss it
// from elsewhere (rare — outside-click/scroll already handle the common case).

(function () {
    let injected = false;

    const COLOR_HUES = [
        ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'], // gray
        ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b'], // red
        ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412'], // orange
        ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'], // amber
        ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534'], // green
        ['#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59'], // teal
        ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'], // blue
        ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'], // violet
        ['#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d']  // pink
    ];
    const COLOR_PALETTE = COLOR_HUES[0].map((_, shadeIdx) => COLOR_HUES.map(hue => hue[shadeIdx])).flat();
    // Exposed (read-only data, not something a caller should ever need to
    // mutate) so any page can also draw from the same palette for e.g.
    // auto-assigning a color to a new item, without keeping its own copy
    // that could drift out of sync with the picker's own grid.
    window.COLOR_HUES = COLOR_HUES;
    window.COLOR_PALETTE = COLOR_PALETTE;

    function injectStyles() {
        if (injected) return;
        injected = true;
        const style = document.createElement('style');
        style.textContent = `
            .cs-cp-panel { position: fixed; z-index: 1200; background: #fff; border: 1px solid #e2e8f0;
                border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.16); padding: 12px; box-sizing: border-box; }
            .cs-cp-label { font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 2px 2px 6px; }
            .cs-cp-grid { display: grid; grid-template-columns: repeat(9, 1fr); row-gap: 8px; column-gap: 6px; margin-bottom: 10px; }
            .cs-cp-swatch { width: 25px; height: 25px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; }
            .cs-cp-swatch.sel { border-color: #1e293b; }
            /* <input type="color">'s internal swatch is UA shadow-DOM
               content — overflow/border-radius on the input itself doesn't
               reliably clip it in every engine (same class of bug as the
               circular swatches earlier). The reliable fix is the same
               one used there: a plain wrapping DIV does the rounding +
               clipping, and the input is deliberately oversized so its
               own (possibly square) rendering gets cropped away by the
               wrapper regardless of how that engine draws it internally. */
            .cs-cp-wheel-wrap { width: 100%; height: 44px; border-radius: 10px; overflow: hidden; border: 1.5px solid #e2e8f0; box-sizing: border-box; }
            .cs-cp-wheel { display: block; -webkit-appearance: none; appearance: none; width: 120%; height: 120%; margin: -10%; border: none; cursor: pointer; background: none; padding: 0; }
            .cs-cp-wheel::-webkit-color-swatch-wrapper { padding: 0; }
            .cs-cp-wheel::-webkit-color-swatch { border: none; }
            .cs-cp-wheel::-moz-color-swatch { border: none; }
            .cs-cp-hex { width: 100%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px;
                font-size: 0.8rem; font-weight: 700; text-transform: uppercase; outline: none; font-family: inherit;
                margin-top: 8px; text-align: center; letter-spacing: 0.5px; }
            .cs-cp-hex:focus { border-color: var(--c-accent); }
            .cs-cp-hex.invalid { border-color: #ef4444; color: #ef4444; }
        `;
        document.head.appendChild(style);
    }

    let panel = null;
    let ctx = null;       // { getValue, onSelect } for whichever picker is open
    let triggerEl = null;

    function apply(c) { ctx.onSelect(c.toLowerCase()); }
    function choose(c) { apply(c); closeColorPicker(); }

    function render() {
        const current = (ctx.getValue() || '#94a3b8').toLowerCase();
        panel.innerHTML = `
            <div class="cs-cp-label">Presets</div>
            <div class="cs-cp-grid">
                ${COLOR_PALETTE.map(c => `<div class="cs-cp-swatch ${current === c ? 'sel' : ''}" style="background:${c}" data-c="${c}"></div>`).join('')}
            </div>
            <div class="cs-cp-label">Custom</div>
            <input type="color" class="cs-cp-wheel" value="${current}">
            <input type="text" class="cs-cp-hex" value="${current.toUpperCase()}" maxlength="7">
        `;
        panel.querySelectorAll('.cs-cp-swatch').forEach(el => {
            el.addEventListener('click', () => choose(el.dataset.c));
        });
        const wheel = panel.querySelector('.cs-cp-wheel');
        const hex = panel.querySelector('.cs-cp-hex');
        wheel.addEventListener('input', () => { hex.value = wheel.value.toUpperCase(); apply(wheel.value); });
        hex.addEventListener('input', () => {
            const v = hex.value;
            const valid = /^#[0-9a-fA-F]{6}$/.test(v);
            hex.classList.toggle('invalid', !valid && v.length > 0);
            if (!valid) return;
            wheel.value = v;
            apply(v);
        });
    }

    function onDocClick(e) {
        if (panel && !panel.contains(e.target) && e.target !== triggerEl) closeColorPicker();
    }
    function onScroll(e) { if (panel && !panel.contains(e.target)) closeColorPicker(); }

    window.closeColorPicker = function closeColorPicker() {
        if (!panel) return;
        panel.remove();
        panel = null;
        ctx = null;
        triggerEl = null;
        document.removeEventListener('click', onDocClick, true);
        document.removeEventListener('scroll', onScroll, true);
        if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
    };

    window.openColorPicker = function openColorPicker(trigger, { getValue, onSelect, width = 236 }) {
        injectStyles();
        if (panel) closeColorPicker();
        ctx = { getValue, onSelect };
        triggerEl = trigger;

        panel = document.createElement('div');
        panel.className = 'cs-cp-panel';
        panel.style.width = width + 'px';
        document.body.appendChild(panel);
        render();

        const r = trigger.getBoundingClientRect();
        panel.style.left = r.left + 'px';
        panel.style.top = (r.bottom + 6) + 'px';
        if (r.left + width > window.innerWidth - 12) {
            panel.style.left = Math.max(12, r.right - width) + 'px';
        }
        // Flip above the trigger instead of ever clipping/scrolling — the
        // panel's content height is fixed (54 swatches + custom section),
        // so there's always enough room on one side or the other.
        const panelRect = panel.getBoundingClientRect();
        if (panelRect.bottom > window.innerHeight - 12) {
            panel.style.top = Math.max(12, r.top - panelRect.height - 6) + 'px';
        }

        if (typeof lockBodyScroll === 'function') lockBodyScroll();
        setTimeout(() => {
            document.addEventListener('click', onDocClick, true);
            document.addEventListener('scroll', onScroll, true);
        }, 0);
    };
})();
