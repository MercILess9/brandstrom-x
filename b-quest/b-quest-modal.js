const B_QUEST_MODAL_HTML = `
<style>
    #b-quest-modal .modal-content { background: #f8fafc; border-radius: 24px; border: none; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.14); }
    .bq-modal-1000 { max-width: 1000px !important; }

    /* ── Header ── */
    .bq-modern-header { background: #fff; padding: 14px 28px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
    .bq-header-title { display: none; }
    /* Was plain Bootstrap .btn-close (no custom hover) — matches the same
       close-button recipe used everywhere else (Add Member, Column Filter). */
    .bq-modal-close { background: #f1f5f9; border: none; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #94a3b8; transition: 0.2s; flex-shrink: 0; }
    .bq-modal-close:hover { background: #e2e8f0; color: #1e293b; }

    .bq-owner-wrap { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 7px 14px 7px 8px; }
    /* Circular, matching the person-avatar convention used elsewhere
       (e.g. Add Member modal) — a rounded square here read as a generic
       icon badge rather than "this represents a person". */
    .bq-owner-icon { width: 28px; height: 28px; background: #f4f7a1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; color: #7a8500; flex-shrink: 0; }
    .bq-owner-label { font-size: 0.52rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; line-height: 1; margin-bottom: 2px; }
    .bq-owner-name { font-size: 0.82rem; font-weight: 700; color: #1e293b; line-height: 1; }

    /* ── Body ── */
    .bq-modern-body { padding: 20px 28px; }
    /* CSS alone can't cap one column's height to match a *shorter*
       sibling's natural height — stretch only pulls short content up to
       match tall content, never the other way. So the right column's
       max-height is set in JS (syncRoleColHeight, measured off the left
       glass-card once the modal is actually visible) instead of anything
       expressible here. */
    .bq-main-row { display: flex; align-items: flex-start; }
    .bq-role-col-wrap { position: relative; }
    .bq-role-col { overflow-y: auto; padding-right: 4px; }
    /* Bottom fade — only shown while there's actually more to scroll to
       (toggled via JS, not just "always on"), same idea as the horizontal
       fade edges used elsewhere in this app's carousels. */
    .bq-role-col-wrap::after { content: ''; position: absolute; left: 0; right: 4px; bottom: 0; height: 34px; background: linear-gradient(to top, #f8fafc, transparent); pointer-events: none; opacity: 0; transition: opacity 0.2s; border-radius: 0 0 6px 6px; }
    .bq-role-col-wrap.has-scroll::after { opacity: 1; }

    /* Left card */
    .bq-glass-card { background: #fff; border-radius: 18px; padding: 20px; border: 1px solid #eef2f7; height: 100%; display: flex; flex-direction: column; box-shadow: 0 2px 8px -2px rgba(0,0,0,0.04); }
    .bq-label-modern { font-size: 0.6rem; font-weight: 800; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.8px; display: block; }
    .bq-input-modern { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 12px; font-size: 0.85rem; color: #334155; margin-bottom: 10px; text-align-last: center; height: 35px; transition: 0.2s; font-family: inherit; }
    .bq-input-modern:focus { outline: none; border-color: #bdc432; background: #fff; box-shadow: 0 0 0 3px rgba(189,196,50,0.12); }
    .was-validated .bq-input-modern:invalid { border-color: #dc3545 !important; background-color: #fff8f8; }
    .bq-input-detail { flex-grow: 1; min-height: 100px; text-align: left !important; text-align-last: left !important; resize: none; padding-top: 10px; }

    /* Search button — a soft accent tint so it still reads as "clickable"
       at a glance (unlike a fully gray/quiet icon button), but restrained
       rather than the old solid lime-highlighter block — blooms into the
       full accent color with a soft glow on hover for a bit of polish. */
    .bq-search-btn { width: 44px; height: 35px; flex-shrink: 0; border: 1px solid var(--c-accent-light); border-left: none; border-radius: 0 10px 10px 0; background: var(--c-accent-light); color: #7a8500; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: 0.2s; }
    .bq-search-btn:hover { background: var(--c-accent); color: #1e293b; border-color: var(--c-accent); box-shadow: 0 4px 14px rgba(189,196,50,0.35); }

    /* ── Role Cards ── */
    .role-card { background: #fff; border-radius: 18px; border: 1.5px solid #eef2f7; margin-bottom: 16px; overflow: hidden; transition: border-color 0.25s, box-shadow 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .role-card.disabled { opacity: 0.7; background: #f8fafc; box-shadow: none; }
    .role-card.disabled .role-card-body { display: none; }

    /* Active/accent color comes from each role's own config color, set as
       an inline --role-color custom property per card (see roleCardHtml)
       — roles are admin-managed now, not a fixed Designer/Creative pair,
       so the color can't be baked into CSS by id anymore. */
    .role-card.active { border-color: var(--role-color); box-shadow: 0 4px 16px var(--role-color-15); }
    .role-card.active .role-card-header { background: var(--role-color-08); }

    .role-card-header { padding: 14px 18px; display: flex; align-items: center; gap: 10px; cursor: pointer; border-radius: 18px; transition: background 0.15s, box-shadow 0.15s; }
    .role-card:not(.active):not(.disabled) .role-card-header:hover { background: #f1f5f9; box-shadow: inset 0 -2px 0 #e2e8f0; }
    .role-card.active .role-card-header { border-radius: 18px 18px 0 0; }
    .role-card-title { font-size: 0.85rem; font-weight: 800; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 5px; line-height: 1; }
    .role-card-title i.role-icon { color: var(--role-color); }
    /* Toggle */
    .bq-role-toggle-wrap { display: flex; align-items: center; gap: 7px; flex-shrink: 0; line-height: 1; }

    .role-card-body { max-height: 0; padding: 0; overflow: hidden; transition: all 0.35s ease; visibility: hidden; opacity: 0; }
    .role-card.active .role-card-body { max-height: 450px; padding: 14px 16px 16px; border-top: 1px solid #f1f5f9; visibility: visible; opacity: 1; }

    /* Assign badge — interactive pill in role card header */
    .bq-assign-badge { display: none; align-items: center; gap: 5px; border-radius: 8px; padding: 3px 9px 3px 7px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; transition: background 0.15s, border-color 0.15s; }
    .bq-assign-badge.bq-ab-show { display: inline-flex; }
    .bq-assign-badge.bq-ab-clickable { cursor: pointer; }
    .bq-assign-badge.bq-ab-empty { background: transparent; border: 1.5px dashed #cbd5e1; color: #94a3b8; }
    .bq-assign-badge.bq-ab-empty:hover { border-color: #94a3b8; color: #64748b; }
    .bq-assign-badge:not(.bq-ab-empty) { background: var(--role-color-10); color: var(--role-color-text); border: 1px solid var(--role-color-30); }
    .bq-assign-badge.bq-ab-clickable:not(.bq-ab-empty):hover { background: var(--role-color-18); }

    /* Status select — colored per the status's own configured color (set
       inline via updateStatusUI), not a fixed progress/done pair. */
    .bq-status-select { border: 1px solid; border-radius: 20px; font-size: 0.68rem; font-weight: 700; padding: 3px 12px; min-width: 90px; text-align-last: center; height: 26px; display: none; margin-left: auto; cursor: pointer; font-family: inherit; appearance: none; -webkit-appearance: none; letter-spacing: 0.3px; transition: transform 0.15s, filter 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .bq-status-select:hover { transform: scale(1.05); filter: brightness(0.97); }

    /* ── Timeline Zone ── */
    .timeline-zone { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 14px; padding: 12px 12px 10px; height: 100%; display: flex; flex-direction: column; gap: 6px; }

    /* Capacity — progress bar display */
    .bq-cap-info { display: none; }
    .bq-cap-info.visible { display: block; }
    .bq-cap-nums { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .bq-cap-badge { font-size: 0.65rem; font-weight: 800; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 6px; padding: 2px 7px; }
    .bq-cap-badge.over { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
    .bq-cap-frac { font-size: 0.72rem; font-weight: 700; color: #64748b; }
    .bq-cap-frac.over { color: #dc2626; font-weight: 800; }
    /* flex row of two segments — overflow:hidden + the track's own
       border-radius rounds off whichever segment ends up at each edge, so
       neither segment needs its own radius. */
    .bq-cap-track { height: 4px; background: #e2e8f0; border-radius: 10px; overflow: hidden; display: flex; }
    .bq-cap-fill-existing { height: 100%; background: #94a3b8; } /* already booked by other tasks */
    .bq-cap-fill-new { height: 100%; transition: width 0.4s ease, background-color 0.3s; } /* what this save adds */
    /* Per-work daily count limit — separate rule from the role's overall
       capacity bar above (a Work item can cap how many of ITSELF land on
       the same day, regardless of whether points/capacity still have
       room). */
    .bq-cap-worklimit { display: flex; align-items: center; gap: 4px; font-size: 0.65rem; font-weight: 700; color: #64748b; margin-top: 5px; }
    .bq-cap-worklimit.over { color: #dc2626; font-weight: 800; }

    /* Toggle */
    .bq-toggle { position: relative; display: inline-block; width: 34px; height: 18px; margin: 0; vertical-align: middle; }
    .bq-toggle input { opacity: 0; width: 0; height: 0; }
    .bq-slider { position: absolute; cursor: pointer; inset: 0; background: #cbd5e1; transition: .3s; border-radius: 34px; }
    .bq-slider:before { position: absolute; content: ""; height: 12px; width: 12px; left: 3px; bottom: 3px; background: #fff; transition: .3s; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
    .role-card .bq-toggle input:checked + .bq-slider { background-color: var(--role-color); }
    input:checked + .bq-slider:before { transform: translateX(16px); }
    /* Same glow-ring hover as the identically-named .bq-toggle in Settings
       — was missing here entirely, tinted with the role's own color
       instead of the fixed brand accent since roles aren't a fixed pair. */
    .bq-toggle:hover .bq-slider { box-shadow: 0 0 0 4px rgba(0,0,0,0.06); }
    .bq-toggle:hover input:checked + .bq-slider { box-shadow: 0 0 0 4px var(--role-color-25); }

    /* Search overlay */
    .bq-search-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); z-index: 10001; display: none; align-items: center; justify-content: center; backdrop-filter: blur(6px); }
    .bq-search-card { background: #fff; width: 480px; max-height: 80vh; border-radius: 22px; padding: 22px; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.15); }
    .bq-search-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--c-border); }
    .bq-search-title { font-size: 1rem; font-weight: 800; color: var(--c-dark); margin: 0; display: flex; align-items: center; gap: 8px; }
    .bq-search-title i { color: var(--c-accent); }
    .bq-uni-search-wrap { position: relative; margin-bottom: 14px; }
    .bq-uni-search { width: 100%; border-radius: 12px; padding: 9px 34px 9px 14px; font-size: 0.85rem; border: 1px solid var(--c-border); outline: none; font-family: inherit; transition: 0.2s; background: var(--c-bg); box-sizing: border-box; }
    .bq-uni-search:focus { border-color: var(--c-accent); background: #fff; box-shadow: none; }
    .bq-uni-clear { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #cbd5e1; cursor: pointer; font-size: 0.85rem; transition: color 0.15s; }
    .bq-uni-clear:hover { color: #94a3b8; }
    /* Same row treatment as .bq-am-item below (borderless, subtle hover)
       instead of the older bordered-box-per-item look — just without the
       avatar/subtitle, since these rows are plain strings (account/
       opportunity names) with no person-like metadata to show. */
    .uni-item-modern { display: flex; align-items: center; border: none; background: none; border-radius: 12px; margin-bottom: 2px; padding: 10px 12px; font-size: 0.85rem; font-weight: 600; text-align: left; cursor: pointer; transition: background 0.15s; color: #334155; width: 100%; font-family: inherit; }
    .uni-item-modern:hover { background: var(--c-bg); color: var(--c-dark); }
    #uni-list-container { min-height: 280px; }

    /* Assign picker — same visual language as Settings' Add Member list
       (avatar circle, name + subtitle, hover highlight) instead of the
       plain text-only rows this used to be. Icon-only avatar for now,
       already shaped to drop in a real profile photo later. */
    .bq-am-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; cursor: pointer; transition: background 0.15s; border: none; background: none; width: 100%; text-align: left; font-family: inherit; }
    .bq-am-item:hover { background: var(--c-bg); }
    .bq-am-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--c-accent-light); display: flex; align-items: center; justify-content: center; font-size: 0.95rem; color: #7a8500; flex-shrink: 0; }
    .bq-am-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .bq-am-nick { font-size: 0.85rem; font-weight: 700; color: var(--c-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bq-am-line2 { font-size: 0.72rem; color: var(--c-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bq-am-dept { flex-shrink: 0; font-size: 0.65rem; font-weight: 700; color: var(--c-slate); background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 20px; padding: 3px 10px; white-space: nowrap; }
    .bq-am-empty { padding: 30px; text-align: center; color: var(--c-muted); font-size: 0.82rem; font-weight: 600; }
    .bq-am-clear .bq-am-avatar { background: #f1f5f9; color: #94a3b8; }

    /* ── Footer ── */
    .bq-footer-actions { padding: 14px 28px; display: flex; justify-content: flex-end; gap: 10px; background: #fff; border-top: 1px solid #f1f5f9; }
    .btn-bq-delete { background: #fee2e2; color: #ef4444; border: none; padding: 0 20px; border-radius: 10px; font-weight: 700; height: 40px; font-size: 0.85rem; display: none; cursor: pointer; transition: 0.2s; }
    /* Some lift for consistency with Save Changes, but no spring/scale —
       a dangerous action shouldn't feel inviting to press. */
    .btn-bq-delete:hover { background: #fecaca; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(239,68,68,0.18); }
    .btn-bq-delete:active { transform: translateY(0); box-shadow: none; transition-duration: 0.1s; }

    /* Create/Save — spring hover effect */
    .btn-bq-create { background: #1e293b; color: #bdc432; border: none; padding: 0 26px; border-radius: 10px; font-weight: 800; height: 40px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .btn-bq-create i { font-size: 0.9rem; }
    .btn-bq-create:hover { background: #0f172a; transform: translateY(-2px) scale(1.04); box-shadow: 0 8px 24px rgba(0,0,0,0.22); }
    .btn-bq-create:active { transform: translateY(0) scale(0.97); box-shadow: none; transition-duration: 0.1s; }
</style>

<div class="modal fade" id="b-quest-modal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog bq-modal-1000 modal-dialog-centered">
        <div class="modal-content">
            <div id="bq-search-overlay" class="bq-search-overlay" onclick="BQuestApp.closeSearchOverlay()">
                <div class="bq-search-card" onclick="event.stopPropagation()">
                    <div class="bq-search-header">
                        <h5 class="bq-search-title"><i class="bi bi-search" id="uni-search-icon"></i> <span id="uni-search-title">Select Data</span></h5>
                        <button type="button" class="bq-modal-close" onclick="BQuestApp.closeSearchOverlay()"><i class="bi bi-x"></i></button>
                    </div>
                    <div class="bq-uni-search-wrap">
                        <input type="text" class="bq-uni-search" id="uni-search-input" placeholder="Search...">
                        <i class="bi bi-x-circle-fill bq-uni-clear" id="uni-search-clear" style="display:none;"></i>
                    </div>
                    <div id="uni-list-container" style="overflow-y: auto; flex: 1; padding-right:5px;"></div>
                </div>
            </div>

            <div class="bq-modern-header">
                <div class="bq-owner-wrap">
                    <div class="bq-owner-icon"><i class="bi bi-person-fill"></i></div>
                    <div>
                        <div class="bq-owner-label">Owner</div>
                        <div class="bq-owner-name" id="modal-owner-display">—</div>
                    </div>
                </div>
                <div id="b-quest-modal-label-text" style="display:none;"></div>
                <button type="button" class="bq-modal-close" data-bs-dismiss="modal"><i class="bi bi-x"></i></button>
            </div>

            <form id="b-quest-modal-form" novalidate>
                <input type="hidden" id="b-quest-modal-id" name="id">
                <div class="bq-modern-body">
                    <div class="row g-4 bq-main-row">
                        <div class="col-lg-6">
                            <div class="bq-glass-card">
                                <label class="bq-label-modern">Account Name</label>
                                <div class="d-flex mb-2">
                                    <input type="text" class="bq-input-modern m-0" style="border-radius: 10px 0 0 10px; text-align-last: left;" id="b-quest-modal-account" name="account_name" required>
                                    <button type="button" class="bq-search-btn" onclick="BQuestApp.openSearchOverlay('account_name', 'b-quest-modal-account')"><i class="bi bi-search"></i></button>
                                </div>
                                <label class="bq-label-modern">Opportunity Name</label>
                                <div class="d-flex mb-2">
                                    <input type="text" class="bq-input-modern m-0" style="border-radius: 10px 0 0 10px; text-align-last: left;" id="b-quest-modal-opportunity" name="opportunity_name" required>
                                    <button type="button" class="bq-search-btn" onclick="BQuestApp.openSearchOverlay('opportunity_name', 'b-quest-modal-opportunity')"><i class="bi bi-search"></i></button>
                                </div>
                                <label class="bq-label-modern">Task Name</label>
                                <input type="text" class="bq-input-modern" style="text-align-last: left;" id="b-quest-modal-taskname" name="task_name" required>
                                <div class="row g-3 align-items-end">
                                    <div class="col-md-8">
                                        <label class="bq-label-modern">Link</label>
                                        <input type="text" class="bq-input-modern m-0" style="text-align-last: left;" id="b-quest-modal-link" name="link">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="bq-label-modern text-center d-block">Publish Date</label>
                                        <input type="date" class="bq-input-modern m-0" id="b-quest-modal-publish-date" name="publish_date" required>
                                    </div>
                                </div>
                                <label class="bq-label-modern">Detail</label>
                                <textarea class="bq-input-modern bq-input-detail m-0" id="b-quest-modal-detail" name="detail"></textarea>
                            </div>
                        </div>

                        <div class="col-lg-6 bq-role-col-wrap" id="bq-role-col-wrap">
                            <!-- Cards generated by renderRoleCards() from b-quest-role,
                                 filtered to roles this user has New on. -->
                            <div class="bq-role-col" id="role-cards-container"></div>
                        </div>
                    </div>
                </div>

                <div class="bq-footer-actions">
                    <button type="button" class="btn-bq-delete" id="btn-delete-task" onclick="handleDeleteTask(document.getElementById('b-quest-modal-id').value)"><i class="bi bi-trash3 me-1"></i> Delete</button>
                    <button type="submit" class="btn-bq-create" id="btn-submit-text">
                        <i class="bi bi-plus-circle-fill" id="btn-submit-icon"></i>
                        <span id="btn-submit-label">Create Task</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
`;

