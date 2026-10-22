// Inserted into the shared app's lexical scope by the native build only.
async function downloadText(name, text) {
 return window.SatzkraftNative.exportFile(name,text);
}
async function clearLocalAppData(){
 if(localWriteBlocked())return false;
 var next=window.SatzkraftNative.storage.snapshot();
 localAppStorageKeys().forEach(function(key){delete next[key];});
 next[RESET_GENERATION_KEY]=Date.now()+"-"+Math.random().toString(36).slice(2);
 clearTimeout(saveT);saveT=null;backupRestorePending=true;localDataDeletionPending=true;
 try{
  await window.SatzkraftNative.busy(async function(){await window.SatzkraftNative.storage.commit(next);});
  location.reload();return true;
 }catch(error){backupRestorePending=false;localDataDeletionPending=false;return false;}
}
function confirmBackupRestore(raw){
 if(localWriteBlocked())return;
 if(programWriteLocked()){showProgramWriteLocked();return;}
 showModal("Backup wiederherstellen?","Diese Datei ersetzt alle Programme und Trainingsdaten in dieser App. Speichere zuerst die Sicherheitskopie über „In Dateien sichern“.",[
  {label:"Sichern & wiederherstellen",cls:"danger",action:async function(){
   if(localWriteBlocked())return;
   if(!await downloadFullBackup("satzkraft-vor-wiederherstellung"))return;
   if(localWriteBlocked()||programWriteLocked())return;
   showModal("Sicherheitskopie gespeichert?","Prüfe die Datei, bevor du den bisherigen Stand ersetzt.",[
    {label:"Datei geprüft – wiederherstellen",cls:"danger",action:async function(){
     if(localWriteBlocked()||programWriteLocked())return;
     clearTimeout(saveT);saveT=null;backupRestorePending=true;
     try{
      var restored=clone(raw);restored.schemaVersion=DATA_SCHEMA_VERSION;
      var next=window.SatzkraftNative.storage.snapshot();next[KEY]=JSON.stringify(restored);
      await window.SatzkraftNative.busy(async function(){await window.SatzkraftNative.storage.commit(next);});
      location.reload();
     }catch(error){
      backupRestorePending=false;
      showModal("Wiederherstellung fehlgeschlagen","Das Backup konnte nicht gespeichert werden. Der bisherige Stand bleibt geöffnet.",[{label:"OK",action:null}]);
     }
    }},
    {label:"Abbrechen",action:null}
   ]);
  }},
  {label:"Abbrechen",action:null}
 ]);
}
function requestPersistentStorageOnce(){ /* Native checkpoint storage replaces browser eviction requests. */ }
