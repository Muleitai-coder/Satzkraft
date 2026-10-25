// ---------- Wake Lock & Benachrichtigung ----------
var wakeLock=null;
function requestWakeLock(){
 try{
  if(!navigator.wakeLock||wakeLock)return;
  navigator.wakeLock.request("screen").then(function(wl){if(localWriteBlocked()){wl.release();return;}wakeLock=wl;wl.addEventListener("release",function(){wakeLock=null;});}).catch(function(){});
 }catch(e){}
}
function releaseWakeLock(){try{if(wakeLock){wakeLock.release();wakeLock=null;}}catch(e){}}
document.addEventListener("visibilitychange",function(){
 if(!localWriteBlocked()&&document.visibilityState==="visible"&&S.workout&&S.workout.running)requestWakeLock();
});
function askNotifyPermission(){try{if(window.Notification&&Notification.permission==="default")Notification.requestPermission();}catch(e){}}
function notifyRestDone(){
 try{
  if(document.visibilityState==="visible")return;
  if(!window.Notification||Notification.permission!=="granted"||!navigator.serviceWorker)return;
  navigator.serviceWorker.ready.then(function(reg){
   reg.showNotification("Pause beendet",{body:(restExerciseName?restExerciseName+" – ":"")+"nächster Satz",tag:"rest-timer",vibrate:[400,150,400,150,700]});
  }).catch(function(){});
 }catch(e){}
}
