// ---------- Standard-Programm ----------
var BEREICHE=["Ganzkörper","Oberkörper","Unterkörper","Push","Pull","Beine","Brust","Rücken","Schultern","Arme","Core","Hybrid","Calisthenics","Cardio"];
function bereichCanonical(v){if(typeof v!=="string")return null;var t=v.trim().toLowerCase();for(var i=0;i<BEREICHE.length;i++)if(BEREICHE[i].toLowerCase()===t)return BEREICHE[i];return null;}
var DEFAULT_PROGRAM={
 id:"default", name:"Ganzkörper 3×", art:"Standard", bereich:"Ganzkörper",
 categories:{
  strength:{label:"Kraft",color:"amber",rest:150,reps:{aufbau:[5,7],intensiv:[3,5],deload:[5,5]}},
  hyp:{label:"Hypertrophie",color:"emerald",rest:90,reps:{aufbau:[8,12],intensiv:[6,10],deload:[10,10]}},
  skill:{label:"Skill",color:"violet",rest:150,reps:null},
  core:{label:"Core",color:"sky",rest:60,reps:null}
 },
 weeks:[
  {n:1,phase:"aufbau",label:"Aufbau",rir:"3",sets:{strength:3,hyp:3,skill:4,core:4},note:"Basiswoche – Technik & Volumen aufbauen, sauber bleiben."},
  {n:2,phase:"aufbau",label:"Aufbau",rir:"2",sets:{strength:3,hyp:3,skill:4,core:4},note:"Volumen halten, Gewichte leicht steigern wo möglich."},
  {n:3,phase:"aufbau",label:"Aufbau (Peak)",rir:"1–2",sets:{strength:4,hyp:4,skill:4,core:4},note:"Höchstes Volumen im ersten Block – härtester Teil."},
  {n:4,phase:"deload",label:"Deload",rir:"4–5",sets:{strength:2,hyp:2,skill:2,core:2},note:"Erholung: ~60 % Gewicht, weit weg vom Muskelversagen."},
  {n:5,phase:"intensiv",label:"Intensivierung",rir:"2",sets:{strength:3,hyp:3,skill:4,core:4},note:"Neue Basis – schwerer als Woche 1, Reps unteres Ende."},
  {n:6,phase:"intensiv",label:"Intensivierung",rir:"1–2",sets:{strength:4,hyp:3,skill:4,core:4},note:"Intensität hoch, mehr Arbeitssätze auf den Hauptlifts."},
  {n:7,phase:"intensiv",label:"Intensiv (Peak)",rir:"1",sets:{strength:4,hyp:4,skill:4,core:4},note:"Peak – maximale Belastung kurz vor Versagen."},
  {n:8,phase:"deload",label:"Deload / Test",rir:"3",sets:{strength:2,hyp:2,skill:2,core:2},note:"Deload + optional Hauptlifts testen. Block abschließen."}
 ],
 days:[
  {key:"A",wd:"Montag",title:"Kniebeuge + Druck",ex:[
   {id:"a1",name:"Muscle-up Progression",en:"Muscle-up",sub:"Explosive Klimmzüge / saubere Negative",cat:"skill",unit:"reps",target:"3–5 explosive Reps",q:"Muscle up lernen Tutorial deutsch",gname:null,proxy:"Jumping Pull-up / Pull-Up"},
   {id:"a2",name:"Langhantel-Kniebeuge",en:"Barbell Back Squat",sub:"Tief & kontrolliert",cat:"strength",w:true,inc:5,def:80,q:"Langhantel Kniebeuge Technik",gname:"Barbell Squat"},
   {id:"a3",name:"Langhantel-Bankdrücken",en:"Barbell Bench Press",sub:"Schulterblätter fixiert",cat:"strength",w:true,inc:2.5,def:60,q:"Langhantel Bankdrücken Technik",gname:"Barbell Bench Press"},
   {id:"a4",name:"Kurzhantel-Rudern (einarmig)",en:"One-Arm Dumbbell Row",sub:"Auf Bank gestützt · pro Hand",cat:"hyp",w:true,inc:2,def:22,q:"einarmiges Kurzhantelrudern Technik",gname:"Single-Arm Dumbbell Row"},
   {id:"a5",name:"KH-Schulterdrücken",en:"Dumbbell Shoulder Press",sub:"pro Hand",cat:"hyp",w:true,inc:2,def:18,q:"Kurzhantel Schulterdrücken Technik",gname:"Dumbbell Shoulder Press"},
   {id:"a6",name:"Hanging Leg Raises",en:"Hanging Leg Raise",sub:"Beine gestreckt, kein Schwung",cat:"core",unit:"reps",target:"10–15 Reps",q:"Hanging Leg Raises Technik",gname:"Hanging Leg Raise"}
  ]},
  {key:"B",wd:"Mittwoch",title:"Hüfte + Zug",ex:[
   {id:"b1",name:"Handstand / Pike Push-up",en:"Pike / Handstand Push-up",sub:"An Wand · Hold oder Reps",cat:"skill",unit:"reps",target:"20–30 s Hold o. 5–8 Reps",q:"Pike Push up Tutorial deutsch",gname:"Handstand Push-up"},
   {id:"b2",name:"Kreuzheben",en:"Deadlift",sub:"Neutraler Rücken, Hüfte führt",cat:"strength",w:true,inc:5,def:100,q:"Kreuzheben Technik Deadlift",gname:"Barbell Deadlift"},
   {id:"b3",name:"Dips (Brust)",en:"Chest Dip",sub:"Vorgelehnt, tiefer ROM",cat:"strength",w:true,inc:2.5,def:0,bw:true,q:"Dips Technik Brust",gname:"Dip"},
   {id:"b4",name:"Langhantel-Rudern",en:"Barbell Bent-Over Row",sub:"Oberkörper ~45°, Ellbogen eng",cat:"hyp",w:true,inc:2.5,def:50,q:"Langhantel Rudern Technik",gname:"Barbell Row"},
   {id:"b5",name:"Bulgarian Split Squat (KH)",en:"Bulgarian Split Squat",sub:"pro Hand · je Bein",cat:"hyp",w:true,inc:2,def:16,q:"Bulgarian Split Squat Technik",gname:"Bulgarian Split Squat"},
   {id:"b6",name:"Ab Wheel Rollout",en:"Ab Wheel Rollout",sub:"Becken neutral, kein Hohlkreuz",cat:"core",unit:"reps",target:"8–12 Reps",q:"Ab Wheel Rollout Technik",gname:"Ab Wheel Rollout"}
  ]},
  {key:"C",wd:"Freitag",title:"Overhead + Explosiv",ex:[
   {id:"c1",name:"Front Lever Progression",en:"Front Lever",sub:"Tuck → Advanced Tuck · Hold",cat:"skill",unit:"seconds",target:"3 × 8–15 s Hold",q:"Front Lever lernen Tutorial deutsch",gname:null,proxy:"Hanging L Sit / Plank"},
   {id:"c2",name:"Overhead Press (LH/KH)",en:"Overhead Press",sub:"Stehend, Core fest",cat:"strength",w:true,inc:2.5,def:35,q:"Overhead Press Schulterdrücken Technik",gname:"Overhead Barbell Press"},
   {id:"c3",name:"Rumänisches Kreuzheben",en:"Romanian Deadlift",sub:"Hüfte zurück, Hamstrings spüren",cat:"strength",w:true,inc:5,def:80,q:"Rumänisches Kreuzheben Technik",gname:"Romanian Deadlift"},
   {id:"c4",name:"Dips (Trizeps)",en:"Triceps Dip",sub:"Aufrecht, Ellbogen eng",cat:"hyp",w:true,inc:2.5,def:0,bw:true,q:"Dips Technik Trizeps",gname:"Triceps Dip"},
   {id:"c5",name:"Klimmzüge (Untergriff)",en:"Chin-Up",sub:"Bizeps-betont, voller ROM",cat:"hyp",w:true,inc:2.5,def:0,bw:true,q:"Klimmzüge Untergriff Chin up Technik",gname:"Chin-Up"},
   {id:"c6",name:"Kettlebell Swings",en:"Kettlebell Swing",sub:"Hüft-Explosivität, Hardstyle",cat:"hyp",w:true,inc:4,def:24,q:"Kettlebell Swing Technik Hardstyle",gname:"Kettlebell Swing"},
   {id:"c7",name:"L-Sit / Plank",en:"L-Sit",sub:"Maximaler Hold",cat:"core",unit:"seconds",target:"3 × max. Hold",q:"L-Sit lernen Tutorial deutsch",gname:"Hanging L Sit"}
  ]}
 ]
};

var APP_VERSION="0.39.0";
