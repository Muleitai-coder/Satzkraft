/* Geführte physische Geräteabnahme. Keine Übertragung und keine echten Trainingsdaten. */
(function () {
 "use strict";
 var MODE_KEY="satzkraft-device-test-mode-v1", REPORT_KEY="satzkraft-device-test-reports-v1";
 var PREFIX="satzkraft-device-test-v1:", PROTOCOL=1, MAX_RUNS=20;
 var MODELS=["iPhone 17 Pro","iPhone 17","iPhone 17 Pro Max","iPhone 16","iPhone 16 Pro","iPhone 15","iPhone 15 Pro","iPhone 13 mini","iPhone SE (2. Generation)","iPhone SE (3. Generation)","Anderes iPhone"];
 // Manuell gepflegte Auswahl, Apple-Updateübersichten geprüft am 21.10.2026.
 // Keine automatische Erkennung oder Behauptung der Gerätekompatibilität.
 var IOS_GROUPS=[
  {label:"iOS 27",versions:["27.0.1","27.0"]},
  {label:"iOS 26",versions:["26.7.1","26.7","26.6.2","26.6.1","26.6","26.5.2","26.5.1","26.5","26.4.2","26.4.1","26.4","26.3.1","26.3","26.2.1","26.2","26.1","26.0.1","26.0"]},
  {label:"Ältere iOS-Versionen",versions:["18.0","17.0","16.0","15.0"]}
 ];
 // Berichtsschritte bleiben stabil; kleine Aufgaben führen durch die physische Prüfung.
 var STEPS=[
  {id:"prepare",title:"Vorbereiten",ready:true,parts:[
   {title:"Internet noch anlassen",lines:["WLAN oder mobile Daten anlassen.","Die App prüft alles automatisch."],action:"confirm",label:"Weiter"}]},
  {id:"offline",title:"Offline eingeben",parts:[
   {title:"Internet ausschalten",lines:["iPhone-Einstellungen → Flugmodus an.","Einstellungen → WLAN ausdrücklich aus.","Danach hier weitermachen."],action:"confirm",label:"Ist ausgeschaltet · Weiter"},
   {title:"Diese Werte eintragen",lines:["Satz 1: 10 Wiederholungen.","Gewicht: 20 kg.","Danach außerhalb des Feldes tippen."],expect:"Beide Werte bleiben stehen.",action:"weight",hint:"10 Wdh. · 20 kg"}]},
  {id:"timer",title:"Zeit und Timer",parts:[
   {title:"Zeit und Gewicht eintragen",lines:["Zeitfeld: 45 eintippen → 0:45 min.","Gewicht: 12,5 kg."],expect:"Zeit und Gewicht bleiben stehen.",action:"time",hint:"0:45 min · 12,5 kg"},
   {title:"Stoppuhr ausprobieren",lines:["Startsymbol am Zeitfeld antippen.","Kurz warten → unten „Stopp & eintragen“."],expect:"Zeit eingetragen; Satzpause zählt herunter.",action:"hold",hint:"Stoppuhr starten → stoppen"}]},
  {id:"background",title:"Display sperren",parts:[
   {title:"Kurz das iPhone sperren",lines:["Display mit der Seitentaste sperren.","Etwa 1 Minute warten und entsperren."],expect:"Werte erhalten, App bedienbar, Pausenzeit plausibel.",action:"confirm",label:"Geprüft · Weiter",hint:"1 Minute sperren",values:true}]},
  {id:"reload",title:"Neu laden",checkpoint:true,parts:[
   {title:"Ohne Internet neu laden",lines:["Flugmodus an und WLAN aus lassen.","Unten neu laden; die Werte sollen bleiben."],expect:"Danach: gleiche Werte, Training pausiert.",action:"reload",label:"Jetzt neu laden",hint:"Offline neu laden",values:true}]},
  {id:"cold",title:"Ganz schließen",checkpoint:true,parts:[
   {title:"App ganz schließen",lines:["Unten den Teststand sichern.","Im App-Umschalter Safari bzw. Satzkraft wegwischen.","Offline wieder öffnen."],expect:"Danach: gleiche Werte, Training pausiert.",help:"App-Umschalter: vom unteren Rand hochwischen und kurz halten. Mit Home-Button: zweimal drücken.",action:"cold",label:"Teststand sichern",hint:"App wegwischen → wieder öffnen",values:true}]},
  {id:"windows",title:"Zweiter Tab",parts:[
   {title:"Zweiten Safari-Tab prüfen",lines:["Satzkraft in einem zweiten Safari-Tab öffnen.","Dort muss eine Warteanzeige erscheinen.","Ersten Tab schließen → im zweiten „Aktuellen Stand laden“."],expect:"Die gleichen Werte sind wieder da.",help:"In der Home-Bildschirm-App ohne zweiten Tab: über „Problem“ den Schritt mit einer Notiz auslassen.",action:"confirm",label:"Geprüft · Weiter",hint:"Zweiter Tab wartet",values:true}]},
  {id:"library",title:"Bibliothek",parts:[
   {title:"Übung offline suchen",lines:["Nach Kniebeuge suchen.","„Details & Verlauf“ → „Technik & Erfassung“ öffnen.","Ansicht oben rechts schließen."],expect:"Übungen und Details laden ohne Internet.",action:"library",label:"Training beenden & Suche öffnen",hint:"Kniebeuge suchen → Details lesen"},
   {title:"Eigene Übung anlegen",lines:["„Eigene Übung erstellen“ antippen.","Name: Offline-Test → speichern.","Ansicht oben rechts schließen."],expect:"Offline-Test ist gespeichert.",action:"library",label:"Bibliothek öffnen",hint:"Eigene Übung: Offline-Test"}]},
  {id:"backup",title:"Backup",parts:[
   {title:"Testbackup speichern",lines:["Testbackup herunterladen.","In Dateien → Downloads nach satzkraft-testbackup suchen."],expect:"Die JSON-Datei ist in Dateien angekommen.",action:"download",label:"Testbackup herunterladen",hint:"Datei in Downloads prüfen"},
   {title:"Testbackup einlesen",lines:["„Backup wiederherstellen“ → Testdatei auswählen.","„Sichern & wiederherstellen“ bestätigen."],expect:"Nach dem Neustart sind die Werte wieder da.",action:"restore",label:"Wiederherstellung öffnen",hint:"Testdatei wiederherstellen",values:true},
   {title:"Internet wieder einschalten",lines:["Flugmodus aus, WLAN an.","Prüfen: Die Werte sind noch da."],action:"confirm",label:"Geprüft · Weiter",values:true}]},
  {id:"touch",title:"Darstellung",parts:[
   {title:"Tastatur und Querformat",lines:["Zahlenfeld antippen: Tastatur öffnet sich.","iPhone quer und wieder hoch halten."],expect:"Felder und Knöpfe bleiben erreichbar.",action:"weight",hint:"Tastatur · Hoch- und Querformat"},
   {title:"Hell und Dunkel prüfen",lines:["Beide Ansichten unten ausprobieren.","Texte und Knöpfe müssen lesbar bleiben."],action:"confirm",label:"Geprüft · Abschließen",theme:true}]}
 ];
 var boot=String(Date.now())+Math.random().toString(36).slice(2), checks=null, notice="", busy=false, screen="run", activeRun=null, libraryObserver=null;
 function isTest(){return typeof DEVICE_TEST_MODE!=="undefined"&&DEVICE_TEST_MODE;}
 function read(){var raw=localStorage.getItem(REPORT_KEY);if(!raw)return{active:null,runs:[]};var data=JSON.parse(raw);if(!data||!Array.isArray(data.runs))throw new Error("Ungültige Testberichte");return data;}
 function write(data){localStorage.setItem(REPORT_KEY,JSON.stringify(data));}
 function current(data){return data.runs.find(function(r){return r.id===data.active;})||null;}
 function guard(){if(localWriteBlocked())throw new Error("Dieses Fenster darf gerade nicht speichern.");if((localStorage.getItem(MODE_KEY)==="1")!==isTest())throw new Error("Der Testbereich wurde in einem anderen Fenster gewechselt. Bitte neu laden.");}
 function error(e){var field=document.getElementById("dt-note"),note=field&&field.value;notice=e&&e.message?e.message:"Speichern nicht möglich. Bitte Browserspeicher prüfen.";show();field=document.getElementById("dt-note");if(field&&note)field.value=note;}
 function update(fn){try{guard();var data=read(),run=current(data);if(!run)throw new Error("Kein aktiver Testlauf.");fn(run);write(data);notice="";screen="run";show();return true;}catch(e){error(e);return false;}}
 function status(run){var values=STEPS.map(function(s){return run.results[s.id]&&run.results[s.id].status||"pending";});return values.indexOf("fail")>=0?"Fehler":values.every(function(s){return s==="pass";})?"Bestanden":values.every(function(s){return s!=="pending";})?"Unvollständig (übersprungen)":"Offen";}
 function label(value){return{pending:"Offen",pass:"Bestanden",fail:"Fehler",skip:"Übersprungen"}[value]||"Offen";}
 function option(v,selected){return '<option'+(v===selected?' selected':'')+'>'+esc(v)+'</option>';}
 function input(id,title,value,max){return '<label class="dt-field">'+title+'<input id="'+id+'" value="'+attr(value||"")+'" maxlength="'+max+'" required></label>';}
 function knownIos(value){return IOS_GROUPS.some(function(group){return group.versions.indexOf(value)>=0;});}
 function selectedIos(value,custom){return value==="other"?String(custom||"").trim().slice(0,40):knownIos(value)?value:"";}
 function iosFields(previous){var custom=!!previous&&!knownIos(previous),selected=custom?"other":previous||"";return '<label class="dt-field">Installierte iOS-Version<select id="dt-ios" required><option value=""'+(!selected?' selected':'')+'>Bitte auswählen</option>'+IOS_GROUPS.map(function(group){return '<optgroup label="'+attr(group.label)+'">'+group.versions.map(function(v){return '<option value="'+v+'"'+(selected===v?' selected':'')+'>iOS '+v+'</option>';}).join('')+'</optgroup>';}).join('')+'<option value="other"'+(custom?' selected':'')+'>Andere Version / Beta …</option></select></label><div id="dt-ios-custom-wrap"'+(custom?'':' hidden')+'>'+input("dt-ios-custom","Genaue iOS-Version / Beta",custom?previous:"",40)+'</div>';}
 function button(action,title,primary,extra){return '<button type="button" class="mbtn'+(primary?' primary':'')+'" data-dt="'+action+'" '+(extra||'')+'>'+title+'</button>';}
 function digest(){syncStore();var json=JSON.stringify(S.logs),hash=2166136261;for(var i=0;i<json.length;i++){hash^=json.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16);}
 function newState(){
  var s=initState(),p=s.programs.default;p.name="Offline-Gerätetest";p.description="Nur synthetische Testdaten";
  p.days=[{key:"A",wd:"Montag",title:"Offline-Test",ex:[
   {id:"qa_weight",name:"Test · Gewicht",cat:"strength",w:true,def:0,inc:2.5,unit:"reps"},
   {id:"qa_time",name:"Test · Zeitlast",cat:"core",w:true,def:0,inc:1,unit:"seconds",target:"0:45 min"},
   {id:"qa_hold",name:"Test · Halten",cat:"core",w:false,unit:"seconds",target:"0:10 min"}
  ]}];p.weeks=p.weeks.slice(0,1);p.weeks[0].sets={strength:2,hyp:2,skill:2,core:2};
  s.store.default=newStore(p);alias(s);return s;
 }
 function start(){
  var rollback=null,mutationStarted=false;
  try{
   guard();if(!flushSave())throw new Error("Der aktuelle Trainingsstand konnte nicht gesichert werden.");var model=document.getElementById("dt-model").value,custom=document.getElementById("dt-custom").value.trim(),ios=selectedIos(document.getElementById("dt-ios").value,document.getElementById("dt-ios-custom").value),context=document.getElementById("dt-context").value;
   if(!ios||model==="Anderes iPhone"&&!custom){notice="Bitte iOS-Version und gegebenenfalls das genaue Modell eintragen.";var msg=document.getElementById("dt-notice");msg.textContent=notice;return;}
   var data=read(),now=Date.now(),run={id:now+"-"+Math.random().toString(36).slice(2,9),protocol:PROTOCOL,model:model==="Anderes iPhone"?custom:model,ios:ios,context:context,version:APP_VERSION,startedAt:now,step:0,results:{},checkpoints:{},environment:null};
   data.runs.unshift(run);data.runs=data.runs.slice(0,MAX_RUNS);data.active=run.id;
   // Erst den Bericht und synthetischen Zustand schreiben, zuletzt den Startschalter.
   var testKeys=[];rollback={};for(var i=0;i<localStorage.length;i++){var key=localStorage.key(i);if(key.indexOf(PREFIX)===0){testKeys.push(key);rollback[key]=localStorage.getItem(key);}}
   [REPORT_KEY,MODE_KEY,PREFIX+"cali-plan-v3",PREFIX+"satzkraft-design-update-v1"].forEach(function(key){rollback[key]=localStorage.getItem(key);});
   mutationStarted=true;
   if(isTest())backupRestorePending=true;
   testKeys.forEach(function(key){localStorage.removeItem(key);});
   localStorage.setItem(PREFIX+"cali-plan-v3",JSON.stringify(newState()));
   localStorage.setItem(PREFIX+"satzkraft-design-update-v1","1");
   write(data);localStorage.setItem(MODE_KEY,"1");
   clearTimeout(saveT);location.reload();
  }catch(e){if(mutationStarted&&rollback){try{Object.keys(rollback).forEach(function(key){if(rollback[key]===null)localStorage.removeItem(key);else localStorage.setItem(key,rollback[key]);});}catch(restoreError){e=new Error("Teststart fehlgeschlagen; der vorherige Teststand konnte nicht vollständig zurückgeschrieben werden. Echte Trainingsdaten bleiben getrennt.");}}backupRestorePending=false;error(e);}
 }
 async function preflight(){
  if(busy)return;busy=true;notice="";show();
  try{
   guard();var storage=false,probe=PREFIX+"probe";
   try{localStorage.setItem(probe,boot);storage=localStorage.getItem(probe)===boot;localStorage.removeItem(probe);}catch(e){}
   var controlled=!!(navigator.serviceWorker&&navigator.serviceWorker.controller),cacheReady=false,missing=[];
   var files=["index.html","js/progression.js","js/device-test.js?v="+APP_VERSION,"manifest.json","icon-192.png","icon-512.png","uebungen.json","fonts/hanken-grotesk-latin.woff2","fonts/jetbrains-mono-latin.woff2","programme/gym-ganzkoerper-beginner.json","programme/gym-ganzkoerper-fortgeschritten.json","programme/calisthenics-einstieg.json","programme/hybrid-gym-calisthenics.json"];
   if("caches" in window){var names=await caches.keys(),name="satzkraft-v"+APP_VERSION;if(names.indexOf(name)>=0){var cache=await caches.open(name);for(var i=0;i<files.length;i++){if(!await cache.match(new URL(files[i],location.href).href))missing.push(files[i]);}cacheReady=missing.length===0;}}
   guard();checks={at:Date.now(),storage:storage,controlled:controlled,cache:cacheReady,isolated:isTest()&&KEY===PREFIX+"cali-plan-v3",onlineHint:navigator.onLine,standalone:!!(navigator.standalone||matchMedia("(display-mode: standalone)").matches),viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},missing:missing};
   var data=read(),run=current(data);if(run){run.environment=checks;write(data);}notice="";
  }catch(e){notice=e.message;}finally{busy=false;show();}
 }
 function ready(env){return !!(env&&env.storage&&env.controlled&&env.cache&&env.isolated);}
 function guide(run){var g=run.guide;return g&&g.step===run.step&&Number.isInteger(g.part)&&g.part>=0&&g.part<STEPS[run.step].parts.length?g:{step:run.step,part:0,view:"task"};}
 function task(run){return STEPS[run.step].parts[guide(run).part];}
 function finishStep(run,value,note){run.results[STEPS[run.step].id]={status:value,note:note,at:Date.now(),physicalConfirmation:true};if(run.step<STEPS.length-1)run.step++;else run.finished=true;run.guide={step:run.step,part:0,view:"task"};}
 function mark(value){
  var field=document.getElementById("dt-note"),note=field?field.value.trim():"";
  update(function(run){
   if(run.version!==APP_VERSION)throw new Error("Die App-Version hat gewechselt. Bitte einen neuen Testlauf starten.");
   var step=STEPS[run.step],g=guide(run),part=task(run);
   if(value==="pass"){
    if(step.ready&&!ready(run.environment))throw new Error("Die Vorbereitung ist noch nicht abgeschlossen. Bitte online bleiben und erneut prüfen.");
    if(part.action!=="confirm"&&g.view!=="check")throw new Error("Öffne zuerst die Aufgabe und führe sie auf deinem iPhone durch.");
    if(step.checkpoint&&!(run.checkpoints[step.id]&&run.checkpoints[step.id].verified))throw new Error("Der Neustart ist noch nicht bestätigt. Führe die Aufgabe erneut aus oder melde das Problem.");
    if(!inputReady(run,S.logs,S.personalExercises))throw new Error("Bitte die angegebenen Werte eintragen oder das Problem melden.");
    if(g.part<step.parts.length-1){run.guide={step:run.step,part:g.part+1,view:"task"};return;}
   }else if(!note)throw new Error("Bitte Fehler beziehungsweise Grund kurz notieren.");
   finishStep(run,value,note);
  });
 }
 function checkpoint(run){if(!Object.keys(S.logs).some(function(key){return S.logs[key].sets&&S.logs[key].sets.some(function(set){return Number(set.reps)>0;});}))throw new Error("Bitte erst Testwerte im Training eintragen.");if(!S.workout)throw new Error("Öffne zuerst das Testtraining und starte es erneut.");if(!flushSave())throw new Error("Testdaten konnten nicht gespeichert werden.");run.checkpoints[STEPS[run.step].id]={boot:boot,digest:digest(),at:Date.now(),verified:false};}
 function inputTarget(run){return {weight:"qa_weight",time:"qa_time",hold:"qa_hold"}[task(run).action]||"";}
 function inputReady(run,logs,personal){
  function set(id){return logs&&logs["1|A|"+id]&&logs["1|A|"+id].sets&&logs["1|A|"+id].sets[0]||{};}
  function number(value){return Number(String(value).replace(",","."));}
  var g=guide(run),value;
  if(run.step===1&&g.part===1){value=set("qa_weight");return number(value.reps)===10&&number(value.weight)===20;}
  if(run.step===2&&g.part===0){value=set("qa_time");return number(value.reps)===45&&number(value.weight)===12.5;}
  if(run.step===2&&g.part===1)return number(set("qa_hold").reps)>0;
  if(run.step===7&&g.part===1)return Object.keys(personal||{}).some(function(id){return personal[id].name==="Offline-Test";});
  return true;
 }
 function prepareFields(run){
  var target=inputTarget(run);if(!target||guide(run).view!=="task"||run.finished||run.version!==APP_VERSION)return;
  guard();var data=read(),r=current(data);r.guide={step:r.step,part:guide(r).part,view:"check"};write(data);run.guide=r.guide;
  if(!active())beginWorkout();else if(!S.workout.running)resumeWorkout();
  cancelAllAutoRest();resetRestState();clearRestFocus();renderBar();
  expandedDoneExercises[target]=true;cancelDoneCollapse(target);renderView();
 }
 function doTask(){
  try{
   guard();var run=current(read());if(!isTest()||!run||run.version!==APP_VERSION)throw new Error("Bitte einen neuen Testlauf starten.");
   var action=task(run).action;
   if(action==="confirm"){mark("pass");return;}
   if(action==="download"&&(!flushSave()||!downloadFullBackup("satzkraft-testbackup")))throw new Error("Die Datei konnte nicht gespeichert werden. Bitte erneut versuchen.");
   if((action==="library"||action==="restore")&&active()&&stopWorkout(true)===false)throw new Error("Das Testtraining konnte nicht gespeichert werden.");
   if(!update(function(r){if(action==="reload"||action==="cold")checkpoint(r);r.guide={step:r.step,part:guide(r).part,view:"check"};}))return;
   if(action==="reload"){location.reload();return;}
   if(action==="library")openExerciseLibrary();
   else if(action==="restore"){openLib();var field=document.getElementById("backupfile");if(field)field.parentElement.scrollIntoView({block:"center"});}
   syncLibraryHint();
  }catch(e){error(e);}
 }
 function changeView(view){update(function(r){var g=guide(r);r.guide={step:r.step,part:g.part,view:view==="back"?g.previousView||"task":view,previousView:g.view};});}
 function ensureGuide(){
  var app=document.getElementById("app");
  if(!document.getElementById("deviceTestBar")){var header=document.createElement("div");header.id="deviceTestBar";app.before(header);}
  if(!document.getElementById("deviceTestTask")){var taskBox=document.createElement("section");taskBox.id="deviceTestTask";app.before(taskBox);}
  if(!document.getElementById("deviceTestActions")){var actions=document.createElement("div");actions.id="deviceTestActions";app.after(actions);}
 }
 function refreshPass(){
  if(!activeRun)return;var pass=document.querySelector('#deviceTestActions [data-dt="pass"]');if(!pass)return;
  var step=STEPS[activeRun.step],cp=activeRun.checkpoints[step.id],ok=inputReady(activeRun,S.logs,S.personalExercises)&&(!step.checkpoint||!!(cp&&cp.verified));
  pass.disabled=!ok;
 }
 function syncLibraryHint(){
  if(!activeRun||screen!=="run")return;var part=task(activeRun);if(["library","restore"].indexOf(part.action)<0)return;
  var box=document.querySelector("#lib .libbox");if(!box||box.querySelector(".dt-lib-hint"))return;
  var hint=document.createElement("p");hint.className="dt-lib-hint";hint.textContent="Testaufgabe: "+part.hint;
  var header=box.querySelector(".hdr");if(header)header.after(hint);else box.prepend(hint);
 }
 function valuesHtml(){
  function values(id){var log=S.logs["1|A|"+id],value=log&&log.sets&&log.sets[0];return value||{};}
  var weight=values("qa_weight"),time=values("qa_time");
  return '<div class="dt-values"><span>Gespeicherte Testwerte</span><b>'+esc(weight.reps||"—")+' Wdh. · '+esc(weight.weight||"—")+' kg</b>'+(time.reps?'<small>'+esc(fmtTime(Number(time.reps)))+' min · '+esc(time.weight||"—")+' kg</small>':'')+'</div>';
 }
 function renderRun(run){
  ensureGuide();activeRun=run;
  prepareFields(run);
  var step=STEPS[run.step],g=guide(run),part=task(run),cp=run.checkpoints[step.id],old=run.version!==APP_VERSION;
  document.body.classList.add("device-test-guided");document.body.dataset.dtEx=!old&&!run.finished?inputTarget(run):"";
  document.getElementById("deviceTestBar").innerHTML='<div><span class="heroeyebrow">TESTDATEN · '+(run.finished?'Abschluss':(run.step+1)+' / '+STEPS.length)+'</span><b>'+esc(part.hint||step.title)+'</b></div>'+button("manage","⋯",false,'aria-label="Testmenü"');
  var h='<h1 id="dt-title" tabindex="-1">'+esc(old?'App aktualisiert':run.finished?'Test abgeschlossen':part.title)+'</h1>',actions="";
  if(old){h+='<ul class="dt-bullets"><li>Für diese Version einen neuen Test beginnen.</li><li>Bisherige Berichte bleiben erhalten.</li></ul>';actions=button("setup","Neuen Test beginnen",true);}
  else if(run.finished){h+='<p class="dt-result">'+esc(status(run))+' · '+STEPS.filter(function(s){return run.results[s.id]&&run.results[s.id].status==="pass";}).length+' / '+STEPS.length+' bestanden</p>';actions=button("exit","Zurück zum echten Training",true)+button("export","Bericht herunterladen",false);}
  else{
   h+='<ul class="dt-bullets">'+part.lines.map(function(line){return '<li>'+esc(line)+'</li>';}).join('')+'</ul>';
   if(part.expect)h+='<p class="dt-expected">Prüfen: '+esc(part.expect)+'</p>';
   if(part.values)h+=valuesHtml();
   if(part.theme)h+='<div class="dt-themes">'+button("light","Hell",false)+button("dark","Dunkel",false)+'</div>';
   if(step.ready){h+='<p class="dt-ready" role="status">'+(busy?'Vorbereitung läuft …':ready(run.environment)?'✓ Alles bereit.':'Noch nicht bereit. Bitte online bleiben.')+'</p>';actions=ready(run.environment)?button("do","Weiter",true):button("preflight",busy?'Wird geprüft …':'Erneut prüfen',true,busy?'disabled':'')+(!busy?button("reload-online","Online neu laden",false):'');}
   else if(g.view==="check"){
    if(step.checkpoint)h+='<p class="dt-ready">'+(cp&&cp.verified?'✓ Satzwerte gleich, Training pausiert.':cp&&cp.boot===boot?'Gesichert. Jetzt die App ganz schließen und wieder öffnen.':'Neustart nicht bestätigt. Aufgabe wiederholen oder Problem melden.')+'</p>';
    actions=button("pass","Passt · Weiter",true);
    if(inputTarget(run)&&S.workout&&!S.workout.running)actions=button("resume-training","Testtraining fortsetzen",true);
   }else actions=button("do",part.label||"Weiter",true);
   actions+=button("issue","Problem",false);
   if(part.help)h+='<details class="dt-help"><summary>Kurze Hilfe</summary><p>'+esc(part.help)+'</p></details>';
  }
  h+='<p id="dt-run-notice" role="status" class="dt-warning">'+esc(notice)+'</p>';
  document.getElementById("deviceTestTask").innerHTML=h;document.getElementById("deviceTestActions").innerHTML=actions;
  hideModal();refreshPass();updateSurfaceIsolation();
  document.getElementById("dt-title").focus({preventScroll:true});
 }
 function exportReports(){try{guard();var data=read(),payload={format:"satzkraft-geraetetest",protocol:PROTOCOL,exportedAt:Date.now(),runs:data.runs};if(!downloadText("satzkraft-geraetetests.json",JSON.stringify(payload,null,2)))throw new Error("Download nicht möglich.");notice="Bericht heruntergeladen. Bitte die Datei in Dateien prüfen.";show();}catch(e){error(e);}}
 // Berichte anderer Geräte werden strikt als Berichte übernommen, niemals als App-Zustand.
 function cleanReport(raw){
  if(!raw||raw.format!=="satzkraft-geraetetest"||raw.protocol!==PROTOCOL||!Array.isArray(raw.runs)||raw.runs.length>MAX_RUNS)throw new Error("Kein kompatibler Gerätebericht (maximal 20 Läufe).");
  function text(value,max){if(typeof value!=="string"||!value.trim()||value.length>max)throw new Error("Ungültiger Berichtstext.");return value;}
  function time(value){if(!Number.isSafeInteger(value)||value<1||value>8640000000000000)throw new Error("Ungültiger Zeitpunkt.");return value;}
  return raw.runs.map(function(r){
   if(!r||r.protocol!==PROTOCOL||["Safari","Home-Bildschirm-App"].indexOf(r.context)<0)throw new Error("Ungültiger Testlauf.");
   var out={id:text(r.id,80),protocol:PROTOCOL,model:text(r.model,80),ios:text(r.ios,40),context:r.context,version:text(r.version,30),startedAt:time(r.startedAt),step:0,results:{},checkpoints:{},environment:null,imported:true};
   STEPS.forEach(function(step){var result=r.results&&r.results[step.id];if(!result)return;if(["pass","fail","skip"].indexOf(result.status)<0||result.physicalConfirmation!==true)throw new Error("Ungültiges Testergebnis.");if(result.note!=null&&typeof result.note!=="string"||result.note&&result.note.length>1000)throw new Error("Ungültige Notiz.");out.results[step.id]={status:result.status,note:result.note||"",at:time(result.at),physicalConfirmation:true};});
   return out;
  });
 }
 function mergeReports(data,incoming){var seen=Object.create(null),active=current(data),all=data.runs.concat(incoming).filter(function(r){if(seen[r.id])return false;seen[r.id]=true;return true;}).sort(function(a,b){return b.startedAt-a.startedAt;});data.runs=all.slice(0,MAX_RUNS);if(active&&!data.runs.some(function(r){return r.id===active.id;}))data.runs[MAX_RUNS-1]=active;return data;}
 async function importReports(file){try{guard();if(!file||file.size>250000)throw new Error("Bitte einen Bericht bis 250 kB auswählen.");var incoming=cleanReport(JSON.parse(await file.text()));guard();var data=mergeReports(read(),incoming);write(data);notice="Geräteberichte übernommen. Keine Trainingsdaten importiert.";show();}catch(e){error(e);}}
 function setupHtml(run){
  var model=run&&run.model||MODELS[0],custom=MODELS.indexOf(model)<0,context=navigator.standalone||matchMedia("(display-mode: standalone)").matches?"Home-Bildschirm-App":"Safari";
  return '<p class="dt-copy">Etwa 15–25 Minuten · getrennte Testdaten.</p><label class="dt-field">Dein iPhone<select id="dt-model">'+MODELS.map(function(m){return option(m,custom?"Anderes iPhone":model);}).join('')+'</select></label><div id="dt-custom-wrap"'+(custom?'':' hidden')+'>'+input("dt-custom","Modellname",custom?model:"",80)+'</div>'+iosFields(run&&run.ios||"")+'<p class="dt-copy">iOS nachsehen: Einstellungen → Allgemein → Info.</p><details class="dt-section"><summary>Geöffnet als: '+esc(context)+'</summary><label class="dt-field">Öffnungsart<select id="dt-context">'+["Safari","Home-Bildschirm-App"].map(function(v){return option(v,context);}).join('')+'</select></label></details><div class="dt-actions">'+button("start","Test starten",true)+'</div>';
 }
 function reportsHtml(data){
  var h='<details class="dt-section"><summary>Berichte ('+data.runs.length+')</summary>';
  if(!data.runs.length)h+='<p>Noch keine Berichte.</p>';
  data.runs.forEach(function(r){h+='<details class="dt-section"><summary>'+esc(r.model)+' · '+esc(status(r))+'</summary><p>'+esc(r.context)+' · iOS '+esc(r.ios)+' · v'+esc(r.version)+' · '+new Date(r.startedAt).toLocaleDateString("de-DE")+(r.imported?' · importierter Eigenbericht':'')+'</p><ul>'+STEPS.map(function(step){var value=r.results[step.id];return '<li>'+esc(step.title)+': '+label(value&&value.status)+(value&&value.note?' — '+esc(value.note):'')+'</li>';}).join('')+'</ul></details>';});
  return h+button("export","Berichte herunterladen",false)+'<label class="dt-field">Bericht importieren<input id="dt-import" type="file" accept=".json,application/json"></label></details>';
 }
 function show(){
  try{
   var data=read(),run=current(data),test=isTest(),h="",title="Offline-Test starten";
   if(test&&run&&screen==="run"){renderRun(run);return;}
   if(test&&run&&screen==="issue"){
    title="Was klappt nicht?";h='<label class="dt-field">Kurze Notiz<textarea id="dt-note" maxlength="1000" rows="3" placeholder="Zum Beispiel: 20 kg verschwinden nach dem Neuladen"></textarea></label><div class="dt-actions">'+button("fail","Fehler melden & weiter",true)+button("skip","Schritt auslassen",false)+'</div>';
   }else if(test&&run&&screen==="manage"){
    title="Testmenü";h='<p class="dt-copy">'+esc(run.model)+' · iOS '+esc(run.ios)+' · '+esc(run.context)+'</p>'+button("setup","Neuen Test beginnen",false)+button("exit","Zurück zum echten Training",false)+'<details class="dt-section"><summary>Schritt wechseln / wiederholen</summary><label class="dt-field">Schritt<select id="dt-step">'+STEPS.map(function(step,i){return '<option value="'+i+'"'+(i===run.step?' selected':'')+'>'+(i+1)+'. '+esc(step.title)+' · '+label(run.results[step.id]&&run.results[step.id].status)+'</option>';}).join('')+'</select></label>'+button("retry","Aktuelle Aufgabe wiederholen",false)+'</details>'+reportsHtml(data);
   }else h=setupHtml(run)+(test?'':reportsHtml(data));
   h='<p id="dt-notice" role="status" class="dt-warning">'+esc(notice)+'</p>'+h;
   showModal(title,h,[{label:test?"Zurück zum Test":"Schließen",action:test?function(){screen="run";show();}:null}]);
   var box=document.querySelector("#modal .mbox");box.classList.add("dt-box");
   setTimeout(function(){var heading=document.getElementById("modaltitle");if(!heading||!document.querySelector("#modal .dt-box"))return;heading.tabIndex=-1;heading.focus({preventScroll:true});box.scrollTop=0;},0);
  }catch(e){showModal("Test nicht verfügbar",esc(e.message),[{label:"Schließen",action:null}].concat(isTest()?[{label:"Zurück zum echten Training",action:exit}]:[]));}
 }
 function exit(){try{guard();if(!flushSave())throw new Error("Testdaten konnten nicht gespeichert werden.");localStorage.removeItem(MODE_KEY);location.reload();}catch(e){error(e);}}
 function resume(){
  if(!isTest())return;
  try{guard();var data=read(),run=current(data);if(run){Object.keys(run.checkpoints).forEach(function(id){var cp=run.checkpoints[id];if(cp.boot!==boot&&!cp.verified){cp.verified=cp.digest===digest()&&!!(S.workout&&!S.workout.running);cp.checkedAt=Date.now();}});write(data);}}
  catch(e){notice=e.message;}
  screen="run";show();
  if(!libraryObserver){libraryObserver=new MutationObserver(syncLibraryHint);libraryObserver.observe(document.getElementById("lib"),{childList:true});}
  if(run&&run.step===0&&run.version===APP_VERSION)preflight();
 }
 document.addEventListener("input",function(event){if(event.target.closest("#app"))refreshPass();});
 document.addEventListener("click",function(event){var b=event.target.closest("[data-dt]");if(!b){if(isTest())setTimeout(refreshPass,0);return;}var action=b.dataset.dt;
  if(action==="manage"||action==="setup"){screen=action;notice="";show();}
  else if(action==="start")start();else if(action==="preflight")preflight();else if(action==="do")doTask();else if(action==="exit")exit();else if(action==="issue"){screen="issue";notice="";show();}else if(action==="retry")changeView("task");else if(action==="export")exportReports();else if(["pass","fail","skip"].indexOf(action)>=0)mark(action);
  else if(action==="light"||action==="dark"){try{guard();applyTheme(action,true);}catch(e){error(e);}}
  else if(action==="resume-training"){try{guard();resumeWorkout();show();}catch(e){error(e);}}
  else if(action==="reload-online"){try{guard();if(!flushSave())throw new Error("Testdaten konnten nicht gespeichert werden.");location.reload();}catch(e){error(e);}}
 });
 document.addEventListener("change",function(event){
  if(event.target.id==="dt-model")document.getElementById("dt-custom-wrap").hidden=event.target.value!=="Anderes iPhone";
  else if(event.target.id==="dt-ios"){var other=event.target.value==="other";document.getElementById("dt-ios-custom-wrap").hidden=!other;if(other)document.getElementById("dt-ios-custom").focus();}
  else if(event.target.id==="dt-step"){var i=Number(event.target.value);update(function(r){if(Number.isInteger(i)&&i>=0&&i<STEPS.length){r.step=i;r.guide={step:i,part:0,view:"task"};r.finished=false;}});}
  else if(event.target.id==="dt-import")importReports(event.target.files[0]);
  else if(event.target.closest("#app"))refreshPass();
 });
 window.SatzkraftDeviceTest={show:show,resume:resume,cleanReport:cleanReport,mergeReports:mergeReports,status:status,steps:STEPS,selectedIos:selectedIos,iosFields:iosFields,guide:guide,finishStep:finishStep,inputReady:inputReady};
})();
