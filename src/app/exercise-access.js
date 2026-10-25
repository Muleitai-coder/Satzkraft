// ---------- Programm-Zugriff ----------
function PROG(){return S.programs[S.active];}
function dayKeys(){return PROG().days.map(function(d){return d.key;});}
function dayByKey(k){var ds=PROG().days;for(var i=0;i<ds.length;i++)if(ds[i].key===k)return ds[i];return ds[0];}
function exerciseValidForWeek(ex,w){
 if(!ex)return false;var from=ex.fromWeek==null?1:Number(ex.fromWeek),until=ex.untilWeek==null?Infinity:Number(ex.untilWeek);
 return w>=from&&w<=until;
}
function exerciseRemovedFrom(map,ex,w,dayKey){return !!(map&&Array.isArray(map["w"+w+"_"+dayKey])&&map["w"+w+"_"+dayKey].indexOf(ex.id)>=0);}
function dayExercisesFor(day,w,removedEx){if(arguments.length<3)removedEx=S.removedEx;return(day&&Array.isArray(day.ex)?day.ex:[]).filter(function(ex){return exerciseValidForWeek(ex,w)&&!exerciseRemovedFrom(removedEx,ex,w,day.key);});}
function wdSlot(d){var k=String(d.wd||"").trim().toLowerCase();var idx=WD_MAP[k];if(idx==null)idx=WD_MAP[k.split(/[\s\-\/.,]/)[0]];return(idx==null?null:idx);}
function weekLayout(){
 var slots=[null,null,null,null,null,null,null],pending=[];
 PROG().days.forEach(function(d){var idx=wdSlot(d);if(idx!=null&&slots[idx]==null)slots[idx]=d;else pending.push(d);});
 pending.forEach(function(d){for(var i=0;i<7;i++){if(slots[i]==null){slots[i]=d;break;}}});
 return slots;
}
function dayStatus(d){
 var exercises=dayExercisesFor(d,S.week),all=exercises.length;if(historyMarksComplete(S.history,S.week,d.key))return{dn:all,all:all,complete:true};
 var dn=0;for(var i=0;i<all;i++)if(cellComplete(S.week,d.key,exercises[i]))dn++;
 return{dn:dn,all:all,complete:all>0&&dn===all};
}
function wfOf(W){return W.phase==="deload"?getWorkoutSettings().deloadMultiplier:1.0;}
function CATS(){return PROG().categories||{};}
function catOf(ex){return CATS()[ex.cat]||{};}
function catLabel(ex){var c=catOf(ex);return c.label||ex.cat||"";}
function catColor(ex){var c=catOf(ex).color;return CAT_COLORS.indexOf(c)>=0?c:"slate";}
function catRest(ex){var r=catOf(ex).rest;return r>0?r:90;}
function restLabel(sec){if(!sec)return "–";if(sec<60)return sec+" s";return sec%60===0?(sec/60)+" min":fmtTime(sec)+" min";}
function isTime(ex){return ex.unit==="seconds";}
function timeMode(ex){if(!isTime(ex))return null;if(ex.tmode==="target"||ex.tmode==="max")return ex.tmode;return /(?:^|\s)(?:max|maximal|so lange)(?:\s|\.|$)/i.test(String(ex.target||""))?"max":"target";}
function fmtClockInput(seconds){var n=Math.min(SET_TIME_MAX_SECONDS,Math.max(0,Math.round(Number(seconds)||0)));return ("0"+Math.floor(n/60)).slice(-2)+":"+("0"+(n%60)).slice(-2);}
function clockInputSeconds(raw){raw=String(raw==null?"":raw);if(/^\s*-/.test(raw))return"0";if(raw.indexOf(":")>=0){var parts=raw.split(":"),minuteDigits=String(parts.shift()||"").replace(/[^0-9]/g,"").slice(0,2),secondDigits=parts.join("").replace(/[^0-9]/g,"").slice(0,2);if(!minuteDigits&&!secondDigits)return"";var colonMin=Math.min(99,Number(minuteDigits||0)),colonSec=Math.min(59,Number(secondDigits||0));return String(colonMin*60+colonSec);}var d=raw.replace(/[^0-9]/g,"").slice(-4);if(!d)return"";var sec=Math.min(59,Number(d.slice(-2))),min=Number(d.slice(0,-2)||0);return String(Math.min(SET_TIME_MAX_SECONDS,min*60+sec));}
function clockEditValue(raw){raw=String(raw==null?"":raw);if(/^\s*-/.test(raw))return"0";if(raw.indexOf(":")<0)return raw.replace(/[^0-9]/g,"").slice(0,4);var parts=raw.split(":"),minutes=String(parts.shift()||"").replace(/[^0-9]/g,"").slice(0,2),seconds=parts.join("").replace(/[^0-9]/g,"").slice(0,2);return minutes||seconds?minutes+":"+seconds:"";}
function clockTypedFormat(raw){var seconds=clockInputSeconds(raw);return seconds===""?"":fmtClockInput(seconds);}
function timeInputValue(seconds,minutes){return seconds===""||seconds==null?"":fmtClockInput(seconds);}
function timeInputSeconds(input,ex){return isTime(ex)?clockInputSeconds(input.value):sanInt(input.value,SET_REP_MAX);}
function setTimeInputValue(input,ex,seconds){if(input)input.value=isTime(ex)?timeInputValue(seconds):sanInt(seconds,SET_REP_MAX);}
function catReps(ex,phase){if(Array.isArray(ex.reps))return ex.reps;var r=catOf(ex).reps;return(r&&r[phase])?r[phase]:null;}
function setsForProgramExercise(program,ex,w){var week=program&&program.weeks&&program.weeks[w-1],sets=week&&week.sets&&week.sets[ex.cat];return ex.sets!=null?ex.sets:(sets!=null?sets:3);}
function setsForExercise(ex,w){return setsForProgramExercise(PROG(),ex,w);}
function programBlockComplete(program,logs,history,removedEx){
 if(!program||!Array.isArray(program.weeks)||!program.weeks.length||!Array.isArray(program.days)||!program.days.length)return false;logs=logs&&typeof logs==="object"?logs:{};if(!Array.isArray(history))history=[];
 for(var w=1;w<=program.weeks.length;w++)for(var di=0;di<program.days.length;di++){var day=program.days[di],exercises=dayExercisesFor(day,w,removedEx||{});if(historyMarksComplete(history,w,day.key))continue;if(!exercises.length)return false;for(var ei=0;ei<exercises.length;ei++){var ex=exercises[ei],need=setsForProgramExercise(program,ex,w),cell=logs[w+"|"+day.key+"|"+ex.id];if(!need||!cell||!Array.isArray(cell.sets))return false;for(var si=0;si<need;si++)if(!cell.sets[si]||!setComplete(ex,cell.sets[si]))return false;}}
 return true;
}

