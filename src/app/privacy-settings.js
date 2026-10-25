// Altbestand des entfernten API-Coachs: nur Antworten entfernen, Programme erhalten.
function removeLegacyCoachAnswers(){
 if(localWriteBlocked())return false;
 try{
  if(localStorage.getItem("satzkraft-coach-prefs")!=null){
   localStorage.setItem("satzkraft-coach-reset-v1","removed-api-"+Date.now());
   localStorage.removeItem("satzkraft-coach-prefs");
  }
  return true;
 }catch(e){return false;}
}
// Alte Testdaten bleiben ungenutzt erhalten; nur die bewusst bestätigte Komplettlöschung entfernt sie.
function localAppStorageKeys(){return[KEY,"cali-plan-v2",THEME_KEY,"satzkraft-training-view-v1",BACKUP_META_KEY,PERSIST_REQUEST_KEY,REDESIGN_NOTICE_KEY,"satzkraft-coach-prefs","satzkraft-coach-reset-v1","satzkraft-device-test-mode-v1","satzkraft-device-test-reports-v1","satzkraft-device-test-v1:cali-plan-v3","satzkraft-device-test-v1:training-theme-v1","satzkraft-device-test-v1:satzkraft-backup-meta-v1","satzkraft-device-test-v1:satzkraft-storage-persist-v1","satzkraft-device-test-v1:satzkraft-design-update-v1","satzkraft-device-test-v1:satzkraft-reset-v1"];}
function clearLocalAppData(){
 if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 var keys=localAppStorageKeys(),previous={},previousGeneration="",nextGeneration=Date.now()+"-"+Math.random().toString(36).slice(2),snapshotComplete=false,mutationStarted=false,savePaused=false;
 try{
  keys.forEach(function(key){previous[key]=localStorage.getItem(key);});previousGeneration=localStorage.getItem(RESET_GENERATION_KEY)||"";snapshotComplete=true;
  clearTimeout(saveT);saveT=null;savePaused=true;backupRestorePending=true;localDataDeletionPending=true;
  mutationStarted=true;
  localStorage.setItem(RESET_GENERATION_KEY,nextGeneration);localResetGeneration=nextGeneration;
  keys.forEach(function(key){localStorage.removeItem(key);});
  setTimeout(function(){location.reload();},150);return true;
 }catch(error){
  if(snapshotComplete&&mutationStarted){
   try{keys.forEach(function(key){if(previous[key]==null)localStorage.removeItem(key);else localStorage.setItem(key,previous[key]);});}catch(restoreError){}
   try{if(previousGeneration)localStorage.setItem(RESET_GENERATION_KEY,previousGeneration);else localStorage.removeItem(RESET_GENERATION_KEY);localResetGeneration=previousGeneration;}catch(resetError){}
  }
  backupRestorePending=false;localDataDeletionPending=false;if(savePaused&&typeof save==="function")save();return false;
 }
}
function showPrivacyInfo(){
 var text='<div class="privacycopy"><p><b>Lokale Trainingsdaten</b><br>Programme, Satzwerte, Notizen, Verläufe und Einstellungen liegen im lokalen Browserspeicher dieses Geräts. Sie werden nicht automatisch synchronisiert und können beim Löschen der Browserdaten verloren gehen.</p>';
 text+='<h3>Programme mit externer KI</h3><p>Bei „ChatGPT &amp; Co.“ sowie beim Kopieren oder Teilen eines Programms entscheidest du selbst, ob du den kopierten Inhalt anschließend bei einem anderen Dienst einfügst. Dann gelten die Datenschutzregeln des von dir gewählten Dienstes. Satzkraft sendet keine Trainingswünsche oder Trainingsdaten an eine KI-API.</p>';
 text+='<h3>Keine eingebaute Analyse</h3><p>Satzkraft enthält keine Werbe-, Tracking- oder Analysedienste. Der lokale Browserspeicher wird für die von dir angeforderten App-Funktionen verwendet.</p>';
 text+='<h3>Deine Kontrolle</h3><p>In den Einstellungen kannst du ein vollständiges Backup herunterladen oder alle lokalen Satzkraft-Daten löschen. Bereits heruntergeladene Backup-Dateien bleiben davon unberührt.</p><p class="muted">Stand: 11.10.2026 · Hinweis für die private Nutzung, keine öffentliche Datenschutzerklärung.</p></div>';
 showModal("Daten & Privatsphäre",text,[{label:"Zurück zu Einstellungen",cls:"primary",action:showSettings}]);
}
function confirmClearAllLocalData(){
 showModal("Alle lokalen Daten löschen?","Programme, Fortschritt, Protokolle, Notizen und Einstellungen werden auf diesem Gerät dauerhaft entfernt. Ein vollständiges Backup sichert Programme und Trainingsdaten, aber nicht den Farbmodus.",[
  {label:"Backup herunterladen",cls:"primary",action:function(){if(!downloadFullBackup("satzkraft-vor-loeschen")){showModal("Löschen abgebrochen","Das Backup konnte nicht heruntergeladen werden. Deine Daten wurden nicht verändert.",[{label:"Zurück zu Einstellungen",cls:"primary",action:showSettings}]);return;}showModal("Backup gespeichert?","Prüfe, ob die Backup-Datei wirklich auf deinem Gerät angekommen ist. Erst der nächste Schritt löscht die lokalen Daten.",[{label:"Backup geprüft – Daten löschen",cls:"danger",action:function(){if(!clearLocalAppData())showModal("Löschen fehlgeschlagen","Der Browser hat das Löschen nicht vollständig zugelassen. Deine bisherigen Daten wurden soweit möglich wiederhergestellt.",[{label:"Zurück zu Einstellungen",action:showSettings}]);}},{label:"Abbrechen",action:showSettings}]);}},
  {label:"Ohne Backup löschen",cls:"danger",action:function(){if(!clearLocalAppData())showModal("Löschen fehlgeschlagen","Der Browser hat das Löschen nicht vollständig zugelassen. Deine bisherigen Daten wurden soweit möglich wiederhergestellt.",[{label:"Zurück zu Einstellungen",action:showSettings}]);}},
  {label:"Abbrechen",action:showSettings}
 ]);
}
function showSettings(){
 modalActions=[null];
 var light=currentTheme()==="light";
 var h='<div class="mbox"><div class="mtitle" id="modaltitle">Einstellungen</div>';
 h+='<div class="setlabel">Farbmodus</div>';
 h+='<div class="setseg" role="group" aria-label="Farbmodus"><button class="setopt'+(light?'':' sel')+'" data-settheme="dark" aria-pressed="'+(!light)+'">Dunkel</button><button class="setopt'+(light?' sel':'')+'" data-settheme="light" aria-pressed="'+light+'">Hell</button></div>';
 h+='<div class="setlabel" style="margin-top:16px">Datensicherung</div>';
 h+='<div class="setbackupstatus">'+esc(backupStatusText())+'</div>';
 h+='<button type="button" class="setbackupbtn" data-settings-backup="1">Vollständiges Backup herunterladen</button>';
 h+='<div class="setlabel" style="margin-top:16px">Datenschutz &amp; Daten</div>';
 h+='<div class="setbackupstatus">Trainingsdaten bleiben lokal. Programme für eine externe KI werden nur als Text erzeugt; du entscheidest selbst über die Weitergabe.</div>';
 h+='<div class="setactions"><button type="button" class="setbackupbtn" data-settings-privacy="1">Datenfluss verständlich erklärt</button><button type="button" class="setbackupbtn danger" data-settings-clear-all="1">Alle lokalen App-Daten löschen</button></div>';
 h+='<div class="mbtns" style="margin-top:16px"><button class="mbtn primary" data-mi="0">Fertig</button></div></div>';
 var m=document.getElementById("modal");m.innerHTML=h;openModalSurface(m);
}
function showExerciseMenu(ex){
 var nm=esc(currentExerciseSwap(ex)||ex.name);
 var btns=[];
 btns.push({label:icon("reorder")+' Übungen neu ordnen',cls:"menu",action:function(){showReorderModal();}});
 btns.push({label:icon("undo")+' Übung ersetzen',cls:"menu",action:function(){showExerciseSwap(ex);}});
 if(ex.w&&!ex.bw)btns.push({label:icon("info")+' Scheibenrechner',cls:"menu",action:function(){showPlateCalculator(ex);}});
 btns.push({label:icon("close")+' Übung entfernen',cls:"menu danger",action:function(){confirmRemoveExercise(ex);}});
 btns.push({label:"Abbrechen",action:null});
 showModal(nm,"",btns);
}
function confirmRemoveExercise(ex){
 showModal("Übung entfernen?",esc(currentExerciseSwap(ex)||ex.name)+" wird nur aus dieser Einheit entfernt. Dein Programm bleibt unverändert.",[
  {label:"Entfernen",cls:"danger",action:function(){removeExerciseToday(ex);}},
  {label:"Abbrechen",action:null}
 ]);
}
function exerciseRemovedToday(ex,w,dayKey){return exerciseRemovedFrom(S.removedEx,ex,w,dayKey);}
function removeExerciseToday(ex){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 if(!S.removedEx||typeof S.removedEx!=="object")S.removedEx={};
 var k="w"+S.week+"_"+S.day;if(!Array.isArray(S.removedEx[k]))S.removedEx[k]=[];
 if(S.removedEx[k].indexOf(ex.id)<0)S.removedEx[k].push(ex.id);
 delete expandedPreviewRows[ex.id];
 flushSave();renderView();renderBar();
}
function reorderMove(spec){
 var pr=String(spec).split(","),i=+pr[0],dir=+pr[1],dx=dayByKey(S.day).ex,j=i+dir;
 while(j>=0&&j<dx.length&&!exerciseValidForWeek(dx[j],S.week))j+=dir;
 if(j<0||j>=dx.length)return;
 var t=dx[i];dx[i]=dx[j];dx[j]=t;
 flushSave();renderView();showReorderModal();
}
function showReorderModal(){
 var d=dayByKey(S.day);
 modalActions=[null];
 var h='<div class="mbox"><div class="mtitle" id="modaltitle">Übungen neu ordnen</div><div class="mmsg">Halte den Griff und ziehe eine Übung an ihre neue Position.</div><div class="reorderlist">';
 d.ex.forEach(function(e,i){
  if(!exerciseValidForWeek(e,S.week)||exerciseRemovedToday(e,S.week,d.key))return;
  h+='<div class="reorderrow" data-ro="'+i+'"><span class="reordername">'+esc(currentExerciseSwap(e)||e.name)+'</span><button type="button" class="reorderhandle" data-reorder-grip data-ro="'+i+'" aria-label="'+attr(e.name)+' verschieben – mit den Pfeiltasten nach oben oder unten"><span class="grip" aria-hidden="true"></span></button></div>';
 });
 h+='</div><div class="mbtns" style="margin-top:12px"><button class="mbtn primary" data-mi="0">Fertig</button></div></div>';
 var m=document.getElementById("modal");m.innerHTML=h;openModalSurface(m);
}
function applyReorderOrder(order){
 var d=dayByKey(S.day),dx=d.ex,slots=[];
 dx.forEach(function(e,i){if(exerciseValidForWeek(e,S.week)&&!exerciseRemovedToday(e,S.week,d.key))slots.push(i);});
 if(order.length!==slots.length)return;
 var items=order.map(function(oi){return dx[oi];});
 slots.forEach(function(pos,k){dx[pos]=items[k];});
 flushSave();renderView();showReorderModal();
}
function exercisePredecessor(ex){
 if(!ex||!ex.prevId)return null;var all=dayByKey(S.day).ex;
 for(var i=0;i<all.length;i++)if(all[i].id===ex.prevId)return all[i];
 return null;
}
function showExerciseTimeline(ex){
 var previous=exercisePredecessor(ex);if(!previous)return;
 var from=previous.fromWeek==null?1:previous.fromWeek,until=previous.untilWeek==null?(ex.fromWeek-1):previous.untilWeek,rows=exHistory(previous),body='<p><b>davor: '+esc(previous.name)+' (Woche '+from+'–'+until+')</b></p>';
 if(!rows.length)body+='<p class="muted">Für die Vorgängerin wurde noch nichts eingetragen.</p>';
 else{body+='<table class="htbl"><thead><tr><th>Woche</th><th>Sätze</th></tr></thead><tbody>';rows.forEach(function(row){body+='<tr><td class="wk">W'+row.w+'<span class="hwl">'+esc(row.label)+'</span></td><td>'+esc(row.parts.join(" · "))+'</td></tr>';});body+='</tbody></table>';}
 showModal("Übungs-Zeitachse · "+esc(ex.name),body,[{label:"Schließen",cls:"primary",action:null}]);
}
var expandedDoneExercises={};
