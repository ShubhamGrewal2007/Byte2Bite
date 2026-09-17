(() => {
"use strict";
const USER_KEY="byte2bite_efficiency_records";
const CARBON_FACTOR=0.6; // prototype conversion factor only
const $=id=>document.getElementById(id);
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const present=v=>v!==null&&v!==undefined&&v!=="";
const fmt=(v,d=1)=>present(v)&&Number.isFinite(Number(v))?Number(v).toLocaleString(undefined,{maximumFractionDigits:d}):"—";
const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const daysBetween=(a,b)=>Math.floor((new Date(b)-new Date(a))/86400000);

function normalizeImpact(r,source="demo"){return {
 id:r.id||`${source}-${r.date||"unknown"}-${r.meal||"unknown"}`,date:r.date||"",meal:r.meal||"Unknown",
 foodWastePrevented:present(r.foodWastePrevented)?n(r.foodWastePrevented):0,
 surplusRecovered:present(r.surplusRecovered)?n(r.surplusRecovered):0,
 materialWaste:present(r.materialWaste)?n(r.materialWaste):0,
 energyUsedKwh:present(r.energyUsedKwh)?n(r.energyUsedKwh):0,
 actualProduction:present(r.actualProduction)?n(r.actualProduction):0,
 estimatedCarbonImpact:present(r.estimatedCarbonImpact)?n(r.estimatedCarbonImpact):null,
 source
};}

const DataService={
 async loadJson(path, fallback=[]){
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),4000);
    const res=await fetch(path,{cache:"no-store",signal:controller.signal});
    clearTimeout(timer);
    if(!res.ok)throw Error("HTTP "+res.status);
    const data=await res.json();
    return Array.isArray(data)?data:[];
  }catch(err){
    return Array.isArray(fallback)?fallback:[];
  }
},
 async load(){
  const embeddedImpact=[{"id":"IMP-001","date":"2026-09-01","meal":"Breakfast","foodWastePrevented":12,"surplusRecovered":8,"materialWaste":3.2,"energyUsedKwh":42,"actualProduction":180,"estimatedCarbonImpact":7.2,"source":"demo"},{"id":"IMP-002","date":"2026-09-02","meal":"Lunch","foodWastePrevented":18,"surplusRecovered":11,"materialWaste":4.1,"energyUsedKwh":58,"actualProduction":240,"estimatedCarbonImpact":10.8,"source":"demo"},{"id":"IMP-003","date":"2026-09-03","meal":"Dinner","foodWastePrevented":15,"surplusRecovered":9,"materialWaste":3.8,"energyUsedKwh":51,"actualProduction":210,"estimatedCarbonImpact":9.0,"source":"demo"},{"id":"IMP-004","date":"2026-09-04","meal":"Lunch","foodWastePrevented":21,"surplusRecovered":14,"materialWaste":5.0,"energyUsedKwh":62,"actualProduction":255,"estimatedCarbonImpact":12.6,"source":"demo"},{"id":"IMP-005","date":"2026-09-05","meal":"Breakfast","foodWastePrevented":10,"surplusRecovered":7,"materialWaste":2.9,"energyUsedKwh":39,"actualProduction":170,"estimatedCarbonImpact":6.0,"source":"demo"},{"id":"IMP-006","date":"2026-09-06","meal":"Dinner","foodWastePrevented":24,"surplusRecovered":16,"materialWaste":5.6,"energyUsedKwh":66,"actualProduction":265,"estimatedCarbonImpact":14.4,"source":"demo"},{"id":"IMP-007","date":"2026-09-07","meal":"Lunch","foodWastePrevented":19,"surplusRecovered":12,"materialWaste":4.5,"energyUsedKwh":60,"actualProduction":248,"estimatedCarbonImpact":11.4,"source":"demo"},{"id":"IMP-008","date":"2026-09-08","meal":"Breakfast","foodWastePrevented":14,"surplusRecovered":10,"materialWaste":3.4,"energyUsedKwh":44,"actualProduction":188,"estimatedCarbonImpact":8.4,"source":"demo"}];
  const impact=await this.loadJson("impact.json",embeddedImpact);
  const [surplus,eff]=await Promise.all([
    this.loadJson("../Surplus/surplus.json",[]),
    this.loadJson("../Efficiency/efficiency.json",[])
  ]);
  let user=[];
  try{
    const parsed=JSON.parse(localStorage.getItem(USER_KEY)||"[]");
    user=Array.isArray(parsed)?parsed:[];
  }catch{}
  const records=[];
  impact.forEach(r=>records.push(normalizeImpact(r,"demo")));
  surplus.forEach(r=>records.push(normalizeImpact({
    id:r.id,date:r.date,meal:r.meal,surplusRecovered:r.redistributed||r.surplus||0,
    materialWaste:0,energyUsedKwh:0,actualProduction:r.actualProduction||0
  },"surplus")));
  eff.forEach(r=>records.push(normalizeImpact({
    id:r.id,date:r.date,meal:r.meal,materialWaste:r.rawMaterialWaste,
    energyUsedKwh:r.energyUsedKwh,actualProduction:r.actualProduction
  },"efficiencyDemo")));
  user.forEach(r=>records.push(normalizeImpact({
    id:r.id,date:r.date,meal:r.meal,materialWaste:r.rawMaterialWaste,
    energyUsedKwh:r.energyUsedKwh,actualProduction:r.actualProduction
  },"efficiencyUser")));
  return mergeCycles(records);
}
};
function mergeCycles(rows){
 const map=new Map(), orphan=[];
 rows.forEach(r=>{
  if(!r.date||!r.meal){orphan.push(r);return}
  const key=`${r.date}||${r.meal}`;
  if(!map.has(key))map.set(key,{...r,sourceSet:new Set([r.source])});
  else{
   const x=map.get(key);
   ["foodWastePrevented","surplusRecovered","materialWaste","energyUsedKwh","actualProduction"].forEach(k=>{
    if(r[k]!==0)x[k]=Math.max(n(x[k]),n(r[k]));
   });
   if(r.estimatedCarbonImpact!==null)x.estimatedCarbonImpact=r.estimatedCarbonImpact;
   x.sourceSet.add(r.source);
  }
 });
 return [...map.values(),...orphan].map(r=>{
  if(!r.sourceSet)r.sourceSet=new Set([r.source]);
  r.sourceLabel=r.sourceSet.has("efficiencyUser")?"Added by User":"Demo Data";
  if(r.sourceSet.size>1)r.sourceLabel="Mixed Data";
  return r;
 }).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}

