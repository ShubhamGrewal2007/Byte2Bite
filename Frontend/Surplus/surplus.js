(() => {
  "use strict";
  const els = {
    loading: document.getElementById("loadingState"), error: document.getElementById("errorState"),
    content: document.getElementById("contentState"), retry: document.getElementById("retryBtn"),
    currentSurplus: document.getElementById("currentSurplus"), currentExpected: document.getElementById("currentExpected"),
    currentPlanned: document.getElementById("currentPlanned"), currentActual: document.getElementById("currentActual"),
    currentRedistributed: document.getElementById("currentRedistributed"), currentRemaining: document.getElementById("currentRemaining"),
    statusTitle: document.getElementById("statusTitle"), statusReason: document.getElementById("statusReason"),
    breakdownList: document.getElementById("surplusBreakdownList"), breakdownBody: document.getElementById("surplusBreakdownBody"),
    breakdownEmpty: document.getElementById("surplusBreakdownEmpty"), breakdownTotals: document.getElementById("surplusBreakdownTotals"),
    breakdownPeriodNote: document.getElementById("breakdownPeriodNote"), historyBody: document.getElementById("historyBody"),
    historyEmpty: document.getElementById("historyEmpty"), recoverySurplusMeals: document.getElementById("recoverySurplusMeals"),
    recoveryRedistributed: document.getElementById("recoveryRedistributed"), recoveryRemaining: document.getElementById("recoveryRemaining"),
    recoveryMessage: document.getElementById("recoveryMessage"), detailsModal: document.getElementById("detailsModal"),
    detailsContent: document.getElementById("detailsContent"), deleteModal: document.getElementById("deleteModal")
  };
  let surplusData = null, pendingDelete = null;
  const KEY = "byte2bite_surplus_deleted_ids";
  const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const fmt = v => new Intl.NumberFormat().format(num(v));
  const deriveStatus = (expected, actual) => {
    expected=num(expected); actual=num(actual);
    if(actual>expected)return{key:"surplus",surplus:actual-expected,shortfall:0};
    if(actual===expected)return{key:"on-target",surplus:0,shortfall:0};
    return{key:"shortage",surplus:0,shortfall:expected-actual};
  };
  const readDeleted = () => { try{return new Set(JSON.parse(localStorage.getItem(KEY)||"[]"));}catch{return new Set();} };
  const writeDeleted = s => localStorage.setItem(KEY,JSON.stringify([...s]));
  const filterHistory = h => (Array.isArray(h)?h:[]).filter(r=>!readDeleted().has(r.id));
  const showState = s => { els.loading.classList.toggle("hidden",s!=="loading"); els.error.classList.toggle("hidden",s!=="error"); els.content.classList.toggle("hidden",s!=="content"); };
  function renderCurrent(c){
    const d=deriveStatus(c.expectedServings,c.actualProduction), s=Math.max(0,d.surplus), red=num(c.redistributed), rem=Math.max(0,s-red);
    els.currentSurplus.textContent=fmt(s); els.currentExpected.textContent=fmt(c.expectedServings); els.currentPlanned.textContent=fmt(c.plannedProduction); els.currentActual.textContent=fmt(c.actualProduction); els.currentRedistributed.textContent=fmt(red); els.currentRemaining.textContent=fmt(rem);
    els.statusTitle.textContent=d.key==="surplus"?"Surplus produced":d.key==="on-target"?"On target":"Shortage recorded";
    els.statusReason.textContent=d.key==="surplus"?`${fmt(s)} meals above expected servings.`:d.key==="on-target"?"Actual production matched expected servings.":`${fmt(d.shortfall)} meals below expected servings.`;
  }
  function computeAggregates(history){
    const b={surplus:{label:"Surplus",records:0,meals:0,shortfall:0,redistributed:0,remaining:0},"on-target":{label:"On Target",records:0,meals:0,shortfall:0,redistributed:0,remaining:0},shortage:{label:"Shortage",records:0,meals:0,shortfall:0,redistributed:0,remaining:0}};
    (history||[]).forEach(r=>{const d=deriveStatus(r.expectedServings,r.actualProduction),x=b[d.key],s=Math.max(0,d.surplus),red=num(r.redistributed);if(!x)return;x.records++;x.meals+=s;x.shortfall+=d.shortfall||0;x.redistributed+=red;x.remaining+=Math.max(0,s-red);});
    return{buckets:b,totalRecords:(history||[]).length,totalMeals:b.surplus.meals,totalShortfall:b.shortage.shortfall,totalRedistributed:Object.values(b).reduce((a,x)=>a+x.redistributed,0),totalRemaining:Object.values(b).reduce((a,x)=>a+x.remaining,0)};
  }
  function renderBreakdown(history){
    const a=computeAggregates(history), has=a.totalRecords>0; els.breakdownEmpty.classList.toggle("hidden",has); els.breakdownBody.classList.toggle("hidden",!has); els.breakdownPeriodNote.textContent=has?`${a.totalRecords} record${a.totalRecords===1?"":"s"}`:"By status"; els.breakdownList.innerHTML="";
    ["surplus","on-target","shortage"].forEach(k=>{const b=a.buckets[k],p=a.totalRecords?b.records/a.totalRecords*100:0,row=document.createElement("div");row.className="breakdown-row";row.innerHTML=`<span class="breakdown-label">${b.label}</span><span class="breakdown-value">${b.records} record${b.records===1?"":"s"}</span><div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${p}%"></div></div><span class="breakdown-meta">${k==="surplus"?`${fmt(b.meals)} surplus meals · ${Math.round(p)}% of records`:k==="shortage"?`${fmt(b.shortfall)} meals short · ${Math.round(p)}% of records`:`Met expected servings · ${Math.round(p)}% of records`}</span>`;els.breakdownList.appendChild(row);});
    const parts=[`${a.totalRecords} records`,`${fmt(a.totalMeals)} surplus meals`];if(a.totalShortfall)parts.push(`${fmt(a.totalShortfall)} short`);if(a.totalRedistributed)parts.push(`${fmt(a.totalRedistributed)} redistributed`);if(a.totalRemaining)parts.push(`${fmt(a.totalRemaining)} remaining`);els.breakdownTotals.textContent=parts.join(" · ");
  }
  function renderHistory(history){
    els.historyBody.innerHTML="";els.historyEmpty.classList.toggle("hidden",history.length!==0);
    history.forEach(r=>{const d=deriveStatus(r.expectedServings,r.actualProduction),tr=document.createElement("tr");tr.innerHTML=`<td>${r.date}</td><td>${r.meal}</td><td>${fmt(r.expectedServings)}</td><td>${fmt(r.plannedProduction)}</td><td>${fmt(r.actualProduction)}</td><td>${fmt(d.surplus)}</td><td>${d.key}</td><td><div class="row-actions"><button class="btn btn-secondary" data-view="${r.id}">View</button><button class="btn btn-danger" data-delete="${r.id}">Delete</button></div></td>`;els.historyBody.appendChild(tr);});
  }
  function renderRecovery(c){
    const d=deriveStatus(c.expectedServings,c.actualProduction),s=Math.max(0,d.surplus),red=num(c.redistributed),rem=Math.max(0,s-red);
    els.recoverySurplusMeals.textContent=fmt(s);
    els.recoveryRedistributed.textContent=fmt(red);
    els.recoveryRemaining.textContent=fmt(rem);
    els.recoveryMessage.textContent=rem>0?`${fmt(rem)} meal${rem===1?"":"s"} remain available for recovery.`:s===0&&d.key==="shortage"?"No surplus was produced — there is nothing to recover for this service.":"No remaining surplus requires recovery.";

    // Recovery Action → Send to Network
    // Enabled only when there is remaining surplus to route.
    const btn = document.getElementById("recoverySendBtn");
    if (btn) {
      const enabled = rem > 0;
      btn.setAttribute("aria-disabled", String(!enabled));
    }
    const note = document.getElementById("recoveryCtaNote");
    if (note) {
      note.textContent = rem > 0
        ? "Open Network to match and route available surplus."
        : "No remaining surplus to route right now.";
    }
  }
  function openDetails(r){const d=deriveStatus(r.expectedServings,r.actualProduction),red=num(r.redistributed),rem=Math.max(0,d.surplus-red);els.detailsContent.innerHTML=`<p><strong>${r.date}</strong> · ${r.meal}</p><p>Expected: ${fmt(r.expectedServings)}<br>Planned: ${fmt(r.plannedProduction)}<br>Actual: ${fmt(r.actualProduction)}<br>Calculated surplus: ${fmt(d.surplus)}<br>Redistributed: ${fmt(red)}<br>Remaining: ${fmt(rem)}</p><p>Ingredients: ${(r.ingredients||[]).join(", ")||"—"}</p><p>Formula: max(actual production − expected servings, 0)</p>`;els.detailsModal.classList.remove("hidden");}
  function closeModal(m){m.classList.add("hidden");}
  function refresh(){const h=filterHistory(surplusData.history);renderBreakdown(h);renderHistory(h);}
  async function load(){showState("loading");try{const r=await fetch("surplus.json");if(!r.ok)throw new Error("load failed");surplusData=await r.json();surplusData.history=filterHistory(surplusData.history);renderCurrent(surplusData.current);renderBreakdown(surplusData.history);renderHistory(surplusData.history);renderRecovery(surplusData.current);showState("content");}catch(e){showState("error");}}
  els.retry.addEventListener("click",load);
  els.historyBody.addEventListener("click",e=>{const v=e.target.closest("[data-view]"),d=e.target.closest("[data-delete]");if(v){const r=surplusData.history.find(x=>x.id===v.dataset.view);if(r)openDetails(r);}if(d){pendingDelete=surplusData.history.find(x=>x.id===d.dataset.delete);if(pendingDelete)els.deleteModal.classList.remove("hidden");}});
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(document.getElementById(b.dataset.close))));
  document.getElementById("cancelDelete").addEventListener("click",()=>{pendingDelete=null;closeModal(els.deleteModal);});
  document.getElementById("confirmDelete").addEventListener("click",()=>{if(!pendingDelete)return;const s=readDeleted();s.add(pendingDelete.id);writeDeleted(s);surplusData.history=surplusData.history.filter(r=>r.id!==pendingDelete.id);pendingDelete=null;closeModal(els.deleteModal);refresh();});
  [els.detailsModal,els.deleteModal].forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModal(m);}));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal(els.detailsModal);closeModal(els.deleteModal);}});
  load();
})();


