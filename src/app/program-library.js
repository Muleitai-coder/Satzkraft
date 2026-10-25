var pendingProgramImport=null,importInputText="",importSourceName="",importIssue=null,externalAiWish="";
var PROGRAM_LIBRARY=[
 {file:"./programme/gym-ganzkoerper-beginner.json",name:"Gym Ganzkörper",goal:"Kraftbasis & Muskelaufbau",level:"Einsteiger",farbe:"sky",days:3,duration:"50–65 min",description:"Geräte und Kurzhanteln mit bewusst einfacher Übungsauswahl."},
 {file:"./programme/gym-ganzkoerper-fortgeschritten.json",name:"Gym Ganzkörper",goal:"Kraft & Muskelaufbau",level:"Fortgeschritten",farbe:"amber",days:3,duration:"65–80 min",description:"Langhantel-basiertes Ganzkörpertraining für erfahrene Trainierende."},
 {file:"./programme/calisthenics-einstieg.json",name:"Calisthenics",goal:"Körpergewichtskraft",level:"Einsteiger",farbe:"violet",days:3,duration:"40–50 min",description:"Ganzkörpertraining mit Boden, Bank, Stange, Ringen und Band."},
 {file:"./programme/hybrid-gym-calisthenics.json",name:"Hybrid: Gym + Calisthenics",goal:"Kraft & Körperkontrolle",level:"Grundlagenerfahrung",farbe:"emerald",days:3,duration:"60–75 min",description:"Langhantel, Kurzhanteln, Kabelzug und Körpergewicht kombiniert."}
];
function programSourceLabel(origin){return origin==="library"?"Satzkraft-Programm":origin==="link"?"Geteilter Link":origin==="file"?"Datei":"Eingefügtes JSON";}
function calibrationGuideHtml(){
 return'<p><b>So findest du dein Startgewicht (erste Einheit = Kalibrierung)</b></p><ol><li><b>Leicht anfangen:</b> Mach die Übung zuerst mit sehr leichtem Gewicht 8–10-mal sauber – an der Maschine die kleinste sinnvolle Stufe, mit der Langhantel die leere Stange, mit Kurzhanteln ein Paar, das sich mühelos anfühlt.</li><li><b>Herantasten:</b> Erhöhe das Gewicht in 2–3 kurzen Sätzen Schritt für Schritt (Maschine: 1–2 Stufen, Hanteln: 5–10 kg) und mach jeweils nur 3–5 Wiederholungen.</li><li><b>Arbeitsgewicht erkannt:</b> Dein Startgewicht ist das Gewicht, mit dem du die Ziel-Wiederholungen der Übung sauber schaffst und danach noch etwa 3 Wiederholungen übrig hättest. Genau das bedeutet die Anstrengungs-Angabe „RIR 3“ der ersten Wochen.</li><li><b>Eintragen – fertig:</b> Trag dieses Gewicht beim ersten Arbeitssatz ein. Satzkraft übernimmt es für die weiteren Sätze und steigert ab jetzt automatisch, sobald du das obere Wiederholungsziel erreichst.</li></ol><p><b>Im Zweifel leichter starten.</b> Ein zu leichtes Startgewicht holt die Progression in ein bis zwei Wochen von selbst auf – ein zu schweres kostet Technik und Motivation.</p><p><b>Was zählt als Gewicht?</b> Langhantel: das Gesamtgewicht inklusive Stange. Zwei Kurzhanteln: das Gewicht <b>einer</b> Hantel (nicht beide zusammen). Maschine: die Zahl am Steckgewicht. Zusatzgewicht (z. B. Dip-Gürtel): nur das Extra-Gewicht. Wichtig ist, dass du immer gleich einträgst.</p>';
}
function showCalibrationGuide(){showModal("Startgewicht finden",calibrationGuideHtml(),[{label:"Verstanden",cls:"primary",action:null}]);}
function extractSingleJSONObject(text){
 var depth=0,start=-1,inString=false,escaped=false,candidates=[];
 for(var i=0;i<text.length;i++){
  var ch=text.charAt(i);
  if(inString){if(escaped)escaped=false;else if(ch==="\\")escaped=true;else if(ch==='"')inString=false;continue;}
  if(ch==='"'){inString=true;continue;}
  if(ch==="{"){if(depth===0)start=i;depth++;continue;}
  if(ch==="}"&&depth>0){depth--;if(depth===0&&start>=0){var candidate=text.slice(start,i+1);try{JSON.parse(candidate);candidates.push(candidate);}catch(e){}start=-1;}}
 }
 return candidates.length===1?candidates[0]:null;
}
function sanitizeProgramText(text){
 var corrections=[],value=String(text==null?"":text),before=value;
 if(value.charAt(0)==="\uFEFF"){value=value.slice(1);corrections.push("Unsichtbares BOM-Zeichen entfernt");}
 var trimmed=value.trim();if(trimmed!==value){value=trimmed;corrections.push("Leerraum am Anfang oder Ende entfernt");}
 var fence=value.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);if(fence){value=fence[1].trim();corrections.push("Markdown-Codeblock entfernt");}
 var raw,parseError=null;
 try{raw=JSON.parse(value);}catch(e){
  var extracted=extractSingleJSONObject(value);
  if(extracted){value=extracted;corrections.push("Begleittext um das einzige JSON-Objekt entfernt");try{raw=JSON.parse(value);}catch(inner){parseError=inner;}}
  else parseError=e;
 }
 if(parseError||raw===undefined)return{text:value,original:before,corrections:corrections,error:"Kein gültiges JSON: "+(parseError?parseError.message:"Inhalt konnte nicht gelesen werden.")};
 if(raw&&raw.programs&&raw.store)return{text:JSON.stringify(raw),original:before,corrections:corrections,raw:raw,backup:true};
 var weekdayChanged=false,unitChanged=false;
 if(raw&&Array.isArray(raw.days))raw.days.forEach(function(day){
  if(day&&day.weekday!=null){var wd=String(day.weekday).trim().toLowerCase(),wdIndex=WD_MAP[wd];if(wdIndex!=null&&day.weekday!==WD_CANON[wdIndex]){day.weekday=WD_CANON[wdIndex];weekdayChanged=true;}}
  if(day&&Array.isArray(day.exercises))day.exercises.forEach(function(ex){if(ex&&ex.unit==="time"){ex.unit="seconds";unitChanged=true;}if(ex&&ex.exerciseId===undefined&&(ex.timerMode==="target"||ex.timerMode==="max")&&ex.unit!=="seconds"){ex.unit="seconds";unitChanged=true;}});
 });
 if(weekdayChanged)corrections.push("Wochentage eindeutig vereinheitlicht");
 if(unitChanged)corrections.push("Zeiteinheit „time“ eindeutig als Sekunden übernommen");
 return{text:JSON.stringify(raw),original:before,corrections:corrections,raw:raw};
}
function explainProgramError(message,path){
 var text=String(message||"Unbekannter Fehler"),area="Programmstruktur",exercise=text.match(/^Trainingstag „([^”]+)“(?: \(([^)]+)\))?, Übung (?:„([^”]+)“|#(\d+)):\s*(.*)$/),match=text.match(/^Woche\s+(\d+)/i)||text.match(/^Tag\s+([^,:]+)/i)||text.match(/^Kategorie\s+([^,:]+)/i),remedy="Vergleiche diesen Bereich mit der Satzkraft-Vorlage und korrigiere nur den genannten Wert.",technical=path?"JSON-Pfad: "+path+"\nPrüfung: "+text:text;
 if(exercise){area=(exercise[3]?'Übung „'+exercise[3]+'“':'Übung #'+exercise[4])+' · '+exercise[1];text=exercise[5];}
 else if(match)area=/^Woche/i.test(text)?"Woche "+match[1]:/^Tag/i.test(text)?"Trainingstag "+match[1]:"Trainingsgruppe "+match[1];
 else if(/JSON/i.test(text))area="JSON-Datei";else if(/format|Programmversion/i.test(text))area="Dateiformat";else if(/^"name"/i.test(text))area="Programmdetails";else if(/categories|Kategorie/i.test(text))area="Trainingsgruppen";else if(/weeks|Woche/i.test(text))area="Trainingswochen";else if(/days|Trainingstage/i.test(text))area="Trainingstage";
 if(/timerMode.*unit.*seconds/i.test(text)){text="Der Timer-Modus ist gesetzt, die Übung verwendet aber keine Zeiteinheit.";remedy="Öffne die Übung im Editor. Satzkraft stellt die Zeiteinheit auf Sekunden; prüfe dort noch Zielzeit und Timer-Modus.";technical=(path?"JSON-Pfad: "+path+"\n":"")+'Regel: Bei gesetztem "timerMode" muss "unit":"seconds" verwendet werden.';}
 else if(/Kein gültiges JSON/i.test(text))remedy="Prüfe Kommas, Anführungszeichen und schließende Klammern. Der bisherige Inhalt bleibt zum Bearbeiten erhalten.";
 else if(/format|Programmversion/i.test(text))remedy="Nutze die aktuelle Satzkraft-Vorlage mit format „trainings-block“ und Version 2.";
 else if(/^"name"/i.test(text))remedy="Ergänze oben das Feld „name“ mit einem Programmnamen von höchstens 30 Zeichen.";
 else if(/weekday|Wochentag/i.test(text))remedy="Trage einen eindeutigen Wochentag von Montag bis Sonntag ein.";
 else if(/category|Kategorie|categories/i.test(text))remedy="Jede Übung muss auf eine vorhandene Trainingsgruppe verweisen; der Schlüssel muss exakt übereinstimmen.";
 else if(/sets|Sätze/i.test(text))remedy="Trage eine ganze Satzzahl im erlaubten Bereich ein und ergänze verwendete Trainingsgruppen in jeder Woche.";
 else if(/reps|Wiederhol/i.test(text))remedy="Gib Wiederholungen als [Minimum, Maximum] mit aufsteigenden positiven Zahlen an.";
 else if(/exercises|Übung/i.test(text))remedy="Jeder Trainingstag benötigt mindestens eine vollständig benannte Übung mit Trainingsgruppe.";
 return{area:area,message:text,remedy:remedy,technical:technical};
}
function importEditorRepair(raw,message,path){
 var refMatch=String(path||"").match(/^days\[(\d+)\]\.exercises\[(\d+)\]\.exerciseId$/);
 if(raw&&refMatch)return{kind:"exercise-reference",dayIndex:+refMatch[1],exerciseIndex:+refMatch[2]};
 if(!raw||!/timerMode.*unit.*seconds/i.test(String(message||""))||!path)return null;
 var match=String(path).match(/^days\[(\d+)\]\.exercises\[(\d+)\]\.unit$/),dayIndex=match?+match[1]:-1,exerciseIndex=match?+match[2]:-1,ex=raw.days&&raw.days[dayIndex]&&raw.days[dayIndex].exercises&&raw.days[dayIndex].exercises[exerciseIndex];
 return ex&&["target","max"].indexOf(ex.timerMode)>=0&&ex.unit!=="seconds"&&ex.unit!=="time"?{kind:"timer-unit",dayIndex:dayIndex,exerciseIndex:exerciseIndex}:null;
}
function stableStringify(value){
 if(value===null||typeof value!=="object")return JSON.stringify(value);
 if(Array.isArray(value))return"["+value.map(stableStringify).join(",")+"]";
 return"{"+Object.keys(value).sort().map(function(key){return JSON.stringify(key)+":"+stableStringify(value[key]);}).join(",")+"}";
}
function programSignature(program){var out=exportTranslate(program);delete out._anleitung;delete out.code;delete out.revision;return stableStringify(out);}
function findProgramMatches(program){
 var signature=programSignature(program),duplicateId=null,codeIds=[],sameNameIds=[],name=String(program.name||"").trim().toLowerCase(),code=typeof program.code==="string"&&program.code?program.code:null;
 Object.keys(S.programs).forEach(function(id){var existing=S.programs[id];if(existing.archived===true)return;try{if(programSignature(existing)===signature){duplicateId=id;return;}}catch(e){}
  if(code&&existing.code===code)codeIds.push(id);
  if(String(existing&&existing.name||"").trim().toLowerCase()===name)sameNameIds.push(id);});
 return{duplicateId:duplicateId,codeIds:codeIds,sameNameIds:sameNameIds};
}
function prepareProgramImport(text,origin,sourceName){
 if(typeof text!=="string"||!text.length||text.length>5000000)return{error:explainProgramError("Die Datei ist leer oder größer als 5 MB."),sourceText:String(text||""),origin:origin||"json",sourceName:sourceName||""};
 var cleaned=sanitizeProgramText(text);if(cleaned.error)return{error:explainProgramError(cleaned.error),sourceText:text,cleanedText:cleaned.text,corrections:cleaned.corrections,origin:origin||"json",sourceName:sourceName||""};
 if(cleaned.backup)return{backup:cleaned.raw,sourceText:text,cleanedText:cleaned.text,corrections:cleaned.corrections,origin:origin||"json",sourceName:sourceName||""};
 var checked=parseProgram(cleaned.text);if(checked.err)return{error:explainProgramError(checked.err,checked.path),repair:importEditorRepair(cleaned.raw,checked.err,checked.path),sourceText:text,cleanedText:cleaned.text,corrections:cleaned.corrections,origin:origin||"json",sourceName:sourceName||""};
 if(cleaned.raw&&Array.isArray(cleaned.raw.days))cleaned.raw.days.forEach(function(day){(day.exercises||[]).forEach(function(ex){var ref=exerciseReferenceDefinition(ex.exerciseId)||(ex.exerciseDefinition?{name:ex.exerciseDefinition.name}:null);if(ref&&ex.name!==ref.name)cleaned.corrections.push("Übungsname „"+ex.name+"“ weicht von der Zuordnung „"+ref.name+"“ ab; deine Angaben bleiben erhalten.");});});
 var personal=preparePersonalProgram(checked.prog);if(personal.error)return{error:explainProgramError(personal.error),sourceText:text,cleanedText:cleaned.text,corrections:cleaned.corrections,origin:origin||"json",sourceName:sourceName||""};checked.prog=personal.program;
 if(Object.keys(personal.definitions).length)cleaned.corrections.push("Die eingebetteten persönlichen Übungen werden erst beim Speichern in deine Bibliothek übernommen.");
 if(personal.remapped)cleaned.corrections.push("Bereits belegte persönliche Kennungen erhalten in dieser Importkopie neue Kennungen. Vorhandene Übungen und Satzwerte bleiben erhalten.");
 var external=exportTranslate(checked.prog);delete external._anleitung;var matches=findProgramMatches(checked.prog),warnings=[];
 if(matches.duplicateId)warnings.push("Dieses Programm ist bereits vollständig vorhanden.");
 else if(matches.codeIds.length)warnings.push("Dieses Programm gehört zu einem vorhandenen Programm (gleiche Kennung).");
 else if(matches.sameNameIds.length)warnings.push("Ein anderes Programm mit demselben Namen ist bereits vorhanden.");
 return{program:checked.prog,external:external,sourceText:text,cleanedText:cleaned.text,corrections:cleaned.corrections,warnings:warnings,duplicateId:matches.duplicateId,codeIds:matches.codeIds,sameNameIds:matches.sameNameIds,origin:origin||"json",sourceName:sourceName||""};
}
function beginProgramImport(text,origin,sourceName){
 importInputText=String(text||"");importSourceName=sourceName||"";var prepared=prepareProgramImport(importInputText,origin,sourceName);
 if(prepared.backup){var backupErr=validateBackupFile(prepared.backup);if(backupErr){importIssue={error:explainProgramError(backupErr),sourceText:importInputText,corrections:prepared.corrections,origin:origin||"json",sourceName:sourceName||""};renderImportError();return;}confirmBackupRestore(prepared.backup);return;}
 if(prepared.error){pendingProgramImport=null;importIssue=prepared;renderImportError();return;}
 importIssue=null;pendingProgramImport=prepared;renderImportPreview();
}
function repairImportInEditor(){
 var issue=importIssue,repair=issue&&issue.repair;if(!repair||["timer-unit","exercise-reference"].indexOf(repair.kind)<0)return;
 var raw;try{raw=JSON.parse(issue.cleanedText||issue.sourceText);}catch(e){returnFromImportFlow();return;}
 var ex=raw.days&&raw.days[repair.dayIndex]&&raw.days[repair.dayIndex].exercises&&raw.days[repair.dayIndex].exercises[repair.exerciseIndex];if(!ex)return;
 if(repair.kind==="exercise-reference"){openProgramDraft(raw,"import",issue.origin);editorDayIndex=repair.dayIndex;editorExerciseIndex=repair.exerciseIndex;renderProgramEditor("days",repair.dayIndex,repair.exerciseIndex);return;}
 ex.unit="seconds";var prepared=prepareProgramImport(JSON.stringify(raw),issue.origin,issue.sourceName);if(prepared.error){importIssue=prepared;renderImportError();return;}
 prepared.corrections=(prepared.corrections||[]).concat(["Timer-Übung auf die Zeiteinheit Sekunden gestellt"]);pendingProgramImport=prepared;importIssue=null;openProgramDraft(prepared.external,"preview",prepared.origin);editorDayIndex=repair.dayIndex;editorExerciseIndex=repair.exerciseIndex;renderProgramEditor("days",repair.dayIndex,repair.exerciseIndex);
}
function storeImportedProgram(activate,allowDuplicate){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 if(programWriteLocked()){showProgramWriteLocked();return null;}
 var prepared=pendingProgramImport;if(!prepared||!prepared.program)return null;if(prepared.duplicateId&&!allowDuplicate)return null;
 var personal=preparePersonalProgram(prepared.program);if(personal.error){showModal("Programm nicht gespeichert",esc(personal.error),[{label:"OK",cls:"primary",action:null}]);return null;}var p=personal.program;var fromLibrary=prepared.origin==="library",savedAt=Date.now();p.id=genId();while(S.programs[p.id])p.id=genId();
 // Kennung aus dem JSON übernehmen, wenn gültig und noch frei; sonst frisch vergeben (erster Import ohne Kennung).
 var importedCode=(typeof p.code==="string"&&/^[A-Za-z0-9_-]{4,24}$/.test(p.code))?p.code:null,codeFree=importedCode&&!Object.keys(S.programs).some(function(pid){return S.programs[pid].code===importedCode;});
 if(codeFree){p.code=importedCode;p.rev=(typeof p.rev==="number"&&isFinite(p.rev)&&p.rev>=1)?Math.floor(p.rev):1;}else{p.code=genProgramCode();p.rev=1;}
 p.createdAt=savedAt;p.updatedAt=savedAt;if(fromLibrary)p.origin="satzkraft";S.programs[p.id]=p;collectPersonalProgramDefinitions(p);S.store[p.id]=newStore(p);
 if(activate&&!setActive(p.id))return null;
 if(flushSave()===false)return null;
 pendingProgramImport=null;importIssue=null;
 if(activate)closeLib(true);else renderLib();
 return p.id;
}
function useExistingDuplicate(){if(programWriteLocked()){showProgramWriteLocked();return;}var id=pendingProgramImport&&pendingProgramImport.duplicateId;if(!id||!S.programs[id])return;if(id===S.active){pendingProgramImport=null;openProgramEditor(id);return;}pendingProgramImport=null;if(setActive(id))closeLib(true);}
// Trainings-Update per Import: Ein gleichnamiges, geändertes Programm (z. B. von einer KI
// angepasst) kann das vorhandene direkt ersetzen – über die geprüfte Editor-Ersetzen-Mechanik,
// damit Fortschritt, Gewichte und Protokoll erhalten bleiben.
function importUpdateTargetId(prepared){
 if(!prepared)return null;
 var pool=(Array.isArray(prepared.codeIds)&&prepared.codeIds.length)?prepared.codeIds:(Array.isArray(prepared.sameNameIds)?prepared.sameNameIds:[]);
 var ids=pool.filter(function(id){return S.programs[id]&&S.programs[id].archived!==true;});
 if(!ids.length)return null;
 return ids.indexOf(S.active)>=0?S.active:ids[0];
}
function importBuildUpdateDraft(external,target,store){
 var draft=cloneJSON(external);delete draft._anleitung;
 var editWeek=currentTrainingWeekFor(target,store||newStore(target));
 draft.days.forEach(function(draftDay){
  var oldDay=null;target.days.forEach(function(d){if(String(d.key)===String(draftDay.key))oldDay=d;});
  if(!oldDay)return;
  var oldActive=dayExercisesFor(oldDay,editWeek,{}),open=oldActive.slice();
  (draftDay.exercises||[]).forEach(function(draftEx){delete draftEx.fromWeek;delete draftEx.untilWeek;delete draftEx.prevId;});
  (draftDay.exercises||[]).forEach(function(draftEx){
   for(var i=0;i<open.length;i++)if(exerciseLibraryNamesMatch(open[i].name,draftEx.name)){draftEx._ref=open[i].id;open.splice(i,1);return;}
  });
  (draftDay.exercises||[]).forEach(function(draftEx,index){
   if(draftEx._ref)return;
   var oldEx=oldActive[index];
   if(!oldEx||open.indexOf(oldEx)<0)return;
   if(editorExerciseTypeSignature(oldEx)!==editorExternalTypeSignature(draftEx))return;
   draftEx._ref=oldEx.id;open.splice(open.indexOf(oldEx),1);
  });
 });
 return draft;
}
function importUpdateExisting(){
 if(programWriteLocked()){showProgramWriteLocked();return;}
 var prepared=pendingProgramImport;if(!prepared||!prepared.program)return;
 var targetId=importUpdateTargetId(prepared),target=targetId&&S.programs[targetId];if(!target)return;
 var draft=importBuildUpdateDraft(prepared.external,target,S.store[targetId]);
 pendingProgramImport=null;importIssue=null;
 editorSourceId=targetId;editorUnsavedDraft=false;editorReturnView="library";
 editorDraft=draft;editorInitialJSON=JSON.stringify(draft);

 editorView="training";editorDayIndex=0;editorWeekIndex=0;editorExerciseIndex=null;editorUndoStack=[];editorUndoField=null;editorDragState=null;editorOpenSections={};editorPendingReplacementRefs={};editorRenameChoices={};
 // Bei einem Validierungsfehler den Editor öffnen, damit „Weiter bearbeiten" wirklich dort landet; sonst still ersetzen.
 var checked=parseProgram(JSON.stringify(draft));
 if(checked.err)renderProgramEditor();else renderLib();
 editorStoreProgram(true,"back",false);
}
function importProgram(text){beginProgramImport(text,"json","");}
function deleteProgram(id){
 if(programWriteLocked()){showProgramWriteLocked();return false;}
 if(id==="default")return false;
 if(S.active===id){var replacement=Object.keys(S.programs).filter(function(other){return other!==id&&S.programs[other].archived!==true;})[0];if(!replacement||!setActive(replacement))return false;}
 delete S.programs[id];delete S.store[id];
 removeParentReferences(S.programs,id);
 save();renderLib();return true;
}
function copyTextFallback(t){var ta;try{ta=document.createElement("textarea");ta.value=t;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();return document.execCommand("copy");}catch(e){return false;}finally{if(ta&&ta.parentNode)ta.remove();}}
function copyText(t){try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t).then(function(){return true;}).catch(function(){return copyTextFallback(t);});}catch(e){}return Promise.resolve(copyTextFallback(t));}
function copyWithFeedback(text,successTitle,successMessage,failureMessage,primary){copyText(text).then(function(ok){showModal(ok?successTitle:"Kopieren nicht möglich",ok?successMessage:failureMessage,[{label:"OK",cls:ok&&primary?"primary":"",action:null}]);});}
function downloadText(name,t){try{var blob=new Blob([t],{type:"application/json"});var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1500);return true;}catch(e){return false;}}
function exportCurrentJSON(){
 var p=PROG(),store=S.store[S.active]||newStore(p);ensureProgramCode(p);var out=exportTranslate(p);
 // Aktuelle Arbeitsgewichte als Startgewichte mitgeben, damit eine KI auf dem echten Stand plant (gleiche Logik wie beim Folgeblock).
 out.days.forEach(function(dayOut,di){
  var day=p.days[di];if(!day)return;
  (dayOut.exercises||[]).forEach(function(exOut,ei){
   var ex=day.ex[ei];
   if(ex&&ex.w&&exOut.weighted){var current=followupStartWeight(p,store,day,ex);if(current!=null&&isFinite(current)&&current>=0)exOut.startWeight=current;}
  });
 });
 return JSON.stringify(out,null,2);
}
function externalAiPrompt(wish){return "Du bist ein erfahrener Krafttrainings-Coach. Erstelle mir ein Trainingsprogramm\nim Format der folgenden Satzkraft-Vorlage (JSON). Halte dich exakt an Struktur,\nFeldnamen und erlaubte Werte aus \"_anleitung\" – erfinde keine neuen Felder.\nBeachte die Trainings-Richtlinien in der Vorlage. Antworte NUR mit dem\nvollständigen fertigen JSON, vom ersten { bis zum letzten }, ohne Erklärung oder\nMarkdown-Codeblock. Alle Pflichtfelder und alle verwendeten Kategorien müssen\nenthalten sein.\n\nMEIN TRAININGSWUNSCH:\n"+String(wish||"").trim()+"\n\nVOLLSTÄNDIGE SATZKRAFT-VORLAGE:\n"+JSON.stringify(BLANK_TEMPLATE,null,2);}
function confirmReset(){
 if(programWriteLocked()){showProgramWriteLocked();return;}
 showModal("Fortschritt zurücksetzen?","Eingetragene Sätze & Verlauf des aktiven Programms („"+esc(PROG().name)+"“) werden gelöscht. Das Programm selbst bleibt.",[{label:"Zurücksetzen",cls:"danger",action:function(){var st=newStore(PROG());S.store[S.active]=st;S.tg=st.tg;S.barw=st.barw;S.notes=st.notes;S.logs=st.logs;S.history=st.history;S.workout=st.workout;S.pendingReplacements=st.pendingReplacements;S.removedEx=st.removedEx;S.week=1;S.day=dayKeys()[0];S.blockCelebrated=false;refreshPostWorkoutReplacements();save();closeLib();renderView();renderBar();}},{label:"Abbrechen",action:null}]);
}
