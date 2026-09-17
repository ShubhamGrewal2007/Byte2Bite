(function () {
  'use strict';

  var STORAGE_KEY = 'byte2bite_settings';
  var DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var DAY_FULL = {Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday',Sun:'Sunday'};
  var EMPTY_DEFAULTS = {profile:{},preferences:{},notifications:{},data:{},application:{}};

  var state = {
    defaults:null,
    settings:null,
    baselines:{profile:null,preferences:null,notifications:null},
    ready:false
  };

  function $(id){return document.getElementById(id)}
  function qsa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
  function isPlainObject(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)}
  function clone(v){return v==null?v:JSON.parse(JSON.stringify(v))}
  function mergeDeep(base,override){
    var out=isPlainObject(base)?clone(base):{};
    if(!isPlainObject(override))return out;
    Object.keys(override).forEach(function(k){
      var bv=out[k],ov=override[k];
      if(isPlainObject(bv)&&isPlainObject(ov))out[k]=mergeDeep(bv,ov);
      else if(ov!==undefined)out[k]=clone(ov);
    });
    return out;
  }
  function profileBaselineFrom(profile){
    var p=profile||{};
    return {
      institutionName:String(p.institutionName||'').trim(),
      location:String(p.location||'').trim(),
      dailyMeals:(p.dailyMeals===undefined||p.dailyMeals===null||p.dailyMeals==='')?'':Number(p.dailyMeals),
      operatingDays:Array.isArray(p.operatingDays)?p.operatingDays.slice().sort():[]
    };
  }
  function readStored(){
    try{var raw=localStorage.getItem(STORAGE_KEY);if(!raw)return null;var parsed=JSON.parse(raw);return isPlainObject(parsed)?parsed:null}
    catch(err){console.warn('[Settings] Malformed localStorage — falling back to defaults.',err);return null}
  }
  function writeStored(settings){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));return true}
    catch(err){console.warn('[Settings] Unable to write to localStorage.',err);return false}
  }
  function clearStored(){
    try{localStorage.removeItem(STORAGE_KEY);return true}
    catch(err){console.warn('[Settings] Unable to clear localStorage.',err);return false}
  }
  function loadDefaults(){
    return fetch('settings.json',{cache:'no-store'}).then(function(r){
      if(!r.ok)throw new Error('settings.json → HTTP '+r.status);
      return r.json();
    }).catch(function(err){
      console.warn('[Settings] Could not load settings.json — using empty defaults.',err);
      return clone(EMPTY_DEFAULTS);
    });
  }
  function loadSettings(){
    if(state.settings){renderAll();return Promise.resolve(state.settings)}
    return loadDefaults().then(function(defaults){
      state.defaults=defaults||clone(EMPTY_DEFAULTS);
      state.settings=mergeDeep(state.defaults,readStored()||{});
      state.baselines.profile=profileBaselineFrom(state.settings.profile);
      state.baselines.preferences=clone(state.settings.preferences||{});
      state.baselines.notifications=clone(state.settings.notifications||{});
      state.ready=true;renderAll();return state.settings;
    });
  }
  function saveSettings(){
    if(!state.settings)return Promise.resolve(false);
    var ok=writeStored(state.settings);
    if(ok){
      state.baselines.profile=profileBaselineFrom(state.settings.profile);
      state.baselines.preferences=clone(state.settings.preferences||{});
      state.baselines.notifications=clone(state.settings.notifications||{});
    }
    return Promise.resolve(ok);
  }
  function getSettings(){return state.settings?clone(state.settings):null}

  var savedTimer=null;
  function showSavedState(text){
    var el=$('globalSaveState');if(!el)return;
    el.textContent=text;el.classList.add('is-visible');
    if(savedTimer)clearTimeout(savedTimer);
    savedTimer=setTimeout(function(){el.classList.remove('is-visible')},2200);
  }
  function showUnsaved(section,isDirty){
    var map={profile:'profileUnsaved',preferences:'preferencesUnsaved',notifications:'notificationsUnsaved'};
    var el=$(map[section]);if(el)el.hidden=!isDirty;
  }

  function validateProfile(p){
    var errors={},name=String(p.institutionName||'').trim(),loc=String(p.location||'').trim(),meals=p.dailyMeals,mealsNum=Number(meals);
    if(!name)errors.institutionName='Kitchen name is required.';
    else if(name.length>80)errors.institutionName='Kitchen name must be 80 characters or fewer.';
    if(!loc)errors.location='Location is required.';
    else if(loc.length>120)errors.location='Location must be 120 characters or fewer.';
    if(meals===''||meals===null||meals===undefined||!isFinite(mealsNum)||!Number.isInteger(mealsNum)||mealsNum<=0)errors.dailyMeals='Enter a whole number greater than 0.';
    if(!Array.isArray(p.operatingDays)||p.operatingDays.length===0||p.operatingDays.some(function(d){return DAYS.indexOf(d)===-1}))errors.operatingDays='Select at least one operating day.';
    return errors;
  }
  function setText(id,value,fallback){
    var el=$(id);if(!el)return;
    el.textContent=(value===undefined||value===null||value==='')?(fallback||'—'):String(value);
  }
  function formatTimestamp(iso){
    if(!iso)return '—';var d=new Date(iso);if(isNaN(d.getTime()))return String(iso);
    return d.toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function renderOperatingDays(selected){
    var grid=$('operatingDaysGrid');if(!grid)return;var set=Array.isArray(selected)?selected:[];
    grid.innerHTML=DAYS.map(function(day){
      var on=set.indexOf(day)!==-1;
      return '<label class="day-toggle'+(on?' is-selected':'')+'" data-day="'+day+'"><input type="checkbox" value="'+day+'"'+(on?' checked':'')+' aria-label="'+DAY_FULL[day]+'"><span>'+day+'</span></label>';
    }).join('');
  }
  function setProfileError(field,message){
    var errorIdMap={institutionName:'profileNameError',location:'profileLocationError',dailyMeals:'profileDailyMealsError',operatingDays:'profileOperatingDaysError'};
    var inputMap={institutionName:'profileName',location:'profileLocation',dailyMeals:'profileDailyMeals',operatingDays:'operatingDaysGrid'};
    var errEl=$(errorIdMap[field]),inputEl=$(inputMap[field]);
    if(errEl){errEl.textContent=message||'';errEl.hidden=!message}
    if(inputEl){if(message)inputEl.setAttribute('aria-invalid','true');else inputEl.removeAttribute('aria-invalid')}
  }
  function clearProfileErrors(){['institutionName','location','dailyMeals','operatingDays'].forEach(function(f){setProfileError(f,'')})}
  function renderProfile(){
    var p=(state.settings&&state.settings.profile)||{};
    if($('profileName'))$('profileName').value=p.institutionName||'';
    if($('profileKitchenId'))$('profileKitchenId').value=p.kitchenId||'—';
    if($('profileLocation'))$('profileLocation').value=p.location||'';
    if($('profileDailyMeals'))$('profileDailyMeals').value=(p.dailyMeals==null?'':p.dailyMeals);
    renderOperatingDays(p.operatingDays||[]);clearProfileErrors();updateProfileDirty();
  }
  function renderPreferences(){
    var pref=(state.settings&&state.settings.preferences)||{};
    qsa('[data-pref-field]').forEach(function(el){var key=el.getAttribute('data-pref-field');if(key in pref)el.value=pref[key]});
    updatePreferencesDirty();
  }
  function renderNotifications(){
    var n=(state.settings&&state.settings.notifications)||{};
    qsa('[data-notif-field]').forEach(function(el){el.checked=!!n[el.getAttribute('data-notif-field')]});
    updateNotificationsDirty();
  }
  function renderData(){
    var d=(state.settings&&state.settings.data)||{};
    setText('dataSourceStatus',d.sourceStatus);
    setText('dataUsingLocalDemo',d.usingLocalDemoData===true?'Yes':d.usingLocalDemoData===false?'No':undefined);
    setText('dataLastUpdate',d.lastLocalUpdate?formatTimestamp(d.lastLocalUpdate):undefined);
  }
  function renderApplication(){
    var a=(state.settings&&state.settings.application)||{};
    setText('appName',a.name);setText('appVersion',a.version);setText('appEnvironment',a.environment);setText('appPrototypeStatus',a.prototypeStatus);
  }
  function renderAll(){renderProfile();renderPreferences();renderNotifications();renderData();renderApplication()}

  function readProfileForm(){
    var days=qsa('#operatingDaysGrid input[type="checkbox"]:checked').map(function(cb){return cb.value});
    var mealsRaw=$('profileDailyMeals')?$('profileDailyMeals').value:'';
    var mealsNum=(mealsRaw===''||mealsRaw===null||mealsRaw===undefined)?'':Number(mealsRaw);
    return {institutionName:$('profileName')?$('profileName').value.trim():'',location:$('profileLocation')?$('profileLocation').value.trim():'',dailyMeals:mealsNum,operatingDays:days.slice().sort()};
  }
  function readPreferencesForm(){
    var out={};qsa('[data-pref-field]').forEach(function(el){var key=el.getAttribute('data-pref-field'),val=el.value;if(el.type==='number'){var n=Number(val);out[key]=isFinite(n)?n:val}else out[key]=val});return out;
  }
  function readNotificationsForm(){
    var out={};qsa('[data-notif-field]').forEach(function(el){out[el.getAttribute('data-notif-field')]=!!el.checked});return out;
  }
  function shallowEqual(a,b){
    if(a===b)return true;if(!a||!b)return false;var ka=Object.keys(a),kb=Object.keys(b);if(ka.length!==kb.length)return false;
    for(var i=0;i<ka.length;i++){
      var k=ka[i],va=a[k],vb=b[k];
      if(Array.isArray(va)&&Array.isArray(vb)){
        if(va.length!==vb.length)return false;
        if(va.slice().sort().join('|')!==vb.slice().sort().join('|'))return false;
        continue;
      }
      var ea=(va===null||va===undefined||va===''),eb=(vb===null||vb===undefined||vb==='');
      if(ea&&eb)continue;if(ea!==eb)return false;
      var na=Number(va),nb=Number(vb);
      if(!isNaN(na)&&!isNaN(nb)){if(na!==nb)return false;continue}
      if(va!==vb)return false;
    }
    return true;
  }
  function updateProfileDirty(){
    if(!state.ready||!state.baselines.profile){showUnsaved('profile',false);return false}
    var dirty=!shallowEqual(readProfileForm(),state.baselines.profile);showUnsaved('profile',dirty);return dirty
  }
  function updatePreferencesDirty(){var dirty=!shallowEqual(readPreferencesForm(),state.baselines.preferences||{});showUnsaved('preferences',dirty);return dirty}
  function updateNotificationsDirty(){var dirty=!shallowEqual(readNotificationsForm(),state.baselines.notifications||{});showUnsaved('notifications',dirty);return dirty}

  function saveProfile(){
    var formProfile=readProfileForm(),errors=validateProfile(formProfile);
    ['institutionName','location','dailyMeals','operatingDays'].forEach(function(f){setProfileError(f,errors[f]||'')});
    if(Object.keys(errors).length){
      var focusMap={institutionName:'profileName',location:'profileLocation',dailyMeals:'profileDailyMeals',operatingDays:'operatingDaysGrid'},first=Object.keys(errors)[0],target=$(focusMap[first]);
      if(target&&typeof target.focus==='function')target.focus();return;
    }
    if(shallowEqual(formProfile,state.baselines.profile||{})){showSavedState('No changes to save');return}
    state.settings.profile={institutionName:formProfile.institutionName,kitchenId:state.settings.profile.kitchenId||'',location:formProfile.location,dailyMeals:formProfile.dailyMeals===''?'':Number(formProfile.dailyMeals),operatingDays:formProfile.operatingDays.slice().sort()};
    saveSettings().then(function(ok){showSavedState(ok?'Changes saved':'Could not save');updateProfileDirty()});
  }
  function savePreferences(){
    var formPref=readPreferencesForm();if(shallowEqual(formPref,state.baselines.preferences||{})){showSavedState('No changes to save');return}
    state.settings.preferences=mergeDeep(state.settings.preferences||{},formPref);saveSettings().then(function(ok){showSavedState(ok?'Changes saved':'Could not save');updatePreferencesDirty()});
  }
  function saveNotifications(){
    var formN=readNotificationsForm();if(shallowEqual(formN,state.baselines.notifications||{})){showSavedState('No changes to save');return}
    state.settings.notifications=Object.assign({},state.settings.notifications||{},formN);saveSettings().then(function(ok){showSavedState(ok?'Changes saved':'Could not save');updateNotificationsDirty()});
  }

  var modalEl=null,modalLastFocus=null;
  function openModal(){modalEl=$('confirmModal');if(!modalEl)return;modalLastFocus=document.activeElement;modalEl.hidden=false;var first=modalEl.querySelector('button');if(first)first.focus()}
  function closeModal(){if(!modalEl)modalEl=$('confirmModal');if(!modalEl)return;modalEl.hidden=true;if(modalLastFocus&&typeof modalLastFocus.focus==='function'){modalLastFocus.focus();modalLastFocus=null}}
  function handleClearConfirmed(){
    clearStored();state.settings=clone(state.defaults)||clone(EMPTY_DEFAULTS);
    state.baselines.profile=profileBaselineFrom(state.settings.profile);state.baselines.preferences=clone(state.settings.preferences||{});state.baselines.notifications=clone(state.settings.notifications||{});
    closeModal();renderAll();showSavedState('Local settings cleared');
  }

  function bindEvents(){
    var profileForm=$('profileForm');
    if(profileForm){
      profileForm.addEventListener('input',function(ev){var t=ev.target;if(t&&t.matches('[data-profile-field]'))setProfileError(t.getAttribute('data-profile-field'),'');updateProfileDirty()});
      profileForm.addEventListener('submit',function(ev){ev.preventDefault();saveProfile()});
    }
    var daysGrid=$('operatingDaysGrid');
    if(daysGrid)daysGrid.addEventListener('change',function(ev){var cb=ev.target;if(cb&&cb.type==='checkbox'){var lbl=cb.closest('.day-toggle');if(lbl)lbl.classList.toggle('is-selected',cb.checked);setProfileError('operatingDays','');updateProfileDirty()}});
    var profileReset=$('profileResetBtn');if(profileReset)profileReset.addEventListener('click',function(){renderProfile();showSavedState('Reverted to saved profile')});
    var prefCard=$('preferencesCard');if(prefCard){prefCard.addEventListener('input',updatePreferencesDirty);prefCard.addEventListener('change',updatePreferencesDirty)}
    var prefSave=$('preferencesSaveBtn');if(prefSave)prefSave.addEventListener('click',savePreferences);
    var prefReset=$('preferencesResetBtn');if(prefReset)prefReset.addEventListener('click',function(){renderPreferences();showSavedState('Reverted to saved preferences')});
    var notifCard=$('notificationsCard');if(notifCard)notifCard.addEventListener('change',updateNotificationsDirty);
    var notifSave=$('notificationsSaveBtn');if(notifSave)notifSave.addEventListener('click',saveNotifications);
    var notifReset=$('notificationsResetBtn');if(notifReset)notifReset.addEventListener('click',function(){renderNotifications();showSavedState('Reverted to saved notifications')});
    var clearBtn=$('clearLocalBtn');if(clearBtn)clearBtn.addEventListener('click',openModal);
    qsa('[data-modal-close]').forEach(function(el){el.addEventListener('click',closeModal)});
    var confirmClear=$('confirmClearBtn');if(confirmClear)confirmClear.addEventListener('click',handleClearConfirmed);
    document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&modalEl&&!modalEl.hidden)closeModal()});
  }

  window.Byte2BiteSettings={loadSettings:loadSettings,saveSettings:saveSettings,getSettings:getSettings};

  function init(){bindEvents();loadSettings()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();