const Calc={
 totals(rs){return {
  foodWastePrevented:rs.reduce((s,r)=>s+n(r.foodWastePrevented),0),
  surplusRecovered:rs.reduce((s,r)=>s+n(r.surplusRecovered),0),
  materialWaste:rs.reduce((s,r)=>s+n(r.materialWaste),0),
  energyUsed:rs.reduce((s,r)=>s+n(r.energyUsedKwh),0),
  actualProduction:rs.reduce((s,r)=>s+n(r.actualProduction),0),
  carbon:rs.reduce((s,r)=>s+(present(r.estimatedCarbonImpact)?n(r.estimatedCarbonImpact):n(r.foodWastePrevented)*CARBON_FACTOR),0)
 }},
 energyPerUnit(rs){const e=this.totals(rs);return e.actualProduction>0?e.energyUsed/e.actualProduction:null},
 recoveryRate(rs){const total=rs.reduce((s,r)=>s+n(r.surplusRecovered),0);const denominator=rs.reduce((s,r)=>s+(present(r.surplusAvailable)?n(r.surplusAvailable):0),0);return denominator>0?total/denominator*100:null},
 summary(rs){const t=this.totals(rs);return {...t,energyPerUnit:this.energyPerUnit(rs),surplusRecoveryRate:this.recoveryRate(rs)}}
};

