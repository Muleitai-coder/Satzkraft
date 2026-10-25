// ---------- Auswertung / PDF ----------
function reportFinite(value){var number=Number(value);return isFinite(number)&&number>=0?number:null;}
function historicalExercise(ex,cell){
 var snapshot=cell&&(cell.performedExercise||cell.pendingPerformedExercise);if(!snapshot)return ex;
 var result={};for(var key in ex)result[key]=ex[key];
 result.name=snapshot.name;result.unit=snapshot.unit;result.w=snapshot.weighted;result.bw=snapshot.bodyweight;result.perSide=snapshot.perSide;result.weightConvention=snapshot.weightConvention;
 if(snapshot.exerciseId)result.exerciseId=snapshot.exerciseId;else delete result.exerciseId;
 return result;
}
function reportTrackingKey(ex,cell){
 var type=ex.unit==="seconds"?(ex.w?"weighted_seconds":"seconds"):(ex.w?"weight":"reps");
 if(!cell||!cell.performedExercise)return (typeof canonicalExerciseName==="function"?canonicalExerciseName(ex.name):String(ex.name))+"|"+type;
 return "confirmed|"+(ex.exerciseId||ex.name)+"|"+type+"|"+!!ex.bw+"|"+!!ex.perSide+"|"+(ex.weightConvention||"unspecified");
}
function weightConventionText(value){return value==="per_dumbbell"?"pro Hantel":value==="device"?"Geräteanzeige":value==="total"?"Gesamtgewicht":"Gewichtskonvention offen";}
function historicalSetText(ex,set){
 if(ex.unit==="seconds")return reportTimedSetText(ex,set);
 return String(set.reps)+(ex.w?" × "+(set.weight===""||set.weight==null?"Gewicht fehlt":String(set.weight)+" kg"):" Wdh")+(ex.perSide?" · je Seite":"")+(ex.w&&ex.weightConvention&&ex.weightConvention!=="unspecified"?" · "+weightConventionText(ex.weightConvention):"");
}
// Der Art-Untertitel entfällt, wenn der Programmname das Wort bereits enthält (verhindert Dopplungen wie „… Fortgeschritten Fortgeschritten“).
function artSubtitleText(name,art){if(typeof art!=="string"||!art.trim())return"";art=art.trim();return String(name||"").toLowerCase().indexOf(art.toLowerCase())>=0?"":art;}
function artSubtitleHtml(name,art){var sub=artSubtitleText(name,art);return sub?' <span class="pnsub2">'+esc(sub)+'</span>':"";}
function reportSetHasData(set){return !!(set&&set.reps!==""&&set.reps!=null&&reportFinite(set.reps)!=null);}
function reportEstimate1RM(weight,reps){weight=reportFinite(weight);reps=reportFinite(reps);if(weight==null||reps==null||weight<=0||reps<=0)return null;return Math.round((weight*(1+Math.min(reps,30)/30))*2)/2;}
function reportTimedSetText(ex,set){
 var text=fmtSeconds(set.reps);
 if(ex.w){var weight=set.weight!==""&&set.weight!=null?reportFinite(set.weight):null;text+=" · "+(weight==null?"Gewicht fehlt":reportNumber(weight)+" kg");}
 return text+(ex.perSide?" · je Seite":"");
}
function reportWeightedTimeSessionText(session){
 return (session.sets||[]).map(function(set){return reportTimedSetText({w:true,perSide:session.perSide},set);}).join(" / ");
}
function buildReportData(program,logs,history){
 program=program&&typeof program==="object"?program:{weeks:[],days:[]};logs=logs&&typeof logs==="object"?logs:{};history=Array.isArray(history)?history:[];
 var weeks=program.weeks||[],days=program.days||[],roundCount=weeks.length,validDays={},completeKeys={},totalDuration=0,totalSets=0,totalVolume=0;
 days.forEach(function(day){validDays[String(day.key)]=day;});
 var sessions=history.filter(function(entry){return entry&&reportFinite(entry.start)!=null;}).map(function(entry){var copy={};for(var k in entry)copy[k]=entry[k];copy.dur=reportFinite(entry.dur)||0;copy.week=Math.round(reportFinite(entry.week)||0);copy.day=String(entry.day==null?"":entry.day);copy.complete=entry.complete===true;totalDuration+=copy.dur;if(copy.complete&&copy.week>=1&&copy.week<=Math.max(roundCount,1)&&validDays[copy.day])completeKeys[copy.week+"|"+copy.day]=true;return copy;}).sort(function(a,b){return Number(b.start)-Number(a.start);});
 var weekly=[];for(var week=1;week<=roundCount;week++){var done=0;days.forEach(function(day){if(completeKeys[week+"|"+day.key])done++;});weekly.push({week:week,completed:done,total:days.length,pct:days.length?Math.round(done/days.length*100):0});}
 var groups=Object.create(null),exercises=[];
 for(var w=1;w<=roundCount;w++)days.forEach(function(day){(day.ex||[]).forEach(function(position){
  if(typeof exerciseValidForWeek==="function"?!exerciseValidForWeek(position,w):w<(position.fromWeek||1)||w>(position.untilWeek||Infinity))return;
  var cell=logs[w+"|"+day.key+"|"+position.id];if(!cell||!Array.isArray(cell.sets))return;
  var ex=historicalExercise(position,cell),swapped=!!(cell.swap&&cell.swap.trim()),type=ex.unit==="seconds"?(ex.w?"weighted_seconds":"seconds"):(ex.w?"weight":"reps"),key=reportTrackingKey(ex,cell),metric=groups[key],unitMetric=null,unitVolume=0,unitSets=0,timedSets=[];
  cell.sets.forEach(function(set){
   if(!reportSetHasData(set))return;var reps=reportFinite(set.reps);totalSets++;
   if(type==="weighted_seconds"){if(!swapped)timedSets.push({reps:reps,weight:set.weight!==""&&set.weight!=null?reportFinite(set.weight):null});}
   else if(ex.w){var weight=set.weight!==""&&set.weight!=null?reportFinite(set.weight):null;if(weight!=null&&weight>0){var volume=reps*weight;totalVolume+=volume;if(!swapped){unitVolume+=volume;var estimate=reportEstimate1RM(weight,reps);if(estimate!=null&&(unitMetric==null||estimate>unitMetric))unitMetric=estimate;}}}
   else if(!swapped&&(unitMetric==null||reps>unitMetric))unitMetric=reps;
   if(!swapped)unitSets++;
  });
  if(!unitSets)return;
  if(!metric){metric={id:position.id,name:ex.name||"Unbenannte Übung",trackingKey:key,confirmed:!!cell.performedExercise,fromWeek:position.fromWeek||1,untilWeek:position.untilWeek||roundCount,totalWeeks:roundCount,dayKey:day.key,dayLabel:(day.wd||day.key)+(day.title?" · "+day.title:""),type:type,totalSets:0,volume:0,points:[],performances:[],first:null,latest:null,best:null,bestWeek:null,delta:null,lastWeek:null,weightConvention:ex.weightConvention||"unspecified"};groups[key]=metric;exercises.push(metric);}
  metric.totalSets+=unitSets;metric.volume+=unitVolume;metric.fromWeek=Math.min(metric.fromWeek,position.fromWeek||1);metric.untilWeek=Math.max(metric.untilWeek,position.untilWeek||roundCount);
  if(timedSets.length)metric.performances.push({week:w,dayKey:day.key,dayLabel:day.wd||day.key,perSide:ex.perSide===true,weightConvention:ex.weightConvention,sets:timedSets});
  if(unitMetric!=null&&!(ex.w&&weeks[w-1]&&weeks[w-1].phase==="deload"))metric.points.push({week:w,value:unitMetric,sets:unitSets,volume:unitVolume});
 });});
 exercises.forEach(function(metric){var points=metric.points;metric.first=points.length?points[0].value:null;metric.firstWeek=points.length?points[0].week:null;metric.latest=points.length?points[points.length-1].value:null;metric.lastWeek=points.length?points[points.length-1].week:null;points.forEach(function(point){if(metric.best==null||point.value>metric.best){metric.best=point.value;metric.bestWeek=point.week;}});metric.delta=metric.first!=null&&metric.latest!=null?metric.latest-metric.first:null;});
 var completedSessions=Object.keys(completeKeys).length,totalPlanned=weeks.length*days.length;
 return{sessions:sessions,completedSessions:completedSessions,totalPlanned:totalPlanned,completionPct:totalPlanned?Math.min(100,Math.round(completedSessions/totalPlanned*100)):0,totalDuration:totalDuration,totalSets:totalSets,totalVolume:totalVolume,weekly:weekly,exercises:exercises};
}
function topBlockImprovements(data){return(data.exercises||[]).filter(function(metric){return metric.type!=="weighted_seconds"&&metric.delta>0&&metric.first!=null;}).map(function(metric){return{metric:metric,score:metric.delta/Math.max(Math.abs(metric.first),1)};}).sort(function(a,b){return b.score-a.score;}).slice(0,3).map(function(item){return item.metric;});}
function maybeShowBlockSuccess(programId){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 var program=S.programs[programId],store=S.store[programId];if(!program||!store||store.blockCelebrated===true||!programBlockComplete(program,store.logs,store.history,store.removedEx))return false;store.blockCelebrated=true;if(programId===S.active)S.blockCelebrated=true;if(flushSave()===false){store.blockCelebrated=false;if(programId===S.active)S.blockCelebrated=false;return false;}
 var data=buildReportData(program,store.logs,store.history),improvements=topBlockImprovements(data),list='<p><b>Größte Verbesserungen</b></p>'+(improvements.length?'<ul>'+improvements.map(function(metric){return'<li><b>'+esc(metric.name)+'</b>: +'+esc(metric.type==="seconds"?fmtSeconds(metric.delta):reportNumber(metric.delta)+" "+reportMetricUnit(metric.type))+'</li>';}).join("")+'</ul>':'<p class="muted">Noch kein Wochenvergleich – deine ersten Vergleichswerte sind für den nächsten Block gespeichert.</p>'),msg='<p><b>Glückwunsch – du hast „'+esc(program.name)+'“ abgeschlossen.</b></p><p>'+data.completedSessions+' Einheiten · '+reportDuration(data.totalDuration)+' dokumentierte Trainingszeit</p>'+list,actions=[{label:"Folgeblock starten",cls:"primary",action:function(){createFollowupBlock(programId);}},{label:"Auswertung ansehen",action:function(){openReport(programId);}}];
 actions.push({label:"Später",action:null});showModal("Trainingsblock geschafft 🎉",msg,actions);return true;
}
function reportNumber(value,digits){if(value==null||!isFinite(value))return"–";return Number(value).toLocaleString("de-DE",{minimumFractionDigits:0,maximumFractionDigits:digits==null?1:digits});}
function reportDuration(seconds){seconds=Math.max(0,Math.round(Number(seconds)||0));var hours=Math.floor(seconds/3600),minutes=Math.round((seconds%3600)/60);if(hours&&minutes)return hours+" Std "+minutes+" Min";if(hours)return hours+" Std";return minutes+" Min";}
function reportMetricUnit(type){return type==="weight"?"kg":(type==="seconds"?"Sek":"Wdh");}
function reportMetricValue(type,value){if(value==null)return"–";return type==="seconds"?fmtSeconds(value):reportNumber(value)+" "+reportMetricUnit(type);}
function reportMetricName(type){return type==="weight"?"Geschätztes 1RM":(type==="seconds"?"Beste Haltezeit":"Beste Wiederholungen");}
function previousBlockMetrics(programId){
 var canonical=typeof canonicalExerciseName==="function"?canonicalExerciseName:function(name){return String(name||"");},out=Object.create(null),seen=Object.create(null),current=S.programs[programId];while(current&&current.parent&&!seen[current.parent]){seen[current.parent]=true;var parent=S.programs[current.parent],store=S.store[current.parent];if(!parent||!store)break;if(parent.archived===true){var duplicate=Object.create(null);buildReportData(parent,store.logs,store.history).exercises.forEach(function(metric){var name=metric.trackingKey||canonical(metric.name)+"|"+metric.type;if(out[name])duplicate[name]=true;else out[name]=metric;});Object.keys(duplicate).forEach(function(name){delete out[name];});return out;}current=parent;}return out;
}
function reportSparkbars(metric,label){
 // Immer 12 Plätze: bei mehr Ausführungen die letzten 12, offene Plätze als Stummel.
 // Höhe skaliert zwischen schlechtester (18 %) und bester Ausführung (100 %), damit der Verlauf sichtbar wird.
 var points=metric&&Array.isArray(metric.points)?metric.points:[];
 if(!points.length)return"";
 var slots=12,shown=points.slice(-slots),min=Infinity,max=-Infinity;
 shown.forEach(function(p){if(p.value<min)min=p.value;if(p.value>max)max=p.value;});
 var out='<div class="rsparkbars" role="img" aria-label="'+attr(label)+'">';
 for(var i=0;i<slots;i++){
  if(i<shown.length){
   var height=max>min?Math.round(18+(shown[i].value-min)/(max-min)*82):62;
   out+='<span class="'+(i===shown.length-1?'on':'fill')+'" style="height:'+height+'%"></span>';
  }else out+='<span class="stub"></span>';
 }
 return out+'</div>';
}
function reportExerciseCard(metric,previousMetric){
 if(metric.type==="weighted_seconds"){
  var sessions=metric.performances||[],last=sessions[sessions.length-1],previousSessions=previousMetric&&previousMetric.type===metric.type?previousMetric.performances||[]:[],prior=previousSessions[previousSessions.length-1],period=metric.untilWeek!=null&&metric.untilWeek<metric.totalWeeks?' · Woche '+metric.fromWeek+'–'+metric.untilWeek:"";
  return '<article class="rexcard"><div class="rexhead"><span class="rexcat">Zeit &amp; Gewicht</span></div><div class="rexname">'+esc(metric.name+period)+'</div><div class="rexdelta neutral">'+esc(last?'Zuletzt · Woche '+last.week+' · '+last.dayLabel:'Noch keine Satzwerte')+'</div><div class="rexrecorded">'+esc(last?reportWeightedTimeSessionText(last):'–')+'</div>'+(prior?'<div class="rexprevious">Vorblock: '+esc(reportWeightedTimeSessionText(prior))+'</div>':'')+'</article>';
 }

 var unit=reportMetricUnit(metric.type),first=reportMetricValue(metric.type,metric.first),latest=reportMetricValue(metric.type,metric.latest),best=reportMetricValue(metric.type,metric.best),delta=metric.delta,deltaText="Noch kein Vergleich zwischen zwei Ausführungen";
 if(delta!=null&&metric.points.length>1){deltaText=(delta>0?"+":delta<0?"-":"")+(metric.type==="seconds"?fmtSeconds(Math.abs(delta)):reportNumber(Math.abs(delta))+" "+unit)+" seit der ersten Ausführung";}
 var previous=previousMetric&&previousMetric.type===metric.type&&previousMetric.latest!=null?'<div class="rexprevious">Vorblock: '+esc(reportMetricValue(metric.type,previousMetric.latest))+'</div>':"";
 var period=metric.untilWeek!=null&&metric.untilWeek<metric.totalWeeks?' · Woche '+metric.fromWeek+'–'+metric.untilWeek:"";
 var pill="";
 if(delta!=null&&metric.points.length>1){
  var pct=(typeof metric.first==="number"&&isFinite(metric.first)&&metric.first>0)?Math.round(delta/metric.first*100):null;
  var ptxt=(delta>0?"+":"")+(pct!=null?pct+" %":(metric.type==="seconds"?fmtSeconds(Math.abs(delta)):reportNumber(Math.abs(delta))+" "+unit));
  pill='<span class="rexpill'+(delta<0?' neg':'')+'">'+ptxt+'</span>';
 }
 return'<article class="rexcard"><div class="rexhead"><span class="rexcat">'+reportMetricName(metric.type)+'</span>'+pill+'</div><div class="rexname">'+esc(metric.name+period)+'</div><div class="rexbottom"><div class="rexfromto"><span class="rfrom">'+first+'</span><span class="rarrow" aria-hidden="true">→</span><span class="rto">'+latest+'</span></div>'+reportSparkbars(metric,metric.name+': Verlauf der letzten Ausführungen')+'</div>'+(pill?'':'<div class="rexdelta neutral">'+esc(deltaText)+'</div>')+'<div class="rexbest">Bestwert '+esc(best)+' · W'+(metric.bestWeek||"–")+'</div>'+previous+'</article>';
}
function reportDetailedProtocol(program,logs,history,notes){
 logs=logs&&typeof logs==="object"?logs:{};history=Array.isArray(history)?history:[];notes=notes&&typeof notes==="object"?notes:{};
 var out="",any=false,maxRound=(program.weeks||[]).length,forWeek=typeof dayExercisesFor==="function"?function(day,w){return dayExercisesFor(day,w,{});}:function(day,w){return(day.ex||[]).filter(function(ex){return w>=(ex.fromWeek==null?1:ex.fromWeek)&&w<=(ex.untilWeek==null?Infinity:ex.untilWeek);});};
 for(var w=1;w<=maxRound;w++){var week=program.weeks[w-1],weekHtml="";(program.days||[]).forEach(function(day){var rows="";forWeek(day,w).forEach(function(ex){var cell=logs[w+"|"+day.key+"|"+ex.id];if(!cell||!Array.isArray(cell.sets))return;var original=ex;ex=historicalExercise(ex,cell);var categorySets=week&&week.sets&&week.sets[ex.cat],need=ex.sets!=null?ex.sets:(categorySets!=null?categorySets:3),parts=[],volume=0,swap=typeof cell.swap==="string"?cell.swap.trim():"",note=typeof notes[ex.id]==="string"?notes[ex.id].trim():"";for(var i=0;i<cell.sets.length;i++){var set=cell.sets[i];if(!reportSetHasData(set))continue;var reps=reportFinite(set.reps),weight=reportFinite(set.weight);if(ex.unit==="seconds"){parts.push(reportTimedSetText(ex,set));}else if(ex.w&&weight!=null&&weight>0){parts.push(reportNumber(reps,1)+"×"+reportNumber(weight,1));volume+=reps*weight;}else parts.push(ex.unit==="seconds"?fmtSeconds(reps):reportNumber(reps,1));}if(parts.length){var exerciseName=swap?'<div class="rprotocolswap"><span>'+esc(original.name)+'</span><span aria-hidden="true">→</span><b>'+esc(swap)+'</b><span class="rswapbadge">Getauscht</span></div>':esc(ex.name);exerciseName+='<div class="rprotocolnote">'+esc(cell.performedExercise?(ex.w?weightConventionText(ex.weightConvention):"Erfassung gespeichert"):"Älterer Eintrag · damalige Erfassung unbestätigt")+'</div>';if(note)exerciseName+='<div class="rprotocolnote"><span class="rprotocolnotelabel">Notiz:</span><span class="rprotocolnotebody">'+esc(note)+'</span></div>';rows+='<tr><td class="exn">'+exerciseName+'</td><td>'+esc(parts.join(" · "))+'</td><td class="vol">'+(ex.w&&ex.unit!=="seconds"&&volume>0?reportNumber(volume,0)+" kg":"–")+'</td></tr>';}});if(rows){var session=history.filter(function(entry){return entry.week===w&&entry.day===day.key;})[0],sessionText=session?" · "+dDate(session.start)+" · "+reportDuration(session.dur):"";weekHtml+='<div class="rd3">'+esc(day.wd||day.key)+(day.title?" – "+esc(day.title):"")+sessionText+'</div><table class="rtbl"><thead><tr><th>Übung</th><th>Sätze</th><th>Volumen</th></tr></thead><tbody>'+rows+'</tbody></table>';}});if(weekHtml){any=true;out+='<div class="rwk">Woche '+w+' · '+esc(week.label||"")+'</div>'+weekHtml;}}
 return any?out:'<div class="rempty"><strong>Noch kein Trainingsprotokoll</strong>Sobald du Satzwerte einträgst, erscheint hier die vollständige Übersicht.</div>';
}
function buildReport(programId,returnView){
 programId=programId&&S.programs[programId]?programId:S.active;var program=S.programs[programId],store=S.store[programId]||newStore(program),data=buildReportData(program,store.logs,store.history),previous=programId===S.active&&program.archived!==true?previousBlockMetrics(programId):{},now=Date.now(),back=returnView==="archive",b='<div class="owrap reportwrap"><header class="reporthead">'+(back?'<button class="iconbtn reportback" id="repback" aria-label="Zurück zum Archiv">'+icon("chevron-left")+'</button>':'')+'<div class="reportheadmain"><div class="reporteyebrow">Auswertung</div><h1 id="reporttitle">'+esc(program.name)+artSubtitleHtml(program.name,program.art)+'</h1></div><div class="reportactions"><button class="histbtn" id="reprint">'+icon("download")+' Drucken / PDF</button>'+(back?'':'<button class="iconbtn" id="repclose" aria-label="Auswertung schließen">'+icon("close")+'</button>')+'</div></header>';
 b+='<div class="reportintro"><p class="rstand">Stand '+dDate(now)+' · '+dClock(now)+' Uhr · Kennzahlen aus deinen eingetragenen Daten</p><span class="reportlocal">Nur lokal gespeichert</span></div>';
 b+='<section class="rsummary" aria-label="Zusammenfassung"><div class="rmetric"><span class="rlab">Einheiten</span><span class="rval">'+data.completedSessions+'<span class="rvalsuf"> / '+data.totalPlanned+'</span></span><span class="rsub">'+data.completionPct+' % des Trainingsblocks · gezählt wird jede vollständig beendete Einheit</span></div><div class="rmetric"><span class="rlab">Trainingszeit</span><span class="rval">'+reportDuration(data.totalDuration)+'</span><span class="rsub">dokumentiert, inkl. Fortsetzungen</span></div><div class="rmetric"><span class="rlab">Bewegtes Gewicht</span><span class="rval">'+reportNumber(data.totalVolume,0)+'<span class="rvalsuf"> kg</span></span><span class="rsub">Gewicht × Wiederholungen · ohne Zeitübungen</span></div></section>';
 b+='<div class="rsechead"><span>Fortschritt je Übung</span><span class="rsecmeta">Typgerechte Werte</span></div><section class="rsecplain">';
 if(data.exercises.length){var canonical=typeof canonicalExerciseName==="function"?canonicalExerciseName:function(name){return String(name||"");};b+='<div class="rexgrid">'+data.exercises.map(function(metric){return reportExerciseCard(metric,previous[metric.trackingKey||canonical(metric.name)+"|"+metric.type]);}).join("")+'</div>';}else b+='<div class="rempty"><strong>Noch kein Übungsverlauf</strong>Trage im Training deine Sätze ein. Danach werden deine ersten Vergleichswerte automatisch aufgebaut.</div>';b+='</section>';
 b+='<button class="rprotocollink" id="repprotocol"><span><span class="rprotocollinktitle">Trainingsprotokoll</span><span class="rprotocollinksub">Alle Wochen, Sätze und Notizen als eigene Seite</span></span>'+icon("chevron-right")+'</button><p class="rfootnote"><b>Hinweis zum geschätzten 1RM:</b> Satzkraft verwendet die Epley-Formel als verständlichen Vergleichswert und begrenzt die Berechnung auf höchstens 30 Wiederholungen. Der Wert ist eine Schätzung, kein Maximaltest. Zeitübungen mit Gewicht zeigen Zeit und Last gemeinsam; für sie wird kein 1RM oder Wiederholungsvolumen berechnet. Körpergewichtsübungen ohne eingetragenes Zusatzgewicht werden nicht als bewegtes Trainingsgewicht berechnet. Deload-Wochen fließen nicht in den Übungstrend ein.</p></div>';
 document.getElementById("report").innerHTML=b;
}
var reportReturnFocus=null,reportProgramId=null,reportReturnView="";
function openReport(programId,returnView,libraryReady){if(typeof EXERCISE_LIBRARY!=="undefined"&&EXERCISE_LIBRARY===null&&!libraryReady){loadExerciseLibrary().then(function(){openReport(programId,returnView,true);});return;}reportReturnFocus=document.activeElement;reportProgramId=programId&&S.programs[programId]?programId:S.active;reportReturnView=returnView==="archive"?"archive":"";buildReport(reportProgramId,reportReturnView);lockSurfaceScroll();var report=document.getElementById("report");report.classList.add("open");updateSurfaceIsolation();var close=document.getElementById(reportReturnView==="archive"?"repback":"repclose");(close||report).focus();}
function closeReport(){var report=document.getElementById("report");if(!report.classList.contains("open"))return;var returnView=reportReturnView;report.classList.remove("open");unlockSurfaceScroll();reportReturnView="";if(returnView==="archive"){renderArchive();lockSurfaceScroll();document.getElementById("lib").classList.add("open");updateSurfaceIsolation();var back=document.getElementById("archiveback");if(back)back.focus();}else{updateSurfaceIsolation();if(reportReturnFocus&&document.contains(reportReturnFocus))reportReturnFocus.focus();}reportReturnFocus=null;}
function printReport(){
 var report=document.getElementById("report");if(!report||!report.innerHTML)return;
 var oldTitle=document.title,restored=false,restore=function(){if(restored)return;restored=true;document.title=oldTitle;window.removeEventListener("afterprint",restore);};
 var program=S.programs[reportProgramId]||PROG();document.title=(program.name||"Satzkraft")+" – Auswertung";window.addEventListener("afterprint",restore);window.print();setTimeout(restore,1500);
}
var protocolReturnFocus=null,protocolProgramId=null;
function buildProtocol(programId){
 var program=S.programs[programId],store=S.store[programId]||newStore(program),now=Date.now();
 var b='<div class="owrap reportwrap"><header class="reporthead"><button class="iconbtn reportback" id="protback" aria-label="Zurück zur Auswertung">'+icon("chevron-left")+'</button><div class="reportheadmain"><div class="reporteyebrow">Trainingsprotokoll</div><h1 id="protocoltitle">'+esc(program.name)+artSubtitleHtml(program.name,program.art)+'</h1></div><div class="reportactions"><button class="histbtn" id="protprint">'+icon("download")+' Drucken / PDF</button></div></header>';
 b+='<div class="reportintro"><p class="rstand">Stand '+dDate(now)+' · '+dClock(now)+' Uhr · alle eingetragenen Sätze, Zeiten und Notizen</p><span class="reportlocal">Nur lokal gespeichert</span></div>';
 b+=reportDetailedProtocol(program,store.logs,store.history,store.notes)+'</div>';
 document.getElementById("protocol").innerHTML=b;
}
function openProtocol(){
 protocolProgramId=reportProgramId&&S.programs[reportProgramId]?reportProgramId:S.active;
 protocolReturnFocus=document.activeElement;
 buildProtocol(protocolProgramId);
 document.body.classList.add("protocol-open");
 var protocol=document.getElementById("protocol");protocol.classList.add("open");updateSurfaceIsolation();
 var back=document.getElementById("protback");(back||protocol).focus();
}
function closeProtocol(){
 var protocol=document.getElementById("protocol");if(!protocol.classList.contains("open"))return;
 protocol.classList.remove("open");protocol.innerHTML="";document.body.classList.remove("protocol-open");updateSurfaceIsolation();
 if(protocolReturnFocus&&document.contains(protocolReturnFocus))protocolReturnFocus.focus();
 protocolReturnFocus=null;protocolProgramId=null;
}
function printProtocol(){
 if(!document.getElementById("protocol").classList.contains("open"))return;
 var oldTitle=document.title,restored=false,restore=function(){if(restored)return;restored=true;document.title=oldTitle;window.removeEventListener("afterprint",restore);};
 var program=S.programs[protocolProgramId]||PROG();document.title=(program.name||"Satzkraft")+" – Trainingsprotokoll";window.addEventListener("afterprint",restore);window.print();setTimeout(restore,1500);
}
