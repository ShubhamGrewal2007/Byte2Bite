(() => {
  "use strict";

  const STORAGE_KEY = "byte2bite_network_operations";
  const ACTIVE_KEY = "byte2bite_network_active_operation";
  const state = {
    selectedSourceId: null,
    selectedRecipientId: null,
    connection: { status: "idle", compatibility: null, route: null, error: null },
    token: 0,
    routeLayer: null,
    sessionSavedPairs: new Set()
  };

  const $ = id => document.getElementById(id);
  const data = () => window.Byte2BiteData;

  const Store = {
    read() {
      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    },
    write(items) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); return true; }
      catch { return false; }
    },
    active() { try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; } },
    setActive(id) { try { id ? localStorage.setItem(ACTIVE_KEY,id) : localStorage.removeItem(ACTIVE_KEY); } catch {} },
    find(id) { return this.read().find(x => x.id === id) || null; }
  };

  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const num = v => Number.isFinite(Number(v)) ? Number(v) : null;
  const fmt = (v,d=1) => { const n=num(v); return n===null ? "—" : n.toFixed(d); };
  const toast = msg => {
    const el=$("networkToast"); if(!el) return;
    el.textContent=msg; el.classList.add("show"); clearTimeout(toast.t);
    toast.t=setTimeout(()=>el.classList.remove("show"),2200);
  };
  const pretty = v => String(v ?? "—").replaceAll("_"," ");

  function renderStats() {
    const sources=data().getSources(), recipients=data().getRecipients();
    const total=sources.reduce((a,s)=>a+(num(s.surplusMeals)||0),0);
    const compatible=sources.reduce((n,s)=>n+recipients.filter(r=>window.Byte2BiteMatcher.compatibilityScore(s.foodType,r.acceptedFoodTypes)>0).length,0);
    $("networkStats").innerHTML=[
      ["Surplus Sources",sources.length,"active sources"],
      ["Recipients",recipients.length,"available organizations"],
      ["Available Connections",compatible,"compatible pairs"],
      ["Total Surplus Meals",Math.round(total),"meals represented"]
    ].map(x=>`<div class="network-stat"><div class="k">${x[0]}</div><div class="v">${x[1]}</div><div class="s">${x[2]}</div></div>`).join("");
    $("legend-source-count").textContent=sources.length;
    $("legend-recipient-count").textContent=recipients.length;
    $("sourceCount").textContent=sources.length;
    $("recipientCount").textContent=recipients.length;
  }

  function entityCard(item,type) {
    const selected=(type==="source"?state.selectedSourceId:state.selectedRecipientId)===item.id;
    const meta=type==="source"
      ? `${pretty(item.foodType)} · ${fmt(item.surplusMeals,0)} meals surplus`
      : `${pretty(item.organizationType)} · ${fmt(item.capacityMeals,0)} meals capacity`;
    return `<button type="button" class="network-entity ${type==="recipient"?"recipient":""} ${selected?"selected":""}" data-${type}-id="${esc(item.id)}" aria-pressed="${selected}">
      <span class="network-entity-top"><span class="network-entity-name">${esc(item.name)}</span><span class="network-chip ${type==="recipient"?"orange":""}">${selected?"Selected":esc(item.priority||"normal")}</span></span>
      <span class="network-entity-meta">${esc(meta)}</span>
    </button>`;
  }

  function renderLists() {
    $("sourceList").innerHTML=data().getSources().map(x=>entityCard(x,"source")).join("");
    $("recipientList").innerHTML=data().getRecipients().map(x=>entityCard(x,"recipient")).join("");
    document.querySelectorAll("[data-source-id]").forEach(el=>el.addEventListener("click",()=>selectSource(el.dataset.sourceId)));
    document.querySelectorAll("[data-recipient-id]").forEach(el=>el.addEventListener("click",()=>selectRecipient(el.dataset.recipientId)));
  }

  function clearRoute() {
    if(state.routeLayer && window.byte2biteMap){
      if(state.routeLayer.polyline) window.byte2biteMap.removeLayer(state.routeLayer.polyline);
      if(state.routeLayer.label) window.byte2biteMap.removeLayer(state.routeLayer.label);
    }
    state.routeLayer=null;
  }

  function drawRoute(route) {
    clearRoute();
    if(!route || !window.byte2biteMap) return;
    const poly=L.polyline(route.geometry,{color:"#174d3a",weight:4,opacity:.9,lineCap:"round",lineJoin:"round"}).addTo(window.byte2biteMap);
    const mid=route.geometry[Math.floor(route.geometry.length/2)];
    const label=L.marker(mid,{icon:L.divIcon({className:"b2b-route-label-wrap",html:`<div class="b2b-route-label"><strong>🚚 ${fmt(route.durationMinutes,0)} min</strong><span>${fmt(route.distanceKm,2)} km</span></div>`,iconSize:[140,42],iconAnchor:[70,21]}),interactive:false,keyboard:false,zIndexOffset:500}).addTo(window.byte2biteMap);
    state.routeLayer={polyline:poly,label};
  }

  function renderConnection() {
    const s=state.selectedSourceId?data().getById(state.selectedSourceId):null;
    const r=state.selectedRecipientId?data().getById(state.selectedRecipientId):null;
    const el=$("selectedConnection");
    if(!s && !r) {
      el.innerHTML=`<h3>Selected Connection</h3><div class="network-empty">Select a surplus source and a recipient to create a connection.</div>`; return;
    }
    let body=`<h3>Selected Connection</h3><div class="network-connection-grid">
      <div class="network-kv"><div class="k">Source</div><div class="v">${esc(s?.name||"—")}</div></div>
      <div class="network-kv"><div class="k">Recipient</div><div class="v">${esc(r?.name||"—")}</div></div>
      <div class="network-kv"><div class="k">Surplus</div><div class="v">${s?fmt(s.surplusMeals,0)+" meals":"—"}</div></div>
      <div class="network-kv"><div class="k">Capacity</div><div class="v">${r?fmt(r.capacityMeals,0)+" meals":"—"}</div></div></div>`;
    if(!s || !r){ body+=`<div class="network-hint">${s?"Select a recipient to complete the connection.":"Select a surplus source to complete the connection."}</div>`; el.innerHTML=body; return; }
    const c=state.connection;
    const badge=c.status==="ready"?`<span class="network-badge ok">✓ Compatible · Route ready</span>`:c.status==="incompatible"?`<span class="network-badge err">× Incompatible</span>`:`<span class="network-badge warn">${c.status==="loading"?"Calculating route…":"Route unavailable"}</span>`;
    body+=`<div class="network-connection-grid" style="margin-top:8px">
      <div class="network-kv"><div class="k">Compatibility</div><div class="v">${badge}</div></div>
      <div class="network-kv"><div class="k">Road route</div><div class="v">${c.route?fmt(c.route.distanceKm,2)+" km":"—"}</div></div></div>`;
    if(c.route) body+=`<div class="network-hint">Estimated travel duration: ${fmt(c.route.durationMinutes,0)} min.</div>`;
    else if(c.error) body+=`<div class="network-hint">${esc(c.error)}</div>`;
    const ready=c.status==="ready"&&c.route;
    body+=`<button type="button" id="networkContinueBtn" class="network-continue" ${ready?"":"disabled"}>${c.status==="loading"?"Calculating…":"Continue →"}</button>`;
    el.innerHTML=body;
    $("networkContinueBtn").addEventListener("click",handleContinue);
  }

  async function recalc() {
    const s=state.selectedSourceId?data().getById(state.selectedSourceId):null;
    const r=state.selectedRecipientId?data().getById(state.selectedRecipientId):null;
    const token=++state.token; clearRoute();
    state.connection={status:"idle",compatibility:null,route:null,error:null};
    if(!s||!r){renderConnection();return;}
    const score=window.Byte2BiteMatcher.compatibilityScore(s.foodType,r.acceptedFoodTypes);
    state.connection.compatibility=score;
    if(score<=0){state.connection.status="incompatible";state.connection.error="These food types are not compatible for this connection.";renderConnection();return;}
    if((num(s.surplusMeals)||0)<=0||(num(r.capacityMeals)||0)<=0){state.connection.status="error";state.connection.error="Source surplus or recipient capacity is zero.";renderConnection();return;}
    state.connection.status="loading";renderConnection();
    try {
      const route=await window.Byte2BiteRouting.getRoadRoute(s,r);
      if(token!==state.token)return;
      if(!route||!Array.isArray(route.geometry)||!Number.isFinite(Number(route.distanceKm))||!Number.isFinite(Number(route.durationMinutes))){
        state.connection={status:"error",compatibility:score,route:null,error:"Route unavailable — no valid road route was returned."};
      } else {
        state.connection={status:"ready",compatibility:score,route,error:null}; drawRoute(route);
      }
    } catch(e) {
      if(token!==state.token)return;
      state.connection={status:"error",compatibility:score,route:null,error:"Route unavailable — routing service could not return a route."};
    }
    renderConnection();
  }

  function selectSource(id){ state.selectedSourceId=id; state.token++; state.connection={status:"idle",compatibility:null,route:null,error:null}; renderLists(); recalc(); }
  function selectRecipient(id){ state.selectedRecipientId=id; state.token++; state.connection={status:"idle",compatibility:null,route:null,error:null}; renderLists(); recalc(); }

  function operationFromState() {
    const s=data().getById(state.selectedSourceId), r=data().getById(state.selectedRecipientId), route=state.connection.route;
    if(!s||!r||state.connection.status!=="ready"||!route) return null;
    const surplus=num(s.surplusMeals), capacity=num(r.capacityMeals), distance=num(route.distanceKm), duration=num(route.durationMinutes);
    if([surplus,capacity,distance,duration].some(x=>x===null)||state.connection.compatibility<=0)return null;
    const planned=Math.min(surplus,capacity);
    return {id:"op_"+Date.now()+"_"+Math.random().toString(36).slice(2,8),createdAt:new Date().toISOString(),sourceId:s.id,recipientId:r.id,sourceName:s.name,recipientName:r.name,foodType:s.foodType,surplusMeals:surplus,recipientCapacity:capacity,allocatedMeals:planned,compatibility:state.connection.compatibility,distanceKm:distance,durationMinutes:duration};
  }

  function handleContinue(){
    const pair=`${state.selectedSourceId}::${state.selectedRecipientId}`;
    const existing=Store.read().slice().reverse().find(x=>x.sourceId===state.selectedSourceId&&x.recipientId===state.selectedRecipientId);
    if(state.sessionSavedPairs.has(pair)&&existing){Store.setActive(existing.id);showReport(existing.id);return;}
    const op=operationFromState();
    if(!op){toast("Connection is not ready to save.");return;}
    const ops=Store.read(); ops.push(op);
    if(!Store.write(ops)){toast("Could not save this operation in browser storage.");return;}
    state.sessionSavedPairs.add(pair); Store.setActive(op.id); showReport(op.id); toast("Operation saved.");
  }

  function overview(ops){
    return {
      count:ops.length,
      allocation:ops.reduce((a,o)=>a+Math.min(num(o.surplusMeals)||0,num(o.recipientCapacity)||0),0),
      surplus:ops.reduce((a,o)=>a+(num(o.surplusMeals)||0),0),
      capacity:ops.reduce((a,o)=>a+(num(o.recipientCapacity)||0),0),
      distance:ops.reduce((a,o)=>a+(num(o.distanceKm)||0),0),
      duration:ops.reduce((a,o)=>a+(num(o.durationMinutes)||0),0)
    };
  }

  function insights(op, totals){
    const out=[], s=num(op.surplusMeals)||0, c=num(op.recipientCapacity)||0, p=Math.min(s,c);
    if(p<s)out.push(["Unallocated surplus",`${p} planned meals are below the ${s} meals of available source surplus; ${s-p} meals remain unallocated in this plan.`]);
    if(p<c)out.push(["Unused recipient capacity",`${p} planned meals are below the recipient capacity of ${c} meals; ${c-p} meals of capacity remain unused in this plan.`]);
    if(num(op.distanceKm)>0&&num(op.durationMinutes)>0)out.push(["Road route",`The saved road route is ${fmt(op.distanceKm,2)} km with an estimated travel duration of ${fmt(op.durationMinutes,0)} minutes.`]);
    if(totals.count>1)out.push(["Saved network history",`${totals.count} network operations are saved across ${new Set((Store.read()).map(x=>x.sourceId)).size} unique sources and ${new Set((Store.read()).map(x=>x.recipientId)).size} unique recipients.`]);
    return out.slice(0,4);
  }

  function showReport(id){
    const op=Store.find(id); if(!op){Store.setActive(null);return showSelection();}
    $("networkSelectionView").hidden=true; $("networkReportView").hidden=false;
    $("reportMeta").textContent=`Operation ${op.id} · ${new Date(op.createdAt).toLocaleString("en-GB")}`;
    const ops=Store.read(), t=overview(ops), p=Math.min(num(op.surplusMeals)||0,num(op.recipientCapacity)||0);
    const insightsHtml=insights(op,t).map(i=>`<div class="network-insight"><strong>${esc(i[0])}</strong>${esc(i[1])}</div>`).join("")||`<div class="network-empty">No additional observations for this operation.</div>`;
    $("networkReportBody").innerHTML=`
      <section class="network-report-section"><div class="network-label">CONNECTION</div><h2>Connection Overview</h2>
        <div class="network-report-grid">
          ${metric("Source",op.sourceName)}${metric("Recipient",op.recipientName)}${metric("Food",pretty(op.foodType))}${metric("Compatibility","Compatible")}
        </div>
      </section>
      <section class="network-report-section"><div class="network-label">PLANNING</div><h2>Distribution Summary</h2>
        <div class="network-report-grid">${metric("Available surplus",fmt(op.surplusMeals,0)+" meals")}${metric("Recipient capacity",fmt(op.recipientCapacity,0)+" meals")}${metric("Planned allocation",fmt(p,0)+" meals")}${metric("Remaining source surplus",fmt(Math.max(0,(num(op.surplusMeals)||0)-p),0)+" meals")}${metric("Remaining recipient capacity",fmt(Math.max(0,(num(op.recipientCapacity)||0)-p),0)+" meals")}</div>
        <p class="network-report-note">Planned allocation is a planning quantity, not an actual completed redistribution.</p>
      </section>
      <section class="network-report-section"><div class="network-label">LOGISTICS</div><h2>Route Summary</h2>
        <div class="network-route-box"><div class="network-route-node">${esc(op.sourceName)}</div><div class="network-route-mid">→<br><b>${fmt(op.distanceKm,2)} km</b> · ${fmt(op.durationMinutes,0)} min</div><div class="network-route-node">${esc(op.recipientName)}</div></div>
        <p class="network-report-note">Distance and duration are road-routing estimates saved with this operation.</p>
      </section>
      <section class="network-report-section"><div class="network-label">NETWORK OVERVIEW</div><h2>Operational Summary</h2>
        <div class="network-report-grid">${metric("Saved operations",t.count)}${metric("Total planned allocation",fmt(t.allocation,0)+" meals")}${metric("Planned surplus represented",fmt(t.surplus,0)+" meals")}${metric("Recipient capacity represented",fmt(t.capacity,0)+" meals")}${metric("Route distance",fmt(t.distance,2)+" km")}${metric("Estimated travel duration",fmt(t.duration,0)+" min")}</div>
      </section>
      <section class="network-report-section"><div class="network-label">OBSERVATIONS</div><h2>Network Insights</h2><div class="network-insights">${insightsHtml}</div></section>`;
    renderOps();
  }

  function metric(k,v){return `<div class="network-report-metric"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`;}

  function renderOps(){
    const body=$("networkOpsBody"), ops=Store.read().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    if(!ops.length){body.innerHTML=`<div class="network-empty">No saved network operations yet. Complete a source-to-recipient connection to generate network insights.</div>`;return;}
    body.innerHTML=`<div class="network-ops-table-wrap"><table class="network-ops-table"><thead><tr><th>Date</th><th>Source</th><th>Recipient</th><th>Food</th><th>Planned</th><th>Distance</th><th>Actions</th></tr></thead><tbody>${
      ops.map(o=>`<tr><td>${esc(new Date(o.createdAt).toLocaleDateString("en-GB"))}</td><td>${esc(o.sourceName)}</td><td>${esc(o.recipientName)}</td><td>${esc(pretty(o.foodType))}</td><td>${fmt(o.allocatedMeals,0)}</td><td>${fmt(o.distanceKm,2)} km</td><td><div class="network-table-actions"><button type="button" data-open="${esc(o.id)}">Open</button><button type="button" data-delete="${esc(o.id)}">Delete</button></div></td></tr>`).join("")
    }</tbody></table></div>`;
    body.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>{Store.setActive(b.dataset.open);showReport(b.dataset.open)}));
    body.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>openDelete(b.dataset.delete)));
  }

  let deleteId=null, deleteTrigger=null;
  function openDelete(id){deleteId=id;deleteTrigger=document.activeElement;$("deleteMessage").textContent="This removes only the saved operation. Source and recipient data are not affected.";$("networkDeleteModal").hidden=false;$("networkDeleteConfirm").focus();}
  function closeDelete(){ $("networkDeleteModal").hidden=true; if(deleteTrigger)deleteTrigger.focus(); deleteId=null; }
  function confirmDelete(){
    if(!deleteId)return; const id=deleteId, next=Store.read().filter(x=>x.id!==id); Store.write(next);
    if(Store.active()===id){Store.setActive(null);closeDelete();showSelection();toast("Operation deleted.");}
    else{closeDelete();renderOps();toast("Operation deleted.");}
  }

  function showSelection(){
    $("networkReportView").hidden=true;$("networkSelectionView").hidden=false;
    if(window.byte2biteMap)setTimeout(()=>window.byte2biteMap.invalidateSize(),50);
  }

  function wireMarkers(){
    if(!window.Byte2BiteMarkers)return;
    window.Byte2BiteMarkers.sourceMarkers?.forEach((m,id)=>m.on("click",()=>selectSource(id)));
    window.Byte2BiteMarkers.recipientMarkers?.forEach((m,id)=>m.on("click",()=>selectRecipient(id)));
  }

  function restore(){
    const id=Store.active(); if(!id)return;
    const op=Store.find(id);
    if(op && op.sourceId && op.recipientId && Number.isFinite(Number(op.distanceKm)) && Number.isFinite(Number(op.durationMinutes)))showReport(id);
    else Store.setActive(null);
  }

  function init(){
    $("networkDate").textContent=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
    renderStats();renderLists();renderConnection();wireMarkers();restore();
    $("networkBackBtn").addEventListener("click",()=>{Store.setActive(null);showSelection();});
    $("networkDeleteCancel").addEventListener("click",closeDelete);
    $("networkDeleteConfirm").addEventListener("click",confirmDelete);
    $("networkDeleteModal").querySelector(".network-modal__backdrop").addEventListener("click",closeDelete);
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("networkDeleteModal").hidden)closeDelete();});
    if(window.byte2biteMap)setTimeout(()=>window.byte2biteMap.invalidateSize(),100);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();