// ---------- Timer ----------
var restEnd=null,restTotal=0,restBaseSec=0,restExId=null,restExerciseName="",restPhase=null,restNextSet=-1,restAfterExercise=false,holdStartedAt=0,holdMin=null,holdMax=null,holdTimerMode="max",holdMaxAlerted=false,holdBest=0,actx=null;
function unlockAudio(){try{if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();if(actx.state==="suspended")actx.resume();}catch(e){}}
function beep(){try{unlockAudio();if(!actx)return;var o=actx.createOscillator(),g=actx.createGain();o.connect(g);g.connect(actx.destination);o.type="sine";o.frequency.value=880;var t=actx.currentTime;g.gain.setValueAtTime(0.001,t);g.gain.exponentialRampToValueAtTime(0.32,t+0.03);g.gain.setValueAtTime(0.32,t+1.05);g.gain.exponentialRampToValueAtTime(0.001,t+1.45);o.start(t);o.stop(t+1.5);}catch(e){}}
function focusRest(exid){
 var card=document.getElementById("card-"+exid);if(!card)return;
 if(document.body.classList.contains("rest-lock")){card.classList.add("rest-focus");return;}
 var rect=card.getBoundingClientRect(),viewport=window.innerHeight||document.documentElement.clientHeight;if(rect.top<0||rect.bottom>viewport)card.scrollIntoView({block:"nearest",behavior:"auto"});
 document.body.classList.add("rest-lock");
 card.classList.add("rest-focus");
}
function clearRestFocus(){
 document.body.classList.remove("rest-lock");
 document.querySelectorAll(".rest-focus").forEach(function(el){el.classList.remove("rest-focus");});
}
function startRest(sec,exid,allowAfterLast){
 var ex=exid?findEx(exid):null;if(!ex)return;
 var sets=getSets(ex),next=firstOpenSet(ex,sets);if(!canStartRest(ex,sets,next,allowAfterLast))return;
 cancelAutoRest(exid);collapseDoneExcept(exid);
 unlockAudio();restTotal=sec;restBaseSec=sec;restEnd=Date.now()+sec*1000;restExId=exid;restExerciseName=currentExerciseSwap(ex)||ex.name;restPhase="countdown";restNextSet=next;restAfterExercise=next>=sets.length;
 applyAllLocks();renderBar();requestAnimationFrame(function(){if(restPhase&&restExId)focusRest(restExId);});
}
function holdBestSeconds(ex){var best=0,suffix="|"+ex.id;for(var key in S.logs){if(key.slice(-suffix.length)!==suffix)continue;var cell=S.logs[key],sets=cell&&cell.sets;if(normalizeSwapName(cell&&cell.swap)||!Array.isArray(sets))continue;sets.forEach(function(set){var value=reportFinite(set&&set.reps);if(value!=null&&value>best)best=value;});}return Math.round(best);}
function startHold(exid){
 var ex=exid?findEx(exid):null;if(!ex)return;var sets=getSets(ex),next=firstOpenSet(ex,sets);if(!canStartHold(ex,sets,next))return;
 collapseDoneExcept(exid);
 var range=catReps(ex,PROG().weeks[S.week-1].phase);unlockAudio();requestWakeLock();restEnd=null;restTotal=0;restBaseSec=catRest(ex);restExId=exid;restExerciseName=currentExerciseSwap(ex)||ex.name;restPhase="hold";restNextSet=next;restAfterExercise=false;holdStartedAt=Date.now();holdMin=Array.isArray(range)?Number(range[0]):null;holdMax=Array.isArray(range)?Number(range[1]):null;holdTimerMode=timeMode(ex);holdMaxAlerted=false;holdBest=holdBestSeconds(ex);
 applyAllLocks();renderBar();requestAnimationFrame(function(){if(restPhase==="hold")focusRest(exid);});
}
function holdElapsedSeconds(){return holdStartedAt?Math.max(0,Math.floor((Date.now()-holdStartedAt)/1000)):0;}
function cancelHold(){resetRestState();clearRestFocus();applyAllLocks();renderBar();}
function finishHold(forcedSeconds){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 if(restPhase!=="hold")return;var ex=findEx(restExId),seconds=Math.max(1,forcedSeconds==null?holdElapsedSeconds():Math.round(forcedSeconds)),exid=restExId,index=restNextSet,pause=restBaseSec;resetRestState();clearRestFocus();
 var input=document.getElementById("rep-"+exid+"-"+index);if(ex&&input){input.disabled=false;setTimeInputValue(input,ex,seconds);onSetInput(input);}if(ex){var sets=getSets(ex),next=firstOpenSet(ex,sets);if(next<=sets.length)startRest(pause,exid,true);else{applyAllLocks();renderBar();}}
}
function adjustRest(d){if(restPhase==="countdown"&&restEnd){restEnd=Math.max(Date.now(),restEnd+d*1000);var rem=Math.max(0,(restEnd-Date.now())/1000);if(rem>restTotal)restTotal=rem;renderBar();}}
function resetRestState(){restEnd=null;restTotal=0;restBaseSec=0;restExId=null;restExerciseName="";restPhase=null;restNextSet=-1;restAfterExercise=false;holdStartedAt=0;holdMin=null;holdMax=null;holdTimerMode="max";holdMaxAlerted=false;holdBest=0;}
function stopRest(){var finishedExercise=restAfterExercise;resetRestState();clearRestFocus();applyAllLocks();renderBar();if(finishedExercise)maybeAskDone();}
function endRest(){
 var finishedExercise=restAfterExercise;beep();if(navigator.vibrate)navigator.vibrate([400,150,400,150,700]);notifyRestDone();
 if(finishedExercise){resetRestState();clearRestFocus();applyAllLocks();renderBar();maybeAskDone();return;}
 restEnd=null;restTotal=0;restPhase="set";applyAllLocks();renderBar();
 var input=document.getElementById("rep-"+restExId+"-"+restNextSet);if(input){input.disabled=false;try{input.focus({preventScroll:true});}catch(e){input.focus();}}
}

