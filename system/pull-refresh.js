// Shared "pull to refresh" gesture + glow-pulse spinner — for any project's
// scrollable list page that wants a manual "check for other people's new
// data" action without a full location.reload() (which loses scroll
// position and filters). Injects its own indicator markup into a container
// you provide and its CSS once globally, same convention as save-bar.js.
// Works via touch-drag AND mouse-wheel-accumulated-at-top (a wheel has no
// physical drag distance to track), so desktop needs no separate button.
//
// Usage:
//   const ptr = createPullToRefresh({
//       container: document.getElementById('card-container'), // must be position:relative
//       track: document.getElementById('taskContainer'),      // element that visually slides down
//       onRefresh: async () => { ...your fetch + render... }
//   });
//
// The caller's `track` element also needs `position: relative; z-index: 1;`
// (or higher) in its own CSS so it visually sits above the indicator while
// sliding — see b-quest-list.html for a working #card-container/#taskContainer pair.

(function () {
    let styleInjected = false;

    function injectStyle() {
        if (styleInjected) return;
        styleInjected = true;
        const style = document.createElement('style');
        style.textContent = `
            .bx-pull-refresh-indicator { position: absolute; top: 0; left: 50%; transform: translateX(-50%) scale(0.6);
                opacity: 0; z-index: 0; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
                pointer-events: none; transition: opacity 0.15s, transform 0.15s, top 0.15s; }
            .bx-pull-refresh-glow {
                --pg-size: 34px; --pg-speed: 1.2s; --pg-color: var(--c-accent); --pg-glow: rgba(var(--c-accent-rgb), 0.45);
                width: calc(var(--pg-size) * 0.5); height: calc(var(--pg-size) * 0.5);
                border-radius: 50%; background: var(--pg-color); margin: auto;
                animation: bx-pull-refresh-pulse var(--pg-speed) ease-in-out infinite; animation-play-state: paused;
            }
            .bx-pull-refresh-indicator.spinning .bx-pull-refresh-glow { animation-play-state: running; }
            @keyframes bx-pull-refresh-pulse {
                0%, 100% { transform: scale(0.7); opacity: 0.5; box-shadow: 0 0 0 0 var(--pg-glow); }
                50% { transform: scale(1); opacity: 1; box-shadow: 0 0 10px 4px var(--pg-glow); }
            }
        `;
        document.head.appendChild(style);
    }

    window.createPullToRefresh = function ({ container, track, onRefresh, threshold = 70, minSpinMs = 1200 } = {}) {
        if (!container || !track || !onRefresh) return null;
        injectStyle();

        const indicator = document.createElement('div');
        indicator.className = 'bx-pull-refresh-indicator';
        indicator.innerHTML = '<div class="bx-pull-refresh-glow"></div>';
        container.prepend(indicator);
        const glowEl = indicator.querySelector('.bx-pull-refresh-glow');

        const THRESHOLD = threshold;
        let pulling = false, startY = 0, pullDistance = 0, refreshing = false;
        let wheelAccum = 0, wheelResetTimer = null;
        // Trackpad momentum keeps sending wheel ticks for a while after the
        // fingers actually lift. Without this, those leftover ticks land
        // right as `refreshing` flips back to false at the end of a cycle
        // and get treated as a brand-new pull gesture — pulling the cards
        // back down and re-triggering doRefresh() a second time (visible as
        // retract -> immediately pulled down again -> spin -> retract again).
        // This cooldown window after each cycle lets the momentum decay
        // before wheel/touch input is allowed to start a new pull.
        // cooldownUntil gets pushed out on every swallowed tick (see the
        // wheel handler), but that must stay CAPPED at cooldownHardStop —
        // otherwise a user trying to pull again soon after a refresh is
        // themselves generating the qualifying ticks that keep extending
        // the cooldown, which can lock pull-to-refresh out indefinitely.
        let cooldownUntil = 0, cooldownHardStop = 0;

        const atTop = () => (window.scrollY || document.documentElement.scrollTop) <= 0;

        // Drags the card list itself down by dist, revealing the indicator
        // (fixed at the top, lower z-index, uncovered as track's opaque bg
        // slides away from it) underneath — no floating overlay.
        function setPull(dist) {
            const clamped = Math.max(0, Math.min(dist, THRESHOLD * 1.4));
            track.style.transform = `translateY(${clamped}px)`;
            const progress = Math.min(1, clamped / THRESHOLD);
            indicator.style.opacity = progress;
            // No rotate() here on purpose — the glow spinner does its own
            // pulse once .spinning is active (see CSS); during the pull
            // itself it just fades/scales in, matching how iOS's own pull
            // indicator behaves.
            indicator.style.transform = `translateX(-50%) scale(${0.6 + 0.4 * progress})`;
            // Vertically center the indicator within the gap the pull is
            // actively revealing (from the top of container down to the top
            // of track, i.e. exactly `clamped` px tall) instead of a fixed
            // offset — a fixed top sat it right against the top edge once
            // the gap grew past a few px.
            indicator.style.top = Math.max(0, clamped / 2 - 19) + 'px';
        }

        function resetPull(animated = true) {
            track.style.transition = animated ? 'transform 0.25s ease' : 'none';
            indicator.style.transition = animated ? 'opacity 0.25s ease, transform 0.25s ease, top 0.25s ease' : 'none';
            setPull(0);
            if (animated) setTimeout(() => { track.style.transition = ''; indicator.style.transition = ''; }, 260);
        }

        async function doRefresh() {
            if (refreshing) return;
            refreshing = true;
            clearTimeout(wheelResetTimer);
            wheelAccum = 0;
            pulling = false;

            // Deliberately NOT moving the transform at all here (tried
            // animating a "settle" to THRESHOLD, but that added a second,
            // separate upward motion on top of resetPull()'s final one at
            // the end of the fetch — read as two rounds of the animation
            // instead of one). Just leave the cards frozen wherever the
            // last touchmove/wheel tick left them; resetPull() is the only
            // place that ever moves the transform, so there's exactly one
            // motion in the whole cycle (the retract at the very end).
            indicator.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            indicator.style.opacity = '1';
            indicator.style.transform = 'translateX(-50%) scale(1)';
            // animation-play-state:paused freezes the pulse mid-frame, not
            // at rest — so resuming it below would carry over whatever phase
            // it happened to stop at last cycle. Force a clean restart from
            // 0% every time so minSpinMs can reliably promise "one full,
            // complete breath", not a random partial one.
            glowEl.style.animation = 'none';
            void indicator.offsetWidth;
            glowEl.style.animation = '';
            indicator.classList.add('spinning');

            // Caller's fetch+render runs in parallel with a floor timer so a
            // fast response can't cut the pulse off mid-breath — floor
            // should stay >= the glow's own --pg-speed (default 1.2s) so it
            // always gets to finish one full, clean cycle before pausing.
            await Promise.all([
                onRefresh(),
                new Promise(r => setTimeout(r, minSpinMs))
            ]);

            indicator.classList.remove('spinning');
            resetPull();
            refreshing = false;
            cooldownUntil = Date.now() + 400;
            cooldownHardStop = Date.now() + 900;
        }

        document.addEventListener('touchstart', e => {
            if (!atTop() || refreshing || Date.now() < cooldownUntil) return;
            pulling = true;
            startY = e.touches[0].clientY;
            pullDistance = 0;
            track.style.transition = 'none';
        }, { passive: true });

        document.addEventListener('touchmove', e => {
            // While refreshing, a finger still dragging down at the top
            // (or momentum continuing to feed touchmove) must still be
            // swallowed here — returning without preventDefault() let the
            // browser's own scroll/bounce fight the held card position for
            // the whole spin duration, which is what actually looked jerky.
            if (refreshing) {
                const dy = e.touches[0].clientY - startY;
                if (atTop() && dy > 0) e.preventDefault();
                return;
            }
            if (!pulling) return;
            const dy = e.touches[0].clientY - startY;
            if (dy <= 0 || !atTop()) { pullDistance = 0; resetPull(false); return; }
            // Not passive here on purpose — preventDefault is the part that
            // actually stops the browser's own bounce/scroll from firing at
            // the same time as our pull (overscroll-behavior alone doesn't
            // reliably suppress Safari's elastic bounce).
            e.preventDefault();
            pullDistance = dy * 0.5; // resistance, matches native pull-to-refresh feel
            setPull(pullDistance);
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (!pulling) return;
            pulling = false;
            if (pullDistance >= THRESHOLD) doRefresh(); else resetPull();
            pullDistance = 0;
        });

        document.addEventListener('wheel', e => {
            // Same reasoning as touchmove's refreshing branch — trackpad
            // momentum keeps sending wheel ticks after the fingers lift, and
            // without preventDefault() here the browser's native scroll/
            // bounce fights the held card position for the whole spin.
            if (refreshing) {
                if (atTop() && e.deltaY < 0) e.preventDefault();
                return;
            }
            if (Date.now() < cooldownUntil) {
                // Swallow leftover momentum ticks so they can't start a new
                // pull, but still block them from bouncing the native page.
                // A fixed one-shot cooldown wasn't enough — long momentum
                // trails outlast it, so the tail end of the SAME trail was
                // still slipping through, building a small partial wheelAccum
                // that never reached THRESHOLD before decaying, then getting
                // auto-reset by wheelResetTimer — visible as a brief second
                // "round" where the indicator barely appears before closing.
                // Extending the cooldown on every swallowed tick means it
                // only truly ends once the momentum itself goes quiet.
                if (atTop() && e.deltaY < 0) e.preventDefault();
                wheelAccum = 0;
                cooldownUntil = Math.min(Date.now() + 400, cooldownHardStop);
                return;
            }
            if (!atTop() || e.deltaY >= 0) { wheelAccum = 0; return; }
            e.preventDefault(); // same reasoning as touchmove above
            track.style.transition = 'none';
            wheelAccum += -e.deltaY;
            setPull(wheelAccum);
            clearTimeout(wheelResetTimer);
            // Guarded by !refreshing too — belt-and-suspenders in case some
            // future call path schedules this without also clearing it below.
            wheelResetTimer = setTimeout(() => { if (!refreshing) { wheelAccum = 0; resetPull(); } }, 400);
            if (wheelAccum >= THRESHOLD) {
                wheelAccum = 0;
                clearTimeout(wheelResetTimer); // don't let the just-scheduled 400ms auto-reset fire mid-fetch and yank the held-down cards back up
                doRefresh();
            }
        }, { passive: false });

        return { refresh: doRefresh };
    };
})();
