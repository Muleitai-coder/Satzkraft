/* =====================================================================
   PROGRESSION MODUL  (reine Logik, von der UI getrennt)
   - Workout-JSON liefert nur Daten/Parameter (settings, progressionMode).
   - App-Speicher liefert die Historie (S.logs / S.history).
   - Dieses Modul rechnet daraus die Empfehlung. UI ruft buildCoachMessage().
   ===================================================================== */
function getWorkoutSettings(prog){return PROGRESSION.getWorkoutSettings(prog||PROG());}
function getExerciseProgressionMode(ex){return PROGRESSION.getExerciseProgressionMode(ex);}
// Sätze einer Übung in Woche w als saubere Session [{reps,weight}] – oder null falls leer.
function sessionFor(ex,w){
 var c=S.logs[w+"|"+S.day+"|"+ex.id];if(!c||!c.sets||normalizeSwapName(c.swap))return null;
 var need=setsForExercise(ex,w),sets=[],any=false;
 for(var i=0;i<need;i++){var s=c.sets[i]||{reps:"",weight:""};if(s.reps!=="")any=true;sets.push({reps:s.reps,weight:s.weight});}
 return any?sets:null;
}
// Frühere Sessions (neueste zuerst), für "zwei Einheiten in Folge"-Regel.
function priorSessions(ex,w){var out=[];for(var k=w-1;k>=1;k--){var s=sessionFor(ex,k);if(s)out.push(s);}return out;}
function calculateNextRecommendation(p){return PROGRESSION.calculateNextRecommendation(p);}
// Bindeglied: holt die Daten aus dem App-Speicher und ruft die reine Logik.
function recommendForWeek(ex,w){
 var W=PROG().weeks[w-1],phase=W?W.phase:"aufbau",prior=priorSessions(ex,w);
 // Im Deload wird die schwere Basis genau einmal reduziert. Das bereits
 // reduzierte, eingetragene Deload-Gewicht darf nicht erneut skaliert werden.
 var curW=phase==="deload"?baseWeight(ex,w):actualMinWeight(ex,w);if(curW==null)curW=baseWeight(ex,w);
 return calculateNextRecommendation({
  exercise:ex,settings:getWorkoutSettings(),repRange:catReps(ex,phase),currentWeight:curW,
  currentSession:sessionFor(ex,w),lastSession:prior[0]||null,previousSession:prior[1]||null,
  isDeload:phase==="deload"
 });
}
// Schwere-Basis-Kette (für Ziel-/Arbeitsgewicht). Deload ändert die schwere Basis nicht.
function nextWeight(ex,w){
 var W=PROG().weeks[w-1];if(!W||W.phase==="deload")return null;
 var mode=getExerciseProgressionMode(ex);if(mode!=="weight"&&mode!=="added_weight")return null;
 var cell=S.logs[w+"|"+S.day+"|"+ex.id];if(cell&&normalizeSwapName(cell.swap))return null;
 if(!cellComplete(w,S.day,ex))return null;
 var rec=recommendForWeek(ex,w);
 if(rec.action==="increase"||rec.action==="decrease"||rec.action==="hold")return rec.nextWeight;
 return null;
}
function baseWeight(ex,w){
 var ov=S.tg[w+"|"+ex.id];if(ov!=null&&ov!=="")return Number(ov);
 if(w<=1)return ex.def||0;
 var nw=nextWeight(ex,w-1);if(nw!=null)return nw;
 var base=baseWeight(ex,w-1),prevW=PROG().weeks[w-2];
 if(prevW&&prevW.phase==="deload"){var mode=getExerciseProgressionMode(ex);if(mode==="weight"||mode==="added_weight")return round(base*getWorkoutSettings().postDeloadReturnMultiplier);}
 return base;
}
function targetWeight(ex){
 var swap=!!currentExerciseSwap(ex),swapWeight=currentExerciseSwapWeight(ex),base=swap?(swapWeight==null?0:swapWeight):baseWeight(ex,S.week),planned=round(base*wfOf(PROG().weeks[S.week-1]));
 if(planned>0||ex.bw)return planned;
 var sets=getSets(ex);for(var i=0;i<sets.length;i++)if(Number(sets[i]&&sets[i].weight)>0)return round(Number(sets[i].weight));
 return planned;
}
function fmtKg(value){return Number(value).toLocaleString("de-DE",{minimumFractionDigits:0,maximumFractionDigits:2});}
function calculatePlateLoad(target,bar){
 target=Number(target);bar=Number(bar);if(!isFinite(target)||!isFinite(bar)||bar<=0)return{target:target,bar:bar,side:0,below:false};
 return{target:target,bar:bar,side:Math.max(0,(target-bar)/2),below:target<bar};
}
function plateResultHtml(target,bar){
 var result=calculatePlateLoad(target,bar);if(target<=0)return'<div class="plateresult"><div class="platesideweight"><b>Noch kein Zielgewicht</b></div><div class="muted" style="margin-top:5px">Trag zuerst ein Arbeitsgewicht ein. Danach zeigt Satzkraft das Gewicht pro Seite.</div></div>';
 return'<div class="plateresult"><div class="platesideweight"><span>Gewicht pro Seite</span><b>'+fmtKg(result.side)+' kg pro Seite</b></div>'+(result.below?'<div class="platehint">Das Zielgewicht liegt unter dem Gewicht der gewählten Stange.</div>':'')+'</div>';
}
function plateCalculatorHtml(ex){
 var target=targetWeight(ex),saved=Number(S.barw[ex.id]),bar=[10,15,20].indexOf(saved)>=0?saved:20,h='<div class="platecalc"><div class="platetarget"><span>Zielgewicht gesamt</span><b>'+(target>0?fmtKg(target)+' kg':'—')+'</b></div><div><div class="platelabel">Stangengewicht</div><div class="platechoices" role="group" aria-label="Stangengewicht">';
 [10,15,20].forEach(function(value){var active=bar===value;h+='<button type="button" data-plate-bar="'+value+'" data-plate-ex="'+attr(ex.id)+'" class="'+(active?'active':'')+'" aria-pressed="'+(active?'true':'false')+'">'+value+' kg</button>';});
 h+='</div></div>';
 h+=plateResultHtml(target,bar);
 return h+'</div>';
}
function showPlateCalculator(ex){if(!ex||!ex.w)return;showModal("Scheiben pro Seite (Langhantel)",plateCalculatorHtml(ex),[{label:"Fertig",cls:"primary",action:null}]);}
function selectPlateBar(exid,value){var ex=findEx(exid),bar=Number(value);if(!ex||[10,15,20].indexOf(bar)<0)return;S.barw[exid]=bar;save();showPlateCalculator(ex);}
var pendingExerciseNote="";
function showExerciseNote(ex){
 if(!ex)return;var current=String(S.notes[ex.id]||"");pendingExerciseNote=current;
 showModal("Notiz · "+esc(ex.name),'<textarea id="exerciseNoteInput" class="notearea" maxlength="500" aria-label="Notiz für '+attr(ex.name)+'" placeholder="Zum Beispiel Sitzhöhe, Geräteeinstellung oder Technik-Hinweis">'+esc(current)+'</textarea><div class="muted" style="margin-top:6px">Maximal 500 Zeichen · leer speichern löscht die Notiz.</div>',[
  {label:"Speichern",cls:"primary",action:function(){var value=pendingExerciseNote.trim().slice(0,500);if(value)S.notes[ex.id]=value;else delete S.notes[ex.id];save();renderView();}},
  {label:"Abbrechen",action:null}
 ]);
}
function performanceSummary(ex,sets){return(sets||[]).filter(reportSetHasData).map(function(set){if(isTime(ex))return reportTimedSetText(ex,set);return ex.w?set.reps+"×"+(set.weight===""||set.weight==null?"Gewicht fehlt":set.weight+" kg"):String(set.reps);}).join(" · ")||"—";}
function lastPerf(ex){for(var w=S.week-1;w>=1;w--){var c=S.logs[w+"|"+S.day+"|"+ex.id];if(c&&!normalizeSwapName(c.swap)&&c.sets&&c.sets.some(function(s){return s.reps!==""&&s.reps!=null;}))return{week:w,sets:c.sets};}return null;}
function otherDayPerfForUnit(ex,day,w){
 var exercises=dayExercisesFor(day,w);
 for(var i=0;i<exercises.length;i++){
  var candidate=exercises[i],cell=S.logs[w+"|"+day.key+"|"+candidate.id];
  if(!exerciseLibraryNamesMatch(ex.name,candidate.name)||!cell||normalizeSwapName(cell.swap)||!Array.isArray(cell.sets)||!cell.sets.some(function(s){return s&&s.reps!==""&&s.reps!=null;}))continue;
  return{day:day,week:w,exercise:candidate,sets:cell.sets};
 }
 return null;
}
function latestOtherDayPerf(ex){
 var records=(Array.isArray(S.history)?S.history:[]).map(function(entry,index){return{entry:entry,index:index,at:Number(entry&&(entry.end||entry.start))||0};}).filter(function(record){return record.entry&&record.entry.day!==S.day;}).sort(function(a,b){return b.at-a.at||a.index-b.index;});
 for(var i=0;i<records.length;i++){var entry=records[i].entry,day=dayByKey(entry.day),found=day&&day.key===entry.day?otherDayPerfForUnit(ex,day,Number(entry.week)):null;if(found)return found;}
 for(var w=PROG().weeks.length;w>=1;w--)for(var di=PROG().days.length-1;di>=0;di--){var candidateDay=PROG().days[di];if(candidateDay.key!==S.day){var fallback=otherDayPerfForUnit(ex,candidateDay,w);if(fallback)return fallback;}}
 return null;
}
function weekFrac(w){
 var d=0,t=0,ds=PROG().days;
 for(var a=0;a<ds.length;a++){
  var exercises=dayExercisesFor(ds[a],w),n=exercises.length;t+=n;
  if(historyMarksComplete(S.history,w,ds[a].key)){d+=n;continue;}
  for(var i=0;i<n;i++)if(cellComplete(w,ds[a].key,exercises[i]))d++;
 }
 return t?d/t:0;
}
function dayComplete(w,dk){
 var exercises=dayExercisesFor(dayByKey(dk),w);
 return exercises.length>0&&exercises.every(function(ex){return cellComplete(w,dk,ex);});
}
function historyMarksComplete(history,w,dk){
 if(!Array.isArray(history))return false;
 return history.some(function(e){return !!e&&e.week===w&&e.day===dk&&e.complete===true;});
}
function unitComplete(w,dk){return historyMarksComplete(S.history,w,dk)||dayComplete(w,dk);}
function unitHasSetValues(w,dk){
 var prefix=w+"|"+dk+"|";
 for(var key in S.logs){
  if(key.indexOf(prefix)!==0)continue;var cell=S.logs[key];
  if(!cell||!Array.isArray(cell.sets))continue;
  if(cell.sets.some(function(set){return set&&(set.reps!==""&&set.reps!=null||set.weight!==""&&set.weight!=null);}))return true;
 }
 return false;
}
function unitEmpty(w,dk){return !historyForDay(w,dk).length&&!unitHasSetValues(w,dk);}
function storeUnitHasSetValues(store,w,dk){
 var prefix=w+"|"+dk+"|",logs=store&&store.logs||{};
 for(var key in logs){if(key.indexOf(prefix)!==0)continue;var cell=logs[key];if(cell&&Array.isArray(cell.sets)&&cell.sets.some(function(set){return set&&(set.reps!==""&&set.reps!=null||set.weight!==""&&set.weight!=null);}))return true;}
 return false;
}
function programUnitComplete(program,store,w,dk){
 if(historyMarksComplete(store&&store.history,w,dk))return true;var day=(program.days||[]).filter(function(item){return item.key===dk;})[0],exercises=dayExercisesFor(day,w,store&&store.removedEx||{}),logs=store&&store.logs||{};
 return exercises.length>0&&exercises.every(function(ex){var need=setsForProgramExercise(program,ex,w),cell=logs[w+"|"+dk+"|"+ex.id];if(!need||!cell||!Array.isArray(cell.sets))return false;for(var i=0;i<need;i++)if(!cell.sets[i]||!setComplete(ex,cell.sets[i]))return false;return true;});
}
function currentTrainingWeekFor(program,store){
 var max=program.weeks.length,highest=0,history=Array.isArray(store&&store.history)?store.history:[];
 for(var w=1;w<=max;w++){
  var begun=history.some(function(entry){return entry&&entry.week===w;});
  if(!begun)for(var di=0;di<program.days.length&&!begun;di++)begun=storeUnitHasSetValues(store,w,program.days[di].key);
  if(begun)highest=w;
 }
 if(!highest)return 1;
 var allComplete=program.days.every(function(day){return programUnitComplete(program,store,highest,day.key);});
 return allComplete?Math.min(max,highest+1):highest;
}
function currentTrainingWeek(){return currentTrainingWeekFor(PROG(),{logs:S.logs,history:S.history,removedEx:S.removedEx});}
function latestCompletedUnit(){
 var latest=null;
 S.history.forEach(function(entry){if(!entry||entry.complete!==true)return;var at=Number(entry.end)||Number(entry.start)||0;if(!latest||at>latest.at)latest={week:entry.week,day:entry.day,at:at};});
 return latest;
}
function isLatestCompletedUnit(w,dk){var latest=latestCompletedUnit();return !!latest&&latest.week===w&&latest.day===dk;}
function workoutAccess(w,dk){
 var current=currentTrainingWeek(),complete=unitComplete(w,dk),interrupted=dayWasInterrupted(w,dk)&&!complete;
 if(complete)return isLatestCompletedUnit(w,dk)?{allowed:true,mode:"repeat"}:{allowed:false,mode:"complete"};
 if(w===current)return{allowed:true,mode:interrupted?"continue":"start"};
 if(w<current&&unitEmpty(w,dk))return{allowed:true,mode:"start"};
 if(w===current+1&&w<=PROG().weeks.length&&unitEmpty(w,dk))return{allowed:true,mode:"start"};
 if(interrupted&&w<current)return{allowed:true,mode:"continue"};
 return{allowed:false,mode:"locked"};
}
function dayWasInterrupted(w,dk){
 return S.history.some(function(e){return e.week===w&&e.day===dk&&e.complete!==true;});
}
function historyForDay(w,dk){return S.history.filter(function(e){return e.week===w&&e.day===dk;});}
function replaceDayHistory(w,dk,entry){
 for(var i=S.history.length-1;i>=0;i--)if(S.history[i].week===w&&S.history[i].day===dk)S.history.splice(i,1);
 S.history.unshift(entry);
}
function resetDayLogs(w,dk){
 var prefix=w+"|"+dk+"|";
 for(var key in S.logs)if(key.indexOf(prefix)===0)delete S.logs[key];
}
function changeWeek(target){
 if(active()||target===S.week||target<1||target>PROG().weeks.length)return;
 correctionCell=null;expandedPreviewRows={};S.week=target;save();renderView();renderBar();
}
function changeDay(target){
 if(active()||target===S.day||dayKeys().indexOf(target)<0)return;
 correctionCell=null;expandedPreviewRows={};S.day=target;save();renderView();renderBar();
}
function skippedBeforeSelection(){
 var ordered=weekLayout().filter(function(day){return !!day;});
 var currentIndex=ordered.map(function(day){return day.key;}).indexOf(S.day);
 var skipped=[],current=currentTrainingWeek(),from=Math.max(1,current-1);
 for(var w=from;w<=S.week;w++){
  if(w<current-1||w>current)continue;
  var limit=w===S.week?currentIndex:ordered.length;
  for(var i=0;i<limit;i++)if(!unitComplete(w,ordered[i].key))skipped.push({week:w,day:ordered[i]});
 }
 return skipped;
}
function findEx(id){var ex=dayExercisesFor(dayByKey(S.day),S.week);for(var i=0;i<ex.length;i++)if(ex[i].id===id)return ex[i];return null;}
function active(){return !!S.workout;}
var correctionCell=null,correctionBackup=null,correctionIntroSeen=false,CORRECTION_EFFECT_COPY="Du änderst nur die Satzwerte dieser abgeschlossenen Einheit. Trainingszeit und Protokolleintrag bleiben unverändert. Empfehlungen und Zielwerte späterer Wochen werden nach deiner Korrektur neu berechnet.";
function correctionActive(){return typeof correctionCell!=="undefined"&&!!correctionCell&&correctionCell.week===S.week&&correctionCell.day===S.day&&!active();}
function enterCorrectionMode(){
 if(active()||!unitComplete(S.week,S.day))return false;
 correctionBackup={prefix:S.week+"|"+S.day+"|",cells:{}};
 Object.keys(S.logs).forEach(function(k){if(k.indexOf(correctionBackup.prefix)===0)correctionBackup.cells[k]=JSON.parse(JSON.stringify(S.logs[k]));});
 correctionCell={week:S.week,day:S.day};renderView();renderBar();return true;
}
function startCorrection(){
 if(active()||!unitComplete(S.week,S.day))return;
 enterCorrectionMode();
}
function finishCorrection(){correctionCell=null;correctionBackup=null;renderView();renderBar();}
function cancelCorrection(){
 if(correctionBackup){
  var pre=correctionBackup.prefix;
  Object.keys(S.logs).forEach(function(k){if(k.indexOf(pre)===0)delete S.logs[k];});
  Object.keys(correctionBackup.cells).forEach(function(k){S.logs[k]=correctionBackup.cells[k];});
  save();
 }
 finishCorrection();
}

