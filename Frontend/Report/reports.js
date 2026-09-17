(() => {
"use strict";

const STATE_KEY = "byte2bite_reports_state";
const NETWORK_KEY = "byte2bite_network_operations";
const PAGE_SIZE = 15;
const INSIGHT_CONFIG = { MIN_RECORDS_FOR_TREND: 3, MIN_RELATIVE_CHANGE: 0.05 };

const demoFallback = [
  ["2026-09-15","Breakfast",320,330,10,3.2,72],
  ["2026-09-15","Lunch",480,505,25,5.1,118],
  ["2026-09-15","Dinner",390,382,0,2.4,91],
  ["2026-09-16","Breakfast",315,318,3,2.9,69],
  ["2026-09-16","Lunch",500,515,15,4.2,121],
  ["2026-09-16","Dinner",400,414,14,3.8,96],
  ["2026-09-17","Lunch",510,528,18,4.8,124]
];

const $ = id => document.getElementById(id);
const num = v => Number.isFinite(Number(v)) ? Number(v) : null;
const sum = (arr,key) => arr.reduce((a,r)=>a+(num(r?.[key])||0),0);
const fmt = (v, unit="") => v == null || !Number.isFinite(Number(v)) ? "—" : `${Number(v).toLocaleString(undefined,{maximumFractionDigits:2})}${unit}`;
const esc = s => String(s ?? "—").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function readJSON(key, fallback=null){
  try { const v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function saveState(state){ try { localStorage.setItem(STATE_KEY,JSON.stringify(state)); } catch {} }

function normalizeRecord(r,i){
  if(!r) return null;
  const planning = r.planning || {};
  const surplus = r.surplus || {};
  const efficiency = r.efficiency || {};
  const impact = r.impact || {};
  const network = r.network || null;
  return {
    id:r.id ?? `report-${i+1}`, date:String(r.date||"").slice(0,10), meal:r.meal||"—",
    planning:{expectedServings:num(planning.expectedServings),plannedProduction:num(planning.plannedProduction),actualProduction:num(planning.actualProduction)},
    surplus:{surplusMeals:num(surplus.surplusMeals),redistributedMeals:num(surplus.redistributedMeals),remainingSurplus:num(surplus.remainingSurplus)},
    efficiency:{productionEfficiency:num(efficiency.productionEfficiency),materialWaste:num(efficiency.materialWaste),materialWastePercentage:num(efficiency.materialWastePercentage),downtimeMinutes:num(efficiency.downtimeMinutes),energyUsedKwh:num(efficiency.energyUsedKwh)},
    impact:{foodWastePrevented:num(impact.foodWastePrevented),surplusRecovered:num(impact.surplusRecovered),materialWaste:num(impact.materialWaste),energyUsedKwh:num(impact.energyUsedKwh),estimatedCarbonImpact:num(impact.estimatedCarbonImpact)},
    network, source:r.source||{planning:"demo",surplus:"demo",efficiency:"demo",impact:"demo",network:network?"operational":"none"}
  };
}

function loadRaw(){
  const network = readJSON(NETWORK_KEY,[]);
  const reports = readJSON("byte2bite_reports_data",null);
  if(Array.isArray(reports) && reports.length) return {records:reports.map(normalizeRecord).filter(Boolean),network:Array.isArray(network)?network:[]};
  const demo = demoFallback.map((x,i)=>normalizeRecord({
    id:`demo-${i+1}`,date:x[0],meal:x[1],
    planning:{expectedServings:x[2],plannedProduction:x[2],actualProduction:x[3]},
    surplus:{surplusMeals:x[4],redistributedMeals:Math.max(0,x[4]-2),remainingSurplus:Math.min(2,x[4])},
    efficiency:{productionEfficiency:x[2]?x[3]/x[2]*100:null,materialWaste:x[5],materialWastePercentage:null,downtimeMinutes:null,energyUsedKwh:x[6]},
    impact:{foodWastePrevented:0,surplusRecovered:Math.max(0,x[4]-2),materialWaste:x[5],energyUsedKwh:x[6],estimatedCarbonImpact:null},
    source:{planning:"demo",surplus:"demo",efficiency:"demo",impact:"demo",network:"none"}
  },i));
  return {records:demo,network:Array.isArray(network)?network:[]};
}

function getState(){ return Object.assign({period:"all",customFrom:"",customTo:""},readJSON(STATE_KEY,{})||{}); }

function periodData(all,state){
  const valid=all.filter(r=>r.date);
  if(!valid.length) return [];
  if(state.period==="all") return valid;
  const dates=valid.map(r=>r.date).sort();
  let from,to;
  if(state.period==="custom"){from=state.customFrom;to=state.customTo;if(!from||!to||from>to)return valid;}
  else {const anchor=dates[dates.length-1]; const d=new Date(anchor+"T00:00:00"); d.setDate(d.getDate()-(state.period==="last7"?6:29)); from=d.toISOString().slice(0,10);to=anchor;}
  return valid.filter(r=>r.date>=from&&r.date<=to);
}
function networkForPeriod(ops,records){const dates=records.map(r=>r.date);if(!dates.length)return [];const min=dates.sort()[0],max=dates.sort().slice(-1)[0];return ops.filter(o=>String(o.createdAt||o.date||"").slice(0,10)>=min&&String(o.createdAt||o.date||"").slice(0,10)<=max);}

function summary(rs,ns){
  const planned=sum(rs.map(r=>r.planning),"plannedProduction"), actual=sum(rs.map(r=>r.planning),"actualProduction");
  const surplus=sum(rs.map(r=>r.surplus),"surplusMeals"), recovered=sum(rs.map(r=>r.impact),"surplusRecovered");
  const food=sum(rs.map(r=>r.impact),"foodWastePrevented"), material=sum(rs.map(r=>r.impact),"materialWaste");
  const energy=sum(rs.map(r=>r.impact),"energyUsedKwh"), carbon=sum(rs.map(r=>r.impact),"estimatedCarbonImpact");
  return {planned,actual,surplus,recovered,food,material,energy,carbon,variance:planned!=null&&actual!=null?actual-planned:null,
    networkOps:ns.length,allocated:ns.reduce((a,o)=>a+(num(o.allocatedMeals)||0),0),
    distance:ns.reduce((a,o)=>a+(num(o.distanceKm)||0),0),duration:ns.reduce((a,o)=>a+(num(o.durationMinutes)||0),0)};
}

function insights(rs,ns){
  if(!rs.length) return [];
  const out=[];
  const half=Math.floor(rs.length/2);
  const recent=rs.slice(-Math.max(1,Math.ceil(rs.length/2))), earlier=rs.slice(0,Math.max(1,half));
  const avg=(a,k)=>{const v=a.map(r=>k(r)).filter(Number.isFinite);return v.length?v.reduce((x,y)=>x+y,0)/v.length:null};
  if(rs.length>=3){
    const a=avg(earlier,r=>r.planning.actualProduction),b=avg(recent,r=>r.planning.actualProduction);
    if(a&&b&&Math.abs(b-a)/a>=INSIGHT_CONFIG.MIN_RELATIVE_CHANGE) out.push({severity:"Informational",title:"Production trend changed",text:`Average actual production changed by ${Math.abs((b-a)/a*100).toFixed(1)}% between the earlier and recent records.`});
    const e=avg(earlier,r=>r.impact.energyUsedKwh),f=avg(recent,r=>r.impact.energyUsedKwh);
    if(e&&f&&Math.abs(f-e)/e>=.05) out.push({severity:"Attention",title:"Energy usage changed",text:`Average energy usage changed by ${Math.abs((f-e)/e*100).toFixed(1)}% between the earlier and recent records.`});
  }
  const s=summary(rs,ns);
  if(s.surplus>s.recovered) out.push({severity:"Informational",title:"Surplus remains available",text:`${fmt(s.surplus-s.recovered)} surplus meals are not represented as recovered in the selected records.`});
  if(ns.length && s.allocated>0) out.push({severity:"Informational",title:"Redistribution activity recorded",text:`${fmt(s.allocated)} meals are represented in ${ns.length} saved redistribution operation${ns.length===1?"":"s"}.`});
  return out.slice(0,4);
}

function periodLabel(state,rs){
  if(state.period==="all") return "All available records";
  if(state.period==="custom") return `${state.customFrom||"—"} to ${state.customTo||"—"}`;
  const dates=rs.map(r=>r.date).sort(); return dates.length ? `${dates[0]} to ${dates.at(-1)}` : "No records";
}

function render(){
  const raw=loadRaw(), state=getState(), rs=periodData(raw.records,state), ns=networkForPeriod(raw.network,rs), s=summary(rs,ns);
  $("overviewText").textContent=`${rs.length} record${rs.length===1?"":"s"} and ${ns.length} network operation${ns.length===1?"":"s"} in ${periodLabel(state,rs)}.`;
  $("periodLabel").textContent=periodLabel(state,rs);
  document.querySelectorAll(".period-btn").forEach(b=>b.classList.toggle("active",b.dataset.period===state.period));
  $("customRange").hidden=state.period!=="custom";
  const kpis=[
    ["Planned Production",fmt(s.planned),"Planning"],["Actual Production",fmt(s.actual),"Planning"],
    ["Surplus Generated",fmt(s.surplus),"Surplus"],["Surplus Recovered",fmt(s.recovered),"Impact"],
    ["Food Waste Prevented",fmt(s.food),"Impact"],["Material Waste",fmt(s.material),"Impact"],
    ["Energy Used",fmt(s.energy," kWh"),"Impact"],["Estimated Carbon Impact",fmt(s.carbon),"Impact"]
  ];
  $("kpis").innerHTML=kpis.map(x=>`<div class="kpi"><div class="kpi-label">${x[0]}</div><div class="kpi-value">${x[1]}</div><div class="kpi-source">${x[2]}</div></div>`).join("");
  const max=Math.max(s.planned||0,s.actual||0,1);
  $("productionVisual").innerHTML=`<div class="bar-row"><span>Planned</span><div class="bar"><i style="width:${(s.planned||0)/max*100}%"></i></div><b>${fmt(s.planned)}</b></div><div class="bar-row"><span>Actual</span><div class="bar"><i style="width:${(s.actual||0)/max*100}%"></i></div><b>${fmt(s.actual)}</b></div><div class="bar-row"><span>Surplus</span><div class="bar"><i style="width:${(s.surplus||0)/max*100}%"></i></div><b>${fmt(s.surplus)}</b></div>`;
  $("efficiencyVisual").innerHTML=`<div class="metric-list"><div class="metric-row"><span>Material waste</span><strong>${fmt(s.material)}</strong></div><div class="metric-row"><span>Energy used</span><strong>${fmt(s.energy," kWh")}</strong></div><div class="metric-row"><span>Production variance</span><strong>${fmt(s.variance)}</strong></div></div>`;
  $("impactVisual").innerHTML=`<div class="breakdown"><div>Food waste prevented<strong>${fmt(s.food)}</strong></div><div>Material waste<strong>${fmt(s.material)}</strong></div><div>Surplus recovered<strong>${fmt(s.recovered)}</strong></div><div>Carbon impact<strong>${fmt(s.carbon)}</strong></div></div>`;
  $("networkVisual").innerHTML=`<div class="metric-list"><div class="metric-row"><span>Saved operations</span><strong>${ns.length}</strong></div><div class="metric-row"><span>Allocated meals</span><strong>${fmt(s.allocated)}</strong></div><div class="metric-row"><span>Route distance</span><strong>${fmt(s.distance," km")}</strong></div><div class="metric-row"><span>Travel duration</span><strong>${fmt(s.duration," min")}</strong></div></div>`;
  const ins=insights(rs,ns); $("insights").innerHTML=ins.length?ins.map(i=>`<div class="insight ${i.severity==="Attention"?"attention":""}"><h3>${esc(i.title)} · ${i.severity}</h3><p>${esc(i.text)}</p></div>`).join(""):`<div class="empty">No immediate recommendations for this period.</div>`;
  renderFilters(raw.records); renderTables(rs,ns); renderSources(rs,ns);
}

let prodFiltered=[],netFiltered=[];
function renderFilters(all){
  const meals=[...new Set(all.map(r=>r.meal).filter(Boolean))].sort();
  $("prodMeal").innerHTML='<option value="">All meals</option>'+meals.map(m=>`<option>${esc(m)}</option>`).join("");
  const sources=[...new Set(all.flatMap(r=>Object.values(r.source||{})).filter(Boolean))].sort();
  $("prodSource").innerHTML='<option value="">All sources</option>'+sources.map(m=>`<option>${esc(m)}</option>`).join("");
}
function applyTableFilters(){
  const raw=loadRaw(),state=getState(),rs=periodData(raw.records,state);
  const q=$("prodSearch").value.toLowerCase(), meal=$("prodMeal").value, source=$("prodSource").value;
  prodFiltered=rs.filter(r=>(!q||r.meal.toLowerCase().includes(q))&&(!meal||r.meal===meal)&&(!source||Object.values(r.source||{}).includes(source)));
  prodFiltered.sort((a,b)=>$("prodSort").value==="date-asc"?a.date.localeCompare(b.date):b.date.localeCompare(a.date));
  const nq=$("netSearch").value.toLowerCase(); netFiltered=networkForPeriod(raw.network,rs).filter(o=>(!nq||`${o.sourceName||""} ${o.recipientName||""}`.toLowerCase().includes(nq)));
  netFiltered.sort((a,b)=>{const ad=String(a.createdAt||a.date||"").slice(0,10),bd=String(b.createdAt||b.date||"").slice(0,10);return $("netSort").value==="date-asc"?ad.localeCompare(bd):bd.localeCompare(ad)});
  renderTables(rs,networkForPeriod(raw.network,rs),true);
}
function renderTables(rs,ns){
  // Filters are intentionally re-applied from current controls.
  const q=$("prodSearch").value.toLowerCase(),meal=$("prodMeal").value,source=$("prodSource").value;
  prodFiltered=rs.filter(r=>(!q||r.meal.toLowerCase().includes(q))&&(!meal||r.meal===meal)&&(!source||Object.values(r.source||{}).includes(source)));
  prodFiltered.sort((a,b)=>$("prodSort").value==="date-asc"?a.date.localeCompare(b.date):b.date.localeCompare(a.date));
  const nq=$("netSearch").value.toLowerCase(); netFiltered=ns.filter(o=>(!nq||`${o.sourceName||""} ${o.recipientName||""}`.toLowerCase().includes(nq)));
  netFiltered.sort((a,b)=>{const ad=String(a.createdAt||a.date||"").slice(0,10),bd=String(b.createdAt||b.date||"").slice(0,10);return $("netSort").value==="date-asc"?ad.localeCompare(bd):bd.localeCompare(ad)});
  $("prodRows").innerHTML=prodFiltered.slice(0,PAGE_SIZE).map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.meal)}</td><td>${fmt(r.planning.plannedProduction)}</td><td>${fmt(r.planning.actualProduction)}</td><td>${fmt(r.surplus.surplusMeals)}</td><td>${fmt(r.impact.materialWaste)}</td><td>${fmt(r.impact.energyUsedKwh," kWh")}</td><td>${esc(Object.values(r.source||{})[0]||"—")}</td><td><button class="table-action" data-prod="${esc(r.id)}">Details</button></td></tr>`).join("")||`<tr><td colspan="9"><div class="empty">No matching records.</div></td></tr>`;
  $("netRows").innerHTML=netFiltered.slice(0,PAGE_SIZE).map((o,i)=>`<tr><td>${esc(String(o.createdAt||o.date||"").slice(0,10))}</td><td>${esc(o.sourceName)}</td><td>${esc(o.recipientName)}</td><td>${fmt(o.allocatedMeals)}</td><td>${o.compatibility==null?"—":fmt(o.compatibility*100,"%")}</td><td>${fmt(o.distanceKm," km")}</td><td>${fmt(o.durationMinutes," min")}</td><td><button class="table-action" data-net="${esc(o.id||i)}">Details</button></td></tr>`).join("")||`<tr><td colspan="8"><div class="empty">No matching network operations.</div></td></tr>`;
  $("prodMore").hidden=prodFiltered.length<=PAGE_SIZE;$("netMore").hidden=netFiltered.length<=PAGE_SIZE;
}
function renderSources(rs,ns){
  const sources=new Set();rs.forEach(r=>Object.values(r.source||{}).forEach(v=>v&&sources.add(v)));if(ns.length)sources.add("network localStorage");
  $("sources").innerHTML=`<div class="source-grid">${[...sources].map(s=>`<span class="source-pill">${esc(s)}</span>`).join("")||'<span class="muted">No confirmed sources.</span>'}</div>`;
}

function openDetails(type,id){
  const raw=loadRaw();
  if(type==="prod"){const r=raw.records.find(x=>String(x.id)===String(id));if(!r)return;$("modalContent").innerHTML=`<h2>${esc(r.meal)}</h2><p class="muted">${esc(r.date)}</p><div class="metric-list">${Object.entries({...r.planning,...r.surplus,...r.efficiency,...r.impact}).map(([k,v])=>`<div class="metric-row"><span>${esc(k)}</span><strong>${fmt(v)}</strong></div>`).join("")}</div>`;}
  else {const o=raw.network.find(x=>String(x.id)===String(id));if(!o)return;$("modalContent").innerHTML=`<h2>Redistribution operation</h2><p class="muted">Saved snapshot — no rerouting performed.</p><div class="metric-list">${["sourceName","recipientName","foodType","allocatedMeals","compatibility","distanceKm","durationMinutes"].map(k=>`<div class="metric-row"><span>${k}</span><strong>${fmt(o[k])}</strong></div>`).join("")}</div>`;}
  $("modal").hidden=false;
}

function generateReportData(){
  const raw=loadRaw(),state=getState(),rs=periodData(raw.records,state),ns=networkForPeriod(raw.network,rs),s=summary(rs,ns),ins=insights(rs,ns);
  const dates=rs.map(r=>r.date).sort();
  return {generatedAt:new Date().toISOString(),reportingPeriod:{type:state.period,from:dates[0]||null,to:dates.at(-1)||null,label:periodLabel(state,rs)},recordCount:rs.length,networkOperationCount:ns.length,
    summary:{plannedProduction:s.planned,actualProduction:s.actual,surplusGenerated:s.surplus,surplusRecovered:s.recovered,foodWastePrevented:s.food,materialWaste:s.material,energyUsed:s.energy,estimatedCarbonImpact:s.carbon},
    production:{expectedServings:sum(rs.map(r=>r.planning),"expectedServings"),plannedProduction:s.planned,actualProduction:s.actual,variance:s.variance},
    efficiency:{materialWaste:s.material,energyUsedKwh:s.energy,downtimeMinutes:sum(rs.map(r=>r.efficiency),"downtimeMinutes"),productionEfficiency:null},
    impact:{foodWastePrevented:s.food,surplusRecovered:s.recovered,materialWaste:s.material,energyUsedKwh:s.energy,estimatedCarbonImpact:s.carbon},
    network:{operationCount:ns.length,allocatedMeals:s.allocated,routeDistanceKm:s.distance,durationMinutes:s.duration,uniqueSources:new Set(ns.map(o=>o.sourceName)).size,uniqueRecipients:new Set(ns.map(o=>o.recipientName)).size},
    insights:ins,sources:{records:"Reports data service / demo fallback",network:ns.length?"byte2bite_network_operations":"none"},hasDemoData:true,hasAnyOperationalData:ns.length>0,
    assumptions:["Unavailable fields are shown as unavailable rather than inferred.","Carbon impact is reported only where an explicit value exists.","Network history uses saved operation snapshots and is not rerouted or rescored.","Demo fallback values are clearly synthetic."]};
}
function showReport(){
  const d=generateReportData(); window.Byte2BiteReports.currentReport=d;
  const metric=(l,v)=>`<div class="metric-row"><span>${l}</span><strong>${fmt(v)}</strong></div>`;
  $("previewContent").innerHTML=`<p class="eyebrow">Byte2Bite</p><h1 class="report-title">Operational & Sustainability Report</h1><p class="report-meta">Generated ${new Date(d.generatedAt).toLocaleString()} · ${esc(d.reportingPeriod.label)}</p>
  <section class="report-section"><h2>Executive Summary</h2><p>This report consolidates available planning, production, surplus, efficiency, sustainability and redistribution records for the selected reporting period. Values not supported by source data are left unavailable.</p></section>
  <section class="report-section"><h2>Planning & Production</h2>${metric("Planned production",d.production.plannedProduction)}${metric("Actual production",d.production.actualProduction)}${metric("Variance",d.production.variance)}</section>
  <section class="report-section"><h2>Surplus & Recovery</h2>${metric("Surplus generated",d.summary.surplusGenerated)}${metric("Surplus recovered",d.summary.surplusRecovered)}</section>
  <section class="report-section"><h2>Resource Efficiency</h2>${metric("Material waste",d.efficiency.materialWaste)}${metric("Energy used",d.efficiency.energyUsedKwh)}${metric("Downtime",d.efficiency.downtimeMinutes)}</section>
  <section class="report-section"><h2>Sustainability Impact</h2>${metric("Food waste prevented",d.impact.foodWastePrevented)}${metric("Material waste",d.impact.materialWaste)}${metric("Estimated carbon impact",d.impact.estimatedCarbonImpact)}</section>
  <section class="report-section"><h2>Redistribution Network</h2>${metric("Operations",d.network.operationCount)}${metric("Allocated meals",d.network.allocatedMeals)}${metric("Route distance (km)",d.network.routeDistanceKm)}${metric("Travel duration (min)",d.network.durationMinutes)}</section>
  <section class="report-section"><h2>Insights & Recommendations</h2>${d.insights.length?d.insights.map(i=>`<p><strong>${esc(i.severity)} — ${esc(i.title)}:</strong> ${esc(i.text)}</p>`).join(""):"<p>No immediate recommendations for this period.</p>"}</section>
  <section class="report-section"><h2>Data Sources</h2><p>Records: ${esc(d.sources.records)}<br>Network: ${esc(d.sources.network)}</p></section>
  <section class="report-section"><h2>Assumptions & Notes</h2><ul class="assumptions">${d.assumptions.map(a=>`<li>${esc(a)}</li>`).join("")}</ul></section>`;
  $("reportPreview").hidden=false;
}

document.querySelectorAll(".period-btn").forEach(b=>b.addEventListener("click",()=>{const s=getState();s.period=b.dataset.period;saveState(s);render();}));
$("applyRange").addEventListener("click",()=>{const f=$("fromDate").value,t=$("toDate").value;if(!f||!t||f>t)return;saveState({...getState(),period:"custom",customFrom:f,customTo:t});render();});
["prodSearch","prodMeal","prodSource","prodSort","netSearch","netSort"].forEach(id=>$(id).addEventListener("input",()=>renderTables(periodData(loadRaw().records,getState()),networkForPeriod(loadRaw().network,periodData(loadRaw().records,getState())))));
$("generateReportBtn").addEventListener("click",showReport);$("closePreview").addEventListener("click",()=>{$("reportPreview").hidden=true});$("printReport").addEventListener("click",()=>window.print());
$("closeModal").addEventListener("click",()=>{$("modal").hidden=true});$("modal").addEventListener("click",e=>{if(e.target.classList.contains("modal-backdrop"))$("modal").hidden=true});
document.addEventListener("click",e=>{const p=e.target.closest("[data-prod]"),n=e.target.closest("[data-net]");if(p)openDetails("prod",p.dataset.prod);if(n)openDetails("net",n.dataset.net);});
window.Byte2BiteReports={loadReportData:loadRaw,normalizeReportRecords:a=>a.map(normalizeRecord).filter(Boolean),getReportRecords:()=>periodData(loadRaw().records,getState()),getReportSummary:()=>summary(loadRaw().records,loadRaw().network),generateReportInsights:insights,generateReportData,INSIGHT_CONFIG,currentReport:null};
render();
})();