function elapsedSec(){var w=S.workout;if(!w)return 0;return w.accrued+(w.running?(Date.now()-w.startedAt)/1000:0);}
function hardcapElapsedSec(){var w=S.workout;if(!w)return 0;return Math.max(0,elapsedSec()-(Number(w.hardcapBase)||0));}
function beginWorkout(mode){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 clearDonePrompt();cancelAllAutoRest();unlockAudio();requestWakeLock();askNotifyPermission();var n=Date.now(),records=historyForDay(S.week,S.day);
 mode=mode||(dayWasInterrupted(S.week,S.day)&&!unitComplete(S.week,S.day)?"continue":"fresh");
 var accrued=0,firstStart=n,segmentsBase=0;
 if(mode==="continue"&&records.length){
  accrued=records.reduce(function(sum,e){return sum+(Number(e.dur)||0);},0);
  firstStart=records.reduce(function(min,e){return e.start&&e.start<min?e.start:min;},n);
  segmentsBase=records.reduce(function(sum,e){return sum+(e.segments||1);},0);
 }
 expandedDoneExercises={};cancelAllDoneCollapse();S.workout={running:true,startedAt:n,accrued:accrued,hardcapBase:accrued,firstStart:firstStart,askedDone:false,completedAt:0,week:S.week,day:S.day,mode:mode,segmentsBase:segmentsBase,pendingReplacements:[]};
 save();renderBar();renderView();
}
function laterWeeksHaveData(w,dk){
 for(var key in S.logs){
  var parts=key.split("|");
  if(Number(parts[0])<=w||parts[1]!==dk)continue;
  var c=S.logs[key];if(!c||normalizeSwapName(c.swap)||!Array.isArray(c.sets))continue;
  for(var i=0;i<c.sets.length;i++){var s=c.sets[i];if(s&&s.reps!==""&&s.reps!=null)return true;}
 }
 return false;
}
function startWorkout(){
 var access=workoutAccess(S.week,S.day);
 if(!access.allowed){renderBar();return;}
 if(access.mode==="repeat"){
  var repeatText="Alle eingetragenen Satzwerte dieses Tages werden geleert. Beim Beenden ersetzt die neue Trainingszeit außerdem die bisher gespeicherte Zeit.";
  if(laterWeeksHaveData(S.week,S.day))repeatText+="<br><br>Empfehlungen der folgenden Wochen werden aus den neuen Werten neu berechnet. Deine eingetragenen Werte bleiben unverändert.";
  showModal("Training wiederholen?",repeatText,[
   {label:"Zurücksetzen & wiederholen",cls:"primary",action:function(){resetDayLogs(S.week,S.day);beginWorkout("repeat");}},
   {label:"Abbrechen",action:null}
  ]);return;
 }
 var skipped=skippedBeforeSelection();
 if(!skipped.length){beginWorkout();return;}
 showModal("Offene Trainings überspringen?",(skipped.length===1?"Ein früheres Training ist noch offen":skipped.length+" frühere Trainings sind noch offen")+" – nachholen geht jederzeit.",[
  {label:"Trotzdem starten",cls:"danger",action:beginWorkout},
  {label:"Zur Auswahl",action:null}
 ]);
}
function pauseWorkout(){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;var w=S.workout;if(w&&w.running){w.accrued+=(Date.now()-w.startedAt)/1000;w.running=false;releaseWakeLock();save();renderBar();renderView();}}
function resumeWorkout(){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;var w=S.workout;if(w&&!w.running){w.startedAt=Date.now();w.running=true;requestWakeLock();save();renderBar();renderView();}}
var WORKOUT_PAUSE_HOLD_MS=2000,workoutPauseHoldTimer=null,workoutPauseHoldButton=null,workoutPauseHoldPointerId=null;
function cancelWorkoutPauseHold(){
 if(workoutPauseHoldTimer){clearTimeout(workoutPauseHoldTimer);workoutPauseHoldTimer=null;}
 if(workoutPauseHoldButton){workoutPauseHoldButton.classList.remove("holding");workoutPauseHoldButton.setAttribute("aria-pressed","false");}
 workoutPauseHoldButton=null;workoutPauseHoldPointerId=null;
}
function beginWorkoutPauseHold(button,pointerId){
 if(!button||!S.workout||!S.workout.running||workoutPauseHoldTimer)return;
 workoutPauseHoldButton=button;workoutPauseHoldPointerId=pointerId==null?null:pointerId;
 button.classList.add("holding");button.setAttribute("aria-pressed","true");
 if(pointerId!=null&&button.setPointerCapture)try{button.setPointerCapture(pointerId);}catch(err){}
 workoutPauseHoldTimer=setTimeout(function(){
  var shouldPause=workoutPauseHoldButton===button&&S.workout&&S.workout.running;
  workoutPauseHoldTimer=null;workoutPauseHoldButton=null;workoutPauseHoldPointerId=null;
  button.classList.remove("holding");button.setAttribute("aria-pressed","false");
  if(shouldPause){if(navigator.vibrate)navigator.vibrate(40);pauseWorkout();}
 },WORKOUT_PAUSE_HOLD_MS);
}
function backupJSON(){syncStore();return JSON.stringify({schemaVersion:DATA_SCHEMA_VERSION,personalExercises:S.personalExercises||{},programs:S.programs,active:S.active,store:S.store},null,1);}
function readBackupMeta(){
 try{var m=JSON.parse(localStorage.getItem(BACKUP_META_KEY)||"{}");return{lastAt:finiteNumber(m.lastAt,0,Number.MAX_SAFE_INTEGER,false)?m.lastAt:0,historyCount:finiteNumber(m.historyCount,0,1000000,true)?m.historyCount:0,remindedAt:finiteNumber(m.remindedAt,0,1000000,true)?m.remindedAt:0,trackingAt:finiteNumber(m.trackingAt,0,Number.MAX_SAFE_INTEGER,false)?m.trackingAt:0,snoozeUntil:finiteNumber(m.snoozeUntil,0,Number.MAX_SAFE_INTEGER,false)?m.snoozeUntil:0};}catch(e){return{lastAt:0,historyCount:0,remindedAt:0,trackingAt:0,snoozeUntil:0};}
}
function writeBackupMeta(m){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;try{var payload=JSON.stringify(m);if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;localStorage.setItem(BACKUP_META_KEY,payload);return true;}catch(e){return false;}}
function totalCompletedTrainings(){
 syncStore();var count=0;
 for(var id in S.store){var history=S.store[id]&&S.store[id].history;if(!Array.isArray(history))continue;for(var i=0;i<history.length;i++)if(history[i]&&history[i].complete===true)count++;}
 return count;
}
function backupDatePart(ts){var d=new Date(ts),p=function(n){return n<10?"0"+n:String(n);};return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());}
function downloadFullBackup(prefix){
 var now=Date.now(),text=backupJSON(),sizeError=backupSizeError(text);
 if(sizeError){showModal("Backup zu groß",sizeError,[{label:"Originalstand sichern",cls:"primary",action:function(){downloadText("satzkraft-originalstand.json",text);}},{label:"Abbrechen",action:null}]);return false;}
 var ok=downloadText((prefix||"satzkraft-backup")+"-"+backupDatePart(now)+".json",text);
 if(ok){var done=totalCompletedTrainings();writeBackupMeta({lastAt:now,historyCount:done,remindedAt:done,trackingAt:now,snoozeUntil:0});}
 return ok;
}
function backupStatusText(){var m=readBackupMeta();return m.lastAt?"Letzter Backup-Export: "+new Date(m.lastAt).toLocaleString("de-DE",{dateStyle:"medium",timeStyle:"short"}):"Noch keine vollständige Sicherung auf diesem Gerät gespeichert.";}
function firstCompletedTrainingAt(){
 syncStore();var first=0;for(var id in S.store){var history=S.store[id]&&S.store[id].history;if(!Array.isArray(history))continue;history.forEach(function(entry){if(!entry||entry.complete!==true)return;var at=Number(entry.end)||Number(entry.start)||0;if(at>0&&(!first||at<first))first=at;});}return first;
}
function backupReminderDue(now){
 now=Number(now)||Date.now();var done=totalCompletedTrainings(),meta=readBackupMeta(),newSince=done-meta.historyCount,reference=meta.lastAt||meta.trackingAt||firstCompletedTrainingAt();
 if(newSince<=0||now<meta.snoozeUntil)return false;
 if(newSince>=5)return true;
 return !!(reference>0&&now-reference>=14*86400000);
}
var backupReminderPrompted=false;
function maybeShowBackupReminder(){
 if(backupReminderPrompted||active()||!backupReminderDue())return false;
 var m=document.getElementById("modal");if(m&&m.style.display==="flex")return false;
 if(document.getElementById("lib").classList.contains("open"))return false;
 backupReminderPrompted=true;
 showModal("Zeit für ein Backup","Deine letzte Sicherung ist älter. Lade dein Backup kurz herunter – es bleibt als Datei bei dir.",[
  {label:"Backup herunterladen",cls:"primary",action:function(){handleBackupReminder("download");}},
  {label:"Später",action:function(){handleBackupReminder("later");}}
 ]);
 return true;
}
function handleBackupReminder(action){
 var meta=readBackupMeta();if(action==="later"){meta.snoozeUntil=Date.now()+7*86400000;writeBackupMeta(meta);}else if(action==="download")downloadFullBackup("satzkraft-backup");
 if(document.getElementById("lib").classList.contains("open"))renderLib();else renderView();
}
function workoutProgress(week,dayKey){
 var selectedDay=dayByKey(dayKey),exercises=typeof dayExercisesFor==="function"?dayExercisesFor(selectedDay,week):(selectedDay.ex||[]),totalSets=0,completedSets=0,completedExercises=0;
 exercises.forEach(function(ex){var need=setsForExercise(ex,week),stored=S.logs[week+"|"+dayKey+"|"+ex.id],done=0;totalSets+=need;for(var i=0;i<need;i++)if(stored&&stored.sets&&stored.sets[i]&&setComplete(ex,stored.sets[i])){completedSets++;done++;}if(need>0&&done===need)completedExercises++;});
 return{completedSets:completedSets,totalSets:totalSets,completedExercises:completedExercises,totalExercises:exercises.length,complete:exercises.length>0&&completedExercises===exercises.length};
}
function stopWorkout(deferPostFlow){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 var w=S.workout;if(!w)return;var programId=S.active;clearDonePrompt();cancelAllAutoRest();var sessionWeek=w.week||S.week,sessionDay=w.day||S.day,complete=dayComplete(sessionWeek,sessionDay),dur=Math.max(1,Math.round(w.accrued+(w.running?(Date.now()-w.startedAt)/1000:0)));
 postWorkoutSwapProgramId=programId;postWorkoutSwapQueue=complete?markCompletedWorkoutSwapsPending(programId,sessionWeek,sessionDay):[];
 replaceDayHistory(sessionWeek,sessionDay,{start:w.firstStart,end:Date.now(),dur:dur,week:sessionWeek,day:sessionDay,complete:complete,segments:(w.segmentsBase||0)+1});resetRestState();clearRestFocus();releaseWakeLock();expandedDoneExercises={};cancelAllDoneCollapse();S.workout=null;var saved=flushSave();renderBar();renderView();if(saved===false)return false;if(!deferPostFlow)continuePostWorkoutFlow(programId);
}
function confirmStop(){
 var w=S.workout;if(!w)return;var repeat=w.mode==="repeat",progress=workoutProgress(w.week||S.week,w.day||S.day),summary=progress.completedSets+" von "+progress.totalSets+" Sätzen · "+progress.completedExercises+" von "+progress.totalExercises+" Übungen erledigt.<br><br>",msg,label,cls="primary";
 if(repeat){msg=summary+"Die frühere Trainingszeit dieses Tages wird durch diese Wiederholung ersetzt. Deine jetzt eingetragenen Werte bleiben gespeichert.";label="Wiederholung speichern & beenden";cls="danger";}
 else if(progress.complete){msg=summary+"Das Training ist vollständig. Trainings- und Pausenzeit werden gemeinsam gespeichert.";label="Training speichern & beenden";}
 else{msg=summary+"Alle bisherigen Eingaben bleiben erhalten. Du kannst dieses Training später an genau dieser Stelle fortsetzen.";label="Speichern & später fortsetzen";}
 showModal("Training beenden?",msg,[{label:label,cls:cls,action:stopWorkout},{label:"Weiter trainieren",action:null}]);
}
var donePromptTimer=null,DONE_PROMPT_DELAY=1200;
function clearDonePrompt(){if(donePromptTimer){clearTimeout(donePromptTimer);donePromptTimer=null;}}
function maybeAskDone(){
 var w=S.workout;
 clearDonePrompt();
 if(!w||w.askedDone||!dayExercisesFor(dayByKey(S.day),S.week).every(isDone))return;
 donePromptTimer=setTimeout(function(){
  donePromptTimer=null;
  if(localWriteBlocked()||!S.workout||S.workout!==w||w.askedDone||!dayExercisesFor(dayByKey(S.day),S.week).every(isDone))return;
  if(restPhase||Object.keys(autoRestTimers).length){maybeAskDone();return;}
  var modal=document.getElementById("modal");
  if(modal&&modal.style.display==="flex"){maybeAskDone();return;}
  w.askedDone=true;w.completedAt=Date.now();save();
  showModal("Alle Übungen erledigt 💪","Training beenden oder weitermachen? Bei „weiter“ stoppt die Zeit zur Sicherheit automatisch nach 60 Minuten.",[{label:"Training beenden",cls:"primary",action:stopWorkout},{label:"Weiter trainieren",action:null}]);
 },DONE_PROMPT_DELAY);
}
function autoStop(reason){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;if(!S.workout)return;var programId=S.active;if(stopWorkout(true)===false)return;showModal("Training automatisch beendet",reason,[{label:"OK",cls:"primary",action:function(){continuePostWorkoutFlow(programId);}}]);}
function renderBar(){
 var bar=document.getElementById("bar"),w=S.workout,h="";
 if(!w){
  if(correctionActive())h='<div class="barwrap"><div class="start-only"><button class="bbtn" id="cancelcorrection">'+icon("close")+' Abbrechen</button><button class="bbtn go" id="finishcorrection">'+icon("check")+' Speichern</button></div></div>';
  else{
   var access=workoutAccess(S.week,S.day),completed=unitComplete(S.week,S.day);
   if(completed){
    h='<div class="barwrap"><div class="start-only"><button class="bbtn go" id="correctvalues">'+icon("edit")+' Workout bearbeiten</button></div></div>';
   }else if(access.allowed){
    h='<div class="barwrap"><div class="start-only"><button class="bbtn go" id="startw">'+icon("play")+' Training '+(access.mode==="continue"?"fortsetzen":"starten")+'</button></div></div>';
   }
  }
 }else if(restPhase==="hold"){
  var held=holdElapsedSeconds(),targetMode=holdTimerMode==="target",holdPct=targetMode&&holdMax?Math.max(0,Math.min(100,held/holdMax*100)):(holdBest?Math.max(0,Math.min(100,held/holdBest*100)):0),holdReached=targetMode&&holdMin!=null&&held>=holdMin,holdSub=targetMode&&holdMin!=null?(holdReached?"Ziel erreicht · Ende bei "+fmtSeconds(holdMax):"Ziel "+fmtSecondsRange(holdMin,holdMax)):(holdBest?"Maximalzeit · Bestwert "+fmtSeconds(holdBest):"Maximalzeit · selbst stoppen");
  h='<div class="barwrap"><div class="restbar holdmode" id="holdBar"><div class="restfill" id="holdFill" style="width:'+holdPct+'%"></div><div class="restcontent"><div class="restname"><div class="main">'+esc(restExerciseName)+'</div><div class="subline" id="holdStatus">'+holdSub+'</div></div><span class="tbig" id="holdCount">'+fmtTime(held)+'</span><div class="holdactions"><button class="bbtn go" id="stophold">Stopp &amp; eintragen</button><button class="bbtn stop mini" id="cancelhold" aria-label="Timer abbrechen">Abbrechen</button></div></div></div></div>';
 }else if(restPhase==="countdown"&&restEnd){
  var rem=Math.max(0,Math.round((restEnd-Date.now())/1000)),pct=restTotal>0?Math.max(0,Math.min(100,(rem/restTotal)*100)):0;
  h='<div class="barwrap"><div class="restbar"><div class="restfill" id="restFill" style="width:'+pct+'%"></div><div class="restcontent"><div class="restname"><div class="main">'+esc(restExerciseName)+'</div><div class="subline">Satzpause</div></div><button class="bbtn mini" data-radj="-15">−15</button><span class="tbig" id="rtCount">'+fmtTime(rem)+'</span><button class="bbtn mini" data-radj="15">+15</button><button class="bbtn stop mini" id="stopr" aria-label="Satzpause beenden">'+icon("stop")+'</button></div></div></div>';
 }else if(restPhase==="set"){
  var setEx=findEx(restExId),setList=setEx?getSets(setEx):[],setFinished=!!(setEx&&setList[restNextSet]&&setComplete(setEx,setList[restNextSet]));
  var isLast=restNextSet>=setList.length-1,setLabel=setFinished?(isLast?"Übung abgeschlossen":"Satz "+(restNextSet+1)+" abgeschlossen"):"Satz "+(restNextSet+1)+" eintragen";
  h='<div class="barwrap"><div class="restbar setmode"><div class="restfill" style="width:100%"></div><div class="restcontent"><div class="restname"><div class="main">'+esc(restExerciseName)+'</div><div class="subline">'+setLabel+'</div></div>'+(!isLast?'<button class="bbtn nextpause" id="nextpause"'+(setFinished?"":" disabled")+'>Nächste Satzpause</button>':'')+'<button class="bbtn stop mini" id="stopr" aria-label="Pausenmodus schließen">'+icon("stop")+'</button></div></div></div>';
 }else{
  h='';
 }
 bar.innerHTML=h;
 bar.classList.toggle("is-hidden",!h);
 document.body.classList.toggle("bar-hidden",!h);
}
setInterval(function(){
 if(localWriteBlocked())return;
 var w=S.workout;
 if(w){
  if(w.running){var elapsedText=fmtTime(elapsedSec()),barElapsed=document.getElementById("barWtElapsed");if(barElapsed)barElapsed.textContent=elapsedText;var liveElapsed=document.getElementById("liveWtElapsed");if(liveElapsed)liveElapsed.textContent=elapsedText;}
  if(w.completedAt&&(Date.now()-w.completedAt)>GRACE){autoStop("60 Minuten nach Abschluss automatisch gestoppt.");}
  else if(hardcapElapsedSec()*1000>HARDCAP){autoStop("Zeitlimit (3 Std.) erreicht – automatisch gestoppt.");}
 }
 if(restPhase==="countdown"&&restEnd){var rem=Math.round((restEnd-Date.now())/1000);if(rem<=0){endRest();}else{var rc=document.getElementById("rtCount");if(rc)rc.textContent=fmtTime(rem);var fill=document.getElementById("restFill");if(fill&&restTotal>0)fill.style.width=Math.max(0,Math.min(100,(rem/restTotal)*100))+"%";}}
 if(restPhase==="hold"){var held=holdElapsedSeconds(),targetMode=holdTimerMode==="target",count=document.getElementById("holdCount"),holdFill=document.getElementById("holdFill"),status=document.getElementById("holdStatus");if(count)count.textContent=fmtTime(held);if(holdFill){var benchmark=targetMode?holdMax:holdBest;if(benchmark)holdFill.style.width=Math.max(0,Math.min(100,held/benchmark*100))+"%";}if(targetMode&&holdMin!=null&&held>=holdMin){if(status)status.textContent="Ziel erreicht · Ende bei "+fmtSeconds(holdMax);}if(targetMode&&holdMax!=null&&held>=holdMax&&!holdMaxAlerted){holdMaxAlerted=true;beep();if(navigator.vibrate)navigator.vibrate([250,100,400]);finishHold(holdMax);}}
},250);