/* ============================================================
   SURPLUS — ACCOUNT IDENTITY + KITCHEN/PROFILE DROPDOWN
   Additive only. Nothing above this line is modified.
   Uses the same shared auth layer Dashboard and Plan use.
   ============================================================ */

// -------- Header date --------
(function renderHeaderDate() {
  const el = document.getElementById("headerDate");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });
})();

// -------- Account identity --------
(function initSurplusIdentity() {
  function readIdentity() {
    const API = window.Byte2BiteAPI;
    let me = null;
    if (API && typeof API.getUser === "function") {
      try { me = API.getUser(); } catch (_) { me = null; }
    }
    const name = (me && me.name) ? me.name : "Kitchen 01";
    const role = (me && me.role)
      ? me.role.charAt(0).toUpperCase() + me.role.slice(1).toLowerCase()
      : "Admin";
    return { name: name, role: role };
  }

  function render() {
    const { name, role } = readIdentity();

    const ki = document.querySelector(".kitchen-badge .kitchen-info");
    if (ki) ki.textContent = name;

    const at = document.querySelector(".admin-profile .admin-text");
    if (at) at.textContent = role;

    const av = document.querySelector(".admin-profile .avatar");
    if (av) {
      const initials = name.split(/\s+/).map(function (s) { return s[0]; })
        .filter(Boolean).slice(0, 2).join("").toUpperCase();
      av.textContent = initials || "U";
    }

    const chip = document.querySelector(".kitchen-control span");
    if (chip) chip.textContent = name;

    const ddName = document.querySelector("#kitchenDropdown .kitchen-name");
    if (ddName) ddName.textContent = name;
    const ddRole = document.querySelector("#kitchenDropdown .kitchen-role");
    if (ddRole) ddRole.textContent = role;
  }

  render();
  window.addEventListener("byte2bite:authenticated", render);
})();

