// Fertige Übungen klappen nicht sofort zu: erst nach kurzer Ruhezeit oder sobald in einer anderen Übung etwas eingetragen wird.
var doneCollapseTimers={},DONE_COLLAPSE_DELAY=12000;
var cardViewportAnchorState=null,cardViewportAnchorVersion=0;
function cancelDoneCollapse(exid){var t=doneCollapseTimers[exid];if(t){clearTimeout(t);delete doneCollapseTimers[exid];}}
function cancelAllDoneCollapse(){Object.keys(doneCollapseTimers).forEach(cancelDoneCollapse);}
function replaceCardKeepingViewport(card,html){
 var preferredAnchor=arguments[2],following=card&&card.nextElementSibling;while(following&&!(following.matches&&following.matches(".ex")))following=following.nextElementSibling;var anchor=preferredAnchor||(document.activeElement&&document.activeElement.closest?document.activeElement.closest(".ex"):null)||following||card,anchorId=anchor&&anchor.id,top=anchor?anchor.getBoundingClientRect().top:null,root=document.documentElement,body=document.body;
 if(top!=null){if(!cardViewportAnchorState)cardViewportAnchorState={root:root.style.overflowAnchor,body:body.style.overflowAnchor};root.style.overflowAnchor="none";body.style.overflowAnchor="none";}card.outerHTML=html;
 var nextAnchor=anchor===card&&anchorId?document.getElementById(anchorId):anchor;if(nextAnchor&&top!=null&&document.body.contains(nextAnchor)){var delta=nextAnchor.getBoundingClientRect().top-top;if(Math.abs(delta)>.5)window.scrollBy(0,delta);}
 if(top!=null){var version=++cardViewportAnchorVersion,restore=function(){if(version!==cardViewportAnchorVersion)return;var state=cardViewportAnchorState;cardViewportAnchorState=null;if(state){root.style.overflowAnchor=state.root;body.style.overflowAnchor=state.body;}};if(window.requestAnimationFrame)window.requestAnimationFrame(restore);else setTimeout(restore,0);}
}
function collapseDoneCard(ex){
 cancelDoneCollapse(ex.id);
 var card=document.getElementById("card-"+ex.id);
 if(!card||card.classList.contains("excompact"))return;
 if(!active()||!isDone(ex)||expandedDoneExercises[ex.id])return;
 if(card.contains(document.activeElement)){scheduleDoneCollapse(ex);return;}
 replaceCardKeepingViewport(card,exCardHtml(ex));
}
function scheduleDoneCollapse(ex){cancelDoneCollapse(ex.id);doneCollapseTimers[ex.id]=setTimeout(function(){delete doneCollapseTimers[ex.id];collapseDoneCard(ex);},DONE_COLLAPSE_DELAY);}
function collapseDoneExcept(exid){Object.keys(doneCollapseTimers).forEach(function(id){if(id===exid)return;var other=findEx(id);if(other)collapseDoneCard(other);else cancelDoneCollapse(id);});}
function exCardHtml(ex){
 var sets=getSets(ex),wk=PROG().weeks[S.week-1],rr=catReps(ex,wk.phase),tw=targetWeight(ex),last=lastPerf(ex),otherLast=latestOtherDayPerf(ex),done=isDone(ex),swap=currentExerciseSwap(ex),displayName=swap||ex.name,hasEntered=exerciseHasEnteredData(ex);
 if(active()&&done&&!expandedDoneExercises[ex.id])return'<div class="ex done excompact" id="card-'+attr(ex.id)+'"><span class="excompactname">'+esc(displayName)+(swap?'<small>getauscht</small>':'')+'</span><span class="excompactcheck" aria-label="Erledigt">'+icon("check")+'</span><button type="button" class="cardexpand" data-expand-done="'+attr(ex.id)+'" aria-label="'+attr(displayName)+' aufklappen" title="Aufklappen">'+icon("chevron-left")+'</button></div>';
 var h='<div class="ex'+(done?" done":"")+(active()||correctionActive()?"":" locked")+'" id="card-'+attr(ex.id)+'">';
 var collapseBtn='';
 if(!active()&&expandedPreviewRows[ex.id])collapseBtn='<button type="button" class="cardcollapse" data-collapse-prev="'+attr(ex.id)+'" aria-label="Übung einklappen" title="Einklappen">'+icon("chevron-left")+'</button>';
 else if(active()&&done)collapseBtn='<button type="button" class="cardcollapse" data-collapse-done="'+attr(ex.id)+'" aria-label="Übung einklappen" title="Einklappen">'+icon("chevron-left")+'</button>';
 h+='<div class="cardtop"><div class="cardheading"><div class="cardcat '+catColor(ex)+'"><span>'+esc(catLabel(ex))+'</span></div><div class="exhead"><div class="info">';
 h+='<h3 class="exname"><button type="button" class="exnamelink" data-workout-detail="'+attr(ex.id)+'" aria-label="Übungsdetails für '+attr(displayName)+' öffnen">'+esc(displayName)+'</button></h3>'+(swap?'<p class="exswap">Für dieses Training statt '+esc(ex.name)+'</p>':(ex.en?'<p class="exen">'+esc(ex.en)+'</p>':'')+(ex.sub?'<p class="exsub">'+esc(ex.sub)+'</p>':''));
 if(ex.fromWeek>1)h+='<button type="button" class="notebtn" data-timeline="'+attr(ex.id)+'">seit Woche '+ex.fromWeek+'</button>';
 h+='<div class="links"><a href="'+ytUrl(swap?(displayName+" Technik"):(ex.q||(ex.name+" Technik")))+'" target="_blank" rel="noopener noreferrer">'+icon("play")+' Video</a><button type="button" class="notebtn" data-note="'+attr(ex.id)+'" aria-label="Notiz für '+attr(ex.name)+' öffnen">'+icon("edit")+' Notiz</button></div>';
 h+='</div></div></div><div class="cardtools"><button type="button" class="kebab" data-exmenu="'+attr(ex.id)+'" aria-label="Aktionen für '+attr(displayName)+'">'+icon("more")+'</button>'+collapseBtn+'</div></div>';
 if(S.notes[ex.id])h+='<button type="button" class="exnoteline" data-note="'+attr(ex.id)+'" aria-label="Notiz für '+attr(ex.name)+' bearbeiten">'+esc(S.notes[ex.id])+'</button>';
 var progressHint=progressContextHtml(ex,last,done,tw);
 h+='<div class="presc">';
 h+=rr?'<span class="presctarget"><b>'+(isTime(ex)?fmtSecondsRange(rr[0],rr[1]):rr[0]+'–'+rr[1]+' Wdh')+(ex.perSide?' je Seite':'')+'</b>'+progressHint+'</span>':'<span class="presctarget"><b>'+esc(ex.target||"—")+(ex.perSide?' je Seite':'')+'</b>'+progressHint+'</span>';
 var pauseLabel=restLabel(catRest(ex));h+='<span class="dot">·</span><span class="prescpause" aria-label="Pause '+attr(pauseLabel)+'" title="Pause '+attr(pauseLabel)+'">'+icon("timer")+' <b>'+pauseLabel+'</b></span></div>';
 if(ex.w&&!ex.bw&&exerciseUsesDumbbells(displayName))h+='<div class="khnote">Kurzhantel-Übung: Trag das Gewicht einer Hantel ein.</div>';
 if(last){var v=performanceSummary(ex,last.sets);h+='<button class="last" data-hist="'+attr(ex.id)+'" aria-label="Verlauf für '+attr(ex.name)+' öffnen"><span class="l">'+icon("undo")+' Zuletzt (W'+last.week+'):</span><span class="v">'+esc(v)+'</span><span class="histhint">Verlauf <span aria-hidden="true">'+icon("chevron-right")+'</span></span></button>';}
 if(otherLast){var ov=performanceSummary(otherLast.exercise,otherLast.sets),od=otherLast.day,odl=od.wd?od.wd.slice(0,2):(od.title||od.key);h+='<div class="otherlast"><span class="l">Anderer Tag · '+esc(odl)+' (W'+otherLast.week+'):</span> <span class="v">'+esc(ov)+'</span></div>';}
 if(ex.w&&!ex.bw&&tw<=0&&!sets.some(function(s){return Number(s.weight)>0;}))h+='<div class="editnote calibrationhint" id="calib-'+attr(ex.id)+'"><button type="button" class="calibrationmore" data-calibration-guide="1">Startgewicht bestimmen</button></div>';
 var firstOpen=firstOpenSet(ex,sets);
 var hasData=sets.some(function(s){return s.reps!==""||s.weight!=="";});
 var canHoldNow=isTime(ex)&&canStartHold(ex,sets,firstOpen);
 h+='<div class="srows">';if(ex.w||isTime(ex))h+=setGridHeadHtml(ex,firstOpen,sets,canHoldNow);for(var i=0;i<sets.length;i++){var rdis;if(active()){rdis=setInputLocked(ex,i,sets,firstOpen)?" disabled":"";}else if(correctionActive()){rdis="";}else{rdis=(sets[i].reps!==""||sets[i].weight!=="")?"":" disabled";}h+=setRowHtml(ex,i,sets[i],rr,tw,rdis,firstOpen,canHoldNow);}h+='</div>';
 h+='<div id="rec-'+attr(ex.id)+'">'+recHtml(ex)+'</div>';
 return h+'</div>';
}
var expandedPreviewRows={};
function exRowHtml(ex,ei){
 var sets=getSets(ex),wk=PROG().weeks[S.week-1],rr=catReps(ex,wk.phase),tw=targetWeight(ex),done=isDone(ex),swap=currentExerciseSwap(ex),displayName=swap||ex.name;
 var summary=sets.length+' \u00d7 '+(rr?(isTime(ex)?fmtSecondsRange(rr[0],rr[1]):rr[0]+'\u2013'+rr[1]):esc(ex.target||'\u2014'))+(ex.perSide?' je Seite':'');
 if(ex.w)summary+=' \u00b7 '+(tw>0?tw+' kg':(ex.bw?'K\u00f6rpergew.':'\u2014 kg'));
 summary+=' \u00b7 '+fmtTime(catRest(ex));
 return '<button class="exrowd '+catColor(ex)+'" id="card-'+attr(ex.id)+'" data-expand-prev="'+attr(ex.id)+'" aria-label="'+attr(displayName)+' \u00f6ffnen"><span class="rowbar"></span><span class="rowmain"><span class="rowcat">'+esc(catLabel(ex))+'</span><span class="rowname">'+esc(displayName)+(swap?' <small>(getauscht)</small>':'')+'</span><span class="rowpresc">'+summary+'</span></span><span class="rowidx'+(done?' done':'')+'">'+(done?icon("check"):('0'+(ei+1)).slice(-2))+'</span></button>';
}
function renderView(){
 document.body.classList.toggle("training",active());
 var P=PROG(),wk=P.weeks[S.week-1],day=dayByKey(S.day),exercises=dayExercisesFor(day,S.week),h="";
 var nmMain=P.name,nmSub=artSubtitleText(P.name,P.art);if(!P.art){var pm=P.name.match(/^(.+?)\s*\((.+)\)\s*$/);if(pm){nmMain=pm[1];nmSub=pm[2];}}
 if(active()){
  var lw=S.workout;
  h+='<div class="hdr"><div class="topright"><span class="brand">Satzkraft</span><button class="linkbtn" id="libbtn">Programme</button><button class="linkbtn" id="pdf">Auswertung</button><button class="iconbtn" id="settingsbtn" aria-label="Einstellungen" title="Einstellungen">'+icon("gear")+'</button></div><div class="heroeyebrow">Laufendes Training</div><h1 class="ptitle">Woche '+S.week+' <span class="pnsub">/ '+P.weeks.length+'</span></h1><div class="chiprow"><span class="chip">'+esc(day.wd||day.key)+(day.title?' · '+esc(day.title):'')+'</span></div></div>';
  h+='<div class="livecard'+(lw.running?'':' paused')+'"><div class="livemain"><div class="livelabel">'+(lw.running?'Training läuft':'Zeit pausiert')+'</div><div class="livetime" id="liveWtElapsed">'+fmtTime(elapsedSec())+'</div>'+'</div><div class="liveactions">'+(lw.running?'<button class="bbtn pause holdpause" id="pausew" aria-label="Pause – 2 Sekunden gedrückt halten" aria-pressed="false" title="Zum Pausieren 2 Sekunden gedrückt halten"><span>'+icon("pause")+' Pause</span></button>':'<button class="bbtn go" id="resumew">'+icon("play")+' Weiter</button>')+'<button class="bbtn stop" id="stopw">'+icon("stop")+' Ende</button></div></div>';
 }else if(correctionActive()){
  var ch=S.history.filter(function(e){return e.week===S.week&&e.day===S.day;}),ce=ch.length?ch[ch.length-1]:null;
  h+='<div class="hdr"><div class="topright"><span class="brand">Satzkraft</span><button class="linkbtn" id="libbtn">Programme</button><button class="linkbtn" id="pdf">Auswertung</button><button class="iconbtn" id="settingsbtn" aria-label="Einstellungen" title="Einstellungen">'+icon("gear")+'</button></div><div class="heroeyebrow">Workout bearbeiten</div><h1 class="ptitle">Woche '+S.week+' <span class="pnsub">/ '+P.weeks.length+'</span></h1><div class="chiprow"><span class="chip">'+esc(day.wd||day.key)+(day.title?' · '+esc(day.title):'')+'</span></div></div>';
  h+='<div class="livecard"><div class="livemain"><div class="livelabel">Trainiert am</div><div class="livetime">'+(ce?dDate(ce.start):'—')+'</div>'+(ce?'<div class="liveinfo">'+((ce.segments||1)>1?'Dauer '+fmtTime(ce.dur)+' · '+ce.segments+' Abschnitte':dClock(ce.start)+'–'+dClock(ce.end)+' Uhr · Dauer '+fmtTime(ce.dur))+'</div>':'')+'</div></div>';
 }else{
  h+='<div class="hdr"><div class="topright"><span class="brand">Satzkraft</span><button class="linkbtn" id="libbtn">Programme</button><button class="linkbtn" id="pdf">Auswertung</button><button class="iconbtn" id="settingsbtn" aria-label="Einstellungen" title="Einstellungen">'+icon("gear")+'</button></div><div class="heroeyebrow">Aktiver Block</div><h1 class="ptitle">'+esc(nmMain)+(nmSub?' <span class="pnsub2">'+esc(nmSub)+'</span>':'')+'</h1><div class="chiprow"><span class="chip">'+P.days.length+' Tage</span><span class="chip">'+P.weeks.length+' Wochen</span>'+(P.bereich?'<span class="chip">'+esc(P.bereich)+'</span>':'')+'</div></div>';
  var pad2=function(n){return ('0'+n).slice(-2);};
  h+='<div class="blockcard"><div class="blocktop"><div class="bigwk">'+pad2(wk.n)+'<span>/'+pad2(P.weeks.length)+'</span></div><div class="blockright"><span class="phasepill'+(wk.phase==="deload"?" deload":"")+'">'+esc(wk.label)+'</span>'+(wk.rir?'<span class="blockrir">RIR '+esc(wk.rir)+' \u00b7 Woche '+wk.n+'</span>':'')+'</div></div>';
  h+='<div class="rail"><button class="railnav" id="prev" aria-label="Vorherige Woche"'+(S.week===1?" disabled":"")+'>'+icon("chevron-left")+'</button>';
  P.weeks.forEach(function(w,idx){var f=weekFrac(idx+1),full=f>=0.999,cur=(idx+1)===S.week,label='Woche '+(idx+1)+' von '+P.weeks.length+': '+(w.label||w.phase)+', '+Math.round(f*100)+' % abgeschlossen';h+='<button class="railslot'+(w.phase==="deload"?" deload":"")+(cur?" cur":"")+'" data-week="'+(idx+1)+'" aria-label="'+attr(label)+'"'+(cur?' aria-current="step"':'')+'><span class="railbar"><span class="railfill'+(full?" full":"")+'" id="wbar-'+(idx+1)+'" style="width:'+(f*100)+'%"></span></span></button>';});
  h+='<button class="railnav" id="next" aria-label="N\u00e4chste Woche"'+(S.week===P.weeks.length?" disabled":"")+'>'+icon("chevron-right")+'</button></div>';
  if(wk.note)h+='<p class="blocknote">'+esc(wk.note)+'</p>';h+='</div>';
  var slots=weekLayout();
  h+='<div class="wstrip" role="group" aria-label="Trainingstag auswählen">';for(var wi=0;wi<7;wi++){var wd=slots[wi];if(wd){var stt=dayStatus(wd),sel=(S.day===wd.key),dayTitle=(wd.wd||wd.key)+(wd.title?" · "+wd.title:"");h+='<button class="wday train'+(sel?" active":"")+(stt.complete?" done":"")+'" data-day="'+attr(wd.key)+'" title="'+attr(dayTitle)+'" aria-pressed="'+sel+'"><span class="wdn">'+WD_ABBR[wi]+'</span><span class="wstat">'+(stt.complete?icon("check"):"•")+'</span></button>';}else{h+='<div class="wday rest"><span class="wdn">'+WD_ABBR[wi]+'</span><span class="wstat"></span></div>';}}h+='</div>';
 }
 var dd=exercises.filter(isDone).length;
 var kompaktKopf=active()||correctionActive();
 h+='<div class="todayhdr'+(kompaktKopf?' active':'')+'">'+(kompaktKopf?'':'<div><div class="todayeyebrow">'+esc(day.wd||day.key)+'</div><h2>'+esc(day.title||day.wd||day.key)+'</h2></div>')+'<span class="todaycount" id="dayprog"><b>'+dd+'</b>/'+exercises.length+'</span></div>';
 if(day.wu&&day.wu.length){var wus=day.wu.reduce(function(a,x){return a+x.sec;},0);h+='<button class="smallbtn" id="wubtn" style="width:100%;margin:0 0 10px">'+icon("play")+' Warm-up starten \u00b7 '+day.wu.length+' \u00dcbungen \u00b7 ~'+Math.round(wus/60)+' min</button>';}
 exercises.forEach(function(ex,ei){h+=(!active()&&!correctionActive()&&!expandedPreviewRows[ex.id])?exRowHtml(ex,ei):exCardHtml(ex);});
 if(day.cd&&day.cd.length){var cds=day.cd.reduce(function(a,x){return a+x.sec;},0);h+='<button class="smallbtn" id="cdbtn" style="width:100%;margin:4px 0 10px">'+icon("play")+' Cool-down starten \u00b7 '+day.cd.length+' \u00dcbungen \u00b7 ~'+Math.round(cds/60)+' min</button>';}
 if(!active())h+='<div class="legend"><button type="button" class="legendversion versionfoot appversion" data-version-info="1">Satzkraft v'+esc(APP_VERSION)+'</button></div>';
 document.getElementById("app").innerHTML='<div class="wrap">'+h+'</div>';
}

