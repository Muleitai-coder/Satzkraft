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
  {id:"prepare",title:"Startklar machen",ready:true,parts:[
   {title:"Lass das Internet noch an",lines:["Bleibe mit WLAN oder mobilen Daten verbunden.","Wir prüfen automatisch, ob die App für den Offline-Test bereit ist. Du musst noch nichts eingeben."],expect:"Sobald alles bereit ist, geht es mit dem Ausschalten der Verbindung weiter.",action:"confirm",label:"Alles bereit · weiter"}]},
  {id:"offline",title:"Ohne Internet eingeben",parts:[
   {title:"Internet am iPhone ausschalten",lines:["Öffne die Einstellungen deines iPhones und schalte den Flugmodus ein.","Gehe dort zu WLAN und schalte WLAN ausdrücklich aus.","Kehre zu Satzkraft zurück. Lass beides bis Schritt 9 so eingestellt."],expect:"Diese Anleitung bleibt geöffnet. Flugmodus allein reicht nicht, wenn WLAN noch an ist.",action:"confirm",label:"Flugmodus an, WLAN aus"},
   {title:"10 Wiederholungen, 20 kg",lines:["Der Knopf unten startet dein Testtraining und öffnet die passende Übung.","Trage bei Test · Gewicht im ersten Satz 10 Wiederholungen und 20 kg ein. Tippe danach außerhalb des Feldes."],expect:"Beide Werte bleiben sichtbar. Oben bringt dich „Ergebnis prüfen“ hierher zurück.",question:"Sind 10 Wiederholungen und 20 kg eingetragen geblieben?",action:"weight",label:"Eingabefelder öffnen",hint:"Test · Gewicht · Satz 1: 10 Wdh. / 20 kg"}]},
  {id:"timer",title:"Zeit und Timer",parts:[
   {title:"Eine Zeit von Hand eingeben",lines:["Öffne die Testfelder. Trage bei Test · Zeitlast im ersten Satz 45 in das Zeitfeld und 12,5 kg ein.","Tippe außerhalb des Feldes und danach oben auf „Ergebnis prüfen“."],expect:"Das Zeitfeld zeigt 0:45 min; daneben stehen 12,5 kg.",question:"Werden 0:45 min und 12,5 kg richtig angezeigt?",action:"time",label:"Zeitfelder öffnen",hint:"Test · Zeitlast · Satz 1: 0:45 min / 12,5 kg"},
   {title:"Die Stoppuhr ausprobieren",lines:["Tippe bei Test · Halten im ersten Satz auf das kleine Startsymbol am Zeitfeld.","Warte ein paar Sekunden. Tippe unten auf „Stopp & eintragen“."],expect:"Die gemessene Zeit steht im Satzfeld. Danach beginnt eine Satzpause, deren Zeit herunterzählt.",question:"Wurde die Zeit eingetragen und läuft die Satzpause?",action:"hold",label:"Zur Stoppuhr",hint:"Test · Halten: starten, warten, „Stopp & eintragen“"}]},
  {id:"background",title:"Display sperren",parts:[
   {title:"Eine Minute das Display sperren",lines:["Öffne mit dem Knopf unten das Testtraining. Sperre dann das Display mit der Seitentaste.","Warte ungefähr eine Minute, entsperre das iPhone und kehre zu Satzkraft zurück."],expect:"Die Satzwerte sind noch da. Die App reagiert und die verbliebene Pausenzeit ist plausibel. Ein fehlender Ton bei gesperrtem Display ist hier kein Fehler.",question:"Sind die Werte erhalten und lässt sich die App weiter bedienen?",action:"lock",label:"Zum Training · dann Display sperren",hint:"Display ca. 1 Minute sperren, dann Werte und Pause prüfen"}]},
  {id:"reload",title:"Offline neu laden",checkpoint:true,parts:[
   {title:"Die App ohne Internet neu laden",lines:["Bleibe im Flugmodus mit ausgeschaltetem WLAN.","Der Knopf unten sichert den Vergleichsstand und lädt die App neu. Diese Anleitung öffnet sich danach wieder."],expect:"Die Werte sind unverändert; das Training ist pausiert. Falls keine Seite erscheint: Internet wieder einschalten, Satzkraft öffnen und hier das Problem melden.",question:"Hat sich Satzkraft ohne Internet mit deinen Testwerten wieder geöffnet?",action:"reload",label:"Teststand sichern & neu laden",hint:"Offline neu laden und erhaltene Werte prüfen"}]},
  {id:"cold",title:"App ganz schließen",checkpoint:true,parts:[
   {title:"Satzkraft vollständig schließen",lines:["Tippe zuerst unten auf „Teststand sichern“. Danach siehst du dein Testtraining.","Öffne den App-Umschalter: vom unteren Rand hochwischen und kurz halten; bei einem Home-Button zweimal drücken. Wische Safari bzw. Satzkraft nach oben weg.","Öffne offline wieder dieselbe App bzw. denselben Safari-Tab. Bestätige erst nach diesem Schließen."],expect:"Die Anleitung kommt zurück, deine Werte sind erhalten und das Training ist pausiert. Bei leerer Seite wieder online gehen und das Problem melden.",question:"Hast du die App ganz geschlossen und offline mit erhaltenen Werten wieder geöffnet?",action:"cold",label:"Teststand sichern · dann App schließen",hint:"App im Umschalter wegwischen, dann offline wieder öffnen"}]},
  {id:"windows",title:"Zwei Fenster",parts:[
   {title:"Einen zweiten Safari-Tab öffnen",lines:["Öffne das Testtraining und anschließend dieselbe Satzkraft-Adresse in einem zweiten Safari-Tab.","Das zweite Fenster soll melden, dass Satzkraft bereits in einem anderen Fenster geöffnet ist.","Schließe den ersten Tab. Tippe im zweiten auf „Aktuellen Stand laden“ und prüfe deine Werte."],expect:"Nur ein Fenster kann gleichzeitig schreiben. In der Home-Bildschirm-App ohne zweiten Tab: „Problem oder auslassen“ → „Nicht getestet“ wählen und den Grund eintragen.",question:"Hat das zweite Fenster zuerst gewartet und danach die gleichen Werte geladen?",action:"windows",label:"Zum Training · zweiten Tab öffnen",hint:"Zweiten Safari-Tab öffnen; erstes Fenster danach schließen"}]},
  {id:"library",title:"Bibliothek offline",parts:[
   {title:"Eine Übung ohne Internet finden",lines:["Der Knopf beendet dein Testtraining und öffnet die Übungssuche. Alle Werte bleiben gespeichert.","Suche nach „Kniebeuge“, öffne „Details & Verlauf“ und klappe „Technik & Erfassung“ auf.","Schließe die Ansicht oben rechts. Tippe dann auf „Ergebnis prüfen“."],expect:"Du findest Übungen und kannst ihre Angaben ohne Internet lesen.",question:"Konntest du eine Übung finden und ihre Details lesen?",action:"library",label:"Testtraining beenden & Suche öffnen",hint:"Kniebeuge suchen → Details lesen → oben rechts schließen"},
   {title:"Eine eigene Testübung anlegen",lines:["Öffne die Bibliothek und tippe auf „Eigene Übung erstellen“.","Nenne sie Offline-Test, wähle eine Erfassung und speichere sie. Die übrigen Angaben dürfen leer bleiben.","Schließe die Ansicht oben rechts und prüfe das Ergebnis hier."],expect:"Deine neue Übung erscheint in der Bibliothek. Sie bleibt ausschließlich im Testbereich.",question:"Konntest du Offline-Test erstellen und wiederfinden?",action:"library",label:"Bibliothek öffnen",hint:"Eigene Übung erstellen: Offline-Test; danach Ansicht schließen"}]},
  {id:"backup",title:"Sichern und wieder online",parts:[
   {title:"Eine Testdatei herunterladen",lines:["Tippe unten auf „Testbackup herunterladen“. Bestätige den Download, falls Safari danach fragt.","Öffne auf deinem iPhone die App Dateien → Downloads. Suche die Datei mit „satzkraft-testbackup“ im Namen.","Kehre danach zu Satzkraft zurück."],expect:"Die JSON-Datei liegt in Dateien. Nur eine sichtbare Downloadmeldung reicht noch nicht.",question:"Hast du die Testbackup-Datei in Dateien gefunden?",action:"download",label:"Testbackup herunterladen",hint:"In Dateien → Downloads nach satzkraft-testbackup suchen"},
   {title:"Die Testdatei wieder einlesen",lines:["Der Knopf öffnet Programme. Tippe unten auf „Backup wiederherstellen“ und wähle deine Testbackup-Datei.","Bestätige die Vorschau mit „Sichern & wiederherstellen“. Die App öffnet sich neu.","Prüfe danach: Test · Gewicht enthält weiterhin 10 Wiederholungen und 20 kg."],expect:"Die Testwerte werden wiederhergestellt. Deine echten Trainingsdaten bleiben getrennt.",question:"Hast du das Testbackup eingelesen und sind die Werte wieder da?",action:"restore",label:"Wiederherstellung öffnen",hint:"Backup wiederherstellen → Testdatei → Sichern & wiederherstellen"},
   {title:"Internet wieder einschalten",lines:["Schalte in den iPhone-Einstellungen den Flugmodus aus und WLAN wieder an.","Kehre zu Satzkraft zurück. Deine Testwerte sollen weiterhin erhalten sein."],expect:"Die App bleibt bedienbar und die Werte verschwinden nicht.",action:"confirm",label:"Wieder online · Werte sind noch da"}]},
  {id:"touch",title:"Darstellung prüfen",parts:[
   {title:"Felder und Bildschirmränder prüfen",lines:["Öffne die Testfelder. Tippe ein Zahlenfeld an, damit die Tastatur erscheint.","Drehe das iPhone ins Querformat und zurück. Prüfe, ob die Felder und Knöpfe erreichbar bleiben."],expect:"Nichts Wichtiges ist abgeschnitten oder dauerhaft von der Tastatur verdeckt.",question:"Lassen sich die Felder in beiden Ausrichtungen gut bedienen?",action:"weight",label:"Testfelder und Tastatur prüfen",hint:"Zahlenfeld antippen; Hoch- und Querformat prüfen"},
   {title:"Hell und Dunkel ansehen",lines:["Öffne die Einstellungen. Wechsle zwischen heller und dunkler Ansicht.","Schließe die Einstellungen und prüfe die Lesbarkeit. Größere iPhone-Schrift kannst du zusätzlich ausprobieren."],expect:"Texte und Knöpfe sind in beiden Ansichten gut lesbar.",question:"Ist alles in heller und dunkler Ansicht gut lesbar?",action:"theme",label:"Farbeinstellungen öffnen",hint:"Hell und Dunkel prüfen; Einstellungen danach schließen"}]}
 ];
 var boot=String(Date.now())+Math.random().toString(36).slice(2), checks=null, notice="", busy=false;
 function isTest(){return typeof DEVICE_TEST_MODE!=="undefined"&&DEVICE_TEST_MODE;}
 function read(){var raw=localStorage.getItem(REPORT_KEY);if(!raw)return{active:null,runs:[]};var data=JSON.parse(raw);if(!data||!Array.isArray(data.runs))throw new Error("Ungültige Testberichte");return data;}
 function write(data){localStorage.setItem(REPORT_KEY,JSON.stringify(data));}
 function current(data){return data.runs.find(function(r){return r.id===data.active;})||null;}
 function guard(){if(localWriteBlocked())throw new Error("Dieses Fenster darf gerade nicht speichern.");if((localStorage.getItem(MODE_KEY)==="1")!==isTest())throw new Error("Der Testbereich wurde in einem anderen Fenster gewechselt. Bitte neu laden.");}
 function error(e){var field=document.getElementById("dt-note"),note=field&&field.value;notice=e&&e.message?e.message:"Speichern nicht möglich. Bitte Browserspeicher prüfen.";show();field=document.getElementById("dt-note");if(field&&note)field.value=note;}
 function update(fn){try{guard();var data=read(),run=current(data);if(!run)throw new Error("Kein aktiver Testlauf.");fn(run);write(data);notice="";show();return true;}catch(e){error(e);return false;}}
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
  if(busy)return;busy=true;notice="Bereitschaft wird geprüft …";show();
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
    if(g.part<step.parts.length-1){run.guide={step:run.step,part:g.part+1,view:"task"};return;}
   }else if(!note)throw new Error("Bitte Fehler beziehungsweise Grund kurz notieren.");
   finishStep(run,value,note);
  });
 }
 function checkpoint(run){if(!Object.keys(S.logs).length)throw new Error("Bitte erst Testwerte im Training eintragen.");if(!S.workout)throw new Error("Öffne zuerst das Testtraining und starte es erneut.");if(!flushSave())throw new Error("Testdaten konnten nicht gespeichert werden.");run.checkpoints[STEPS[run.step].id]={boot:boot,digest:digest(),at:Date.now(),verified:false};}
 function openTraining(target){
  hideModal();
  if(target){
   if(!active())beginWorkout();else if(!S.workout.running)resumeWorkout();
   cancelAllAutoRest();resetRestState();clearRestFocus();renderBar();
   expandedDoneExercises[target]=true;cancelDoneCollapse(target);renderView();
   var card=document.getElementById("card-"+target);if(card){card.scrollIntoView({block:"start"});var field=document.getElementById("rep-"+target+"-0");if(field)field.focus({preventScroll:true});}
  }
 }
 function doTask(){
  try{
   guard();var run=current(read());if(!isTest()||!run||run.version!==APP_VERSION)throw new Error("Bitte einen neuen Testlauf starten.");
   var part=task(run),action=part.action;
   if(action==="confirm"){mark("pass");return;}
   if(!update(function(r){if(action==="reload"||action==="cold")checkpoint(r);r.guide={step:r.step,part:guide(r).part,view:"check"};}))return;
   if(action==="reload"){location.reload();return;}
   if(action==="download"){if(!flushSave()||!downloadFullBackup("satzkraft-testbackup"))throw new Error("Die Testdatei konnte nicht heruntergeladen werden. Bitte erneut versuchen.");return;}
   if(action==="library"||action==="restore"){
    if(active()&&stopWorkout(true)===false)throw new Error("Das Testtraining konnte nicht gespeichert werden.");
    hideModal();if(action==="library")openExerciseLibrary();else{openLib();var field=document.getElementById("backupfile");if(field)field.parentElement.scrollIntoView({block:"center"});}return;
   }
   if(action==="theme"){hideModal();showSettings();return;}
   openTraining({weight:"qa_weight",time:"qa_time",hold:"qa_hold"}[action]);
  }catch(e){error(e);}
 }
 function changeView(view){update(function(r){var g=guide(r);r.guide={step:r.step,part:g.part,view:view};});}
 function renderBarHint(run){
  var bar=document.getElementById("deviceTestBar");if(!bar||!run)return;
  var part=task(run);bar.innerHTML='<div class="dt-bar-copy"><span class="heroeyebrow">TESTDATEN · '+(run.finished?'Abschluss':'Schritt '+(run.step+1)+' / '+STEPS.length)+'</span><b>'+esc(run.finished?'Dein Testbericht ist bereit':part.hint||part.title)+'</b></div>'+button("open",run.finished?"Testbericht öffnen":guide(run).view==="check"?"Ergebnis prüfen":"Anleitung öffnen",false);
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
 function show(){
  try{
   var data=read(),run=current(data),test=isTest(),title="Dein iPhone offline testen",eyebrow="Geführter Gerätetest",h="";
   if(test&&run){
    var step=STEPS[run.step],g=guide(run),part=task(run),cp=run.checkpoints[step.id];
    renderBarHint(run);
    eyebrow="TESTDATEN · Schritt "+(run.step+1)+" von "+STEPS.length;
    title=run.finished?"Dein Test ist dokumentiert":part.title;
    h+='<p class="dt-meta">'+esc(run.model)+' · iOS '+esc(run.ios)+'<br>'+esc(run.context)+' · '+esc(step.title)+(step.parts.length>1?' · Aufgabe '+(g.part+1)+' / '+step.parts.length:'')+'</p>';
    if(run.version!==APP_VERSION){h+='<p class="dt-warning">Die App wurde aktualisiert. Beginne unten unter „Test verwalten“ einen neuen Lauf, damit alle Ergebnisse zur aktuellen Version gehören.</p>';}
    else if(run.finished){
     h+='<div class="dt-expect"><b>'+esc(status(run))+'</b><p>'+STEPS.filter(function(s){return run.results[s.id]&&run.results[s.id].status==="pass";}).length+' von '+STEPS.length+' Schritten bestanden. Dein Bericht bleibt auf diesem Gerät.</p></div><div class="dt-actions">'+button("export","Testbericht herunterladen",true)+button("exit","Zurück zum echten Training",false)+'</div>';
    }else if(g.view==="issue"){
     h+='<p class="dt-copy">Was ist bei dieser Aufgabe passiert? Ein kurzer Satz reicht. Damit bleibt sichtbar, was noch geprüft werden muss.</p><label class="dt-field">Ergebnis<select id="dt-outcome"><option value="fail">Etwas funktioniert nicht</option><option value="skip">Nicht getestet / auslassen</option></select></label><label class="dt-field">Was ist passiert oder warum lässt du es aus?<textarea id="dt-note" maxlength="1000" rows="3"></textarea></label><div class="dt-actions">'+button("issue-save","Notiz speichern & weiter",true)+button("back-task","Zurück zur Aufgabe",false)+'</div>';
    }else if(g.view==="check"){
     h+='<div class="dt-expect"><b>Hat es geklappt?</b><p>'+esc(part.question)+'</p></div>';
     if(step.checkpoint)h+='<p class="dt-check '+(cp&&cp.verified?'dt-ok':'')+'">'+(cp&&cp.verified?'✓ Neuer App-Start erkannt: Satzwerte gleich, Training pausiert.':cp&&cp.boot===boot?'Der Teststand ist gesichert. Führe jetzt das Schließen und erneute Öffnen durch.':'Der Vergleich ist noch nicht bestätigt. Bitte die Aufgabe erneut durchführen oder das Problem melden.')+'</p>';
     h+='<p class="dt-copy">Bestätige nur, was du selbst auf deinem iPhone ausprobiert hast.</p><div class="dt-actions">'+button("pass",g.part<step.parts.length-1?"Ja, hat geklappt · weiter":"Ja, hat geklappt",true,step.checkpoint&&!(cp&&cp.verified)?'disabled':'')+button("training","Testwerte ansehen",false)+button("back-task","Anleitung noch einmal lesen",false)+button("issue","Problem oder auslassen",false)+'</div>';
    }else{
     h+='<ol class="dt-todo">'+part.lines.map(function(line){return '<li>'+esc(line)+'</li>';}).join('')+'</ol><div class="dt-expect"><b>Darauf achtest du</b><p>'+esc(part.expect)+'</p></div>';
     if(step.ready){
      var env=run.environment;h+='<p class="dt-check '+(ready(env)?'dt-ok':'')+'" role="status">'+(busy?'Die App wird vorbereitet …':ready(env)?'✓ Alles bereit. Du kannst jetzt weitermachen.':'Die App ist noch nicht bereit. Bleibe online und lade sie einmal neu.')+'</p>';
      h+='<div class="dt-actions">'+(ready(env)?button("do",part.label,true):button("preflight",busy?'Vorbereitung läuft …':'Erneut prüfen',true,busy?'disabled':'')+(!busy?button("reload-online","Online neu laden",false):''))+'</div>';
      h+='<details class="dt-section"><summary>Was wird vorbereitet?</summary><p class="dt-copy">Die App speichert alles, was sie ohne Internet braucht, und prüft den getrennten Testbereich.</p>'+(env?'<ul class="dt-copy"><li>Speichern auf diesem Gerät: '+(env.storage?'bereit':'nicht möglich')+'</li><li>Offline öffnen: '+(env.controlled?'bereit':'online neu laden')+'</li><li>App und Übungsdaten: '+(env.cache?'bereit':'noch nicht vollständig geladen')+'</li><li>Getrennte Testdaten: '+(env.isolated?'bereit':'nicht bereit')+'</li></ul>':'')+'</details>';
     }else h+='<div class="dt-actions">'+button("do",part.label,true)+'</div>';
     h+=button("issue","Problem oder auslassen",false);
    }
    h+='<details class="dt-section dt-manage"><summary>Test verwalten</summary><p class="dt-copy">Deine echten Trainingsdaten sind getrennt. Du kannst später an dieser Stelle weitermachen. Ergebnisse bleiben lokal auf diesem Gerät.</p><label class="dt-field">Zu einem anderen Schritt<select id="dt-step">'+STEPS.map(function(s,i){return '<option value="'+i+'"'+(i===run.step?' selected':'')+'>'+(i+1)+'. '+esc(s.title)+' · '+label(run.results[s.id]&&run.results[s.id].status)+'</option>';}).join('')+'</select></label>'+button("training","Testtraining ansehen",false)+(!run.finished?button("exit","Zurück zum echten Training",false):'');
   }else h+='<p class="dt-copy">Ich begleite dich durch kleine Aufgaben direkt auf deinem Handy. Du gibst erfundene Werte ein und prüfst, ob sie ohne Internet erhalten bleiben.</p><div class="dt-expect"><b>Etwa 15–25 Minuten</b><p>Du brauchst nur dein iPhone. Deine echten Trainingsdaten bleiben in einem getrennten Bereich. Du kannst jederzeit unterbrechen.</p></div>';
   h+='<details class="dt-section"'+(!test?' open':'')+'><summary>Neuen Gerätetest beginnen</summary><p class="setbackupstatus">Wähle das iPhone, auf dem du gerade testest. Deine iOS-Version findest du unter Einstellungen → Allgemein → Info. Safari und Home-Bildschirm-App bitte in getrennten Läufen testen.</p><label class="dt-field">iPhone-Modell<select id="dt-model">'+MODELS.map(function(m){return option(m,run&&run.model||MODELS[0]);}).join('')+'</select></label>'+input("dt-custom","Anderes Modell (falls ausgewählt)","",80)+iosFields(run&&run.ios||"")+'<label class="dt-field">Auf diesem Gerät geöffnet als<select id="dt-context">'+["Safari","Home-Bildschirm-App"].map(function(v){return option(v,navigator.standalone||matchMedia("(display-mode: standalone)").matches?"Home-Bildschirm-App":"Safari");}).join('')+'</select></label>'+button("start",test?"Neuen geführten Test starten":"Geführten Test starten",true)+'</details>';
   h+='<details class="dt-section"><summary>Geräteübersicht und Berichte ('+data.runs.length+')</summary><p class="setbackupstatus">Empfohlen: dein iPhone 17 Pro zuerst in beiden Öffnungsarten; danach kleines iPhone (SE/mini), Standardmodell und Pro Max. Bildschirmgrößen am Computer ersetzen diese Geräte nicht. Ein älterer Lauf gilt nur für seine damalige App- und iOS-Version.</p>';
   if(!data.runs.length)h+='<p>Noch kein physischer Test dokumentiert.</p>';
   data.runs.forEach(function(r){var passed=STEPS.filter(function(s){return r.results[s.id]&&r.results[s.id].status==="pass";}).length;h+='<details class="dt-section"><summary>'+esc(r.model)+' · '+status(r)+' · '+passed+'/'+STEPS.length+'</summary><p>'+esc(r.context)+' · iOS '+esc(r.ios)+' · v'+esc(r.version)+' · '+new Date(r.startedAt).toLocaleDateString("de-DE")+(r.imported?' · importierter Eigenbericht':'')+'</p><ul>'+STEPS.map(function(s){var v=r.results[s.id];return '<li>'+esc(s.title)+': '+label(v&&v.status)+(v&&v.note?' — '+esc(v.note):'')+'</li>';}).join('')+'</ul></details>';});
   h+=button("export","Geräteberichte herunterladen",false)+'<label class="dt-field">Bericht eines anderen iPhones importieren<input id="dt-import" type="file" accept=".json,application/json"></label></details>';

   if(test&&run)h+='</details>';
   h+='<p id="dt-notice" role="status" class="dt-warning">'+esc(notice)+'</p>';
   showModal(title,h,[{label:test?"Anleitung schließen":"Schließen",action:null}]);
   var box=document.querySelector("#modal .mbox");box.classList.add("dt-box");box.insertAdjacentHTML("afterbegin",'<div class="heroeyebrow">'+esc(eyebrow)+'</div>');
   var primary=box.querySelector(".mmsg > .dt-actions > .primary");
   if(primary){var dock=document.createElement("div");dock.className="dt-dock";dock.append(primary);box.insertBefore(dock,box.querySelector(".mbtns"));box.classList.add("dt-guided");}
   setTimeout(function(){var heading=document.getElementById("modaltitle");if(!heading||!document.querySelector("#modal .dt-box"))return;heading.tabIndex=-1;heading.focus({preventScroll:true});box.scrollTop=0;},0);
  }catch(e){showModal("Gerätetests nicht verfügbar","Die lokalen Testberichte konnten nicht gelesen werden. Echte Trainingsdaten bleiben im eigenen Speicher. "+esc(e.message),[{label:"Schließen",action:null}].concat(isTest()?[{label:"Zurück zum echten Training",action:exit}]:[]));}
 }
 function exit(){try{guard();if(!flushSave())throw new Error("Testdaten konnten nicht gespeichert werden.");localStorage.removeItem(MODE_KEY);location.reload();}catch(e){error(e);}}
 function resume(){
  if(!isTest())return;
  try{guard();var data=read(),run=current(data);if(run){Object.keys(run.checkpoints).forEach(function(id){var cp=run.checkpoints[id];if(cp.boot!==boot&&!cp.verified){cp.verified=cp.digest===digest()&&!!(S.workout&&!S.workout.running);cp.checkedAt=Date.now();}});write(data);}}
  catch(e){notice=e.message;}
  var bar=document.createElement("div");bar.id="deviceTestBar";bar.innerHTML='<button type="button" class="setbackupbtn" data-dt="open">TESTDATEN · Testleitung öffnen</button>';document.getElementById("app").before(bar);
  show();
  if(run&&run.step===0&&run.version===APP_VERSION)preflight();
 }
 document.addEventListener("click",function(event){var b=event.target.closest("[data-dt]");if(!b)return;var action=b.dataset.dt;
  if(action==="open")show();else if(action==="training")openTraining();else if(action==="start")start();else if(action==="preflight")preflight();else if(action==="do")doTask();else if(action==="exit")exit();else if(action==="issue")changeView("issue");else if(action==="back-task")changeView("task");else if(action==="issue-save")mark(document.getElementById("dt-outcome").value);else if(action==="reload-online"){try{guard();if(!flushSave())throw new Error("Testdaten konnten nicht gespeichert werden.");location.reload();}catch(e){error(e);}}else if(action==="export")exportReports();else if(action==="pass")mark("pass");
 });
 document.addEventListener("change",function(event){if(event.target.id==="dt-ios"){var other=event.target.value==="other";document.getElementById("dt-ios-custom-wrap").hidden=!other;if(other)document.getElementById("dt-ios-custom").focus();}else if(event.target.id==="dt-step"){var i=Number(event.target.value);update(function(r){if(Number.isInteger(i)&&i>=0&&i<STEPS.length){r.step=i;r.guide={step:i,part:0,view:"task"};r.finished=false;}});}else if(event.target.id==="dt-import")importReports(event.target.files[0]);});
 window.SatzkraftDeviceTest={show:show,resume:resume,cleanReport:cleanReport,mergeReports:mergeReports,status:status,steps:STEPS,selectedIos:selectedIos,iosFields:iosFields,guide:guide,finishStep:finishStep};
})();
