function validBackupNumber(v,max){if(v==="")return true;if(typeof v==="number")return isFinite(v)&&v>=0&&v<=max;if(typeof v==="string"&&v.length<=20)return /^\d+(?:\.\d+)?$/.test(v)&&Number(v)<=max;return false;}
function validBackupCount(v,max){return validBackupNumber(v,max)&&(v===""||Math.floor(Number(v))===Number(v));}
function validBackupDayKey(value){return typeof value==="string"&&/^[A-Za-z0-9_-]{1,12}$/.test(value);}
function validBackupExerciseId(value){return typeof value==="string"&&/^[A-Za-z0-9_-]{1,80}$/.test(value);}
function validBackupPendingReplacements(pending,id,exerciseDays){if(!Array.isArray(pending)||pending.length>12)return false;for(var pi=0;pi<pending.length;pi++){var request=pending[pi];if(!plainObject(request)||request.programId!==id||typeof request.day!=="string"||typeof request.exId!=="string"||!exerciseDays[request.day+"|"+request.exId]||typeof request.name!=="string"||!request.name.trim()||request.name.length>80)return false;}return true;}
function validBackupRemovedExercises(removed,program,exerciseDays){
 if(!plainObject(removed))return false;var keys=Object.keys(removed),max=program.weeks.length;if(keys.length>500)return false;
 for(var i=0;i<keys.length;i++){var key=keys[i],match=/^w(\d+)_([A-Za-z0-9_-]{1,12})$/.exec(key),round=match?Number(match[1]):0,day=match&&match[2],list=removed[key],seen=Object.create(null);if(round<1||round>max||!day||!program.days.some(function(item){return item.key===day;})||!Array.isArray(list)||list.length>LIMITS.maxExPerDay)return false;for(var j=0;j<list.length;j++){var exId=list[j];if(typeof exId!=="string"||seen[exId]||!exerciseDays[day+"|"+exId])return false;seen[exId]=true;}}
 return true;
}
function validBackupWorkout(workout,program,id,exerciseDays){
 if(!plainObject(workout))return false;
 if(workout.week!=null&&!finiteNumber(workout.week,1,program.weeks.length,true))return false;
 if(workout.day!=null&&(typeof workout.day!=="string"||!program.days.some(function(day){return day.key===workout.day;})))return false;
 if(workout.running!=null&&typeof workout.running!=="boolean"||workout.askedDone!=null&&typeof workout.askedDone!=="boolean")return false;
 if(workout.startedAt!=null&&!finiteNumber(workout.startedAt,0,Number.MAX_SAFE_INTEGER,false)||workout.firstStart!=null&&!finiteNumber(workout.firstStart,0,Number.MAX_SAFE_INTEGER,false)||workout.completedAt!=null&&!finiteNumber(workout.completedAt,0,Number.MAX_SAFE_INTEGER,false))return false;
 if(workout.accrued!=null&&!finiteNumber(workout.accrued,0,604800,false)||workout.hardcapBase!=null&&!finiteNumber(workout.hardcapBase,0,604800,false)||workout.accrued!=null&&workout.hardcapBase!=null&&workout.hardcapBase>workout.accrued)return false;
 if(workout.segmentsBase!=null&&!finiteNumber(workout.segmentsBase,0,1000,true)||workout.mode!=null&&["fresh","continue","repeat"].indexOf(workout.mode)<0)return false;
 if(workout.pendingReplacements!=null&&!validBackupPendingReplacements(workout.pendingReplacements,id,exerciseDays))return false;
 return true;
}
function validateBackupStore(st,id,program){
 if(!plainObject(st)||!plainObject(st.tg)||!plainObject(st.logs)||!Array.isArray(st.history))return'Fortschritt von „'+esc(program.name||id)+'“ ist unvollständig.';
 if(st.barw!=null&&!plainObject(st.barw)||st.notes!=null&&!plainObject(st.notes))return'Fortschritt von „'+esc(program.name||id)+'“ enthält ungültige Übungseinstellungen.';
 var barw=st.barw||{},notes=st.notes||{},tgKeys=Object.keys(st.tg),barKeys=Object.keys(barw),noteKeys=Object.keys(notes),logKeys=Object.keys(st.logs),dayKeysForProgram=program.days.map(function(d){return d.key;}),exerciseIds={},exerciseDays={},exerciseByDay={},invalidExerciseId=false,maxRound=LIMITS.maxWeeks,currentRoundMax=program.weeks.length;program.days.forEach(function(day){(day.ex||[]).forEach(function(ex){if(!ex||!validBackupExerciseId(ex.id)||exerciseIds[ex.id]){invalidExerciseId=true;return;}exerciseIds[ex.id]=true;exerciseDays[day.key+"|"+ex.id]=true;exerciseByDay[day.key+"|"+ex.id]=ex;});});
 if(invalidExerciseId)return'Programm „'+esc(program.name||id)+'“ enthält ungültige interne Übungskennungen.';
 if(tgKeys.length>5000||barKeys.length>500||noteKeys.length>500||logKeys.length>5000||st.history.length>5000)return'Fortschritt von „'+esc(program.name||id)+'“ enthält ungewöhnlich viele Einträge.';
 if(!finiteNumber(st.week,1,currentRoundMax,true)||typeof st.day!=="string"||dayKeysForProgram.indexOf(st.day)<0)return'Fortschritt von „'+esc(program.name||id)+'“ verweist auf eine ungültige Woche oder einen ungültigen Tag.';
 for(var ti=0;ti<tgKeys.length;ti++){var tgParts=tgKeys[ti].split("|");if(tgParts.length!==2||!finiteNumber(Number(tgParts[0]),1,maxRound,true)||!validBackupExerciseId(tgParts[1])||!validBackupNumber(st.tg[tgKeys[ti]],2000))return'Fortschritt von „'+esc(program.name||id)+'“ enthält ein ungültiges Arbeitsgewicht.';}
 for(var bi=0;bi<barKeys.length;bi++)if(!validBackupExerciseId(barKeys[bi])||!validBackupNumber(barw[barKeys[bi]],50)||Number(barw[barKeys[bi]])<1)return'Fortschritt von „'+esc(program.name||id)+'“ enthält ein ungültiges Stangengewicht.';
 for(var ni=0;ni<noteKeys.length;ni++)if(!validBackupExerciseId(noteKeys[ni])||typeof notes[noteKeys[ni]]!=="string"||notes[noteKeys[ni]].length>500)return'Fortschritt von „'+esc(program.name||id)+'“ enthält eine ungültige Übungsnotiz.';
 for(var li=0;li<logKeys.length;li++){
  var logParts=logKeys[li].split("|"),cell=st.logs[logKeys[li]];if(logParts.length!==3||!finiteNumber(Number(logParts[0]),1,maxRound,true)||!validBackupDayKey(logParts[1])||!validBackupExerciseId(logParts[2])||!plainObject(cell)||!Array.isArray(cell.sets)||cell.sets.length>LIMITS.maxSets)return'Fortschritt von „'+esc(program.name||id)+'“ enthält ungültige Satzdaten.';
  if(cell.swap!=null&&(typeof cell.swap!=="string"||!cell.swap.trim()||cell.swap.length>80))return'Fortschritt von „'+esc(program.name||id)+'“ enthält einen ungültigen Übungstausch.';
  if(cell.swapWeight!=null&&(!cell.swap||cell.swapWeight===""||!validBackupNumber(cell.swapWeight,2000)))return'Fortschritt von „'+esc(program.name||id)+'“ enthält ein ungültiges Ersatzgewicht.';
  if(cell.swapDecision!=null&&(!cell.swap||["pending","training","permanent"].indexOf(cell.swapDecision)<0))return'Fortschritt von „'+esc(program.name||id)+'“ enthält einen ungültigen Tauschstatus.';
  if(cell.pendingPerformedExercise!==undefined&&performedExerciseError(cell.pendingPerformedExercise)||cell.performedExercise!==undefined&&performedExerciseError(cell.performedExercise))return 'Fortschritt von „'+esc(program.name||id)+'“ enthält eine ungültige historische Übungserfassung.';
  var loggedExercise=exerciseByDay[logParts[1]+"|"+logParts[2]],loggedUnit=(cell.performedExercise||cell.pendingPerformedExercise)?(cell.performedExercise||cell.pendingPerformedExercise).unit:loggedExercise&&loggedExercise.unit,loggedRepMax=loggedUnit==="seconds"?5999:9999;
  for(var si=0;si<cell.sets.length;si++){var set=cell.sets[si];if(!plainObject(set)||!validBackupCount(set.reps,loggedRepMax)||!validBackupNumber(set.weight,2000))return'Fortschritt von „'+esc(program.name||id)+'“ enthält ungültige Wiederholungs-, Zeit- oder Gewichtswerte.';}
 }
 for(var hi=0;hi<st.history.length;hi++){
  var entry=st.history[hi];if(!plainObject(entry)||!finiteNumber(entry.week,1,maxRound,true)||!validBackupDayKey(entry.day)||!finiteNumber(entry.start,0,Number.MAX_SAFE_INTEGER,false)||!finiteNumber(entry.end,0,Number.MAX_SAFE_INTEGER,false)||!finiteNumber(entry.dur,0,86400,false))return'Fortschritt von „'+esc(program.name||id)+'“ enthält einen ungültigen Verlaufseintrag.';
  if(entry.complete!=null&&typeof entry.complete!=="boolean")return'Fortschritt von „'+esc(program.name||id)+'“ enthält einen ungültigen Abschlussstatus.';
 }
 if(st.pendingReplacements!=null&&!validBackupPendingReplacements(st.pendingReplacements,id,exerciseDays))return'Fortschritt von „'+esc(program.name||id)+'“ enthält ungültige vorgemerkte Übungstausche.';
 if(st.removedEx!=null&&!validBackupRemovedExercises(st.removedEx,program,exerciseDays))return'Fortschritt von „'+esc(program.name||id)+'“ enthält ungültige vorübergehend entfernte Übungen.';
 if(st.workout&&st.workout.pendingReplacements!=null&&!validBackupPendingReplacements(st.workout.pendingReplacements,id,exerciseDays))return'Fortschritt von „'+esc(program.name||id)+'“ enthält einen ungültigen vorgemerkten Übungstausch.';
 if(st.workout!=null&&!validBackupWorkout(st.workout,program,id,exerciseDays))return'Fortschritt von „'+esc(program.name||id)+'“ enthält eine ungültige laufende Einheit.';
 if(st.blockCelebrated!=null&&typeof st.blockCelebrated!=="boolean")return'Fortschritt von „'+esc(program.name||id)+'“ enthält einen ungültigen Blockabschluss.';
 return null;
}
function validateBackupFile(raw){
 if(raw&&raw.deviceTestData===true)return"Diese Datei enthält alte Testdaten. Bitte wähle ein vollständiges Backup deiner Trainingsdaten.";
 if(!plainObject(raw)||!plainObject(raw.programs)||!Object.keys(raw.programs).length||!plainObject(raw.store))return"Backup-Struktur ist unvollständig.";
 if(raw.schemaVersion!=null&&!finiteNumber(raw.schemaVersion,1,DATA_SCHEMA_VERSION,true))return"Das Backup stammt aus einer neueren oder unbekannten Datenversion.";
 if(typeof raw.active!=="string"||!Object.prototype.hasOwnProperty.call(raw.programs,raw.active)||!plainObject(raw.programs[raw.active])||raw.programs[raw.active].archived===true)return"Das aktive Programm im Backup ist ungültig.";
 if(raw.personalExercises!==undefined&&personalExerciseCatalogError(raw.personalExercises))return personalExerciseCatalogError(raw.personalExercises);
 var usesNewData=raw.personalExercises&&Object.keys(raw.personalExercises).length;
 Object.keys(raw.store).forEach(function(pid){var logs=raw.store[pid]&&raw.store[pid].logs||{};Object.keys(logs).forEach(function(key){if(logs[key]&&(logs[key].performedExercise||logs[key].pendingPerformedExercise))usesNewData=true;});});
 if(usesNewData&&raw.schemaVersion!==5)return "Historische Erfassung und persönliche Übungen benötigen Datenversion 5.";
 var ids=Object.keys(raw.programs);
 // The file-size limit bounds imports; archived blocks must remain restorable.
 var storeIds=Object.keys(raw.store);for(var sk=0;sk<storeIds.length;sk++)if(ids.indexOf(storeIds[sk])<0)return'Das Backup enthält Fortschritt für ein unbekanntes Programm.';
 for(var i=0;i<ids.length;i++){
  var id=ids[i],program=raw.programs[id],check=null;if(!/^[A-Za-z0-9_-]{1,80}$/.test(id)||Object.prototype.hasOwnProperty.call(Object.prototype,id))return"Das Backup enthält einen ungültigen Programm-Schlüssel.";
  if(!plainObject(program))return'Programm „'+esc(id)+'“ im Backup ist beschädigt.';
  if(program.archived!=null&&typeof program.archived!=="boolean")return'Programm „'+esc((program&&program.name)||id)+'“ enthält einen ungültigen Archivstatus.';
  try{(program.days||[]).forEach(function(day){(day.ex||[]).forEach(function(ex){if(!check&&exerciseReferenceError(ex,true))check=exerciseReferenceError(ex,true);});});}catch(e){return'Programm „'+esc(id)+'“ im Backup ist beschädigt.';}if(check)return'Programm „'+esc(program.name||id)+'“: '+check;
  for(var di=0;di<(program.days||[]).length;di++)for(var ei=0;ei<(program.days[di].ex||[]).length;ei++){var px=program.days[di].ex[ei];if(px.exerciseDefinition){var savedDef=raw.personalExercises&&raw.personalExercises[px.exerciseId];if(!savedDef||personalExerciseTrackingKey(savedDef)!==personalExerciseTrackingKey(px.exerciseDefinition))return "Eine persönliche Programmübung fehlt in der Sicherung oder hat eine widersprüchliche Erfassung.";}}
  if(program.parent!=null&&(typeof program.parent!=="string"||program.parent===id||!Object.prototype.hasOwnProperty.call(raw.programs,program.parent)))return'Programm „'+esc((program&&program.name)||id)+'“ enthält einen ungültigen Vorblock-Verweis.';
  if((program.source!=null&&program.source!=="coach")||(program.origin!=null&&program.origin!=="satzkraft"))return'Programm „'+esc((program&&program.name)||id)+'“ enthält eine ungültige Herkunft.';
  if(program.createdAt!=null&&!finiteNumber(program.createdAt,0,Number.MAX_SAFE_INTEGER,false)||program.updatedAt!=null&&!finiteNumber(program.updatedAt,0,Number.MAX_SAFE_INTEGER,false)||program.createdAt!=null&&program.updatedAt!=null&&program.updatedAt<program.createdAt)return'Programm „'+esc((program&&program.name)||id)+'“ enthält einen ungültigen Datum-Zeitstempel.';
  try{check=parseProgram(JSON.stringify(exportTranslate(program)));}catch(e){return'Programm „'+esc(id)+'“ im Backup ist beschädigt.';}
  if(check.err)return'Programm „'+esc((program&&program.name)||id)+'“ im Backup ist ungültig: '+check.err;
  if(!Object.prototype.hasOwnProperty.call(raw.store,id))return'Fortschritt von „'+esc(program.name||id)+'“ ist unvollständig.';
  var storeErr=validateBackupStore(raw.store[id],id,program);if(storeErr)return storeErr;
 }
 return null;
}
function confirmBackupRestore(raw){
 if(localWriteBlocked())return;
 if(programWriteLocked()){showProgramWriteLocked();return;}
 showModal("Backup wiederherstellen?","Diese Datei ersetzt alle Programme und den gesamten Fortschritt. Lade zuerst eine Sicherheitskopie des aktuellen Stands herunter.",[
  {label:"Sichern & wiederherstellen",cls:"danger",action:function(){
   if(localWriteBlocked()||programWriteLocked()){showModal("Wiederherstellung abgebrochen","Der Trainingsstand hat sich geändert. Lade den aktuellen Stand, bevor du das Backup wiederherstellst.",[{label:"OK",action:null}]);return;}
   if(!downloadFullBackup("satzkraft-vor-wiederherstellung")){showModal("Wiederherstellung abgebrochen","Die Sicherheitskopie konnte nicht vorbereitet werden. Deine aktuellen Daten bleiben erhalten.",[{label:"OK",action:null}]);return;}
   if(localWriteBlocked()) {showModal("Wiederherstellung abgebrochen","Der Trainingsstand hat sich geändert.",[{label:"OK",action:null}]);return;}
   showModal("Sicherheitskopie gespeichert?","Prüfe, ob die Datei in deinen Dateien oder Downloads vorhanden ist. Erst danach wird der bisherige Stand ersetzt.",[
    {label:"Datei geprüft – wiederherstellen",cls:"danger",action:function(){
     if(localWriteBlocked()||programWriteLocked()){showModal("Wiederherstellung abgebrochen","Der Trainingsstand hat sich geändert. Lade den aktuellen Stand, bevor du das Backup wiederherstellst.",[{label:"OK",action:null}]);return;}
     var savePaused=false;try{var restored=clone(raw);restored.schemaVersion=DATA_SCHEMA_VERSION;var restoredJSON=JSON.stringify(restored);if(localWriteBlocked()){showModal("Wiederherstellung abgebrochen","Die lokalen Daten wurden während der Sicherung in einem anderen App-Fenster zurückgesetzt. Lade Satzkraft neu, bevor du ein Backup wiederherstellst.",[{label:"Neu laden",cls:"primary",action:function(){location.reload();}}]);return;}clearTimeout(saveT);saveT=null;savePaused=true;backupRestorePending=true;localStorage.setItem(KEY,restoredJSON);localStoredSnapshot=restoredJSON;localWriterDirty=false;setTimeout(function(){location.reload();},350);}catch(e){backupRestorePending=false;if(savePaused&&typeof save==="function")save();showModal("Wiederherstellung fehlgeschlagen","Das Backup konnte nicht gespeichert werden. Deine bisherigen Daten wurden nicht verändert.",[{label:"OK",action:null}]);}
    }},
    {label:"Abbrechen",action:null}
   ]);
  }},
  {label:"Abbrechen",action:null}
 ]);
}
function importBackup(text){
 if(programWriteLocked()){showProgramWriteLocked();return;}
 var sizeError=backupSizeError(text);if(sizeError){showModal("Backup nicht geladen",sizeError,[{label:"OK",action:null}]);return;}
 var raw;try{raw=JSON.parse(text);}catch(e){showModal("Backup nicht geladen","Die Datei enthält kein gültiges JSON. Deine aktuellen Daten bleiben unverändert.",[{label:"OK",action:null}]);return;}
 if(!raw||!raw.programs||!raw.store){showModal("Backup nicht geladen","Die Datei ist kein vollständiges Satzkraft-Backup. Für einzelne Programme nutze bitte „Programm laden“.",[{label:"OK",action:null}]);return;}
 var backupErr=validateBackupFile(raw);if(backupErr){showModal("Backup nicht geladen",backupErr+'<br><br><span style="color:var(--muted)">Deine aktuellen Daten bleiben unverändert.</span>',[{label:"OK",action:null}]);return;}
 confirmBackupRestore(raw);
}
