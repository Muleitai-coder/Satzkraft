// ---------- State (mehrere Programme) ----------
var loadIssueRaw="",loadIssueText="",recoveryExported=false,storageErrorShown=false;
var S=load();
function newStore(prog){return{tg:{},barw:{},notes:{},logs:{},history:[],workout:null,pendingReplacements:[],removedEx:{},week:1,day:prog.days[0].key,blockCelebrated:false};}
function normalizeStoredRep(ex,value){if(value===""||value==null)return"";var number=Math.round(Number(value)),max=isTime(ex)?SET_TIME_MAX_SECONDS:SET_REP_MAX;return isFinite(number)&&number>=0?String(Math.min(number,max)):"";}
function sanitizeStoredSetValues(program,logs){if(!program||!logs||typeof logs!=="object")return;var exercises={};(program.days||[]).forEach(function(day){(day.ex||[]).forEach(function(ex){exercises[day.key+"|"+ex.id]=ex;});});Object.keys(logs).forEach(function(key){var parts=key.split("|"),cell=logs[key],ex=parts.length===3?exercises[parts[1]+"|"+parts[2]]:null;if(!ex||!cell||!Array.isArray(cell.sets))return;cell.sets.forEach(function(set){if(!set||typeof set!=="object")return;set.reps=normalizeStoredRep(typeof historicalExercise==="function"?historicalExercise(ex,cell):ex,set.reps);set.weight=sanDec(set.weight);});});}
function initState(){
 var def=clone(DEFAULT_PROGRAM);
 var st=newStore(def);
 var s={schemaVersion:DATA_SCHEMA_VERSION,personalExercises:{},programs:{"default":def},active:"default",store:{"default":st}};
 alias(s);return s;
}
function alias(s){var st=s.store[s.active],program=s.programs[s.active];if(!st.barw||typeof st.barw!=="object"||Array.isArray(st.barw))st.barw={};if(!st.notes||typeof st.notes!=="object"||Array.isArray(st.notes))st.notes={};sanitizeStoredSetValues(program,st.logs);st.pendingReplacements=sanitizePendingReplacements(st.pendingReplacements,s.active,program);st.removedEx=sanitizeRemovedExercises(st.removedEx,program);s.tg=st.tg;s.barw=st.barw;s.notes=st.notes;s.logs=st.logs;s.history=st.history;s.workout=st.workout;s.pendingReplacements=st.pendingReplacements;s.removedEx=st.removedEx;s.week=st.week;s.day=st.day;s.blockCelebrated=st.blockCelebrated===true;}
function load(){
 var r="";
 try{localStoredSnapshot=localStorage.getItem(KEY);r=localStoredSnapshot||"";if(r){var v=JSON.parse(r);return normalize(v);}}catch(e){loadIssueRaw=r;loadIssueText="Die gespeicherten Trainingsdaten konnten nicht gelesen werden.";}
 var r2="";
 try{r2=localStorage.getItem("cali-plan-v2")||"";if(r2){var o=JSON.parse(r2);var s=initState();var st=s.store["default"];st.tg=o.tg||{};st.logs=o.logs||{};st.history=Array.isArray(o.history)?o.history:[];st.workout=o.workout||null;st.week=o.week||1;st.day=o.day||"A";s.schemaVersion=DATA_SCHEMA_VERSION;alias(s);return s;}}catch(e){if(!loadIssueRaw)loadIssueRaw=r2;if(!loadIssueText)loadIssueText="Alte Trainingsdaten konnten nicht wiederhergestellt werden.";}
 return initState();
}
function migrateProgram(p){
 delete p.planMode;
 // Bestehendes Standard-Programm bekommt Art + Bereich nachgereicht
 if(!p.art&&p.name==="Ganzkörper 3× (Standard)"){p.name="Ganzkörper 3×";p.art="Standard";p.bereich="Ganzkörper";}
 // Alt-Format (type/repRanges/sStr…) → daten-getriebene Kategorien
 if(p.categories)return p;
 var rr=p.repRanges||{};
 p.categories={
  strength:{label:"Kraft",color:"amber",rest:150,reps:rr.strength||{aufbau:[5,7],intensiv:[3,5],deload:[5,5]}},
  hyp:{label:"Hypertrophie",color:"emerald",rest:90,reps:rr.hyp||{aufbau:[8,12],intensiv:[6,10],deload:[10,10]}},
  skill:{label:"Skill",color:"violet",rest:150,reps:null},
  core:{label:"Core",color:"sky",rest:60,reps:null}
 };
 (p.weeks||[]).forEach(function(w){if(!w.sets){w.sets={strength:w.sStr,hyp:w.sHyp,skill:w.sSkl,core:w.sSkl};}delete w.sStr;delete w.sHyp;delete w.sSkl;});
 (p.days||[]).forEach(function(d){(d.ex||[]).forEach(function(e){if(e.cat===undefined)e.cat=e.type;if(e.unit===undefined)e.unit="reps";delete e.type;});});
 delete p.repRanges;
 return p;
}
function normalizeSwapName(name){return typeof name==="string"?name.replace(/\s+/g," ").trim().slice(0,80):"";}
var EXERCISE_LIBRARY=null,EXERCISE_LIBRARY_PROMISE=null,EXERCISE_ALIAS_INDEX=null,EXERCISE_ID_INDEX=null;
function findExerciseLibraryEntryById(id){var builtin=typeof id==="string"&&EXERCISE_ID_INDEX?EXERCISE_ID_INDEX[id]:null,def=typeof S!=="undefined"&&S&&S.personalExercises&&S.personalExercises[id];return builtin||(def?personalExerciseEntry(def):null);}
function normalizeExerciseLibraryName(value){
 return String(value==null?"":value).toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"").trim();
}
function exerciseLibraryEntryNames(entry){return[entry.de,entry.en].concat(Array.isArray(entry.alias)?entry.alias:[]);}
function setExerciseLibrary(list){
 var entries=Array.isArray(list)?list:[],ids=Object.create(null),aliases=Object.create(null);
 entries.forEach(function(entry){if(entry.id!==undefined){var ref=exerciseReferenceDefinition(entry.id),type=entry.weightedTime===true?"weighted_seconds":entry.typ==="gewicht"?"weight":entry.typ==="kgz"?"added_weight":entry.typ==="zeit"?"seconds":"bodyweight";if(!ref||!["gewicht","kgz","koerpergewicht","zeit"].includes(entry.typ)||ids[entry.id]||entry.de!==ref.name||type!==ref.type||!!entry.einseitig!==ref.perSide)throw new Error("exercise reference");ids[entry.id]=entry;}exerciseLibraryEntryNames(entry).forEach(function(name){var key=normalizeExerciseLibraryName(name);if(key&&!aliases[key])aliases[key]=entry;});});
 EXERCISE_LIBRARY=entries;EXERCISE_ALIAS_INDEX=aliases;EXERCISE_ID_INDEX=ids;
 return EXERCISE_LIBRARY;
}
function loadExerciseLibrary(){
 if(EXERCISE_LIBRARY!==null)return Promise.resolve(EXERCISE_LIBRARY);
 if(EXERCISE_LIBRARY_PROMISE)return EXERCISE_LIBRARY_PROMISE;
 EXERCISE_LIBRARY_PROMISE=fetch("uebungen.json").then(function(response){if(!response.ok)throw new Error("exercise library");return response.json();}).then(setExerciseLibrary).catch(function(){EXERCISE_LIBRARY_PROMISE=null;return[];});
 return EXERCISE_LIBRARY_PROMISE;
}
function findExerciseLibraryEntry(name){var key=normalizeExerciseLibraryName(name),builtin=key&&typeof EXERCISE_ALIAS_INDEX!=="undefined"&&EXERCISE_ALIAS_INDEX?EXERCISE_ALIAS_INDEX[key]:null;if(builtin)return builtin;return personalExerciseEntries().filter(function(entry){return normalizeExerciseLibraryName(entry.de)===key;})[0]||null;}
function canonicalExerciseName(name){var entry=findExerciseLibraryEntry(name);return entry?entry.de:String(name==null?"":name).trim();}
function exerciseUsesDumbbells(name){var entry=findExerciseLibraryEntry(name);return !!(entry&&(entry.weightConvention==="per_dumbbell"||/kurzhantel/i.test(String(entry.equipment||""))));}
function exerciseLibraryNamesMatch(left,right){
 var leftEntry=findExerciseLibraryEntry(left),rightEntry=findExerciseLibraryEntry(right);
 if(leftEntry||rightEntry)return !!(leftEntry&&rightEntry&&leftEntry.de===rightEntry.de);
 return String(left==null?"":left).trim()===String(right==null?"":right).trim();
}
function exerciseLibraryMatches(query,limit){
 var needle=normalizeExerciseLibraryName(query);if(needle.length<2)return[];limit=Math.max(1,Number(limit)||6);
 return personalExerciseEntries().concat(typeof EXERCISE_LIBRARY!=="undefined"&&Array.isArray(EXERCISE_LIBRARY)?EXERCISE_LIBRARY:[]).map(function(entry,index){var score=9;exerciseLibraryEntryNames(entry).forEach(function(name){var normalized=normalizeExerciseLibraryName(name),position=normalized.indexOf(needle);if(position===0)score=Math.min(score,0);else if(position>0)score=Math.min(score,1);});return{entry:entry,score:score,index:index};}).filter(function(item){return item.score<9;}).sort(function(a,b){return a.score-b.score||a.index-b.index;}).slice(0,limit).map(function(item){return item.entry;});
}
function exerciseEquipmentCompatible(reference,candidate){return normalizeExerciseLibraryName(reference&&reference.equipment)===normalizeExerciseLibraryName(candidate&&candidate.equipment);}
function exerciseLibraryTypeSignature(entry){return entry&&entry.weightedTime===true?"weighted_seconds":entry&&entry.typ==="gewicht"?"weight":entry&&entry.typ==="kgz"?"added_weight":entry&&entry.typ==="zeit"?"seconds":"bodyweight";}
function workoutExerciseTypeSignature(ex){return ex&&ex.unit==="seconds"?(ex.w?"weighted_seconds":"seconds"):ex&&ex.w?(ex.bw?"added_weight":"weight"):"bodyweight";}
function exerciseSwapTypeCompatible(ex,entry){return!!entry&&exerciseLibraryTypeSignature(entry)===workoutExerciseTypeSignature(ex)&&!!entry.einseitig===!!(ex&&ex.perSide);}
function exerciseSwapSuggestions(ex){
 var suggestions=[],seen=Object.create(null),entry=findExerciseLibraryEntry(ex&&ex.name);
 function add(name){name=normalizeSwapName(name);var candidate=findExerciseLibraryEntry(name),key=normalizeExerciseLibraryName(name);if(!name||!key||seen[key]||candidate&&!exerciseSwapTypeCompatible(ex,candidate))return;seen[key]=true;suggestions.push(name);}
 if(ex)add(ex.proxy);if(entry)add(entry.ersatz);
 if(entry&&typeof EXERCISE_LIBRARY!=="undefined"&&Array.isArray(EXERCISE_LIBRARY)){for(var i=0;i<EXERCISE_LIBRARY.length&&suggestions.length<3;i++){var candidate=EXERCISE_LIBRARY[i];if(candidate.de!==entry.de&&candidate.muster===entry.muster&&exerciseEquipmentCompatible(entry,candidate)&&exerciseSwapTypeCompatible(ex,candidate)){add(candidate.de);break;}}}
 return suggestions.slice(0,3);
}
function normalizeSwapWeight(value){if(value==null||value==="")return"";if(typeof value==="number")return isFinite(value)&&value>=0&&value<=2000?String(value):"";return typeof value==="string"&&value.length<=20&&/^\d+(?:\.\d+)?$/.test(value)&&Number(value)<=2000?value:"";}
function normalizeSwapDecision(value){return value==="pending"||value==="training"||value==="permanent"?value:"";}
function sanitizePendingReplacements(list,programId,program){
 if(!Array.isArray(list))return[];var days=Object.create(null),out=[],seen=Object.create(null);(program&&program.days||[]).forEach(function(day){var exercises=Object.create(null);(day.ex||[]).forEach(function(ex){exercises[String(ex.id)]=true;});days[String(day.key)]=exercises;});
 list.slice(0,12).forEach(function(item){if(!item||typeof item!=="object")return;var name=normalizeSwapName(item.name),day=String(item.day||""),exId=String(item.exId||""),pid=String(item.programId||programId||"");if(!name||pid!==String(programId||"")||!days[day]||!days[day][exId])return;var key=day+"|"+exId;if(seen[key]){out[seen[key]-1].name=name;return;}seen[key]=out.length+1;out.push({programId:pid,day:day,exId:exId,name:name});});return out;
}
function sanitizeRemovedExercises(map,program){
 if(!map||typeof map!=="object"||Array.isArray(map))return{};var days=Object.create(null),out={};(program&&program.days||[]).forEach(function(day){var ids=Object.create(null);(day.ex||[]).forEach(function(ex){ids[String(ex.id)]=true;});days[String(day.key)]=ids;});
 Object.keys(map).slice(0,500).forEach(function(key){var match=/^w(\d+)_([A-Za-z0-9_-]{1,12})$/.exec(key),round=match?Number(match[1]):0,ids=match&&days[match[2]],list=map[key],max=Math.max(1,(program&&program.weeks||[]).length);if(!ids||round<1||round>max||!Array.isArray(list))return;var seen=Object.create(null),clean=[];list.slice(0,LIMITS.maxExPerDay).forEach(function(id){id=String(id);if(ids[id]&&!seen[id]){seen[id]=true;clean.push(id);}});if(clean.length)out[key]=clean;});return out;
}
function validProgramTimestamp(value){return typeof value==="number"&&isFinite(value)&&value>=0&&value<=Number.MAX_SAFE_INTEGER;}
function normalize(v){
 if(v.schemaVersion!=null&&(!Number.isInteger(v.schemaVersion)||v.schemaVersion>DATA_SCHEMA_VERSION||v.schemaVersion<1))throw new Error("Unbekannte Datenversion");
 if(v.personalExercises===undefined)v.personalExercises={};
 if(personalExerciseCatalogError(v.personalExercises))throw new Error("Persönliche Bibliothek beschädigt");
 if(!v.programs)v.programs={};
 var programIds=Object.keys(v.programs);
 if(!programIds.length){v.programs["default"]=clone(DEFAULT_PROGRAM);programIds=["default"];}
 for(var pid in v.programs){migrateProgram(v.programs[pid]);if(v.programs[pid].archived!==true)delete v.programs[pid].archived;if(v.programs[pid].source!=="coach")delete v.programs[pid].source;if(!validProgramTimestamp(v.programs[pid].createdAt))delete v.programs[pid].createdAt;if(!validProgramTimestamp(v.programs[pid].updatedAt))delete v.programs[pid].updatedAt;if(v.programs[pid].createdAt!=null&&v.programs[pid].updatedAt!=null&&v.programs[pid].updatedAt<v.programs[pid].createdAt)delete v.programs[pid].updatedAt;}
 for(var parentPid in v.programs){var parent=v.programs[parentPid].parent;if(typeof parent!=="string"||parent===parentPid||!v.programs[parent])delete v.programs[parentPid].parent;}
 if(!v.store)v.store={};
 if(!v.active||!v.programs[v.active]||v.programs[v.active].archived===true){var available=programIds.filter(function(id){return v.programs[id].archived!==true;});v.active=available[0]||programIds[0];if(v.programs[v.active].archived===true)delete v.programs[v.active].archived;}
 var p=v.programs[v.active];
 if(!v.store[v.active])v.store[v.active]=newStore(p);
 var st=v.store[v.active];
 if(!st.tg||typeof st.tg!=="object"||Array.isArray(st.tg))st.tg={};
 if(!st.barw||typeof st.barw!=="object"||Array.isArray(st.barw))st.barw={};
 if(!st.notes||typeof st.notes!=="object"||Array.isArray(st.notes))st.notes={};
 if(!st.logs||typeof st.logs!=="object"||Array.isArray(st.logs))st.logs={};
 Object.keys(st.logs).forEach(function(logKey){var cell=st.logs[logKey];if(!cell||typeof cell!=="object"||Array.isArray(cell))return;var swap=normalizeSwapName(cell.swap),swapWeight=normalizeSwapWeight(cell.swapWeight),swapDecision=normalizeSwapDecision(cell.swapDecision);if(swap){cell.swap=swap;if(swapWeight)cell.swapWeight=swapWeight;else delete cell.swapWeight;if(swapDecision)cell.swapDecision=swapDecision;else delete cell.swapDecision;}else{delete cell.swap;delete cell.swapWeight;delete cell.swapDecision;}});
 if(!Array.isArray(st.history))st.history=[];
 st.blockCelebrated=st.blockCelebrated===true;
 var keys=p.days.map(function(d){return d.key;});
 if(keys.indexOf(st.day)<0)st.day=keys[0];
 var weekCeiling=Math.max(1,(p.weeks||[]).length);if(!st.week||st.week>weekCeiling)st.week=Math.min(st.week||1,weekCeiling);if(st.week<1)st.week=1;
 if(st.workout&&(!plainObject(st.workout)))st.workout=null;
 if(st.workout){
  if(!st.workout.week)st.workout.week=st.week;
  if(!st.workout.day)st.workout.day=st.day;
  if(!finiteNumber(Number(st.workout.week),1,weekCeiling,true)||keys.indexOf(st.workout.day)<0){st.workout=null;}
 }
 if(st.workout){
  var workoutNow=Date.now();st.workout.week=Number(st.workout.week);
  st.workout.accrued=Math.max(0,Number(st.workout.accrued)||0);
  if(st.workout.accrued>604800)st.workout.accrued=604800;
  st.workout.firstStart=finiteNumber(Number(st.workout.firstStart),0,Number.MAX_SAFE_INTEGER,false)?Number(st.workout.firstStart):workoutNow;
  st.workout.startedAt=finiteNumber(Number(st.workout.startedAt),st.workout.firstStart,Number.MAX_SAFE_INTEGER,false)?Number(st.workout.startedAt):workoutNow;
  st.workout.running=st.workout.running===true;
  if(st.workout.running){st.workout.running=false;st.workout.startedAt=Date.now();}
  var hardcapBase=Number(st.workout.hardcapBase);st.workout.hardcapBase=isFinite(hardcapBase)&&hardcapBase>=0&&hardcapBase<=st.workout.accrued?hardcapBase:st.workout.accrued;
  st.workout.askedDone=st.workout.askedDone===true;
  st.workout.completedAt=finiteNumber(Number(st.workout.completedAt),0,Number.MAX_SAFE_INTEGER,false)?Number(st.workout.completedAt):0;
  st.workout.mode = ["fresh","continue","repeat"].indexOf(st.workout.mode)>=0?st.workout.mode:"fresh";
  st.workout.segmentsBase=finiteNumber(Number(st.workout.segmentsBase),0,1000,true)?Number(st.workout.segmentsBase):0;
  st.week=st.workout.week;
  if(keys.indexOf(st.workout.day)>=0)st.day=st.workout.day;
  st.workout.pendingReplacements=sanitizePendingReplacements(st.workout.pendingReplacements,v.active,p);
 }
 st.pendingReplacements=sanitizePendingReplacements(st.pendingReplacements,v.active,p);
 Object.keys(v.store).forEach(function(pid){var logs=v.store[pid]&&v.store[pid].logs||{};Object.keys(logs).forEach(function(key){var cell=logs[key];if(cell&&(cell.performedExercise!==undefined&&performedExerciseError(cell.performedExercise)||cell.pendingPerformedExercise!==undefined&&performedExerciseError(cell.pendingPerformedExercise)))throw new Error("Historische Erfassung beschädigt");});});
 v.schemaVersion=DATA_SCHEMA_VERSION;alias(v);return v;
}
function syncStore(){S.store[S.active]={tg:S.tg,barw:S.barw,notes:S.notes,logs:S.logs,history:S.history,workout:S.workout,pendingReplacements:S.pendingReplacements,removedEx:S.removedEx,week:S.week,day:S.day,blockCelebrated:S.blockCelebrated===true};}
function persist(){
 if(localWriteBlocked())return false;
 try{
  var snapshot={schemaVersion:DATA_SCHEMA_VERSION,personalExercises:S.personalExercises||{},programs:S.programs,active:S.active,store:S.store};
  if(backupSizeError(JSON.stringify(snapshot,null,1)))throw new Error("Backup-Größenlimit erreicht");
  var payload=JSON.stringify(snapshot);
  if(localWriteBlocked())return false;
  localStorage.setItem(KEY,payload);
  localStoredSnapshot=payload;localWriterDirty=false;localWriterDraftSecured=false;
  storageErrorShown=false;return true;
 }catch(e){
  if(!storageErrorShown){storageErrorShown=true;setTimeout(function(){showModal("Speichern fehlgeschlagen","Deine aktuellen Daten sind noch in der geöffneten App, konnten aber nicht dauerhaft gespeichert werden. Bitte jetzt ein Backup herunterladen und erst danach die Seite schließen.",[{label:"Backup speichern",cls:"primary",action:function(){downloadText("satzkraft-notfall-backup.json",backupJSON());}},{label:"Schließen",action:null}]);},0);}
  return false;
 }
}
var saveT,backupRestorePending=false;function save(){if(backupRestorePending||localWriteBlocked())return false;localWriterDirty=true;localWriterDraftSecured=false;syncStore();clearTimeout(saveT);saveT=setTimeout(persist,400);return true;}
function flushSave(){if(backupRestorePending||localWriteBlocked())return false;localWriterDirty=true;syncStore();clearTimeout(saveT);saveT=null;return persist();}
document.addEventListener("visibilitychange",function(){if(localWriteBlocked())return;if(document.visibilityState==="hidden")flushSave();});
window.addEventListener("pagehide",function(){if(!localWriteBlocked())flushSave();releaseLocalWriter();});
window.addEventListener("pageshow",function(event){if(event.persisted)requestLocalWriter();});
window.addEventListener("storage",function(event){
 if(event.key===KEY||event.key===null){if(localWriterState==="owner")localWriteBlocked();return;}
 if(event.key!==RESET_GENERATION_KEY||(event.newValue||"")===localResetGeneration)return;
 localDataDeletionPending=true;backupRestorePending=true;blockLocalWriter("conflict");
});
