// ---------- Visueller Programm-Editor ----------
var editorDraft=null,editorSourceId=null,editorInitialJSON="",editorView="training",editorDayIndex=0,editorWeekIndex=0,editorExerciseIndex=null,editorUndoStack=[],editorUndoField=null,editorDragState=null,editorSuppressClickUntil=0,editorUnsavedDraft=false,editorReturnView="library",editorOpenSections={},editorPendingReplacementRefs={},editorRenameChoices={},editorWarningSerial=0;
var EDITOR_INFO={
 gruppe:{t:"Trainingsgruppe",m:"Eine Trainingsgruppe fasst ähnliche Übungen zusammen und gibt ihnen gemeinsame Standardwerte: Wiederholungsbereich, Satzpause und Farbe. Beispiel: Alle ‚Kraft‘-Übungen nutzen 5–7 Wiederholungen und 2,5 Minuten Pause. So stellst du das einmal ein statt bei jeder Übung einzeln. Eine Übung kann diese Werte mit einer ‚Eigenen Vorgabe‘ überschreiben."},
 typ:{t:"Übungstyp",m:"Legt fest, was du im Training einträgst. Mit Gewicht: volle kg-Angabe (Hantel, Maschine). Nur Körpergewicht: nur Wiederholungen. Körpergewicht + Zusatzgewicht: du trägst nur das Extra-Gewicht ein (z. B. Dip-Gürtel), 0 kg heißt ohne Zusatz. Halten auf Zeit: Sekunden statt Wiederholungen (z. B. Plank)."},
 rir:{t:"Anstrengung (RIR)",m:"RIR heißt ‚Reps in Reserve‘: wie viele saubere Wiederholungen du am Satzende noch schaffen könntest. RIR 2 bedeutet: aufhören, wenn noch etwa 2 gehen würden. Je kleiner die Zahl, desto härter die Woche. Erholungswochen nutzen RIR 4–5."},
 phase:{t:"Wie soll trainiert werden?",m:"Aufbau: normal trainieren und Gewichte schrittweise steigern. Intensiv: schwerer, meist weniger Wiederholungen – für spätere Wochen im Block. Erholungswoche: bewusst leichter (etwa 60 % Gewicht, weniger Sätze), damit der Körper den Fortschritt verarbeitet. Üblich sind 2–3 Aufbauwochen, dann 1 Erholungswoche."},
 vorgabe:{t:"Eigene Vorgabe",m:"Normalerweise bekommt die Übung Sätze und Wiederholungen von ihrer Trainingsgruppe und der jeweiligen Woche. Mit einer eigenen Vorgabe legst du beides nur für diese Übung fest – gleich in allen Wochen."},
 gewicht:{t:"Startgewicht & Steigerung",m:"Startgewicht: damit beginnt Woche 1 – lieber zu leicht als zu schwer. Steigerung: um so viele kg erhöht die App, wenn du alle Sätze am oberen Wiederholungsende schaffst. Üblich: 2,5 kg bei Langhanteln, 1–2 kg bei Kurzhanteln."},
 wucd:{t:"Warm-up & Cool-down",m:"Optionale geführte Timer vor und nach dem Training – rein zeitbasiert, nichts einzutragen. Die Übungen stammen aus einer festen Liste, damit die Timer-Ansicht sie kennt."}
};
var EDITOR_WEEKDAYS=WD_CANON.slice();
function cloneJSON(v){return JSON.parse(JSON.stringify(v));}
function editorPushUndo(label){
 if(!editorDraft)return;
 editorUndoStack.push({label:label||"Änderung",draft:cloneJSON(editorDraft),view:editorView,day:editorDayIndex,week:editorWeekIndex,exercise:editorExerciseIndex});
 if(editorUndoStack.length>30)editorUndoStack.shift();
 var button=document.getElementById("editorundo");if(button)button.disabled=false;
}
function editorUndo(){
 var snap=editorUndoStack.pop();if(!snap)return;
 editorDraft=snap.draft;editorView=snap.view;editorDayIndex=snap.day;editorWeekIndex=snap.week;editorExerciseIndex=snap.exercise;editorUndoField=null;renderProgramEditor();
}
function editorNextCategoryKey(categories){
 var n=1,key="kategorie";
 while(Object.prototype.hasOwnProperty.call(categories,key)){n++;key="kategorie"+n;}
 return key;
}
function editorNextDayKey(days){
 var used=Object.create(null);days.forEach(function(d){used[d.key]=1;});
 for(var i=0;i<26;i++){var key=String.fromCharCode(65+i);if(!used[key])return key;}
 var n=1;while(used["Tag"+n])n++;return "Tag"+n;
}
function editorCategoryInUse(draft,key){
 for(var i=0;i<draft.days.length;i++)for(var j=0;j<draft.days[i].exercises.length;j++)if(draft.days[i].exercises[j].category===key)return true;
 return false;
}
function editorRenumberWeeks(draft){draft.weeks.forEach(function(w,i){w.n=i+1;});return draft;}
function editorWeekdayOptions(days,currentIndex){
 var used=Object.create(null),current=days[currentIndex]&&days[currentIndex].weekday,h="";
 days.forEach(function(day,di){if(di!==currentIndex)used[day.weekday]=1;});
 EDITOR_WEEKDAYS.forEach(function(wd){h+='<option value="'+attr(wd)+'"'+(wd===current?' selected':'')+(used[wd]?' disabled':'')+'>'+esc(wd)+(used[wd]?' · bereits belegt':'')+'</option>';});
 return h;
}
function editorBuildRefMap(draft){
 var map=Object.create(null);if(!draft||!Array.isArray(draft.days))return map;
 draft.days.forEach(function(day){(day.exercises||[]).forEach(function(ex,index){if(typeof ex._ref==="string"&&ex._ref)map[ex._ref]={day:String(day.key),id:String(day.key)+"_"+index};});});
 return map;
}
function editorHasPendingReplacements(){return Object.keys(editorPendingReplacementRefs||{}).length>0;}
function editorExerciseTypeSignature(ex){return(!!(ex&&ex.w)?"1":"0")+"|"+(!!(ex&&ex.bw)?"1":"0")+"|"+(ex&&ex.unit==="seconds"?"seconds":"reps")+"|"+!!(ex&&ex.perSide)+"|"+(ex&&ex.weightConvention||"unspecified");}
function editorExternalTypeSignature(ex){return(!!(ex&&ex.weighted)?"1":"0")+"|"+(!!(ex&&ex.bodyweight)?"1":"0")+"|"+(ex&&(ex.unit==="seconds"||ex.unit==="time")?"seconds":"reps")+"|"+!!(ex&&ex.perSide)+"|"+(ex&&ex.weightConvention||"unspecified");}
function exerciseHasStoredValues(store,exerciseId){
 var logs=store&&store.logs||{};for(var key in logs){if(key.split("|")[2]!==exerciseId)continue;var cell=logs[key];if(cell&&Array.isArray(cell.sets)&&cell.sets.some(function(set){return set&&(set.reps!==""&&set.reps!=null||set.weight!==""&&set.weight!=null);}))return true;}return false;
}
function uniqueTimelineExerciseId(day,base,week,used){
 var stem=String(base||day.key+"_exercise").replace(/[^A-Za-z0-9_-]/g,"_")+"_v"+week,id=stem,n=2;while(used[id]){id=stem+"_"+n;n++;}used[id]=true;return id;
}
function timelineProgramFromEdit(oldProg,newProg,draft,oldStore){
 var merged=cloneJSON(newProg),baseWeek=currentTrainingWeekFor(oldProg,oldStore),oldDays=Object.create(null),used=Object.create(null),draftDays=Object.create(null);
 (oldProg.days||[]).forEach(function(day){oldDays[day.key]=day;(day.ex||[]).forEach(function(ex){used[ex.id]=true;});});
 (draft.days||[]).forEach(function(day){draftDays[day.key]=day;});
 merged.categories=Object.assign({},cloneJSON(oldProg.categories||{}),merged.categories||{});
 (merged.weeks||[]).forEach(function(week,index){var oldWeek=oldProg.weeks[index]||{};Object.keys(merged.categories).forEach(function(cat){if(week.sets[cat]==null)week.sets[cat]=oldWeek.sets&&oldWeek.sets[cat]!=null?oldWeek.sets[cat]:3;});});
 (merged.days||[]).forEach(function(day){
  var oldDay=oldDays[day.key],draftDay=draftDays[day.key],anchor=baseWeek;
  if(oldDay&&programUnitComplete(oldProg,oldStore,baseWeek,day.key))anchor=baseWeek+1;
  if(anchor>merged.weeks.length)throw new Error("Für diesen abgeschlossenen Tag gibt es keine offene Folgeeinheit mehr.");
  var historical=[],activeOld=[],byId=Object.create(null),kept=Object.create(null),result=[];
  if(oldDay)(oldDay.ex||[]).forEach(function(ex){byId[ex.id]=ex;if(exerciseValidForWeek(ex,baseWeek))activeOld.push(ex);else historical.push(cloneJSON(ex));});
  result=historical;
  (day.ex||[]).forEach(function(fresh,index){
   var draftEx=draftDay&&draftDay.exercises[index],ref=draftEx&&draftEx._ref,old=ref&&byId[ref],forced=!!(ref&&editorPendingReplacementRefs[ref]),choice=ref&&editorRenameChoices[ref],sameType=old&&editorExerciseTypeSignature(old)===editorExerciseTypeSignature(fresh),sameName=old&&String(old.name).trim()===String(fresh.name).trim();
   if(old&&sameType&&!forced&&(!old.exerciseId||!fresh.exerciseId||old.exerciseId===fresh.exerciseId)&&(sameName||choice==="same")){
    var same=cloneJSON(fresh);same.id=old.id;if(old.fromWeek!=null)same.fromWeek=old.fromWeek;else delete same.fromWeek;if(old.untilWeek!=null)same.untilWeek=old.untilWeek;else delete same.untilWeek;if(old.prevId)same.prevId=old.prevId;else delete same.prevId;kept[old.id]=true;result.push(same);return;
   }
   if(old){
    var exerciseAnchor=anchor,swapCell=oldStore.logs&&oldStore.logs[baseWeek+"|"+day.key+"|"+old.id],matchingSwap=forced&&swapCell&&normalizeSwapName(swapCell.swap)===normalizeSwapName(fresh.name);if(matchingSwap)exerciseAnchor=baseWeek;
    var ended=cloneJSON(old);
    if(exerciseAnchor>1){ended.untilWeek=exerciseAnchor-1;result.push(ended);}
    else if(exerciseHasStoredValues(oldStore,old.id)&&!matchingSwap){ended.untilWeek=1;result.push(ended);exerciseAnchor=2;if(exerciseAnchor>merged.weeks.length)throw new Error("Die begonnene Übung kann nicht mehr sicher abgelöst werden.");}
    var successor=cloneJSON(fresh);successor.id=uniqueTimelineExerciseId(day,old.id,exerciseAnchor,used);successor.fromWeek=exerciseAnchor;delete successor.untilWeek;successor.prevId=old.id;kept[old.id]=true;result.push(successor);return;
   }
   var added=cloneJSON(fresh);added.id=uniqueTimelineExerciseId(day,day.key+"_exercise",anchor,used);added.fromWeek=anchor;delete added.untilWeek;delete added.prevId;result.push(added);
  });
  activeOld.forEach(function(old){if(kept[old.id])return;var ended=cloneJSON(old);if(anchor>1){ended.untilWeek=anchor-1;result.push(ended);}else if(exerciseHasStoredValues(oldStore,old.id)){ended.untilWeek=1;result.push(ended);}});
  day.ex=result;
 });
 return merged;
}
function migrateReplaceStore(oldProg,oldStore,newProg,refMap){
 var migrated=JSON.parse(JSON.stringify(oldStore||newStore(newProg))),days=(newProg.days||[]).map(function(day){return day.key;}),norm=function(value){return typeof value==="string"?value.replace(/\s+/g," ").trim().slice(0,80):"";};migrated.workout=null;migrated.week=Math.max(1,Math.min(newProg.weeks.length,Number(migrated.week)||1));if(days.indexOf(migrated.day)<0)migrated.day=days[0];if(!Array.isArray(migrated.pendingReplacements))migrated.pendingReplacements=[];
 (newProg.days||[]).forEach(function(day){(day.ex||[]).forEach(function(ex){if(!ex.prevId||!ex.fromWeek)return;var oldKey=ex.fromWeek+"|"+day.key+"|"+ex.prevId,newKey=ex.fromWeek+"|"+day.key+"|"+ex.id,cell=migrated.logs&&migrated.logs[oldKey];if(!cell||norm(cell.swap)!==norm(ex.name))return;var regular=JSON.parse(JSON.stringify(cell));delete regular.swap;delete regular.swapWeight;delete regular.swapDecision;migrated.logs[newKey]=regular;delete migrated.logs[oldKey];});});
 return migrated;
}
function openProgramEditor(id){
 if(programWriteLocked()){showProgramWriteLocked();return;}
 var p=S.programs[id];if(!p||p.archived===true)return;
 loadExerciseLibraryForEditor();
 editorSourceId=id;editorUnsavedDraft=false;editorReturnView="library";var exported=cloneJSON(exportTranslate(p)),editWeek=currentTrainingWeekFor(p,S.store[id]||newStore(p));editorDraft=exported;delete editorDraft._anleitung;
 editorDraft.days.forEach(function(draftDay,di){var internalDay=p.days[di];if(!internalDay)return;var sourceExercises=draftDay.exercises||[];draftDay.exercises=dayExercisesFor(internalDay,editWeek,{}).map(function(internalEx){var sourceIndex=internalDay.ex.indexOf(internalEx),draftEx=cloneJSON(sourceExercises[sourceIndex]);delete draftEx.fromWeek;delete draftEx.untilWeek;delete draftEx.prevId;draftEx._ref=internalEx.id;return draftEx;});});
 editorDraft.days.forEach(function(day){day.exercises.forEach(function(ex){if(ex.exerciseId!==undefined)ex._referenceName=ex.name;});});
 editorInitialJSON=JSON.stringify(editorDraft);
 editorView="training";editorDayIndex=0;editorWeekIndex=0;editorExerciseIndex=null;editorUndoStack=[];editorUndoField=null;editorDragState=null;editorOpenSections={};editorPendingReplacementRefs={};editorRenameChoices={};
 renderProgramEditor();
}
function openProgramDraft(draft,returnView,source){
 loadExerciseLibraryForEditor();
 editorSourceId=null;editorUnsavedDraft=true;editorReturnView=returnView||"create";editorDraft=cloneJSON(draft);delete editorDraft._anleitung;
 editorDraft.days.forEach(function(day){day.exercises.forEach(function(ex){if(ex.exerciseId!==undefined)ex._referenceName=ex.name;});});
 editorInitialJSON=JSON.stringify(editorDraft);editorView="training";editorDayIndex=0;editorWeekIndex=0;editorExerciseIndex=null;editorUndoStack=[];editorUndoField=null;editorDragState=null;editorOpenSections={};editorPendingReplacementRefs={};editorRenameChoices={};
 renderProgramEditor();
}
function editorOption(value,label,current){return'<option value="'+attr(value)+'"'+(value===current?' selected':'')+'>'+esc(label)+'</option>';}
function editorInfoButton(key,label){return'<button type="button" class="infoterm" data-info="'+attr(key)+'" aria-label="Erklärung: '+attr(label)+'">'+esc(label)+'</button>';}
function editorLabel(label,info){return'<span class="edlabel">'+(info?editorInfoButton(info,label):'<span>'+esc(label)+'</span>')+'</span>';}
function editorSectionAttrs(key){return' data-ed-section="'+attr(key)+'"'+(editorOpenSections[key]?' open':'');}
function editorInput(label,value,data,opts){
 opts=opts||{};
 var cls='edfield'+(opts.wide?' wide':'');
 if(opts.area)return'<label class="'+cls+'">'+editorLabel(label,opts.info)+'<textarea '+data+(opts.max?' maxlength="'+opts.max+'"':'')+'>'+esc(value)+'</textarea></label>';
 return'<label class="'+cls+'">'+editorLabel(label,opts.info)+'<input type="'+(opts.type||'text')+'" value="'+attr(value)+'" '+data+(opts.min!=null?' min="'+opts.min+'"':'')+(opts.max!=null?' max="'+opts.max+'"':'')+(opts.step?' step="'+opts.step+'"':'')+'></label>';
}
function editorExerciseNameInput(ex,dayIndex,exerciseIndex){
 return'<label class="edfield wide">'+editorLabel("Übungsname")+'<input type="text" value="'+attr(ex.name)+'" data-ed-day="'+dayIndex+'" data-ed-ex="'+exerciseIndex+'" data-ed-field="name" maxlength="80" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-haspopup="listbox" aria-controls="exerciseautocomplete-'+dayIndex+'-'+exerciseIndex+'"><div class="edautocomplete" id="exerciseautocomplete-'+dayIndex+'-'+exerciseIndex+'" role="listbox" aria-label="Übungsvorschläge"></div></label>';
}
function editorLibraryTypeSignature(entry){return exerciseLibraryTypeSignature(entry);}
function editorApplyExerciseLibraryType(ex,entry){
 var previous=editorExerciseType(ex),type=editorLibraryTypeSignature(entry);delete ex.unit;delete ex.bodyweight;
 if(type==="weight"||type==="added_weight"||type==="weighted_seconds"){ex.weighted=true;if(type==="added_weight")ex.bodyweight=true;if(previous!==type||ex.startWeight==null)ex.startWeight=0;if(previous!==type||ex.increment==null)ex.increment=2.5;if(type==="weighted_seconds"){ex.unit="seconds";if(ex.timerMode!=="max")ex.timerMode="target";}else delete ex.timerMode;}
 else{delete ex.weighted;delete ex.startWeight;delete ex.increment;if(type==="seconds"){ex.unit="seconds";if(ex.timerMode!=="max")ex.timerMode="target";}else delete ex.timerMode;}
 return ex;
}
function editorExerciseLibraryWouldOverwrite(ex,entry){
 var fields=[["en",entry.en],["cue",entry.technik],["video",entry.video],["proxy",entry.ersatz]];
 return fields.some(function(pair){return String(ex[pair[0]]||"").trim()&&String(ex[pair[0]]).trim()!==String(pair[1]||"").trim();});
}
function editorApplyExerciseLibraryEntry(ex,entry){
 if(entry.id)ex.exerciseId=entry.id;else delete ex.exerciseId;
 if(entry.definition)ex.exerciseDefinition=cloneJSON(entry.definition);else delete ex.exerciseDefinition;
 if(entry.weightConvention)ex.weightConvention=entry.weightConvention;else if(entry.id&&EXERCISE_WEIGHT_CONVENTIONS[entry.id])ex.weightConvention=EXERCISE_WEIGHT_CONVENTIONS[entry.id];else delete ex.weightConvention;
 ex.name=entry.de;ex._referenceName=entry.de;ex.en=entry.en;ex.cue=entry.technik;ex.video=entry.video;ex.proxy=entry.ersatz;if(entry.einseitig===true)ex.perSide=true;else delete ex.perSide;editorApplyExerciseLibraryType(ex,entry);return ex;
}
function editorChooseExerciseLibraryEntry(dayIndex,exerciseIndex,entry,confirmed){
 var day=editorDraft&&editorDraft.days[dayIndex],ex=day&&day.exercises[exerciseIndex];if(!ex||!entry)return false;
 if(!confirmed&&(ex.exerciseId!==undefined&&ex.exerciseId!==entry.id||editorExerciseLibraryWouldOverwrite(ex,entry))){showModal("Vorhandene Angaben ersetzen?","Soll Satzkraft die Übungszuordnung und die vorhandenen Angaben mit dieser Bibliotheksübung ersetzen? Die Satzfelder werden passend übernommen.",[{label:"Bibliothekswerte übernehmen",cls:"primary",action:function(){editorChooseExerciseLibraryEntry(dayIndex,exerciseIndex,entry,true);}},{label:"Abbrechen",action:null}]);return false;}
 editorPushUndo("Übung aus Bibliothek übernommen");editorApplyExerciseLibraryEntry(ex,entry);renderProgramEditor("days",dayIndex,exerciseIndex);return true;
}
function renderExerciseLibraryAutocomplete(input){
 var dayIndex=+input.dataset.edDay,exerciseIndex=+input.dataset.edEx,box=document.getElementById("exerciseautocomplete-"+dayIndex+"-"+exerciseIndex);if(!box)return;
 box.innerHTML=exerciseLibraryMatches(input.value,6).map(function(entry,index){return'<button type="button" class="edautosuggestion" id="exerciseoption-'+dayIndex+'-'+exerciseIndex+'-'+index+'" role="option" aria-selected="false" data-exercise-suggestion="'+attr(entry.de)+'" data-exercise-suggestion-id="'+attr(entry.id||'')+'" data-ed-day="'+dayIndex+'" data-ed-ex="'+exerciseIndex+'"><span>'+esc(entry.de)+'</span><small>'+esc(entry.en)+'</small></button>';}).join("");input.setAttribute("aria-expanded",box.children.length?"true":"false");
}
function loadExerciseLibraryForEditor(){loadExerciseLibrary().then(function(){var input=document.activeElement;if(input&&input.dataset&&input.dataset.edField==="name"&&input.dataset.edEx!=null)renderExerciseLibraryAutocomplete(input);});}
function editorReleaseReference(dayIndex,exerciseIndex,confirmed){
 var ex=editorDraft&&editorDraft.days[dayIndex]&&editorDraft.days[dayIndex].exercises[exerciseIndex];if(!ex||ex.exerciseId===undefined)return false;
 if(!confirmed){showModal("Übungszuordnung lösen?","Name, Satzfelder und Trainingswerte bleiben erhalten. Die Übung wird anschließend als freie Programmübung geführt.",[{label:"Zuordnung lösen",cls:"primary",action:function(){editorReleaseReference(dayIndex,exerciseIndex,true);}},{label:"Abbrechen",action:null}]);return false;}
 editorPushUndo("Übungszuordnung gelöst");delete ex.exerciseId;delete ex.exerciseDefinition;delete ex._referenceName;renderProgramEditor("days",dayIndex,exerciseIndex);return true;
}
function editorConfirmReferenceNames(continuation){
 for(var di=0;di<editorDraft.days.length;di++)for(var ei=0;ei<editorDraft.days[di].exercises.length;ei++){
  var ex=editorDraft.days[di].exercises[ei],ref=exerciseReferenceDefinition(ex.exerciseId)||(ex.exerciseDefinition?{name:ex.exerciseDefinition.name}:null);
  if(!ref||ex._referenceName===ex.name)continue;
  (function(item,definition){showModal("Übungszuordnung prüfen","Der neue Name „"+esc(item.name)+"“ gehört weiterhin zur Bibliotheksübung „"+esc(definition.name)+"“. Soll diese Zuordnung erhalten bleiben?",[{label:"Gleiche Übung, Zuordnung behalten",cls:"primary",action:function(){item._referenceName=item.name;if(item._ref)editorRenameChoices[item._ref]="same";continuation();}},{label:"Als freie Übung weiterführen",action:function(){editorPushUndo("Übungszuordnung gelöst");delete item.exerciseId;delete item.exerciseDefinition;delete item._referenceName;continuation();}},{label:"Abbrechen",action:null}]);})(ex,ref);return false;
 }
 return true;
}
function editorPhaseLabel(phase){return phase==="intensiv"?"Intensiv":phase==="deload"?"Erholungswoche":"Aufbau";}
function editorPhaseHelp(phase){return phase==="intensiv"?"Schwerer trainieren, meist mit weniger Wiederholungen. Diese Woche eignet sich für erfahrene Trainierende.":phase==="deload"?"Bewusst leichter trainieren, damit sich der Körper erholt. Satzzahlen und Anstrengung sollten niedriger sein.":"Normal trainieren, Technik festigen und das Gewicht schrittweise steigern.";}
function editorRirOptions(current){
 var values=[["4-5","Erholung · 4-5 Wiederholungen übrig"],["4","Locker · etwa 4 übrig"],["3-4","Locker · 3-4 übrig"],["3","Kontrolliert · etwa 3 übrig"],["2-3","Kontrolliert · 2-3 übrig"],["2","Fordernd · etwa 2 übrig"],["1-2","Fordernd · 1-2 übrig"],["1","Schwer · etwa 1 übrig"],["0","Sehr schwer · keine übrig"]],h="",known=false,cur=String(current==null?"":current);
 h+=editorOption("","Keine feste Vorgabe",cur);
 values.forEach(function(o){if(o[0]===cur)known=true;h+=editorOption(o[0],o[1],cur);});
 if(!known&&cur)h+=editorOption(cur,"Bisheriger Wert · RIR "+cur,cur);
 return h;
}
function editorDraftSets(d,ex,weekIndex){var w=d.weeks[Math.max(0,Math.min(weekIndex||0,d.weeks.length-1))];return ex.sets!=null?ex.sets:((w&&w.sets&&w.sets[ex.category]!=null)?w.sets[ex.category]:3);}
function editorDraftReps(d,ex,weekIndex){var w=d.weeks[Math.max(0,Math.min(weekIndex||0,d.weeks.length-1))],c=d.categories[ex.category],r=ex.reps||(c&&c.reps&&w&&c.reps[w.phase]);return Array.isArray(r)?r:null;}
function editorTargetReps(ex){
 var text=String(ex&&ex.target||""),range=text.match(/(\d+)\s*[–—-]\s*(\d+)(?:\s+[\p{L}.]+){0,3}\s*(?:reps?|wdh\.?|wiederholungen?|sek(?:unden)?\.?|seconds?|s)\b/iu),single;
 if(range){var min=Number(range[1]),max=Number(range[2]);if(min>0&&max>=min)return[min,max];}
 single=text.match(/(\d+)\s*(?:reps?|wdh\.?|wiederholungen?|sek(?:unden)?\.?|seconds?|s)\b/iu);
 if(single&&Number(single[1])>0)return[Number(single[1]),Number(single[1])];
 return null;
}
function editorExerciseMeta(ex,d){
 var c=d.categories[ex.category],parts=[c?c.label:ex.category],sets=editorDraftSets(d,ex,editorWeekIndex),reps=editorDraftReps(d,ex,editorWeekIndex);
 parts.push(sets+" Sätze");
 if(reps)parts.push((ex.unit==="seconds"?fmtSecondsRange(reps[0],reps[1]):reps[0]+(reps[0]===reps[1]?"":"–"+reps[1])+" Wdh")+(ex.perSide?" je Seite":""));else if(ex.target)parts.push(ex.target+(ex.perSide?" je Seite":""));else parts.push(ex.unit==="seconds"?"Zeit":"Wiederholungen");
 if(ex.weighted)parts.push("mit Gewicht");
 return parts.join(" · ");
}
function editorExerciseType(ex){
 var unit=ex.unit||"reps";
 if(ex.weighted&&ex.bodyweight&&unit==="reps")return"added_weight";
 if(ex.weighted&&!ex.bodyweight&&unit==="reps")return"weight";
 if(!ex.weighted&&unit==="seconds")return"seconds";
 if(!ex.weighted&&unit==="reps")return"bodyweight";
 return"custom";
}
function editorExerciseTypeOptions(ex){
 var current=editorExerciseType(ex),h="";
 h+=editorOption("weight","Mit Gewicht (Hantel, Maschine)",current);
 h+=editorOption("bodyweight","Nur Körpergewicht (z. B. Liegestütze)",current);
 h+=editorOption("added_weight","Körpergewicht + Zusatzgewicht (z. B. Klimmzüge mit Gürtel)",current);
 h+=editorOption("seconds","Halten auf Zeit (z. B. Plank)",current);
 if(current==="custom")h+=editorOption("custom","Individuell (aktuelle Einstellung)",current);
 return h;
}
function editorWucdOptions(kind,current){var h="",list=WUCD_LIB[kind]||[];list.forEach(function(name){h+=editorOption(name,name,current);});return h;}
function renderEditorWucdList(day,dayIndex,kind,label){
 var list=Array.isArray(day[kind])?day[kind]:[],h='<div class="edwucdgroup"><div class="edwucdtitle"><span>'+esc(label)+'</span><button class="edmini" data-ed-wucd-add="'+kind+'" data-ed-day="'+dayIndex+'"'+(list.length>=8?' disabled':'')+'>'+icon("plus")+' Eintrag</button></div>';
 if(!list.length)h+='<div class="edempty">Noch keine Einträge.</div>';
 list.forEach(function(item,index){h+='<div class="edwucdrow"><select aria-label="'+attr(label)+' Übung '+(index+1)+'" data-ed-wucd="'+attr(kind)+'" data-ed-day="'+dayIndex+'" data-ed-wucd-index="'+index+'" data-ed-field="name">'+editorWucdOptions(kind,item.name)+'</select><input type="number" min="15" max="180" step="1" value="'+attr(item.seconds)+'" aria-label="Sekunden" data-ed-wucd="'+attr(kind)+'" data-ed-day="'+dayIndex+'" data-ed-wucd-index="'+index+'" data-ed-field="seconds"><div class="edwucdmove"><button class="edmini" data-ed-wucd-move="-1" data-ed-wucd-kind="'+attr(kind)+'" data-ed-day="'+dayIndex+'" data-ed-wucd-index="'+index+'" aria-label="Nach oben"'+(index===0?' disabled':'')+'>Nach oben</button><button class="edmini" data-ed-wucd-move="1" data-ed-wucd-kind="'+attr(kind)+'" data-ed-day="'+dayIndex+'" data-ed-wucd-index="'+index+'" aria-label="Nach unten"'+(index===list.length-1?' disabled':'')+'>Nach unten</button><button class="edmini" data-ed-wucd-delete="'+attr(kind)+'" data-ed-day="'+dayIndex+'" data-ed-wucd-index="'+index+'" aria-label="Eintrag löschen">Löschen</button></div></div>';});
 return h+'</div>';
}
function renderEditorTraining(d,catKeys){
 editorDayIndex=Math.max(0,Math.min(editorDayIndex,d.days.length-1));
 var day=d.days[editorDayIndex],h='<div class="edguide"><div><strong>So bearbeitest du dein Training</strong>Wähle einen Tag und öffne eine Übung. Ziehe Übungen am Griff rechts; die Liste und Nummern sortieren sich dabei direkt neu. Trainingstage hältst du oben kurz fest.</div></div>';
 h+='<div class="edviewhead"><div class="meta"><h2>'+esc(d.name)+'</h2><p>Dein Plan sieht hier fast genauso aus wie beim Training.</p></div><button class="edmini" id="edaddday"'+(d.days.length>=LIMITS.maxDays?' disabled':'')+'>'+icon("plus")+' Tag</button></div>';
 var slots=new Array(7);d.days.forEach(function(item,di){var pos=EDITOR_WEEKDAYS.indexOf(item.weekday);if(pos>=0&&slots[pos]==null)slots[pos]=di;});
 h+='<div class="wstrip" role="group" aria-label="Trainingstag auswählen">';
 for(var wi=0;wi<7;wi++){var di=slots[wi];if(di!=null)h+='<button class="wday train'+(di===editorDayIndex?' active':'')+'" data-ed-daypick="'+di+'" data-ed-drag-day="'+di+'" data-ed-weekday-slot="'+wi+'" aria-pressed="'+(di===editorDayIndex)+'" title="Antippen: öffnen · halten: auf anderen Tag verschieben"><span class="wdn">'+WD_ABBR[wi]+'</span><span class="wstat editor-day-grip" aria-hidden="true"></span></button>';else h+='<div class="wday rest" data-ed-weekday-slot="'+wi+'"><span class="wdn">'+WD_ABBR[wi]+'</span><span class="wstat"></span></div>';}
 h+='</div>';
 if(!day)return h+'<div class="edemptyday">Noch kein Trainingstag vorhanden.</div>';
 h+='<div class="eddaysettings"><div class="edgrid"><label class="edfield">'+editorLabel("Trainingstag")+'<select data-ed-day="'+editorDayIndex+'" data-ed-field="weekday">'+editorWeekdayOptions(d.days,editorDayIndex)+'</select></label>';
 h+=editorInput('Name des Tages',day.title||'','data-ed-day="'+editorDayIndex+'" data-ed-field="title"',{max:60});h+='</div>';
 h+='<div class="libnote">'+day.exercises.length+' Übungen · Tag oben halten und auf einen anderen Wochentag ziehen</div></div>';
 h+='<details class="edadvanced"'+editorSectionAttrs("wucd")+'><summary><span class="edlabel"><button type="button" class="infoterm" data-info="wucd" aria-label="Erklärung: Warm-up &amp; Cool-down">Warm-up &amp; Cool-down</button></span></summary><div class="edbody"><div class="edwucdhelp">Rein zeitbasiert, geführt mit Timer. Übungen stammen aus einer festen Liste.</div>'+renderEditorWucdList(day,editorDayIndex,"warmup","Warm-up")+renderEditorWucdList(day,editorDayIndex,"cooldown","Cool-down")+'</div></details>';
 day.exercises.forEach(function(ex,ei){var c=d.categories[ex.category]||{},isOpen=editorExerciseIndex===ei,pendingReplacement=!!(ex._ref&&editorPendingReplacementRefs[ex._ref]);
  var editorColor=CAT_COLORS.indexOf(c.color)>=0?c.color:"slate";
  h+='<div class="edexercise'+(isOpen?' open':'')+(pendingReplacement?' pendingreplacement':'')+'" data-ed-ex-card="'+ei+'"><div class="edexhead"><div class="edexmain"><div class="edexname"><span class="edordernum">'+(ei+1)+'</span> · <span class="edexlabel">'+esc(ex.name)+'</span>'+(pendingReplacement?'<span class="pendingreplacementbadge">Zu prüfen</span>':'')+'</div><div class="edexmeta"><span class="tag '+editorColor+'">'+esc(c.label||ex.category)+'</span><span class="edexparams">'+esc(editorExerciseMeta(ex,d).split(' · ').slice(1).join(' · '))+'</span></div></div><button class="edmini" data-ed-openex="'+ei+'">'+(isOpen?'Schließen':'Bearbeiten')+'</button>'+(isOpen?'':'<button class="eddrag" data-ed-drag-ex="'+ei+'" data-ed-day="'+editorDayIndex+'" aria-label="'+attr(ex.name)+' halten und verschieben" title="Halten und verschieben"></button>')+'</div>';
  if(isOpen){h+='<div class="edexedit"><div class="edgrid">';
   h+=editorExerciseNameInput(ex,editorDayIndex,ei);
   h+='<div class="edfield wide"><button type="button" class="progtextaction" data-editor-personal-new="1">Eigene Übung in der Bibliothek erstellen</button></div>';
   if(ex.exerciseId!==undefined)h+='<div class="edfield wide"><small>'+esc(exerciseReferenceError(ex,false)||("Zuordnung: "+(exerciseReferenceDefinition(ex.exerciseId)||ex.exerciseDefinition).name))+'</small><button type="button" class="edmini" data-ed-release-reference="'+ei+'" data-ed-day="'+editorDayIndex+'">Übungszuordnung lösen</button></div>';
   h+='<label class="edfield">'+editorLabel("Trainingsgruppe","gruppe")+'<select data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="category">';catKeys.forEach(function(key){h+=editorOption(key,d.categories[key].label,ex.category);});h+='</select><small>Steuert Standardwerte und Satzpause.</small></label>';
   h+='<label class="edfield wide">'+editorLabel("Übungstyp","typ")+'<select data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="exerciseType">'+editorExerciseTypeOptions(ex)+'</select></label>';
   h+='<div class="edcheckrow" style="grid-column:1/-1"><label class="edcheck"><input type="checkbox" data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="perSide"'+(ex.perSide?' checked':'')+'> Je Seite ausführen (z. B. Ausfallschritte) – die App zeigt „je Seite“ an</label></div>';
   if(ex.unit==="seconds")h+='<label class="edfield wide">'+editorLabel("Timer-Modus","vorgabe")+'<select data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="timerMode">'+editorOption("target","Zielzeit · stoppt am oberen Ziel automatisch",ex.timerMode||"target")+editorOption("max","Maximalzeit · läuft bis zu meinem Stopp",ex.timerMode||"target")+'</select><small>Zielzeit eignet sich für feste Vorgaben; Maximalzeit misst, wie lange du sauber durchhältst.</small></label>';
   var ownPrescription=ex.sets!=null||Array.isArray(ex.reps),effectiveSets=editorDraftSets(d,ex,editorWeekIndex),effectiveReps=editorDraftReps(d,ex,editorWeekIndex),unitLabel=ex.unit==="seconds"?'Sekunden':'Wiederholungen';
   h+='<div class="edprescription"><h3>Trainingsvorgabe</h3><div class="libnote">Sätze und '+unitLabel+' stehen später genau so in der Trainingsansicht.</div><div class="edcheckrow"><label class="edcheck"><input type="checkbox" data-ed-own="1" data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'"'+(ownPrescription?' checked':'')+'> Eigene Vorgabe für diese Übung</label>'+editorInfoButton("vorgabe","Erklärung")+'</div>';
   if(ownPrescription){var editorRepMax=ex.unit==="seconds"?SET_TIME_MAX_SECONDS:SET_REP_MAX;h+='<div class="edprescgrid">'+editorInput('Sätze',effectiveSets,'data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="sets"',{type:'number',min:1,max:LIMITS.maxSets,step:'1'})+editorInput('Min. '+unitLabel,effectiveReps?effectiveReps[0]:8,'data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="repMin"',{type:'number',min:1,max:editorRepMax,step:'1'})+editorInput('Max. '+unitLabel,effectiveReps?effectiveReps[1]:12,'data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="repMax"',{type:'number',min:1,max:editorRepMax,step:'1'})+'</div>'+(ex.unit==="seconds"?'<div class="libnote" style="margin-top:8px">Angabe in Sekunden (900 = 15 min, maximal 5999 = 99:59 min)</div>':'');}else{h+='<div class="edinherited">ℹ <span><b>Standard der Trainingsgruppe, Woche '+(editorWeekIndex+1)+':</b> '+effectiveSets+' Sätze'+(effectiveReps?' · '+(ex.unit==="seconds"?fmtSecondsRange(effectiveReps[0],effectiveReps[1]):effectiveReps[0]+(effectiveReps[0]===effectiveReps[1]?'':'–'+effectiveReps[1])+' Wdh'):' · freie Vorgabe')+'. Aktiviere „Eigene Vorgabe“, um nur diese Übung anzupassen.</span></div>';}
   h+='</div>';
   if(ex.weighted){h+=editorInput(ex.bodyweight?'Zusatzgewicht in kg, 0 = ohne':'Startgewicht (kg)',ex.startWeight==null?0:ex.startWeight,'data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="startWeight"',{type:'number',min:0,max:2000,step:'0.1',info:'gewicht'});h+=editorInput('Steigerung (kg)',ex.increment==null?2.5:ex.increment,'data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="increment"',{type:'number',min:.1,max:100,step:'0.1',info:'gewicht'});if(ex.bodyweight)h+='<div class="libnote" style="grid-column:1/-1">Eingetragen wird nur das Zusatzgewicht.</div>';}
   h+=editorInput('Zusätzliches Ziel / Hinweis',ex.target||'','data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="target"',{wide:true,max:200});
   h+=editorInput('Technik-Hinweis',ex.cue||'','data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="cue"',{wide:true,area:true,max:200});
   h+=editorInput('Video-Suchbegriff',ex.video||'','data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="video"',{max:200});
   h+=editorInput('Ersatzübung',ex.proxy||'','data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'" data-ed-field="proxy"',{max:200});
   h+='</div><div class="edactions"><button class="smallbtn" data-ed-moveex="-1" data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'"'+(ei===0?' disabled':'')+'>Nach oben</button><button class="smallbtn" data-ed-moveex="1" data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'"'+(ei===day.exercises.length-1?' disabled':'')+'>Nach unten</button><span class="spacer"></span><button class="smallbtn del" data-ed-delex="1" data-ed-day="'+editorDayIndex+'" data-ed-ex="'+ei+'"'+(day.exercises.length<=1?' disabled':'')+'>Löschen</button></div></div>';}
  h+='</div>';
 });
 h+='<div class="edactions"><button class="smallbtn" data-ed-addex="'+editorDayIndex+'"'+(day.exercises.length>=LIMITS.maxExPerDay?' disabled':'')+'>'+icon("plus")+' Übung hinzufügen</button><span class="spacer"></span><button class="smallbtn del" data-ed-delday="'+editorDayIndex+'"'+(d.days.length<=1?' disabled':'')+'>Trainingstag löschen</button></div>';
 return h;
}
function renderEditorWeeks(d,catKeys){
 editorWeekIndex=Math.max(0,Math.min(editorWeekIndex,d.weeks.length-1));var w=d.weeks[editorWeekIndex],h='<div class="edguide"><div><strong>Wochen einfach steuern</strong>Wähle eine Woche und entscheide nur, wie trainiert werden soll. Die Satzzahlen darunter brauchst du nur für genauere Anpassungen.</div></div>';
 h+='<div class="edviewhead"><div class="meta"><h2>'+d.weeks.length+' Trainingswochen</h2><p>Jede Woche kann einen eigenen Schwerpunkt und eine eigene Anstrengung haben.</p></div><button class="edmini" id="edaddweek"'+(d.weeks.length>=LIMITS.maxWeeks?' disabled':'')+'>'+icon("plus")+' Woche</button></div>';
 h+='<div class="edweekstrip" role="group" aria-label="Woche auswählen">';d.weeks.forEach(function(item,wi){h+='<button class="edweekbtn'+(wi===editorWeekIndex?' active':'')+'" data-ed-weekpick="'+wi+'" aria-pressed="'+(wi===editorWeekIndex)+'" aria-label="Woche '+(wi+1)+' · '+attr(item.label)+'">'+(wi+1)+'</button>';});h+='</div>';
 h+='<div class="eddaysettings"><div class="edviewhead"><div class="meta"><h2>Woche '+(editorWeekIndex+1)+' · '+esc(w.label)+'</h2><p>'+esc(editorPhaseLabel(w.phase))+'</p></div></div><div class="edgrid">';
 h+='<label class="edfield">'+editorLabel("Wie soll trainiert werden?","phase")+'<select data-ed-week="'+editorWeekIndex+'" data-ed-field="phase">'+editorOption('aufbau','Aufbau · normal steigern',w.phase)+editorOption('intensiv','Intensiv · schwerer trainieren',w.phase)+editorOption('deload','Erholungswoche · bewusst leichter',w.phase)+'</select></label>';
 h+=editorInput('Name der Woche',w.label,'data-ed-week="'+editorWeekIndex+'" data-ed-field="label"',{max:30});
 h+='<label class="edfield wide">'+editorLabel("Anstrengung","rir")+'<select data-ed-week="'+editorWeekIndex+'" data-ed-field="rir">'+editorRirOptions(w.rir)+'</select></label>';
 h+='</div><div class="edphasehelp"><b>'+esc(editorPhaseLabel(w.phase))+':</b> '+esc(editorPhaseHelp(w.phase))+'</div>';
 h+='<div class="edgrid">'+editorInput('Hinweis für diese Woche',w.note||'','data-ed-week="'+editorWeekIndex+'" data-ed-field="note"',{wide:true,area:true,max:200})+'</div>';
 h+='<details class="edadvanced"'+editorSectionAttrs("weeksets")+'><summary>Satzzahlen der Trainingsgruppen</summary><div class="edbody"><div class="libnote" style="margin:0 0 9px">Hier legst du fest, wie viele Sätze eine Trainingsgruppe in dieser Woche bekommt. Eigene Übungsvorgaben bleiben davon unberührt.</div><div class="edgrid">';
 catKeys.forEach(function(key){h+=editorInput('Sätze · '+d.categories[key].label,w.sets[key]==null?'':w.sets[key],'data-ed-week="'+editorWeekIndex+'" data-ed-set="'+attr(key)+'"',{type:'number',min:1,max:LIMITS.maxSets,step:'1'});});
 h+='</div></div></details><div class="edactions"><button class="smallbtn" data-ed-copyweek="'+editorWeekIndex+'">Woche duplizieren</button><span class="spacer"></span><button class="smallbtn del" data-ed-delweek="'+editorWeekIndex+'"'+(d.weeks.length<=1?' disabled':'')+'>Woche löschen</button></div></div>';
 return h;
}
function renderEditorDetails(d,catKeys){
 var h='<div class="edguide"><div><strong>Name und Trainingsgruppen</strong>Den Programmnamen kannst du nur noch hier ändern. Trainingsgruppen liefern gemeinsame Standardwerte für ähnliche Übungen.</div></div><div class="eddaysettings"><div class="edgrid">';
 h+=editorInput('Programmname',d.name,'data-ed-program="name"',{wide:true,max:LIMITS.maxNameLen});
 h+=editorInput('Beschreibung (optional)',d.description||'','data-ed-program="description"',{wide:true,area:true,max:200});
 h+='<label class="edfield">'+editorLabel("Untertitel")+'<input type="text" value="'+attr(d.art||'')+'" data-ed-program="art" maxlength="24"><small>Zum Beispiel „Einsteiger“ – steht unter dem Programmnamen.</small></label>';
 h+='<label class="edfield">'+editorLabel("Bereich")+'<select data-ed-program="bereich"><option value=""'+(d.bereich?'':' selected')+'>Kein Bereich</option>';BEREICHE.forEach(function(b){h+=editorOption(b,b,d.bereich);});h+='</select><small>Einordnung für die Programm-Bibliothek.</small></label>';
 h+='</div></div>';
 h+='<details class="edadvanced"'+editorSectionAttrs("groups")+'><summary><span class="edlabel"><button type="button" class="infoterm" data-info="gruppe" aria-label="Erklärung: Trainingsgruppen">Trainingsgruppen ('+catKeys.length+')</button></span></summary><div class="edbody"><div class="edcategoryhelp"><b>Was ist eine Trainingsgruppe?</b><br>Sie bündelt Standardwerte für ähnliche Übungen – zum Beispiel „Kraft“ mit längerer Satzpause und 5–7 Wiederholungen. Änderungen gelten für alle Übungen der Gruppe, außer eine Übung hat eine eigene Vorgabe.</div>';
 catKeys.forEach(function(key){var c=d.categories[key],hasReps=!!c.reps;h+='<details class="edcard"'+editorSectionAttrs("category-"+key)+'><summary>'+esc(c.label)+' <span class="edkey">'+esc(key)+'</span></summary><div class="edbody"><div class="edgrid">';
  h+=editorInput('Bezeichnung',c.label,'data-ed-cat="'+attr(key)+'" data-ed-field="label"',{max:30});
  h+='<label class="edfield">'+editorLabel("Farbe")+'<select data-ed-cat="'+attr(key)+'" data-ed-field="color">';CAT_COLORS.forEach(function(color){h+=editorOption(color,color,c.color);});h+='</select></label>';
  h+=editorInput('Satzpause (Sek.)',c.rest,'data-ed-cat="'+attr(key)+'" data-ed-field="rest"',{type:'number',min:15,max:600,step:'1'});
  h+='<label class="edfield">'+editorLabel("Wiederholungsbereiche")+'<span class="edcheck"><input type="checkbox" data-ed-reps="'+attr(key)+'"'+(hasReps?' checked':'')+'> Automatisch festlegen</span></label>';
  if(hasReps){[["aufbau","Aufbau"],["intensiv","Intensiv"],["deload","Erholung"]].forEach(function(item){var range=c.reps[item[0]]||[8,12];h+=editorInput(item[1]+' min.',range[0],'data-ed-cat="'+attr(key)+'" data-ed-rep="'+item[0]+'" data-ed-range="0"',{type:'number',min:1,max:100,step:'1'});h+=editorInput(item[1]+' max.',range[1],'data-ed-cat="'+attr(key)+'" data-ed-rep="'+item[0]+'" data-ed-range="1"',{type:'number',min:1,max:100,step:'1'});});}
  h+='</div><div class="edactions"><span class="edkey">Technischer Schlüssel: '+esc(key)+'</span><span class="spacer"></span><button class="smallbtn del" data-ed-delcat="'+attr(key)+'"'+((catKeys.length<=1||editorCategoryInUse(d,key))?' disabled':'')+'>Trainingsgruppe löschen</button></div></div></details>';});
 h+='<div class="edactions"><button class="smallbtn" id="edaddcat"'+(catKeys.length>=20?' disabled':'')+'>'+icon("plus")+' Trainingsgruppe</button></div></div></details>';
 var srcProgram=editorSourceId?S.programs[editorSourceId]:null;
 if(srcProgram){
  var edCreated=typeof srcProgram.createdAt==="number"&&isFinite(srcProgram.createdAt)?new Date(srcProgram.createdAt).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):null;
  var edUpdated=typeof srcProgram.updatedAt==="number"&&isFinite(srcProgram.updatedAt)?new Date(srcProgram.updatedAt).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):null;
  if(edCreated||edUpdated)h+='<div class="libnote" style="margin:10px 0 0">'+(edCreated?'Erstellt am '+edCreated:'')+(edCreated&&edUpdated?' · ':'')+(edUpdated?'Zuletzt geändert am '+edUpdated:'')+'</div>';
 }
 h+='<div class="libnote">Beim Speichern prüft Satzkraft den gesamten Plan. Einstellungen aus dem KI-Import sowie Warm-up und Cool-down bleiben erhalten.</div>';
 return h;
}
function renderProgramEditor(view,index,exercise){
 if(!editorDraft)return;
 if(view){if(view==="days")view="training";if(view==="categories"||view==="program")view="details";editorView=view;}
 if(index!=null){if(editorView==="training")editorDayIndex=index;if(editorView==="weeks")editorWeekIndex=index;}
 if(exercise!==undefined)editorExerciseIndex=exercise;
 var d=editorDraft,catKeys=Object.keys(d.categories),editingClass=(editorView==="training"&&editorExerciseIndex!=null?' editing-exercise':''),h='<div class="libbox editorbox'+editingClass+'"><div class="ohdr"><button class="iconbtn" id="editorback" aria-label="Zurück">'+icon("chevron-left")+'</button><h1>'+(editorSourceId?'Programm bearbeiten':'Programm erstellen')+'</h1><button class="edundo" id="editorundo"'+(editorUndoStack.length?'':' disabled')+' aria-label="Letzte Änderung rückgängig machen">'+icon("undo")+' <span>Rückgängig</span></button><button class="edtophelp" id="editorhelp" aria-label="Anleitung öffnen">Anleitung</button><button class="iconbtn" id="libclose" aria-label="Schließen">'+icon("close")+'</button></div>';
 h+='<div class="edtabs" role="tablist" aria-label="Editor-Bereiche"><button class="edtab'+(editorView==="training"?' active':'')+'" data-ed-tab="training" role="tab" aria-selected="'+(editorView==="training")+'">Training</button><button class="edtab'+(editorView==="weeks"?' active':'')+'" data-ed-tab="weeks" role="tab" aria-selected="'+(editorView==="weeks")+'">Wochen</button><button class="edtab'+(editorView==="details"?' active':'')+'" data-ed-tab="details" role="tab" aria-selected="'+(editorView==="details")+'">Details</button></div>';
 h+=editorView==="weeks"?renderEditorWeeks(d,catKeys):editorView==="details"?renderEditorDetails(d,catKeys):renderEditorTraining(d,catKeys);
 h+=editorSourceId?'<div class="edsticky"><button class="smallbtn go" id="edsavecopy">Als Kopie speichern</button>'+(editorSourceId!=="default"?'<button class="smallbtn" id="edreplace">Original ersetzen</button>':'')+'</div>':'<div class="edsticky"><button class="smallbtn" id="edsavenew">Nur speichern</button><button class="smallbtn go" id="edsavenewactive">Speichern &amp; aktivieren</button></div>';
 document.getElementById("lib").innerHTML=h+'</div>';
 editorApplyAllFieldWarnings();
}
function showEditorHelp(){showModal("So funktioniert der Editor","<b>Training:</b> Hier baust du die Trainingstage. Tag oben auswählen, Übung mit ‚Bearbeiten‘ öffnen, Werte einstellen. Reihenfolge ändern: Punkt-Griff rechts halten und ziehen – oder ‚Nach oben/unten‘ in der geöffneten Übung. Einen Tag verschiebst du, indem du ihn in der Wochenleiste hältst und auf einen anderen Wochentag ziehst.<br><br><b>Wochen:</b> Jede Woche hat einen Schwerpunkt (Aufbau, Intensiv, Erholung) und eine Anstrengung (RIR). Die Satzzahlen der Trainingsgruppen brauchst du nur, wenn Wochen unterschiedlich viele Sätze haben sollen.<br><br><b>Details:</b> Name, optional Beschreibung, Untertitel und Bereich sowie die Trainingsgruppen des Programms.<br><br><b>Überall gilt:</b> Gepunktet unterstrichene Begriffe erklären die jeweilige Einstellung. ‚Rückgängig‘ oben nimmt jeden Schritt zurück. Mit ‚Als Kopie speichern‘ bleiben Original und bisheriger Fortschritt unangetastet. „Original ersetzen“ übernimmt deine Änderungen in das laufende Programm – dein bisheriger Fortschritt bleibt erhalten.",[{label:"OK",cls:"primary",action:null}]);}
function editorFieldValue(t){return t.type==="checkbox"?t.checked:(t.type==="number"?(t.value===""?"":Number(t.value)):t.value);}
// Live-Hinweise: melden Werte, die parseProgram beim Speichern ablehnen würde, direkt am Feld.
function editorFieldWarning(t){
 if(!editorDraft||!t||!t.dataset)return"";
 var d=editorDraft,f=t.dataset.edField;
 function ganz(v,min,max){return typeof v==="number"&&isFinite(v)&&Math.floor(v)===v&&v>=min&&v<=max;}
 if(t.dataset.edSet!=null&&t.dataset.edWeek!=null){var wk=d.weeks[+t.dataset.edWeek],sv=wk&&wk.sets?wk.sets[t.dataset.edSet]:null;if(sv==null||sv==="")return editorCategoryInUse(d,t.dataset.edSet)?"Diese Gruppe braucht hier eine Satzzahl.":"";return ganz(sv,1,LIMITS.maxSets)?"":"Ganze Zahl von 1 bis "+LIMITS.maxSets+".";}
 if(t.dataset.edRep){var rc=d.categories[t.dataset.edCat],range=rc&&rc.reps&&rc.reps[t.dataset.edRep];if(!Array.isArray(range))return"";if(!ganz(range[0],1,100)||!ganz(range[1],1,100))return"Ganze Zahlen von 1 bis 100.";return range[0]>range[1]?"Min. ist größer als Max. – bitte Werte tauschen.":"";}
 if(t.dataset.edCat&&f==="rest"){var rcat=d.categories[t.dataset.edCat];return rcat&&ganz(rcat.rest,15,600)?"":"Pause bitte zwischen 15 und 600 Sekunden.";}
 if(t.dataset.edEx!=null&&t.dataset.edDay!=null){
  var day=d.days[+t.dataset.edDay],ex=day&&day.exercises[+t.dataset.edEx];if(!ex)return"";
  if(f==="sets")return ex.sets==null||ganz(ex.sets,1,LIMITS.maxSets)?"":"Ganze Zahl von 1 bis "+LIMITS.maxSets+".";
  if(f==="repMin"||f==="repMax"){var r=ex.reps,repMax=ex.unit==="seconds"?SET_TIME_MAX_SECONDS:SET_REP_MAX;if(!Array.isArray(r))return"";if(!ganz(r[0],1,repMax)||!ganz(r[1],1,repMax))return"Ganze Zahlen von 1 bis "+repMax+" eintragen.";return r[0]>r[1]?"Min. ist größer als Max. – bitte Werte tauschen.":"";}
  if(f==="startWeight")return ex.startWeight==null||(ex.startWeight!==""&&typeof ex.startWeight==="number"&&isFinite(ex.startWeight)&&ex.startWeight>=0&&ex.startWeight<=2000)?"":"Wert zwischen 0 und 2000 kg.";
  if(f==="increment")return ex.increment==null||(ex.increment!==""&&typeof ex.increment==="number"&&isFinite(ex.increment)&&ex.increment>=0.1&&ex.increment<=100)?"":"Steigerung: 0,1 bis 100 kg.";
 }
 return"";
}
function editorApplyFieldWarningOne(t){
 var box=t&&t.closest?t.closest(".edfield"):null;if(!box)return;
 var msg=editorFieldWarning(t),note=box.querySelector(".edfieldwarn");
 if(msg){if(!note){note=document.createElement("div");note.className="edfieldwarn";note.id="edfieldwarn-"+(++editorWarningSerial);note.setAttribute("role","status");note.setAttribute("aria-live","polite");box.appendChild(note);}note.textContent=msg;t.setAttribute("aria-invalid","true");t.setAttribute("aria-describedby",note.id);}
 else{t.removeAttribute("aria-invalid");if(note){if(t.getAttribute("aria-describedby")===note.id)t.removeAttribute("aria-describedby");note.parentNode.removeChild(note);}}
}
function editorRefreshFieldWarnings(t){
 if(!t||!t.dataset)return;
 editorApplyFieldWarningOne(t);
 var sel=null;
 if(t.dataset.edField==="repMin"||t.dataset.edField==="repMax")sel='input[data-ed-day="'+t.dataset.edDay+'"][data-ed-ex="'+t.dataset.edEx+'"][data-ed-field="'+(t.dataset.edField==="repMin"?"repMax":"repMin")+'"]';
 else if(t.dataset.edRep)sel='input[data-ed-cat="'+t.dataset.edCat+'"][data-ed-rep="'+t.dataset.edRep+'"][data-ed-range="'+(t.dataset.edRange==="0"?"1":"0")+'"]';
 if(sel){var partner=document.querySelector("#lib "+sel);if(partner)editorApplyFieldWarningOne(partner);}
}
function editorApplyAllFieldWarnings(){
 var root=document.getElementById("lib");if(!root||!editorDraft)return;
 var fields=root.querySelectorAll('.edfield input[type="number"]');
 for(var i=0;i<fields.length;i++)editorApplyFieldWarningOne(fields[i]);
}
function updateEditorInput(t){
 if(!editorDraft)return false;var value=editorFieldValue(t);
 if(t.dataset.edProgram){var pf=t.dataset.edProgram;if((pf==="art"||pf==="bereich")&&(typeof value!=="string"||!value.trim()))delete editorDraft[pf];else editorDraft[pf]=value;return false;}
 if(t.dataset.edOwn){var ownDay=editorDraft.days[+t.dataset.edDay],ownEx=ownDay&&ownDay.exercises[+t.dataset.edEx];if(!ownEx)return false;if(value){if(ownEx.sets==null&&!Array.isArray(ownEx.reps)){ownEx.sets=editorDraftSets(editorDraft,ownEx,editorWeekIndex);ownEx.reps=editorDraftReps(editorDraft,ownEx,editorWeekIndex)||editorTargetReps(ownEx)||[8,12];}}else{delete ownEx.sets;delete ownEx.reps;}return true;}
 if(t.dataset.edReps){var rc=editorDraft.categories[t.dataset.edReps];if(!rc)return false;rc.reps=t.checked?{aufbau:[8,12],intensiv:[6,10],deload:[10,10]}:null;return true;}
 if(t.dataset.edCat){var c=editorDraft.categories[t.dataset.edCat];if(!c)return false;if(t.dataset.edRep){if(!c.reps)c.reps={};if(!c.reps[t.dataset.edRep])c.reps[t.dataset.edRep]=[8,12];c.reps[t.dataset.edRep][+t.dataset.edRange]=value;}else c[t.dataset.edField]=value;return false;}
 if(t.dataset.edWeek!=null){var w=editorDraft.weeks[+t.dataset.edWeek];if(!w)return false;if(t.dataset.edSet)w.sets[t.dataset.edSet]=value;else if(t.dataset.edField==="phase"){var oldPhase=w.phase,defaults={aufbau:["Aufbau"],intensiv:["Intensiv","Intensivierung"],deload:["Deload","Erholungswoche"]};w.phase=value;if((defaults[oldPhase]||[]).indexOf(w.label)>=0)w.label=editorPhaseLabel(value);}else w[t.dataset.edField]=value;return false;}
 if(t.dataset.edWucd){var timedDay=editorDraft.days[+t.dataset.edDay],timedList=timedDay&&timedDay[t.dataset.edWucd],timedItem=timedList&&timedList[+t.dataset.edWucdIndex];if(!timedItem)return false;timedItem[t.dataset.edField]=t.dataset.edField==="seconds"?Math.max(15,Math.min(180,Math.round(Number(value)||15))):value;return false;}
 if(t.dataset.edDay!=null){var day=editorDraft.days[+t.dataset.edDay];if(!day)return false;if(t.dataset.edEx!=null){var ex=day.exercises[+t.dataset.edEx],field=t.dataset.edField;if(!ex)return false;if(field==="repMin"||field==="repMax"){var repIdx=(field==="repMin"?0:1);if(!Array.isArray(ex.reps)){var inhReps=editorDraftReps(editorDraft,ex,editorWeekIndex)||[8,12];if(Number(value)!==inhReps[repIdx])ex.reps=inhReps.slice();}if(Array.isArray(ex.reps))ex.reps[repIdx]=value;}else if(field==="sets"){if(value===""||value==null)delete ex.sets;else if(ex.sets!=null||Number(value)!==editorDraftSets(editorDraft,ex,editorWeekIndex))ex.sets=value;}else if(field==="perSide"){if(value)ex.perSide=true;else delete ex.perSide;return true;}else if(field==="exerciseType"){if(value==="custom")return false;if(value==="weight"||value==="added_weight"){ex.weighted=true;delete ex.unit;delete ex.timerMode;ex.increment=ex.increment||2.5;if(ex.startWeight==null)ex.startWeight=0;if(value==="added_weight")ex.bodyweight=true;else delete ex.bodyweight;}else{delete ex.weighted;delete ex.bodyweight;delete ex.increment;delete ex.startWeight;if(value==="seconds"){ex.unit="seconds";if(!ex.timerMode)ex.timerMode="target";}else{delete ex.unit;delete ex.timerMode;}}return true;}else ex[field]=value;}else day[t.dataset.edField]=value;return false;}
 return false;
}
function editorAddCategory(){var key=editorNextCategoryKey(editorDraft.categories);editorDraft.categories[key]={label:"Neue Trainingsgruppe",color:"slate",rest:90};editorDraft.weeks.forEach(function(w){w.sets[key]=3;});return Object.keys(editorDraft.categories).indexOf(key);}
function editorDeleteCategory(key){if(!editorDraft.categories[key]||editorCategoryInUse(editorDraft,key)||Object.keys(editorDraft.categories).length<=1)return;delete editorDraft.categories[key];editorDraft.weeks.forEach(function(w){delete w.sets[key];});}
function editorAddWeek(copyIndex){var cats=Object.keys(editorDraft.categories),source=(copyIndex!=null?editorDraft.weeks[copyIndex]:editorDraft.weeks[editorDraft.weeks.length-1]),w;if(source)w=cloneJSON(source);else{var sets={};cats.forEach(function(k){sets[k]=3;});w={n:1,phase:"aufbau",label:"Aufbau",rir:"2",note:"",sets:sets};}editorDraft.weeks.push(w);editorRenumberWeeks(editorDraft);return editorDraft.weeks.length-1;}
function editorAddDay(){var key=editorNextDayKey(editorDraft.days),used={};editorDraft.days.forEach(function(d){used[d.weekday]=1;});var wd=EDITOR_WEEKDAYS.filter(function(x){return !used[x];})[0]||"Montag",cat=Object.keys(editorDraft.categories)[0];editorDraft.days.push({key:key,weekday:wd,title:"Neuer Trainingstag",exercises:[{name:"Neue Übung",category:cat,unit:"reps",sets:3,reps:[8,12]}]});return editorDraft.days.length-1;}
function editorAddExercise(dayIndex){var cat=Object.keys(editorDraft.categories)[0],exs=editorDraft.days[dayIndex].exercises;exs.push({name:"Neue Übung",category:cat,unit:"reps",sets:3,reps:[8,12]});}
function editorMoveExercise(dayIndex,exIndex,direction){var exs=editorDraft.days[dayIndex].exercises,to=exIndex+direction;if(to<0||to>=exs.length)return;var x=exs.splice(exIndex,1)[0];exs.splice(to,0,x);}
function editorMoveExerciseToGap(dayIndex,fromIndex,targetIndex,position){
 var exs=editorDraft.days[dayIndex].exercises;if(fromIndex<0||targetIndex<0||fromIndex>=exs.length||targetIndex>=exs.length)return null;
 var insertAt=targetIndex+(position==="after"?1:0);if(fromIndex<insertAt)insertAt--;if(insertAt===fromIndex)return null;
 var x=exs.splice(fromIndex,1)[0];exs.splice(insertAt,0,x);return insertAt;
}
function editorMoveExerciseTo(dayIndex,fromIndex,toIndex){return editorMoveExerciseToGap(dayIndex,fromIndex,toIndex,toIndex>fromIndex?"after":"before")!=null;}
function editorApplyExerciseOrder(dayIndex,order){
 var day=editorDraft.days[dayIndex],exs=day&&day.exercises;if(!exs||!Array.isArray(order)||order.length!==exs.length)return false;
 var seen=Object.create(null);for(var i=0;i<order.length;i++){var n=order[i];if(n<0||n>=exs.length||seen[n])return false;seen[n]=1;}
 var changed=order.some(function(n,index){return n!==index;});if(!changed)return false;
 day.exercises=order.map(function(index){return exs[index];});return true;
}
function editorDayIndexAtWeekday(weekdayIndex,exceptIndex){var weekday=EDITOR_WEEKDAYS[weekdayIndex],found=null;editorDraft.days.forEach(function(day,di){if(di!==exceptIndex&&day.weekday===weekday)found=di;});return found;}
function editorMoveDayToWeekday(dayIndex,weekdayIndex,allowSwap){var day=editorDraft.days[dayIndex],newWeekday=EDITOR_WEEKDAYS[weekdayIndex];if(!day||!newWeekday||day.weekday===newWeekday)return false;var oldWeekday=day.weekday,otherIndex=editorDayIndexAtWeekday(weekdayIndex,dayIndex);if(otherIndex!=null&&!allowSwap)return false;day.weekday=newWeekday;if(otherIndex!=null)editorDraft.days[otherIndex].weekday=oldWeekday;return true;}
function confirmEditorDaySwap(dayIndex,weekdayIndex){
 var source=editorDraft.days[dayIndex],otherIndex=editorDayIndexAtWeekday(weekdayIndex,dayIndex),target=otherIndex==null?null:editorDraft.days[otherIndex];if(!source||!target)return;
 showModal("Trainingstage tauschen?","Auf <b>"+esc(EDITOR_WEEKDAYS[weekdayIndex])+"</b> liegt bereits „"+esc(target.title||target.key)+"“. Möchtest du <b>"+esc(source.weekday)+" · "+esc(source.title||source.key)+"</b> und <b>"+esc(target.weekday)+" · "+esc(target.title||target.key)+"</b> miteinander tauschen?",[{label:"Tage tauschen",cls:"primary",action:function(){editorPushUndo("Trainingstage getauscht");if(editorMoveDayToWeekday(dayIndex,weekdayIndex,true)){editorDayIndex=dayIndex;editorExerciseIndex=null;renderProgramEditor("training",dayIndex,null);}else editorUndoStack.pop();}},{label:"Nicht tauschen",action:null}]);
}
function confirmEditorDeleteWeek(index){
 var week=editorDraft.weeks[index];if(!week||editorDraft.weeks.length<=1)return;
 showModal("Woche wirklich löschen?","Woche "+(index+1)+" · <b>"+esc(week.label)+"</b> wird aus dem Programm entfernt. Du kannst den Schritt anschließend im Editor rückgängig machen.",[{label:"Woche löschen",cls:"danger",action:function(){editorPushUndo("Woche gelöscht");editorDraft.weeks.splice(index,1);editorRenumberWeeks(editorDraft);editorWeekIndex=Math.max(0,index-1);renderProgramEditor("weeks",editorWeekIndex);}},{label:"Abbrechen",action:null}]);
}
function confirmEditorDeleteDay(index){
 var day=editorDraft.days[index];if(!day||editorDraft.days.length<=1)return;
 if(editorSourceId&&S.programs[editorSourceId]){var sourceProgram=S.programs[editorSourceId],store=S.store[editorSourceId]||newStore(sourceProgram),completed=false;for(var completedWeek=1;completedWeek<=sourceProgram.weeks.length&&!completed;completedWeek++)completed=programUnitComplete(sourceProgram,store,completedWeek,day.key);if(completed){showModal("Trainingstag bleibt erhalten","Dieser Trainingstag hat bereits mindestens eine abgeschlossene Einheit. Damit dein Protokoll vollständig und verständlich bleibt, kann der Tag nicht gelöscht werden.",[{label:"OK",cls:"primary",action:null}]);return;}}
 showModal("Trainingstag wirklich löschen?","<b>"+esc(day.weekday+" · "+(day.title||day.key))+"</b> und seine "+day.exercises.length+" Übungen werden aus dem Programm entfernt. Du kannst den Schritt anschließend rückgängig machen.",[{label:"Trainingstag löschen",cls:"danger",action:function(){editorPushUndo("Trainingstag gelöscht");editorDraft.days.splice(index,1);editorDayIndex=Math.max(0,index-1);editorExerciseIndex=null;renderProgramEditor("days",editorDayIndex,null);}},{label:"Abbrechen",action:null}]);
}
function clearEditorDropTargets(){var root=document.getElementById("lib");if(!root)return;root.querySelectorAll(".eddaytarget,.live-reordered").forEach(function(el){el.classList.remove("eddaytarget","live-reordered");});}
function clearEditorDragTargets(){var root=document.getElementById("lib");if(!root)return;clearEditorDropTargets();root.querySelectorAll(".dragging-source").forEach(function(el){el.classList.remove("dragging-source");});root.querySelectorAll("[data-ed-drag-original]").forEach(function(el){delete el.dataset.edDragOriginal;});var box=root.querySelector(".editorbox");if(box)box.classList.remove("dragging");}
function editorRenumberPreviewCards(root){if(!root)return;root.querySelectorAll(".edexercise[data-ed-ex-card]").forEach(function(card,index){var number=card.querySelector(".edordernum");if(number)number.textContent=index+1;});}
function editorPreviewExerciseMove(drag,target,position){
 var source=document.querySelector("#lib .edexercise.dragging-source");if(!source||!target||source===target||source.parentNode!==target.parentNode)return false;
 var parent=source.parentNode,before=position==="before"?target:target.nextSibling;if(before===source||source.nextSibling===before)return false;
 parent.insertBefore(source,before);target.classList.remove("live-reordered");void target.offsetWidth;target.classList.add("live-reordered");
 editorRenumberPreviewCards(parent);var cards=Array.prototype.slice.call(parent.querySelectorAll(".edexercise[data-ed-ex-card]"));drag.previewOrder=cards.map(function(card){return Number(card.dataset.edDragOriginal);});drag.previewIndex=drag.previewOrder.indexOf(drag.source);drag.previewMoved=true;return true;
}
function activateEditorDrag(){
 var drag=editorDragState;if(!drag||drag.active)return;drag.active=true;var box=document.querySelector("#lib .editorbox"),source=drag.type==="exercise"?drag.handle.closest("[data-ed-ex-card]"):drag.handle;
 if(box)box.classList.add("dragging");if(source)source.classList.add("dragging-source");
 if(drag.type==="exercise"){var cards=document.querySelectorAll("#lib .edexercise[data-ed-ex-card]");cards.forEach(function(card){card.dataset.edDragOriginal=card.dataset.edExCard;});drag.previewOrder=Array.prototype.map.call(cards,function(card){return Number(card.dataset.edDragOriginal);});drag.previewIndex=drag.source;}
 if(navigator.vibrate)try{navigator.vibrate(18);}catch(err){}
}
function finishEditorDrag(e,cancelled){
 var drag=editorDragState;if(!drag)return;if(drag.timer)clearTimeout(drag.timer);if(drag.handle&&drag.handle.releasePointerCapture)try{drag.handle.releasePointerCapture(drag.pointerId);}catch(err){}
 var changed=false,swapRequest=null;if(drag.active&&!cancelled){if(drag.type==="exercise"&&drag.previewOrder){editorPushUndo("Übung verschoben");changed=editorApplyExerciseOrder(drag.day,drag.previewOrder);if(!changed)editorUndoStack.pop();else editorExerciseIndex=null;}else if(drag.type==="day"&&drag.target!=null){var occupied=editorDayIndexAtWeekday(drag.target,drag.source);if(occupied!=null)swapRequest={day:drag.source,weekday:drag.target};else{editorPushUndo("Trainingstag verschoben");changed=editorMoveDayToWeekday(drag.source,drag.target,false);if(!changed)editorUndoStack.pop();if(changed)editorDayIndex=drag.source;}}}
 if(drag.active)editorSuppressClickUntil=Date.now()+650;editorDragState=null;clearEditorDragTargets();if(drag.type==="exercise"&&drag.active)renderProgramEditor();else if(changed)renderProgramEditor();else if(swapRequest)confirmEditorDaySwap(swapRequest.day,swapRequest.weekday);
}
function syncEditorForm(){
 var root=document.getElementById("lib");if(!root||!editorDraft)return;
 var fields=root.querySelectorAll("[data-ed-program],[data-ed-reps],[data-ed-cat],[data-ed-week],[data-ed-day],[data-ed-wucd]");
 for(var i=0;i<fields.length;i++)if(/^(INPUT|SELECT|TEXTAREA)$/.test(fields[i].tagName))updateEditorInput(fields[i]);
}
function resetProgramEditorState(){editorDraft=null;editorSourceId=null;editorInitialJSON="";editorView="training";editorDayIndex=0;editorWeekIndex=0;editorExerciseIndex=null;editorUndoStack=[];editorUndoField=null;editorDragState=null;editorUnsavedDraft=false;editorReturnView="library";editorOpenSections={};editorPendingReplacementRefs={};editorRenameChoices={};}
function editorHasUnsavedChanges(){if(!editorDraft)return false;syncEditorForm();return editorUnsavedDraft||JSON.stringify(editorDraft)!==editorInitialJSON;}
function finishEditorSave(exitMode){if(exitMode==="back"){resetProgramEditorState();renderLib();}else closeLib(true);}
function discardEditorAndReturn(exitMode){var target=editorReturnView,hadPending=editorHasPendingReplacements();resetProgramEditorState();if(hadPending)clearPendingReplacementRequests();if(exitMode==="close")closeLib(true);else if(target==="preview"&&pendingProgramImport)renderImportPreview();else renderLib();if(hadPending)finishPendingReplacementFlow();}
function confirmEditorExit(exitMode){
 var isNew=!editorSourceId,pendingContext=editorHasPendingReplacements(),replaceOriginal=!isNew&&(editorSourceId!=="default"||pendingContext),saveLabel=isNew?"Speichern & aktivieren":replaceOriginal?"Original ersetzen":"Als Kopie speichern";
 showModal("Änderungen noch nicht gespeichert",isNew?"Dieses neue Programm wurde noch nicht gespeichert. Möchtest du es sichern, bevor du den Editor verlässt?":"Du hast dieses Programm verändert. Möchtest du die Änderungen speichern, bevor du den Editor verlässt?",[{label:saveLabel,cls:"primary",action:function(){editorStoreProgram(replaceOriginal,isNew?exitMode:"back",isNew);}},{label:"Änderungen verwerfen",cls:"danger",action:function(){discardEditorAndReturn(exitMode);}},{label:"Weiter bearbeiten",action:null}]);
}
function programNameWithSuffix(base,suffix){var max=LIMITS.maxNameLen||30,room=Math.max(1,max-suffix.length),clean=String(base||"Programm").trim().slice(0,room).trim();return(clean||"P")+suffix;}
function followupBlockName(base,programs){
 var raw=String(base||"Programm").trim(),match=raw.match(/\s·\sBlock\s+(\d+)$/),root=match?raw.slice(0,match.index).trim():raw,next=match?Math.max(2,Number(match[1])+1):2,names=Object.create(null),candidate;
 Object.keys(programs||{}).forEach(function(id){names[String(programs[id].name||"")]=true;});
 do{candidate=programNameWithSuffix(root," · Block "+next);next++;}while(names[candidate]);return candidate;
}
function programRepRange(program,ex,phase){if(Array.isArray(ex.reps))return ex.reps;var cat=program.categories&&program.categories[ex.cat],ranges=cat&&cat.reps;return ranges&&ranges[phase]||null;}
function followupExerciseSessions(program,store,day,ex){
 var sessions=[];for(var w=program.weeks.length;w>=1;w--){var week=program.weeks[w-1];if(week&&week.phase==="deload")continue;var cell=store.logs&&store.logs[w+"|"+day.key+"|"+ex.id];if(cell&&normalizeSwapName(cell.swap))continue;var need=setsForProgramExercise(program,ex,w),sets=cell&&Array.isArray(cell.sets)?cell.sets.slice(0,need):[];if(!sets.some(function(set){return set&&set.reps!==""&&set.reps!=null;}))continue;sessions.push({week:w,phase:week.phase,sets:sets.map(function(set){return{reps:set&&set.reps!=null?set.reps:"",weight:set&&set.weight!=null?set.weight:""};})});}return sessions;
}
function followupStartWeight(program,store,day,ex){
 if(!ex.w)return ex.def;var sessions=followupExerciseSessions(program,store,day,ex);if(!sessions.length)return ex.def;var latest=sessions[0],weights=latest.sets.map(function(set){return set.weight;}).filter(function(value){return value!==""&&value!=null&&isFinite(Number(value));}).map(Number),current=weights.length?Math.min.apply(null,weights):Number(ex.def)||0,rec=calculateNextRecommendation({exercise:ex,settings:getWorkoutSettings(program),repRange:programRepRange(program,ex,latest.phase),currentWeight:current,currentSession:latest.sets,lastSession:sessions[1]&&sessions[1].sets||null,previousSession:sessions[2]&&sessions[2].sets||null,isDeload:false});return rec&&rec.nextWeight!=null?rec.nextWeight:(Number(ex.def)||0);
}
function buildFollowupProgram(program,store,programs){
 var next=JSON.parse(JSON.stringify(program)),createdAt=Date.now(),pending=sanitizePendingReplacements(store&&store.pendingReplacements,program.id,program),replacements=Object.create(null);pending.forEach(function(item){replacements[item.day+"|"+item.exId]=item.name;});next.id=genId();next.code=genProgramCode();next.rev=1;next.name=followupBlockName(program.name,programs);next.parent=program.id;next.createdAt=createdAt;next.updatedAt=createdAt;delete next.archived;
 (next.days||[]).forEach(function(day,di){var oldDay=program.days[di],activeEnd=dayExercisesFor(oldDay,program.weeks.length,{});day.ex=activeEnd.map(function(oldEx){var ex=cloneJSON(oldEx),replacement=replacements[oldDay.key+"|"+oldEx.id];if(replacement)applyPermanentReplacementMetadata(ex,replacement);if(ex.w){var replacementWeight=replacement?replacementStartWeight(store,oldDay.key,oldEx.id,replacement,program.weeks.length):null;ex.def=replacement?(replacementWeight==null?0:round(replacementWeight)):followupStartWeight(program,store,oldDay,oldEx);}delete ex.fromWeek;delete ex.untilWeek;delete ex.prevId;return ex;});});return next;
}
function editorUniqueCopyName(base,programs){
 var names=Object.create(null),counter=1,candidate;
 Object.keys(programs||{}).forEach(function(id){names[String(programs[id].name||"")]=true;});
 do{var suffix=counter===1?" (Kopie)":" (Kopie "+counter+")";candidate=programNameWithSuffix(base,suffix);counter++;}while(names[candidate]);
 return candidate;
}
function returnToProgramList(force){if(!force&&editorHasUnsavedChanges()){confirmEditorExit("back");return;}discardEditorAndReturn("back");}
function editorStoreProgram(replaceOriginal,exitMode,activateNew){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 syncEditorForm();
 if(programWriteLocked()){showProgramWriteLocked();return;}
 if(!editorConfirmReferenceNames(function(){editorStoreProgram(replaceOriginal,exitMode,activateNew);}))return;
 var pendingContext=editorHasPendingReplacements();
 if(replaceOriginal&&editorSourceId&&S.programs[editorSourceId]){
  var renameProgram=S.programs[editorSourceId],renameStore=S.store[editorSourceId]||newStore(renameProgram),oldExercises=Object.create(null);(renameProgram.days||[]).forEach(function(day){(day.ex||[]).forEach(function(ex){oldExercises[ex.id]=ex;});});
  var renameDays=Array.isArray(editorDraft.days)?editorDraft.days:[];for(var rdi=0;rdi<renameDays.length;rdi++)for(var rei=0;rei<renameDays[rdi].exercises.length;rei++){var renameDraft=renameDays[rdi].exercises[rei],renameOld=renameDraft._ref&&oldExercises[renameDraft._ref];if(!renameOld||editorPendingReplacementRefs[renameOld.id]||editorRenameChoices[renameOld.id]||renameOld.exerciseId&&renameDraft.exerciseId||String(renameOld.name).trim()===String(renameDraft.name).trim()||editorExerciseTypeSignature(renameOld)!==editorExternalTypeSignature(renameDraft)||!exerciseHasStoredValues(renameStore,renameOld.id))continue;
   (function(ref,name){showModal("Umbenennung einordnen","Für „"+esc(name)+"“ sind bereits Werte gespeichert. Ist es dieselbe Übung mit neuem Namen oder eine andere Übung?",[{label:"Gleiche Übung, nur umbenannt (Werte behalten)",cls:"primary",action:function(){editorRenameChoices[ref]="same";editorStoreProgram(replaceOriginal,exitMode,activateNew);}},{label:"Andere Übung (alte endet, neue beginnt)",action:function(){editorRenameChoices[ref]="new";editorStoreProgram(replaceOriginal,exitMode,activateNew);}},{label:"Abbrechen",action:null}]);})(renameOld.id,renameOld.name);return;
  }
 }
 var checked=parseProgram(JSON.stringify(editorDraft));if(checked.err){showModal("Programm noch nicht gespeichert",checked.err+"<br><br><span style=\"color:var(--muted)\">Deine Änderungen bleiben im Editor erhalten.</span>",[{label:"Weiter bearbeiten",action:null}]);return;}
 var personal=preparePersonalProgram(checked.prog,!!editorSourceId);if(personal.error){showModal("Programm nicht gespeichert",esc(personal.error),[{label:"Weiter bearbeiten",cls:"primary",action:null}]);return;}var p=personal.program;
 if(!replaceOriginal){var wasNew=!editorSourceId,shouldActivate=wasNew?!!activateNew:false,savedAt=Date.now();if(editorSourceId)p.name=editorUniqueCopyName(p.name,S.programs);while(S.programs[p.id])p.id=genId();p.code=genProgramCode();p.rev=1;p.createdAt=savedAt;p.updatedAt=savedAt;S.programs[p.id]=p;collectPersonalProgramDefinitions(p);S.store[p.id]=newStore(p);if(shouldActivate)setActive(p.id);if(flushSave()===false)return;if(wasNew){pendingProgramImport=null;importIssue=null;}editorUnsavedDraft=false;editorInitialJSON=JSON.stringify(editorDraft);finishEditorSave(exitMode);return;}
 if((editorSourceId==="default"&&!pendingContext)||!S.programs[editorSourceId])return;
 var sourceId=editorSourceId,oldProg=S.programs[sourceId],oldStore=S.store[sourceId]||newStore(oldProg),sourceName=oldProg.name;if(oldProg.parent)p.parent=oldProg.parent;if(oldProg.source)p.source=oldProg.source;if(oldProg.origin)p.origin=oldProg.origin;
 var replaceActions=[{label:pendingContext?"Änderungen übernehmen":"Ersetzen & Fortschritt behalten",cls:"primary",action:function(){var timeline;try{timeline=typeof timelineProgramFromEdit==="function"?timelineProgramFromEdit(oldProg,p,editorDraft,oldStore):p;}catch(error){showModal("Änderung nicht gespeichert",esc(error.message||"Für diese Änderung fehlt eine passende offene Einheit."),[{label:"Weiter bearbeiten",cls:"primary",action:null}]);return;}p=timeline;p.id=sourceId;p.code=oldProg.code||p.code;p.rev=(Number(oldProg.rev)||1)+1;if(typeof oldProg.createdAt==="number"&&isFinite(oldProg.createdAt)&&oldProg.createdAt>=0)p.createdAt=oldProg.createdAt;else delete p.createdAt;p.updatedAt=Date.now();S.programs[sourceId]=p;collectPersonalProgramDefinitions(p);var migrated=migrateReplaceStore(oldProg,oldStore,p,editorBuildRefMap(editorDraft));if(pendingContext)migrated.pendingReplacements=[];S.store[sourceId]=migrated;if(S.active===sourceId){alias(S);refreshPostWorkoutReplacements();}if(flushSave()===false)return;editorInitialJSON=JSON.stringify(editorDraft);finishEditorSave(exitMode);if(S.active===sourceId){renderView();renderBar();}if(pendingContext)finishPendingReplacementFlow();}}];
 if(!pendingContext)replaceActions.push({label:"Ersetzen & Fortschritt zurücksetzen",cls:"danger",action:function(){p.id=sourceId;p.code=oldProg.code||p.code;p.rev=(Number(oldProg.rev)||1)+1;if(typeof oldProg.createdAt==="number"&&isFinite(oldProg.createdAt)&&oldProg.createdAt>=0)p.createdAt=oldProg.createdAt;else delete p.createdAt;p.updatedAt=Date.now();S.programs[sourceId]=p;collectPersonalProgramDefinitions(p);S.store[sourceId]=newStore(p);if(S.active===sourceId){alias(S);refreshPostWorkoutReplacements();}if(flushSave()===false)return;editorInitialJSON=JSON.stringify(editorDraft);finishEditorSave(exitMode);if(S.active===sourceId){renderView();renderBar();}}});
 replaceActions.push({label:"Abbrechen",action:null});
 showModal(pendingContext?"Änderungen übernehmen?":"Original ersetzen?",pendingContext?"Die markierten Übungen werden als neue Programmeinstellung gespeichert. Dein bisheriger Fortschritt und das Protokoll des gerade beendeten Trainings bleiben erhalten.":"„"+esc(sourceName)+"“ wird durch deine bearbeitete Version ersetzt. Dein Fortschritt und vergangene Übungsstände bleiben erhalten; die Änderungen gelten ab der nächsten offenen Einheit.",replaceActions);
}

