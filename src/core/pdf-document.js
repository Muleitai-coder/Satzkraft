// Pure layout: formatted report values arrive from the existing report surface.
// PDF encoding/font subsetting is delegated to the pinned jsPDF implementation.
function createReportPdf(Pdf, fontBase64, content) {
 var pdf = new Pdf({unit:"pt",format:"a4",compress:true,putOnlyUsedFonts:true});
 pdf.addFileToVFS("HankenGrotesk.ttf",fontBase64);
 pdf.addFont("HankenGrotesk.ttf","HankenGrotesk","normal");
 pdf.setFont("HankenGrotesk","normal");
 pdf.setProperties({title:content.title+" – "+content.kind,author:"Satzkraft",creator:"Satzkraft"});
 var palette=content.palette;
 var margin=44,width=pdf.internal.pageSize.getWidth(),height=pdf.internal.pageSize.getHeight(),y=margin;
 function newPage(){pdf.addPage();y=margin;}
 function text(value,size,color,after){
  pdf.setFontSize(size);pdf.setTextColor.apply(pdf,color);
  var lines=pdf.splitTextToSize(String(value||""),width-2*margin),lineHeight=size*1.4;
  lines.forEach(function(line){
   if(y+lineHeight>height-margin-20)newPage();
   pdf.text(line,margin,y+size);y+=lineHeight;
  });
  y+=after||0;
 }
 text("SATZKRAFT · "+content.kind.toUpperCase(),10,palette.accent,12);
 text(content.title,22,palette.ink,8);
 text(content.subtitle,9,palette.muted,18);
 content.blocks.forEach(function(block){
  if(y+70>height-margin-20)newPage();
  if(block.heading)text(block.heading,block.section?15:12,palette.accent,6);
  (block.lines||[]).forEach(function(line){text(line,10,palette.ink,4);});
  y+=10;
 });
 var pages=pdf.getNumberOfPages();
 for(var page=1;page<=pages;page++){
  pdf.setPage(page);pdf.setFontSize(8);pdf.setTextColor.apply(pdf,palette.muted);
  pdf.text("Satzkraft · "+content.kind,margin,height-25);
  pdf.text(page+" / "+pages,width-margin,height-25,{align:"right"});
 }
 return pdf.output("arraybuffer");
}
if(typeof module!=="undefined"&&module.exports)module.exports={createReportPdf:createReportPdf};
