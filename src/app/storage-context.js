var KEY="cali-plan-v3";
var DATA_SCHEMA_VERSION=5;
var THEME_KEY="training-theme-v1";
var BACKUP_META_KEY="satzkraft-backup-meta-v1";
var PERSIST_REQUEST_KEY="satzkraft-storage-persist-v1";
var REDESIGN_NOTICE_KEY="satzkraft-design-update-v1";
var RESET_GENERATION_KEY="satzkraft-reset-v1";
var localResetGeneration="";
var localDataDeletionPending=false;
var localWriterState="pending",localWriterRelease=null,localWriterRequest=0,localStoredSnapshot=null,localWriterDirty=false,localWriterDraftSecured=false;
var localWriterCompletion=Promise.resolve();
try{localResetGeneration=localStorage.getItem(RESET_GENERATION_KEY)||"";}catch(e){}
function localWriteBlocked(){
 if(localDataDeletionPending)return true;
 if(typeof loadIssueText!=="undefined"&&loadIssueText){if(localWriterState==="owner")blockLocalWriter("recovery");return true;}
 if(typeof localWriterState!=="undefined"&&localWriterState!=="owner")return true;
 try{
  if((localStorage.getItem(RESET_GENERATION_KEY)||"")!==localResetGeneration){if(typeof localWriterState!=="undefined")blockLocalWriter("conflict");return true;}
  if(typeof localWriterState!=="undefined"&&localStorage.getItem(KEY)!==localStoredSnapshot){blockLocalWriter("conflict");return true;}
  return false;
 }catch(e){if(typeof localWriterState!=="undefined")blockLocalWriter("unavailable");return true;}
}
function currentTheme(){return document.documentElement.dataset.theme==="light"?"light":"dark";}
function applyTheme(theme,persist){
 theme=theme==="light"?"light":"dark";
 document.documentElement.dataset.theme=theme;
 var meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=theme==="light"?"#efece5":"#0a0b0d";
 if(persist&&!localWriteBlocked()){try{localStorage.setItem(THEME_KEY,theme);}catch(e){}}
}
applyTheme(currentTheme(),false);
document.title="Satzkraft · v"+APP_VERSION;
function clone(o){return JSON.parse(JSON.stringify(o));}
function round(x){return Math.round(x*2)/2;}
var SET_REP_MAX=9999,SET_TIME_MAX_SECONDS=5999,SET_WEIGHT_MAX=2000;
function sanInt(v,max){var raw=String(v==null?"":v);if(/^\s*-/.test(raw))return"0";var digits=raw.replace(/[^0-9]/g,"").slice(0,4);if(!digits)return"";var limit=max==null?SET_REP_MAX:max;return String(Math.min(Number(digits),limit));}
function sanDec(v){var raw=String(v==null?"":v);if(/^\s*-/.test(raw))return"0";var clean=raw.replace(",",".").replace(/[^0-9.]/g,"").replace(/(\..*)\./g,"$1"),dot=clean.indexOf("."),whole=(dot>=0?clean.slice(0,dot):clean).slice(0,4),fraction=dot>=0?clean.slice(dot+1).slice(0,1):"",out=whole+(dot>=0?"."+fraction:"");if(dot===0)out="0."+fraction;if(Number(out)>SET_WEIGHT_MAX)out=String(SET_WEIGHT_MAX);return out;}
function fmtTime(s){s=Math.max(0,Math.round(s));var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;function p(n){return n<10?"0"+n:""+n;}return h>0?h+":"+p(m)+":"+p(ss):m+":"+p(ss);}
function fmtSeconds(s){s=Math.max(0,Math.round(Number(s)||0));return fmtTime(s)+" min";}
function fmtSecondsRange(min,max){min=Math.max(0,Math.round(Number(min)||0));max=Math.max(0,Math.round(Number(max)||0));if(min===max)return fmtSeconds(min);return fmtTime(min)+"–"+fmtTime(max)+" min";}
function dDate(ts){return new Date(ts).toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"});}
function dClock(ts){return new Date(ts).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function attr(s){return esc(s).replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function icon(name){
 var paths={play:'<path d="M8 5l11 7-11 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',stop:'<rect x="6" y="6" width="12" height="12" rx="1"/>',timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M9 2h6"/>',plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="M5 12l4 4 10-10"/>',close:'<path d="M6 6l12 12M18 6L6 18"/>',info:'<path fill="currentColor" stroke="none" d="M10.7 10h2.6v8h-2.6zM12 5.2a1.55 1.55 0 1 1 0 3.1 1.55 1.55 0 0 1 0-3.1z"/>',lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',"chevron-left":'<path d="M15 5l-7 7 7 7"/>',"chevron-right":'<path d="M9 5l7 7-7 7"/>',undo:'<path d="M9 7H5V3M5 7c2-3 5-4 8-3 4 1 7 5 6 9s-5 7-9 6c-2 0-4-2-5-4"/>',edit:'<path d="M4 20l4-1 11-11-3-3L5 16zM14 7l3 3"/>',external:'<path d="M14 5h5v5M11 13l8-8M19 13v6H5V5h6"/>',download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',sparkle:'<path d="M12 3l1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4zM18 15l.7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7z"/>',more:'<circle cx="12" cy="5" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.7" fill="currentColor" stroke="none"/>',reorder:'<path d="M8 5v14M8 19l-3-3M8 19l3-3M16 19V5M16 5l-3 3M16 5l3 3"/>',share:'<path d="M12 15V4M12 4L8 8M12 4l4 4M5 12v8h14v-8"/>',gear:'<path d="M10.5 3h3l.5 2.3a7 7 0 0 1 2 1.2l2.2-.8 1.5 2.6-1.7 1.6a7 7 0 0 1 0 2.2l1.7 1.6-1.5 2.6-2.2-.8a7 7 0 0 1-2 1.2l-.5 2.3h-3l-.5-2.3a7 7 0 0 1-2-1.2l-2.2.8-1.5-2.6 1.7-1.6a7 7 0 0 1 0-2.2L4.3 8.3l1.5-2.6 2.2.8a7 7 0 0 1 2-1.2z"/><circle cx="12" cy="12" r="2.7"/>'};
 return'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||"")+'</svg>';
}