function programWriteLocked(){return !!S.workout;}
function showProgramWriteLocked(){showModal("Training läuft","Beende zuerst dein Training, um Programme zu bearbeiten, zu aktivieren, zu erstellen, zurückzusetzen oder ein Backup wiederherzustellen.",[{label:"OK",cls:"primary",action:null}]);}
function archiveProgram(id){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 if(programWriteLocked()){showProgramWriteLocked();return false;}var program=S.programs[id];if(!program||program.archived===true)return false;
 if(id===S.active){var replacement=Object.keys(S.programs).filter(function(other){return other!==id&&S.programs[other].archived!==true;})[0];if(!replacement){showModal("Archivieren nicht möglich","Mindestens ein aktives Programm muss außerhalb des Archivs bleiben.",[{label:"OK",cls:"primary",action:null}]);return false;}if(!setActive(replacement))return false;}
 program.archived=true;if(flushSave()===false)return false;renderLib();return true;
}
function unarchiveProgram(id){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;if(programWriteLocked()){showProgramWriteLocked();return false;}var program=S.programs[id];if(!program||program.archived!==true)return false;delete program.archived;if(flushSave()===false)return false;renderArchive();return true;}
function createFollowupBlock(sourceId,libraryReady){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 if(programWriteLocked()){showProgramWriteLocked();return null;}var source=S.programs[sourceId],sourceStore=S.store[sourceId];if(!source||source.archived===true||!sourceStore)return null;if(!programBlockComplete(source,sourceStore.logs,sourceStore.history,sourceStore.removedEx)){showModal("Block noch nicht abgeschlossen","Schließe zuerst alle vorgesehenen Einheiten dieses Blocks ab.",[{label:"OK",cls:"primary",action:null}]);return null;}
 if(!libraryReady&&Array.isArray(sourceStore.pendingReplacements)&&sourceStore.pendingReplacements.length&&typeof EXERCISE_LIBRARY!=="undefined"&&EXERCISE_LIBRARY===null){loadExerciseLibrary().then(function(){createFollowupBlock(sourceId,true);});return null;}
 syncStore();sourceStore=S.store[sourceId];var next=buildFollowupProgram(source,sourceStore,S.programs);while(S.programs[next.id])next.id=genId();if(Array.isArray(sourceStore.pendingReplacements)&&sourceStore.pendingReplacements.length){sourceStore.pendingReplacements=[];if(sourceId===S.active){S.pendingReplacements=[];refreshPostWorkoutReplacements();}}source.archived=true;S.programs[next.id]=next;S.store[next.id]=newStore(next);if(!setActive(next.id)){delete S.programs[next.id];delete S.store[next.id];delete source.archived;return null;}if(flushSave()===false)return null;
 var lib=document.getElementById("lib");if(lib&&lib.classList.contains("open"))closeLib(true);showModal("Folgeblock bereit","„"+esc(next.name)+"“ ist jetzt aktiv. Die empfohlenen Startgewichte basieren auf deinem letzten belastbaren Training; der abgeschlossene Block liegt im Archiv.",[{label:"Los geht's",cls:"primary",action:null}]);return next.id;
}
function programItemHtml(id,p){
 var active=id===S.active,archived=p.archived===true,stores=S.store||{},store=stores[id]||{logs:{},history:[]},completed=typeof programBlockComplete==="function"&&programBlockComplete(p,store.logs,store.history,store.removedEx),locked=programWriteLocked(),lockedAttr=locked?' disabled title="Training läuft – zuerst beenden"':'',badge=completed?'<span class="statuspill complete">Abgeschlossen</span>':'',hasUpdated=typeof p.updatedAt==="number"&&isFinite(p.updatedAt)&&p.updatedAt>=0,hasCreated=typeof p.createdAt==="number"&&isFinite(p.createdAt)&&p.createdAt>=0,origin=p.origin==="satzkraft"?'<span class="programorigin">Offizielles Satzkraft-Programm</span>':'',meta='<div class="pm"><span>'+p.days.length+' '+(p.days.length===1?'Tag':'Tage')+' · '+p.weeks.length+' '+(p.weeks.length===1?'Woche':'Wochen')+'</span>'+origin+'</div>';
 if(archived)return'<div class="progitem archived"><div class="proghead"><div class="meta"><div class="pn">'+esc(p.name)+artSubtitleHtml(p.name,p.art)+'</div>'+meta+'</div>'+badge+'</div><div class="progactions"><button class="progtextaction" data-report-program="'+attr(id)+'">Auswertung ansehen</button><button class="progtextaction" data-unarchive="'+attr(id)+'"'+lockedAttr+'>Aus dem Archiv holen</button></div></div>';
 var artTeil=artSubtitleHtml(p.name,p.art);
 var pad2=function(n){return ('0'+n).slice(-2);};
 var kebab=(active||id!=="default")?'<button type="button" class="kebab progkebab" data-progmenu="'+attr(id)+'" aria-label="Weitere Aktionen für '+attr(p.name)+'">'+icon("more")+'</button>':'';
 if(active){
  var areaChip=p.bereich?'<span class="chip">'+esc(p.bereich)+'</span>':'';
  return '<div class="progitem active"><div class="progtopline"><span class="aktivpill">● Aktiv</span><span class="progweek">Woche '+pad2(S.week)+' / '+pad2(p.weeks.length)+'</span></div><div class="proghead"><div class="meta"><div class="pn">'+esc(p.name)+artTeil+'</div><div class="chiprow" style="margin-top:11px"><span class="chip">'+p.days.length+' '+(p.days.length===1?'Tag':'Tage')+'</span><span class="chip">'+p.weeks.length+' '+(p.weeks.length===1?'Woche':'Wochen')+'</span>'+areaChip+'</div>'+(origin?'<div class="pm" style="margin-top:8px">'+origin+'</div>':'')+'</div>'+badge+kebab+'</div><button class="smallbtn go progresume" id="libresume">'+icon("play")+' Fortsetzen</button><div class="progactions"><button class="progtextaction" data-edit="'+attr(id)+'"'+lockedAttr+'>Bearbeiten</button><button type="button" class="iconbtn sharebtn" id="proshare" aria-label="Programm teilen" title="Teilen">'+icon("share")+'</button>'+(completed?'<button class="progtextaction" data-followup="'+attr(id)+'"'+lockedAttr+'>Folgeblock starten</button>':'')+'<button class="progtextaction progarchiveaction" data-archive="'+attr(id)+'"'+lockedAttr+'>Archivieren</button></div></div>';
 }
 return '<div class="progitem"><div class="proghead"><div class="meta"><div class="pn">'+esc(p.name)+artTeil+'</div>'+meta+'</div>'+badge+kebab+'</div><div class="progactions"><button class="progtextaction" data-sel="'+attr(id)+'" aria-label="Programm '+attr(p.name)+' aktivieren"'+lockedAttr+'>Aktivieren</button><button class="progtextaction" data-edit="'+attr(id)+'"'+lockedAttr+'>Bearbeiten</button>'+(completed?'<button class="progtextaction" data-followup="'+attr(id)+'"'+lockedAttr+'>Folgeblock starten</button>':'')+'<button class="progtextaction progarchiveaction" data-archive="'+attr(id)+'"'+lockedAttr+'>Archivieren</button></div></div>';
}
function showProgramMenu(id){
 var p=S.programs[id];if(!p)return;
 var btns=[];
 if(id===S.active)btns.push({label:icon("undo")+' Fortschritt zurücksetzen',cls:"menu danger",action:function(){confirmReset();}});
 if(id!=="default")btns.push({label:icon("close")+' Programm löschen',cls:"menu danger",action:function(){confirmDeleteProgram(id);}});
 btns.push({label:"Abbrechen",action:null});
 if(btns.length===1)return;
 showModal(esc(p.name),"",btns);
}
function confirmDeleteProgram(id){
 if(programWriteLocked()){showProgramWriteLocked();return;}
 var p=S.programs[id];if(!p||id==="default")return;
 showModal("Programm wirklich löschen?","<b>"+esc(p.name)+"</b> und der gesamte zugehörige Trainingsfortschritt werden dauerhaft gelöscht.",[{label:"Programm löschen",cls:"danger",action:function(){deleteProgram(id);}},{label:"Abbrechen",action:null}]);
}
function showShareModal(){
 showModal("Programm teilen",'„'+esc(PROG().name)+'“ wird ohne deinen Fortschritt geteilt.',[
  {label:"Als Text kopieren",cls:"menu",action:function(){copyWithFeedback(exportCurrentJSON(),"Kopiert","Das Programm liegt als JSON in der Zwischenablage – mit deinen aktuellen Arbeitsgewichten als Startgewichte. Jetzt einer KI geben oder selbst bearbeiten, dann über „Import“ wieder einfügen.","Konnte nicht kopieren. Nutze stattdessen „Als Datei“.");}},
  {label:"Als Datei",cls:"menu",action:function(){downloadText((PROG().name||"programm").replace(/[^a-z0-9]+/gi,"_")+".json",exportCurrentJSON());}},
  {label:"Link teilen",cls:"menu",action:function(){ensureProgramCode(PROG());var eo=exportTranslate(PROG());delete eo._anleitung;var u=location.origin+location.pathname+"#p="+btoa(unescape(encodeURIComponent(JSON.stringify(eo))));copyWithFeedback(u,"Link kopiert","Wer den Link öffnet, bekommt dein Programm zum Laden angeboten (ohne deinen Fortschritt). Bei sehr großen Programmen kann der Link von Messengern gekürzt werden – dann Datei-Export nutzen.","Nutze stattdessen den Datei-Export.");}},
  {label:"Abbrechen",action:null}
 ]);
}
var exerciseLibraryView="",exerciseLibraryQuery="",personalFormSourceId=null,personalReturnView="library",personalDraft=null;
function exerciseSubviewHeader(eyebrow,title,backId){return '<div class="hdr"><div class="ohdr"><button type="button" class="iconbtn" id="'+backId+'" aria-label="Zurück">'+icon("chevron-left")+'</button><div class="ohdrmain"></div><button type="button" class="iconbtn" id="libclose" aria-label="Schließen">'+icon("close")+'</button></div><div class="heroeyebrow">'+esc(eyebrow)+'</div><h1 class="ptitle">'+esc(title)+'</h1></div>';}