function exerciseLogKey(ex,week,day){return(week||S.week)+"|"+(day||S.day)+"|"+ex.id;}
function currentExerciseCell(ex){return S.logs[exerciseLogKey(ex)]||null;}
function currentExerciseSwap(ex){var cell=currentExerciseCell(ex),name=cell&&normalizeSwapName(cell.swap);return name||"";}
function currentExerciseSwapWeight(ex){var cell=currentExerciseCell(ex),value=cell&&currentExerciseSwap(ex)&&normalizeSwapWeight(cell.swapWeight);return value===""||value==null?null:Number(value);}
function getSets(ex){var n=setsForExercise(ex,S.week),cur=currentExerciseCell(ex)||{sets:[]},out=[];for(var i=0;i<n;i++)out.push(cur.sets[i]?{reps:cur.sets[i].reps,weight:cur.sets[i].weight}:{reps:"",weight:""});return out;}
function snapshotPerformedExercise(ex,cell){
 var swap=normalizeSwapName(cell&&cell.swap),entry=swap?findExerciseLibraryEntry(swap):null;
 var name=swap||ex.name,id=swap?(entry&&entry.id):ex.exerciseId,convention=swap?(entry&&entry.weightConvention):ex.weightConvention;
 if(!convention&&id&&typeof EXERCISE_WEIGHT_CONVENTIONS!=="undefined")convention=EXERCISE_WEIGHT_CONVENTIONS[id];
 var snapshot={version:1,name:String(name||"Übung").slice(0,80),unit:ex.unit==="seconds"?"seconds":"reps",weighted:!!ex.w,bodyweight:!!ex.bw,perSide:!!ex.perSide,weightConvention:convention||"unspecified"};
 if(id)snapshot.exerciseId=id;
 return snapshot;
}
function setsHaveEnteredValues(sets){return Array.isArray(sets)&&sets.some(function(set){return set&&(set.reps!==""&&set.reps!=null||set.weight!==""&&set.weight!=null);});}
function writeSets(ex,sets){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;var key=exerciseLogKey(ex),current=S.logs[key]||{},cell={sets:sets},swap=normalizeSwapName(current.swap),swapWeight=normalizeSwapWeight(current.swapWeight),swapDecision=normalizeSwapDecision(current.swapDecision);if(swap){cell.swap=swap;if(swapWeight)cell.swapWeight=swapWeight;if(swapDecision)cell.swapDecision=swapDecision;}if(current.performedExercise)cell.performedExercise=current.performedExercise;
 else{var recording=current.pendingPerformedExercise||(!setsHaveEnteredValues(current.sets)?snapshotPerformedExercise(ex,current):null);
 if(recording&&setsHaveEnteredValues(sets)){if(sets.some(function(set){return setComplete(ex,set);}))cell.performedExercise=recording;else cell.pendingPerformedExercise=recording;}}
 S.logs[key]=cell;}