document.body.insertAdjacentHTML('beforeend', B_QUEST_MODAL_HTML);

const BQuestApp = (() => {
    // Task-level fields (account/opportunity/task name/link/date/detail/
    // owner) live on b-quest-list, same as always. Everything role-specific
    // lives in b-quest-task-role, one row per (quest_id, role_id) — no more
    // designer_*/creative_* flat columns, and no more "only these two roles
    // are actually saveable" limitation.
    const State = { capacities: {}, maxCap: {}, maxCapEffective: {}, workCounts: {}, workLimits: {}, assignProfiles: { _loaded: false }, visibleRoles: [], roleNameById: {}, typeList: [], statusList: [], defaultStatusId: null, workdayWeight: null, currentRoleRows: {}, allowAssign: false, currentData: null };
    const el = id => document.getElementById(id);
    const show = (id, condition, display = 'block') => { const e = el(id); if(e) e.style.display = condition ? display : 'none'; };

    const BQuestService = {
        async getQuestById(id) {
            const { data, error } = await supabaseClient.from('b-quest-list').select('*').eq('id', id).single();
            return error ? null : data;
        },
        async getTaskRoles(questId) {
            const { data } = await supabaseClient.from('b-quest-task-role').select('*').eq('quest_id', questId);
            return data || [];
        },
        async loadProfiles() {
            if (State.assignProfiles._loaded) return;
            // Candidates to assign work TO — only members who can Accept
            // work in that role, not everyone who merely has a row for it
            // (e.g. someone with only Edit/Delete on a role isn't
            // necessarily willing/able to take on new work in it).
            const { data: memberRoles } = await supabaseClient.from('b-quest-member-role').select('codename, role_id').eq('accept', true);
            const codenames = [...new Set((memberRoles || []).map(r => r.codename))];
            const { data: profiles } = codenames.length
                ? await supabaseClient.from('profiles').select('codename, full_name, department').in('codename', codenames)
                : { data: [] };
            const profileByCodename = Object.fromEntries((profiles || []).map(p => [p.codename, p]));
            (memberRoles || []).forEach(r => {
                if (!r.role_id) return;
                (State.assignProfiles[r.role_id] ||= []).push(profileByCodename[r.codename] || { codename: r.codename });
            });
            State.assignProfiles._loaded = true;
        },
        async loadTypes() {
            if (State.typeList.length) return;
            const { data } = await supabaseClient.from('b-quest-type').select('name').eq('active', true).order('sort_order');
            State.typeList = data || [];
        },
        async loadStatuses() {
            if (State.statusList.length) return;
            const [{ data }, { data: cfg }] = await Promise.all([
                supabaseClient.from('b-quest-status').select('id, name, color').eq('active', true).order('sort_order'),
                supabaseClient.from('b-quest-config').select('value').eq('rule', 'default_status_id').maybeSingle()
            ]);
            State.statusList = data || [];
            State.defaultStatusId = cfg?.value || null;
        },
        // Per-weekday % of a role's normal daily capacity — set in
        // Settings' Daily Capacity section. Missing/unset days default to
        // 100% (full capacity), same default the Settings page itself uses.
        async loadWorkdayWeight() {
            if (State.workdayWeight) return;
            const { data } = await supabaseClient.from('b-quest-config').select('value').eq('rule', 'workday_weight').maybeSingle();
            State.workdayWeight = { mon: 100, tue: 100, wed: 100, thu: 100, fri: 100, sat: 100, sun: 100, ...(data?.value || {}) };
        }
    };

    // Roles the current user can actually open (has New on) — a role
    // without that permission just never gets a card, not a disabled one.
    async function loadVisibleRoles() {
        // Unfiltered — a deactivated role can still be on an existing
        // task's data, and State.roleNameById has to resolve it (for the
        // delete-scope check below, and canBquestActOnRole in general) or
        // that task silently loses Edit/Delete for everyone. The active +
        // 'new'-permission filtering only applies to which roles get an
        // actual CARD in this modal (State.visibleRoles), not to the name
        // lookup itself.
        const { data } = await supabaseClient.from('b-quest-role').select('id, name, color, icon, max_capacity, active').order('sort_order');
        State.roleNameById = Object.fromEntries((data || []).map(r => [r.id, r.name]));
        State.visibleRoles = (data || []).filter(r => r.active !== false && (typeof canBquestEditRole !== 'function' || canBquestEditRole(r.name, 'new')));
        State.visibleRoles.forEach(r => { State.maxCap[r.id] = r.max_capacity ?? 10; });
    }

    // Falls back to the first (sort_order'd) status whenever the configured
    // default is unset or points at a status that's since been
    // deactivated/deleted.
    function getDefaultStatusId() {
        return State.statusList.some(s => s.id === State.defaultStatusId) ? State.defaultStatusId : State.statusList[0]?.id;
    }


    // hexToRgba() is now the shared helper in b-quest.js (loaded before this
    // file wherever it's used) — was an identical local copy here.

    // Status color used directly as text on a light tint of itself reads
    // fine for dark/saturated hues but goes nearly invisible for light ones
    // (lime, yellow, pale cyan) — same hue, just capped to a lightness that
    // stays readable, so the pill still color-codes by status.
    function readableTextColor(hex, cap = 0.3) {
        const h = (hex || '#64748b').replace('#', '');
        const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        const n = parseInt(full, 16);
        let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let hDeg = 0, s = 0; const l = (max + min) / 2;
        const d = max - min;
        if (d !== 0) {
            s = d / (1 - Math.abs(2 * l - 1));
            switch (max) {
                case r: hDeg = ((g - b) / d) % 6; break;
                case g: hDeg = (b - r) / d + 2; break;
                default: hDeg = (r - g) / d + 4;
            }
            hDeg *= 60; if (hDeg < 0) hDeg += 360;
        }
        const l2 = Math.min(l, cap); // cap lightness so text never washes out
        const c2 = (1 - Math.abs(2 * l2 - 1)) * s;
        const x2 = c2 * (1 - Math.abs((hDeg / 60) % 2 - 1));
        const m2 = l2 - c2 / 2;
        let [r2, g2, b2] = hDeg < 60 ? [c2, x2, 0] : hDeg < 120 ? [x2, c2, 0] : hDeg < 180 ? [0, c2, x2]
            : hDeg < 240 ? [0, x2, c2] : hDeg < 300 ? [x2, 0, c2] : [c2, 0, x2];
        [r2, g2, b2] = [r2, g2, b2].map(v => Math.round((v + m2) * 255));
        return `rgb(${r2},${g2},${b2})`;
    }

    function roleCardHtml(role) {
        const c = role.color || '#64748b';
        // Same fix as the Status pill's text color — a light/pastel role
        // color used directly as text on its own light tint background
        // goes nearly unreadable, so this readable (darkened) variant is
        // what actually gets used for text, while the raw color still
        // drives borders/backgrounds/the toggle.
        // Lighter cap than Status's pill (0.3) — this badge is a smaller,
        // secondary element, not a primary text-sized label, so it can
        // afford to stay closer to the role's actual color.
        const vars = `--role-color:${c}; --role-color-text:${readableTextColor(c, 0.38)}; --role-color-08:${hexToRgba(c,0.08)}; --role-color-10:${hexToRgba(c,0.1)}; --role-color-15:${hexToRgba(c,0.15)}; --role-color-18:${hexToRgba(c,0.18)}; --role-color-25:${hexToRgba(c,0.25)}; --role-color-30:${hexToRgba(c,0.3)};`;
        const defaultId = getDefaultStatusId();
        const statusOptions = State.statusList.map(s => `<option value="${s.id}" ${s.id === defaultId ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
        return `
        <div id="card-${role.id}" class="role-card" style="${vars}">
            <div class="role-card-header">
                <div class="bq-role-toggle-wrap">
                    <label class="bq-toggle"><input type="checkbox" id="check-${role.id}" onchange="BQuestApp.updateRoleUI('${role.id}')"><span class="bq-slider"></span></label>
                </div>
                <div class="role-card-title"><i class="bi ${role.icon || 'bi-person-workspace'} ms-1 me-1 role-icon"></i> ${esc(role.name)}</div>
                <span class="bq-assign-badge" id="badge-assign-${role.id}"></span>
                <select class="bq-status-select" id="b-quest-modal-${role.id}-status" onchange="BQuestApp.updateStatusUI(this)">
                    ${statusOptions}
                </select>
            </div>
            <div class="role-card-body">
                <div class="row g-3">
                    <div class="col-6">
                        <label class="bq-label-modern">Type</label><select class="bq-input-modern" id="b-quest-modal-${role.id}-type"></select>
                        <label class="bq-label-modern">Work</label><select class="bq-input-modern m-0" id="b-quest-modal-${role.id}-work"></select>
                    </div>
                    <div class="col-6">
                        <div class="timeline-zone">
                            <label class="bq-label-modern"><i class="bi bi-calendar3 me-1" style="opacity:0.5"></i>Deadline</label>
                            <input type="date" class="bq-input-modern m-0" id="b-quest-modal-${role.id}-deadline">
                            <div id="${role.id}-capacity-info" class="bq-cap-info"></div>
                        </div>
                    </div>
                </div>
                <input type="hidden" id="b-quest-modal-${role.id}-weight" value="0">
                <input type="hidden" id="b-quest-modal-${role.id}-day" value="1">
                <input type="hidden" id="b-quest-modal-${role.id}-maxperday" value="">
                <input type="hidden" id="b-quest-modal-${role.id}-assign" value="">
            </div>
        </div>`;
    }

    function renderRoleCards() {
        el('role-cards-container').innerHTML = State.visibleRoles.map(roleCardHtml).join('');
        updateRoleColFade();
    }

    // Shows the bottom fade only while there's actually something below to
    // scroll to — re-run after anything that can change the column's
    // content height (render, and a role card expanding/collapsing).
    function updateRoleColFade() {
        const scrollEl = el('role-cards-container');
        const wrap = el('bq-role-col-wrap');
        if (!scrollEl || !wrap) return;
        const hasMore = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight > 4;
        wrap.classList.toggle('has-scroll', hasMore);
    }

    // Only meaningful once the modal is actually visible — offsetHeight on
    // a display:none element (i.e. before Bootstrap's shown.bs.modal) is
    // just 0, so this can't run at the same time as openModal/renderRoleCards.
    function syncRoleColHeight() {
        const leftCol = document.querySelector('#b-quest-modal .bq-glass-card');
        const rightCol = el('role-cards-container');
        if (!leftCol || !rightCol) return;
        rightCol.style.maxHeight = leftCol.offsetHeight + 'px';
        updateRoleColFade();
    }

    function setupDropdowns(workData) {
        State.visibleRoles.forEach(role => {
            const workSelect = el(`b-quest-modal-${role.id}-work`);
            workSelect.innerHTML = '<option value="" selected disabled>Select...</option>';
            (workData || []).filter(i => i.role_id === role.id).forEach(i => {
                const opt = new Option(i.work, i.work);
                opt.dataset.weight = i.weight || 0;
                opt.dataset.day = i.day || 1;
                opt.dataset.maxPerDay = i.max_per_day ?? ''; // '' = no limit
                workSelect.appendChild(opt);
            });
            workSelect.onchange = () => {
                const selected = workSelect.options[workSelect.selectedIndex];
                el(`b-quest-modal-${role.id}-weight`).value = selected.dataset.weight;
                el(`b-quest-modal-${role.id}-day`).value = selected.dataset.day || 1;
                el(`b-quest-modal-${role.id}-maxperday`).value = selected.dataset.maxPerDay || '';
                checkCapacity(role.id);
            };

            const typeSelect = el(`b-quest-modal-${role.id}-type`);
            typeSelect.innerHTML = '<option value="" selected disabled>Select...</option>';
            State.typeList.forEach(t => typeSelect.add(new Option(t.name, t.name)));

            el(`b-quest-modal-${role.id}-deadline`).addEventListener('change', () => checkCapacity(role.id));
        });
    }

    // Only task-level fields now — role data is populated separately from
    // b-quest-task-role rows (see openModal/openDuplicateModal).
    function fillFormData(data) {
        const fields = {
            'account_name': 'b-quest-modal-account',
            'opportunity_name': 'b-quest-modal-opportunity',
            'task_name': 'b-quest-modal-taskname',
            'link': 'b-quest-modal-link',
            'publish_date': 'b-quest-modal-publish-date',
            'detail': 'b-quest-modal-detail'
        };
        for (let key in fields) {
            const element = el(fields[key]);
            if (element) element.value = data[key] || '';
        }
        if (data.owner !== undefined) el('modal-owner-display').innerText = data.owner || '—';
    }

    function fillRoleCardData(roleId, row) {
        el(`b-quest-modal-${roleId}-type`).value = row?.type || '';
        el(`b-quest-modal-${roleId}-work`).value = row?.work || '';
        el(`b-quest-modal-${roleId}-deadline`).value = row?.deadline || '';
        el(`b-quest-modal-${roleId}-weight`).value = row?.weight ?? 0;
        el(`b-quest-modal-${roleId}-day`).value = row?.day ?? 1;
        el(`b-quest-modal-${roleId}-maxperday`).value = row?.max_per_day ?? '';
        el(`b-quest-modal-${roleId}-assign`).value = row?.assign || '';
        const statusEl = el(`b-quest-modal-${roleId}-status`);
        if (row?.status_id) statusEl.value = row.status_id;
    }

    function updateStatusUI(selectEl) {
        const status = State.statusList.find(s => s.id === selectEl.value);
        const color = status?.color || '#94a3b8';
        selectEl.style.background = hexToRgba(color, 0.18);
        selectEl.style.borderColor = hexToRgba(color, 0.4);
        selectEl.style.color = readableTextColor(color);
    }

    function updateRoleUI(roleId) {
        const isChecked = el(`check-${roleId}`).checked;
        const canAssign = State.allowAssign;
        const card = el(`card-${roleId}`);
        const inputs = ['type', 'work', 'deadline'].map(s => el(`b-quest-modal-${roleId}-${s}`));

        if (isChecked) {
            card.classList.add('active'); card.classList.remove('disabled');
            inputs.forEach(input => input.required = true);
            const currentAssign = el(`b-quest-modal-${roleId}-assign`).value || '';
            refreshAssignBadge(roleId, currentAssign, canAssign);
            show(`b-quest-modal-${roleId}-status`, true);
        } else {
            card.classList.remove('active'); card.classList.add('disabled');
            inputs.forEach(input => { input.required = false; input.value = ''; });
            el(`b-quest-modal-${roleId}-weight`).value = '0';
            el(`b-quest-modal-${roleId}-assign`).value = '';

            const capEl = el(`${roleId}-capacity-info`);
            if (capEl) { capEl.className = 'bq-cap-info'; capEl.innerHTML = ''; }
            refreshAssignBadge(roleId, '', false);
            show(`b-quest-modal-${roleId}-status`, false);
        }
        // Card body expand/collapse is an animated max-height transition
        // (0.35s), so the column's scrollHeight isn't final yet on this
        // tick — check again now (covers the collapse case, height already
        // shrinking) and once more after the transition settles.
        updateRoleColFade();
        setTimeout(updateRoleColFade, 380);
    }

    function refreshAssignBadge(roleId, name, canAssign) {
        const badge = el(`badge-assign-${roleId}`);
        if (!badge) return;
        badge.className = 'bq-assign-badge';
        badge.onclick = null;

        const hasName = name && name !== '-' && name !== '';
        const role = State.visibleRoles.find(r => r.id === roleId);
        const canEditRole = role && typeof canBquestEditRole === 'function' ? canBquestEditRole(role.name) : true;

        if (canAssign && canEditRole) {
            badge.classList.add('bq-ab-show', 'bq-ab-clickable');
            badge.onclick = (e) => { e.stopPropagation(); BQuestApp.openAssignPicker(roleId); };
            if (hasName) {
                badge.innerHTML = `<i class="bi bi-person-fill" style="font-size:0.72rem"></i>${esc(name)}`;
            } else {
                badge.classList.add('bq-ab-empty');
                badge.innerHTML = `<i class="bi bi-person-plus" style="font-size:0.72rem"></i> Assign`;
            }
        } else {
            if (hasName) {
                badge.classList.add('bq-ab-show');
                badge.innerHTML = `<i class="bi bi-person-fill" style="font-size:0.72rem"></i>${esc(name)}`;
            }
        }
    }

    function setAssign(roleId, name) {
        const canAssign = typeof canBquest === 'function' ? canBquest('assign') : false;
        el(`b-quest-modal-${roleId}-assign`).value = name;
        refreshAssignBadge(roleId, name, canAssign);
    }

    // A task's Weight×Day is a total BUDGET, not "weight every day" — walk
    // backward from its own deadline spending that budget, capped per day
    // at weight × (that weekday's Daily Capacity %). A day at 0% (or a low
    // %) absorbs less than its share, so the leftover rolls further back
    // until the budget runs out — including the deadline day itself, which
    // is just the first day walked. contributionOnDate answers "how much
    // of THIS row's spread lands on targetDateStr specifically", which is
    // all capacity-checking here ever needs (see checkCapacity below).
    // guard caps the walk so a pathological config (e.g. every day at 0%)
    // can't loop forever — purely a technical safety valve, not a business
    // rule; real Weight/Day values are small enough to never approach it.
    const WEEK_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; // index = Date.getDay()
    const SPREAD_LOOKBACK_GUARD = 3650;
    function contributionOnDate(weight, day, deadlineStr, workdayWeight, targetDateStr) {
        let budget = weight * (Number(day) || 1);
        let cursor = new Date(deadlineStr + 'T00:00:00');
        const target = new Date(targetDateStr + 'T00:00:00');
        let guard = 0;
        while (budget > 1e-9 && cursor >= target && guard < SPREAD_LOOKBACK_GUARD) {
            const pct = workdayWeight[WEEK_KEYS[cursor.getDay()]] ?? 100;
            const cap = weight * (pct / 100);
            const absorb = Math.min(budget, cap);
            if (cursor.getTime() === target.getTime()) return absorb;
            budget -= absorb;
            cursor.setDate(cursor.getDate() - 1);
            guard++;
        }
        return 0;
    }

    // Role's flat max_capacity scaled by the target day's own Daily
    // Capacity % — e.g. a 10pt role on a 50% Saturday can only take 5pt
    // that day.
    function effectiveMaxCap(roleId, targetDateStr) {
        const pct = State.workdayWeight?.[WEEK_KEYS[new Date(targetDateStr + 'T00:00:00').getDay()]] ?? 100;
        return (State.maxCap[roleId] ?? 10) * (pct / 100);
    }

    async function checkCapacity(roleId) {
        const info = el(`${roleId}-capacity-info`);
        const hideInfo = () => { if (info) { info.className = 'bq-cap-info'; info.innerHTML = ''; } };

        const dl     = el(`b-quest-modal-${roleId}-deadline`).value;
        const work   = el(`b-quest-modal-${roleId}-work`).value;
        const weight = Number(el(`b-quest-modal-${roleId}-weight`).value) || 0;
        const dayVal = Number(el(`b-quest-modal-${roleId}-day`).value) || 1;

        if (!dl || !work) { hideInfo(); return; }

        try {
            const existingRow = State.currentRoleRows[roleId];
            if (existingRow && existingRow.work === work && existingRow.deadline === dl) { hideInfo(); return; }

            const currentQuestId = el('b-quest-modal-id').value || null;
            await BQuestService.loadWorkdayWeight();
            const workdayWeight = State.workdayWeight;

            // deadline < dl can never contribute (its own spread walks
            // backward from ITS OWN deadline, never forward past it) — one
            // query suffices, where the original legacy version needed two
            // ("same day" + "later deadline reaching back") only because it
            // filtered per-field instead of with a single >= comparison.
            const { data: rows } = await supabaseClient
                .from('b-quest-task-role')
                .select('quest_id, weight, day, deadline, work')
                .eq('role_id', roleId)
                .gte('deadline', dl);

            const relevant = currentQuestId ? (rows || []).filter(r => r.quest_id !== currentQuestId) : (rows || []);
            const existingTotal = relevant.reduce((sum, r) => sum + contributionOnDate(Number(r.weight) || 0, r.day, r.deadline, workdayWeight, dl), 0);
            // This task's own contribution to dl — normally just its full
            // Weight, but if dl itself lands on a low-% day even this first
            // slot gets capped, same rule as every other day in the spread.
            const newContribution = contributionOnDate(weight, dayVal, dl, workdayWeight, dl);
            const total = existingTotal + newContribution;
            const maxCap = effectiveMaxCap(roleId, dl);
            State.capacities[roleId] = total;
            State.maxCapEffective[roleId] = maxCap;

            const isOver   = total > maxCap;
            const barColor = isOver ? '#ef4444' : total >= maxCap * 0.8 ? '#f59e0b' : '#4ade80';
            const displayTotal = Math.round(total * 10) / 10;
            const displayMaxCap = Math.round(maxCap * 10) / 10; // maxCap can now be fractional (e.g. 10 x 75%)
            // Two segments instead of one flat fill — existing (gray, what
            // was already booked by other tasks) then new (colored, what
            // THIS task is adding) stacked side by side, so it's visually
            // obvious how much of the bar this save actually contributes.
            const existingPct = Math.min(100, Math.round(existingTotal / maxCap * 100));
            const newPct = Math.min(100 - existingPct, Math.round(newContribution / maxCap * 100));

            // Separate rule from the capacity bar above: how many OTHER
            // tasks with this exact Work item already land on this same
            // deadline date — a hard per-work daily ceiling, independent of
            // whether points/capacity still have room (checked only on the
            // deadline date, same as capacity above).
            const maxPerDayRaw = el(`b-quest-modal-${roleId}-maxperday`).value;
            const maxPerDay = maxPerDayRaw === '' ? null : Number(maxPerDayRaw);
            const workCount = relevant.filter(r => r.deadline === dl && r.work === work).length + 1;
            State.workCounts[roleId] = workCount;
            State.workLimits[roleId] = maxPerDay;
            const isOverWork = maxPerDay != null && workCount > maxPerDay;
            const workLimitHtml = maxPerDay != null
                ? `<div class="bq-cap-worklimit${isOverWork ? ' over' : ''}"><i class="bi bi-stack"></i> Limit Today <b>${workCount} / ${maxPerDay}</b></div>`
                : '';

            info.innerHTML = `
                <div class="bq-cap-nums">
                    <span class="bq-cap-badge${isOver ? ' over' : ''}">+${Math.round(newContribution * 10) / 10} Point</span>
                    <span class="bq-cap-frac${isOver ? ' over' : ''}">${displayTotal} / ${displayMaxCap}</span>
                </div>
                <div class="bq-cap-track">
                    <div class="bq-cap-fill-existing" style="width:${existingPct}%"></div>
                    <div class="bq-cap-fill-new" style="width:${newPct}%;background:${barColor}"></div>
                </div>
                ${workLimitHtml}`;
            info.className = 'bq-cap-info visible';
        } catch (e) { console.error(e); }
    }

    // Bumped on every call to openSearchOverlay/openAssignPicker — both
    // reuse the same #uni-search-* elements, and openSearchOverlay awaits a
    // DB fetch before wiring them up. If openAssignPicker (synchronous) is
    // invoked while that fetch is still in flight, the earlier call's
    // continuation must not overwrite what the newer call already wired —
    // otherwise the overlay ends up showing "Assign" while actually still
    // wired to search account/opportunity names (or vice versa).
    let searchOverlayToken = 0;

    // Shared by openSearchOverlay/openAssignPicker — both reuse the one
    // #uni-search-input/#uni-search-clear pair in the modal's overlay.
    function wireSearchClear(searchInput, render) {
        const clearBtn = el('uni-search-clear');
        searchInput.oninput = e => {
            clearBtn.style.display = e.target.value ? 'block' : 'none';
            render(e.target.value);
        };
        clearBtn.onclick = () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            searchInput.focus();
            render('');
        };
    }

    async function openSearchOverlay(fieldName, targetId) {
        const myToken = ++searchOverlayToken;
        const container  = el('uni-list-container');
        const searchInput = el('uni-search-input');
        el('uni-search-icon').className = 'bi bi-search';
        el('uni-search-title').textContent = fieldName.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
        show('bq-search-overlay', true, 'flex');
        container.innerHTML = '<div class="p-3 text-center text-muted">Loading...</div>';
        searchInput.value = '';
        el('uni-search-clear').style.display = 'none';

        try {
            const { data } = await supabaseClient.from('b-quest-list').select(fieldName);
            // A newer openSearchOverlay/openAssignPicker call already took
            // over the shared overlay while this fetch was in flight —
            // don't clobber whatever it wired up.
            if (myToken !== searchOverlayToken) return;
            const unique = [...new Set((data || []).map(i => i[fieldName]))].filter(n => n && n !== '-').sort((a,b) => a.localeCompare(b, 'th'));

            const render = (filterText = '') => {
                container.innerHTML = '';
                const matches = unique.filter(i => i.toLowerCase().includes(filterText.toLowerCase()));
                if (!matches.length) {
                    container.innerHTML = `<div class="bq-am-empty">${filterText ? 'No matches' : 'No data yet'}</div>`;
                    return;
                }
                matches.forEach(val => {
                    const btn = document.createElement('button');
                    btn.className = 'uni-item-modern w-100'; btn.innerText = val;
                    btn.onclick = () => { el(targetId).value = val; show('bq-search-overlay', false); };
                    container.appendChild(btn);
                });
            };
            render();
            wireSearchClear(searchInput, render);
        } catch (e) { console.error(e); }
    }

    // NOT switched over to the shared b-quest-assign-picker.js component
    // (unlike b-quest-assignment.html's own openAssignPicker, which was).
    // This version reuses the SAME #bq-search-overlay/#uni-search-input/
    // #uni-list-container elements as openSearchOverlay above (the generic
    // account/opportunity-name search), including the searchOverlayToken
    // race-guard that keeps a slow openSearchOverlay fetch from clobbering
    // this one if the user opens Assign while it's still in flight. Giving
    // this its own self-injected overlay (the shared component's whole
    // convention) would mean a second, separate overlay element instead of
    // one shared one — a real behavior/DOM change, not just deduplication —
    // so it was deliberately left as its own local copy.
    function openAssignPicker(roleId) {
        const role = State.visibleRoles.find(r => r.id === roleId);
        const canAssign = typeof canBquest === 'function' ? canBquest('assign') : false;
        const canEditRole = role && typeof canBquestEditRole === 'function' ? canBquestEditRole(role.name) : true;
        if (!canAssign || !canEditRole) return;
        searchOverlayToken++; // invalidate any in-flight openSearchOverlay fetch — see comment at its declaration
        const profiles = State.assignProfiles[roleId] || [];
        const container = el('uni-list-container');
        const searchInput = el('uni-search-input');

        el('uni-search-icon').className = 'bi bi-person-check-fill';
        el('uni-search-title').textContent = 'Assign';
        show('bq-search-overlay', true, 'flex');
        searchInput.value = '';
        el('uni-search-clear').style.display = 'none';

        const render = (filter = '') => {
            container.innerHTML = '';
            const clearBtn = document.createElement('button');
            clearBtn.className = 'bq-am-item bq-am-clear w-100';
            clearBtn.innerHTML = `
                <div class="bq-am-avatar"><i class="bi bi-x-circle"></i></div>
                <div class="bq-am-info"><span class="bq-am-nick">Unassigned</span></div>`;
            clearBtn.onclick = () => { setAssign(roleId, ''); show('bq-search-overlay', false); };
            container.appendChild(clearBtn);

            const fl = filter.toLowerCase();
            const matches = profiles.filter(p =>
                p.codename.toLowerCase().includes(fl) ||
                (p.full_name || '').toLowerCase().includes(fl) ||
                (p.department || '').toLowerCase().includes(fl)
            );
            if (!matches.length) {
                container.insertAdjacentHTML('beforeend', `<div class="bq-am-empty">${filter ? 'No matches' : 'No candidates for this role'}</div>`);
            }
            matches.forEach(p => {
                const btn = document.createElement('button');
                btn.className = 'bq-am-item w-100';
                btn.innerHTML = `
                    <div class="bq-am-avatar"><i class="bi bi-person-fill"></i></div>
                    <div class="bq-am-info">
                        <span class="bq-am-nick">${esc(p.codename)}</span>
                        ${p.full_name ? `<span class="bq-am-line2">${esc(p.full_name)}</span>` : ''}
                    </div>
                    ${p.department ? `<span class="bq-am-dept">${esc(p.department)}</span>` : ''}`;
                btn.onclick = () => { setAssign(roleId, p.codename); show('bq-search-overlay', false); };
                container.appendChild(btn);
            });
        };
        render();
        wireSearchClear(searchInput, render);
    }

    el('role-cards-container')?.addEventListener('scroll', updateRoleColFade);
    el('b-quest-modal')?.addEventListener('shown.bs.modal', syncRoleColHeight);

    return {
        async openModal(taskId = null, workData = []) {
            const form = el('b-quest-modal-form');
            form.reset(); form.classList.remove('was-validated');
            State.currentData = null;
            State.currentRoleRows = {};
            await Promise.all([loadVisibleRoles(), BQuestService.loadStatuses(), BQuestService.loadWorkdayWeight()]);
            renderRoleCards();
            await Promise.all([BQuestService.loadProfiles(), BQuestService.loadTypes()]);
            setupDropdowns(workData);

            // Not gated on taskId — a user with 'assign' can pick an
            // assignee while creating a brand-new task too, not just after
            // saving and reopening it in Edit. openAssignPicker() itself
            // already checked canBquest('assign') fresh, independent of
            // taskId; this just controls the badge's visibility/click state.
            const canAssign = typeof canBquest === 'function' && canBquest('assign');
            State.allowAssign = canAssign;

            if (taskId) {
                el('btn-submit-icon').className  = 'bi bi-floppy2-fill';
                el('btn-submit-label').textContent = 'Save Changes';

                const [data, roleRows] = await Promise.all([BQuestService.getQuestById(taskId), BQuestService.getTaskRoles(taskId)]);
                if (data) {
                    State.currentData = data;
                    State.currentRoleRows = Object.fromEntries(roleRows.map(r => [r.role_id, r]));
                    el('b-quest-modal-id').value = taskId;
                    fillFormData(data);

                    // Delete removes the whole task, roles and all — only
                    // offer it when this user's delete scope fully covers
                    // EVERY role row present, same rule as the List page's
                    // Delete button. Partial coverage means using Edit to
                    // drop just their own role instead (see submitForm).
                    const canDeleteTask = roleRows.length > 0 && typeof canBquestActOnRole === 'function'
                        && roleRows.every(r => canBquestActOnRole(State.roleNameById[r.role_id], r.assign, 'delete'));
                    show('btn-delete-task', canDeleteTask);

                    State.visibleRoles.forEach(role => {
                        const row = State.currentRoleRows[role.id];
                        const hasRoleData = !!row;
                        el(`check-${role.id}`).checked = hasRoleData;
                        updateRoleUI(role.id);

                        const statusEl = el(`b-quest-modal-${role.id}-status`);
                        if (hasRoleData) fillRoleCardData(role.id, row);
                        show(statusEl.id, hasRoleData);
                        updateStatusUI(statusEl);

                        if (hasRoleData) refreshAssignBadge(role.id, row.assign || '', canAssign);

                        const capEl = el(`${role.id}-capacity-info`);
                        if (capEl) { capEl.className = 'bq-cap-info'; capEl.innerHTML = ''; }

                        // Own/All only matters once there's existing data
                        // with a real assignee to protect — a role not yet
                        // on the task is a fresh add, gated by 'new' alone
                        // (already true, or the card wouldn't be visible).
                        const canEditRole = hasRoleData
                            ? (typeof canBquestActOnRole === 'function' ? canBquestActOnRole(role.name, row.assign, 'edit') : true)
                            : (typeof canBquestEditRole === 'function' ? canBquestEditRole(role.name) : true);
                        const card = el(`card-${role.id}`);
                        card.querySelectorAll('input, select, textarea').forEach(inp => inp.disabled = !canEditRole);
                        el(`check-${role.id}`).disabled = !canEditRole;
                        card.style.opacity = canEditRole ? '' : '0.55';
                    });
                }
            } else {
                el('btn-submit-icon').className  = 'bi bi-plus-circle-fill';
                el('btn-submit-label').textContent = 'Create Task';
                el('modal-owner-display').innerText = getBxUser()?.codename || '—';
                show('btn-delete-task', false);
                State.visibleRoles.forEach(role => {
                    el(`check-${role.id}`).checked = false;
                    updateRoleUI(role.id);
                    updateStatusUI(el(`b-quest-modal-${role.id}-status`));
                    const card = el(`card-${role.id}`);
                    card.querySelectorAll('input, select, textarea, button').forEach(inp => inp.disabled = false);
                    card.style.opacity = '';
                });
            }
            bootstrap.Modal.getOrCreateInstance(el('b-quest-modal')).show();
        },

        // Task-level fields go to b-quest-list as before. Role data now
        // goes to b-quest-task-role, one row per (quest_id, role_id):
        // update if it already existed, insert if newly enabled, delete if
        // unchecked. Works for every visible role, not just the old
        // Designer/Creative pair.
        async submitForm(e) {
            e.preventDefault();
            const form = e.target;

            if (!form.checkValidity()) { form.classList.add('was-validated'); return; }

            const currentId = el('b-quest-modal-id').value;
            const enabledRoles = State.visibleRoles.filter(r => el(`check-${r.id}`)?.checked);
            if (!enabledRoles.length) return Swal.fire('Wait!', 'Select at least one role.', 'warning');

            // status_id is NOT NULL on b-quest-task-role — if Settings has
            // zero active statuses, every role's status <select> would have
            // nothing to fall back to and the save would fail at the DB
            // instead of here. Catch it up front with a clear message.
            if (!State.statusList.length) {
                return Swal.fire('Wait!', 'No active Status found — add at least one Status in Settings first.', 'warning');
            }

            for (const role of enabledRoles) {
                const dl = el(`b-quest-modal-${role.id}-deadline`).value;
                const work = el(`b-quest-modal-${role.id}-work`).value;
                const existingRow = State.currentRoleRows[role.id];
                if (existingRow && existingRow.work === work && existingRow.deadline === dl) continue; // unchanged, already counted for capacity/work-limit
                const maxCap = State.maxCapEffective[role.id] ?? State.maxCap[role.id] ?? 10;
                if (State.capacities[role.id] > maxCap) {
                    return Swal.fire({ icon: 'error', title: 'Over Capacity', text: `Limit ${Math.round(maxCap * 10) / 10} Point per Day` });
                }
                const limit = State.workLimits[role.id];
                if (limit != null && State.workCounts[role.id] > limit) {
                    return Swal.fire({ icon: 'error', title: 'Daily Limit', text: `Limit ${limit} Work per Day` });
                }
            }

            const payload = Object.fromEntries(new FormData(form).entries());
            ['publish_date', 'detail', 'link'].forEach(f => { if (payload[f] === '') payload[f] = null; });
            // id used to be a UUID (36 chars), hence the old length check —
            // it's now the short "BQ-0001" text id (never > 10 chars), so
            // that check was silently always false, meaning every Edit
            // secretly created a brand-new duplicate task instead of
            // updating. Presence alone is the correct signal: it's only
            // ever set on the form when openModal's edit branch populates
            // it from an existing task.
            const isEdit = !!payload.id;
            if (!isEdit) { delete payload.id; payload.owner = getBxUser()?.codename || '-'; }
            payload.last_update = new Date().toISOString();

            const { data: savedTask, error: taskErr } = isEdit
                ? await supabaseClient.from('b-quest-list').update(payload).eq('id', currentId).select().single()
                : await supabaseClient.from('b-quest-list').insert([payload]).select().single();

            if (taskErr) return Swal.fire('Error', taskErr.message, 'error');
            const questId = savedTask.id;

            const canAssign = typeof canBquest === 'function' ? canBquest('assign') : false;
            const enabledIds = new Set(enabledRoles.map(r => r.id));
            const errors = [];
            let roleSaveSuccessCount = 0;

            for (const role of State.visibleRoles) {
                const existingRow = State.currentRoleRows[role.id];
                if (!enabledIds.has(role.id)) {
                    if (existingRow) {
                        const { error } = await supabaseClient.from('b-quest-task-role').delete().eq('id', existingRow.id);
                        if (error) errors.push(error.message);
                    }
                    continue;
                }

                const statusId = el(`b-quest-modal-${role.id}-status`).value || getDefaultStatusId() || null;
                const statusName = State.statusList.find(s => s.id === statusId)?.name || null;

                const rolePayload = {
                    quest_id: questId,
                    role_id: role.id,
                    role: role.name,     // kept in sync — some read paths still match on this text
                    status_id: statusId,
                    status: statusName,  // same reasoning
                    work: el(`b-quest-modal-${role.id}-work`).value || null,
                    type: el(`b-quest-modal-${role.id}-type`).value || null,
                    deadline: el(`b-quest-modal-${role.id}-deadline`).value || null,
                    weight: parseInt(el(`b-quest-modal-${role.id}-weight`).value) || 0,
                    day: el(`b-quest-modal-${role.id}-day`).value || '1',
                    max_per_day: (() => { const v = el(`b-quest-modal-${role.id}-maxperday`).value; return v === '' ? null : parseInt(v); })(),
                    assign: canAssign
                        ? (el(`b-quest-modal-${role.id}-assign`).value || null)
                        : (existingRow?.assign || null)
                };

                const { error } = existingRow
                    ? await supabaseClient.from('b-quest-task-role').update(rolePayload).eq('id', existingRow.id)
                    : await supabaseClient.from('b-quest-task-role').insert([rolePayload]);
                if (error) errors.push(error.message);
                else roleSaveSuccessCount++;
            }

            if (errors.length) {
                // New task, every single role failed to save — the task
                // row itself already exists at this point (it was created
                // first, separately), so without this it'd be left behind
                // as a permanent "no role" orphan. Roll it back instead of
                // leaving broken data — this is a best-effort compensating
                // delete, not a real DB transaction, but covers the actual
                // failure mode seen in practice (a role column missing
                // before its migration was applied).
                if (!isEdit && roleSaveSuccessCount === 0) {
                    await supabaseClient.from('b-quest-list').delete().eq('id', questId);
                    return Swal.fire('Error', 'Nothing was saved — the task was rolled back.\n' + errors.join('\n'), 'error');
                }
                return Swal.fire('Some errors occurred', errors.join('\n'), 'error');
            }
            // Used to be location.reload() — that lost the List page's
            // scroll position (back to page 0 of infinite scroll) and
            // silently swapped the user's own filters for the admin's
            // configured defaults, since a full reload re-runs initPage()
            // from scratch. Patching just this one card avoids both: the
            // rest of the page's JS state (filters, scroll, loaded pages)
            // is never touched. Falls back to reload only if some future
            // page loads this modal without defining the List page's own
            // helper.
            Swal.fire({ icon: 'success', title: 'Success!', showConfirmButton: false, timer: 1500 }).then(() => {
                bootstrap.Modal.getOrCreateInstance(el('b-quest-modal')).hide();
                if (typeof window.refreshSingleCard === 'function') window.refreshSingleCard(questId);
                else location.reload();
            });
        },

        updateRoleUI, updateStatusUI, openSearchOverlay, openAssignPicker,
        async openDuplicateModal(taskId, workData = []) {
            const form = el('b-quest-modal-form');
            form.reset(); form.classList.remove('was-validated');
            State.currentData = null;
            State.currentRoleRows = {};
            await Promise.all([loadVisibleRoles(), BQuestService.loadStatuses(), BQuestService.loadWorkdayWeight()]);
            renderRoleCards();
            await Promise.all([BQuestService.loadProfiles(), BQuestService.loadTypes()]);
            setupDropdowns(workData);

            State.allowAssign = false;

            const [data, roleRows] = await Promise.all([BQuestService.getQuestById(taskId), BQuestService.getTaskRoles(taskId)]);
            if (!data) return;

            el('b-quest-modal-id').value = '';
            el('btn-submit-icon').className  = 'bi bi-plus-circle-fill';
            el('btn-submit-label').textContent = 'Create Task';
            show('btn-delete-task', false);

            // Copy each role's data in, but drop the deadline/assign so the
            // duplicate doesn't silently inherit a stale due date or land on
            // someone else's plate — Duplicate is meant as a starting point,
            // not an exact clone of an in-flight assignment.
            const roleRowsByRole = Object.fromEntries(roleRows.map(r => [r.role_id, r]));
            State.visibleRoles.forEach(role => {
                const srcRow = roleRowsByRole[role.id];
                const hasRoleData = !!srcRow;
                el(`check-${role.id}`).checked = hasRoleData;
                updateRoleUI(role.id);

                const statusEl = el(`b-quest-modal-${role.id}-status`);
                if (hasRoleData) {
                    fillRoleCardData(role.id, { ...srcRow, deadline: '', assign: '' });
                }
                show(statusEl.id, hasRoleData);
                updateStatusUI(statusEl);

                refreshAssignBadge(role.id, '', false);

                const capEl = el(`${role.id}-capacity-info`);
                if (capEl) { capEl.className = 'bq-cap-info'; capEl.innerHTML = ''; }

                const card = el(`card-${role.id}`);
                card.querySelectorAll('input, select, textarea, button').forEach(inp => inp.disabled = false);
                card.style.opacity = '';
            });

            const dupData = {
                account_name: data.account_name,
                opportunity_name: data.opportunity_name,
                task_name: (data.task_name || '') + ' - Copy',
                link: data.link,
                publish_date: data.publish_date,
                detail: data.detail
            };
            const ownerName = getBxUser()?.codename || '—';

            bootstrap.Modal.getOrCreateInstance(el('b-quest-modal')).show();
            setTimeout(() => {
                fillFormData(dupData);
                el('modal-owner-display').innerText = ownerName;
                el('b-quest-modal-taskname').value = dupData.task_name;
            }, 50);
        },
        closeSearchOverlay: () => show('bq-search-overlay', false),
        handleDeleteTask
    };
})();

window.BQuestApp = BQuestApp;
window.openTaskModal = BQuestApp.openModal;
window.openDuplicateModal = BQuestApp.openDuplicateModal;
document.getElementById('b-quest-modal-form').addEventListener('submit', BQuestApp.submitForm);
