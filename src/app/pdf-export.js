// One export path for Web/PWA and iOS. No server or print-dialog dependency.
var pdfResourcesPromise=null;
function loadPdfResources(){
 if(pdfResourcesPromise)return pdfResourcesPromise;
 pdfResourcesPromise=Promise.all([
  new Promise(function(resolve,reject){
   if(window.jspdf){resolve(window.jspdf.jsPDF);return;}
   var script=document.createElement("script");script.src="vendor/jspdf.umd.min.js";
   script.onload=function(){if(window.jspdf)resolve(window.jspdf.jsPDF);else reject(new Error("PDF-Bibliothek fehlt"));};
   script.onerror=function(){script.remove();reject(new Error("PDF-Bibliothek nicht verfügbar"));};
   document.head.appendChild(script);
  }),
  fetch("fonts/hanken-grotesk-pdf.ttf").then(function(response){if(!response.ok)throw new Error("PDF-Schrift nicht verfügbar");return response.arrayBuffer();}).then(function(buffer){
   var bytes=new Uint8Array(buffer),binary="";
   for(var i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
   return btoa(binary);
  })
 ]).catch(function(error){pdfResourcesPromise=null;throw error;});
 return pdfResourcesPromise;
}
function pdfSurfaceContent(surfaceId){
 var surface=document.getElementById(surfaceId),protocol=surfaceId==="protocol";
 if(!surface||!surface.classList.contains("open"))throw new Error("Auswertung ist nicht geöffnet");
 function text(node,selector){var found=selector?node.querySelector(selector):node;return found?found.textContent.trim():"";}
 var style=getComputedStyle(document.documentElement),palette={};
 ["ink","muted","accent"].forEach(function(role){var value=style.getPropertyValue("--pdf-"+role).trim();palette[role]=[1,3,5].map(function(offset){return parseInt(value.slice(offset,offset+2),16);});});
 var content={palette:palette,title:text(surface,"h1"),kind:protocol?"Trainingsprotokoll":"Auswertung",subtitle:text(surface,".rstand"),blocks:[]};
 if(protocol){
  Array.prototype.forEach.call(surface.querySelectorAll(".rwk,.rd3,.rtbl,.rempty"),function(node){
   if(node.matches(".rtbl")){
    Array.prototype.forEach.call(node.querySelectorAll("tbody tr"),function(row){
     var cells=row.querySelectorAll("td"),name=cells[0].cloneNode(true);
     Array.prototype.forEach.call(name.querySelectorAll(".rprotocolnote"),function(note){note.remove();});
     var notes=Array.prototype.map.call(cells[0].querySelectorAll(".rprotocolnote"),function(note){return text(note);});
     content.blocks.push({heading:text(name),lines:["Sätze: "+text(cells[1]),"Volumen: "+text(cells[2])].concat(notes)});
    });
   }else content.blocks.push({heading:text(node),section:true,lines:[]});
  });
 }else{
  Array.prototype.forEach.call(surface.querySelectorAll(".rmetric"),function(node){content.blocks.push({heading:text(node,".rlab")+": "+text(node,".rval"),lines:[text(node,".rsub")]});});
  content.blocks.push({heading:"Fortschritt je Übung",section:true,lines:[]});
  Array.prototype.forEach.call(surface.querySelectorAll(".rexcard"),function(card){
   var lines=[text(card,".rexcat")],from=text(card,".rfrom"),to=text(card,".rto");
   if(from||to)lines.push("Erste Ausführung: "+from+" · Zuletzt: "+to);
   [".rexpill",".rexdelta",".rexrecorded",".rexbest",".rexprevious"].forEach(function(selector){var value=text(card,selector);if(value)lines.push(value);});
   content.blocks.push({heading:text(card,".rexname"),lines:lines});
  });
  var empty=text(surface,".rempty");if(empty)content.blocks.push({lines:[empty]});
  content.blocks.push({lines:[text(surface,".rfootnote")]});
 }
 return content;
}
function pdfFileName(title,kind){return ("Satzkraft-"+title+"-"+kind).replace(/[\\/:*?"<>|\u0000-\u001f]/g,"_").slice(0,150)+".pdf";}
async function savePdfFile(name,buffer){
 if(window.SatzkraftFiles){
  if(!await window.SatzkraftFiles.savePdf(name,buffer))throw new Error("Dateifreigabe nicht abgeschlossen");
  return;
 }
 var file=new File([buffer],name,{type:"application/pdf"});
 if(navigator.canShare&&navigator.canShare({files:[file]})){
  await navigator.share({files:[file],title:name});return;
 }
 var url=URL.createObjectURL(file),link=document.createElement("a");
 link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
 // Safari may read the URL after the click returns. Do not revoke immediately.
 setTimeout(function(){URL.revokeObjectURL(url);},60000);
}
async function openPdfExport(surfaceId){
 var button=document.getElementById(surfaceId==="protocol"?"protprint":"reprint");
 if(button&&button.disabled)return;
 if(button)button.disabled=true;
 try{
  var content=pdfSurfaceContent(surfaceId),resources=await loadPdfResources();
  var buffer=createReportPdf(resources[0],resources[1],content),name=pdfFileName(content.title,content.kind);
  var actions=[
   {label:"PDF sichern",cls:"primary",action:async function(){
    try{await savePdfFile(name,buffer);}catch(error){if(error.name!=="AbortError")showModal("PDF nicht gesichert","Die Dateifreigabe wurde nicht abgeschlossen. Du kannst den Export erneut öffnen und die Datei sichern.",[{label:"OK",action:null}]);}
   }},
  ];
  if(!window.SatzkraftFiles)actions.push({label:"Drucken",action:function(){if(surfaceId==="protocol")printProtocol();else printReport();}});
  actions.push({label:"Schließen",action:null});
  showModal("PDF bereit","Die PDF wurde auf deinem Gerät erstellt. Wähle im Teilen-Menü „In Dateien sichern“ oder speichere den Download.",actions);
 }catch(error){
  showModal("PDF konnte nicht erstellt werden","Bitte öffne die Auswertung erneut und versuche es noch einmal. Falls die App-Dateien fehlen, öffne Satzkraft einmal mit Internetverbindung.",[{label:"OK",action:null}]);
 }finally{if(button)button.disabled=false;}
}
