(function(root,factory){
 var api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.SatzkraftProgression=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";

 var VALID_MODES=["weight","added_weight","reps","seconds","progression","none"];
 var DEFAULT_SETTINGS={progressionSystem:"double_progression",deloadMultiplier:0.6,requireAllSetsForIncrease:true,allowAutoDecrease:true,postDeloadReturnMultiplier:0.925};
 var DEFAULT_INCREMENT={weight:2.5,added_weight:2.5,reps:1,seconds:5};

 function round(x){return Math.round(x*2)/2;}

 function getWorkoutSettings(prog){
  var raw=(prog&&prog.settings)||{},out={};
  for(var k in DEFAULT_SETTINGS)out[k]=DEFAULT_SETTINGS[k];
  if(raw.progressionSystem==="double_progression")out.progressionSystem=raw.progressionSystem;
  if(isFinite(raw.deloadMultiplier)&&raw.deloadMultiplier>0&&raw.deloadMultiplier<=1)out.deloadMultiplier=raw.deloadMultiplier;
  if(typeof raw.requireAllSetsForIncrease==="boolean")out.requireAllSetsForIncrease=raw.requireAllSetsForIncrease;
  if(typeof raw.allowAutoDecrease==="boolean")out.allowAutoDecrease=raw.allowAutoDecrease;
  if(isFinite(raw.postDeloadReturnMultiplier)&&raw.postDeloadReturnMultiplier>0&&raw.postDeloadReturnMultiplier<=1)out.postDeloadReturnMultiplier=raw.postDeloadReturnMultiplier;
  return out;
 }

 function getExerciseProgressionMode(ex){
  var m=ex&&ex.pmode;
  if(typeof m==="string"&&VALID_MODES.indexOf(m)>=0)return m;
  if(ex&&ex.w&&ex.bw)return"added_weight";
  if(ex&&ex.w)return"weight";
  if(ex&&ex.unit==="seconds")return"seconds";
  if(ex&&ex.cat==="skill")return"progression";
  return"reps";
 }

 function repBucket(sets,repRange,settings){
  if(!repRange||!sets)return"none";
  var top=repRange[1],bot=repRange[0],allTop=true,anyTop=false,minR=Infinity,any=false;
  sets.forEach(function(s){if(s.reps===""||s.reps==null)return;any=true;var r=Number(s.reps);if(r<top)allTop=false;if(r>=top)anyTop=true;if(r<minR)minR=r;});
  if(!any)return"none";
  if(settings.requireAllSetsForIncrease?allTop:anyTop)return"increase";
  if(minR<bot)return"below";
  return"hold";
 }

 function increasedWeight(curW,inc){return round(Math.max(0,curW)+inc);}

 function calculateDeloadValue(weight,settings){return round((Number(weight)||0)*(settings||DEFAULT_SETTINGS).deloadMultiplier);}

 function buildCoachMessage(rec){
  var a=rec&&rec.action,inc=rec&&rec.increment,mode=rec&&rec.mode,nw=rec&&rec.nextWeight;
  if(a==="increase"){
   if(mode==="weight"||mode==="added_weight")return"Steigern: nächstes Mal +"+inc+" kg"+(nw!=null?" (≈ "+nw+" kg)":"");
   if(mode==="seconds")return"Steigern: nächstes Mal +"+inc+" s Haltezeit";
   return"Steigern: nächstes Mal +"+inc+" Wiederholung(en)";
  }
  if(a==="hold"){
   if(mode==="seconds")return"Halten: gleiche Belastung, versuche eine längere Haltezeit";
   if(mode==="reps")return"Halten: versuche mehr Wiederholungen";
   return"Halten: Gewicht bleibt gleich, versuche mehr Wiederholungen";
  }
  if(a==="decrease")return"Reduzieren: Gewicht war wahrscheinlich zu hoch"+(nw!=null?" (≈ "+nw+" kg)":"");
  if(a==="deload")return"Deload: reduziertes Gewicht verwenden"+(nw!=null?" (≈ "+nw+" kg)":"");
  if(a==="technique")return"Technik prüfen: keine Steigerung empfohlen";
  if(a==="progression")return"Progression möglich: schwerere Variante testen";
  return"";
 }

 function calculateNextRecommendation(p){
  var ex=p.exercise||{},settings=p.settings||DEFAULT_SETTINGS;
  var mode=getExerciseProgressionMode(ex);
  var inc=(ex.inc!=null&&isFinite(ex.inc)&&ex.inc>0)?ex.inc:(DEFAULT_INCREMENT[mode]||DEFAULT_INCREMENT.weight);
  var current=p.currentSession,repRange=p.repRange,currentWeight=Number(p.currentWeight)||0;
  function result(value){value.mode=mode;value.increment=inc;if(value.nextWeight===undefined)value.nextWeight=null;value.message=buildCoachMessage(value);return value;}
  if(!current||!current.length)return result({action:"none",reason:"Noch keine Werte eingetragen."});
  if(p.isDeload)return result({action:"deload",nextWeight:calculateDeloadValue(currentWeight,settings),reason:"Deload – keine Progression, reduziertes Gewicht verwenden."});
  if(mode==="none")return result({action:"none",reason:"Für diese Übung ist keine automatische Progression vorgesehen."});
  if(mode==="progression"){
   if(repRange&&repBucket(current,repRange,settings)==="increase")return result({action:"progression",reason:"Zielbereich erreicht – nächste Skill-Stufe / schwerere Variante testen."});
   return result({action:"technique",reason:"Skill-Übung – sauber üben, keine automatische Gewichtssteigerung."});
  }
  var bucket=repBucket(current,repRange,settings);
  if(bucket==="increase"){
   if(mode==="weight"||mode==="added_weight")return result({action:"increase",nextWeight:increasedWeight(currentWeight,inc,repRange,current),reason:"Alle Arbeitssätze am oberen Wiederholungsbereich erreicht."});
   return result({action:"increase",reason:"Oberes Ziel erreicht – nächstes Mal etwas mehr."});
  }
  if(bucket==="below"){
   var previousBelow=p.lastSession?(repBucket(p.lastSession,repRange,settings)==="below"):false;
   if(previousBelow&&settings.allowAutoDecrease&&(mode==="weight"||mode==="added_weight"))return result({action:"decrease",nextWeight:Math.max(0,round(currentWeight-inc)),reason:"Zwei Einheiten in Folge unter dem unteren Wiederholungsbereich."});
   return result({action:"hold",nextWeight:(mode==="weight"||mode==="added_weight")?currentWeight:null,reason:"Unter dem Zielbereich – Gewicht halten und Wiederholungen aufbauen."});
  }
  return result({action:"hold",nextWeight:(mode==="weight"||mode==="added_weight")?currentWeight:null,reason:"Im Zielbereich, aber noch nicht oben – Gewicht halten, mehr Wiederholungen anstreben."});
 }

 return{
  VALID_MODES:VALID_MODES.slice(),
  DEFAULT_SETTINGS:Object.assign({},DEFAULT_SETTINGS),
  getWorkoutSettings:getWorkoutSettings,
  getExerciseProgressionMode:getExerciseProgressionMode,
  calculateDeloadValue:calculateDeloadValue,
  buildCoachMessage:buildCoachMessage,
  calculateNextRecommendation:calculateNextRecommendation
 };
});
