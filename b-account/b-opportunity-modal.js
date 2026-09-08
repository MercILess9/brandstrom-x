const B_OPP_MODAL_HTML = `
<style>
    /* ── Modal shell ── */
    #b-opp-modal .modal-content { background: #f8fafc; border-radius: 24px; border: none; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.15); display: flex; flex-direction: column; height: calc(100vh - 56px); max-height: calc(100vh - 56px); }
    #bopp-form { flex: 1; min-height: 0; display: flex; flex-direction: column; }
    .bopp-modal-wrap { max-width: 1200px !important; }

    /* ── Header ── */
    .bopp-header { background: #1e293b; padding: 15px 28px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .bopp-header-left { display: flex; align-items: center; gap: 10px; }
    .bopp-header-bar { width: 4px; height: 22px; background: #bdc432; border-radius: 2px; flex-shrink: 0; }
    .bopp-header-icon { color: #bdc432; font-size: 1rem; }
    .bopp-header-title { color: #fff; font-size: 0.95rem; font-weight: 800; letter-spacing: 0.2px; }
    .bopp-header-right { display: flex; align-items: center; gap: 12px; }
    .bopp-hdr-totals { display: flex; align-items: center; gap: 14px; margin-right: 4px; }
    .bopp-hdr-tbox { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
    .bopp-hdr-tval { font-size: 1.05rem; font-weight: 800; color: #fff; }
    .bopp-hdr-tval.gp { color: #bdc432; }
    .bopp-hdr-tlbl { font-size: 0.58rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: rgba(255,255,255,0.4); }
    .bopp-hdr-pct-badge { background: #bdc432; color: #1e293b; border-radius: 100px; padding: 5px 10px; font-size: 0.85rem; font-weight: 800; line-height: 1; white-space: nowrap; }
    .bopp-hdr-pct-badge:empty { display: none; }
    .bopp-hdr-lost-zone { display: none; align-items: center; gap: 12px; border: 1px solid rgba(249,115,22,0.45); border-radius: 10px; padding: 5px 14px; background: rgba(249,115,22,0.08); margin-right: 6px; }
    .bopp-hdr-lost-zone .bopp-hdr-tval { color: #f97316; }
    .bopp-hdr-lost-zone .bopp-hdr-tlbl { color: rgba(255,255,255,0.4); }
    .bopp-hdr-lost-zone .bopp-hdr-tdiv { background: rgba(249,115,22,0.3); }
    .bopp-hdr-tdiv { width: 1px; height: 26px; background: rgba(255,255,255,0.15); }
    .bopp-status-sel { border: 1.5px solid rgba(255,255,255,0.2); border-radius: 10px; background: rgba(255,255,255,0.08); color: #e2e8f0; font-size: 0.78rem; font-weight: 700; padding: 0 28px 0 12px; height: 34px; cursor: pointer; font-family: inherit; outline: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath fill='%23ffffff' d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; transition: background-color 0.2s, border-color 0.2s, color 0.2s; text-align: center; text-align-last: center; }
    .bopp-status-sel:focus { border-color: rgba(255,255,255,0.4); }
    .bopp-status-sel option { background: #1e293b; color: #e2e8f0; }



    /* ── Body ── */
    .bopp-body { padding: 18px 28px 12px; flex: 1; min-height: 0; overflow-y: auto; }

    /* ── Section cards ── */
    .bopp-card { background: #fff; border-radius: 16px; border: 1px solid #eef2f7; padding: 15px 18px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .bopp-card-hd { font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 11px; display: flex; align-items: center; gap: 6px; }
    .bopp-outer { display: grid; grid-template-columns: 70fr 30fr; gap: 14px; align-items: start; }
    .bopp-outer > .bopp-card { margin-bottom: 0; }
    .bopp-divider { height: 1px; background: #f1f5f9; margin: 12px 0; }
    .bopp-left-card { display: flex; flex-direction: column; }
    .bopp-remark-wrap { flex: 1; display: flex; flex-direction: column; }
    .bopp-remark-wrap .bq-ta { flex: 1; min-height: 80px; }
    .bopp-right-col .bopp-card { border-left: 3px solid #1e293b; }
    .bopp-irow { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .bopp-irow:last-child { margin-bottom: 0; }
    .bopp-ilbl { font-size: 0.68rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; width: 112px; flex-shrink: 0; white-space: nowrap; }
    .bopp-iinp { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 10px; font-size: 0.82rem; color: #334155; height: 32px; font-family: inherit; box-sizing: border-box; transition: 0.2s; }
    .bopp-iinp:focus { outline: none; border-color: #bdc432; background: #fff; box-shadow: 0 0 0 3px rgba(189,196,50,0.12); }
    select.bopp-iinp { text-align: center; text-align-last: center; }
    input[type=date].bopp-iinp { text-align: center; }
    .bopp-acc-wrap { position: relative; }
    .bopp-acc-wrap::after { content: '❯'; position: absolute; right: 13px; top: 50%; transform: translateY(-50%) rotate(90deg); color: #bdc432; font-size: 0.75rem; font-weight: 900; pointer-events: none; }
    #bopp-acc-name { text-align: center; border-color: #bdc432; background: #fffef5; padding-right: 30px; }
    #bopp-acc-name:hover { background: #f4f7a1; }
    #bopp-company-sel { text-align: center; text-align-last: center; }

    /* ── Grid ── */
    .bopp-row { display: flex; gap: 12px; margin-bottom: 10px; }
    .bopp-row:last-child { margin-bottom: 0; }
    .bopp-col { flex: 1; min-width: 0; }
    .bopp-col-2 { flex: 2; min-width: 0; }
    .bopp-col-3 { flex: 3; min-width: 0; }

    /* ── Inputs ── */
    .bq-lbl { font-size: 0.6rem; font-weight: 800; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.8px; display: block; }
    .bq-inp { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 12px; font-size: 0.85rem; color: #334155; height: 35px; transition: 0.2s; font-family: inherit; box-sizing: border-box; }
    .bq-inp:focus { outline: none; border-color: #bdc432; background: #fff; box-shadow: 0 0 0 3px rgba(189,196,50,0.12); }
    .bq-inp[readonly] { cursor: pointer; }
    .bq-inp[readonly]:hover { border-color: #bdc432; }
    .bq-ta { height: auto; min-height: 76px; padding: 9px 12px; resize: none; line-height: 1.6; }
    .was-validated .bq-inp:invalid,
    .was-validated .bopp-iinp:invalid,
    .bq-inp.is-invalid { border-color: #dc3545 !important; background: #fff8f8; }
    .bopp-qt-num.is-invalid { border-color: #dc3545 !important; background: #fff8f8; }
    .bopp-qt-co.is-invalid { border-color: #dc3545 !important; background: #fff8f8; }
    .bopp-item-sel.is-invalid { outline: 1px solid #dc3545; background: #fff8f8 !important; border-radius: 4px; }
    .bopp-search-btn { width: 42px; height: 35px; flex-shrink: 0; border: 1px solid #bdc432; border-left: none; border-radius: 0 10px 10px 0; background: #f4f7a1; color: #7a8500; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; transition: 0.2s; }
    .bopp-search-btn:hover { background: #bdc432; color: #1e293b; }

    /* ── QT section ── */
    .bopp-qt-lbl { font-size: 0.62rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .bopp-qt-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 10px; overflow: hidden; border-left: 3px solid #bdc432; }
    .bopp-qt-head { background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 9px 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .bopp-qt-num { border: 1.5px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 0 10px; height: 30px; font-size: 0.8rem; font-weight: 700; color: #1e293b; width: 148px; font-family: inherit; outline: none; transition: 0.2s; flex-shrink: 0; }
    .bopp-qt-num:focus { border-color: #bdc432; box-shadow: 0 0 0 2px rgba(189,196,50,0.15); }
    .bopp-qt-co { border: 1.5px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 0 10px; height: 30px; font-size: 0.8rem; font-weight: 700; color: #1e293b; outline: none; font-family: inherit; cursor: pointer; min-width: 140px; text-align: center; text-align-last: center; }
    .bopp-qt-co:focus { border-color: #bdc432; }
    .bopp-qt-totals { margin-left: auto; display: flex; align-items: center; gap: 14px; }
    .bopp-qt-tbox { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
    .bopp-qt-tval { font-size: 0.88rem; font-weight: 800; color: #1e293b; }
    .bopp-qt-tval.gp { color: #16a34a; }
    .bopp-qt-tlbl { font-size: 0.58rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #94a3b8; }
    .bopp-qt-pct-badge { background: #dcfce7; color: #16a34a; border-radius: 100px; padding: 4px 9px; font-size: 0.78rem; font-weight: 800; line-height: 1; white-space: nowrap; }
    .bopp-qt-pct-badge:empty { display: none; }
    .bopp-qt-tdiv { width: 1px; height: 26px; background: #e2e8f0; }
    .bopp-qt-rm { border: none; background: none; color: #94a3b8; cursor: pointer; padding: 4px 6px; border-radius: 6px; transition: 0.15s; display: flex; align-items: center; flex-shrink: 0; }
    .bopp-qt-rm:hover { background: #fee2e2; color: #ef4444; }

    /* ── Item table ── */
    .bopp-item-wrap { overflow-x: auto; }
    .bopp-item-tbl { width: 100%; border-collapse: collapse; min-width: 820px; font-size: 0.78rem; table-layout: fixed; }
    .bopp-item-tbl th { padding: 7px 10px; text-align: left; font-size: 0.58rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
    .bopp-item-tbl th.r, .bopp-item-tbl td.r { text-align: right; }
    .bopp-item-tbl th.c, .bopp-item-tbl td.c { text-align: center; }
    .bopp-item-tbl td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .bopp-item-tbl tr:last-child td { border-bottom: none; }
    .bopp-item-tbl tbody tr:hover td { background: #f8fafc; }
    .bopp-item-inp { width: 100%; border: none; background: transparent; font-family: inherit; font-size: 0.78rem; color: #334155; outline: none; padding: 3px 5px; border-radius: 5px; box-sizing: border-box; }
    .bopp-item-inp:focus { background: #f4f7a1; }
    .bopp-item-disc-inp { color: #ef4444; }
    .bopp-item-disc-inp::placeholder { color: #fca5a5; }
    .bopp-item-inp.r { text-align: right; }
    .bopp-item-inp[type=number] { -moz-appearance: textfield; }
    .bopp-item-inp[type=number]::-webkit-inner-spin-button { display: none; }
    .bopp-item-sel { width: 100%; border: none; background: transparent; font-family: inherit; font-size: 0.78rem; color: #334155; outline: none; cursor: pointer; text-align: center; text-align-last: center; }
    .bopp-item-sel:focus { background: #f4f7a1; }
    .bopp-item-ta { height: auto; min-height: calc(3 * 1.5em + 10px); max-height: calc(3 * 1.5em + 10px); overflow-y: auto; resize: none; vertical-align: top; padding-top: 5px; }
    .bopp-item-amt { font-size: 0.78rem; font-weight: 700; color: #1e293b; text-align: right; white-space: nowrap; }
    .bopp-item-disc { font-size: 0.78rem; color: #ef4444; text-align: right; white-space: nowrap; }
    .bopp-item-gp-val { font-size: 0.78rem; font-weight: 700; text-align: right; white-space: nowrap; }
    .bopp-item-gp-pct { font-size: 0.63rem; font-weight: 700; color: #16a34a; text-align: right; line-height: 1; margin-top: 2px; }
    .bopp-item-no { color: #94a3b8; font-size: 0.7rem; font-weight: 700; }
    .bopp-item-rm { border: none; background: none; color: #cbd5e1; cursor: pointer; padding: 2px 5px; border-radius: 4px; font-size: 0.9rem; transition: 0.15s; }
    .bopp-item-rm:hover { background: #fee2e2; color: #ef4444; }

    /* ── QT footer ── */
    .bopp-qt-foot { padding: 9px 14px; display: flex; justify-content: space-between; align-items: center; background: #fafbfc; border-top: 1px solid #f1f5f9; }
    .bopp-btn-add-item { border: 1px dashed #d1d5db; background: #fff; color: #64748b; border-radius: 8px; padding: 4px 13px; font-size: 0.73rem; font-weight: 700; cursor: pointer; transition: 0.15s; font-family: inherit; display: inline-flex; align-items: center; gap: 5px; }
    .bopp-btn-add-item:hover { border-color: #bdc432; background: #f4f7a1; color: #6b7200; }
    .bopp-btn-del-qt { border: 1px solid #fecaca; background: #fff; color: #ef4444; border-radius: 8px; padding: 4px 13px; font-size: 0.73rem; font-weight: 700; cursor: pointer; transition: 0.15s; font-family: inherit; display: inline-flex; align-items: center; gap: 5px; }
    .bopp-btn-del-qt:hover { background: #fee2e2; border-color: #ef4444; }
    .bopp-btn-dup { border: 1px solid #e2e8f0; background: #fff; color: #64748b; border-radius: 8px; padding: 4px 13px; font-size: 0.73rem; font-weight: 700; cursor: pointer; transition: 0.15s; font-family: inherit; display: inline-flex; align-items: center; gap: 5px; }
    .bopp-btn-dup:hover { border-color: #94a3b8; background: #f8fafc; }
    .bopp-btn-add-qt { width: 70%; border: 1.5px dashed #d1d5db; background: #fff; color: #94a3b8; border-radius: 10px; padding: 7px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: 0.2s; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 7px; }
    .bopp-btn-add-qt:hover { border-color: #bdc432; color: #6b7200; background: #fffef0; }

    /* ── Account overlay ── */
    .bopp-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); z-index: 10001; display: none; align-items: center; justify-content: center; backdrop-filter: blur(6px); }
    .bopp-overlay.open { display: flex; }
    .bopp-ov-card { background: #fff; width: 480px; max-height: 80vh; border-radius: 22px; padding: 22px; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.15); }
    .bopp-ov-list { overflow-y: auto; flex: 1; margin-top: 2px; padding-right: 4px; }
    .bopp-ov-item { border: 1px solid #f1f5f9; background: #fff; border-radius: 12px; margin-bottom: 5px; padding: 11px 16px; font-size: 0.85rem; font-weight: 600; text-align: left; cursor: pointer; transition: 0.15s; color: #334155; width: 100%; display: block; }
    .bopp-ov-item:hover { background: #f4f7a1; border-color: #bdc432; color: #7a8500; }

    /* ── Footer ── */
    .bopp-footer { padding: 13px 28px; display: flex; align-items: center; gap: 10px; background: #fff; border-top: 1px solid #f1f5f9; }
    .bopp-btn-del { background: #fee2e2; color: #ef4444; border: none; padding: 0 18px; border-radius: 10px; font-weight: 700; height: 40px; font-size: 0.85rem; cursor: pointer; transition: 0.2s; font-family: inherit; display: none; align-items: center; gap: 6px; }
    .bopp-btn-del:hover { background: #fecaca; }
    .bopp-btn-undo { border: none; background: #bdc432; color: #1e293b; border-radius: 10px; font-weight: 800; height: 40px; padding: 0 16px; font-size: 0.85rem; cursor: pointer; font-family: inherit; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
    .bopp-btn-undo:hover { background: #a3b020; }
    .bopp-btn-undo-qt { border: 1px solid #e2e8f0; background: #fff; color: #64748b; border-radius: 8px; font-weight: 700; height: 30px; padding: 0 13px; font-size: 0.73rem; cursor: pointer; font-family: inherit; transition: 0.15s; display: inline-flex; align-items: center; gap: 5px; }
    .bopp-btn-undo-qt:hover { border-color: #bdc432; background: #fffef0; color: #6b7200; }
    .bopp-add-qt-row { position: relative; margin-top: 6px; display: flex; justify-content: center; }
    .bopp-btn-undo { border: none; background: #bdc432; color: #1e293b; border-radius: 10px; font-weight: 800; height: 40px; padding: 0 16px; font-size: 0.85rem; cursor: pointer; font-family: inherit; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
    .bopp-btn-undo:hover { background: #a3b020; }
    .bopp-btn-cancel { border: 1px solid #e2e8f0; background: #fff; color: #64748b; border-radius: 10px; font-weight: 700; height: 40px; padding: 0 18px; font-size: 0.85rem; cursor: pointer; font-family: inherit; transition: 0.2s; }
    .bopp-btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; }
    .bopp-btn-save { background: #1e293b; color: #bdc432; border: none; padding: 0 24px; border-radius: 10px; font-weight: 800; height: 40px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); font-family: inherit; }
    .bopp-btn-save:hover { background: #0f172a; transform: translateY(-2px) scale(1.04); box-shadow: 0 8px 24px rgba(0,0,0,0.22); }
    .bopp-btn-save:active { transform: translateY(0) scale(0.97); box-shadow: none; transition-duration: 0.1s; }
    .bopp-btn-save:disabled { opacity: 0.6; pointer-events: none; }

    /* ── Churn sections ── */
    .bopp-churn-wrap { border: 1.5px solid rgba(249,115,22,0.5); border-radius: 14px; padding: 16px; position: relative; background: rgba(249,115,22,0.03); margin-bottom: 16px; }
    .bopp-churn-label { position: absolute; top: -10px; left: 14px; background: #f8fafc; padding: 0 8px; font-size: 0.68rem; font-weight: 800; color: #f97316; letter-spacing: 0.08em; text-transform: uppercase; }
    .bopp-churn-wrap .bopp-qt-card { border-left-color: #f97316; }
    .bopp-churn-date-wrap { position: absolute; top: -11px; right: 14px; background: #f8fafc; padding: 0 6px; display: flex; align-items: center; gap: 6px; }
    .bopp-churn-date-lbl { font-size: 0.62rem; font-weight: 700; color: rgba(249,115,22,0.7); letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
    .bopp-churn-date-inp { border: 1px solid rgba(249,115,22,0.35); border-radius: 7px; background: #fff; color: #f97316; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; height: 22px; outline: none; font-family: inherit; cursor: pointer; text-align: center; }
    .bopp-original-wrap { border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; position: relative; margin-bottom: 16px; }
    .bopp-original-label { position: absolute; top: -10px; left: 14px; background: #f8fafc; padding: 0 8px; font-size: 0.68rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; }
    .bopp-qt-card--disabled { pointer-events: none; opacity: 0.6; }
</style>

<div class="modal fade" id="b-opp-modal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog bopp-modal-wrap modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">

            <!-- Account search overlay -->
            <div id="bopp-overlay" class="bopp-overlay" onclick="BOppApp.closeOverlay()">
                <div class="bopp-ov-card" onclick="event.stopPropagation()">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold m-0" style="font-size:0.95rem;">Select Account</h5>
                        <button type="button" class="btn-close" onclick="BOppApp.closeOverlay()"></button>
                    </div>
                    <input type="text" id="bopp-ov-input" class="form-control mb-2" placeholder="Search account..." style="border-radius:12px;padding:9px 14px;border:1px solid #e2e8f0;font-size:0.85rem;">
                    <div class="bopp-ov-list" id="bopp-ov-list"></div>
                </div>
            </div>

            <!-- Header -->
            <div class="bopp-header">
                <div class="bopp-header-left">
                    <div class="bopp-header-bar"></div>
                    <i class="bi bi-briefcase-fill bopp-header-icon"></i>
                    <span class="bopp-header-title" id="bopp-modal-title">New Opportunity</span>
                    <select id="bopp-status-sel" class="bopp-status-sel" style="display:none;"></select>
                </div>
                <div class="bopp-header-right">
                    <div class="bopp-hdr-totals" id="bopp-hdr-totals">
                        <div class="bopp-hdr-lost-zone" id="bopp-hdr-lost-wrap">
                            <div class="bopp-hdr-tbox">
                                <span class="bopp-hdr-tval" id="bopp-hdr-lost-amt">0</span>
                                <span class="bopp-hdr-tlbl">Churn Amount</span>
                            </div>
                            <div class="bopp-hdr-tdiv"></div>
                            <div class="bopp-hdr-tbox">
                                <span class="bopp-hdr-tval" id="bopp-hdr-lost-gp">0</span>
                                <span class="bopp-hdr-tlbl">Churn GP</span>
                            </div>
                        </div>
                        <div class="bopp-hdr-tbox">
                            <span class="bopp-hdr-tval" id="bopp-hdr-amt">0</span>
                            <span class="bopp-hdr-tlbl">Amount</span>
                        </div>
                        <div class="bopp-hdr-tdiv"></div>
                        <div class="bopp-hdr-tbox">
                            <span class="bopp-hdr-tval gp" id="bopp-hdr-gp">0</span>
                            <span class="bopp-hdr-tlbl">GP</span>
                        </div>
                        <span class="bopp-hdr-pct-badge" id="bopp-hdr-pct"></span>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
            </div>

            <!-- Form -->
            <form id="bopp-form" novalidate>
                <input type="hidden" id="bopp-editing-id">
                <input type="hidden" id="bopp-account-id">

                <div class="bopp-body">

                    <div class="bopp-outer">

                        <!-- Left 72% -->
                        <div class="bopp-card bopp-left-card">
                            <div style="display:flex; gap:10px; margin-bottom:10px;">
                                <div style="flex:1; min-width:0;">
                                    <label class="bq-lbl"><i class="bi bi-person-lines-fill"></i> Account Name <span style="color:#ef4444">*</span></label>
                                    <div class="bopp-acc-wrap">
                                        <input type="text" id="bopp-acc-name" class="bq-inp" placeholder="Select account..." readonly required onclick="BOppApp.openOverlay()" style="cursor:pointer; width:100%;">
                                    </div>
                                </div>
                                <div style="flex:1; min-width:0;">
                                    <label class="bq-lbl"><i class="bi bi-building"></i> Company <span style="color:#ef4444">*</span></label>
                                    <select id="bopp-company-sel" class="bq-inp" required disabled>
                                        <option value="">Select company...</option>
                                    </select>
                                </div>
                            </div>
                            <div style="margin-bottom:10px;">
                                <label class="bq-lbl"><i class="bi bi-briefcase-fill"></i> Opportunity Name <span style="color:#ef4444">*</span></label>
                                <input type="text" id="bopp-opp-name" class="bq-inp" placeholder="Project name..." required>
                            </div>
                            <div class="bopp-divider"></div>
                            <div style="display:flex; gap:14px; align-items:stretch;">
                                <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:8px;">
                                    <div>
                                        <label class="bq-lbl"><i class="bi bi-cloud-fill"></i> Materials</label>
                                        <input type="text" id="bopp-materials" class="bq-inp" placeholder="https://drive.google.com/...">
                                    </div>
                                    <div>
                                        <label class="bq-lbl"><i class="bi bi-file-earmark-text-fill"></i> Proposal</label>
                                        <input type="text" id="bopp-proposal" class="bq-inp" placeholder="https://drive.google.com/...">
                                    </div>
                                    <div>
                                        <label class="bq-lbl"><i class="bi bi-megaphone-fill"></i> Campaign</label>
                                        <input type="text" id="bopp-campaign" class="bq-inp" placeholder="https://drive.google.com/...">
                                    </div>
                                </div>
                                <div style="width:1px; background:#f1f5f9; flex-shrink:0;"></div>
                                <div style="flex:1; min-width:0; display:flex; flex-direction:column;">
                                    <label class="bq-lbl">Remark</label>
                                    <textarea id="bopp-remark" class="bq-inp bq-ta" style="flex:1;" placeholder="Note..."></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Right 30% -->
                        <div class="bopp-right-col" style="display:flex; flex-direction:column; gap:12px;">
                            <div class="bopp-card">
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">Business Type <span style="color:#ef4444">*</span></span>
                                    <select id="bopp-type" class="bopp-iinp" required>
                                        <option value="" disabled selected hidden></option>
                                        <option value="New Business">New Business</option>
                                        <option value="Retention">Retention</option>
                                        <option value="Up Sale">Up Sale</option>
                                    </select>
                                </div>
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">Owner OPP <span style="color:#ef4444">*</span></span>
                                    <select id="bopp-owner" class="bopp-iinp" required></select>
                                </div>
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">Lead Source <span style="color:#ef4444">*</span></span>
                                    <select id="bopp-lead" class="bopp-iinp" required></select>
                                </div>
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">AM</span>
                                    <select id="bopp-am" class="bopp-iinp"></select>
                                </div>
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">Sub AM</span>
                                    <select id="bopp-subam" class="bopp-iinp"></select>
                                </div>
                            </div>
                            <div class="bopp-card">
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">Signed Date <span style="color:#ef4444">*</span></span>
                                    <input type="date" id="bopp-signed" class="bopp-iinp" required>
                                </div>
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">Launch Date <span style="color:#ef4444">*</span></span>
                                    <input type="date" id="bopp-launch" class="bopp-iinp" required>
                                </div>
                            </div>
                        </div>

                    </div><!-- /bopp-outer -->

                    <!-- Quotations -->
                    <div class="bopp-qt-lbl"><i class="bi bi-file-earmark-text"></i> Quotations</div>
                    <div id="bopp-qt-container"></div>
                    <div class="bopp-add-qt-row" id="bopp-add-qt-row-outer">
                        <button type="button" class="bopp-btn-add-qt" onclick="BOppApp.addQT()">
                            <i class="bi bi-plus-circle"></i> Add Quotation
                        </button>
                    </div>

                </div>



                <div class="bopp-footer">
                    <button type="button" class="bopp-btn-undo" id="bopp-btn-undo" style="display:none;" onclick="BOppApp.undo()"><i class="bi bi-arrow-counterclockwise"></i> Undo</button>
                    <div style="flex:1"></div>
                    <button type="button" class="bopp-btn-del" id="bopp-btn-del">
                        <i class="bi bi-trash3"></i> Delete
                    </button>
                    <button type="submit" class="bopp-btn-save" id="bopp-btn-save">
                        <i class="bi bi-plus-circle-fill" id="bopp-save-icon"></i>
                        <span id="bopp-save-label">Create Opportunity</span>
                    </button>
                </div>
            </form>

        </div>
    </div>
</div>
`;