function filterPeriod(records,period,from,to){
 if(period==="all")return [...records];
 if(!records.length)return [];
 const dates=records.map(r=>r.date).filter(Boolean).sort();
 const latest=dates.at(-1);
 if(period==="7"||period==="30"){const start=new Date(latest);start.setDate(start.getDate()-Number(period)+1);return records.filter(r=>r.date>=start.toISOString().slice(0,10)&&r.date<=latest)}
 if(period==="custom")return records.filter(r=>(!from||r.date>=from)&&(!to||r.date<=to));
 return records;
}

function renderKpis(rs){
 const s=Calc.summary(rs); const cards=[
 ["Food Waste Prevented",fmt(s.foodWastePrevented),"kg"],
 ["Surplus Recovered",fmt(s.surplusRecovered),"kg"],
 ["Material Waste",fmt(s.materialWaste),"kg"],
 ["Energy Used",fmt(s.energyUsed),"kWh"],
 ["Estimated Carbon Impact",fmt(s.carbon),"kg CO₂e"],
 ["Energy Per Unit",s.energyPerUnit===null?"—":fmt(s.energyPerUnit,3),"kWh / unit"]
 ];
 $("kpis").innerHTML=cards.map(c=>`<article class="kpi"><div class="kpi-label">${c[0]}</div><div class="kpi-value">${c[1]}</div><div class="kpi-unit">${c[2]}</div></article>`).join("");
 $("wasteRecovery").innerHTML=`<div class="metric-row"><span>Food waste prevented</span><strong>${fmt(s.foodWastePrevented)} kg</strong></div><div class="metric-row"><span>Surplus recovered</span><strong>${fmt(s.surplusRecovered)} kg</strong></div><div class="metric-row"><span>Recovery rate</span><strong>${s.surplusRecoveryRate===null?"—":fmt(s.surplusRecoveryRate)+"%"}</strong></div>`;
 $("resourceImpact").innerHTML=`<div class="metric-row"><span>Material waste</span><strong>${fmt(s.materialWaste)} kg</strong></div><div class="metric-row"><span>Energy used</span><strong>${fmt(s.energyUsed)} kWh</strong></div><div class="metric-row"><span>Energy per unit</span><strong>${s.energyPerUnit===null?"—":fmt(s.energyPerUnit,3)+" kWh"}</strong></div>`;
 $("environmentImpact").innerHTML=`<div class="metric-row"><span>Estimated carbon impact</span><strong>${fmt(s.carbon)} kg CO₂e</strong></div><div class="estimate">Estimated / Prototype. Uses a configurable prototype conversion factor and is not a certified environmental measurement.</div>`;
}

