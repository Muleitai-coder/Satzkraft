// ---------- Warm-up & Cool-down (zeitbasiert, Whitelist) ----------
var WUCD_LIB={
 warmup:["Armkreisen","Schulterkreisen mit Band","Band Pull-Aparts","Cat-Cow","World's Greatest Stretch","H\u00fcftkreisen","Beinpendeln","Ausfallschritte dynamisch","Kniebeugen ohne Gewicht","Glute Bridges","Hampelm\u00e4nner","Seilspringen","Rumpfrotation stehend","Handgelenkkreisen","Nackenmobilisation","Schulterblatt-Liegest\u00fctze","Thorakale Rotation im Vierf\u00fc\u00dfler","Fersenheben","Marschieren auf der Stelle","Inchworm"],
 cooldown:["Brustdehnung T\u00fcrrahmen","Schulterdehnung \u00fcber Kreuz","Trizepsdehnung \u00fcber Kopf","Lat-Dehnung am Rack","Kindhaltung","Kobra-Dehnung","H\u00fcftbeuger-Dehnung im Ausfallschritt","Taubenhaltung","Beinr\u00fcckseiten-Dehnung","Quadrizeps-Dehnung stehend","Wadendehnung an der Wand","Ges\u00e4\u00dfdehnung liegend (Figur 4)","Unterarmdehnung","Tiefe Hocke halten"]
};
var WUCD_SET={};WUCD_LIB.warmup.concat(WUCD_LIB.cooldown).forEach(function(n){WUCD_SET[n]=1;});
ANLEITUNG.erlaubte_werte.warmup_uebungen=WUCD_LIB.warmup;
ANLEITUNG.erlaubte_werte.cooldown_uebungen=WUCD_LIB.cooldown;
ANLEITUNG.warmup_cooldown="OPTIONAL pro Tag: warmup:[{name,seconds}] und cooldown:[{name,seconds}]. Rein zeitbasiert (seconds 15-180), max 8 Eintraege je Block. 'name' MUSS exakt aus erlaubte_werte.warmup_uebungen bzw. cooldown_uebungen stammen, sonst wird das Programm mit einer konkreten Fehlermeldung abgelehnt.";
function wucdSan(arr){
 if(!Array.isArray(arr))return [];
 var out=[];
 arr.forEach(function(it){
  if(!it||!it.name||!WUCD_SET[String(it.name)])return;
  var sec=Math.round(+it.seconds||45);if(sec<15)sec=15;if(sec>180)sec=180;
  out.push({name:String(it.name),sec:sec});
 });
 return out.slice(0,8);
}
var wucdList=null,wucdIdx=0,wucdEnd=0,wucdTimer=null,wucdKind="";
function startWucd(kind){
 var d=dayByKey(S.day),list=kind==="wu"?(d.wu||[]):(d.cd||[]);
 if(!list.length)return;
 wucdReturnFocus=document.activeElement;
 wucdList=list;wucdIdx=0;wucdKind=kind;
 unlockAudio();requestWakeLock();
 openWucdStep();
}
function openWucdStep(){
 wucdEnd=Date.now()+wucdList[wucdIdx].sec*1000;
 renderWucd();
 clearInterval(wucdTimer);wucdTimer=setInterval(tickWucd,250);
}
function tickWucd(){
 var left=(wucdEnd-Date.now())/1000;
 if(left<=0){beep();if(navigator.vibrate)navigator.vibrate(200);nextWucd();return;}
 var el=document.getElementById("wut");if(el)el.textContent=fmtTime(left);
}
function nextWucd(){
 wucdIdx++;
 if(wucdIdx>=wucdList.length){beep();endWucd();return;}
 openWucdStep();
}
function endWucd(){
 clearInterval(wucdTimer);wucdTimer=null;wucdList=null;
 var el=document.getElementById("wucd");el.classList.remove("open");el.innerHTML="";updateSurfaceIsolation();
 if(!(S.workout&&S.workout.running))releaseWakeLock();
 if(wucdReturnFocus&&document.contains(wucdReturnFocus))wucdReturnFocus.focus();wucdReturnFocus=null;
}
function renderWucd(){
 var it=wucdList[wucdIdx],nx=wucdList[wucdIdx+1];
 var h='<button class="iconbtn" id="wucdclose" aria-label="Beenden">'+icon("close")+'</button>';
 h+='<div class="wuk">'+(wucdKind==="wu"?"Warm-up":"Cool-down")+'</div>';
 h+='<div class="wup">'+(wucdIdx+1)+' / '+wucdList.length+'</div>';
 h+='<div class="wun">'+esc(it.name)+'</div>';
 h+='<div class="wut" id="wut">'+fmtTime(it.sec)+'</div>';
 h+='<div class="wunext">'+(nx?"Danach: "+esc(nx.name):"Letzte \u00dcbung")+'</div>';
 h+='<div class="wurow"><button class="smallbtn" id="wucdplus">'+icon("plus")+' 15 s</button><button class="smallbtn go" id="wucdskip">Weiter '+icon("chevron-right")+'</button></div>';
 var el=document.getElementById("wucd");el.innerHTML=h;el.classList.add("open");updateSurfaceIsolation();focusSurface(el,"#wucdclose");
}
document.getElementById("wucd").addEventListener("click",function(e){
 var b=e.target.closest("button");if(!b)return;
 if(b.id==="wucdclose"){endWucd();return;}
 if(b.id==="wucdskip"){nextWucd();return;}
 if(b.id==="wucdplus"){wucdEnd+=15000;var el=document.getElementById("wut");if(el)el.textContent=fmtTime((wucdEnd-Date.now())/1000);return;}
});