function exerciseHasEnteredData(ex){return getSets(ex).some(function(set){return set&&(set.reps!==""&&set.reps!=null||set.weight!==""&&set.weight!=null);});}
function removeWorkoutPendingReplacement(ex){if(!S.workout||!ex||!Array.isArray(S.workout.pendingReplacements))return;S.workout.pendingReplacements=S.workout.pendingReplacements.filter(function(item){return item.day!==S.day||item.exId!==ex.id;});}
function swapExerciseForToday(ex,name){
 if(!ex||exerciseHasEnteredData(ex))return false;name=normalizeSwapName(name);var entry=findExerciseLibraryEntry(name);if(!name||entry&&!exerciseSwapTypeCompatible(ex,entry))return false;var key=exerciseLogKey(ex),cell=S.logs[key]||{sets:getSets(ex)},previous=normalizeSwapName(cell.swap);cell.sets=Array.isArray(cell.sets)?cell.sets:getSets(ex);cell.swap=name;delete cell.swapDecision;if(previous&&previous!==name)delete cell.swapWeight;S.logs[key]=cell;removeWorkoutPendingReplacement(ex);save();renderView();return true;
}
function clearExerciseSwapForToday(ex){
 if(!ex||exerciseHasEnteredData(ex)||!currentExerciseSwap(ex))return false;var key=exerciseLogKey(ex),cell=S.logs[key];if(cell){delete cell.swap;delete cell.swapWeight;delete cell.swapDecision;if(!Array.isArray(cell.sets)||!cell.sets.some(function(set){return set&&(set.reps!==""&&set.reps!=null||set.weight!==""&&set.weight!=null);}))delete S.logs[key];}removeWorkoutPendingReplacement(ex);save();renderView();return true;
}
var pendingExerciseSwapName="";
function exerciseSwapMatchesHtml(ex,query){
 var clean=String(query||"").trim();if(clean.length<2)return"";
 var exact=findExerciseLibraryEntry(clean);if(exact&&normalizeExerciseLibraryName(exact.de)===normalizeExerciseLibraryName(clean))return"";
 return exerciseLibraryMatches(clean,6).filter(function(entry){return entry&&entry.de&&!exerciseLibraryNamesMatch(entry.de,ex.name)&&exerciseSwapTypeCompatible(ex,entry);}).map(function(entry){return'<button type="button" class="swapsuggestion" data-swap-suggestion="'+attr(entry.de)+'">'+esc(entry.de)+'</button>';}).join("");
}
function renderExerciseSwapMatches(input){
 if(!input)return;var ex=findEx(input.dataset.swapSearchEx),box=document.getElementById("swaplibraryresults");if(ex&&box)box.innerHTML=exerciseSwapMatchesHtml(ex,input.value);
}
function exerciseSwapRecommendedHtml(ex){
 var suggestions=exerciseSwapSuggestions(ex),name=suggestions.length?suggestions[0]:"";if(!name)return"";
 return'<div class="swapsuggestions"><span>Empfohlene Ersatzübung</span><button type="button" class="swapsuggestion" data-swap-suggestion="'+attr(name)+'">'+esc(name)+'</button></div>';
}
function showExerciseSwap(ex,libraryReady){
 if(!ex)return;if(exerciseHasEnteredData(ex)){showModal("Übung nicht mehr tauschbar","Für diese Übung sind bereits Werte eingetragen. So bleiben Original- und Ersatzübung im Protokoll eindeutig getrennt.",[{label:"OK",cls:"primary",action:null}]);return;}
 if(typeof EXERCISE_LIBRARY!=="undefined"&&EXERCISE_LIBRARY===null&&!libraryReady){loadExerciseLibrary().then(function(){showExerciseSwap(ex,true);});return;}
 var current=currentExerciseSwap(ex),value=current||"",actions=[{label:"Übung tauschen",cls:"primary",action:function(){var name=normalizeSwapName(pendingExerciseSwapName),entry=findExerciseLibraryEntry(name);if(!name||exerciseLibraryNamesMatch(name,ex.name)||entry&&!exerciseSwapTypeCompatible(ex,entry)){showModal("Tausch nicht übernommen",!name?"Wähle eine Übung aus der Datenbank oder trag selbst eine ein.":exerciseLibraryNamesMatch(name,ex.name)?"Die gewählte Übung entspricht bereits dem Original.":"Diese Übung benötigt andere Satzfelder. Wähle für den heutigen Tausch eine Übung mit derselben Erfassungsart.",[{label:"Eingabe prüfen",cls:"primary",action:function(){showExerciseSwap(ex,true);}}]);return;}swapExerciseForToday(ex,name);}}];
 var chooser='<label class="edfield wide"><span class="edlabel">Ersatzübung</span><input id="swapname" data-swap-search-ex="'+attr(ex.id)+'" maxlength="80" autocomplete="off" value="'+attr(value)+'" placeholder="Übungsname eingeben"><small>Datenbanktreffer verwenden dieselbe Erfassungsart. Ein eigener Name muss ebenfalls zu den angezeigten Satzfeldern passen.</small></label><div class="swapresults" id="swaplibraryresults">'+exerciseSwapMatchesHtml(ex,value)+'</div>'+exerciseSwapRecommendedHtml(ex);
 if(current)actions.push({label:"Original verwenden",action:function(){clearExerciseSwapForToday(ex);}});actions.push({label:"Abbrechen",action:null});pendingExerciseSwapName=value;showModal("Übung tauschen",chooser+'<div class="muted" style="margin-top:8px">Für dieses Training wird nur die angezeigte Übung geändert. Nach einem vollständig beendeten Training entscheidest du für jeden Tausch einzeln, ob er künftig bleiben soll.'+(current?' Vor der ersten Satzeingabe kannst du zum Original zurückkehren.':'')+'</div>',actions);
}
var postWorkoutReplacements=sanitizePendingReplacements(S.pendingReplacements,S.active,PROG()),postWorkoutSwapQueue=[],postWorkoutSwapProgramId=null;
function refreshPostWorkoutReplacements(){postWorkoutReplacements=sanitizePendingReplacements(S.pendingReplacements,S.active,PROG());return postWorkoutReplacements;}
function clearPendingReplacementRequests(){S.pendingReplacements=[];refreshPostWorkoutReplacements();flushSave();return true;}
function completedWorkoutSwaps(programId,week,dayKey){
 var program=S.programs[programId],day=program&&(program.days||[]).filter(function(item){return item.key===dayKey;})[0],store=S.store[programId]||{},logs=programId===S.active?S.logs:(store.logs||{}),out=[];if(!program||!day)return out;
 dayExercisesFor(day,week).forEach(function(ex){var cell=logs[week+"|"+dayKey+"|"+ex.id],name=normalizeSwapName(cell&&cell.swap);if(name)out.push({programId:programId,week:week,day:dayKey,exId:ex.id,name:name,original:ex.name});});return out;
}
function workoutSwapLogCell(request){
 var store=S.store[request.programId]||{},logs=request.programId===S.active?S.logs:(store.logs||{});return logs[request.week+"|"+request.day+"|"+request.exId]||null;
}
function setWorkoutSwapDecision(request,decision){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 var cell=workoutSwapLogCell(request),name=normalizeSwapName(cell&&cell.swap);decision=normalizeSwapDecision(decision);if(!cell||name!==normalizeSwapName(request.name)||!decision)return false;cell.swapDecision=decision;return true;
}
function markCompletedWorkoutSwapsPending(programId,week,dayKey){
 var requests=completedWorkoutSwaps(programId,week,dayKey);requests.forEach(function(request){setWorkoutSwapDecision(request,"pending");});return requests;
}
function pendingCompletedWorkoutSwaps(programId){
 var program=S.programs[programId],store=S.store[programId];if(!program||!store)return[];var out=[],seen=Object.create(null),history=(store.history||[]).filter(function(entry){return entry&&entry.complete===true;}).slice().sort(function(a,b){return(Number(a.end)||Number(a.start)||0)-(Number(b.end)||Number(b.start)||0);});
 history.forEach(function(entry){completedWorkoutSwaps(programId,entry.week,entry.day).forEach(function(request){var cell=workoutSwapLogCell(request),key=request.week+"|"+request.day+"|"+request.exId;if(cell&&cell.swapDecision==="pending"&&!seen[key]){seen[key]=true;out.push(request);}});});return out;
}
function storeUnitHasPreparedSwap(store,week,dayKey){
 var prefix=week+"|"+dayKey+"|",logs=store&&store.logs||{};for(var key in logs)if(key.indexOf(prefix)===0&&normalizeSwapName(logs[key]&&logs[key].swap))return true;return false;
}
function nextOpenReplacementWeek(program,store,request){
 var anchor=Math.max(1,Number(request.week)||1)+1,max=program.weeks.length;while(anchor<=max&&((store.history||[]).some(function(entry){return entry&&entry.week===anchor&&entry.day===request.day;})||storeUnitHasSetValues(store,anchor,request.day)||storeUnitHasPreparedSwap(store,anchor,request.day)))anchor++;return anchor;
}
function queueFollowupReplacement(request){
 var combined=(Array.isArray(S.pendingReplacements)?S.pendingReplacements:[]).concat([{programId:request.programId,day:request.day,exId:request.exId,name:request.name}]);S.pendingReplacements=sanitizePendingReplacements(combined,request.programId,S.programs[request.programId]);refreshPostWorkoutReplacements();return{followup:true,anchor:null};
}
function replacementStartWeight(store,dayKey,exId,name,maxWeek){
 for(var week=Math.max(1,Number(maxWeek)||1);week>=1;week--){var cell=store&&store.logs&&store.logs[week+"|"+dayKey+"|"+exId];if(!cell||normalizeSwapName(cell.swap)!==normalizeSwapName(name))continue;var weights=(cell.sets||[]).map(function(set){return set&&set.weight;}).filter(function(value){return value!==""&&value!=null&&isFinite(Number(value))&&Number(value)>=0;}).map(Number);if(weights.length)return Math.min.apply(null,weights);var planned=normalizeSwapWeight(cell.swapWeight);if(planned!=="")return Number(planned);}
 return null;
}
function applyPermanentReplacementMetadata(ex,name){
 var entry=findExerciseLibraryEntry(name);ex.name=entry?entry.de:normalizeSwapName(name);delete ex.exerciseDefinition;delete ex.weightConvention;if(entry&&entry.definition)ex.exerciseDefinition=cloneJSON(entry.definition);if(entry&&entry.weightConvention)ex.weightConvention=entry.weightConvention;delete ex.exerciseId;if(entry&&entry.id)ex.exerciseId=entry.id;delete ex.en;delete ex.sub;delete ex.q;delete ex.proxy;delete ex.gname;delete ex.perSide;
 if(!entry)return ex;ex.en=entry.en||"";ex.sub=entry.technik||"";ex.q=entry.video||"";ex.proxy=entry.ersatz||null;if(entry.einseitig===true)ex.perSide=true;delete ex.tmode;var type=exerciseLibraryTypeSignature(entry);
 if(type==="weight"||type==="added_weight"||type==="weighted_seconds"){ex.w=true;ex.bw=type==="added_weight";ex.unit=type==="weighted_seconds"?"seconds":"reps";ex.pmode=type==="weighted_seconds"?"seconds":type;if(!(Number(ex.inc)>0))ex.inc=2.5;if(type==="weighted_seconds")ex.tmode="target";}
 else{ex.w=false;ex.bw=false;delete ex.inc;delete ex.def;if(type==="seconds"){ex.unit="seconds";ex.pmode="seconds";ex.tmode="target";}else{ex.unit="reps";ex.pmode="reps";}}
 return ex;
}
function applyPermanentExerciseReplacement(request){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 var program=S.programs[request.programId];if(!program)return null;syncStore();var store=S.store[request.programId]||newStore(program);
 var day=(program.days||[]).filter(function(item){return item.key===request.day;})[0],old=day&&(day.ex||[]).filter(function(ex){return ex.id===request.exId&&exerciseValidForWeek(ex,request.week);})[0],name=normalizeSwapName(request.name);if(!day||!old||!name)return null;
 var anchor=nextOpenReplacementWeek(program,store,request);if(anchor>program.weeks.length){var deferred=queueFollowupReplacement(request);flushSave();return deferred;}
 var used=Object.create(null);(day.ex||[]).forEach(function(ex){used[ex.id]=true;});var successor=applyPermanentReplacementMetadata(cloneJSON(old),name),oldIndex=day.ex.indexOf(old),performedWeight=successor.w?replacementStartWeight(store,request.day,request.exId,name,request.week):null;old.untilWeek=anchor-1;successor.id=uniqueTimelineExerciseId(day,old.id,anchor,used);if(successor.w)successor.def=performedWeight==null?0:round(performedWeight);successor.fromWeek=anchor;delete successor.untilWeek;successor.prevId=old.id;day.ex.splice(oldIndex+1,0,successor);program.updatedAt=Date.now();
 S.pendingReplacements=(Array.isArray(S.pendingReplacements)?S.pendingReplacements:[]).filter(function(item){return item.day!==request.day||item.exId!==request.exId;});refreshPostWorkoutReplacements();flushSave();return{followup:false,anchor:anchor};
}
function finishPostWorkoutSwapFlow(){
 var programId=postWorkoutSwapProgramId;postWorkoutSwapQueue=[];postWorkoutSwapProgramId=null;renderView();renderBar();return programId?maybeShowBlockSuccess(programId):false;
}
function acceptPermanentWorkoutSwap(request){
 function applyDecision(){var applied=applyPermanentExerciseReplacement(request);if(!applied){showModal("Tausch nicht gespeichert","Die dauerhafte Änderung konnte nicht sicher zugeordnet werden. Dein beendetes Training bleibt unverändert; versuche die Entscheidung bitte erneut.",[{label:"Erneut prüfen",cls:"primary",action:showNextPostWorkoutSwapDecision}]);return;}setWorkoutSwapDecision(request,"permanent");flushSave();postWorkoutSwapQueue.shift();showNextPostWorkoutSwapDecision();}
 if(typeof EXERCISE_LIBRARY!=="undefined"&&EXERCISE_LIBRARY===null){loadExerciseLibrary().then(applyDecision);return true;}applyDecision();return true;
}
function showNextPostWorkoutSwapDecision(){
 if(active())return false;if(!postWorkoutSwapQueue.length)return finishPostWorkoutSwapFlow();
 var request=postWorkoutSwapQueue[0],program=S.programs[request.programId],store=S.store[request.programId]||newStore(program),anchor=nextOpenReplacementWeek(program,store,request),future=anchor<=program.weeks.length?"Ab Woche "+anchor+" wird dort <b>"+esc(request.name)+"</b> verwendet.":"Im nächsten Folgeblock wird dort <b>"+esc(request.name)+"</b> verwendet.",remaining=postWorkoutSwapQueue.length>1?"<br><br>Danach folgt noch "+(postWorkoutSwapQueue.length-1===1?"eine weitere Entscheidung.":postWorkoutSwapQueue.length-1+" weitere Entscheidungen."):"";
 showModal("Übung dauerhaft übernehmen?",'<b>'+esc(request.original)+'</b> wurde in diesem Training durch <b>'+esc(request.name)+'</b> ersetzt.<br><br>'+future+' Dein gerade beendetes Training bleibt in beiden Fällen unverändert im Protokoll.'+remaining,[
  {label:"Dauerhaft übernehmen",cls:"primary",action:function(){acceptPermanentWorkoutSwap(request);}},
  {label:"Nur dieses Training",action:function(){setWorkoutSwapDecision(request,"training");flushSave();postWorkoutSwapQueue.shift();showNextPostWorkoutSwapDecision();}}
 ]);return true;
}
function resumePendingWorkoutSwapFlow(programId){
 if(active()||postWorkoutSwapQueue.length)return false;var pending=pendingCompletedWorkoutSwaps(programId);if(!pending.length)return false;postWorkoutSwapProgramId=programId;postWorkoutSwapQueue=pending;return showNextPostWorkoutSwapDecision();
}
function finishPendingReplacementFlow(){return finishPostWorkoutSwapFlow();}
function continuePostWorkoutFlow(programId){return postWorkoutSwapQueue.length?showNextPostWorkoutSwapDecision():(maybeShowBlockSuccess(programId)||maybeShowBackupReminder());}
function setComplete(ex,s){var reps=s&&s.reps!==""&&s.reps!=null&&isFinite(Number(s.reps))&&Number(s.reps)>0,weight=s&&s.weight!==""&&s.weight!=null&&isFinite(Number(s.weight))&&Number(s.weight)>=0;return ex.w?!!(reps&&weight):!!reps;}
function firstOpenSet(ex,sets){sets=sets||getSets(ex);for(var i=0;i<sets.length;i++)if(!setComplete(ex,sets[i]))return i;return sets.length;}
function cellComplete(w,dk,ex){var need=setsForExercise(ex,w);var c=S.logs[w+"|"+dk+"|"+ex.id];if(!c||!c.sets||!need)return false;var cnt=0;for(var i=0;i<need;i++){var s=c.sets[i];if(s&&setComplete(ex,s))cnt++;}return cnt===need;}
function isDone(ex){return cellComplete(S.week,S.day,ex);}

function actualMinWeight(ex,w){var c=S.logs[w+"|"+S.day+"|"+ex.id],need=setsForExercise(ex,w),m=Infinity;if(!c||!c.sets||normalizeSwapName(c.swap))return null;for(var i=0;i<need;i++){var s=c.sets[i];if(s&&s.weight!==""){var x=Number(s.weight);if(x<m)m=x;}}return m===Infinity?null:m;}
