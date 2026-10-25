// ---------- Ein schreibbares Fenster je lokalem Speicherbereich ----------
function localWindowHasDraft(){
 return localWriterDirty||storageErrorShown||!!(typeof personalDraft!=="undefined"&&personalDraft)||(typeof editorHasUnsavedChanges==="function"&&editorHasUnsavedChanges())||!!document.querySelector('[data-time-draft="1"]');
}
function renderLocalWindowNotice(){
 var notice=document.getElementById("windowNotice");if(!notice)return;
 var wasHidden=notice.hidden;notice.hidden=localWriterState==="owner";
 if(notice.hidden){updateSurfaceIsolation();return;}
 var title="Satzkraft ist in einem anderen Fenster geöffnet",text="Dort kannst du weitertrainieren. Schließe das andere Fenster und lade dann hier den aktuellen Stand.",pending=localWriterState==="pending";
 if(pending){title="Trainingsstand wird geprüft";text="Einen Moment bitte. Deine lokalen Daten werden vorbereitet.";}
 else if(localWriterState==="conflict"||localWriterState==="suspended"){title="Der Trainingsstand hat sich geändert";text="Dieses Fenster speichert jetzt keine Änderungen. Schließe weitere Satzkraft-Fenster und lade hier bewusst den aktuellen Stand. Ein laufendes Training wird dabei pausiert.";}
 else if(localWriterState==="unsupported"){title="Bitte in einem aktuellen Browser öffnen";text="Dieser Browser kann mehrere App-Fenster nicht sicher koordinieren. Deine Daten bleiben erhalten. Öffne Satzkraft über den normalen App-Link in einem aktuellen Browser.";}
 else if(localWriterState==="unavailable"){title="Lokale Daten gerade nicht verfügbar";text="Der Browser hat den Zugriff nicht zugelassen. Dieses Fenster speichert keine Änderungen. Du kannst deinen geöffneten Stand sichern und es danach erneut versuchen.";}
 if(localWriterState==="recovery"){
  notice.innerHTML='<div class="windowcard"><h2 id="windowNoticeTitle">Trainingsdaten geschützt</h2><p>Die gespeicherten Daten konnten nicht gelesen werden. Satzkraft schreibt nichts darüber. Sichere zuerst die Originaldatei. Du kannst sie später zur Reparatur verwenden.</p><div class="windowactions"><button class="smallbtn" id="windowReload">Erneut lesen</button>'+(loadIssueRaw?'<button class="smallbtn go" id="windowRecoveryExport">Originaldaten sichern</button><button class="smallbtn" id="windowRecoveryReset"'+(recoveryExported?'':' disabled')+'>Nach Sicherung neu beginnen</button>':'')+'</div><p id="windowFeedback" role="status"></p></div>';
  updateSurfaceIsolation();if(wasHidden)notice.focus();return;
 }
 var dirty=localWindowHasDraft(),secured=localWriterDraftSecured;
 if(dirty)text+=" Sichere zuerst die ungespeicherten Änderungen oder verwirf sie bewusst.";
 notice.innerHTML='<div class="windowcard"><h2 id="windowNoticeTitle">'+esc(title)+'</h2><p>'+esc(text)+'</p><div class="windowactions">'+(pending?'':'<button class="smallbtn go" id="windowReload">'+(dirty&&!secured?'Änderungen verwerfen & Stand laden':'Aktuellen Stand laden')+'</button><button class="smallbtn" id="windowBackup">'+(dirty?'Ungespeicherten Stand sichern':'Geöffneten Stand sichern')+'</button>')+'</div><p id="windowFeedback" role="status" style="margin:12px 0 0"></p></div>';
 updateSurfaceIsolation();
 if(wasHidden||notice.contains(document.activeElement)||document.activeElement===document.body)notice.focus();
}
function blockLocalWriter(reason){
 if(localWriterState===reason)return;
 localWriterState=reason;clearTimeout(saveT);saveT=null;
 cancelWorkoutPauseHold();cancelAllAutoRest();clearDonePrompt();releaseWakeLock();
 renderLocalWindowNotice();
}
function releaseLocalWriter(){
 ++localWriterRequest;localWriterState="suspended";
 if(localWriterRelease){var release=localWriterRelease;localWriterRelease=null;release();}
}
function requestLocalWriter(discardDraft){
 if(localWindowHasDraft()&&!localWriterDraftSecured&&!discardDraft){renderLocalWindowNotice();return;}
 releaseLocalWriter();var request=localWriterRequest;
 localWriterState="pending";renderLocalWindowNotice();
 if(!navigator.locks||typeof navigator.locks.request!=="function"){blockLocalWriter("unsupported");return;}
 try{
  var previous=localWriterCompletion;
  localWriterCompletion=Promise.resolve(previous).then(function(){
  if(request!==localWriterRequest)return;
  return navigator.locks.request("satzkraft-local-writer-v1",{mode:"exclusive",ifAvailable:true},function(lock){
   if(request!==localWriterRequest)return;
   if(!lock){blockLocalWriter("other");return;}
   return new Promise(function(release){
    localWriterRelease=release;
    try{
     loadIssueRaw="";loadIssueText="";recoveryExported=false;
     localResetGeneration=localStorage.getItem(RESET_GENERATION_KEY)||"";
     localDataDeletionPending=false;backupRestorePending=false;
     S=load();localWriterDirty=false;localWriterDraftSecured=false;storageErrorShown=false;localWriterState="owner";
     // Niemals den früher geladenen Stand oder Live-Timer des zweiten Fensters übernehmen.
     resetRestState();clearRestFocus();resetProgramEditorState();personalDraft=null;personalFormSourceId=null;exerciseLibraryView="";pendingProgramImport=null;importIssue=null;
     ["lib","report","protocol","wucd"].forEach(function(id){document.getElementById(id).classList.remove("open");});
     document.getElementById("modal").style.display="none";unlockSurfaceScroll();
     renderView();renderBar();renderLocalWindowNotice();
     if(loadIssueText){blockLocalWriter("recovery");return;}
     if(!localWriterInitialized){localWriterInitialized=true;initializeWritableApp();}
     if(!localWriteBlocked())focusSurface(document.getElementById("app"),"#libbtn");
    }catch(e){blockLocalWriter("unavailable");}
   });
  });
  }).catch(function(){if(request===localWriterRequest)blockLocalWriter("unavailable");});
 }catch(e){blockLocalWriter("unavailable");}
}
function replaceRecoveredState(payload){
 localStorage.setItem(KEY,payload);
 localStoredSnapshot=payload;loadIssueText="";loadIssueRaw="";
 location.reload();return true;
}
document.getElementById("windowNotice").addEventListener("click",function(event){
 var button=event.target.closest("button");if(!button)return;
 if(button.id==="windowRecoveryExport"){
  var exported=loadIssueRaw&&downloadText("satzkraft-originaldaten-rettung.txt",loadIssueRaw);
  recoveryExported=!!exported;document.getElementById("windowRecoveryReset").disabled=!recoveryExported;
  document.getElementById("windowFeedback").textContent=exported?"Prüfe die Originaldatei in deinen Dateien oder Downloads. Bewahre sie für die Wiederherstellung auf.":"Die Datei konnte nicht vorbereitet werden. Lass dieses Fenster geöffnet.";return;
 }
 if(button.id==="windowRecoveryReset"){
  if(!recoveryExported||!loadIssueRaw||localWriterState!=="recovery")return;
  if(button.dataset.confirmReset!=="1"){button.dataset.confirmReset="1";button.textContent="Originaldatei geprüft – Daten ersetzen";document.getElementById("windowFeedback").textContent="Die vorhandenen App-Daten werden durch ein leeres Standardprogramm ersetzt. Fortfahren nur, wenn du die Originaldatei gesichert hast.";return;}
  try{
   if(localStorage.getItem(KEY)!==localStoredSnapshot||(localStorage.getItem(RESET_GENERATION_KEY)||"")!==localResetGeneration){blockLocalWriter("conflict");return;}
   var replacement=initState(),replacementJSON=JSON.stringify({schemaVersion:DATA_SCHEMA_VERSION,personalExercises:replacement.personalExercises,programs:replacement.programs,active:replacement.active,store:replacement.store});
   if(!replaceRecoveredState(replacementJSON))throw new Error("Recovery commit failed");
  }catch(error){document.getElementById("windowFeedback").textContent="Neustart fehlgeschlagen. Deine Originaldatei bleibt die Grundlage zur Rettung.";}
  return;
 }
 if(button.id==="windowReload"){
  if(localWindowHasDraft()&&!localWriterDraftSecured){
   if(button.dataset.confirmDiscard!=="1"){button.dataset.confirmDiscard="1";button.textContent="Wirklich verwerfen & Stand laden";document.getElementById("windowFeedback").textContent="Ungesicherte Änderungen gehen dabei verloren.";return;}
  }
  requestLocalWriter(true);
 }else if(button.id==="windowBackup"){
  var ok=false;
  try{
   var backup=JSON.parse(backupJSON());
   if(localWindowHasDraft()){
    var fields=Array.prototype.map.call(document.querySelectorAll('#app input, #lib input, #lib textarea, #lib select'),function(field){return{id:field.id,value:field.value,checked:field.checked,dataset:Object.assign({},field.dataset)};});
    backup.windowDraft={format:"satzkraft-fenster-entwurf",version:1,program:editorDraft,personalExercise:typeof personalDraft!=="undefined"?personalDraft:null,fields:fields};
   }
   ok=downloadText("satzkraft-fenster-backup.json",JSON.stringify(backup,null,2));
  }catch(e){ok=false;}
  if(ok){localWriterDraftSecured=true;document.getElementById("windowReload").textContent="Datei geprüft – aktuellen Stand laden";document.getElementById("windowFeedback").textContent="Prüfe die heruntergeladene Datei, bevor du den aktuellen Stand lädst. Der Entwurf im Backup dient zur manuellen Wiederaufnahme.";}
  else document.getElementById("windowFeedback").textContent="Die Sicherung konnte nicht heruntergeladen werden. Lass dieses Fenster geöffnet.";
 }
});
// Inert verhindert die Bedienung; der Capture-Schutz prüft zusätzlich vor jeder Aktion den Speicherstand.
["click","pointerdown","keydown","beforeinput","input","change","paste","focusout"].forEach(function(type){document.addEventListener(type,function(event){
 var notice=document.getElementById("windowNotice"),target=event.target;
 if(notice.contains(target)){
  if(type==="keydown"&&event.key==="Tab"&&!notice.hidden){var buttons=notice.querySelectorAll("button"),first=buttons[0],last=buttons[buttons.length-1];if(first&&(event.shiftKey&&(target===first||target===notice)||!event.shiftKey&&(target===last||target===notice))){event.preventDefault();(event.shiftKey?last:first).focus();}}
  return;
 }
 if(target&&target.tagName==="A"&&target.download)return;
 if(localWriteBlocked()){event.preventDefault();event.stopImmediatePropagation();}
},true);});