document.body.insertAdjacentHTML('beforeend', B_OPP_MODAL_HTML);

const BOppApp = (() => {
    const el = id => document.getElementById(id);
    const escA = s => s ? String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;') : '';
    const escH = s => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
    const fmtN = n => (!isNaN(+n) && n != null) ? fmtMoney(+n) : '0';
    const parseAmt = s => { const n = parseFloat(String(s).replace(/,/g,'')); return isNaN(n) ? 0 : n; };
    const getBxUser = () => { try { return JSON.parse(sessionStorage.getItem('bx_user')); } catch { return null; } };

    let _bsModal = null, _editingId = null, _loaded = false;
    let _accounts = [], _accNames = [], _profiles = [];
    let _buList = [], _companyList = [], _statusList = [], _leadList = [];
    let _qts = [], _churnQTs = [], _qtCounter = 0, _undoStack = [], _churnDate = '';

    const findQT     = id  => _qts.find(q => q.tmpId === id) || _churnQTs.find(q => q.tmpId === id);
    const isChurnMode = ()  => el('bopp-status-sel').value === 'Churn';
    const getBsModal = () => _bsModal || (_bsModal = new bootstrap.Modal(el('b-opp-modal')));
    const buildOpts  = (list, sel = '') => list.map(v => `<option value="${escA(v)}"${v === sel ? ' selected' : ''}>${escH(v)}</option>`).join('');

    // ── Load helper data (once per page) ─────────────────────────────────────
    async function loadHelpers() {
        if (_loaded) return;
        const [{ data: accs }, { data: profs }, { data: cfg }] = await Promise.all([
            supabaseClient.from('b_account_list').select('account_id, account_name, company_name').order('account_name'),
            supabaseClient.from('profiles').select('codename').neq('level','god').order('codename'),
            supabaseClient.from('b_opportunity_config').select('type, value').in('type',['bu','company','status','lead_source']).order('value')
        ]);
        _accounts     = accs || [];
        _profiles     = (profs || []).map(p => p.codename).filter(Boolean);
        _buList       = (cfg || []).filter(c => c.type === 'bu').map(c => c.value);
        _companyList  = (cfg || []).filter(c => c.type === 'company').map(c => c.value);
        _statusList   = (cfg || []).filter(c => c.type === 'status').map(c => c.value);
        _leadList     = (cfg || []).filter(c => c.type === 'lead_source').map(c => c.value);
        _accNames   = [...new Set(_accounts.map(a => a.account_name).filter(Boolean))].sort((a,b) => a.localeCompare(b,'th'));
        _loaded = true;
        buildDropdowns();
    }

    function buildDropdowns() {
        const blank = '<option value="" disabled selected hidden></option>';
        const pplOpts = buildOpts(_profiles);
        el('bopp-owner').innerHTML = blank + pplOpts;
        ['bopp-am','bopp-subam'].forEach(id => { const s = el(id); if (s) s.innerHTML = blank + pplOpts; });
        el('bopp-lead').innerHTML = blank + buildOpts(_leadList);
        el('bopp-status-sel').innerHTML = _statusList.length ? buildOpts(_statusList) : '<option value="Active">Active</option>';
    }

    // ── Account overlay ───────────────────────────────────────────────────────
    function openOverlay() {
        el('bopp-ov-input').value = '';
        renderOverlayList('');
        el('bopp-overlay').classList.add('open');
        setTimeout(() => el('bopp-ov-input').focus(), 50);
    }

    const closeOverlay = () => el('bopp-overlay').classList.remove('open');

    function renderOverlayList(q) {
        q = q.trim().toLowerCase();
        const filtered = q ? _accNames.filter(n => n.toLowerCase().includes(q)) : _accNames;
        el('bopp-ov-list').innerHTML = filtered.length
            ? filtered.map(n => `<button type="button" class="bopp-ov-item" data-name="${escA(n)}">${escH(n)}</button>`).join('')
            : '<p style="text-align:center;padding:20px;color:#94a3b8;font-size:0.85rem;">No accounts found</p>';
    }

    el('bopp-ov-list').addEventListener('click', e => {
        const btn = e.target.closest('.bopp-ov-item');
        if (!btn) return;
        el('bopp-acc-name').value = btn.dataset.name;
        el('bopp-acc-name').classList.remove('is-invalid');
        populateCompanies(btn.dataset.name, null);
        closeOverlay();
    });
    el('bopp-ov-input').addEventListener('input', e => renderOverlayList(e.target.value));

    // ── Account / Company ─────────────────────────────────────────────────────
    function populateCompanies(accountName, selectedId) {
        const companies = _accounts.filter(a => a.account_name === accountName);
        const sel = el('bopp-company-sel');
        if (!companies.length) {
            sel.innerHTML = '<option value="">—</option>';
            sel.disabled = false;
            el('bopp-account-id').value = '';
            return;
        }
        const opts = companies.map(c => `<option value="${escA(c.account_id)}"${c.account_id === selectedId ? ' selected' : ''}>${escH(c.company_name || c.account_id)}</option>`).join('');
        if (companies.length === 1) {
            sel.innerHTML = opts;
            sel.value = companies[0].account_id;
        } else {
            sel.innerHTML = `<option value="" disabled>Select company...</option>` + opts;
            sel.value = selectedId || '';
        }
        sel.disabled = false;
        el('bopp-account-id').value = sel.value;
    }

    el('bopp-company-sel').addEventListener('change', function() { el('bopp-account-id').value = this.value; this.classList.remove('is-invalid'); });

    // ── QT helpers ────────────────────────────────────────────────────────────
    function genQTNum() {
        const d = new Date();
        return `QT${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}${String(Math.floor(Math.random()*9000)+1000)}`;
    }


    const newItem = () => ({ item_id: null, bu: '', detail: '', qty: 1, price: 0, discount: 0, amount: 0, gp: 0 });

    function renderItemRow(qtTmpId, item, idx, disabled = false) {
        const amt = +item.amount || 0, gp = +item.gp || 0;
        const buOpts = `<option value=""${!item.bu ? ' selected' : ''} disabled hidden></option>` + _buList.map(b => `<option value="${escA(b)}"${item.bu === b ? ' selected' : ''}>${escH(b)}</option>`).join('');
        const da = disabled ? ' disabled' : '';
        return `<tr data-qt="${escA(qtTmpId)}" data-item="${idx}">
            <td class="bopp-item-no c">${idx+1}</td>
            <td class="c"><select class="bopp-item-sel" data-field="bu"${da}>${buOpts}</select></td>
            <td><textarea class="bopp-item-inp bopp-item-ta" data-field="detail" placeholder="Description..." rows="3"${da}>${escH(item.detail||'')}</textarea></td>
            <td><input type="text" class="bopp-item-inp r" data-field="qty" value="${item.qty ? fmtQty(item.qty) : ''}" inputmode="numeric" placeholder="0"${da}></td>
            <td><input type="text" class="bopp-item-inp r" data-field="price" value="${item.price ? fmtN(item.price) : ''}" inputmode="decimal" placeholder="0"${da}></td>
            <td><input type="text" class="bopp-item-inp r bopp-item-disc-inp" data-field="discount" value="${item.discount ? fmtN(item.discount) : ''}" inputmode="decimal" placeholder="0"${da}></td>
            <td class="bopp-item-amt" data-amt>${amt > 0 ? fmtN(amt) : '0'}</td>
            <td><input type="text" class="bopp-item-inp r bopp-item-gp-inp" data-field="gp" value="${item.gp ? fmtN(item.gp) : ''}" inputmode="decimal" placeholder="0" style="color:${gp>0?'#16a34a':'#cbd5e1'}; font-weight:700;"${da}></td>
            <td class="c">${disabled ? '' : `<button type="button" class="bopp-item-rm" onclick="BOppApp.removeItem('${escA(qtTmpId)}',${idx})" title="Delete row"><i class="bi bi-trash3"></i></button>`}</td>
        </tr>`;
    }

    function renderQTCard(qt, idx = 0, disabled = false) {
        const tAmt = qt._totAmt || 0, tGP = qt._totGP || 0;
        const buOpts = `<option value="" disabled${!qt.company_qt ? ' selected' : ''} hidden>— Company QT —</option>` + buildOpts(_companyList, qt.company_qt);
        const da = disabled ? ' disabled' : '';
        const pct = tAmt > 0 && tGP > 0 ? `${(tGP/tAmt*100).toFixed(1)}%` : '';
        return `<div class="bopp-qt-card${disabled ? ' bopp-qt-card--disabled' : ''}" data-qt-card="${escA(qt.tmpId)}">
            <div class="bopp-qt-head">
                <i class="bi bi-file-earmark-text" style="color:#94a3b8;font-size:0.9rem;flex-shrink:0;"></i>
                <input type="text" class="bopp-qt-num" value="${escA(qt.qt_number)}" data-field="qt_number" placeholder="QT...."${da}>
                <select class="bopp-qt-co" data-field="company_qt"${da}>${buOpts}</select>
                <div class="bopp-qt-totals">
                    <div class="bopp-qt-tbox">
                        <span class="bopp-qt-tval" data-qt-amt>${fmtN(tAmt)}</span>
                        <span class="bopp-qt-tlbl">Amount</span>
                    </div>
                    <div class="bopp-qt-tdiv"></div>
                    <div class="bopp-qt-tbox">
                        <span class="bopp-qt-tval gp" data-qt-gp>${fmtN(tGP)}</span>
                        <span class="bopp-qt-tlbl">GP</span>
                    </div>
                    <span class="bopp-qt-pct-badge" data-qt-pct>${pct}</span>
                </div>
            </div>
            <div class="bopp-item-wrap">
                <table class="bopp-item-tbl">
                    <thead><tr>
                        <th class="c" style="width:38px">#</th>
                        <th style="width:78px">BU</th>
                        <th>Detail</th>
                        <th class="r" style="width:56px">Qty</th>
                        <th class="r" style="width:108px">Price</th>
                        <th class="r" style="width:100px">Discount</th>
                        <th class="r" style="width:108px">Amount</th>
                        <th class="r" style="width:96px">GP</th>
                        <th style="width:36px"></th>
                    </tr></thead>
                    <tbody id="bopp-tbody-${escA(qt.tmpId)}">${qt.items.map((item, i) => renderItemRow(qt.tmpId, item, i, disabled)).join('')}</tbody>
                </table>
            </div>
            ${disabled ? '' : `<div class="bopp-qt-foot">
                <button type="button" class="bopp-btn-add-item" onclick="BOppApp.addItem('${escA(qt.tmpId)}')"><i class="bi bi-plus"></i> Add Item</button>
                <div style="display:flex;gap:6px;align-items:center;">
                    <button type="button" class="bopp-btn-dup" onclick="BOppApp.dupQT('${escA(qt.tmpId)}')"><i class="bi bi-copy"></i> Duplicate</button>
                    <button type="button" class="bopp-btn-del-qt" onclick="BOppApp.removeQT('${escA(qt.tmpId)}')"><i class="bi bi-trash3"></i> Delete</button>
                </div>
            </div>`}
        </div>`;
    }

    function _appendQTToDOM(qt) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderQTCard(qt, _qts.length - 1);
        el('bopp-qt-container').append(...tmp.children);
        updateQTDeleteBtns();
        updateItemTrashBtns(qt);
    }

    function renderAllQTs() {
        const container = el('bopp-qt-container');
        const outerBtn = el('bopp-add-qt-row-outer');
        if (isChurnMode()) {
            const churnCards = _churnQTs.map((qt, i) => renderQTCard(qt, i, false)).join('');
            const origCards  = _qts.map((qt, i) => renderQTCard(qt, i, true)).join('');
            container.innerHTML = `
                <div class="bopp-churn-wrap">
                    <span class="bopp-churn-label">CHURN</span>
                    <div class="bopp-churn-date-wrap">
                        <span class="bopp-churn-date-lbl">Churn Date</span>
                        <input type="date" class="bopp-churn-date-inp" value="${_churnDate}" onchange="BOppApp.setChurnDate(this.value)">
                    </div>
                    ${churnCards}
                    <div class="bopp-add-qt-row" style="margin-top:4px;">
                        <button type="button" class="bopp-btn-add-qt" onclick="BOppApp.addQT()"><i class="bi bi-plus-circle"></i> Add Quotation</button>
                    </div>
                </div>
                <div class="bopp-original-wrap">
                    <span class="bopp-original-label">SIGN</span>
                    ${origCards}
                </div>`;
            if (outerBtn) outerBtn.style.display = 'none';
            updateQTDeleteBtns();
            _churnQTs.forEach(updateItemTrashBtns);
        } else {
            if (outerBtn) outerBtn.style.display = '';
            if (!_qts.length) { container.innerHTML = ''; return; }
            const tmp = document.createElement('div');
            tmp.innerHTML = _qts.map((qt, i) => renderQTCard(qt, i, false)).join('');
            container.innerHTML = '';
            container.append(...tmp.children);
            updateQTDeleteBtns();
            _qts.forEach(updateItemTrashBtns);
        }
    }

    const reRenderQTBody = qt => {
        const tbody = el(`bopp-tbody-${qt.tmpId}`);
        if (tbody) tbody.innerHTML = qt.items.map((item, idx) => renderItemRow(qt.tmpId, item, idx)).join('');
    };

    // ── Totals ────────────────────────────────────────────────────────────────
    function recalcTotals() {
        const container = el('bopp-qt-container');
        [..._qts, ..._churnQTs].forEach(qt => {
            qt._totAmt = qt.items.reduce((s,i) => s + (+i.amount||0), 0);
            qt._totGP  = qt.items.reduce((s,i) => s + (+i.gp||0), 0);
            const card = container.querySelector(`[data-qt-card="${qt.tmpId}"]`);
            if (!card) return;
            card.querySelector('[data-qt-amt]').textContent = fmtN(qt._totAmt);
            card.querySelector('[data-qt-gp]').textContent  = fmtN(qt._totGP);
            card.querySelector('[data-qt-pct]').textContent = qt._totAmt > 0 && qt._totGP > 0 ? `${(qt._totGP/qt._totAmt*100).toFixed(1)}%` : '';
        });
        const srcQTs = isChurnMode() ? _churnQTs : _qts;
        const totAmt = srcQTs.reduce((s,qt) => s + qt._totAmt, 0);
        const totGP  = srcQTs.reduce((s,qt) => s + qt._totGP, 0);
        el('bopp-hdr-amt').textContent = fmtN(totAmt);
        el('bopp-hdr-gp').textContent  = fmtN(totGP);
        el('bopp-hdr-pct').textContent = totAmt > 0 && totGP > 0 ? `${(totGP/totAmt*100).toFixed(1)}%` : '';
        const lostWrap = el('bopp-hdr-lost-wrap');
        if (isChurnMode()) {
            const signAmt = _qts.reduce((s,qt) => s + qt._totAmt, 0);
            const signGP  = _qts.reduce((s,qt) => s + qt._totGP,  0);
            const lostAmt = signAmt - totAmt;
            const lostGP  = signGP  - totGP;
            const fmt = v => (v >= 0 ? '-' : '+') + fmtN(Math.abs(v));
            el('bopp-hdr-lost-amt').textContent = fmt(lostAmt);
            el('bopp-hdr-lost-gp').textContent  = fmt(lostGP);
            lostWrap.style.display = 'flex';
        } else {
            lostWrap.style.display = 'none';
        }
    }

    // ── QT event delegation ───────────────────────────────────────────────────
    el('bopp-qt-container').addEventListener('input', e => {
        const inp = e.target, field = inp.dataset.field;
        if (!field) return;

        const row = inp.closest('tr[data-qt][data-item]');
        if (row) {
            const qt = findQT(row.dataset.qt), idx = +row.dataset.item;
            if (!qt || idx >= qt.items.length) return;
            const item = qt.items[idx];
            if      (field === 'qty')      item.qty      = Math.max(0, Math.floor(parseAmt(inp.value)));
            else if (field === 'price')    item.price    = parseAmt(inp.value);
            else if (field === 'discount') item.discount = parseAmt(inp.value);
            else if (field === 'gp')       item.gp       = parseAmt(inp.value);
            else if (field === 'detail')   item.detail   = inp.value;

            if (['qty','price','discount'].includes(field)) {
                item.amount = Math.max(0, item.qty * item.price - item.discount);
                const amtCell = row.querySelector('[data-amt]');
                if (amtCell) amtCell.textContent = item.amount > 0 ? fmtN(item.amount) : '0';
            }
            if (field === 'gp') inp.style.color = item.gp > 0 ? '#16a34a' : '#cbd5e1';
            recalcTotals();
            return;
        }

        if (field === 'qt_number') {
            const card = inp.closest('[data-qt-card]');
            const qt = card && findQT(card.dataset.qtCard);
            if (qt) qt.qt_number = inp.value;
            inp.classList.remove('is-invalid');
        }
    });

    el('bopp-qt-container').addEventListener('change', e => {
        const inp = e.target, field = inp.dataset.field;
        if (!field) return;
        const row = inp.closest('tr[data-qt][data-item]');
        if (row && field === 'bu') {
            const qt = findQT(row.dataset.qt), idx = +row.dataset.item;
            if (qt && idx < qt.items.length) qt.items[idx].bu = inp.value;
            inp.classList.remove('is-invalid');
            return;
        }
        if (field === 'company_qt') {
            const card = inp.closest('[data-qt-card]');
            const qt = card && findQT(card.dataset.qtCard);
            if (qt) qt.company_qt = inp.value;
            inp.classList.remove('is-invalid');
        }
    });

    el('bopp-qt-container').addEventListener('focusout', e => {
        const inp = e.target, field = inp.dataset.field;
        if (field === 'qty')      inp.value = inp.value ? fmtQty(parseAmt(inp.value)) : '';
        else if (['price','discount','gp'].includes(field)) inp.value = inp.value ? fmtN(parseAmt(inp.value)) : '';
    });

    // ── UI state ──────────────────────────────────────────────────────────────
    const updateUndoBtn      = () => { const b = el('bopp-btn-undo'); if (b) b.style.display = _undoStack.length ? '' : 'none'; };
    const isEmptyItem        = item => !item.detail?.trim() && (+item.price||0) === 0 && (+item.qty||0) <= 1 && (+item.discount||0) === 0 && (+item.gp||0) === 0;
    const isEmptyQT          = qt   => !qt.qt_number?.trim() && !qt.company_qt && qt.items.every(isEmptyItem);
    const updateQTDeleteBtns = () => {
        if (isChurnMode()) {
            document.querySelectorAll('.bopp-churn-wrap .bopp-btn-del-qt').forEach(b => { b.style.display = _churnQTs.length > 1 ? '' : 'none'; });
        } else {
            document.querySelectorAll('.bopp-btn-del-qt').forEach(b => { b.style.display = _qts.length > 1 ? '' : 'none'; });
        }
    };

    function updateItemTrashBtns(qt) {
        const tbody = el(`bopp-tbody-${qt.tmpId}`);
        if (!tbody) return;
        const show = qt.items.length > 1 ? '' : 'none';
        tbody.querySelectorAll('.bopp-item-rm').forEach(b => { b.style.display = show; });
    }

    // ── Public QT operations ──────────────────────────────────────────────────
    function addQT() {
        _qtCounter++;
        const qt = { tmpId: `qt-${_qtCounter}`, qt_id: null, qt_number: '', company_qt: '', items: [newItem()], _totAmt: 0, _totGP: 0 };
        if (isChurnMode()) {
            _churnQTs.push(qt);
            renderAllQTs();
            recalcTotals();
        } else {
            _qts.push(qt);
            _appendQTToDOM(qt);
        }
    }

    async function removeQT(tmpId) {
        const inChurn = _churnQTs.some(q => q.tmpId === tmpId);
        const arr = inChurn ? _churnQTs : _qts;
        const qtIdx = arr.findIndex(q => q.tmpId === tmpId);
        if (qtIdx < 0) return;
        const qt = arr[qtIdx];
        if (!isEmptyQT(qt)) {
            const label = qt.qt_number ? `QT "${qt.qt_number}"` : 'this quotation';
            const { isConfirmed } = await Swal.fire({
                title: 'Delete Quotation?', text: `Delete ${label} and all its items?`,
                icon: 'warning', showCancelButton: true,
                confirmButtonText: 'Delete', confirmButtonColor: '#ef4444', cancelButtonText: 'Cancel',
                reverseButtons: true
            });
            if (!isConfirmed) return;
            _undoStack.push({ type: 'qt', qtIdx, qt: JSON.parse(JSON.stringify(qt)), isChurn: inChurn });
        }
        arr.splice(qtIdx, 1);
        if (inChurn) {
            renderAllQTs();
        } else {
            el('bopp-qt-container').querySelector(`[data-qt-card="${tmpId}"]`)?.remove();
        }
        recalcTotals();
        updateQTDeleteBtns();
        updateUndoBtn();
    }

    function addItem(qtTmpId) {
        const qt = findQT(qtTmpId);
        if (!qt) return;
        if (isChurnMode() && !_churnQTs.some(q => q.tmpId === qtTmpId)) return;
        qt.items.push(newItem());
        reRenderQTBody(qt);
        updateItemTrashBtns(qt);
        recalcTotals();
    }

    function removeItem(qtTmpId, idx) {
        const qt = findQT(qtTmpId);
        if (!qt || qt.items.length <= 1) return;
        if (isChurnMode() && !_churnQTs.some(q => q.tmpId === qtTmpId)) return;
        if (!isEmptyItem(qt.items[idx])) _undoStack.push({ type: 'item', qtTmpId, idx, item: { ...qt.items[idx] }, isChurn: _churnQTs.some(q => q.tmpId === qtTmpId) });
        qt.items.splice(idx, 1);
        qt.items.forEach(i => { i.amount = Math.max(0, (+i.qty||0) * (+i.price||0) - (+i.discount||0)); });
        reRenderQTBody(qt);
        updateItemTrashBtns(qt);
        recalcTotals();
        updateUndoBtn();
    }

    function undo() {
        if (!_undoStack.length) return;
        const action = _undoStack.pop();
        if (action.type === 'item') {
            const qt = findQT(action.qtTmpId);
            if (qt) { qt.items.splice(action.idx, 0, action.item); reRenderQTBody(qt); updateItemTrashBtns(qt); recalcTotals(); }
        } else if (action.type === 'qt') {
            const arr = action.isChurn ? _churnQTs : _qts;
            arr.splice(action.qtIdx, 0, action.qt);
            renderAllQTs();
            recalcTotals();
        }
        updateUndoBtn();
    }

    function dupQT(srcTmpId) {
        const src = findQT(srcTmpId);
        if (!src) return;
        const inChurn = _churnQTs.some(q => q.tmpId === srcTmpId);
        _qtCounter++;
        const dup = { tmpId: `qt-${_qtCounter}`, qt_id: null, qt_number: genQTNum(), company_qt: src.company_qt, items: src.items.map(i => ({ ...i, item_id: null })), _totAmt: src._totAmt, _totGP: src._totGP };
        if (inChurn) {
            _churnQTs.push(dup);
            renderAllQTs();
        } else {
            _qts.push(dup);
            _appendQTToDOM(dup);
        }
        recalcTotals();
    }

    // ── Status color ──────────────────────────────────────────────────────────
    const STATUS_COLORS = {
        'Active':        { bg: '#16a34a', text: '#fff' },
        'Won':           { bg: '#bdc432', text: '#1e293b' },
        'Lost':          { bg: '#ef4444', text: '#fff' },
        'Churn':         { bg: '#f97316', text: '#fff' },
        'End Contact':   { bg: '#64748b', text: '#fff' },
        'Pending':       { bg: '#f59e0b', text: '#1e293b' },
        'In Progress':   { bg: '#3b82f6', text: '#fff' },
    };

    function updateStatusColor() {
        const sel = el('bopp-status-sel');
        const c = STATUS_COLORS[sel.value];
        if (c) {
            sel.style.backgroundColor = c.bg;
            sel.style.color           = c.text;
            sel.style.borderColor     = c.bg;
        } else {
            sel.style.backgroundColor = 'rgba(255,255,255,0.08)';
            sel.style.color           = '#e2e8f0';
            sel.style.borderColor     = 'rgba(255,255,255,0.2)';
        }
    }

    el('bopp-status-sel').addEventListener('change', function() {
        const wasChurn = _churnQTs.length > 0;
        const nowChurn = this.value === 'Churn';
        if (nowChurn && !wasChurn && _qts.length) {
            _churnQTs = _qts.map(qt => {
                _qtCounter++;
                return { tmpId: `qt-${_qtCounter}`, qt_id: null, qt_number: qt.qt_number, company_qt: qt.company_qt,
                    items: qt.items.map(i => ({...i, item_id: null})), _totAmt: qt._totAmt, _totGP: qt._totGP };
            });
            renderAllQTs();
            recalcTotals();
        } else if (!nowChurn && wasChurn) {
            _churnQTs = [];
            renderAllQTs();
            recalcTotals();
        }
        updateStatusColor();
    });

    // ── Modal mode / Reset ────────────────────────────────────────────────────
    function _setModalMode(isEdit, oppId) {
        el('bopp-modal-title').textContent  = isEdit ? oppId : 'New Opportunity';
        el('bopp-save-icon').className      = isEdit ? 'bi bi-check-circle-fill' : 'bi bi-plus-circle-fill';
        el('bopp-save-label').textContent   = isEdit ? 'Save Changes' : 'Create Opportunity';
        el('bopp-btn-del').style.display     = isEdit ? 'flex' : 'none';
        el('bopp-status-sel').style.display  = isEdit ? '' : 'none';
        if (isEdit) updateStatusColor();
    }

    function resetForm() {
        el('bopp-form').classList.remove('was-validated');
        ['bopp-editing-id','bopp-account-id','bopp-acc-name','bopp-opp-name',
         'bopp-signed','bopp-launch','bopp-materials','bopp-proposal','bopp-campaign','bopp-remark']
            .forEach(id => { const e = el(id); if (e) e.value = ''; });
        const companySel = el('bopp-company-sel');
        companySel.innerHTML = '<option value="">Select company...</option>';
        companySel.disabled = true;
        ['bopp-type','bopp-lead','bopp-owner','bopp-am','bopp-subam'].forEach(id => { const s = el(id); if (s) s.value = ''; });
        el('bopp-status-sel').selectedIndex = 0;
        el('bopp-status-sel').style.display  = 'none';
        el('bopp-qt-container').innerHTML = '';
        const outerBtn = el('bopp-add-qt-row-outer');
        if (outerBtn) outerBtn.style.display = '';
        _qts = []; _churnQTs = []; _qtCounter = 0; _undoStack = []; _churnDate = '';
        recalcTotals();
        updateUndoBtn();
    }

    // ── Open modal ────────────────────────────────────────────────────────────
    async function openNew() {
        resetForm();
        await loadHelpers();
        const user = getBxUser();
        if (user?.codename) {
            const ownerSel = el('bopp-owner');
            if ([...ownerSel.options].some(o => o.value === user.codename)) ownerSel.value = user.codename;
        }
        addQT();
        _setModalMode(false);
        getBsModal().show();
    }

    async function openEdit(oppId) {
        resetForm();
        await loadHelpers();

        const { data: opp, error } = await supabaseClient.from('b_opportunity_list').select('*').eq('opportunity_id', oppId).single();
        if (error || !opp) { notify('Error', 'Load failed', 'error'); return; }

        _editingId = oppId;
        el('bopp-editing-id').value = oppId;
        el('bopp-account-id').value = opp.account_id || '';

        const acc = _accounts.find(a => a.account_id === opp.account_id);
        if (acc) { el('bopp-acc-name').value = acc.account_name || ''; populateCompanies(acc.account_name, opp.account_id); }

        [['bopp-opp-name','opportunity_name'],['bopp-type','business_type'],['bopp-lead','lead_source'],
         ['bopp-owner','owner'],['bopp-am','am'],['bopp-subam','sub_am'],
         ['bopp-materials','materials'],['bopp-proposal','proposal'],['bopp-campaign','campaign'],['bopp-remark','remark']]
            .forEach(([id, field]) => { el(id).value = opp[field] || ''; });

        el('bopp-signed').value = opp.signed_date ? String(opp.signed_date).slice(0,10) : '';
        el('bopp-launch').value = opp.launch_date ? String(opp.launch_date).slice(0,10) : '';
        _churnDate = opp.churn_date ? String(opp.churn_date).slice(0,10) : '';
        el('bopp-status-sel').value = opp.status || (_statusList[0] || 'Active');

        const { data: qts } = await supabaseClient.from('b_opportunity_qt')
            .select('*, b_opportunity_qt_item(*)')
            .eq('opportunity_id', oppId)
            .order('qt_number');

        const origQTs  = (qts || []).filter(q => q.qt_type !== 'churn');
        const churnQTs = (qts || []).filter(q => q.qt_type === 'churn');

        const _loadIntoArr = (qtList, arr) => {
            qtList.forEach(qt => {
                _qtCounter++;
                const items = (qt.b_opportunity_qt_item || [])
                    .sort((a,b) => (a.no||0)-(b.no||0))
                    .map(i => ({ item_id: i.item_id, bu: i.bu||'', detail: i.detail||'', qty: +i.qty||1, price: +i.price||0, discount: +i.discount||0, amount: +i.amount||0, gp: +i.gp||0 }));
                arr.push({ tmpId: `qt-${_qtCounter}`, qt_id: qt.qt_id, qt_number: qt.qt_number||'', company_qt: qt.company_qt||'',
                    items: items.length ? items : [newItem()],
                    _totAmt: items.reduce((s,i) => s+(+i.amount||0), 0),
                    _totGP:  items.reduce((s,i) => s+(+i.gp||0), 0) });
            });
        };

        if (origQTs.length) { _loadIntoArr(origQTs, _qts); } else { addQT(); }

        if (opp.status === 'Churn') {
            if (churnQTs.length) {
                _loadIntoArr(churnQTs, _churnQTs);
            } else {
                // clone originals if no churn QTs saved yet
                _churnQTs = _qts.map(qt => {
                    _qtCounter++;
                    return { tmpId: `qt-${_qtCounter}`, qt_id: null, qt_number: qt.qt_number, company_qt: qt.company_qt,
                        items: qt.items.map(i => ({...i, item_id: null})), _totAmt: qt._totAmt, _totGP: qt._totGP };
                });
            }
        }

        renderAllQTs();
        recalcTotals();
        _setModalMode(true, oppId);
        getBsModal().show();
    }

    // ── Public: open duplicate ───────────────────────────────────────────────
    async function openDuplicate(oppId) {
        resetForm();
        _editingId = null;
        await loadHelpers();

        const { data: opp, error } = await supabaseClient.from('b_opportunity_list').select('*').eq('opportunity_id', oppId).single();
        if (error || !opp) { notify('', 'Load failed', 'error'); return; }

        el('bopp-account-id').value = opp.account_id || '';
        const acc = _accounts.find(a => a.account_id === opp.account_id);
        if (acc) { el('bopp-acc-name').value = acc.account_name || ''; populateCompanies(acc.account_name, opp.account_id); }

        [['bopp-opp-name','opportunity_name'],['bopp-type','business_type'],['bopp-lead','lead_source'],
         ['bopp-owner','owner'],['bopp-am','am'],['bopp-subam','sub_am'],
         ['bopp-materials','materials'],['bopp-proposal','proposal'],['bopp-campaign','campaign'],['bopp-remark','remark']]
            .forEach(([id, field]) => { el(id).value = opp[field] || ''; });

        el('bopp-signed').value = opp.signed_date ? String(opp.signed_date).slice(0,10) : '';
        el('bopp-launch').value = opp.launch_date ? String(opp.launch_date).slice(0,10) : '';

        // Copy QT items in full (bu/detail/qty/price/discount/gp) — only qt_number resets,
        // since each quotation needs its own fresh number
        const { data: qts } = await supabaseClient.from('b_opportunity_qt')
            .select('*, b_opportunity_qt_item(*)')
            .eq('opportunity_id', oppId)
            .order('qt_number');
        const origQTs = (qts || []).filter(q => q.qt_type !== 'churn');

        if (origQTs.length) {
            origQTs.forEach(qt => {
                _qtCounter++;
                const items = (qt.b_opportunity_qt_item || [])
                    .sort((a,b) => (a.no||0)-(b.no||0))
                    .map(i => ({ item_id: null, bu: i.bu || '', detail: i.detail || '', qty: +i.qty || 1, price: +i.price || 0, discount: +i.discount || 0, amount: +i.amount || 0, gp: +i.gp || 0 }));
                _qts.push({ tmpId: `qt-${_qtCounter}`, qt_id: null, qt_number: '', company_qt: qt.company_qt || '',
                    items: items.length ? items : [newItem()],
                    _totAmt: items.reduce((s,i) => s+(+i.amount||0), 0),
                    _totGP:  items.reduce((s,i) => s+(+i.gp||0), 0) });
            });
            renderAllQTs();
            recalcTotals();
        } else {
            addQT();
        }

        _setModalMode(false);
        getBsModal().show();
    }

    // ── DB helpers ────────────────────────────────────────────────────────────
    async function _deleteOppQTs(oppId) {
        const { data: oldQts } = await supabaseClient.from('b_opportunity_qt').select('qt_id').eq('opportunity_id', oppId);
        if (oldQts?.length) {
            const qtIds = oldQts.map(q => q.qt_id);
            await supabaseClient.from('b_opportunity_qt_item').delete().in('qt_id', qtIds);
            await supabaseClient.from('b_finance_qt').delete().in('qt_id', qtIds);
            await supabaseClient.from('b_opportunity_qt').delete().eq('opportunity_id', oppId);
        }
    }

    async function _deleteChurnQTs(oppId) {
        const { data: rows } = await supabaseClient.from('b_opportunity_qt').select('qt_id').eq('opportunity_id', oppId).eq('qt_type', 'churn');
        if (rows?.length) {
            await supabaseClient.from('b_opportunity_qt_item').delete().in('qt_id', rows.map(q => q.qt_id));
            await supabaseClient.from('b_opportunity_qt').delete().in('qt_id', rows.map(q => q.qt_id));
        }
    }

    async function insertQTToDB(oppId, qt, qtType = 'original') {
        const validItems = qt.items.filter(i => i.detail.trim() || +i.price > 0 || +i.qty > 1);
        if (!qt.qt_number.trim() && !validItems.length) return;
        const { data: qtRow, error: qtErr } = await supabaseClient.from('b_opportunity_qt')
            .insert({ opportunity_id: oppId, qt_number: qt.qt_number.trim() || null, company_qt: qt.company_qt || null, qt_type: qtType })
            .select('qt_id').single();
        if (qtErr) throw qtErr;
        const itemRows = qt.items
            .filter(i => i.detail.trim() || +i.price > 0)
            .map((i, idx) => ({ qt_id: qtRow.qt_id, no: idx+1, bu: i.bu||null, detail: i.detail.trim()||null, qty: +i.qty||null, price: +i.price||null, discount: +i.discount||null, gp: +i.gp||null }));
        if (itemRows.length) {
            const { error: itemErr } = await supabaseClient.from('b_opportunity_qt_item').insert(itemRows);
            if (itemErr) throw itemErr;
        }
        if (qtType === 'original') {
            const saleAmt = qt.items.reduce((s,i) => s + (+i.amount||0), 0);
            // quotation_sub left blank — matches b-finance-list.html's own
            // Add Sub behavior (no auto-generated label), user fills it in
            // themselves. Previously defaulted to the QT's own number,
            // which just showed the same code twice (QT header + this row).
            // detail (finance row's own field, not qt.items[].detail above)
            // defaults to the Opportunity Name so Finance sees which deal a
            // sub-invoice belongs to without cross-checking the QT number.
            const oppName = el('bopp-opp-name')?.value?.trim() || null;
            supabaseClient.from('b_finance_qt')
                .insert({ qt_id: qtRow.qt_id, sub_index: 1, quotation_sub: null, actual_amount: saleAmt || null, detail: oppName })
                .then(({ error }) => { if (error) console.warn('[finance auto-create]', error); });
        }
    }

    async function _saveOppQTs(oppId, qts) {
        const { data: existingQTs } = await supabaseClient
            .from('b_opportunity_qt').select('qt_id').eq('opportunity_id', oppId).eq('qt_type', 'original');
        const existingIds = new Set((existingQTs || []).map(q => q.qt_id));
        const keepIds    = new Set(qts.filter(q => q.qt_id).map(q => q.qt_id));

        // Delete QTs removed from modal
        const toDelete = [...existingIds].filter(id => !keepIds.has(id));
        if (toDelete.length) {
            await supabaseClient.from('b_opportunity_qt_item').delete().in('qt_id', toDelete);
            await supabaseClient.from('b_finance_qt').delete().in('qt_id', toDelete);
            await supabaseClient.from('b_opportunity_qt').delete().in('qt_id', toDelete);
        }

        for (const qt of qts) {
            const saleAmt = qt.items.reduce((s,i) => s + (+i.amount||0), 0);
            const qtNum   = qt.qt_number.trim() || null;

            if (qt.qt_id) {
                // Update existing QT in place
                await supabaseClient.from('b_opportunity_qt')
                    .update({ qt_number: qtNum, company_qt: qt.company_qt || null })
                    .eq('qt_id', qt.qt_id);

                // Replace items (no downstream dependency)
                await supabaseClient.from('b_opportunity_qt_item').delete().eq('qt_id', qt.qt_id);
                const itemRows = qt.items
                    .filter(i => i.detail.trim() || +i.price > 0)
                    .map((i, idx) => ({ qt_id: qt.qt_id, no: idx+1, bu: i.bu||null, detail: i.detail.trim()||null, qty: +i.qty||null, price: +i.price||null, discount: +i.discount||null, gp: +i.gp||null }));
                if (itemRows.length) await supabaseClient.from('b_opportunity_qt_item').insert(itemRows);

                // Sync finance row only if still empty
                const { data: finRows } = await supabaseClient
                    .from('b_finance_qt')
                    .select('sub_index, invoice, bill_date, receipt_no, receipt_date, remark')
                    .eq('qt_id', qt.qt_id);
                const isEmpty = finRows?.length === 1
                    && !finRows[0].invoice && !finRows[0].bill_date
                    && !finRows[0].receipt_no && !finRows[0].receipt_date && !finRows[0].remark;
                if (isEmpty) {
                    const oppName = el('bopp-opp-name')?.value?.trim() || null;
                    supabaseClient.from('b_finance_qt')
                        .update({ actual_amount: saleAmt || null, quotation_sub: qtNum || qt.qt_id, detail: oppName })
                        .eq('qt_id', qt.qt_id)
                        .then(({ error }) => { if (error) console.warn('[finance sync]', error); });
                }
            } else {
                // New QT
                await insertQTToDB(oppId, qt, 'original');
            }
        }
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();
        el('bopp-form').classList.add('was-validated');
        // manual check: account + company (disabled/readonly ไม่ถูก checkValidity จับ)
        const accInp = el('bopp-acc-name'), compSel = el('bopp-company-sel');
        if (!el('bopp-account-id').value) {
            accInp.classList.add('is-invalid');
            accInp.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        accInp.classList.remove('is-invalid');
        if (!compSel.value) {
            compSel.classList.add('is-invalid');
            compSel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            compSel.focus();
            return;
        }
        compSel.classList.remove('is-invalid');
        if (!el('bopp-form').checkValidity()) {
            const first = el('bopp-form').querySelector(':invalid');
            if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus(); }
            return;
        }
        const activeQTs = isChurnMode() ? _churnQTs : _qts;
        if (!activeQTs.length) { notify('','กรุณาเพิ่ม QT อย่างน้อย 1 รายการ', 'warning'); return; }
        const qtContainer = el('bopp-qt-container');
        // รอบ 1: ชื่อ QT
        let firstEmptyName = null;
        activeQTs.forEach(qt => {
            const card = qtContainer.querySelector(`[data-qt-card="${qt.tmpId}"]`);
            const numInp = card?.querySelector('.bopp-qt-num');
            if (numInp && !numInp.value.trim()) { numInp.classList.add('is-invalid'); if (!firstEmptyName) firstEmptyName = numInp; }
        });
        if (firstEmptyName) { firstEmptyName.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstEmptyName.focus(); return; }
        // รอบ 1.5: Company QT
        let firstEmptyCoQT = null;
        activeQTs.forEach(qt => {
            const card = qtContainer.querySelector(`[data-qt-card="${qt.tmpId}"]`);
            const coSel = card?.querySelector('.bopp-qt-co');
            if (coSel && !coSel.value) { coSel.classList.add('is-invalid'); if (!firstEmptyCoQT) firstEmptyCoQT = coSel; }
        });
        if (firstEmptyCoQT) { firstEmptyCoQT.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstEmptyCoQT.focus(); return; }
        // รอบ 1.6: BU ในทุก item
        let firstEmptyBU = null;
        activeQTs.forEach(qt => {
            const card = qtContainer.querySelector(`[data-qt-card="${qt.tmpId}"]`);
            qt.items.forEach((item, idx) => {
                if (!item.bu && (item.detail?.trim() || +item.price > 0)) {
                    const row = card?.querySelector(`tr[data-qt="${qt.tmpId}"][data-item="${idx}"]`);
                    const buSel = row?.querySelector('.bopp-item-sel[data-field="bu"]');
                    if (buSel) { buSel.classList.add('is-invalid'); if (!firstEmptyBU) firstEmptyBU = buSel; }
                }
            });
        });
        if (firstEmptyBU) { firstEmptyBU.scrollIntoView({ behavior: 'smooth', block: 'center' }); notify('', 'กรุณาเลือก BU ให้ครบทุก item', 'warning'); return; }
        // รอบ 2: ยอดเงิน
        const noAmtQT = activeQTs.find(qt => !(qt._totAmt > 0));
        if (noAmtQT) {
            notify('','Quotation amount required', 'warning');
            qtContainer.querySelector(`[data-qt-card="${noAmtQT.tmpId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const user = getBxUser();
        const saveBtn = el('bopp-btn-save');
        saveBtn.disabled = true;

        const grandAmt = activeQTs.reduce((s,qt) => s + qt.items.reduce((ss,i) => ss + (+i.amount||0), 0), 0);
        const grandGP  = activeQTs.reduce((s,qt) => s + qt.items.reduce((ss,i) => ss + (+i.gp||0), 0), 0);

        const payload = {
            account_id:       el('bopp-account-id').value,
            opportunity_name: el('bopp-opp-name').value.trim(),
            business_type:    el('bopp-type').value    || null,
            lead_source:      el('bopp-lead').value    || null,
            owner:            el('bopp-owner').value   || null,
            am:               el('bopp-am').value      || null,
            sub_am:           el('bopp-subam').value   || null,
            signed_date:      el('bopp-signed').value      || null,
            launch_date:      el('bopp-launch').value      || null,
            churn_date:       isChurnMode() ? (_churnDate || new Date().toISOString().slice(0,10)) : null,
            materials:        el('bopp-materials').value.trim() || null,
            proposal:         el('bopp-proposal').value.trim()  || null,
            campaign:         el('bopp-campaign').value.trim()  || null,
            remark:           el('bopp-remark').value.trim()    || null,
            total_amount:     grandAmt,
            total_gp:         grandGP,
        };

        let _newOppId = null;
        try {
            let oppId = _editingId;
            if (_editingId) {
                payload.status      = el('bopp-status-sel').value;
                payload.update_by   = user?.codename || null;
                payload.update_date = new Date().toISOString();
                const { error } = await supabaseClient.from('b_opportunity_list').update(payload).eq('opportunity_id', _editingId);
                if (error) throw error;

                if (isChurnMode()) {
                    await _deleteChurnQTs(_editingId);
                    const { data: existingOrig } = await supabaseClient.from('b_opportunity_qt').select('qt_id').eq('opportunity_id', _editingId).eq('qt_type', 'original');
                    if (!existingOrig?.length) {
                        for (const qt of _qts) await insertQTToDB(oppId, qt, 'original');
                    }
                    for (const qt of _churnQTs) await insertQTToDB(oppId, qt, 'churn');
                } else {
                    await _saveOppQTs(oppId, _qts);
                }
            } else {
                const now = new Date().toISOString();
                payload.status      = 'Active';
                payload.create_by   = user?.codename || null;
                payload.create_date = now;
                payload.update_by   = user?.codename || null;
                payload.update_date = now;
                const { data, error } = await supabaseClient.from('b_opportunity_list').insert(payload).select('opportunity_id').single();
                if (error) throw error;
                oppId = data.opportunity_id;
                _newOppId = oppId;
                for (const qt of _qts) await insertQTToDB(oppId, qt, 'original');
                // fire-and-forget email notification
                fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        opportunity_id:   oppId,
                        opportunity_name: payload.opportunity_name,
                        create_by:        user?.codename || null,
                        create_date:      payload.create_date,
                        account_name:     el('bopp-acc-name').value,
                        company_name:     (() => { const acc = _accMap?.get(el('bopp-account-id').value); return acc?.company_name || null; })(),
                        launch_date:      payload.launch_date,
                        signed_date:      payload.signed_date,
                        remark:           payload.remark,
                        business_type:    payload.business_type,
                        lead_source:      payload.lead_source,
                        owner:            payload.owner,
                        am:               payload.am,
                        sub_am:           payload.sub_am,
                        materials:        payload.materials,
                        proposal:         payload.proposal,
                        amount:           grandAmt,
                        gp:               grandGP,
                        qts:              _qts.map(q => ({
                            qt_number:  q.qt_number,
                            company_qt: q.company_qt,
                            _totAmt:    q._totAmt,
                            _totGP:     q._totGP,
                            items:      q.items,
                        })),
                        to: ['thitiphon@brand-strom.com'],
                    }),
                }).catch(err => console.warn('[notify]', err));
            }

            getBsModal().hide();
            notify('Success', _editingId ? 'Saved' : 'Opportunity created', 'success');
            _editingId = null;
            _loaded = false;
            if (typeof loadMasterData === 'function') await loadMasterData();
            if (typeof applyFilters  === 'function')  applyFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            console.error('[B-OPP modal]', err);
            if (_newOppId) await supabaseClient.from('b_opportunity_list').delete().eq('opportunity_id', _newOppId);
            notify('Error', err?.message || 'Save failed', 'error');
        } finally {
            saveBtn.disabled = false;
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    async function handleDelete() {
        if (!_editingId) return;
        const { isConfirmed } = await Swal.fire({
            title: 'Delete Opportunity?', text: `${_editingId} and all its quotations will be permanently deleted.`,
            icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete',
            confirmButtonColor: '#ef4444', cancelButtonText: 'Cancel'
        });
        if (!isConfirmed) return;
        try {
            await _deleteOppQTs(_editingId);
            const { error } = await supabaseClient.from('b_opportunity_list').delete().eq('opportunity_id', _editingId);
            if (error) throw error;
            getBsModal().hide();
            notify('Success', 'Deleted', 'success');
            const delId = _editingId;
            _editingId = null;
            _loaded = false;
            if (typeof _searchIndex !== 'undefined') _searchIndex.delete(delId);
            if (typeof applyFilters === 'function') applyFilters();
        } catch (err) {
            console.error('[B-OPP modal]', err);
            notify('Error', 'Delete failed', 'error');
        }
    }

    el('bopp-form').addEventListener('submit', handleSubmit);
    el('bopp-btn-del').addEventListener('click', handleDelete);
    el('b-opp-modal').addEventListener('hidden.bs.modal', () => { _editingId = null; });
    // Bootstrap already locks body scroll via its own .modal-open class,
    // but SweetAlert2 (save/error toasts fired while this modal is open)
    // manages document.body.style.overflow independently and can stomp
    // on Bootstrap's lock when it closes — this shared, reference-counted
    // lock keeps the background from scrolling regardless of which
    // library's cleanup runs last.
    el('b-opp-modal').addEventListener('shown.bs.modal', lockBodyScroll);
    el('b-opp-modal').addEventListener('hidden.bs.modal', unlockBodyScroll);

    function setChurnDate(v) { _churnDate = v; }
    return { openNew, openEdit, openDuplicate, openOverlay, closeOverlay, addQT, addItem, removeItem, removeQT, dupQT, undo, setChurnDate };
})();