function renderTrend(rs){
 const by=new Map();rs.forEach(r=>by.set(r.date,(by.get(r.date)||0)+n(r.foodWastePrevented)));
 const pts=[...by.entries()].sort().slice(-10);
 if(!pts.length){$("trendChart").innerHTML="<p class='section-note'>No trend data available.</p>";return}
 const max=Math.max(...pts.map(x=>x[1]),1), w=700,h=180,p=28;
 const xy=pts.map((x,i)=>[p+i*(w-2*p)/Math.max(pts.length-1,1),h-p-(x[1]/max)*(h-2*p)]);
 const line=xy.map(x=>x.join(",")).join(" ");
 $("trendChart").innerHTML=`<svg class="chart-svg" viewBox="0 0 ${w} ${h}" aria-label="Food waste prevented by recorded date"><polyline points="${line}" fill="none" stroke="#173f32" stroke-width="3"/><line x1="${p}" y1="${h-p}" x2="${w-p}" y2="${h-p}" stroke="#ddd7ce"/>${xy.map((x,i)=>`<circle cx="${x[0]}" cy="${x[1]}" r="4" fill="#9bbba3"><title>${pts[i][0]}: ${fmt(pts[i][1])} kg food waste prevented</title></circle>`).join("")}</svg>`;
}
function renderBreakdown(rs){
 const s=Calc.summary(rs);
 $("breakdown").innerHTML=[
 ["Food",`${fmt(s.foodWastePrevented)} kg prevented`],
 ["Materials",`${fmt(s.materialWaste)} kg waste`],
 ["Energy",`${fmt(s.energyUsed)} kWh used`],
 ["Operations",`${fmt(s.actualProduction)} units produced`]
 ].map(x=>`<div class="breakdown-item"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join("");
}

function sourceText(r){return r.sourceLabel||"Demo Data"}
function renderHistory(){
 let rs=ImpactData.records.slice();
 const q=$("search").value.trim().toLowerCase(), meal=$("mealFilter").value, src=$("sourceFilter").value, period=$("historyPeriod").value;
 rs=filterPeriod(rs,period,$("fromDate").value,$("toDate").value);
 if(q)rs=rs.filter(r=>`${r.date} ${r.meal} ${sourceText(r)}`.toLowerCase().includes(q));
 if(meal!=="All")rs=rs.filter(r=>r.meal===meal);
 if(src!=="All")rs=rs.filter(r=>sourceText(r)===src);
 const sort=$("sort").value;
 rs.sort((a,b)=>sort==="oldest"?String(a.date).localeCompare(String(b.date)):sort==="meal"?a.meal.localeCompare(b.meal)||String(b.date).localeCompare(String(a.date)):String(b.date).localeCompare(String(a.date)));
 $("historyCount").textContent=`Showing ${rs.length} of ${ImpactData.records.length} impact records`;
 $("historyBody").innerHTML=rs.map(r=>`<tr><td>${escapeHtml(r.date||"—")}</td><td>${escapeHtml(r.meal)}</td><td>${fmt(r.foodWastePrevented)} kg</td><td>${fmt(r.surplusRecovered)} kg</td><td>${fmt(r.materialWaste)} kg</td><td>${fmt(r.energyUsedKwh)} kWh</td><td>${r.estimatedCarbonImpact===null?fmt(n(r.foodWastePrevented)*CARBON_FACTOR):fmt(r.estimatedCarbonImpact)} kg CO₂e</td><td><span class="source-label">${escapeHtml(sourceText(r))}</span></td><td><button class="button secondary detail-btn" data-id="${escapeHtml(r.id)}" type="button">View Details</button></td></tr>`).join("")||`<tr><td colspan="9">No impact records match these filters.</td></tr>`;
 $("historyCards").innerHTML=rs.map(r=>`<article class="history-card"><header><strong>${escapeHtml(r.meal)}</strong><span>${escapeHtml(r.date||"—")}</span></header><p>Food waste prevented: <strong>${fmt(r.foodWastePrevented)} kg</strong></p><p>Surplus recovered: <strong>${fmt(r.surplusRecovered)} kg</strong></p><p>Material waste: <strong>${fmt(r.materialWaste)} kg</strong></p><p>Energy: <strong>${fmt(r.energyUsedKwh)} kWh</strong></p><p>Carbon: <strong>${r.estimatedCarbonImpact===null?fmt(n(r.foodWastePrevented)*CARBON_FACTOR):fmt(r.estimatedCarbonImpact)} kg CO₂e</strong></p><p>Source: <strong>${escapeHtml(sourceText(r))}</strong></p><button class="button secondary detail-btn" data-id="${escapeHtml(r.id)}" type="button">View Details</button></article>`).join("")||`<p class="section-note">No impact records match these filters.</p>`;
}
function insightEngine(rs){
 if(rs.length<1)return [{title:"Impact Insights",text:"Record more operational cycles to generate dataset-local observations.",severity:"Informational"}];
 const out=[];const t=Calc.totals(rs);
 const fields=[["Food Waste","foodWastePrevented","kg"],["Material Waste","materialWaste","kg"],["Energy","energyUsedKwh","kWh"]];
 fields.forEach(([name,key,unit])=>{const avg=t[key]/rs.length;if(avg>0&&rs.length>=3&&n(rs.at(-1)[key])>avg*1.25)out.push({title:`${name} needs attention`,text:`The latest recorded value is above 1.25× this dataset's average. Review the related kitchen operation.`,severity:"Attention",metric:`Latest ${fmt(rs.at(-1)[key])} ${unit}; average ${fmt(avg)} ${unit}.`})});
 if(rs.length>=3){const sorted=[...rs].sort((a,b)=>a.date.localeCompare(b.date));const half=Math.floor(sorted.length/2);const early=sorted.slice(0,half),recent=sorted.slice(half);const rate=k=>recent.reduce((s,r)=>s+n(r[k]),0)/Math.max(recent.length,1)-(early.reduce((s,r)=>s+n(r[k]),0)/Math.max(early.length,1));if(rate("foodWastePrevented")<0)out.push({title:"Food waste prevention is improving",text:"Recent recorded cycles show a lower average food-waste-prevented value than the earlier portion of this dataset.",severity:"Informational"});if(rate("energyUsedKwh")>0)out.push({title:"Energy use is increasing",text:"Recent recorded cycles show a higher average energy use than the earlier portion of this dataset.",severity:"Attention"})}
 return out.slice(0,4);
}
function renderInsights(rs){const ins=insightEngine(rs);$("insights").innerHTML=ins.map(i=>`<article class="insight ${i.severity==="Attention"?"attention":""}"><h3>${escapeHtml(i.title)}</h3><p>${escapeHtml(i.text)}</p><small>${escapeHtml(i.metric||i.severity)}</small></article>`).join("")}

function reportData(rs,period){const s=Calc.summary(rs);return {generatedAt:new Date().toISOString(),reportingPeriod:period,recordCount:rs.length,totals:s,averages:{energyPerUnit:s.energyPerUnit},operationalSummary:{actualProduction:s.actualProduction,energyUsed:s.energyUsed},sustainabilityAreas:{foodAndWaste:s.foodWastePrevented,surplus:s.surplusRecovered,resources:s.materialWaste,environmental:s.carbon},insights:insightEngine(rs),sources:[...new Set(rs.map(sourceText))],assumptions:["Carbon impact is Estimated / Prototype and is not a certified environmental measurement.","Surplus recovery rate is shown only when a reliable denominator exists." ]};}
function renderReport(){
 const period=$("reportPeriod").value,rs=filterPeriod(ImpactData.records,period,$("reportFrom").value,$("reportTo").value);
 if(!rs.length){$("reportPreview").innerHTML=`<p class="section-note">No impact data is available to prepare a report.</p>`;$("prepareReport").disabled=true;window.Byte2BiteImpactReport=null;return}
 $("prepareReport").disabled=false;const s=Calc.summary(rs);
 $("reportPreview").innerHTML=`<div class="report-preview"><div class="report-summary"><h3>Reporting summary</h3><p>This period contains ${rs.length} recorded impact cycle${rs.length===1?"":"s"}. Food waste prevented totals ${fmt(s.foodWastePrevented)} kg and surplus recovered totals ${fmt(s.surplusRecovered)} kg. Energy use is ${fmt(s.energyUsed)} kWh.</p><div class="report-areas"><div class="report-area"><strong>Food &amp; Waste</strong><span>${fmt(s.foodWastePrevented)} kg</span></div><div class="report-area"><strong>Surplus</strong><span>${fmt(s.surplusRecovered)} kg</span></div><div class="report-area"><strong>Resources</strong><span>${fmt(s.materialWaste)} kg</span></div><div class="report-area"><strong>Environmental</strong><span>${fmt(s.carbon)} kg CO₂e</span></div></div><p class="report-meta">Sources: ${escapeHtml([...new Set(rs.map(sourceText))].join(", "))}. Carbon is Estimated / Prototype.</p></div></div>`;
}
function toggleCustom(prefix){const custom=$(prefix+"Period").value==="custom";$(prefix+"FromWrap").classList.toggle("hidden",!custom);$(prefix+"ToWrap").classList.toggle("hidden",!custom)}

let ImpactData={records:[]};let lastTrigger=null;let initialized=false;
function openDetails(id,trigger){const r=ImpactData.records.find(x=>String(x.id)===String(id));if(!r)return;lastTrigger=trigger;$("modalContent").innerHTML=`<div class="detail-grid">${[["Date",r.date],["Meal",r.meal],["Food Waste Prevented",`${fmt(r.foodWastePrevented)} kg`],["Surplus Recovered",`${fmt(r.surplusRecovered)} kg`],["Material Waste",`${fmt(r.materialWaste)} kg`],["Energy Used",`${fmt(r.energyUsedKwh)} kWh`],["Actual Production",fmt(r.actualProduction)],["Carbon Impact",`${r.estimatedCarbonImpact===null?fmt(n(r.foodWastePrevented)*CARBON_FACTOR):fmt(r.estimatedCarbonImpact)} kg CO₂e`],["Source",sourceText(r)]].map(x=>`<div><span>${escapeHtml(x[0])}</span><strong>${escapeHtml(x[1])}</strong></div>`).join("")}</div><p class="estimate">Carbon value is Estimated / Prototype and not a certified environmental measurement.</p>`;$("modal").classList.remove("hidden");$("closeModal").focus()}
function closeModal(){ $("modal").classList.add("hidden");if(lastTrigger)lastTrigger.focus()}

async function init(){
 if(initialized)return;
 initialized=true;
 try{
 ImpactData.records=await DataService.load();
 $("sourceBadge").textContent=ImpactData.records.length?`${ImpactData.records.length} recorded cycles`:"No impact data";
 renderKpis(ImpactData.records);renderTrend(ImpactData.records);renderBreakdown(ImpactData.records);renderHistory();renderInsights(ImpactData.records);renderReport();
 ["search","mealFilter","sourceFilter","sort","historyPeriod","fromDate","toDate"].forEach(id=>$(id).addEventListener("input",()=>{if(id==="historyPeriod")toggleCustom("history");renderHistory()}));
 $("resetFilters").onclick=()=>{$("search").value="";$("mealFilter").value="All";$("sourceFilter").value="All";$("sort").value="newest";$("historyPeriod").value="all";$("fromDate").value="";$("toDate").value="";toggleCustom("history");renderHistory()};
 ["reportPeriod","reportFrom","reportTo"].forEach(id=>$(id).addEventListener("input",()=>{if(id==="reportPeriod")toggleCustom("report");renderReport()}));
 document.addEventListener("click",e=>{const b=e.target.closest(".detail-btn");if(b)openDetails(b.dataset.id,b)});
 $("closeModal").onclick=closeModal;$("modal").addEventListener("click",e=>{if(e.target===$("modal"))closeModal()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("modal").classList.contains("hidden"))closeModal()});
 $("prepareReport").onclick=()=>{const rs=filterPeriod(ImpactData.records,$("reportPeriod").value,$("reportFrom").value,$("reportTo").value);window.Byte2BiteImpactReport=reportData(rs,$("reportPeriod").value);$("reportStatus").textContent="Report data prepared in window.Byte2BiteImpactReport.";};
 toggleCustom("history");toggleCustom("report");
 }catch(err){
   console.error("Byte2Bite Impact initialization failed:",err);
   $("sourceBadge").textContent="Impact data unavailable";
   ["kpis","wasteRecovery","resourceImpact","environmentImpact","trendChart","breakdown","historyBody","historyCards","insights","reportPreview"].forEach(id=>{
     const el=$(id);
     if(el)el.innerHTML="<p class='section-note'>Impact data could not be loaded. Please refresh the page.</p>";
   });
 }
}
window.Byte2BiteImpactReport=null;
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();