// ---------- Events ----------
var app=document.getElementById("app");
app.addEventListener("beforeinput",function(e){var t=e.target;if(t&&t.id&&t.id.indexOf("rep-")===0)onTimeBeforeInput(e,t);});
app.addEventListener("keydown",function(e){var t=e.target;if(t&&t.id&&t.id.indexOf("rep-")===0)onTimeKeyDown(e,t);});
app.addEventListener("paste",function(e){var t=e.target;if(t&&t.id&&t.id.indexOf("rep-")===0)onTimePaste(e,t);});
app.addEventListener("input",function(e){var t=e.target;if(!t.id)return;if(t.id.indexOf("rep-")===0||t.id.indexOf("wt-")===0){if(!onSetDraftInput(t))onSetInput(t);}});
app.addEventListener("focusin",function(e){var t=e.target;if(!t.id)return;if(timeFieldExercise(t)){t.dataset.clockDigits=timeDraftDigits(t.value);placeTimeCaret(t);return;}if(!active()||!t.value)return;if(t.id.indexOf("rep-")===0||t.id.indexOf("wt-")===0){try{t.select();}catch(err){}}});
app.addEventListener("change",function(e){var t=e.target;if(!t.id)return;if(t.id.indexOf("rep-")===0||t.id.indexOf("wt-")===0)onSetCommit(t);});
app.addEventListener("focusout",function(e){var t=e.target;if(t&&t.dataset&&t.dataset.timeDraft==="1"&&timeFieldExercise(t))onSetCommit(t);});
app.addEventListener("pointerdown",function(e){var b=e.target.closest&&e.target.closest("#pausew");if(!b||e.button!==0||e.isPrimary===false)return;e.preventDefault();beginWorkoutPauseHold(b,e.pointerId);});
app.addEventListener("pointerup",function(e){if(workoutPauseHoldButton&&(workoutPauseHoldPointerId==null||e.pointerId===workoutPauseHoldPointerId))cancelWorkoutPauseHold();});
app.addEventListener("pointercancel",function(e){if(workoutPauseHoldButton&&(workoutPauseHoldPointerId==null||e.pointerId===workoutPauseHoldPointerId))cancelWorkoutPauseHold();});
app.addEventListener("lostpointercapture",function(e){if(workoutPauseHoldButton&&(workoutPauseHoldPointerId==null||e.pointerId===workoutPauseHoldPointerId))cancelWorkoutPauseHold();});
app.addEventListener("keydown",function(e){var b=e.target.closest&&e.target.closest("#pausew");if(!b||(e.key!==" "&&e.key!=="Enter")||e.repeat)return;e.preventDefault();beginWorkoutPauseHold(b,null);});
app.addEventListener("keyup",function(e){var b=e.target.closest&&e.target.closest("#pausew");if(!b||(e.key!==" "&&e.key!=="Enter"))return;e.preventDefault();cancelWorkoutPauseHold();});
app.addEventListener("click",function(e){
 var timeInput=e.target.closest&&e.target.closest('input[data-set-kind="rep"]');if(timeInput&&timeFieldExercise(timeInput)){placeTimeCaret(timeInput);return;}
 var b=e.target.closest("button");if(!b)return;
 if(b.dataset.calibrationGuide){showCalibrationGuide();return;}
 if(b.dataset.versionInfo){showVersionInfo();return;}
 if(b.dataset.step){onStep(b);return;}
 if(b.dataset.rest){startRest(+b.dataset.rest,b.dataset.restEx);return;}
 if(b.dataset.holdEx){startHold(b.dataset.holdEx);return;}
 if(b.dataset.holdRow!=null){if(restPhase==="hold"&&restExId===b.dataset.holdRow)finishHold();else startHold(b.dataset.holdRow);return;}
 if(b.dataset.collapsePrev){delete expandedPreviewRows[b.dataset.collapsePrev];renderView();return;}
 if(b.dataset.expandPrev){expandedPreviewRows[b.dataset.expandPrev]=true;renderView();return;}
 if(b.dataset.expandDone){var expanded=findEx(b.dataset.expandDone);if(expanded){expandedDoneExercises[expanded.id]=true;var compact=document.getElementById("card-"+expanded.id);if(compact)replaceCardKeepingViewport(compact,exCardHtml(expanded),compact);applyLocks(expanded);}return;}
 if(b.dataset.collapseDone){var collapsed=findEx(b.dataset.collapseDone);if(collapsed){delete expandedDoneExercises[collapsed.id];cancelDoneCollapse(collapsed.id);var full=document.getElementById("card-"+collapsed.id);if(full)replaceCardKeepingViewport(full,exCardHtml(collapsed),full);}return;}
 if(b.dataset.plates){var plateEx=findEx(b.dataset.plates);if(plateEx)showPlateCalculator(plateEx);return;}
 if(b.dataset.exmenu){var menuEx=findEx(b.dataset.exmenu);if(menuEx)showExerciseMenu(menuEx);return;}
 if(b.dataset.note){var noteEx=findEx(b.dataset.note);if(noteEx)showExerciseNote(noteEx);return;}
 if(b.dataset.swapEx){var swapEx=findEx(b.dataset.swapEx);if(swapEx)showExerciseSwap(swapEx);return;}
 if(b.dataset.timeline){var timelineEx=findEx(b.dataset.timeline);if(timelineEx)showExerciseTimeline(timelineEx);return;}
 if(b.dataset.workoutDetail){var detailEx=findEx(b.dataset.workoutDetail);if(detailEx)openWorkoutExerciseDetail(detailEx);return;}
 if(b.dataset.hist){var hex=findEx(b.dataset.hist);if(hex)showHistory(hex);return;}
 if(b.id==="pausew"){e.preventDefault();return;}
 if(b.id==="resumew"){resumeWorkout();return;}
 if(b.id==="stopw"){confirmStop();return;}
 if(b.id==="wubtn"){startWucd("wu");return;}
 if(b.id==="cdbtn"){startWucd("cd");return;}
 if(b.id==="settingsbtn"){showSettings();return;}
 if(b.id==="libbtn"){openLib();return;}
 if(b.id==="pdf"){openReport();return;}
 if(b.id==="prev"){changeWeek(S.week-1);return;}
 if(b.id==="next"){changeWeek(S.week+1);return;}
 if(b.dataset.week){changeWeek(+b.dataset.week);return;}
 if(b.dataset.day){changeDay(b.dataset.day);return;}
});
document.getElementById("bar").addEventListener("click",function(e){
 var b=e.target.closest("button");if(!b)return;
 if(b.id==="startw"){startWorkout();}
 else if(b.id==="correctvalues"){startCorrection();}
 else if(b.id==="finishcorrection"){finishCorrection();}else if(b.id==="cancelcorrection"){cancelCorrection();}
 else if(b.id==="barpausew"){pauseWorkout();}
 else if(b.id==="barresumew"){resumeWorkout();}
 else if(b.id==="barstopw"){confirmStop();}
 else if(b.id==="stopr"){stopRest();}
 else if(b.id==="stophold"){finishHold();}
 else if(b.id==="cancelhold"){cancelHold();}
 else if(b.id==="nextpause"){startRest(restBaseSec,restExId);}
 else if(b.dataset.radj){adjustRest(+b.dataset.radj);}
});
document.getElementById("report").addEventListener("click",function(e){if(e.target.id==="report"){closeReport();return;}var b=e.target.closest("button");if(!b)return;if(b.id==="repclose"||b.id==="repback")closeReport();else if(b.id==="reprint")printReport();else if(b.id==="repprotocol")openProtocol();});
document.getElementById("protocol").addEventListener("click",function(e){if(e.target.id==="protocol"){closeProtocol();return;}var b=e.target.closest("button");if(!b)return;if(b.id==="protback")closeProtocol();else if(b.id==="protprint")printProtocol();});
window.addEventListener("keydown",function(e){
 var modal=document.getElementById("modal"),protocol=document.getElementById("protocol"),report=document.getElementById("report"),lib=document.getElementById("lib"),wucd=document.getElementById("wucd"),surface=modal.style.display==="flex"?modal:protocol.classList.contains("open")?protocol:report.classList.contains("open")?report:lib.classList.contains("open")?lib:wucd.classList.contains("open")?wucd:null;
 if(e.key==="Tab"&&surface){trapSurfaceFocus(e,surface);return;}
 if(e.key!=="Escape"||!surface)return;e.preventDefault();e.stopPropagation();
 if(surface===modal){var dismiss=modalDismissButton();if(dismiss)dismiss.click();return;}
 if(surface===protocol){closeProtocol();return;}
 if(surface===report){closeReport();return;}
 if(surface===lib){closeLib();return;}
 if(surface===wucd)endWucd();
});
document.getElementById("lib").addEventListener("click",function(e){
 var b=e.target.closest("button");if(!b)return;
 if(b.id==="exercisesbtn"){renderExerciseLibrary();focusSurface(document.getElementById("lib"),"#exercisessearch");return;}
 if(b.id==="exercisesback"){exerciseLibraryView="";renderLib();focusSurface(document.getElementById("lib"),"#exercisesbtn");return;}
 if(b.dataset.exerciseDetail){renderExerciseDetail(b.dataset.exerciseDetail,"library");return;}
 if(b.id==="exercisedetailback"){if(personalReturnView==="training"){exerciseLibraryView="";closeLib(true);}else renderExerciseLibrary();return;}
 if(b.id==="personalnew"){openPersonalExerciseForm(null,"library",false);return;}
 if(b.dataset.editorPersonalNew){syncEditorForm();openPersonalExerciseForm(null,"editor",false);return;}
 if(b.dataset.personalEdit){openPersonalExerciseForm(b.dataset.personalEdit,"library",false);return;}
 if(b.dataset.personalDuplicate){openPersonalExerciseForm(b.dataset.personalDuplicate,"library",true);return;}
 if(b.dataset.personalArchive){archivePersonalExercise(b.dataset.personalArchive,false);return;}
 if(b.id==="personalsave"){savePersonalExerciseForm();return;}
 if(b.id==="personalback"||b.id==="personalcancel"){showModal("Entwurf verwerfen?","Die noch nicht gespeicherte persönliche Übung wird verworfen.",[{label:"Weiter bearbeiten",cls:"primary",action:null},{label:"Entwurf verwerfen",action:returnFromPersonalExerciseForm}]);return;}
 if(b.dataset.versionInfo){showVersionInfo();return;}
 if(b.dataset.exerciseSuggestion){editorChooseExerciseLibraryEntry(+b.dataset.edDay,+b.dataset.edEx,(findExerciseLibraryEntryById(b.dataset.exerciseSuggestionId)||findExerciseLibraryEntry(b.dataset.exerciseSuggestion)),false);return;}
 if(b.dataset.info){e.preventDefault();var info=EDITOR_INFO[b.dataset.info];if(info)showModal(info.t,esc(info.m),[{label:"OK",cls:"primary",action:null}]);return;}
 if(b.id==="libclose"||b.id==="libresume"){closeLib();return;}
 if(b.id==="archivebtn"){renderArchive();return;}
 if(b.id==="archiveback"){renderLib();return;}
 if(b.id==="editorback"){returnToProgramList(false);return;}
 if(b.dataset.reportProgram){var reportId=b.dataset.reportProgram;closeLib(true);openReport(reportId,"archive");return;}
 if(b.dataset.followup){createFollowupBlock(b.dataset.followup);return;}
 if(b.dataset.archive){archiveProgram(b.dataset.archive);return;}
 if(b.dataset.unarchive){unarchiveProgram(b.dataset.unarchive);return;}
 if(b.dataset.edit){openProgramEditor(b.dataset.edit);return;}
 if(b.id==="editorhelp"){showEditorHelp();return;}
 if(b.id==="editorundo"){editorUndo();return;}
 if(b.dataset.edTab){syncEditorForm();editorView=b.dataset.edTab;editorExerciseIndex=null;renderProgramEditor();focusSurface(document.getElementById("lib"),'[data-ed-tab="'+editorView+'"]');return;}
 if(b.dataset.edDaypick!=null){if(Date.now()<editorSuppressClickUntil)return;syncEditorForm();editorDayIndex=+b.dataset.edDaypick;editorExerciseIndex=null;renderProgramEditor();focusSurface(document.getElementById("lib"),'[data-ed-daypick="'+editorDayIndex+'"]');return;}
 if(b.dataset.edWeekpick!=null){syncEditorForm();editorWeekIndex=+b.dataset.edWeekpick;renderProgramEditor();focusSurface(document.getElementById("lib"),'[data-ed-weekpick="'+editorWeekIndex+'"]');return;}
 if(b.dataset.edReleaseReference!=null){syncEditorForm();editorReleaseReference(+b.dataset.edDay,+b.dataset.edReleaseReference,false);return;}
 if(b.dataset.edOpenex!=null){if(Date.now()<editorSuppressClickUntil)return;syncEditorForm();var opened=+b.dataset.edOpenex;editorExerciseIndex=editorExerciseIndex===opened?null:opened;renderProgramEditor();focusSurface(document.getElementById("lib"),'[data-ed-openex="'+opened+'"]');return;}
 if(b.id==="edsavecopy"){editorStoreProgram(false,"back",false);return;}
 if(b.id==="edreplace"){editorStoreProgram(true,"back",false);return;}
 if(b.id==="edsavenew"){editorStoreProgram(false,"back",false);return;}
 if(b.id==="edsavenewactive"){editorStoreProgram(false,null,true);return;}
 if(b.id==="edaddcat"){editorPushUndo("Trainingsgruppe hinzugefügt");editorAddCategory();renderProgramEditor("details");return;}
 if(b.dataset.edDelcat){if(editorDraft.categories[b.dataset.edDelcat]&&!editorCategoryInUse(editorDraft,b.dataset.edDelcat)){editorPushUndo("Trainingsgruppe gelöscht");editorDeleteCategory(b.dataset.edDelcat);}renderProgramEditor("details");return;}
 if(b.id==="edaddweek"){editorPushUndo("Woche hinzugefügt");var wi=editorAddWeek();renderProgramEditor("weeks",wi);return;}
 if(b.dataset.edCopyweek!=null){editorPushUndo("Woche dupliziert");var cwi=editorAddWeek(+b.dataset.edCopyweek);renderProgramEditor("weeks",cwi);return;}
 if(b.dataset.edDelweek!=null){confirmEditorDeleteWeek(+b.dataset.edDelweek);return;}
 if(b.id==="edaddday"){editorPushUndo("Trainingstag hinzugefügt");var di=editorAddDay();renderProgramEditor("days",di);return;}
 if(b.dataset.edDelday!=null){confirmEditorDeleteDay(+b.dataset.edDelday);return;}
 if(b.dataset.edAddex!=null){var adi=+b.dataset.edAddex;editorPushUndo("Übung hinzugefügt");editorAddExercise(adi);renderProgramEditor("days",adi,editorDraft.days[adi].exercises.length-1);return;}
 if(b.dataset.edWucdAdd){var awd=+b.dataset.edDay,awk=b.dataset.edWucdAdd,awl=editorDraft.days[awd][awk]||(editorDraft.days[awd][awk]=[]);if(awl.length<8){editorPushUndo((awk==="warmup"?"Warm-up":"Cool-down")+" ergänzt");awl.push({name:WUCD_LIB[awk][0],seconds:45});renderProgramEditor("days",awd,editorExerciseIndex);}return;}
 if(b.dataset.edWucdDelete){var dwd=+b.dataset.edDay,dwk=b.dataset.edWucdDelete,dwi=+b.dataset.edWucdIndex,dwl=editorDraft.days[dwd][dwk];if(dwl&&dwl[dwi]){editorPushUndo("Timer-Eintrag gelöscht");dwl.splice(dwi,1);renderProgramEditor("days",dwd,editorExerciseIndex);}return;}
 if(b.dataset.edWucdMove){var mwd=+b.dataset.edDay,mwk=b.dataset.edWucdKind,mwi=+b.dataset.edWucdIndex,mto=mwi+(+b.dataset.edWucdMove),mwl=editorDraft.days[mwd][mwk];if(mwl&&mto>=0&&mto<mwl.length){editorPushUndo("Timer-Eintrag verschoben");var mit=mwl.splice(mwi,1)[0];mwl.splice(mto,0,mit);renderProgramEditor("days",mwd,editorExerciseIndex);}return;}
 if(b.dataset.edDelex){var ddi=+b.dataset.edDay,dei=+b.dataset.edEx;editorPushUndo("Übung gelöscht");editorDraft.days[ddi].exercises.splice(dei,1);editorExerciseIndex=null;renderProgramEditor("days",ddi,null);return;}
 if(b.dataset.edMoveex){var mdi=+b.dataset.edDay,mei=+b.dataset.edEx,move=+b.dataset.edMoveex;editorPushUndo("Übung verschoben");editorMoveExercise(mdi,mei,move);renderProgramEditor("days",mdi,mei+move);return;}
 if(b.dataset.sel){if(setActive(b.dataset.sel))closeLib();return;}
 if(b.id==="createhubback"){syncManualCreatorForm();renderLib();return;}
 if(b.id==="subclose"){syncManualCreatorForm();pendingProgramImport=null;importIssue=null;renderLib();return;}
 if(b.dataset.progmenu){showProgramMenu(b.dataset.progmenu);return;}
 if(b.dataset.libraryEdit!=null){editProgramLibraryItem(+b.dataset.libraryEdit);return;}
 if(b.dataset.libraryShare!=null){shareProgramLibraryItem(+b.dataset.libraryShare);return;}
 if(b.dataset.libraryIndex!=null){loadProgramLibraryItem(+b.dataset.libraryIndex);return;}
 if(b.id==="manualcreate"){renderManualCreator();return;}
 if(b.id==="manualcancel"){syncManualCreatorForm();renderLib();return;}
 if(b.id==="manualstart"){startManualProgram();return;}
 if(b.dataset.manualDay!=null){syncManualCreatorForm();var md=+b.dataset.manualDay,pos=manualCreatorState.days.indexOf(md);if(pos>=0)manualCreatorState.days.splice(pos,1);else manualCreatorState.days.push(md);manualCreatorState.days.sort(function(a,b){return a-b;});renderManualCreator();return;}
 if(b.id==="externalaibtn"){renderExternalAiCreate();return;}
 if(b.id==="importbtn"){renderImportEntry();return;}
 if(b.id==="importclear"){importInputText="";importSourceName="";renderImportEntry();var cleared=document.getElementById("libpaste");if(cleared)cleared.focus();return;}
 if(b.id==="importback"||b.id==="importeditjson"||b.id==="importpreviewback"){returnFromImportFlow();return;}
 if(b.id==="importrepair"){repairImportInEditor();return;}
 if(b.id==="importactivate"){storeImportedProgram(true,false);return;}
 if(b.id==="importcopy"){storeImportedProgram(false,true);return;}
 if(b.id==="importexisting"){useExistingDuplicate();return;}
 if(b.id==="importupdate"){importUpdateExisting();return;}
 if(b.id==="importedit"){if(pendingProgramImport)openProgramDraft(pendingProgramImport.external,"preview",pendingProgramImport.origin);return;}
 if(b.id==="libbackup"){var backupOk=downloadFullBackup("satzkraft-backup");if(backupOk)renderLib();showModal(backupOk?"Backup gespeichert":"Backup fehlgeschlagen",backupOk?"Die vollständige Sicherungsdatei wurde heruntergeladen. Bewahre sie an einem sicheren Ort auf.":"Die Sicherungsdatei konnte nicht heruntergeladen werden.",[{label:"OK",cls:backupOk?"primary":"",action:null}]);return;}
 if(b.id==="libload"){var ta=document.getElementById("libpaste");beginProgramImport(ta?ta.value:importInputText,"json","");return;}
 if(b.id==="proshare"){showShareModal();return;}
 if(b.id==="explink"){ensureProgramCode(PROG());var eo=exportTranslate(PROG());delete eo._anleitung;var u=location.origin+location.pathname+"#p="+btoa(unescape(encodeURIComponent(JSON.stringify(eo))));copyWithFeedback(u,"Link kopiert","Wer den Link öffnet, bekommt dein Programm zum Laden angeboten (ohne deinen Fortschritt). Bei sehr großen Programmen kann der Link von Messengern gekürzt werden – dann Datei-Export nutzen.","Nutze stattdessen den Datei-Export.");return;}
 if(b.id==="expfile"){downloadText((PROG().name||"programm").replace(/[^a-z0-9]+/gi,"_")+".json",exportCurrentJSON());return;}
 if(b.id==="expcopy"){copyWithFeedback(exportCurrentJSON(),"Kopiert","Das Programm liegt als JSON in der Zwischenablage – mit deinen aktuellen Arbeitsgewichten als Startgewichten. Jetzt einer KI geben oder selbst bearbeiten, dann über „Import“ wieder einfügen.","Konnte nicht kopieren. Nutze stattdessen „Als Datei“.");return;}
 if(b.id==="tplcopy"){copyWithFeedback(JSON.stringify(BLANK_TEMPLATE,null,2),"Beispiel-Vorlage kopiert","Eine vollständige, korrekte Beispiel-Vorlage liegt in der Zwischenablage – ideal als Muster für die KI.","Nutze stattdessen „Als Datei“.",true);return;}
 if(b.id==="tplpromptcopy"){var wish=document.getElementById("externalwish");externalAiWish=wish?wish.value.trim():externalAiWish.trim();if(!externalAiWish){showModal("Trainingswunsch fehlt","Beschreibe zuerst kurz, wie dein Trainingsprogramm aussehen soll.",[{label:"Weiter schreiben",cls:"primary",action:null}]);return;}copyWithFeedback(externalAiPrompt(externalAiWish),"Text für ChatGPT kopiert","Füge den Text jetzt unverändert bei ChatGPT, Claude oder einer anderen KI ein. Kopiere danach die vollständige JSON-Antwort zurück zu Satzkraft.","Markiere den Inhalt erneut und versuche es noch einmal.",true);return;}
 if(b.id==="tplfile"){downloadText("vorlage-trainings-block.json",JSON.stringify(BLANK_TEMPLATE,null,2));return;}
});
document.getElementById("lib").addEventListener("toggle",function(e){var section=e.target;if(editorDraft&&section.matches&&section.matches("details[data-ed-section]"))editorOpenSections[section.dataset.edSection]=section.open;},true);
document.getElementById("lib").addEventListener("focusin",function(e){
 var t=e.target;if(!editorDraft||!/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)||!(t.dataset.edProgram||t.dataset.edOwn||t.dataset.edReps||t.dataset.edCat||t.dataset.edWeek!=null||t.dataset.edDay!=null||t.dataset.edWucd))return;
 if(editorUndoField!==t){editorPushUndo("Eingabe geändert");editorUndoField=t;}
});
document.getElementById("lib").addEventListener("focusout",function(e){if(editorUndoField===e.target)editorUndoField=null;});
document.getElementById("lib").addEventListener("pointerdown",function(e){
 if(!editorDraft||(e.button!=null&&e.button!==0))return;var handle=e.target.closest("[data-ed-drag-ex],[data-ed-drag-day]");if(!handle)return;
 var type=handle.dataset.edDragEx!=null?"exercise":"day";editorDragState={type:type,source:+(type==="exercise"?handle.dataset.edDragEx:handle.dataset.edDragDay),day:+(handle.dataset.edDay||editorDayIndex),pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,handle:handle,active:false,target:null,position:null,previewOrder:null,previewIndex:null,previewMoved:false,timer:null};
 if(handle.setPointerCapture)try{handle.setPointerCapture(e.pointerId);}catch(err){}
 editorDragState.timer=setTimeout(function(){if(!editorDragState||editorDragState.handle!==handle)return;activateEditorDrag();},180);
});
document.getElementById("lib").addEventListener("pointermove",function(e){
 var drag=editorDragState;if(!drag||e.pointerId!==drag.pointerId)return;if(!drag.active){var distance=Math.abs(e.clientX-drag.startX)+Math.abs(e.clientY-drag.startY);if(distance<6)return;if(drag.timer)clearTimeout(drag.timer);activateEditorDrag();}e.preventDefault();clearEditorDropTargets();var box=document.querySelector("#lib .editorbox");if(box)box.classList.add("dragging");var under=document.elementFromPoint(e.clientX,e.clientY),target;
 if(drag.type==="exercise"){target=under&&under.closest("[data-ed-ex-card]");if(target&&target!==drag.handle.closest("[data-ed-ex-card]")){var rect=target.getBoundingClientRect();drag.target=+target.dataset.edDragOriginal;drag.position=e.clientY<rect.top+rect.height/2?"before":"after";editorPreviewExerciseMove(drag,target,drag.position);}else{drag.target=null;drag.position=null;}}
 else{target=under&&under.closest("[data-ed-weekday-slot]");if(target){drag.target=+target.dataset.edWeekdaySlot;target.classList.add("eddaytarget");}else drag.target=null;}
});
document.getElementById("lib").addEventListener("pointerup",function(e){if(editorDragState&&e.pointerId===editorDragState.pointerId)finishEditorDrag(e,false);});
document.getElementById("lib").addEventListener("pointercancel",function(e){if(editorDragState&&e.pointerId===editorDragState.pointerId)finishEditorDrag(e,true);});
document.getElementById("lib").addEventListener("keydown",function(e){if(!e.target)return;var t=e.target;if(t.getAttribute&&t.getAttribute("role")==="combobox"){var list=document.getElementById(t.getAttribute("aria-controls")),options=list?Array.prototype.slice.call(list.querySelectorAll('[role="option"]')):[];if(e.key==="ArrowDown"&&options.length){e.preventDefault();options[0].focus();return;}if(e.key==="Escape"&&list){e.preventDefault();list.innerHTML="";t.setAttribute("aria-expanded","false");return;}}if(t.getAttribute&&t.getAttribute("role")==="option"&&(e.key==="ArrowDown"||e.key==="ArrowUp")){var optionList=t.closest('[role="listbox"]'),optionItems=optionList?Array.prototype.slice.call(optionList.querySelectorAll('[role="option"]')):[],optionIndex=optionItems.indexOf(t),nextIndex=e.key==="ArrowDown"?optionIndex+1:optionIndex-1;if(optionItems.length&&optionIndex>=0){e.preventDefault();if(nextIndex<0){var combo=document.querySelector('[aria-controls="'+optionList.id+'"]');if(combo)combo.focus();}else optionItems[Math.min(nextIndex,optionItems.length-1)].focus();}return;}});
document.getElementById("lib").addEventListener("change",function(e){var t=e.target;if(t.id==="libfile"&&t.files&&t.files[0]){var file=t.files[0];importSourceName=file.name||"Ausgewählte Datei";if(file.size>5000000){importIssue={error:explainProgramError("Die Datei ist größer als 5 MB."),sourceText:"",corrections:[],origin:"file",sourceName:importSourceName};renderImportError();return;}var r=new FileReader();r.onload=function(){beginProgramImport(String(r.result),"file",importSourceName);};r.onerror=function(){importIssue={error:explainProgramError("Die Datei konnte nicht gelesen werden."),sourceText:"",corrections:[],origin:"file",sourceName:importSourceName};renderImportError();};r.readAsText(file);return;}if(t.id==="backupfile"&&t.files&&t.files[0]){var backupFile=t.files[0];if(backupFileTooLarge(backupFile.size)){showModal("Backup nicht geladen","Die Datei ist größer als 20 MB. Deine aktuellen Daten bleiben unverändert.",[{label:"OK",cls:"primary",action:null}]);t.value="";return;}var br=new FileReader();br.onload=function(){importBackup(String(br.result));};br.onerror=function(){showModal("Backup nicht geladen","Die Datei konnte nicht gelesen werden. Deine aktuellen Daten bleiben unverändert.",[{label:"OK",cls:"primary",action:null}]);};br.readAsText(backupFile);return;}if(editorDraft&&(t.dataset.edProgram||t.dataset.edReps||t.dataset.edCat||t.dataset.edWeek!=null||t.dataset.edDay!=null||t.dataset.edWucd)){var rerender=updateEditorInput(t);if(t.dataset.edReps){renderProgramEditor("details");return;}if(t.dataset.edWeek!=null&&t.dataset.edField==="phase"){renderProgramEditor("weeks",+t.dataset.edWeek);return;}if(t.dataset.edDay!=null&&(rerender||t.dataset.edField==="weekday"||t.dataset.edField==="category"||t.dataset.edField==="exerciseType")){renderProgramEditor("days",+t.dataset.edDay,t.dataset.edEx==null?null:+t.dataset.edEx);}}});
document.getElementById("lib").addEventListener("input",function(e){var t=e.target;if(t.id==="libpaste"){importInputText=t.value;var clear=document.getElementById("importclear");if(clear)clear.hidden=!t.value;return;}if(t.id==="externalwish"){externalAiWish=t.value;var copy=document.getElementById("tplpromptcopy");if(copy)copy.disabled=!externalAiWish.trim();return;}if(t.id==="manualname"||t.id==="manualdescription"||t.id==="manualweeks"){syncManualCreatorForm();return;}if(editorDraft&&t.type!=="checkbox"&&t.tagName!=="SELECT"&&(t.dataset.edProgram||t.dataset.edCat||t.dataset.edWeek!=null||t.dataset.edDay!=null)){updateEditorInput(t);editorRefreshFieldWarnings(t);if(t.dataset.edField==="name"&&t.dataset.edEx!=null)renderExerciseLibraryAutocomplete(t);}});
window.addEventListener("beforeunload",function(e){if(!localWindowHasDraft()||localWriterDraftSecured)return;e.preventDefault();e.returnValue="";});