// -------- Kitchen/Profile dropdown (single component, two triggers) --------
(function initKitchenDropdown() {
  const dropdown = document.getElementById("kitchenDropdown");
  const topWrap = document.getElementById("topKitchenWrap");
  const sidebarWrap = document.getElementById("sidebarKitchenWrap");
  const topTrigger = document.getElementById("kitchenControl");
  const sidebarTrigger = document.getElementById("sidebarKitchenControl");

  if (!dropdown || !topWrap || !sidebarWrap || !topTrigger || !sidebarTrigger) {
    return;
  }

  const profileBtn = document.getElementById("kitchenProfileBtn");
  const signOutBtn = document.getElementById("kitchenSignOutBtn");

  let activeTrigger = null;

  function placeIn(wrapper, trigger) {
    if (dropdown.parentElement !== wrapper) {
      wrapper.appendChild(dropdown);
    }
    const isSidebar = wrapper === sidebarWrap;
    dropdown.classList.toggle("kitchen-dropdown--sidebar", isSidebar);

    topTrigger.setAttribute("aria-expanded", String(trigger === topTrigger));
    sidebarTrigger.setAttribute("aria-expanded", String(trigger === sidebarTrigger));

    activeTrigger = trigger;
  }

  function openFrom(trigger) {
    const wrapper = trigger === sidebarTrigger ? sidebarWrap : topWrap;
    placeIn(wrapper, trigger);
    dropdown.classList.add("open");
  }

  function close() {
    dropdown.classList.remove("open");
    topTrigger.setAttribute("aria-expanded", "false");
    sidebarTrigger.setAttribute("aria-expanded", "false");

    if (dropdown.parentElement !== topWrap) {
      topWrap.appendChild(dropdown);
    }
    dropdown.classList.remove("kitchen-dropdown--sidebar");
    activeTrigger = null;
  }

  function toggleFrom(trigger) {
    if (dropdown.classList.contains("open") && activeTrigger === trigger) {
      close();
    } else {
      openFrom(trigger);
    }
  }

  topTrigger.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleFrom(topTrigger);
  });

  sidebarTrigger.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleFrom(sidebarTrigger);
  });

  document.addEventListener("click", function (e) {
    if (!dropdown.classList.contains("open")) return;
    if (dropdown.contains(e.target)) return;
    if (topTrigger.contains(e.target)) return;
    if (sidebarTrigger.contains(e.target)) return;
    close();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!dropdown.classList.contains("open")) return;
    close();
    if (activeTrigger) activeTrigger.focus();
  });

  if (profileBtn) {
    profileBtn.addEventListener("click", function () { close(); });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      const auth = window.Byte2BiteAuth;
      if (auth && typeof auth.logout === "function") {
        auth.logout();
      }
      close();
    });
  }
})();

/* ============================================================
   SURPLUS — RECOVERY ACTION → NETWORK
   Additive only. Wires the existing "Send to Network" button
   to ../Network/network.html. No alert/confirm, no fake API,
   no reimplementation of the Network page. The button is only
   actionable while remaining surplus > 0; the aria-disabled
   attribute set by renderRecovery() gates navigation.
   ============================================================ */
(function initRecoverySendToNetwork() {
  const btn = document.getElementById("recoverySendBtn");
  if (!btn) return;

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    if (btn.getAttribute("aria-disabled") === "true") return;
    window.location.href = "../Network/network.html";
  });

  btn.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (btn.getAttribute("aria-disabled") === "true") return;
    e.preventDefault();
    window.location.href = "../Network/network.html";
  });
})();