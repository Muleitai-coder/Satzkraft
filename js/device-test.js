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
 var STEPS=[
  {id:"prepare",title:"Online vorbereiten",text:"Bleibe zunächst online. Führe den Bereitschaftscheck aus. Erst wenn alle vier Punkte bereit sind: Testleitung schließen, Training starten. Die drei Übungen enthalten ausschließlich Testdaten.",ready:true},
  {id:"offline",title:"Ohne Verbindung eingeben",text:"Schalte den Flugmodus ein und WLAN in den iPhone-Einstellungen ausdrücklich aus. Schließe die Testleitung. Trage bei Test · Gewicht im ersten Satz 10 Wiederholungen und 20 kg ein. Tippe außerhalb des Feldes. Öffne danach wieder die Testleitung. Erwartet: Eingaben bleiben erhalten und kein Bedienelement hängt."},
  {id:"timer",title:"Zeit und Timer",text:"Bleibe offline. Bei Test · Zeitlast 45 als Zeit eintippen: Erwartet 00:45, dazu 12,5 kg. Bestätige das Feld. Prüfe bei Test · Halten die Stoppuhr: starten, einige Sekunden warten und stoppen. Zeit muss eingetragen sein. Pausen laufen ohne Verbindung. Überspringe eine laufende Pause bei Bedarf über die normalen Trainingsknöpfe."},
  {id:"background",title:"Sperren und zurückkehren",text:"Sperre das Display für etwa eine Minute. Öffne die App wieder. Erwartet: Satzwerte unverändert, kein blockierendes Fenster, Pausenzeit plausibel. Geräusche bei gesperrtem iPhone bitte nur als Beobachtung notieren; sie sind kein Bestehenskriterium."},
  {id:"reload",title:"Offline neu laden",text:"Bleibe im Flugmodus mit WLAN aus. Speichere unten einen Prüfpunkt und lade anschließend mit dem angebotenen Knopf neu. Erwartet: App startet offline, Satzwerte sind gleich und das Training ist pausiert. Ein technischer Wiederlade-Nachweis erscheint hier nach dem Start.",checkpoint:true},
  {id:"cold",title:"App vollständig schließen",text:"Speichere einen Prüfpunkt. Schließe Safari beziehungsweise die Home-Bildschirm-App im App-Umschalter durch Hochwischen vollständig. Öffne danach denselben Safari-Link beziehungsweise dasselbe App-Symbol – weiterhin offline. Erwartet: Testmodus und Werte wieder da, Training pausiert. Bestätige nur, wenn du das Schließen wirklich selbst durchgeführt hast.",checkpoint:true},
  {id:"windows",title:"Zweites Fenster schützen",text:"In Safari: Öffne denselben Satzkraft-Link in einem zweiten Tab. Erwartet: Das zweite Fenster wartet geschützt, während das erste schreiben darf. Schließe das erste und lade im zweiten bewusst den aktuellen Stand. Werte müssen gleich bleiben. Wenn sich in der installierten App kein zweites Fenster öffnen lässt, überspringen und den Grund notieren; den Safari-Lauf separat durchführen."},
  {id:"library",title:"Bibliothek ohne Internet",text:"Weiter offline: Programme → Übungen & persönliche Bibliothek öffnen. Suche eine Übung, öffne Details und lege eine persönliche Übung namens Offline-Test an. Erwartet: lokale Bibliothek und persönliche Übung funktionieren ohne Ladefehler. Alle Änderungen bleiben im Testbereich."},
  {id:"backup",title:"Testbackup und Rückkehr online",text:"Lade über Einstellungen ein vollständiges Testbackup herunter. Prüfe in Dateien, ob es angekommen ist. Beende das Testtraining und importiere diese Datei im Testbereich wieder über Programme → Import. Prüfe die Satzwerte nach Wiederherstellung. Erst danach Flugmodus aus und WLAN an: Daten bleiben erhalten. Testbackups sind gekennzeichnet und können nicht in echte Trainingsdaten eingespielt werden."},
  {id:"touch",title:"Darstellung und Tastatur",text:"Prüfe Hoch- und Querformat, helle und dunkle Ansicht, Bildschirmränder und die Bildschirmtastatur. Erwartet: keine abgeschnittenen Felder oder Knöpfe, gut erreichbare Zeit-/Gewichtseingaben, keine verdeckte Hauptaktion. Größere iOS-Schrift bei Bedarf ebenfalls prüfen."}
 ];
 var boot=String(Date.now())+Math.random().toString(36).slice(2), checks=null, notice="", busy=false;
 function isTest(){return typeof DEVICE_TEST_MODE!=="undefined"&&DEVICE_TEST_MODE;}
 function read(){var raw=localStorage.getItem(REPORT_KEY);if(!raw)return{active:null,runs:[]};var data=JSON.parse(raw);if(!data||!Array.isArray(data.runs))throw new Error("Ungültige Testberichte");return data;}
 function write(data){localStorage.setItem(REPORT_KEY,JSON.stringify(data));}
 function current(data){return data.runs.find(function(r){return r.id===data.active;})||null;}
 function guard(){if(localWriteBlocked())throw new Error("Dieses Fenster darf gerade nicht speichern.");if((localStorage.getItem(MODE_KEY)==="1")!==isTest())throw new Error("Der Testbereich wurde in einem anderen Fenster gewechselt. Bitte neu laden.");}
 function error(e){var field=document.getElementById("dt-note"),note=field&&field.value;notice=e&&e.message?e.message:"Speichern nicht möglich. Bitte Browserspeicher prüfen.";show();field=document.getElementById("dt-note");if(field&&note)field.value=note;}
 function update(fn){try{guard();var data=read(),run=current(data);if(!run)throw new Error("Kein aktiver Testlauf.");fn(run);write(data);notice="";show();}catch(e){error(e);}}
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
 function mark(value){
  var note=document.getElementById("dt-note").value.trim();
  update(function(run){
   if(run.version!==APP_VERSION)throw new Error("Die App-Version hat gewechselt. Bitte einen neuen Testlauf starten.");
   var step=STEPS[run.step];
   if(value==="pass"&&step.ready&&!ready(run.environment))throw new Error("Erst den Bereitschaftscheck erfolgreich durchführen.");
   if((value==="fail"||value==="skip")&&!note)throw new Error("Bitte Fehler beziehungsweise Grund kurz notieren.");
   if(value==="pass"&&step.checkpoint&&!(run.checkpoints[step.id]&&run.checkpoints[step.id].verified))throw new Error("Erst Prüfpunkt speichern und die App neu öffnen. Danach Satzwerte prüfen.");
   run.results[step.id]={status:value,note:note,at:Date.now(),physicalConfirmation:true};
   if(run.step<STEPS.length-1)run.step++;
  });
 }
 function checkpoint(){update(function(run){if(!Object.keys(S.logs).length)throw new Error("Bitte erst Testwerte im Training eintragen.");if(!flushSave())throw new Error("Testdaten konnten nicht gespeichert werden.");var id=STEPS[run.step].id;run.checkpoints[id]={boot:boot,digest:digest(),at:Date.now(),verified:false};});}
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
   var data=read(),run=current(data),test=isTest(),h='<p class="setbackupstatus">Lokale Admin-Werkzeuge ohne Konto oder Zugangssperre. Ergebnisse bleiben auf diesem Gerät. Maximal 20 Läufe; Geräteberichte lassen sich zum Vergleichen importieren.</p>';
   if(test)h+='<p class="dt-warning"><b>TESTDATEN</b> · Die normale App arbeitet hier mit einem getrennten Speicher. Zurück zum echten Training beendet diesen Bereich.</p>'+button("training","Zum Testtraining",false);
   if(test&&run){
    var step=STEPS[run.step],result=run.results[step.id],cp=run.checkpoints[step.id];
    h+='<p class="setbackupstatus">'+esc(run.model)+' · iOS '+esc(run.ios)+' · '+esc(run.context)+' · v'+esc(run.version)+'</p>';
    if(run.version!==APP_VERSION)h+='<p class="dt-warning">App aktualisiert: Dieser Lauf gehört zu einer älteren Version. Bitte einen neuen Lauf beginnen.</p>';
    h+='<label class="dt-field">Prüfschritt<select id="dt-step">'+STEPS.map(function(s,i){return '<option value="'+i+'"'+(i===run.step?' selected':'')+'>'+(i+1)+'. '+esc(s.title)+' · '+label(run.results[s.id]&&run.results[s.id].status)+'</option>';}).join('')+'</select></label>';
    h+='<h3>'+esc(step.title)+'</h3><p class="dt-copy">'+esc(step.text)+'</p>';
    if(step.ready){var env=run.environment;h+=button("preflight",busy?"Prüfung läuft …":"Bereitschaft prüfen",true,busy?'disabled':'');if(env)h+='<ul class="dt-copy"><li>Lokaler Schreib-/Lesetest: '+(env.storage?'bereit':'fehlt')+'</li><li>Offline-Steuerung aktiv: '+(env.controlled?'bereit':'noch nicht – online neu laden')+'</li><li>Alle 13 Startressourcen in v'+esc(APP_VERSION)+': '+(env.cache?'bereit':'unvollständig – erst online laden')+'</li><li>Getrennter Testspeicher: '+(env.isolated?'bereit':'fehlt')+'</li></ul>';}
    if(step.checkpoint){h+=button("checkpoint","Prüfpunkt speichern",true);if(cp)h+='<p class="setbackupstatus">'+(cp.verified?'Neuer App-Start erkannt, gespeicherte Satzwerte gleich und Training pausiert. Physische Durchführung bitte selbst bestätigen.':cp.boot===boot?'Prüfpunkt gespeichert. Jetzt neu laden beziehungsweise vollständig schließen.':'Prüfpunkt nicht bestätigt: Werte fehlen, sind geändert oder das Training ist nicht pausiert. Bitte als Fehler notieren und erneut prüfen.')+'</p>';if(step.id==="reload")h+=button("reload","Jetzt offline neu laden",false);}
    h+='<label class="dt-field">Beobachtung / Fehler / Grund fürs Überspringen<textarea id="dt-note" maxlength="1000" rows="3">'+esc(result&&result.note||"")+'</textarea></label>';
    h+='<p class="setbackupstatus">„Bestanden“ bestätigt deine eigene Durchführung auf dem angegebenen physischen Gerät. Automatische Checks allein sind keine Geräteabnahme.</p><div class="dt-actions">'+button("pass","Bestanden",true)+button("fail","Fehler gefunden",false)+button("skip","Überspringen",false)+'</div>';
   }
   h+='<details class="dt-section"'+(!test?' open':'')+'><summary>Neuen Gerätetest beginnen</summary><p class="setbackupstatus">Dein Hauptgerät ist vorausgewählt. Modell nicht automatisch erkannt. iOS-Version: Einstellungen → Allgemein → Info. Safari und Home-Bildschirm-App jeweils getrennt testen. Ein neuer Lauf ersetzt nur den synthetischen Trainingsstand.</p><label class="dt-field">iPhone-Modell<select id="dt-model">'+MODELS.map(function(m){return option(m,run&&run.model||MODELS[0]);}).join('')+'</select></label>'+input("dt-custom","Anderes Modell (falls ausgewählt)","",80)+iosFields(run&&run.ios||"")+'<label class="dt-field">Auf diesem Gerät geöffnet als<select id="dt-context">'+["Safari","Home-Bildschirm-App"].map(function(v){return option(v,navigator.standalone||matchMedia("(display-mode: standalone)").matches?"Home-Bildschirm-App":"Safari");}).join('')+'</select></label>'+button("start",test?"Neuer Lauf mit frischen Testdaten":"Testbereich starten",true)+'</details>';
   h+='<details class="dt-section"><summary>Geräteübersicht und Berichte ('+data.runs.length+')</summary><p class="setbackupstatus">Empfohlen: dein iPhone 17 Pro zuerst in beiden Öffnungsarten; danach kleines iPhone (SE/mini), Standardmodell und Pro Max. Bildschirmgrößen am Computer ersetzen diese Geräte nicht. Ein älterer Lauf gilt nur für seine damalige App- und iOS-Version.</p>';
   if(!data.runs.length)h+='<p>Noch kein physischer Test dokumentiert.</p>';
   data.runs.forEach(function(r){var passed=STEPS.filter(function(s){return r.results[s.id]&&r.results[s.id].status==="pass";}).length;h+='<details class="dt-section"><summary>'+esc(r.model)+' · '+status(r)+' · '+passed+'/'+STEPS.length+'</summary><p>'+esc(r.context)+' · iOS '+esc(r.ios)+' · v'+esc(r.version)+' · '+new Date(r.startedAt).toLocaleDateString("de-DE")+(r.imported?' · importierter Eigenbericht':'')+'</p><ul>'+STEPS.map(function(s){var v=r.results[s.id];return '<li>'+esc(s.title)+': '+label(v&&v.status)+(v&&v.note?' — '+esc(v.note):'')+'</li>';}).join('')+'</ul></details>';});
   h+=button("export","Geräteberichte herunterladen",false)+'<label class="dt-field">Bericht eines anderen iPhones importieren<input id="dt-import" type="file" accept=".json,application/json"></label></details>';
   h+='<p id="dt-notice" role="status" class="dt-warning">'+esc(notice)+'</p>';
   showModal("Admin · iPhone-Offline-Test",h,[{label:test?"Im Testtraining weiter":"Schließen",cls:"primary",action:null}].concat(test?[{label:"Zurück zum echten Training",action:exit}]:[]));
   // Der allgemeine Dialog fokussiert sonst den unteren Schließen-Knopf und scrollt
   // dadurch lange Prüfanleitungen aus dem Blick. Hier beginnt jeder Schritt oben.
   setTimeout(function(){var title=document.getElementById("modaltitle");if(!title||title.textContent!=="Admin · iPhone-Offline-Test")return;title.tabIndex=-1;title.focus({preventScroll:true});document.querySelector("#modal .mbox").scrollTop=0;},0);
  }catch(e){showModal("Gerätetests nicht verfügbar","Die lokalen Testberichte konnten nicht gelesen werden. Echte Trainingsdaten bleiben im eigenen Speicher. "+esc(e.message),[{label:"Schließen",action:null}].concat(isTest()?[{label:"Zurück zum echten Training",action:exit}]:[]));}
 }
 function exit(){try{guard();if(!flushSave())throw new Error("Testdaten konnten nicht gespeichert werden.");localStorage.removeItem(MODE_KEY);location.reload();}catch(e){error(e);}}
 function resume(){
  if(!isTest())return;
  try{guard();var data=read(),run=current(data);if(run){Object.keys(run.checkpoints).forEach(function(id){var cp=run.checkpoints[id];if(cp.boot!==boot&&!cp.verified){cp.verified=cp.digest===digest()&&!!(S.workout&&!S.workout.running);cp.checkedAt=Date.now();}});write(data);}}
  catch(e){notice=e.message;}
  var bar=document.createElement("div");bar.id="deviceTestBar";bar.innerHTML='<button type="button" class="setbackupbtn" data-dt="open">TESTDATEN · Testleitung öffnen</button>';document.getElementById("app").before(bar);
  show();
 }
 document.addEventListener("click",function(event){var b=event.target.closest("[data-dt]");if(!b)return;var action=b.dataset.dt;
  if(action==="open")show();else if(action==="training")hideModal();else if(action==="start")start();else if(action==="preflight")preflight();else if(action==="checkpoint")checkpoint();else if(action==="reload"){if(flushSave())location.reload();else error(new Error("Testdaten konnten nicht gespeichert werden."));}else if(action==="export")exportReports();else if(["pass","fail","skip"].indexOf(action)>=0)mark(action);
 });
 document.addEventListener("change",function(event){if(event.target.id==="dt-ios"){var other=event.target.value==="other";document.getElementById("dt-ios-custom-wrap").hidden=!other;if(other)document.getElementById("dt-ios-custom").focus();}else if(event.target.id==="dt-step"){var i=Number(event.target.value);update(function(r){if(Number.isInteger(i)&&i>=0&&i<STEPS.length)r.step=i;});}else if(event.target.id==="dt-import")importReports(event.target.files[0]);});
 window.SatzkraftDeviceTest={show:show,resume:resume,cleanReport:cleanReport,mergeReports:mergeReports,status:status,steps:STEPS,selectedIos:selectedIos,iosFields:iosFields};
})();
