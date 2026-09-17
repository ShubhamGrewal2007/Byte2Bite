const STORAGE_KEY="byte2bite_efficiency_records";
const TH={overproductionPercent:5,materialWastePercent:8,downtimeMinutes:30,energyPerUnit:.25,processingTimeMinutes:120,storageTemperature:{warningMin:2,warningMax:8,attentionMin:0,attentionMax:10},storageHumidity:{warningMin:40,warningMax:70,attentionMin:30,attentionMax:80}};
const $=s=>document.querySelector(s);
const els={score:$("#score"),scoreBar:$("#scoreBar"),prod:$("#productionEfficiency"),waste:$("#materialWaste"),energy:$("#energyUsage"),energyUnit:$("#energyUnit"),bars:$("#bars"),source:$("#sourcePill"),issues:$("#issues"),issueCount:$("#issueCount"),monitoring:$("#monitoring"),latest:$("#latestDate"),insights:$("#insights"),insightCount:$("#insightCount"),history:$("#history"),empty:$("#emptyHistory")};
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const pct=(a,b)=>b>0?a/b*100:0;
function prodEff(r){return pct(n(r.actualProduction),n(r.plannedProduction))}
function wastePct(r){return pct(n(r.rawMaterialWaste),n(r.rawMaterialUsed))}
function energyUnit(r){return n(r.actualProduction)>0?n(r.energyUsedKwh)/n(r.actualProduction):0}
function variance(r){return n(r.actualProduction)-n(r.plannedProduction)}
function productionScore(r){return Math.min(prodEff(r)/100,1)}
function wasteScore(r){return Math.max(0,1-wastePct(r)/20)}
function energyScore(r){return Math.max(0,1-energyUnit(r)/.3)}
function downScore(r){return Math.max(0,1-n(r.machineDowntimeMinutes)/60)}
function recordScore(r){return (productionScore(r)+wasteScore(r)+energyScore(r)+downScore(r))/4}
function sortRecords(a,b){return String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id))}
const DataService={
 async loadDemoData(){const res=await fetch("./efficiency.json");if(!res.ok)throw Error("Could not load efficiency.json");return await res.json()},
 loadUserData(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]").filter(x=>x&&x.id)}catch{return[]}},
 getDeleted(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY+"_deleted")||"[]")}catch{return[]}},
 getAllRecords(demo){const deleted=new Set(this.getDeleted());return [...demo.filter(r=>!deleted.has(r.id)).map(r=>({...r,_source:"demo"})),...this.loadUserData().map(r=>({...r,_source:"user"}))].sort(sortRecords)},
 saveUserRecord(r){const arr=this.loadUserData();if(arr.some(x=>x.id===r.id))return false;arr.push(r);localStorage.setItem(STORAGE_KEY,JSON.stringify(arr));return true},
 deleteUserRecord(id){const arr=this.loadUserData().filter(r=>r.id!==id);localStorage.setItem(STORAGE_KEY,JSON.stringify(arr));return true}
};
function status(label,value,type){return `<article class="monitor-card"><div><span>${label}</span><strong>${value}</strong></div><em class="status ${type}">${type==="ok"?"Normal":type==="warning"?"Warning":"Attention"}</em></article>`}
function getStatus(value,warning,attention,mode="high"){if(mode==="range"){if(value<attention[0]||value>attention[1])return"attention";if(value<warning[0]||value>warning[1])return"warning";return"ok"}return value>=attention?"attention":value>=warning?"warning":"ok"}
function detect(r){
 const out=[];
 if(n(r.plannedProduction)>0&&variance(r)/n(r.plannedProduction)*100>=TH.overproductionPercent)out.push({cat:"Overproduction",severity:"warning",value:variance(r)/n(r.plannedProduction)*100,detail:`Actual production is ${ (variance(r)/n(r.plannedProduction)*100).toFixed(1)}% above planned.`});
 if(wastePct(r)>=TH.materialWastePercent)out.push({cat:"Material Loss",severity:wastePct(r)>=TH.materialWastePercent*2?"attention":"warning",value:wastePct(r),detail:`Material waste is ${wastePct(r).toFixed(1)}% of material used.`});
 if(n(r.machineDowntimeMinutes)>=TH.downtimeMinutes)out.push({cat:"Machine Downtime",severity:n(r.machineDowntimeMinutes)>=TH.downtimeMinutes*2?"attention":"warning",value:n(r.machineDowntimeMinutes),detail:`Machine downtime reached ${n(r.machineDowntimeMinutes)} minutes.`});
 if(energyUnit(r)>=TH.energyPerUnit)out.push({cat:"Energy Inefficiency",severity:energyUnit(r)>=TH.energyPerUnit*2?"attention":"warning",value:energyUnit(r),detail:`Energy use reached ${energyUnit(r).toFixed(2)} kWh per unit produced.`});
 return out;
}
function allIssues(rs){return rs.flatMap(r=>detect(r).map(x=>({...x,id:r.id,date:r.date,meal:r.meal})))}
function renderDashboard(rs){
 const valid=rs.filter(r=>r.actualProduction!==undefined);
 const score=valid.length?valid.reduce((a,r)=>a+recordScore(r),0)/valid.length*100:0;
 els.score.textContent=valid.length?score.toFixed(0):"—";els.scoreBar.style.width=`${Math.max(0,Math.min(score,100))}%`;
 els.prod.textContent=valid.length?`${valid.reduce((a,r)=>a+prodEff(r),0)/valid.length.toFixed(0)}`:"—";
 const used=valid.reduce((a,r)=>a+n(r.rawMaterialUsed),0),w=valid.reduce((a,r)=>a+n(r.rawMaterialWaste),0),e=valid.reduce((a,r)=>a+n(r.energyUsedKwh),0),p=valid.reduce((a,r)=>a+n(r.actualProduction),0);
 els.prod.textContent=valid.length?(valid.reduce((a,r)=>a+prodEff(r),0)/valid.length).toFixed(1):"—";
 els.waste.textContent=used?(w/used*100).toFixed(1):"—";els.energy.textContent=e?e.toFixed(0):"—";els.energyUnit.textContent=p?`${(e/p).toFixed(2)} kWh per unit produced`:"—";
 els.source.textContent=`Demo Data: ${rs.filter(r=>r._source==="demo").length} · Added by User: ${rs.filter(r=>r._source==="user").length}`;
 const last=rs.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-7);
 const max=Math.max(1,...last.flatMap(r=>[n(r.expectedServings),n(r.plannedProduction),n(r.actualProduction)]));
 els.bars.innerHTML=last.length?last.map(r=>`<div class="bar-group" title="${r.date} · ${r.meal}"><div class="bar expected" style="height:${n(r.expectedServings)/max*100}%"></div><div class="bar planned" style="height:${n(r.plannedProduction)/max*100}%"></div><div class="bar actual" style="height:${n(r.actualProduction)/max*100}%"></div></div>`).join(""):`<div class="empty">No chart data</div>`;
 const material=used?100-w/used*100:0, ep=p?e/p:0, down=valid.length?valid.reduce((a,r)=>a+n(r.machineDowntimeMinutes),0)/valid.length:0;
 const energyPct=Math.max(0,Math.min(100,(1-ep/.3)*100)), machinePct=Math.max(0,Math.min(100,(1-down/60)*100));
 $("#resourceMaterial").textContent=used?`${material.toFixed(1)}% efficient`:"—";$("#resourceMaterialBar").style.width=`${material}%`;
 $("#resourceEnergy").textContent=p?`${ep.toFixed(2)} kWh/unit`:"—";$("#resourceEnergyBar").style.width=`${energyPct}%`;
 $("#resourceMachine").textContent=valid.length?`${down.toFixed(0)} min avg downtime`:"—";$("#resourceMachineBar").style.width=`${machinePct}%`;
 renderSpark(last.map(recordScore));
}
function renderSpark(vals){const svg=$("#spark");if(vals.length<3){svg.innerHTML='<text x="8" y="50" fill="#8a968f" font-size="10">Add at least 3 dated records for a trend.</text>';return}const min=Math.min(...vals),max=Math.max(...vals),range=max-min||1;const pts=vals.map((v,i)=>`${i/(vals.length-1)*350+5},${88-(v-min)/range*70}`).join(" ");svg.innerHTML=`<polyline points="${pts}" fill="none" stroke="#35654b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;}
function renderIssues(rs){const issues=allIssues(rs);const groups={};issues.forEach(i=>{groups[i.cat]??=[];groups[i.cat].push(i)});els.issueCount.textContent=`${issues.length} issue${issues.length===1?"":"s"}`;els.issues.innerHTML=Object.keys(groups).length?Object.entries(groups).map(([cat,list])=>{const sev=list.some(x=>x.severity==="attention")?"attention":"warning";return `<article class="issue-card"><span class="tag ${sev}">${sev==="attention"?"Attention":"Warning"}</span><h3>${cat}</h3><strong>${list.length}</strong><p>affected cycle${list.length===1?"":"s"} · ${list.map(x=>x.date).join(", ")}</p></article>`}).join(""):`<article class="issue-card"><span class="tag ok">Normal</span><h3>No immediate inefficiencies</h3><p>Recorded operations are within the configured prototype thresholds.</p></article>`}
function renderMonitoring(rs){const r=rs[0];if(!r){els.monitoring.innerHTML='<div class="empty">No recorded conditions.</div>';els.latest.textContent="—";return}els.latest.textContent=`Latest recorded: ${r.date}`;const p=getStatus(Math.max(0,-variance(r)/Math.max(1,n(r.plannedProduction))),0,999);const prod=p==="attention"?"Attention":"ok";const proc=getStatus(n(r.processingTimeMinutes),TH.processingTimeMinutes,TH.processingTimeMinutes*1.5);const temp=getStatus(n(r.storageTemperature),TH.storageTemperature.warningMax,TH.storageTemperature.attentionMax,"range");const hum=getStatus(n(r.storageHumidity),TH.storageHumidity.warningMax,TH.storageHumidity.attentionMax,"range");const down=getStatus(n(r.machineDowntimeMinutes),TH.downtimeMinutes,TH.downtimeMinutes*2);const en=getStatus(energyUnit(r),TH.energyPerUnit,TH.energyPerUnit*2);els.monitoring.innerHTML=[status("Production",`${n(r.actualProduction)} actual`,prod),status("Processing Time",`${n(r.processingTimeMinutes)} min`,proc),status("Storage Temperature",`${n(r.storageTemperature)} °C`,temp),status("Storage Humidity",`${n(r.storageHumidity)} %`,hum),status("Machine Downtime",`${n(r.machineDowntimeMinutes)} min`,down),status("Energy Usage",`${n(r.energyUsedKwh)} kWh · ${energyUnit(r).toFixed(2)}/unit`,en)].join("")}
function renderInsights(rs){const issues=allIssues(rs),map={};issues.forEach(i=>{map[i.cat]??={count:0,severity:"warning"};map[i.cat].count++;if(i.severity==="attention")map[i.cat].severity="attention"});const copy={Overproduction:["Review production planning","Align planned quantities more closely with expected servings and recent demand."],"Material Loss":["Review material preparation","Check preparation, trimming and batch handling for avoidable material loss."],"Machine Downtime":["Review equipment maintenance","Inspect recurring downtime causes and maintenance scheduling."],"Energy Inefficiency":["Review energy-intensive operations","Review equipment use, processing time and avoidable energy consumption."]};const cards=Object.entries(map).sort((a,b)=>(b[1].severity==="attention")-(a[1].severity==="attention")).slice(0,4);els.insightCount.textContent=cards.length;els.insights.innerHTML=cards.length?cards.map(([cat,v])=>`<article class="insight-card"><span class="tag ${v.severity}">${v.severity==="attention"?"Attention":"Warning"}</span><h3>${copy[cat][0]}</h3><p>${copy[cat][1]} Affected cycles: ${v.count}.</p></article>`).join(""):`<article class="insight-card"><span class="tag ok">Normal</span><h3>No immediate recommendations</h3><p>Current recorded operations are within the configured prototype thresholds.</p></article>`}
function renderHistory(rs){els.history.innerHTML=rs.length?rs.map(r=>`<tr><td>${r.date}</td><td>${r.meal}</td><td>${n(r.plannedProduction)}</td><td>${n(r.actualProduction)}</td><td>${wastePct(r).toFixed(1)}%</td><td>${n(r.machineDowntimeMinutes)} min</td><td>${n(r.energyUsedKwh).toFixed(0)} kWh</td><td><span class="badge ${detect(r).length?"warning":"ok"}">${detect(r).length?"Review":"Normal"}</span></td><td><span class="badge">${r._source==="user"?"Added by User":"Demo Data"}</span></td><td><button class="action-btn" data-view="${r.id}">View Details</button>${r._source==="user"?`<button class="action-btn" data-delete="${r.id}">Delete</button>`:""}</td></tr>`).join(""):"";els.empty.classList.toggle("hidden",rs.length>0);$("#emptyAdd").onclick=()=>openModal("formModal")}
function detail(r){const groups={Basic:[["Date",r.date],["Meal",r.meal],["Source",r._source==="user"?"Added by User":"Demo Data"]],Production:[["Expected Servings",r.expectedServings],["Planned Production",r.plannedProduction],["Actual Production",r.actualProduction],["Variance",variance(r)],["Efficiency",`${prodEff(r).toFixed(1)}%`]],Materials:[["Planned",r.rawMaterialPlanned],["Used",r.rawMaterialUsed],["Waste",r.rawMaterialWaste],["Waste %",`${wastePct(r).toFixed(1)}%`]],Operations:[["Processing Time",r.processingTimeMinutes+" min"],["Downtime",r.machineDowntimeMinutes+" min"]],Energy:[["Used",r.energyUsedKwh+" kWh"],["Energy / Unit",energyUnit(r).toFixed(2)+" kWh"]],Storage:[["Temperature",r.storageTemperature+" °C"],["Humidity",r.storageHumidity+" %"]],Notes:[["Notes",r.notes||"—"]]};$("#detailBody").innerHTML=Object.entries(groups).map(([g,rows])=>`<div class="detail-group"><h3>${g}</h3>${rows.map(x=>`<div class="detail-row"><span>${x[0]}</span><strong>${x[1]??"—"}</strong></div>`).join("")}</div>`).join("");openModal("detailModal")}
function openModal(id){$( "#"+id).classList.remove("hidden")}function closeModal(id){$("#"+id).classList.add("hidden")}
let demo=[],pendingDelete=null,timer;
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(timer);timer=setTimeout(()=>t.classList.remove("show"),2500)}
function refresh(){const rs=DataService.getAllRecords(demo);renderDashboard(rs);renderIssues(rs);renderMonitoring(rs);renderInsights(rs);renderHistory(rs)}
async function init(){
  try{
    demo=await DataService.loadDemoData();
    refresh();
  }catch(e){
    console.error(e);
    // Surface the real error so the page never sits on "Loading data…".
    els.source.textContent = "Data load error: " + (e && e.message ? e.message : String(e));
    els.history.innerHTML=`<tr><td colspan="10">Could not load efficiency.json. ${e && e.message ? e.message : ""}</td></tr>`;
  }
}
$("#addBtn").onclick=()=>{const f=$("#dataForm");f.reset();$("#fDate").value=new Date().toISOString().slice(0,10);$("#formError").textContent="";openModal("formModal")};
document.addEventListener("click",e=>{const c=e.target.closest("[data-close]");if(c)closeModal(c.dataset.close);if(e.target.classList.contains("modal-backdrop"))closeModal(e.target.id);const v=e.target.closest("[data-view]");if(v){const r=DataService.getAllRecords(demo).find(x=>x.id===v.dataset.view);if(r)detail(r)}const d=e.target.closest("[data-delete]");if(d){pendingDelete=d.dataset.delete;openModal("deleteModal")}});
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".modal-backdrop:not(.hidden)").forEach(m=>closeModal(m.id))});
$("#dataForm").onsubmit=e=>{e.preventDefault();const vals={date:$("#fDate").value,meal:$("#fMeal").value,expectedServings:n($("#fExpected").value),plannedProduction:n($("#fPlanned").value),actualProduction:n($("#fActual").value),rawMaterialPlanned:n($("#fRMPlan").value),rawMaterialUsed:n($("#fRMUsed").value),rawMaterialWaste:n($("#fRMWaste").value),processingTimeMinutes:n($("#fProcessing").value),machineDowntimeMinutes:n($("#fDowntime").value),energyUsedKwh:n($("#fEnergy").value),storageTemperature:n($("#fTemp").value),storageHumidity:n($("#fHumidity").value),notes:$("#fNotes").value.trim()};let err="";if(!vals.date)err="Date is required.";else if(Object.values(vals).some(v=>typeof v==="number"&&v<0))err="Numeric values cannot be negative.";else if(vals.rawMaterialWaste>vals.rawMaterialUsed)err="Raw material waste cannot exceed material used.";else if(vals.storageTemperature<-20||vals.storageTemperature>40)err="Temperature must be between -20°C and 40°C.";else if(vals.storageHumidity<0||vals.storageHumidity>100)err="Humidity must be between 0% and 100%.";if(err){$("#formError").textContent=err;return}const r={id:`user-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,...vals};if(DataService.saveUserRecord(r)){closeModal("formModal");toast("Operational data added successfully.");refresh()}else $("#formError").textContent="Could not save this record."};
$("#confirmDelete").onclick=()=>{if(pendingDelete){DataService.deleteUserRecord(pendingDelete);pendingDelete=null;closeModal("deleteModal");toast("Operational record deleted.");refresh()}};
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");

// Run init after the DOM is ready. The script tag already has
// defer, but this guards against being loaded without it.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


/* ============================================================
   EFFICIENCY — TASK 1: HEADER + ACCOUNT UI
   Additive only. Nothing above this line is modified.
   Uses the same shared auth layer Dashboard/Plan/Surplus use.
   ============================================================ */

// -------- Header date — same format as Dashboard.renderCurrentDate --------
(function renderHeaderDate() {
  const el = document.getElementById("headerDate");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
})();

// -------- Account identity — same contract as Dashboard.renderHeaderIdentity --------
(function initEfficiencyIdentity() {
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
  // Same events Dashboard listens for.
  window.addEventListener("byte2bite:authenticated", render);
  window.addEventListener("byte2bite:auth-required", render);
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
      topWrapper_append();
    }
    dropdown.classList.remove("kitchen-dropdown--sidebar");
    activeTrigger = null;
  }

  function topWrapper_append() {
    topWrap.appendChild(dropdown);
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