var REC_COLOR={increase:"emerald",hold:"amber",decrease:"orange",deload:"sky",technique:"amber",progression:"emerald"};
function progressContextHtml(ex,last,done,tw){
 var text="",tone="",weeks=PROG().weeks,W=weeks[S.week-1],mode=getExerciseProgressionMode(ex),sourcePrefix="W";
 if(!done&&!currentExerciseSwap(ex)&&W){
  if(W.phase==="deload"){text="Erholungswoche";tone=" sky";}
  else if(S.week>1&&weeks[S.week-2]&&weeks[S.week-2].phase==="deload"){text="Wiedereinstieg";tone=" sky";}
  else if(last){
   var rec=recommendForWeek(ex,last.week),override=ex.w?S.tg[S.week+"|"+ex.id]:null,numeric=ex.w&&["increase","decrease","hold"].indexOf(rec.action)>=0&&rec.nextWeight!=null;
   if(numeric&&(override==null||override==="")&&round(rec.nextWeight*wfOf(W))===tw){
    text=rec.action==="increase"?"↑ "+fmtKg(rec.increment)+" kg aus "+sourcePrefix+last.week:rec.action==="decrease"?"↓ "+fmtKg(rec.increment)+" kg aus "+sourcePrefix+last.week:"aus "+sourcePrefix+last.week+" beibehalten";
   }else if(!ex.w&&rec.action==="increase"){
    text=isTime(ex)?(timeMode(ex)==="target"?"Schwierigkeit ↑ aus "+sourcePrefix+last.week:"↑ Zeit aus "+sourcePrefix+last.week):"↑ Wdh. aus "+sourcePrefix+last.week;
   }else if(!ex.w&&rec.action==="progression")text="Variante ↑ aus "+sourcePrefix+last.week;
  }
 }
 return'<small class="targetcontext'+tone+'" id="proghint-'+attr(ex.id)+'">'+esc(text)+'</small>';
}
function nextRecommendationCopy(ex,rec,W){
 var mode=getExerciseProgressionMode(ex);
 if(W&&W.phase==="deload")return{message:"Erholungswoche abgeschlossen",reason:"Der Wiedereinstieg wird in der nächsten Woche automatisch angepasst."};
 if(rec.action==="increase"&&(mode==="weight"||mode==="added_weight"))return{message:"Nächste Einheit: auf "+fmtKg(rec.nextWeight)+" kg steigern",reason:"+"+fmtKg(rec.increment)+" kg · "+rec.reason};
 if(rec.action==="decrease"&&(mode==="weight"||mode==="added_weight"))return{message:"Nächste Einheit: auf "+fmtKg(rec.nextWeight)+" kg reduzieren",reason:"−"+fmtKg(rec.increment)+" kg · "+rec.reason};
 if(rec.action==="hold"&&mode==="added_weight"&&Number(rec.nextWeight)===0)return{message:"Nächste Einheit: ohne Zusatzgewicht trainieren",reason:rec.reason};
 if(rec.action==="hold"&&(mode==="weight"||mode==="added_weight"))return{message:"Nächste Einheit: Gewicht beibehalten",reason:rec.reason};
 if(isTime(ex)&&timeMode(ex)==="target"&&rec.action==="increase")return{message:"Nächste Einheit: Schwierigkeit leicht erhöhen",reason:"Widerstand, Tempo oder Übungsvariante leicht steigern; die Zielzeit bleibt bestehen."};
 if(rec.action==="increase"&&mode==="seconds")return{message:"Nächste Einheit: Haltezeit leicht steigern",reason:rec.reason};
 if(rec.action==="increase"&&mode==="reps")return{message:"Nächste Einheit: Wiederholungen leicht steigern",reason:rec.reason};
 if(rec.action==="progression")return{message:"Nächste Einheit: schwerere Variante testen",reason:rec.reason};
 if(rec.action==="technique")return{message:"Nächste Einheit: Technik sauber festigen",reason:rec.reason};
 return{message:rec.message,reason:rec.reason};
}
function recHtml(ex){
 if(currentExerciseSwap(ex)||!isDone(ex))return "";
 var W=PROG().weeks[S.week-1],rec=recommendForWeek(ex,S.week);if(rec.action==="none"||!rec.message)return "";
 var copy=nextRecommendationCopy(ex,rec,W),context="Empfehlung nach dieser Einheit";
 var color=REC_COLOR[rec.action]||"amber";
 return '<div class="rec '+color+'">'+icon("external")+'<span><span class="reccontext">'+esc(context)+'</span><b>'+esc(copy.message)+'</b>'+(copy.reason?'<br><span style="opacity:.8">'+esc(copy.reason)+'</span>':'')+'</span></div>';
}
function stpBtn(ex,i,kind,d,dis){return '<button class="stp" data-step="'+kind+'" data-ex="'+attr(ex.id)+'" data-i="'+i+'" data-d="'+d+'" aria-label="'+(kind==="wt"?"Gewicht":(isTime(ex)?"Zeit":"Wiederholungen"))+' '+(d>0?"übernehmen oder erhöhen":"verringern")+'"'+dis+'>'+(d>0?'+':'−')+'</button>';}
function setGridHeadHtml(ex){
 var timed=isTime(ex),h='<div class="setgridhead'+(ex.w?' weighted':'')+(timed?' timed':'')+(!ex.w?' single':'')+'"><span>Set</span>';
 if(timed)h+='<span class="setheadmetric timehead"><span>Zeit · min</span></span>';
 else h+='<span class="setheadmetric"><span>Wdh</span></span>';
 if(ex.w)h+='<span class="setheadmetric"><span>kg</span></span>';
 return h+'</div>';
}
function setRowHtml(ex,i,s,rr,tw,dis,firstOpen,canHold){
 var full=setComplete(ex,s);
 var repPH=rr?(isTime(ex)?fmtClockInput(rr[1]):(""+rr[1])):"";
 var wPH=tw>0?(""+tw):"";
 var h='<div class="srow'+(ex.w?" weighted":"")+(isTime(ex)?" timed":"")+(full?" full":"")+'" id="row-'+attr(ex.id)+'-'+i+'">';
 h+='<span class="slbl">S'+(i+1)+'</span>';
 var repInput='<input class="inp" id="rep-'+attr(ex.id)+'-'+i+'" data-set-kind="rep" data-ex="'+attr(ex.id)+'" data-i="'+i+'" inputmode="numeric" maxlength="'+(isTime(ex)?5:4)+'" aria-label="'+attr(ex.name)+' Satz '+(i+1)+' '+(isTime(ex)?"Zeit in Minuten und Sekunden, maximal 99 Minuten 59 Sekunden":"Wiederholungen, maximal 9999")+'" placeholder="'+attr(repPH)+'" value="'+attr(isTime(ex)?timeInputValue(s.reps):sanInt(s.reps,SET_REP_MAX))+'"'+dis+'>';
 var repControl=repInput;if(isTime(ex)){var swRunning=restPhase==="hold"&&restExId===ex.id&&restNextSet===i,swOn=swRunning||(!!canHold&&i===firstOpen);repControl='<span class="timefield">'+repInput+'<button class="swbtn rowtimer'+(swRunning?' running':'')+'" data-hold-row="'+attr(ex.id)+'" data-i="'+i+'" aria-label="'+(swRunning?'Stoppuhr stoppen und Zeit eintragen':attr(ex.name)+' Satz '+(i+1)+': Zeit mit Stoppuhr messen')+'" title="'+(swRunning?'Stoppen & eintragen':'Stoppuhr starten')+'"'+(swOn?'':' disabled')+'>'+icon(swRunning?"stop":"play")+'</button></span>';}
 var weightInput='<input class="inp" id="wt-'+attr(ex.id)+'-'+i+'" data-set-kind="wt" data-ex="'+attr(ex.id)+'" data-i="'+i+'" inputmode="decimal" maxlength="6" aria-label="'+attr(ex.name)+' Satz '+(i+1)+' Gewicht in kg, maximal 2000" placeholder="'+attr(wPH)+'" value="'+attr(s.weight)+'"'+dis+'>';
 if(ex.w){
  h+=isTime(ex)?'<div class="settimevalue">'+repControl+'</div>':'<div class="setmetricgrid">'+stpBtn(ex,i,"rep",-1,dis)+repInput+stpBtn(ex,i,"rep",1,dis)+'</div>';
  h+='<div class="setmetricgrid">'+stpBtn(ex,i,"wt",-1,dis)+weightInput+stpBtn(ex,i,"wt",1,dis)+'</div>';
  return h+'</div>';
 }
 if(isTime(ex))return h+'<div class="settimevalue">'+repControl+'</div></div>';
 h+=stpBtn(ex,i,"rep",-1,dis)+repInput+stpBtn(ex,i,"rep",1,dis)+'<span class="unit">Wdh</span>';
 return h+'</div>';
}
function exHistory(ex){
 var rows=[],selectedSwap=currentExerciseSwap(ex);
 for(var w=1,max=PROG().weeks.length;w<=max;w++){
  if(!exerciseValidForWeek(ex,w))continue;
  var c=S.logs[w+"|"+S.day+"|"+ex.id];if(!c||!c.sets||normalizeSwapName(c.swap)!==selectedSwap)continue;
  var performed=historicalExercise(ex,c),need=c.sets.length,parts=[],vol=0,has=false;
  var e1=0;
  for(var i=0;i<need;i++){var s=c.sets[i];if(reportSetHasData(s)){has=true;if(isTime(performed)){parts.push(reportTimedSetText(performed,s));}else if(performed.w&&s.weight!==""&&Number(s.weight)>0){parts.push(s.reps+"×"+s.weight);vol+=Number(s.reps)*Number(s.weight);var est=Number(s.weight)*(1+Number(s.reps)/30);if(est>e1)e1=est;}else{parts.push(isTime(performed)?fmtSeconds(s.reps):(""+s.reps));}}}
  if(has)rows.push({name:performed.name,confirmed:!!c.performedExercise,w:w,label:(PROG().weeks[w-1]||{}).label||"",parts:parts,vol:vol,e1:e1>0?round(e1):null});
 }
 return rows;
}
function sparkline(vals){
 var w=280,h=44,min=Math.min.apply(null,vals),max=Math.max.apply(null,vals);
 if(max===min)max=min+1;
 var pts=vals.map(function(v,i){return((i/(vals.length-1))*(w-8)+4).toFixed(1)+","+(((1-(v-min)/(max-min))*(h-10))+5).toFixed(1);}).join(" ");
 return '<svg width="100%" viewBox="0 0 '+w+' '+h+'" style="display:block;margin:2px 0 10px" aria-hidden="true"><polyline points="'+pts+'" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function showHistory(ex){
 var rows=exHistory(ex),body;
 var histSwap=currentExerciseSwap(ex),histName=histSwap||ex.name;
 if(!rows.length){body='<p style="color:var(--muted);margin:0">Für diese Übung wurde noch nichts eingetragen.</p>';}
 else{
  var e1s=rows.map(function(r){return r.e1;}).filter(function(v){return v!=null;});
  body="";
  if(ex.w&&!isTime(ex)&&e1s.length>=2)body+='<div style="font-size:11px;color:var(--muted);margin-bottom:2px">Geschätztes 1RM: '+e1s[0]+' → '+e1s[e1s.length-1]+' kg</div>'+sparkline(e1s);
  body+='<table class="htbl"><thead><tr><th>Woche</th><th>Sätze'+(isTime(ex)?(ex.w?' (Zeit · kg)':' (Zeit)'):(ex.w?' (Wdh×kg)':' (Wdh)'))+'</th>'+(ex.w&&!isTime(ex)?'<th style="text-align:right">Vol.</th>':'')+'</tr></thead><tbody>';
  rows.forEach(function(r){
   body+='<tr'+(r.w===S.week?' class="cur"':'')+'><td class="wk">W'+r.w+'<span class="hwl">'+esc(r.label)+'</span></td><td>'+esc(r.parts.join(" · "))+'</td>'+(ex.w&&!isTime(ex)?'<td class="vol">'+(r.vol>0?r.vol+" kg":"–")+'</td>':'')+'</tr>';
  });
  body+='</tbody></table>';
 }
 showModal("Verlauf · "+esc(histName),body,[{label:"Schließen",cls:"primary",action:null}]);
}
