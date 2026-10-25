function renderExerciseLibrary(query,loaded){
 exerciseLibraryView="library";if(query!==undefined)exerciseLibraryQuery=String(query);var needle=normalizeExerciseLibraryName(exerciseLibraryQuery),all=personalExerciseEntries().concat(EXERCISE_LIBRARY||[]),matches=all.filter(function(entry){return !needle||exerciseLibraryEntryNames(entry).concat([entry.equipment||""]).some(function(name){return normalizeExerciseLibraryName(name).indexOf(needle)>=0;});}),locked=programWriteLocked();
 var h='<div class="libbox">'+exerciseSubviewHeader("Übungen","Deine Übungen","exercisesback")+'<div class="edgrid"><label class="edfield wide"><span class="edlabel">Übungen suchen</span><input id="exercisessearch" data-personal-search="1" type="search" maxlength="80" value="'+attr(exerciseLibraryQuery)+'" placeholder="Name oder Gerät"></label></div><div class="librow"><button type="button" class="smallbtn go" id="personalnew"'+(locked?' disabled':'')+'>Eigene Übung erstellen</button></div><div class="libnote">Integrierte Übungen bleiben erhalten. Eigene Übungen werden lokal gespeichert und mit deinem vollständigen Backup gesichert.</div>';
 if(EXERCISE_LIBRARY===null)h+='<div class="libnote" role="status">'+(loaded?'Die integrierten Übungen sind gerade nicht verfügbar. Lade die Ansicht erneut.':'Übungen werden geladen …')+'</div>';
 if(!matches.length&&EXERCISE_LIBRARY!==null)h+='<div class="archiveempty"><b>Keine passende Übung.</b><br>Ändere die Suche oder erstelle eine eigene Übung.</div>';
 h+='<div class="tpllist">';matches.slice(0,50).forEach(function(entry){var identity=entry.id||entry.de;h+='<div class="tplcard emerald"><span class="tplbar"></span><div class="tplmain"><div class="tplname">'+esc(entry.de)+'</div><div class="tplgoal">'+esc(entry.definition?'Persönlich · '+(entry.equipment||'eigene Übung'):entry.equipment||'Integriert')+'</div><div class="progactions"><button type="button" class="progtextaction" data-exercise-detail="'+attr(identity)+'">Details &amp; Verlauf</button></div></div></div>';});h+='</div>'+(matches.length>50?'<div class="libnote">'+matches.length+' Treffer · die ersten 50 werden angezeigt. Grenze die Suche ein.</div>':'')+'</div>';
 document.getElementById("lib").innerHTML=h;
 if(EXERCISE_LIBRARY===null&&!loaded)loadExerciseLibrary().then(function(){if(exerciseLibraryView==="library")renderExerciseLibrary(undefined,true);});
}
function openExerciseLibrary(){openLib();renderExerciseLibrary();focusSurface(document.getElementById("lib"),"#exercisessearch");}
function exerciseDetailRows(entry){
 var records=[];Object.keys(S.programs).forEach(function(pid){var program=S.programs[pid],store=S.store[pid]||{},logs=pid===S.active?S.logs:store.logs||{},history=pid===S.active?(S.history||store.history||[]):store.history||[],positions=Object.create(null);(program.days||[]).forEach(function(day){(day.ex||[]).forEach(function(ex){positions[day.key+"|"+ex.id]=ex;});});
 Object.keys(logs).forEach(function(key){var parts=key.split("|"),cell=logs[key],ex=positions[parts[1]+"|"+parts[2]];if(!ex||!cell||!Array.isArray(cell.sets))return;var performed=historicalExercise(ex,cell);if(!exerciseDetailMatches(entry,ex,cell))return;var sets=cell.sets.filter(reportSetHasData);if(!sets.length)return;var session=history.filter(function(item){return item.week===+parts[0]&&item.day===parts[1];})[0];records.push({program:program.name,week:+parts[0],day:parts[1],start:session&&session.start||0,name:performed.name,confirmed:!!cell.performedExercise,convention:performed.weightConvention||"unspecified",parts:sets.map(function(set){return historicalSetText(performed,set);})});});
 });return records.sort(function(a,b){return b.start-a.start||b.week-a.week;});
}
function exerciseDetailMatches(entry,ex,cell){
 var snapshot=cell.performedExercise||cell.pendingPerformedExercise,performed=historicalExercise(ex,cell),swap=normalizeSwapName(cell.swap);
 if(snapshot&&snapshot.exerciseId)return !!entry.id&&snapshot.exerciseId===entry.id;
 if(!exerciseSwapTypeCompatible(performed,entry))return false;
 if(entry.definition)return !snapshot&&!swap&&ex.exerciseId===entry.id;
 var name=normalizeExerciseLibraryName(snapshot?snapshot.name:swap||ex.name),matches=(EXERCISE_LIBRARY||[]).filter(function(candidate){return exerciseSwapTypeCompatible(performed,candidate)&&exerciseLibraryEntryNames(candidate).some(function(alias){return normalizeExerciseLibraryName(alias)===name;});});
 return matches.length===1&&matches[0]===entry;
}
function workoutExerciseDetail(ex){
 var cell=currentExerciseCell(ex),performed=historicalExercise(ex,cell),swap=currentExerciseSwap(ex),snapshot=cell&&(cell.performedExercise||cell.pendingPerformedExercise),identity=snapshot?snapshot.exerciseId:swap?null:ex.exerciseId,name=snapshot?snapshot.name:swap||ex.name;
 var libraryEntry=findExerciseLibraryEntryById(identity)||findExerciseLibraryEntry(name),compatible=libraryEntry&&exerciseSwapTypeCompatible(performed,libraryEntry),entry={de:name,typ:isTime(performed)?"zeit":performed.w?(performed.bw?"kgz":"gewicht"):"koerpergewicht",weightedTime:isTime(performed)&&performed.w,einseitig:!!performed.perSide,weightConvention:performed.weightConvention||"unspecified",technik:swap?(compatible?libraryEntry.technik:""):ex.sub||(compatible?libraryEntry.technik:""),equipment:compatible?libraryEntry.equipment:"Übung aus deinem Programm",programOnly:true};
 if(compatible&&identity&&libraryEntry.id===identity){entry.id=identity;entry.definition=libraryEntry.definition;entry.programOnly=false;}
 var rows=exHistory(ex).map(function(row){var recorded=S.logs[row.w+"|"+S.day+"|"+ex.id],historic=historicalExercise(ex,recorded);return{program:PROG().name,week:row.w,day:S.day,confirmed:row.confirmed,parts:recorded.sets.filter(reportSetHasData).map(function(set){return historicalSetText(historic,set);})};}).reverse();
 return{entry:entry,rows:rows};
}
function renderExerciseDetail(identity,returnView,workoutDetail){
 var entry=workoutDetail?workoutDetail.entry:findExerciseLibraryEntryById(identity)||findExerciseLibraryEntry(identity);if(!entry){showModal("Übung nicht gefunden","Diese Übung ist gerade nicht in der Bibliothek verfügbar.",[{label:"OK",cls:"primary",action:null}]);return;}
 exerciseLibraryView="detail";personalReturnView=returnView||"library";var rows=workoutDetail?workoutDetail.rows:exerciseDetailRows(entry),last=rows[0],h='<div class="libbox exercisedetail">'+exerciseSubviewHeader("Übung",entry.de,"exercisedetailback")+'<div class="libnote">'+esc(entry.definition?'Deine persönliche Übung':entry.equipment||'Integrierte Übung')+'</div>';
 h+='<section class="eddaysettings"><h2 class="tplname">Letzte Leistung</h2><p>'+esc(last?last.parts.join(' / '):'Für diese Übung sind noch keine Satzwerte gespeichert.')+'</p>'+(last?'<div class="libnote">'+esc(last.program+' · Woche '+last.week+' · '+(last.confirmed?'Erfassung gespeichert':'Älterer Eintrag · Erfassung unbestätigt'))+'</div>':'')+'</section>';
 h+='<details class="edadvanced"><summary>Technik &amp; Erfassung</summary><div class="edbody"><p>'+esc(entry.technik||'Noch keine Technikangabe hinterlegt.')+'</p><p>'+esc(exerciseLibraryTypeSignature(entry)==='weighted_seconds'?'Zeit und Gewicht gemeinsam':entry.typ==='zeit'?'Zeit in Minuten und Sekunden':entry.typ==='gewicht'?'Wiederholungen und Gewicht':entry.typ==='kgz'?'Wiederholungen und Zusatzgewicht':'Wiederholungen')+(entry.einseitig?' · je Seite':'')+'</p>'+(entry.weightConvention?'<p>'+esc(weightConventionText(entry.weightConvention))+'</p>':'')+'</div></details>';
 h+='<details class="edadvanced" open><summary>Verlauf'+(rows.length?' ('+rows.length+')':'')+'</summary><div class="edbody">';if(rows.length){h+='<table class="htbl"><thead><tr><th>Training</th><th>Sätze</th></tr></thead><tbody>';rows.slice(0,30).forEach(function(row){h+='<tr><td>'+esc(row.program)+'<span class="hwl">W'+row.week+' · '+esc(row.day)+'</span></td><td>'+esc(row.parts.join(' / '))+'<span class="hwl">'+esc(row.confirmed?'Erfassung gespeichert':'Älterer Eintrag · Erfassung unbestätigt')+'</span></td></tr>';});h+='</tbody></table>'+(rows.length>30?'<p>Die letzten 30 Ausführungen. Alle Satzwerte bleiben im Backup erhalten.</p>':'');}else h+='<p>Der Verlauf erscheint nach deinem ersten eingetragenen Satz.</p>';h+='</div></details><div class="librow">';
 if(!entry.programOnly&&!programWriteLocked()){if(entry.definition)h+='<button type="button" class="smallbtn" data-personal-edit="'+attr(entry.id)+'">Übungsdaten bearbeiten</button><button type="button" class="progtextaction" data-personal-archive="'+attr(entry.id)+'">Archivieren</button>';else h+='<button type="button" class="smallbtn" data-personal-duplicate="'+attr(entry.id||entry.de)+'">Als eigene Variante speichern</button>';}h+='</div></div>';document.getElementById("lib").innerHTML=h;focusSurface(document.getElementById("lib"),"#exercisedetailback");
}
function openWorkoutExerciseDetail(ex){
 var detail=workoutExerciseDetail(ex);openLib();renderExerciseDetail(null,"training",detail);
}
function openPersonalExerciseForm(identity,returnView,duplicate){
 if(localWriteBlocked()||programWriteLocked()){showProgramWriteLocked();return;}personalReturnView=returnView||"library";var entry=identity&&(findExerciseLibraryEntryById(identity)||findExerciseLibraryEntry(identity)),definition=entry&&entry.definition;personalFormSourceId=definition&&!duplicate?definition.id:null;
 personalDraft=definition?cloneJSON(definition):{id:newPersonalExerciseId(),name:entry?entry.de:'',type:entry?exerciseLibraryTypeSignature(entry):'weight',perSide:!!(entry&&entry.einseitig),weightConvention:entry&&(entry.weightConvention||EXERCISE_WEIGHT_CONVENTIONS[entry.id])||'unspecified',technique:entry&&entry.technik||'',equipment:entry&&entry.equipment||''};
 if(duplicate){personalDraft.id=newPersonalExerciseId();personalDraft.name=(personalDraft.name+' (eigene Variante)').slice(0,80);}renderPersonalExerciseForm();
}
function renderPersonalExerciseForm(){
 exerciseLibraryView="personal-form";var d=personalDraft,h='<div class="libbox">'+exerciseSubviewHeader("Persönliche Übung",personalFormSourceId?'Übung bearbeiten':'Eigene Übung erstellen',"personalback")+'<div class="edgrid">';
 function input(label,field,max){return '<label class="edfield wide"><span class="edlabel">'+label+'</span><input id="personal-'+field+'" data-personal-field="'+field+'" maxlength="'+max+'" value="'+attr(d[field])+'" required></label>';}
 h+=input('Name','name',80)+'<label class="edfield wide"><span class="edlabel">Erfassung</span><select id="personal-type" data-personal-field="type">';[['weight','Wiederholungen und Gewicht'],['added_weight','Wiederholungen und Zusatzgewicht'],['bodyweight','Nur Wiederholungen'],['seconds','Nur Zeit'],['weighted_seconds','Zeit und Gewicht']].forEach(function(option){h+=editorOption(option[0],option[1],d.type);});h+='</select></label><label class="edfield wide"><span class="edlabel">Gewicht bedeutet</span><select id="personal-weightConvention" data-personal-field="weightConvention">';[['unspecified','Noch nicht festgelegt'],['total','Gesamtgewicht'],['per_dumbbell','Gewicht pro Hantel'],['device','Anzeige an diesem Gerät']].forEach(function(option){h+=editorOption(option[0],option[1],d.weightConvention);});h+='</select></label>'+input('Gerät oder Variante (optional)','equipment',80)+'<label class="edfield wide"><span class="edlabel">Technik (optional)</span><textarea id="personal-technique" data-personal-field="technique" maxlength="500">'+esc(d.technique)+'</textarea></label><label class="edfield wide"><span><input id="personal-perSide" data-personal-field="perSide" type="checkbox"'+(d.perSide?' checked':'')+'> Angaben gelten je Seite</span></label></div><div class="libnote">Bei einer anderen Erfassung, Gewichtskonvention oder Gerätevariante wird eine neue Übung angelegt. Frühere Satzwerte behalten ihre ursprünglichen Angaben. Unterstützung durch Gegengewicht gehört noch nicht zu diesen Erfassungsarten.</div><div class="librow"><button type="button" class="smallbtn go" id="personalsave">Übung speichern</button><button type="button" class="progtextaction" id="personalcancel">Abbrechen</button></div></div>';
 document.getElementById("lib").innerHTML=h;focusSurface(document.getElementById("lib"),"#personal-name");
}
function syncPersonalExerciseForm(){if(!personalDraft)return;['name','type','weightConvention','equipment','technique','perSide'].forEach(function(field){var input=document.getElementById('personal-'+field);if(input)personalDraft[field]=field==='perSide'?input.checked:input.value;});}
function returnFromPersonalExerciseForm(){personalDraft=null;personalFormSourceId=null;if(personalReturnView==='editor'){exerciseLibraryView='';renderProgramEditor();}else renderExerciseLibrary();}
function storePersonalExercise(def,sourceId){
 if(localWriteBlocked()||programWriteLocked())return {error:"Beende zuerst dein Training oder lade den aktuellen Stand."};var next=cloneJSON(def);next.name=next.name.trim();next.equipment=next.equipment.trim();next.technique=next.technique.trim();if(['bodyweight','seconds'].indexOf(next.type)>=0)next.weightConvention='unspecified';var error=personalExerciseError(next);if(error)return{error:error};
 var previous=S.personalExercises||{},old=sourceId&&previous[sourceId];if(old&&personalExerciseTrackingKey(old)!==personalExerciseTrackingKey(next))next.id=newPersonalExerciseId();
 if(!old&&previous[next.id])return{error:"Diese Übungskennung ist bereits vergeben."};var updated=cloneJSON(previous);updated[next.id]=next;var catalogError=personalExerciseCatalogError(updated);if(catalogError)return{error:catalogError};S.personalExercises=updated;
 if(flushSave()===false){S.personalExercises=previous;return{error:"Die Übung konnte nicht gespeichert werden. Dein Entwurf bleibt erhalten."};}return{definition:next,newVariant:!!old&&old.id!==next.id};
}
function savePersonalExerciseForm(){syncPersonalExerciseForm();var result=storePersonalExercise(personalDraft,personalFormSourceId);if(result.error){showModal("Übung nicht gespeichert",esc(result.error),[{label:"Weiter bearbeiten",cls:"primary",action:null}]);return;}var returnView=personalReturnView;personalDraft=null;personalFormSourceId=null;if(returnView==='editor'){exerciseLibraryView='';renderProgramEditor();}else renderExerciseDetail(result.definition.id,'library');}
function archivePersonalExercise(id,confirmed){
 var def=S.personalExercises&&S.personalExercises[id];if(!def||localWriteBlocked()||programWriteLocked())return false;
 if(!confirmed){showModal("Übung archivieren?","Die Übung verschwindet aus deiner Auswahl. Programme, Definition und sämtliche bisherigen Satzwerte bleiben erhalten.",[{label:"Archivieren",cls:"primary",action:function(){archivePersonalExercise(id,true);}},{label:"Abbrechen",action:null}]);return false;}
 var old=def.archived;def.archived=true;if(flushSave()===false){if(old===undefined)delete def.archived;else def.archived=old;return false;}renderExerciseLibrary();return true;
}
function renderLib(){
 exerciseLibraryView="";
 var locked=programWriteLocked(),lockedAttr=locked?' disabled title="Training läuft – zuerst beenden"':'',archiveIds=Object.keys(S.programs).filter(function(id){return S.programs[id].archived===true;}),h='<div class="libbox"><div class="hdr"><div class="topright"><span class="brand">Satzkraft</span><button class="linkbtn" id="archivebtn">Archiv'+(archiveIds.length?' ('+archiveIds.length+')':'')+'</button><button class="iconbtn" id="libclose" aria-label="Schließen">'+icon("close")+'</button></div><div class="heroeyebrow">Programme</div><h1 class="ptitle">Deine Bibliothek</h1></div>';
 if(locked)h+='<div class="importnotice warn"><strong>Training läuft</strong>Beende zuerst dein Training, um Programme zu ändern, ein anderes zu aktivieren, den Fortschritt zurückzusetzen oder ein Backup wiederherzustellen.</div>';
 var activeProgram=S.programs[S.active];if(activeProgram)h+=programItemHtml(S.active,activeProgram);
 var otherIds=Object.keys(S.programs).filter(function(id){return id!==S.active&&S.programs[id].archived!==true;});
 if(otherIds.length){h+='<details class="programothers"><summary>Weitere Programme ('+otherIds.length+')</summary><div class="programothersbody">';otherIds.forEach(function(id){h+=programItemHtml(id,S.programs[id]);});h+='</div></details>';}
 h+='<div class="createtiles">';
 h+='<button class="createtile" id="importbtn" aria-label="Fertiges Programm importieren"'+lockedAttr+'><span class="ticon">'+icon("download")+'</span><b>Import</b><small>Eigenes JSON laden</small></button>';
 h+='<button class="createtile" id="manualcreate" aria-label="Programm manuell erstellen"'+lockedAttr+'><span class="ticon">'+icon("edit")+'</span><b>Manuell</b><small>Selbst zusammenstellen</small></button>';
 h+='<button class="createtile" id="externalaibtn" aria-label="Programm mit ChatGPT oder einer anderen KI erstellen"'+lockedAttr+'><span class="ticon">'+icon("external")+'</span><b>ChatGPT &amp; Co.</b><small>Mit externer KI erstellen</small></button>';
 h+='</div>';
 h+='<div class="librow"><button type="button" class="smallbtn" id="exercisesbtn">Übungen &amp; persönliche Bibliothek</button></div>';
 h+='<div class="libsec">Vorlagen · '+PROGRAM_LIBRARY.length+'</div><div class="tpllist">';
 PROGRAM_LIBRARY.forEach(function(item,index){h+='<div class="tplcard '+(item.farbe||'sky')+'"><span class="tplbar"></span><div class="tplmain"><div class="tpltop"><span class="tpllevel">'+esc(item.level)+'</span><span class="tplmeta">'+item.days+' Tage · '+esc(item.duration)+'</span></div><div class="tplname">'+esc(item.name)+'</div><div class="tplgoal">'+esc(item.goal)+'</div><div class="tpldesc">'+esc(item.description)+'</div><div class="progactions"><button class="progtextaction" data-library-index="'+index+'"'+lockedAttr+'>Laden</button><button class="progtextaction" data-library-edit="'+index+'"'+lockedAttr+'>Bearbeiten</button><button type="button" class="iconbtn sharebtn" data-library-share="'+index+'" aria-label="Vorlage '+attr(item.name)+' teilen" title="Teilen">'+icon("share")+'</button></div></div></div>';});
 h+='</div>';
 h+='<div class="libsec">Daten sichern</div>';
 h+='<div class="libnote"><b>'+esc(backupStatusText())+'</b><br>Das vollständige Backup enthält alle Programme, Satzwerte und Trainingsverläufe. Es bleibt als Datei bei dir und wird nicht an einen Server gesendet.</div>';
 h+='<div class="librow"><button class="smallbtn go" id="libbackup">Vollständiges Backup</button><label class="smallbtn'+(locked?' disabled':'')+'"'+(locked?' aria-disabled="true" title="Training läuft – zuerst beenden"':'')+' style="display:inline-flex;align-items:center">Backup wiederherstellen<input type="file" id="backupfile" accept=".json,application/json"'+lockedAttr+' style="display:none"></label></div>';
 document.getElementById("lib").innerHTML=h+'</div>';
}
function renderArchive(){
 var locked=programWriteLocked(),archiveIds=Object.keys(S.programs).filter(function(id){return S.programs[id].archived===true;}),h='<div class="libbox"><div class="ohdr"><button class="iconbtn" id="archiveback" aria-label="Zurück">'+icon("chevron-left")+'</button><h1>Archiv</h1><button class="iconbtn" id="libclose" aria-label="Schließen">'+icon("close")+'</button></div><div class="subviewlead">Abgelegte Programme bleiben mit ihrem vollständigen Trainingsverlauf erhalten.</div>';
 if(locked)h+='<div class="importnotice warn"><strong>Training läuft</strong>Auswertungen bleiben verfügbar. Programme kannst du erst nach dem Training aus dem Archiv holen.</div>';
 if(archiveIds.length)archiveIds.forEach(function(id){h+=programItemHtml(id,S.programs[id]);});else h+='<div class="archiveempty"><b>Das Archiv ist leer.</b><br>Archivierte Programme erscheinen später hier.</div>';
 document.getElementById("lib").innerHTML=h+'</div>';
}
function loadProgramLibraryItem(index){
 if(programWriteLocked()){showProgramWriteLocked();return;}var item=PROGRAM_LIBRARY[index];if(!item)return;
 fetch(item.file).then(function(response){if(!response.ok)throw new Error("HTTP "+response.status);return response.text();}).then(function(text){beginProgramImport(text,"library",item.name);}).catch(function(){showModal("Programm nicht geladen","Das Programm konnte nicht geladen werden. Öffne die Liste einmal mit Internet – danach funktioniert sie auch offline.",[{label:"OK",cls:"primary",action:null}]);});
}
function editProgramLibraryItem(index){
 if(programWriteLocked()){showProgramWriteLocked();return;}var item=PROGRAM_LIBRARY[index];if(!item)return;
 fetch(item.file).then(function(response){if(!response.ok)throw new Error("HTTP "+response.status);return response.text();}).then(function(text){
  var checked=parseProgram(text);
  if(checked.err){showModal("Vorlage fehlerhaft",checked.err,[{label:"OK",action:null}]);return;}
  openProgramDraft(JSON.parse(text),"create");
 }).catch(function(){showModal("Vorlage nicht geladen","Die Vorlage konnte nicht geladen werden. Öffne die Liste einmal mit Internet – danach ist sie auch offline verfügbar.",[{label:"OK",action:null}]);});
}
function shareProgramLibraryItem(index){
 var item=PROGRAM_LIBRARY[index];if(!item)return;
 fetch(item.file).then(function(response){if(!response.ok)throw new Error("HTTP "+response.status);return response.text();}).then(function(text){
  showModal("Vorlage teilen",'„'+esc(item.name)+'“ wird als Programmdatei geteilt.',[
   {label:"Als Text kopieren",cls:"menu",action:function(){copyWithFeedback(text,"Kopiert","Die Vorlage liegt als JSON in der Zwischenablage.","Nutze stattdessen „Als Datei“.");}},
   {label:"Als Datei",cls:"menu",action:function(){downloadText(item.name.replace(/[^a-z0-9]+/gi,"_")+".json",text);}},
   {label:"Link teilen",cls:"menu",action:function(){try{var obj=JSON.parse(text);delete obj._anleitung;var u=location.origin+location.pathname+"#p="+btoa(unescape(encodeURIComponent(JSON.stringify(obj))));copyWithFeedback(u,"Link kopiert","Wer den Link öffnet, bekommt die Vorlage zum Laden angeboten.","Nutze stattdessen den Datei-Export.");}catch(e){showModal("Link nicht möglich","Die Vorlage konnte nicht in einen Link umgewandelt werden.",[{label:"OK",action:null}]);}}},
   {label:"Abbrechen",action:null}
  ]);
 }).catch(function(){showModal("Vorlage nicht geladen","Die Vorlage konnte nicht geladen werden. Öffne die Liste einmal mit Internet – danach ist sie auch offline verfügbar.",[{label:"OK",action:null}]);});
}
function renderExternalAiCreate(){
 var h='<div class="libbox subviewbox"><div class="ohdr"><button class="iconbtn" id="createhubback" aria-label="Zurück">'+icon("chevron-left")+'</button><h1>Mit ChatGPT &amp; Co.</h1><button class="iconbtn" id="subclose" aria-label="Zurück zu Programme">'+icon("close")+'</button></div><div class="subviewlead">In drei Schritten zu deinem Programm. Satzkraft liefert einen fertigen Text für die KI und prüft das Ergebnis vor dem Speichern.</div>';
 h+='<div class="createblock"><div class="createtitle">1 · Trainingswunsch eintragen</div><div class="libnote">Schreibe einfach, was du brauchst – zum Beispiel Ziel, Trainingstage, Dauer, Erfahrung, Equipment, Einschränkungen und ob Warm-up/Cool-down gewünscht ist.</div><textarea class="libta" id="externalwish" aria-label="Trainingswunsch" placeholder="Zum Beispiel: Muskelaufbau, 3-mal pro Woche Mo/Mi/Fr, je 60 Minuten, Langhantel und Kurzhanteln, 1 Jahr Erfahrung, keine Einschränkungen, mit Warm-up und Cool-down.">'+esc(externalAiWish)+'</textarea></div>';
 h+='<div class="createblock"><div class="createtitle">2 · Text für ChatGPT kopieren</div><div class="libnote">Satzkraft verbindet deinen Wunsch automatisch mit der vollständigen technischen Vorlage. Du musst bei der KI nichts mehr ausfüllen.</div><div class="librow"><button class="smallbtn go" id="tplpromptcopy"'+(externalAiWish.trim()?'':' disabled')+'>Text für ChatGPT kopieren</button></div></div>';
 h+='<div class="createblock"><div class="createtitle">3 · Ergebnis importieren</div><div class="libnote">Füge den kopierten Text bei ChatGPT oder einer anderen KI ein. Kopiere anschließend die komplette JSON-Antwort vom ersten <b>{</b> bis zum letzten <b>}</b>. Satzkraft prüft fehlende oder falsche Felder vor dem Speichern.</div><div class="librow"><button class="smallbtn go" id="importbtn">JSON prüfen &amp; importieren</button></div></div><div class="createfoot libnote">Du willst dein aktuelles Programm umbauen lassen? Kopiere es unter Programme → Exportieren &amp; Teilen.</div></div>';document.getElementById("lib").innerHTML=h;
}
function renderImportEntry(){
 var h='<div class="libbox subviewbox"><div class="ohdr"><button class="iconbtn" id="createhubback" aria-label="Zurück">'+icon("chevron-left")+'</button><h1>Programm importieren</h1><button class="iconbtn" id="subclose" aria-label="Zurück zu Programme">'+icon("close")+'</button></div><div class="subviewlead">Füge das JSON einer beliebigen KI ein oder wähle eine Datei. Es wird zunächst nur geprüft – dein aktives Programm und dein Fortschritt bleiben unverändert.</div>';
 h+='<div class="importtextwrap"><textarea class="libta" id="libpaste" aria-label="Programm-JSON einfügen" placeholder="JSON hier einfügen …">'+esc(importInputText)+'</textarea><button class="importclear" id="importclear"'+(importInputText?'':' hidden')+'>'+icon("close")+' Leeren</button></div>';
 h+='<div class="importdrop" id="importdrop"><div><strong>'+(importSourceName?esc(importSourceName):'JSON-Datei auswählen')+'</strong><small>Bis 5 MB · JSON oder Textdatei</small></div><label class="smallbtn" style="display:inline-flex;align-items:center">Datei wählen<input type="file" id="libfile" accept=".json,application/json,text/plain" style="display:none"></label></div>';
 h+='<div class="librow"><button class="smallbtn go" id="libload">Prüfen &amp; Vorschau</button><button class="smallbtn" id="tplcopy">Vorlage kopieren</button></div><div class="importnotice"><strong>Noch nichts wird gespeichert</strong>Erst in der nächsten Ansicht entscheidest du: speichern, bearbeiten – oder ein vorhandenes Programm mit gleichem Namen aktualisieren, ohne deinen Fortschritt zu verlieren.</div></div>';document.getElementById("lib").innerHTML=h;
}
function renderImportError(){
 var issue=importIssue&&importIssue.error?importIssue.error:explainProgramError("Das Programm konnte nicht geprüft werden."),origin=importIssue&&importIssue.origin||"json",h='<div class="libbox subviewbox"><div class="ohdr"><button class="iconbtn" id="importback" aria-label="Zurück">'+icon("chevron-left")+'</button><h1>Import korrigieren</h1><button class="iconbtn" id="subclose" aria-label="Zurück zu Programme">'+icon("close")+'</button></div><span class="sourcepill">'+esc(programSourceLabel(origin))+(importIssue&&importIssue.sourceName?' · '+esc(importIssue.sourceName):'')+'</span>';
 h+='<div class="importnotice err"><strong>'+esc(issue.area)+'</strong>'+esc(issue.message)+'<br><br><b>So behebst du es:</b> '+esc(issue.remedy)+'</div>';
 if(issue.technical&&issue.technical!==issue.message)h+='<details class="importtechnical"><summary>JSON-Pfad &amp; Regel</summary><pre>'+esc(issue.technical)+'</pre></details>';
 h+='<div class="librow">'+(importIssue&&importIssue.repair?'<button class="smallbtn go" id="importrepair">Im Editor beheben</button>':'')+'<button class="smallbtn'+(importIssue&&importIssue.repair?'':' go')+'" id="importeditjson">JSON bearbeiten</button><button class="smallbtn" id="tplcopy">Vorlage kopieren</button></div></div>';document.getElementById("lib").innerHTML=h;
}
function renderImportPreview(){
 var prepared=pendingProgramImport;if(!prepared||!prepared.program){renderImportEntry();return;}var p=prepared.program,exerciseCount=p.days.reduce(function(sum,day){return sum+day.ex.length;},0),h='<div class="libbox subviewbox"><div class="ohdr"><button class="iconbtn" id="importpreviewback" aria-label="Zur\u00fcck">'+icon("chevron-left")+'</button><h1>Programm pr\u00fcfen</h1><button class="iconbtn" id="subclose" aria-label="Zur\u00fcck zu Programme">'+icon("close")+'</button></div>';
 h+='<div class="pvhdr"><div class="heroeyebrow">'+esc(programSourceLabel(prepared.origin))+(prepared.sourceName&&prepared.sourceName!==p.name?' \u00b7 '+esc(prepared.sourceName):'')+'</div><h2 class="ptitle">'+esc(p.name)+'</h2><div class="chiprow"><span class="chip">'+p.days.length+' Tage</span><span class="chip">'+p.weeks.length+' Wochen</span><span class="chip">'+exerciseCount+' \u00dcbungen</span>'+(p.bereich?'<span class="chip">'+esc(p.bereich)+'</span>':'')+'</div>'+(p.description?'<p class="pvdesc">'+esc(p.description)+'</p>':'')+'</div>';
 var w1=p.weeks[0]||{};
 p.days.forEach(function(day,di){
  h+='<details class="pvday"'+(di===0?' open':'')+'><summary><span class="pvmain"><span class="pvwd">'+esc(day.wd||'Tag '+(di+1))+'</span><span class="pvtitle">'+esc(day.title||day.key)+'</span><span class="pvmeta">'+day.ex.length+' \u00dcbungen'+((day.wu&&day.wu.length)||(day.cd&&day.cd.length)?' \u00b7 Warm-up/Cool-down':'')+'</span></span><span class="pvchev">'+icon("chevron-left")+'</span></summary><div class="pvrows">';
  if(day.wu&&day.wu.length)h+='<div class="pvextra">Warm-up \u00b7 '+day.wu.map(function(item){return esc(item.name)+' ('+fmtTime(item.sec)+' min)';}).join(', ')+'</div>';
  day.ex.forEach(function(ex,i){
   var category=p.categories[ex.cat]||{},color=CAT_COLORS.indexOf(category.color)>=0?category.color:"slate";
   var setCount=ex.sets!=null?ex.sets:(w1.sets&&w1.sets[ex.cat]!=null?w1.sets[ex.cat]:3),rr=category.reps&&(category.reps[w1.phase]||category.reps.aufbau);
   var summary=setCount+' \u00d7 '+(Array.isArray(rr)?(ex.unit==="seconds"?fmtSecondsRange(rr[0],rr[1]):rr[0]+'\u2013'+rr[1]):esc(ex.target||'\u2014'))+(ex.perSide?' je Seite':'');
   if(category.rest!=null)summary+=' \u00b7 '+fmtTime(category.rest);
   h+='<div class="pvrow '+color+'"><span class="rowbar"></span><span class="rowmain"><span class="rowcat">'+esc(category.label||ex.cat)+'</span><span class="rowname">'+esc(ex.name)+'</span><span class="rowpresc">'+summary+'</span></span><span class="rowidx">'+('0'+(i+1)).slice(-2)+'</span></div>';
  });
  if(day.cd&&day.cd.length)h+='<div class="pvextra">Cool-down \u00b7 '+day.cd.map(function(item){return esc(item.name)+' ('+fmtTime(item.sec)+' min)';}).join(', ')+'</div>';
  h+='</div></details>';
 });
 h+='<details class="pvweeks"><summary><span class="pvmain"><span class="pvwd">Wochenstruktur</span><span class="pvtitle">'+p.weeks.length+' Wochen im Block</span></span><span class="pvchev">'+icon("chevron-left")+'</span></summary><div class="pvweekrows">';
 p.weeks.forEach(function(week){h+='<div class="pvweekrow"><b>W'+week.n+'</b><span class="wklabel">'+esc(week.label||week.phase)+'</span>'+(week.rir?'<span class="wkrir">RIR '+esc(week.rir)+'</span>':'')+'</div>';});
 h+='</div></details>';
 // Erkennungs-Hinweis läuft über das Popup weiter unten; hier bewusst keine zweite Notiz.
 if(prepared.duplicateId)h+='<div class="importactions"><button class="smallbtn go" id="importexisting">'+(prepared.duplicateId===S.active?'Vorhandenes bearbeiten':'Vorhandenes aktivieren')+'</button><button class="smallbtn" id="importcopy">Als Kopie speichern</button></div>';
 else{var canUpdate=importUpdateTargetId(prepared);h+='<div class="importactions">'+(canUpdate?'<button class="smallbtn go" id="importupdate">'+(canUpdate===S.active?'Laufendes Programm aktualisieren':'Vorhandenes aktualisieren')+'</button><button class="smallbtn" id="importactivate">Als neues Programm speichern</button>':'<button class="smallbtn go" id="importactivate">Speichern &amp; aktivieren</button>')+'<button class="smallbtn" id="importedit">Bearbeiten</button></div>';}
 document.getElementById("lib").innerHTML=h+'</div>';
 if(!prepared.matchPopupShown){
  prepared.matchPopupShown=true;
  if(prepared.duplicateId){
   var dupName=S.programs[prepared.duplicateId]?S.programs[prepared.duplicateId].name:p.name;
   showModal("Programm bereits vorhanden","„"+esc(dupName)+"“ ist inhaltlich identisch bereits in deiner Bibliothek. Es wird nicht unbemerkt doppelt gespeichert.",[
    {label:prepared.duplicateId===S.active?"Vorhandenes bearbeiten":"Vorhandenes aktivieren",cls:"primary",action:useExistingDuplicate},
    {label:"Als Kopie speichern",action:function(){storeImportedProgram(false,true);}},
    {label:"Vorschau ansehen",action:null}]);
  }else{
   var popupTargetId=importUpdateTargetId(prepared),popupTarget=popupTargetId&&S.programs[popupTargetId];
   if(popupTarget){
    var popupByCode=!!(prepared.codeIds&&prepared.codeIds.length),popupRenamed=String(popupTarget.name||"").trim()!==String(p.name||"").trim();
    var popupMsg=popupByCode?"Dieses Programm gehört zu „"+esc(popupTarget.name)+"“ (gleiche Kennung).":"Ein Programm mit demselben Namen („"+esc(popupTarget.name)+"“) ist bereits vorhanden, der Inhalt unterscheidet sich.";
    if(popupByCode&&popupRenamed)popupMsg+=" Beim Aktualisieren wird es in „"+esc(p.name)+"“ umbenannt.";
    var popupTargetRev=Number(popupTarget.rev)||1,popupImportedRev=Number(prepared.program.rev)||0;
    if(popupByCode&&popupImportedRev&&popupTargetRev>popupImportedRev)popupMsg+="<br><br><b>Achtung:</b> Dein Programm wurde seit diesem Export geändert (Stand "+popupTargetRev+", Export basiert auf Stand "+popupImportedRev+") – beim Aktualisieren gehen diese Änderungen verloren.";
    popupMsg+="<br><br>Beim Aktualisieren bleiben Fortschritt, Gewichte und Protokoll erhalten.";
    showModal("Update erkannt",popupMsg,[
     {label:popupTargetId===S.active?"Laufendes Programm aktualisieren":"Vorhandenes aktualisieren",cls:"primary",action:importUpdateExisting},
     {label:"Als neues Programm speichern",action:function(){storeImportedProgram(true,false);}},
     {label:"Erst ansehen",action:null}]);
   }
  }
 }
}
function returnFromImportFlow(){var origin=(pendingProgramImport&&pendingProgramImport.origin)||(importIssue&&importIssue.origin)||"json";pendingProgramImport=null;importIssue=null;if(origin==="library"||origin==="link")renderLib();else renderImportEntry();}
var manualCreatorState={name:"",description:"",weeks:8,days:[0,2,4]};
function syncManualCreatorForm(){var name=document.getElementById("manualname"),description=document.getElementById("manualdescription"),weeks=document.getElementById("manualweeks");if(name)manualCreatorState.name=name.value;if(description)manualCreatorState.description=description.value;if(weeks)manualCreatorState.weeks=Math.max(1,Math.min(LIMITS.maxWeeks,Math.round(Number(weeks.value)||8)));}
function renderManualCreator(){
 var s=manualCreatorState,h='<div class="libbox subviewbox"><div class="ohdr"><button class="iconbtn" id="createhubback" aria-label="Zurück">'+icon("chevron-left")+'</button><h1>Manuell erstellen</h1><button class="iconbtn" id="subclose" aria-label="Zurück zu Programme">'+icon("close")+'</button></div><div class="subviewlead">Lege nur die Grundlage fest. Übungen, Sätze und Wiederholungen bearbeitest du anschließend direkt im Programmeditor.</div><div class="manualgrid">';
 h+=editorInput('Programmname',s.name,'id="manualname"',{max:LIMITS.maxNameLen});h+=editorInput('Wochen',s.weeks,'id="manualweeks"',{type:'number',min:1,max:LIMITS.maxWeeks,step:'1'});h+='</div>';
 h+='<div class="edgrid" style="margin-top:10px">'+editorInput('Beschreibung (optional)',s.description,'id="manualdescription"',{wide:true,area:true,max:200})+'</div><div class="libsec" style="margin-top:16px">An welchen Tagen wird trainiert?</div><div class="manualdays" role="group" aria-label="Trainingstage auswählen">';
 WD_ABBR.forEach(function(label,index){h+='<button class="manualday'+(s.days.indexOf(index)>=0?' sel':'')+'" data-manual-day="'+index+'" aria-pressed="'+(s.days.indexOf(index)>=0)+'">'+label+'</button>';});h+='</div><div class="manualhint">Mindestens ein Trainingstag. Die Reihenfolge folgt Montag bis Sonntag und kann später im Editor geändert werden.</div>';
 h+='<div class="importnotice ok"><strong>Dein Startpunkt</strong>„Allgemein“ · 90 Sekunden Pause · 3 Sätze · 8–12 Wiederholungen. Ab vier Wochen wird die letzte Woche als leichtere Erholungswoche angelegt.</div><div class="importactions"><button class="smallbtn go" id="manualstart">Im Editor aufbauen</button><button class="smallbtn" id="manualcancel">Abbrechen</button></div></div>';document.getElementById("lib").innerHTML=h;
}
function createManualProgram(config){
 var weeks=Math.max(1,Math.min(LIMITS.maxWeeks,Math.round(Number(config.weeks)||8))),selected=(config.days||[]).slice().sort(function(a,b){return a-b;}),weekList=[],dayList=[];
 for(var i=1;i<=weeks;i++){var deload=weeks>=4&&i===weeks;weekList.push({n:i,phase:deload?"deload":"aufbau",label:deload?"Erholungswoche":"Aufbau",rir:deload?"4":"2",note:deload?"Bewusst leichter trainieren und erholen.":"Übungen sauber ausführen und kontrolliert steigern.",sets:{allgemein:deload?2:3}});}
 selected.forEach(function(dayIndex,index){var key=String.fromCharCode(65+index);dayList.push({key:key,weekday:WD_CANON[dayIndex],title:"Training "+key,exercises:[{name:"Neue Übung",category:"allgemein",unit:"reps"}]});});
 return{format:"trainings-block",version:2,name:String(config.name||"").trim(),description:String(config.description||"").trim(),categories:{allgemein:{label:"Allgemein",color:"emerald",rest:90,reps:{aufbau:[8,12],intensiv:[8,12],deload:[8,12]}}},weeks:weekList,days:dayList};
}
function startManualProgram(){syncManualCreatorForm();var s=manualCreatorState;if(!s.name.trim()){showModal("Programmname fehlt","Gib deinem neuen Programm zuerst einen Namen.",[{label:"Weiter bearbeiten",action:null}]);return;}if(s.name.trim().length>LIMITS.maxNameLen){showModal("Programmname zu lang","Der Name darf höchstens "+LIMITS.maxNameLen+" Zeichen haben.",[{label:"Weiter bearbeiten",action:null}]);return;}if(!s.days.length){showModal("Trainingstag fehlt","Wähle mindestens einen Trainingstag aus.",[{label:"Weiter bearbeiten",action:null}]);return;}var draft=createManualProgram(s),checked=parseProgram(JSON.stringify(draft));if(checked.err){showModal("Entwurf konnte nicht erstellt werden",checked.err,[{label:"OK",action:null}]);return;}openProgramDraft(draft,"create");}
var surfaceScrollY=0;
function lockSurfaceScroll(){if(document.body.classList.contains("surface-locked"))return false;surfaceScrollY=window.scrollY||document.documentElement.scrollTop||0;document.body.style.top="-"+surfaceScrollY+"px";document.body.classList.add("surface-locked");return true;}
function unlockSurfaceScroll(){if(!document.body.classList.contains("surface-locked"))return;var y=surfaceScrollY;document.body.classList.remove("surface-locked");document.body.style.top="";window.scrollTo(0,y);}
function openLib(){libReturnFocus=document.activeElement;renderLib();lockSurfaceScroll();var lib=document.getElementById("lib");lib.classList.add("open");updateSurfaceIsolation();focusSurface(lib,"#libclose");}
function closeLib(force){if(!force&&personalDraft){showModal("Eigene Übung noch nicht gespeichert","Dein Entwurf ist noch offen.",[{label:"Weiter bearbeiten",cls:"primary",action:null},{label:"Entwurf verwerfen",action:function(){personalDraft=null;personalFormSourceId=null;closeLib();}}]);return;}exerciseLibraryView="";if(!force&&editorHasUnsavedChanges()){confirmEditorExit("close");return;}resetProgramEditorState();pendingProgramImport=null;importIssue=null;document.getElementById("lib").classList.remove("open");updateSurfaceIsolation();unlockSurfaceScroll();if(libReturnFocus&&document.contains(libReturnFocus))libReturnFocus.focus();libReturnFocus=null;}

document.getElementById("lib").addEventListener("input",function(event){var input=event.target;if(input.dataset.personalField){syncPersonalExerciseForm();return;}if(input.dataset.personalSearch){var position=input.selectionStart,query=input.value;renderExerciseLibrary(query);var replacement=document.getElementById("exercisessearch");replacement.focus();try{replacement.setSelectionRange(position,position);}catch(error){}}});