function updateProgressUI(){
 var dp=document.getElementById("dayprog"),exercises=dayExercisesFor(dayByKey(S.day),S.week);if(dp){var dd=exercises.filter(isDone).length;dp.innerHTML="<b>"+dd+"</b>/"+exercises.length;}
 PROG().weeks.forEach(function(w,idx){var f=weekFrac(idx+1),fill=document.getElementById("wbar-"+(idx+1));if(fill){fill.style.width=(f*100)+"%";if(f>=0.999)fill.classList.add("full");else fill.classList.remove("full");}});
}
function updateTargetWeightUi(ex){
 if(!ex||!ex.w)return;
 var tw=targetWeight(ex),sets=getSets(ex);for(var i=0;i<sets.length;i++){var input=document.getElementById("wt-"+ex.id+"-"+i);if(input&&input.value==="")input.placeholder=tw>0?tw:"";}
 var hint=document.getElementById("proghint-"+ex.id);if(hint)hint.outerHTML=progressContextHtml(ex,lastPerf(ex),isDone(ex),tw);
}
function updateCard(ex){
 var done=isDone(ex);
 var card=document.getElementById("card-"+ex.id);
 if(card&&active()&&done&&!expandedDoneExercises[ex.id]&&!card.classList.contains("excompact"))scheduleDoneCollapse(ex);
 if(!done)cancelDoneCollapse(ex.id);
 if(card)card.classList.toggle("done",done);
 var collapse=card&&card.querySelector("[data-collapse-done]");if(collapse){collapse.classList.toggle("ready",active()&&done);collapse.disabled=!active()||!done;collapse.setAttribute("aria-hidden",active()&&done?"false":"true");}
 var calibration=document.getElementById("calib-"+ex.id);if(calibration&&getSets(ex).some(function(s){return Number(s.weight)>0;}))calibration.remove();
 var chk=document.getElementById("chk-"+ex.id);if(chk)chk.classList.toggle("done",done);
 var hint=document.getElementById("proghint-"+ex.id);if(hint)hint.outerHTML=progressContextHtml(ex,lastPerf(ex),done,targetWeight(ex));
 var rec=document.getElementById("rec-"+ex.id);if(rec)rec.innerHTML=recHtml(ex);
}
function canStartRest(ex,sets,firstOpen,allowAfterLast){
 if(!active())return false;
 sets=sets||getSets(ex);if(firstOpen==null)firstOpen=firstOpenSet(ex,sets);
 if(firstOpen===0||firstOpen>sets.length||firstOpen===sets.length&&!allowAfterLast)return false;
 if(restPhase&&restExId!==ex.id)return false;
 if(restPhase)return restPhase==="set"&&firstOpen>restNextSet;
 return true;
}
var AUTO_REST_DELAY=0,autoRestTimers={};
function cancelAutoRest(exid){var timer=autoRestTimers[exid];if(timer){clearTimeout(timer);delete autoRestTimers[exid];}}
function cancelAllAutoRest(){Object.keys(autoRestTimers).forEach(cancelAutoRest);}
function scheduleAutoRest(ex,setIndex,wasComplete,isComplete){
 var pending=autoRestTimers[ex.id];
 if(!isComplete){cancelAutoRest(ex.id);return;}
 if(wasComplete&&!pending)return;
 cancelAutoRest(ex.id);
 autoRestTimers[ex.id]=setTimeout(function(){
  delete autoRestTimers[ex.id];
  if(!active()||(restPhase&&!(restPhase==="set"&&restExId===ex.id)))return;
  var current=getSets(ex),firstOpen=firstOpenSet(ex,current);
  if(!current[setIndex]||!setComplete(ex,current[setIndex])||!canStartRest(ex,current,firstOpen,true))return;
  startRest(catRest(ex),ex.id,true);
 },AUTO_REST_DELAY);
}
function canStartHold(ex,sets,firstOpen){
 if(!active()||!isTime(ex))return false;sets=sets||getSets(ex);if(firstOpen==null)firstOpen=firstOpenSet(ex,sets);if(firstOpen>=sets.length)return false;
 if(!restPhase)return true;
 return restPhase==="set"&&restExId===ex.id&&restNextSet===firstOpen;
}
function updatePauseButton(ex){
 var sets=getSets(ex),firstOpen=firstOpenSet(ex,sets),btn=document.getElementById("pause-"+ex.id);
 if(btn)btn.disabled=!!restPhase||!canStartRest(ex,sets,firstOpen);
 if(!isTime(ex))return;
 var canHold=canStartHold(ex,sets,firstOpen);
 document.querySelectorAll('.swbtn[data-hold-row="'+ex.id+'"]').forEach(function(sw){
  var i=+sw.dataset.i,running=restPhase==="hold"&&restExId===ex.id&&restNextSet===i;
  sw.disabled=!(running||(canHold&&i===firstOpen));
  sw.classList.toggle("running",running);
  sw.innerHTML=icon(running?"stop":"play");
  sw.title=running?"Stoppen & eintragen":"Stoppuhr starten";
  sw.setAttribute("aria-label",running?"Stoppuhr stoppen und Zeit eintragen":ex.name+" Satz "+(i+1)+": Zeit mit Stoppuhr messen");
 });
}
function setInputLocked(ex,index,sets,firstOpen){
 sets=sets||getSets(ex);if(firstOpen==null)firstOpen=firstOpenSet(ex,sets);var lock=!active()||index>firstOpen;
 if(restPhase){
  if(restExId!==ex.id)lock=true;
  else if(restPhase==="countdown")lock=lock||index>=restNextSet;
  else if(restPhase==="set")lock=lock||index>restNextSet;
  else if(restPhase==="hold")lock=true;
 }
 return lock;
}
function applyLocks(ex){
 var sets=getSets(ex),firstOpen=firstOpenSet(ex,sets);
 for(var j=0;j<sets.length;j++){
  var lock=setInputLocked(ex,j,sets,firstOpen);
  var rep=document.getElementById("rep-"+ex.id+"-"+j),wt=document.getElementById("wt-"+ex.id+"-"+j);
  if(rep)rep.disabled=lock;
  if(wt)wt.disabled=lock;
  document.querySelectorAll('.stp[data-ex="'+ex.id+'"][data-i="'+j+'"]').forEach(function(btn){
   var ref=btn.dataset.step==="wt"?wt:rep;btn.disabled=ref?ref.disabled:lock;
  });
 }
 updatePauseButton(ex);
}
function applyAllLocks(){dayExercisesFor(dayByKey(S.day),S.week).forEach(function(ex){applyLocks(ex);});}
function requestPersistentStorageOnce(){
 try{
  if(localWriteBlocked())return;
  if(localStorage.getItem(PERSIST_REQUEST_KEY))return;
  localStorage.setItem(PERSIST_REQUEST_KEY,"requested");
  if(navigator.storage&&typeof navigator.storage.persist==="function")navigator.storage.persist().then(function(granted){if(localWriteBlocked())return;try{localStorage.setItem(PERSIST_REQUEST_KEY,granted?"granted":"denied");}catch(e){}}).catch(function(){});
 }catch(e){}
}
function onSetInput(t){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 var kind=t&&t.dataset?t.dataset.setKind:"",exid=t&&t.dataset?t.dataset.ex:"",i=t&&t.dataset?Number(t.dataset.i):NaN,ex=findEx(exid),isW=(kind==="wt");
 if((kind!=="rep"&&kind!=="wt")||!Number.isInteger(i)||i<0||!ex)return;
 var v=isW?sanDec(t.value):timeInputSeconds(t,ex);
 if(!isW&&isTime(ex)){var clockShown=clockTypedFormat(t.value);if(t.value!==clockShown)t.value=clockShown;}
 else if(v!==t.value)t.value=v;
 if(typeof correctionActive==="function"&&correctionActive()){
  var corrected=getSets(ex);corrected[i]=Object.assign({},corrected[i]);corrected[i][isW?"weight":"reps"]=v;writeSets(ex,corrected);save();if(typeof updateTargetWeightUi==="function")updateTargetWeightUi(ex);
  var correctedRow=document.getElementById("row-"+exid+"-"+i);if(correctedRow)correctedRow.classList.toggle("full",setComplete(ex,corrected[i]));updateCard(ex);updateProgressUI();return;
 }
 if(!active())return;
 var sets=getSets(ex);if(setInputLocked(ex,i,sets,firstOpenSet(ex,sets))){var stored=sets[i]&&sets[i][isW?"weight":"reps"]||"";if(!isW&&isTime(ex))setTimeInputValue(t,ex,stored);else t.value=stored;applyLocks(ex);return;}
 collapseDoneExcept(exid);
 var wasComplete=setComplete(ex,sets[i]);sets[i]=Object.assign({},sets[i]);sets[i][isW?"weight":"reps"]=v;
 if(!isW&&ex.w&&v!==""&&(sets[i].weight==null||sets[i].weight==="")){var previousWeight=previousSetValue(sets,i,"weight"),planned=round(targetWeight(ex)),fillWeight=previousWeight!==""?round(Number(previousWeight)):planned,canFillWeight=previousWeight!==""||fillWeight>0||ex.bw;if(canFillWeight){sets[i].weight=String(Math.max(0,fillWeight));var autoWeight=document.getElementById("wt-"+exid+"-"+i);if(autoWeight)autoWeight.value=String(Math.max(0,fillWeight));}}
 if(isW&&v!==""&&(sets[i].reps==null||sets[i].reps==="")){var previousReps=previousSetValue(sets,i,"reps"),autoRange=catReps(ex,PROG().weeks[S.week-1].phase),autoValue=previousReps!==""?previousReps:(autoRange?String(autoRange[1]):"");if(autoValue!==""){sets[i].reps=autoValue;var autoReps=document.getElementById("rep-"+exid+"-"+i);if(autoReps)setTimeInputValue(autoReps,ex,autoValue);}}
 var nowComplete=setComplete(ex,sets[i]);scheduleAutoRest(ex,i,wasComplete,nowComplete);
 if(!wasComplete&&nowComplete&&typeof requestPersistentStorageOnce==="function")requestPersistentStorageOnce();
 writeSets(ex,sets);save();if(typeof updateTargetWeightUi==="function")updateTargetWeightUi(ex);
 var row=document.getElementById("row-"+exid+"-"+i);if(row)row.classList.toggle("full",setComplete(ex,sets[i]));
 var focusedSet=restPhase==="set"&&restExId===exid&&i===restNextSet;
 updateCard(ex);applyLocks(ex);
 if(focusedSet){if(firstOpenSet(ex,sets)>=sets.length)stopRest();else renderBar();}
 updateProgressUI();maybeAskDone();
}
function previousSetValue(sets,index,field){for(var j=index-1;j>=0;j--){var value=sets[j]&&sets[j][field];if(value!=null&&value!=="")return String(value);}return"";}
function onSetChange(t){
 if(active()||(typeof correctionActive==="function"&&correctionActive()))return;
 var kind=t&&t.dataset?t.dataset.setKind:"",exid=t&&t.dataset?t.dataset.ex:"",i=t&&t.dataset?Number(t.dataset.i):NaN,ex=findEx(exid),isW=(kind==="wt");
 if((kind!=="rep"&&kind!=="wt")||!Number.isInteger(i)||i<0||!ex)return;
 var sets=getSets(ex),field=isW?"weight":"reps",stored=(sets[i]?sets[i][field]:"")||"";
 var nv=isW?sanDec(t.value):timeInputSeconds(t,ex);
 if(nv===stored){if(!isW&&isTime(ex))setTimeInputValue(t,ex,stored);else t.value=stored;return;}
 var unit=isW?"kg":(isTime(ex)?"min":"Wdh"),oldShown=stored,newShown=nv;
 if(!isW&&isTime(ex)){oldShown=stored===""?"":fmtClockInput(stored);newShown=nv===""?"":fmtClockInput(nv);}
 var msg="<b>"+esc(currentExerciseSwap(ex)||ex.name)+"</b><br>Satz "+(i+1)+": "+(oldShown===""?"—":esc(oldShown))+" → <b>"+(newShown===""?"—":esc(newShown))+"</b> "+unit+"<br><br>"+CORRECTION_EFFECT_COPY;
 showModal("Wert übernehmen?",msg,[
  {label:"Übernehmen",cls:"primary",action:function(){var ss=getSets(ex);ss[i]=Object.assign({},ss[i]);ss[i][field]=nv;writeSets(ex,ss);save();renderView();}},
  {label:"Verwerfen",action:function(){renderView();}}
 ]);
}
function timeFieldExercise(t){var kind=t&&t.dataset?t.dataset.setKind:"",ex=t&&t.dataset?findEx(t.dataset.ex):null;return kind==="rep"&&ex&&isTime(ex)?ex:null;}
function timeDraftDigits(raw){var digits=String(raw==null?"":raw).replace(/[^0-9]/g,"");if(!digits)return"";digits=String(Number(digits)||0);return digits==="0"?"":digits.slice(-4);}
function placeTimeCaret(t){if(!t)return;var end=String(t.value||"").length;try{t.setSelectionRange(end,end);}catch(e){}}
function applyTimeDraftEdit(t,added,removeLast){if(!timeFieldExercise(t))return false;var digits=t.dataset.clockDigits!=null?t.dataset.clockDigits:timeDraftDigits(t.value);if(removeLast)digits=digits.slice(0,-1);else{added=String(added==null?"":added).replace(/[^0-9]/g,"");if(!added)return false;digits=(digits+added).slice(-4);}t.dataset.clockDigits=digits;t.dataset.timeDraft="1";t.value=digits?clockTypedFormat(digits):"";placeTimeCaret(t);return true;}
function onTimeBeforeInput(e,t){if(!timeFieldExercise(t))return false;var type=String(e.inputType||"");if(type.indexOf("insert")===0){var transfer=e.dataTransfer||e.clipboardData,added=e.data;if((added==null||added==="")&&transfer&&typeof transfer.getData==="function")added=transfer.getData("text");if(!applyTimeDraftEdit(t,added,false))return false;}else if(type.indexOf("delete")===0){applyTimeDraftEdit(t,"",true);}else return false;e.preventDefault();return true;}
function onTimeKeyDown(e,t){if(!timeFieldExercise(t)||e.isComposing||e.ctrlKey||e.metaKey||e.altKey)return false;if(/^\d$/.test(e.key)){e.preventDefault();return applyTimeDraftEdit(t,e.key,false);}if(e.key==="Backspace"||e.key==="Delete"){e.preventDefault();return applyTimeDraftEdit(t,"",true);}if(e.key==="Enter"){e.preventDefault();onSetCommit(t);return true;}return false;}
function onTimePaste(e,t){if(!timeFieldExercise(t))return false;var transfer=e.clipboardData||(typeof window!=="undefined"&&window.clipboardData),text=transfer&&typeof transfer.getData==="function"?transfer.getData("text"):"";if(!String(text).match(/\d/))return false;e.preventDefault();return applyTimeDraftEdit(t,text,false);}
function onSetDraftInput(t){if(!timeFieldExercise(t))return false;var draft=clockTypedFormat(clockEditValue(t.value));if(t.value!==draft)t.value=draft;t.dataset.clockDigits=timeDraftDigits(draft);t.dataset.timeDraft="1";placeTimeCaret(t);return true;}
function onSetCommit(t){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;var ex=timeFieldExercise(t);if(ex){delete t.dataset.clockDigits;delete t.dataset.timeDraft;setTimeInputValue(t,ex,timeInputSeconds(t,ex));if(active()||(typeof correctionActive==="function"&&correctionActive()))onSetInput(t);else onSetChange(t);return;}onSetChange(t);}
function onStep(b){
 var kind=b.dataset.step,exid=b.dataset.ex,i=+b.dataset.i,d=+b.dataset.d,ex=findEx(exid);
 if(!ex)return;
 var input=document.getElementById((kind==="wt"?"wt-":"rep-")+exid+"-"+i);
 if(!input||input.disabled)return;
 var isW=kind==="wt",timeStep=!isW&&isTime(ex),step=isW?(ex.inc||2.5):(timeStep?5:1),v;
 if(input.value===""){
  var copied=d>0?previousSetValue(getSets(ex),i,isW?"weight":"reps"):"";
  if(copied!==""){v=Number(copied);}
  else if(isW){v=targetWeight(ex);}
  else{var wk=PROG().weeks[S.week-1],rr=catReps(ex,wk.phase);v=rr?rr[1]:(d>0?step:0);}
  v=Number(v)||0;
 }else{v=Number(timeStep?(timeInputSeconds(input,ex)||0):input.value)+d*step;}
 if(v<0)v=0;
 if(isW&&v>SET_WEIGHT_MAX)v=SET_WEIGHT_MAX;
 if(!isW&&v>(timeStep?SET_TIME_MAX_SECONDS:SET_REP_MAX))v=timeStep?SET_TIME_MAX_SECONDS:SET_REP_MAX;
 if(timeStep)setTimeInputValue(input,ex,Math.round(v));
 else input.value=String(isW?round(v):Math.round(v));
 if(active()||correctionActive())onSetInput(input);else onSetChange(input);
}
