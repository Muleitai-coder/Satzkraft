// ---------- Programm-Bibliothek (Import/Export) ----------
var ANLEITUNG={
 anleitung:"Trainingsplan fuer die Trainings-App 'Satzkraft' (Austauschformat 'trainings-block', Version 2). Eine KI darf Werte aendern oder im SELBEN Aufbau ein neues Programm bauen. Behalte die Struktur und alle Pflichtfelder, erfinde keine neuen Feldnamen, halte dich an 'erlaubte_werte'. Diese Datei ist bereits ein vollstaendiges, korrektes Beispiel – am besten daran orientieren. Danach in der App unter 'Programme' -> 'Import' einfuegen. '_anleitung' wird beim Laden ignoriert und darf drinbleiben.",
 meta:"'name' (max 30 Zeichen) benennt das Programm ohne Stufenwort. 'art' (OPTIONAL, max 24 Zeichen, z.B. 'Einsteiger', 'Fortgeschritten', 'Standard') zeigt die App als eigene Zeile unter dem Namen – das Wort daher NICHT im Namen wiederholen. 'bereich' (OPTIONAL) muss ein Wert aus erlaubte_werte.bereich sein. 'description' (OPTIONAL, 1-2 Saetze, max 200 Zeichen) erscheint in der Programmvorschau. 'code' und 'revision' (OPTIONAL) steuern die Update-Erkennung: Beim ANPASSEN eines bestehenden Programms beide exakt unveraendert uebernehmen – die App erkennt daran Zugehoerigkeit und Stand, auch wenn sich der Name aendert. Bei einem komplett NEUEN Programm beide weglassen. NIEMALS eigene Werte erfinden oder aendern.",
 trainings_richtlinien:[
  "Blockaufbau: 2-3 Aufbauwochen, dann 1 Deload-Woche. Laengere Blöcke danach mit Intensivierungswochen fortsetzen. Die letzte Woche eines Blocks ist idealerweise ein Deload.",
  "Anstrengung (rir) ueber den Block absenken: Aufbau 3 -> 2, Intensiv 2 -> 1, Deload 4-5.",
  "Volumen: etwa 10-20 Arbeitssaetze pro Muskelgruppe und Woche, Einsteiger in der unteren Haelfte. Deload: etwa halbe Satzzahl.",
  "Uebungszahl an der Einheitsdauer ausrichten: ~45 min = 4-5 Uebungen, ~60 min = 5-7, ~90 min = 7-9.",
  "Wiederholungsbereiche: schwere Grunduebungen 3-7, Hypertrophie 6-12, Isolation eher 10-15.",
  "Grunduebungen an den Anfang des Tages. Druck- und Zuguebungen sowie Ober-/Unterkoerper ausgewogen verteilen.",
  "Startgewichte konservativ waehlen (lieber zu leicht als zu schwer); nur angegebenes Equipment verwenden.",
  "Bei genannten Einschraenkungen sichere Alternativen waehlen; keine Uebung doppelt am selben Tag."
 ],
 checkliste:[
  "format bleibt exakt 'trainings-block'.",
  "Jede Uebung braucht 'name' und 'category'.",
  "Jeder 'category'-Wert (in Uebungen UND in weeks[].sets) muss oben unter 'categories' mit GENAU diesem Schluessel definiert sein.",
  "'weekday' ist ein echter Wochentag (Montag..Sonntag), sonst wird der Tag falsch einsortiert.",
  "Jeder Tag-'key' ist eindeutig (z.B. 'A','B','C').",
  "Gewichtsuebung: weighted:true + increment + startWeight. Koerpergewicht + Zusatzgewicht: zusaetzlich bodyweight:true, dabei startWeight:0 = KEIN Zusatzgewicht.",
  "Haltezeit-Uebung: unit:'seconds'. Feste Zielzeit: timerMode:'target' + sets + reps:[minSekunden,maxSekunden]. Maximaltest bis zum eigenen Stopp: timerMode:'max'. Reine Wiederholungsuebung ohne Gewicht: weighted weglassen.",
  "OPTIONAL pro Uebung: sets (Anzahl) und reps:[min,max]. Diese eigene Vorgabe ueberschreibt fuer diese Uebung die Standardwerte ihrer Kategorie.",
  "OPTIONAL: 'description' (1-2 Saetze) – die App zeigt sie in der Programmvorschau an.",
  "OPTIONAL: perSide:true kennzeichnet Wiederholungen oder Zeiten, die je Koerperseite gelten.",
  "Beim Anpassen eines Exports vorhandene Felder fromWeek, untilWeek und prevId unveraendert erhalten; nicht selbst erfinden.",
  "'art' nicht im 'name' wiederholen – die App zeigt 'art' automatisch als Untertitel unter dem Namen.",
  "Nur die hier dokumentierten Felder verwenden. Bei Unsicherheit: Beispiel kopieren und nur die Werte anpassen."
 ],
 grenzen:"max 7 Trainingstage, max 16 Wochen, max 12 Uebungen pro Tag, max 10 Saetze je Trainingsgruppe/Woche oder Uebung, 'name' max 30 Zeichen, 'art' max 24 Zeichen, 'description' max 200 Zeichen, 'weekday' max 16 Zeichen. Bei Fehlern wird das Programm NICHT geladen, eine konkrete Meldung erscheint und das aktive Programm bleibt unveraendert.",
 erlaubte_werte:{
  phase:["aufbau","intensiv","deload"],
  color:["amber","emerald","violet","sky","orange","rose","slate"],
  unit:["reps","seconds"],
  progressionMode:["weight","added_weight","reps","seconds","progression","none"],
  timerMode:["target","max"],
  bereich:["Ganzkörper","Oberkörper","Unterkörper","Push","Pull","Beine","Brust","Rücken","Schultern","Arme","Core","Hybrid","Calisthenics","Cardio"]
 },
 settings:"OPTIONAL (Progressionslogik). Fehlt das Feld, nutzt die App Defaults. Felder: progressionSystem ('double_progression'), deloadMultiplier (Deload-Gewichtsfaktor, Default 0.6), requireAllSetsForIncrease (Default true), allowAutoDecrease (Default true), postDeloadReturnMultiplier (Wiedereinstieg nach Deload, Default 0.925).",
 categories:"Frei definierbare Trainingsgruppen (technisches Feld: categories). Sie liefern gemeinsame Standardwerte fuer aehnliche Uebungen. Schluessel (z.B. 'kraft') -> {label, color, rest (Pause in Sekunden), reps (OPTIONAL, [min,max] je phase)}. Eine Uebung kann diese Standardwerte mit eigenen sets und reps ueberschreiben.",
 weeks:"Eine Woche pro Eintrag: {n, phase (aus erlaubte_werte; 'deload' = leichtere Erholungswoche), label, rir (Text z.B. '2'), note, sets {kategorie-schluessel: anzahl saetze}}.",
 days:"Ein Trainingstag pro Eintrag: {key (eindeutig), weekday (echter Wochentag), title, exercises}. OPTIONAL warmup und cooldown als Liste aus {name, seconds} – die App fuehrt sie vor bzw. nach dem Training als eigenen Ablauf. Die App zeigt immer Mo-So und markiert Trainings- und erledigte Tage.",
 exercises:"Pro Uebung: name + category. OPTIONAL: sets (eigene Satzanzahl), reps:[min,max] (eigener Wiederholungs- oder Sekundenbereich), en, cue, video, garmin, proxy, target, progressionMode und perSide:true bei Uebungen, die je Seite ausgefuehrt werden (z. B. Ausfallschritte) – die App zeigt dann 'je Seite' hinter den Wiederholungen an. Eigene sets/reps gelten in allen Wochen und ueberschreiben die Trainingsgruppe. Gewicht: weighted:true + increment + startWeight (+ bodyweight:true bei Zusatzgewicht). Zeit: unit:'seconds' und optional timerMode:'target' (stoppt am oberen Ziel automatisch) oder 'max' (laeuft bis zum manuellen Stopp)."
};
// Vollstaendiges, valides Beispiel – zeigt alle Faelle korrekt (Gewicht, Zusatzgewicht, Zeit, reine Reps, Deload, settings).
var BLANK_TEMPLATE={
 _anleitung:ANLEITUNG,
 format:"trainings-block",version:2,name:"Beispiel Ganzkörper 2x",art:"Standard",bereich:"Ganzkörper",
 description:"Ganzkörper-Beispielplan mit 2 Einheiten pro Woche – zeigt alle Übungstypen und Felder.",
 settings:{progressionSystem:"double_progression",deloadMultiplier:0.6,requireAllSetsForIncrease:true,allowAutoDecrease:true,postDeloadReturnMultiplier:0.925},
 categories:{
  kraft:{label:"Kraft",color:"amber",rest:150,reps:{aufbau:[5,7],intensiv:[3,5],deload:[5,5]}},
  hyp:{label:"Hypertrophie",color:"emerald",rest:90,reps:{aufbau:[8,12],intensiv:[6,10],deload:[10,10]}},
  core:{label:"Core",color:"sky",rest:60}
 },
 weeks:[
  {n:1,phase:"aufbau",label:"Aufbau",rir:"3",sets:{kraft:3,hyp:3,core:3},note:"Technik & Volumen aufbauen."},
  {n:2,phase:"aufbau",label:"Aufbau",rir:"2",sets:{kraft:3,hyp:3,core:3},note:"Gewichte leicht steigern."},
  {n:3,phase:"deload",label:"Deload",rir:"4-5",sets:{kraft:2,hyp:2,core:2},note:"Erholung, ~60% Gewicht."}
 ],
 days:[
  {key:"A",weekday:"Montag",title:"Ganzkörper A",
   warmup:[{name:"Armkreisen",seconds:30},{name:"Kniebeugen ohne Gewicht",seconds:45},{name:"Cat-Cow",seconds:40}],
   cooldown:[{name:"Brustdehnung Türrahmen",seconds:30},{name:"Kindhaltung",seconds:45}],
   exercises:[
   {name:"Langhantel-Kniebeuge",category:"kraft",weighted:true,increment:5,startWeight:60,garmin:"Barbell Squat"},
   {name:"Bankdrücken",category:"kraft",weighted:true,increment:2.5,startWeight:40,garmin:"Barbell Bench Press"},
   {name:"Klimmzüge (mit Zusatzgewicht)",category:"hyp",weighted:true,bodyweight:true,increment:2.5,startWeight:0,garmin:"Pull-Up"},
   {name:"Plank",category:"core",unit:"seconds",timerMode:"target",sets:3,reps:[30,60],target:"Sauber halten"}
  ]},
  {key:"B",weekday:"Donnerstag",title:"Ganzkörper B",exercises:[
   {name:"Kreuzheben",category:"kraft",weighted:true,increment:5,startWeight:80,garmin:"Deadlift"},
   {name:"Schulterdrücken",category:"hyp",weighted:true,increment:2.5,startWeight:25,garmin:"Overhead Press"},
   {name:"Liegestütze",category:"hyp",progressionMode:"reps",target:"3 × max"},
   {name:"Hängendes Beinheben",category:"core",unit:"reps",target:"3 × 10-15"}
  ]}
 ]
};
function genId(){return "p"+Date.now().toString(36)+Math.floor(Math.random()*1000).toString(36);}
// C1: nur geprüfte, im bestehenden v2-Vertrag unverändert ausführbare Referenzen.
function personalExerciseError(def){
 if(!plainObject(def)||typeof def.id!=="string"||!/^custom_[a-z0-9_]{3,70}$/.test(def.id)||typeof def.name!=="string"||!def.name.trim()||def.name.length>80)return "Persönliche Übung: Kennung oder Name ist ungültig.";
 if(["weight","added_weight","bodyweight","seconds","weighted_seconds"].indexOf(def.type)<0||typeof def.perSide!=="boolean"||["unspecified","total","per_dumbbell","device"].indexOf(def.weightConvention)<0)return "Persönliche Übung: Erfassung oder Gewichtskonvention ist ungültig.";
 if(["bodyweight","seconds"].indexOf(def.type)>=0&&def.weightConvention!=="unspecified")return "Eine Übung ohne Gewicht benötigt keine Gewichtskonvention.";
 if(typeof def.technique!=="string"||def.technique.length>500||typeof def.equipment!=="string"||def.equipment.length>80||def.archived!==undefined&&typeof def.archived!=="boolean")return "Persönliche Übung: Technik oder Gerät ist ungültig.";
 return null;
}
function personalExerciseTrackingKey(def){return def.type+"|"+def.perSide+"|"+def.weightConvention+"|"+def.equipment;}
function personalExerciseEntry(def){return{id:def.id,de:def.name,en:"",alias:[],typ:def.type==="weight"?"gewicht":def.type==="added_weight"?"kgz":def.type==="seconds"||def.type==="weighted_seconds"?"zeit":"koerpergewicht",weightedTime:def.type==="weighted_seconds",einseitig:def.perSide,equipment:def.equipment,technik:def.technique,video:"",ersatz:"",weightConvention:def.weightConvention,definition:def};}
function personalExerciseEntries(){var catalog=typeof S!=="undefined"&&S&&S.personalExercises||{};return Object.keys(catalog).filter(function(id){return catalog[id].archived!==true;}).map(function(id){return personalExerciseEntry(catalog[id]);});}
function personalExerciseCatalogError(catalog){
 if(!plainObject(catalog)||Object.keys(catalog).length>200)return "Die persönliche Bibliothek ist ungültig oder enthält mehr als 200 Übungen.";
 var ids=Object.keys(catalog);for(var i=0;i<ids.length;i++){var def=catalog[ids[i]];if(personalExerciseError(def)||def.id!==ids[i])return "Die persönliche Bibliothek enthält eine ungültige Definition.";}
 return null;
}
function preparePersonalProgram(program,preserveKnown){
 var copy=cloneJSON(program),catalog=typeof S!=="undefined"&&S&&S.personalExercises||{},definitions=Object.create(null),remapped=Object.create(null);
 (copy.days||[]).forEach(function(day){(day.ex||[]).forEach(function(ex){if(!ex.exerciseDefinition)return;var def=cloneJSON(ex.exerciseDefinition),key=def.id+"|"+JSON.stringify(def),existing=catalog[def.id];
  if(existing&&JSON.stringify(existing)!==JSON.stringify(def)&&!(preserveKnown&&personalExerciseTrackingKey(existing)===personalExerciseTrackingKey(def))){if(!remapped[key])remapped[key]=newPersonalExerciseId();def.id=remapped[key];ex.exerciseId=def.id;ex.exerciseDefinition=def;}
  if(definitions[def.id]&&JSON.stringify(definitions[def.id])!==JSON.stringify(def))throw new Error("Dieselbe persönliche Kennung hat widersprüchliche Definitionen.");definitions[def.id]=def;
 });});
 var mergedCatalog={};Object.keys(catalog).forEach(function(id){mergedCatalog[id]=catalog[id];});Object.keys(definitions).forEach(function(id){mergedCatalog[id]=definitions[id];});
 return{program:copy,definitions:definitions,remapped:Object.keys(remapped).length,error:personalExerciseCatalogError(mergedCatalog)};
}
function collectPersonalProgramDefinitions(program){
 var catalog=typeof S!=="undefined"&&S&&(S.personalExercises||(S.personalExercises={}))||{};
 (program.days||[]).forEach(function(day){(day.ex||[]).forEach(function(ex){var def=ex.exerciseDefinition;if(def&&!catalog[def.id])catalog[def.id]=cloneJSON(def);});});
}
function newPersonalExerciseId(){var catalog=typeof S!=="undefined"&&S&&S.personalExercises||{},id;do{id="custom_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,10);}while(catalog[id]);return id;}
var EXERCISE_REFERENCES={
 barbell_back_squat:{name:"Langhantel-Kniebeuge",type:"weight",perSide:false},
 dumbbell_bench_press:{name:"Kurzhantel-Bankdrücken",type:"weight",perSide:false},
 leg_press:{name:"Beinpresse",type:"weight",perSide:false},
 pull_up_added_load:{name:"Klimmzüge",type:"added_weight",perSide:false},
 one_arm_dumbbell_row:{name:"Kurzhantel-Rudern einarmig",type:"weight",perSide:true},
 plank:{name:"Plank",type:"seconds",perSide:false},
 suitcase_carry:{name:"Suitcase Carry",type:"weighted_seconds",perSide:true},
 burpee_push_up:{name:"Burpees",type:"bodyweight",perSide:false},
 wall_handstand_hold:{name:"Handstand halten an der Wand",type:"seconds",perSide:false},
 treadmill_duration:{name:"Laufband",type:"seconds",perSide:false}
};
var EXERCISE_WEIGHT_CONVENTIONS={barbell_back_squat:"total",dumbbell_bench_press:"per_dumbbell",leg_press:"device",pull_up_added_load:"total",one_arm_dumbbell_row:"per_dumbbell",suitcase_carry:"per_dumbbell"};
function performedExerciseError(value){
 if(!plainObject(value)||value.version!==1||typeof value.name!=="string"||!value.name.trim()||value.name.length>80||["reps","seconds"].indexOf(value.unit)<0)return "Die historische Übungserfassung ist ungültig.";
 if(typeof value.weighted!=="boolean"||typeof value.bodyweight!=="boolean"||typeof value.perSide!=="boolean"||["unspecified","total","per_dumbbell","device"].indexOf(value.weightConvention)<0||value.bodyweight&&(!value.weighted||value.unit==="seconds"))return "Die historischen Gewichts- oder Seitenangaben sind ungültig.";
 if(value.exerciseId!==undefined&&(typeof value.exerciseId!=="string"||!/^[a-z][a-z0-9_]{2,79}$/.test(value.exerciseId)))return "Die historische Übungskennung ist ungültig.";
 return null;
}
function exerciseReferenceDefinition(id){return typeof id==="string"&&Object.prototype.hasOwnProperty.call(EXERCISE_REFERENCES,id)?EXERCISE_REFERENCES[id]:null;}
function exerciseReferenceError(ex,internal){
 if(!ex)return null;
 if(ex.weightConvention!==undefined&&["unspecified","total","per_dumbbell","device"].indexOf(ex.weightConvention)<0)return "Die Gewichtskonvention ist ungültig.";
 if(ex.exerciseId===undefined)return ex.exerciseDefinition!==undefined?"Der persönlichen Übungsdefinition fehlt ihre Kennung.":null;
 var id=ex.exerciseId,def=ex.exerciseDefinition,ref=exerciseReferenceDefinition(id);
 if(typeof id==="string"&&id.indexOf("custom_")===0){if(personalExerciseError(def)||def.id!==id)return "Der persönlichen Übung fehlt eine gültige eingebettete Definition.";ref={name:def.name,type:def.type,perSide:def.perSide};if((ex.weightConvention||"unspecified")!==def.weightConvention)return "Die Gewichtskonvention widerspricht der persönlichen Definition.";}
 else if(def!==undefined)return "Integrierte Übungen dürfen keine persönliche Definition überschreiben.";
 if(typeof id!=="string"||! /^[a-z][a-z0-9_]{2,79}$/.test(id)||!ref)return"Die Übungszuordnung ist unbekannt. Wähle eine passende Bibliotheksübung oder löse die Zuordnung bewusst im Editor.";
 if(ex.tracking!==undefined)return"Diese zusätzlichen Übungsdaten werden noch nicht unterstützt. Verwende die bisherigen Satzfelder und eine kompatible Übungszuordnung.";
 var weighted=internal?ex.w:ex.weighted,added=internal?ex.bw:ex.bodyweight,timer=internal?ex.tmode:ex.timerMode;
 if(weighted!==undefined&&typeof weighted!=="boolean"||added!==undefined&&typeof added!=="boolean"||ex.perSide!==undefined&&typeof ex.perSide!=="boolean")return"Die Übungszuordnung benötigt eindeutige Gewichts- und Seitenangaben.";
 var seconds=ex.unit==="seconds"||ex.unit==="time",type=seconds?(weighted===true?"weighted_seconds":"seconds"):(weighted===true?(added===true?"added_weight":"weight"):"bodyweight");
 if(ex.unit!==undefined&&!["reps","seconds","time"].includes(ex.unit)||timer&&!seconds||added===true&&(weighted!==true||seconds)||type!==ref.type||!!ex.perSide!==ref.perSide)return"Die Übungszuordnung passt nicht zu Zeit, Gewicht oder Seitenzählung. Prüfe die Satzfelder oder löse die Zuordnung bewusst.";
 return null;
}

// Feste Programm-Kennung für die Update-Erkennung beim Import – unabhängig vom Namen.
function genProgramCode(){return "sk-"+Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);}
function ensureProgramCode(p){if(p&&!p.code){p.code=genProgramCode();if(!p.rev)p.rev=1;save();}return p&&p.code;}
function importTranslate(ext){
 var cats={};
 for(var k in ext.categories){var c=ext.categories[k]||{};cats[k]={label:c.label||k,color:(CAT_COLORS.indexOf(c.color)>=0?c.color:"slate"),rest:(c.rest!=null?c.rest:90),reps:c.reps||null};}
 return{
  id:genId(),name:String(ext.name||"Importiertes Programm").trim(),description:String(ext.description||"").trim(),
  art:(typeof ext.art==="string"&&ext.art.trim())?ext.art.trim().slice(0,24):undefined,
  bereich:bereichCanonical(ext.bereich)||undefined,
  code:(typeof ext.code==="string"&&/^[A-Za-z0-9_-]{4,24}$/.test(ext.code))?ext.code:undefined,
  rev:(typeof ext.revision==="number"&&isFinite(ext.revision)&&ext.revision>=1&&Math.floor(ext.revision)===ext.revision)?ext.revision:undefined,
  settings:(ext.settings&&typeof ext.settings==="object"&&!Array.isArray(ext.settings))?ext.settings:undefined,
  categories:cats,
  weeks:ext.weeks.map(function(w){return{n:w.n,phase:w.phase,label:w.label||w.phase,rir:String(w.rir==null?"":w.rir),note:w.note||"",sets:w.sets||{}};}),
  days:ext.days.map(function(d){return{key:String(d.key),wd:d.weekday||d.key,title:d.title||"",wu:wucdSan(d.warmup),cd:wucdSan(d.cooldown),ex:d.exercises.map(function(e,i){var ex={id:String(d.key)+"_"+i,name:e.name,en:e.en||"",sub:e.cue||"",cat:e.category,target:e.target||"",q:e.video||(e.name+" Technik"),gname:(e.garmin!==undefined?e.garmin:null),proxy:e.proxy||null,w:!!e.weighted,inc:e.weighted?(e.increment||2.5):undefined,def:(e.startWeight!=null?e.startWeight:0),bw:!!e.bodyweight,unit:((e.unit==="seconds"||e.unit==="time"||e.timerMode==="target"||e.timerMode==="max")?"seconds":"reps"),sets:(e.sets!=null?e.sets:undefined),reps:(Array.isArray(e.reps)?e.reps:undefined),pmode:((typeof e.progressionMode==="string"&&VALID_PROGRESSION_MODES.indexOf(e.progressionMode)>=0)?e.progressionMode:undefined),tmode:((e.timerMode==="target"||e.timerMode==="max")?e.timerMode:undefined)};if(e.fromWeek!=null)ex.fromWeek=e.fromWeek;if(e.untilWeek!=null)ex.untilWeek=e.untilWeek;if(e.prevId)ex.prevId=e.prevId;if(e.perSide===true)ex.perSide=true;if(e.exerciseId!==undefined)ex.exerciseId=e.exerciseId;if(e.weightConvention!==undefined)ex.weightConvention=e.weightConvention;if(e.exerciseDefinition!==undefined)ex.exerciseDefinition=JSON.parse(JSON.stringify(e.exerciseDefinition));return ex;})};})
 };
}
// Öffentliche Modul-Namen (Aliasse auf die bestehende, erprobte Logik).
function normalizeWorkout(raw){return importTranslate(raw);}
function validateWorkout(ext){return parseProgram(typeof ext==="string"?ext:JSON.stringify(ext));}
function exportTranslate(p){
 var cats={};
 for(var k in p.categories){var c=p.categories[k];cats[k]={label:c.label,color:c.color,rest:c.rest};if(c.reps)cats[k].reps=c.reps;}
 var out={
  _anleitung:ANLEITUNG,
  format:"trainings-block",version:2,name:p.name,categories:cats,
  art:p.art||undefined,bereich:p.bereich||undefined,
  code:p.code||undefined,revision:p.rev||undefined,
  weeks:p.weeks.map(function(w){return{n:w.n,phase:w.phase,label:w.label,rir:w.rir,sets:w.sets,note:w.note};}),
  days:p.days.map(function(d){var ids=Object.create(null);d.ex.forEach(function(e,index){ids[e.id]=d.key+"_"+index;});var dd={key:d.key,weekday:d.wd,title:d.title,exercises:d.ex.map(function(e){var o={name:e.name,category:e.cat};if(e.exerciseId!==undefined)o.exerciseId=e.exerciseId;if(e.weightConvention!==undefined)o.weightConvention=e.weightConvention;if(e.exerciseDefinition!==undefined)o.exerciseDefinition=JSON.parse(JSON.stringify(e.exerciseDefinition));if(e.en)o.en=e.en;if(e.sub)o.cue=e.sub;var isSeconds=(e.unit==="seconds"||e.tmode==="target"||e.tmode==="max");if(e.w){o.weighted=true;o.increment=e.inc;o.startWeight=e.def;if(e.bw)o.bodyweight=true;if(isSeconds)o.unit="seconds";}else if(isSeconds)o.unit="seconds";if(e.tmode)o.timerMode=e.tmode;if(e.perSide)o.perSide=true;if(e.sets!=null)o.sets=e.sets;if(Array.isArray(e.reps))o.reps=e.reps;if(e.pmode)o.progressionMode=e.pmode;if(e.q)o.video=e.q;if(e.gname!==undefined&&e.gname!==null)o.garmin=e.gname;if(e.proxy)o.proxy=e.proxy;if(e.target)o.target=e.target;if(e.fromWeek!=null)o.fromWeek=e.fromWeek;if(e.untilWeek!=null)o.untilWeek=e.untilWeek;if(e.prevId&&ids[e.prevId])o.prevId=ids[e.prevId];return o;})};if(d.wu&&d.wu.length)dd.warmup=d.wu.map(function(w){return{name:w.name,seconds:w.sec};});if(d.cd&&d.cd.length)dd.cooldown=d.cd.map(function(w){return{name:w.name,seconds:w.sec};});return dd;})
 };
 if(p.description)out.description=p.description;
 if(p.settings)out.settings=p.settings;
 return out;
}
function plainObject(v){return !!v&&typeof v==="object"&&!Array.isArray(v);}
function finiteNumber(v,min,max,integer){return typeof v==="number"&&isFinite(v)&&v>=min&&v<=max&&(!integer||Math.floor(v)===v);}
function validTimedBlock(arr,label,dayKey){
 if(arr==null)return null;
 if(!Array.isArray(arr))return'Tag '+esc(dayKey)+': "'+label+'" muss eine Liste sein.';
 if(arr.length>8)return'Tag '+esc(dayKey)+': "'+label+'" darf höchstens 8 Einträge enthalten.';
 for(var i=0;i<arr.length;i++){
  var it=arr[i];
  if(!plainObject(it)||typeof it.name!=="string"||!WUCD_SET[it.name])return'Tag '+esc(dayKey)+': "'+label+'" enthält bei Eintrag '+(i+1)+' eine unbekannte Übung.';
  if(!finiteNumber(it.seconds,15,180,true))return'Tag '+esc(dayKey)+': "'+label+'" Eintrag '+(i+1)+' braucht ganze Sekunden zwischen 15 und 180.';
 }
 return null;
}
function parseProgram(text){
 var personalDefinitions=Object.create(null);
 var ext;try{ext=JSON.parse(text);}catch(e){return{err:"Kein gültiges JSON: "+e.message};}
 if(!ext||ext.format!=="trainings-block")return{err:'Feld "format":"trainings-block" fehlt.'};
 if(ext.version!=null&&ext.version!==2)return{err:'Nicht unterstützte Programmversion „'+esc(ext.version)+'“. Erwartet wird Version 2.'};
 if(typeof ext.name!=="string"||!ext.name.trim())return{err:'"name" fehlt oder ist leer.'};
 if(ext.name.trim().length>LIMITS.maxNameLen)return{err:'Programmname zu lang ('+ext.name.trim().length+' Zeichen). Maximal '+LIMITS.maxNameLen+' Zeichen.'};
 if(ext.description!=null&&(typeof ext.description!=="string"||ext.description.length>200))return{err:'"description" muss Text mit höchstens 200 Zeichen sein.'};
 if(ext.art!=null&&(typeof ext.art!=="string"||!ext.art.trim()||ext.art.trim().length>24))return{err:'"art" muss Text mit höchstens 24 Zeichen sein, z. B. "Standard" oder "Fortgeschritten".'};
 if(ext.bereich!=null&&!bereichCanonical(ext.bereich))return{err:'"bereich" muss einer dieser Werte sein: '+BEREICHE.join(", ")+'.'};
 if(ext.code!=null&&(typeof ext.code!=="string"||!/^[A-Za-z0-9_-]{4,24}$/.test(ext.code)))return{err:'"code" muss 4 bis 24 Zeichen aus Buchstaben, Zahlen, - und _ sein.'};
 if(ext.revision!=null&&!finiteNumber(ext.revision,1,1000000,true))return{err:'"revision" muss eine ganze Zahl ab 1 sein.'};
 if(!plainObject(ext.categories)||!Object.keys(ext.categories).length)return{err:'"categories" fehlt oder ist leer.'};
 var categoryKeys=Object.keys(ext.categories);
 if(categoryKeys.length>20)return{err:'Zu viele Kategorien ('+categoryKeys.length+'). Maximal 20.'};
 for(var ci=0;ci<categoryKeys.length;ci++){
  var categoryKey=categoryKeys[ci],category=ext.categories[categoryKey];
  if(!/^[A-Za-z0-9_-]{1,32}$/.test(categoryKey)||categoryKey==="__proto__"||categoryKey==="constructor"||categoryKey==="prototype")return{err:'Ungültiger Kategorie-Schlüssel „'+esc(categoryKey)+'“. Erlaubt sind Buchstaben, Zahlen, _ und -.'};
  if(!plainObject(category))return{err:'Kategorie „'+esc(categoryKey)+'“ muss ein Objekt sein.'};
  if(typeof category.label!=="string"||!category.label.trim()||category.label.length>30)return{err:'Kategorie „'+esc(categoryKey)+'“ braucht ein Label mit höchstens 30 Zeichen.'};
  if(CAT_COLORS.indexOf(category.color)<0)return{err:'Kategorie „'+esc(categoryKey)+'“ hat eine ungültige Farbe.'};
  if(!finiteNumber(category.rest,15,600,true))return{err:'Kategorie „'+esc(categoryKey)+'“ braucht eine Pause zwischen 15 und 600 Sekunden.'};
  if(category.reps!=null){
   if(!plainObject(category.reps))return{err:'Kategorie „'+esc(categoryKey)+'": "reps" muss ein Objekt sein.'};
   var repPhases=Object.keys(category.reps);
   for(var rp=0;rp<repPhases.length;rp++){
    var repPhase=repPhases[rp],range=category.reps[repPhase];
    if(["aufbau","intensiv","deload"].indexOf(repPhase)<0)return{err:'Kategorie „'+esc(categoryKey)+'“ enthält den unbekannten Wiederholungsbereich „'+esc(repPhase)+'“.'};
    if(!Array.isArray(range)||range.length!==2||!finiteNumber(range[0],1,100,true)||!finiteNumber(range[1],1,100,true)||range[0]>range[1])return{err:'Kategorie „'+esc(categoryKey)+'“, Phase „'+esc(repPhase)+'": Wiederholungen müssen als [min,max] zwischen 1 und 100 angegeben sein.'};
   }
  }
 }
 if(!Array.isArray(ext.weeks)||!ext.weeks.length)return{err:'"weeks" fehlt oder ist leer.'};
 if(!Array.isArray(ext.days)||!ext.days.length)return{err:'"days" fehlt oder ist leer.'};
 if(ext.weeks.length>LIMITS.maxWeeks)return{err:'Zu viele Wochen ('+ext.weeks.length+'). Ein Trainingsblock hat höchstens '+LIMITS.maxWeeks+' Wochen – teile längere Pläne in mehrere Programme.'};
 if(ext.days.length>LIMITS.maxDays)return{err:'Zu viele Trainingstage ('+ext.days.length+'). Maximal '+LIMITS.maxDays+' pro Woche (eine Woche hat 7 Tage).'};
 var settings=ext.settings;
 if(settings!=null){
  if(!plainObject(settings))return{err:'"settings" muss ein Objekt sein.'};
  if(settings.progressionSystem!=null&&settings.progressionSystem!=="double_progression")return{err:'Unbekanntes "progressionSystem".'};
  if(settings.deloadMultiplier!=null&&!finiteNumber(settings.deloadMultiplier,0.1,1,false))return{err:'"deloadMultiplier" muss zwischen 0.1 und 1 liegen.'};
  if(settings.postDeloadReturnMultiplier!=null&&!finiteNumber(settings.postDeloadReturnMultiplier,0.1,1,false))return{err:'"postDeloadReturnMultiplier" muss zwischen 0.1 und 1 liegen.'};
  if(settings.requireAllSetsForIncrease!=null&&typeof settings.requireAllSetsForIncrease!=="boolean")return{err:'"requireAllSetsForIncrease" muss true oder false sein.'};
  if(settings.allowAutoDecrease!=null&&typeof settings.allowAutoDecrease!=="boolean")return{err:'"allowAutoDecrease" muss true oder false sein.'};
 }
 for(var wi=0;wi<ext.weeks.length;wi++){
  var wk=ext.weeks[wi];
  if(!plainObject(wk))return{err:'Woche '+(wi+1)+' muss ein Objekt sein.'};
  if(!finiteNumber(wk.n,1,LIMITS.maxWeeks,true)||wk.n!==wi+1)return{err:'Woche '+(wi+1)+': "n" muss fortlaufend '+(wi+1)+' sein.'};
  if(["aufbau","intensiv","deload"].indexOf(wk.phase)<0)return{err:'Woche '+wk.n+': unbekannte Phase „'+esc(wk.phase)+'“.'};
  if(typeof wk.label!=="string"||!wk.label.trim()||wk.label.length>30)return{err:'Woche '+wk.n+': "label" fehlt oder ist länger als 30 Zeichen.'};
  if(wk.rir!=null&&String(wk.rir).length>12)return{err:'Woche '+wk.n+': "rir" ist zu lang.'};
  if(wk.note!=null&&(typeof wk.note!=="string"||wk.note.length>200))return{err:'Woche '+wk.n+': "note" darf höchstens 200 Zeichen haben.'};
  if(!plainObject(wk.sets)||!Object.keys(wk.sets).length)return{err:'Woche '+wk.n+': "sets" fehlt oder ist leer.'};
  for(var ck in wk.sets){if(categoryKeys.indexOf(ck)<0)return{err:'Woche '+wk.n+': "sets" verweist auf unbekannte Kategorie „'+esc(ck)+'“.'};if(!finiteNumber(wk.sets[ck],1,LIMITS.maxSets,true))return{err:'Woche '+wk.n+', Kategorie „'+esc(ck)+'“: Sätze müssen eine ganze Zahl zwischen 1 und '+LIMITS.maxSets+' sein.'};}
 }
 var seenKeys=Object.create(null),usedCategories=Object.create(null);
 for(var i=0;i<ext.days.length;i++){
  var d=ext.days[i];if(!plainObject(d))return{err:'Tag '+(i+1)+' muss ein Objekt sein.'};
  if(typeof d.key!=="string"||! /^[A-Za-z0-9_-]{1,12}$/.test(d.key))return{err:'Tag '+(i+1)+': "key" fehlt oder enthält ungültige Zeichen.'};
  if(seenKeys[d.key])return{err:'Tag-"key" „'+esc(d.key)+'“ kommt doppelt vor.'};seenKeys[d.key]=1;
  var weekday=String(d.weekday||"").trim().toLowerCase();if(!weekday||WD_MAP[weekday]==null)return{err:'Tag '+esc(d.key)+': "weekday" muss ein gültiger Wochentag sein.'};
  if(String(d.weekday).length>LIMITS.maxLabelLen)return{err:'Tag '+esc(d.key)+': "weekday" ist zu lang.'};
  if(d.title!=null&&(typeof d.title!=="string"||d.title.length>60))return{err:'Tag '+esc(d.key)+': "title" darf höchstens 60 Zeichen haben.'};
  var timedErr=validTimedBlock(d.warmup,"warmup",d.key)||validTimedBlock(d.cooldown,"cooldown",d.key);if(timedErr)return{err:timedErr};
  if(!Array.isArray(d.exercises)||!d.exercises.length)return{err:'Tag '+esc(d.key)+': "exercises" fehlt oder ist leer.'};
  if(d.exercises.length>LIMITS.maxExPerDay)return{err:'Tag '+esc(d.key)+': zu viele Übungen ('+d.exercises.length+'). Maximal '+LIMITS.maxExPerDay+'.'};
  for(var j=0;j<d.exercises.length;j++){
   var x=d.exercises[j],dayName=String(d.title||d.weekday||d.key).trim(),dayExtra=d.weekday&&String(d.weekday).trim()!==dayName?' ('+esc(d.weekday)+')':'',exerciseName=plainObject(x)&&typeof x.name==="string"&&x.name.trim()?'„'+esc(x.name.trim())+'“':'#'+(j+1),where='Trainingstag „'+esc(dayName)+'“'+dayExtra+', Übung '+exerciseName,path='days['+i+'].exercises['+j+']',exerciseError=function(message,field){return{err:where+': '+message,path:path+(field?'.'+field:'')};};
   if(!plainObject(x))return exerciseError("Der Eintrag muss ein Objekt sein.");
   if(typeof x.name!=="string"||!x.name.trim()||x.name.length>80)return exerciseError('"name" fehlt oder ist länger als 80 Zeichen.',"name");
   var referenceError=exerciseReferenceError(x,false);if(referenceError)return exerciseError(referenceError,"exerciseId");
   if(x.exerciseDefinition){var definitionKey=x.exerciseId,definitionJSON=JSON.stringify(x.exerciseDefinition);if(personalDefinitions[definitionKey]&&personalDefinitions[definitionKey]!==definitionJSON)return exerciseError("Diese persönliche Kennung hat mehrere unterschiedliche Definitionen.","exerciseId");personalDefinitions[definitionKey]=definitionJSON;}
   if(typeof x.category!=="string"||categoryKeys.indexOf(x.category)<0)return exerciseError('unbekannte "category" „'+esc(x.category)+'“.',"category");usedCategories[x.category]=1;
   if(x.unit!=null&&["reps","seconds","time"].indexOf(x.unit)<0)return exerciseError('"unit" muss "reps" oder "seconds" sein.',"unit");
   if(x.sets!=null&&!finiteNumber(x.sets,1,LIMITS.maxSets,true))return exerciseError('"sets" muss eine ganze Zahl zwischen 1 und '+LIMITS.maxSets+' sein.',"sets");
   var prescriptionMax=(x.unit==="seconds"||x.exerciseId!==undefined&&x.unit==="time")?5999:9999;
   if(x.reps!=null&&(!Array.isArray(x.reps)||x.reps.length!==2||!finiteNumber(x.reps[0],1,prescriptionMax,true)||!finiteNumber(x.reps[1],1,prescriptionMax,true)||x.reps[0]>x.reps[1]))return exerciseError('"reps" muss als [min,max] mit ganzen positiven Zahlen bis '+prescriptionMax+' angegeben sein.',"reps");
   if(x.progressionMode!=null&&VALID_PROGRESSION_MODES.indexOf(x.progressionMode)<0)return exerciseError('unbekannter "progressionMode".',"progressionMode");
   if(x.timerMode!=null&&["target","max"].indexOf(x.timerMode)<0)return exerciseError('"timerMode" muss "target" oder "max" sein.',"timerMode");
   if(x.timerMode!=null&&x.unit!=="seconds"&&x.unit!=="time")return exerciseError('"timerMode" benötigt "unit":"seconds".',"unit");
   if(x.perSide!=null&&typeof x.perSide!=="boolean")return exerciseError('"perSide" muss true oder false sein.',"perSide");
   var timelineMax=ext.weeks.length;
   if(x.fromWeek!=null&&!finiteNumber(x.fromWeek,1,timelineMax,true))return exerciseError('"fromWeek" muss eine gültige Woche innerhalb des Blocks sein.',"fromWeek");
   if(x.untilWeek!=null&&!finiteNumber(x.untilWeek,1,timelineMax,true))return exerciseError('"untilWeek" muss eine gültige Woche innerhalb des Blocks sein.',"untilWeek");
   if(x.fromWeek!=null&&x.untilWeek!=null&&x.fromWeek>x.untilWeek)return exerciseError('"fromWeek" darf nicht nach "untilWeek" liegen.',"fromWeek");
   if(x.prevId!=null&&(typeof x.prevId!=="string"||!new RegExp("^"+String(d.key).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"_\\d+$").test(x.prevId)||x.prevId===d.key+"_"+j))return exerciseError('"prevId" muss auf eine andere Übung desselben Tages verweisen.',"prevId");
   var textFields=["en","cue","video","garmin","proxy","target"];for(var tf=0;tf<textFields.length;tf++){var field=textFields[tf];if(x[field]!=null&&(typeof x[field]!=="string"||x[field].length>200))return exerciseError('"'+field+'" muss Text mit höchstens 200 Zeichen sein.',field);}
   if(x.weighted===true){if(!finiteNumber(x.increment,0.1,100,false))return exerciseError('"increment" muss zwischen 0.1 und 100 liegen.',"increment");if(!finiteNumber(x.startWeight,0,2000,false))return exerciseError('"startWeight" muss zwischen 0 und 2000 liegen.',"startWeight");}
   else{if(x.bodyweight===true)return exerciseError('"bodyweight" benötigt "weighted":true.',"bodyweight");if(x.increment!=null||x.startWeight!=null)return exerciseError('"increment" und "startWeight" benötigen "weighted":true.',x.increment!=null?"increment":"startWeight");}
  }
  for(var pj=0;pj<d.exercises.length;pj++){var prev=d.exercises[pj].prevId;if(prev!=null){var prevIndex=Number(prev.slice(String(d.key).length+1));if(!finiteNumber(prevIndex,0,d.exercises.length-1,true))return{err:'Tag '+esc(d.key)+', Übung '+(pj+1)+': "prevId" verweist auf keine Übung dieses Tages.'};}}
 }
 var usedKeys=Object.keys(usedCategories);
 for(var uw=0;uw<ext.weeks.length;uw++)for(var uc=0;uc<usedKeys.length;uc++)if(ext.weeks[uw].sets[usedKeys[uc]]==null)return{err:'Woche '+ext.weeks[uw].n+': In "sets" fehlt die verwendete Kategorie „'+esc(usedKeys[uc])+'“.'};
 return{prog:importTranslate(ext)};
}
function setActive(id){if(typeof localWriteBlocked==="function"&&localWriteBlocked())return false;
 if(!S.programs[id])return false;
 if(S.programs[id].archived===true)return false;
 if(programWriteLocked()&&id!==S.active){showProgramWriteLocked();return false;}
 syncStore();
 S.active=id;
 var st=S.store[id];if(!st){st=newStore(S.programs[id]);S.store[id]=st;}sanitizeStoredSetValues(S.programs[id],st.logs);
 if(!st.barw||typeof st.barw!=="object"||Array.isArray(st.barw))st.barw={};if(!st.notes||typeof st.notes!=="object"||Array.isArray(st.notes))st.notes={};st.pendingReplacements=sanitizePendingReplacements(st.pendingReplacements,id,S.programs[id]);st.removedEx=sanitizeRemovedExercises(st.removedEx,S.programs[id]);
 S.tg=st.tg;S.barw=st.barw;S.notes=st.notes;S.logs=st.logs;S.history=st.history;S.workout=st.workout;S.pendingReplacements=st.pendingReplacements;S.removedEx=st.removedEx;S.week=st.week;S.day=st.day;S.blockCelebrated=st.blockCelebrated===true;refreshPostWorkoutReplacements();
 var keys=dayKeys();if(keys.indexOf(S.day)<0)S.day=keys[0];
 if(S.week>PROG().weeks.length)S.week=PROG().weeks.length;if(S.week<1)S.week=1;
 save();renderView();renderBar();return true;
}
