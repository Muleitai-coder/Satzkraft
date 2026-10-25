// ---------- PWA ----------
(function(){
 try{
 if(window.self!==window.top)return;
 var icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="104" fill="#0a0b0d"/><g fill="#37e0a2"><rect x="96" y="228" width="320" height="56" rx="14"/><rect x="64" y="188" width="52" height="136" rx="16"/><rect x="396" y="188" width="52" height="136" rx="16"/><rect x="34" y="214" width="34" height="84" rx="12"/><rect x="444" y="214" width="34" height="84" rx="12"/></g></svg>';
 var uri="data:image/svg+xml,"+encodeURIComponent(icon);
 var l=document.createElement("link");l.rel="apple-touch-icon";l.href=uri;document.head.appendChild(l);
 }catch(e){}
})();
if("serviceWorker" in navigator){
 window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){});});
}

var localWriterInitialized=false,resumedPendingWorkoutSwaps=false;
function initializeWritableApp(){
try{localStorage.removeItem("satzkraft-training-view-v1");}catch(e){}
removeLegacyCoachAnswers();
renderView();renderBar();
// Übungsbibliothek früh laden: liefert u. a. den Kurzhantel-Hinweis in der Trainingsansicht.
loadExerciseLibrary().then(function(){renderView();});
(function(){
 try{
  if(loadIssueText)return;
  if(location.hash.indexOf("#p=")===0){
   var json=decodeURIComponent(escape(atob(location.hash.slice(3))));
   history.replaceState(null,"",location.pathname);
   openLib();beginProgramImport(json,"link","Geteilter Link");
  }
 }catch(e){}
})();
resumedPendingWorkoutSwaps=false;
if(!loadIssueText&&!active()&&!pendingProgramImport)resumedPendingWorkoutSwaps=resumePendingWorkoutSwapFlow(S.active);

if(!maybeShowRedesignNotice())maybeShowBackupReminder();
}
// ---------- Einmaliger Hinweis auf das Design-Update ----------
function hasExistingTrainingData(state){
 if(!state||!state.programs||!state.store)return false;
 if(Object.keys(state.programs).length>1)return true;
 if(state.active&&state.active!=="default")return true;
 var ids=Object.keys(state.store);
 for(var i=0;i<ids.length;i++){
  var st=state.store[ids[i]];
  if(!st)continue;
  if(Array.isArray(st.history)&&st.history.length)return true;
  if(st.logs&&typeof st.logs==="object"&&Object.keys(st.logs).length)return true;
  if(st.tg&&typeof st.tg==="object"&&Object.keys(st.tg).length)return true;
  if(st.workout)return true;
 }
 return false;
}
function redesignNoticeSeen(){try{return !!localStorage.getItem(REDESIGN_NOTICE_KEY);}catch(e){return true;}}
function markRedesignNoticeSeen(){if(localWriteBlocked())return;try{localStorage.setItem(REDESIGN_NOTICE_KEY,"1");}catch(e){}}
function showRedesignNotice(){
 showModal("Großes Update: neues Design ✨",
  'Satzkraft wurde von Grund auf neu gestaltet. Deine Programme und dein gesamter Fortschritt bleiben dabei unverändert erhalten.'+
  '<ul class="updatelist">'+
  '<li>Neue Startseite mit großer Wochenkarte</li>'+
  '<li>Neues Programme-Fenster mit Vorlagen zum Laden, Bearbeiten und Teilen</li>'+
  '<li>Einstellungen über das Zahnrad oben rechts: heller oder dunkler Farbmodus und Datensicherung</li>'+
  '<li>Abgeschlossene Trainings lassen sich mit „Workout bearbeiten“ anpassen</li>'+
  '</ul>',
  [{label:"Alles klar",cls:"primary",action:null},{label:"Alle Neuerungen ansehen",action:showVersionInfo}]);
}
function maybeShowRedesignNotice(){
 if(redesignNoticeSeen())return false;
 if(!hasExistingTrainingData(S)){markRedesignNoticeSeen();return false;}
 if(loadIssueText||active()||pendingProgramImport||resumedPendingWorkoutSwaps)return false;
 markRedesignNoticeSeen();
 showRedesignNotice();
 return true;
}
renderView();renderBar();
renderLocalWindowNotice();
requestLocalWriter();
