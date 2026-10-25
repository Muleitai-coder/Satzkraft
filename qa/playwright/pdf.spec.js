const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const productionCsp=fs.readFileSync(path.resolve(__dirname,'../../netlify.toml'),'utf8').match(/Content-Security-Policy = "([^"]+)"/)[1];
const sample=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../TESTBACKUP-AUSWERTUNG.json'),'utf8'));

test.beforeEach(async({page})=>{
 await page.route('**/index.html',async route=>{const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':productionCsp}});});
 await page.addInitScript(state=>{
  localStorage.setItem('cali-plan-v3',JSON.stringify(state));
  localStorage.setItem('satzkraft-design-update-v1','1');
  localStorage.setItem('satzkraft-backup-meta-v1',JSON.stringify({snoozeUntil:Date.now()+86400000}));
  Object.defineProperty(navigator,'canShare',{value:()=>false,configurable:true});
 },sample);
 await page.goto('/index.html');
 await expect.poll(()=>page.evaluate(()=>localWriterState)).toBe('owner');
 await page.locator('#pdf').click();
});

test('PDF-01: real summary and multi-page protocol download without window.print',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.evaluate(()=>{window.print=()=>{throw new Error('PDF must not call print');};});
 const before=await page.evaluate(()=>JSON.stringify({programs:S.programs,store:S.store}));
 for(const [surface,button] of [['report','reprint'],['protocol','protprint']]){
  if(surface==='protocol')await page.locator('#repprotocol').click();
  const expected=await page.evaluate(id=>pdfSurfaceContent(id),surface);
  expect(expected.blocks.length).toBeGreaterThan(5);
  await page.locator('#'+button).click();
  await expect(page.locator('#modal .mtitle')).toHaveText('PDF bereit');
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'PDF sichern',exact:true}).click();
  const file=await download;expect(file.suggestedFilename()).toMatch(/\.pdf$/);
  const target=testInfo.outputPath(surface+'.pdf');await file.saveAs(target);
  const bytes=fs.readFileSync(target);expect(bytes.subarray(0,5).toString()).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(5000);
  fs.writeFileSync(testInfo.outputPath(surface+'-content.json'),JSON.stringify(expected));
  await testInfo.attach(surface,{path:target,contentType:'application/pdf'});
 }
 expect(await page.evaluate(()=>JSON.stringify({programs:S.programs,store:S.store}))).toBe(before);
 expect(errors).toEqual([]);
});

test('PDF-02: missing font gives a visible error and retry recovers; share cancel stays usable',async({page})=>{
 await page.route('**/hanken-grotesk-pdf.ttf',route=>route.abort());
 await page.locator('#reprint').click();
 await expect(page.locator('#modal .mtitle')).toHaveText('PDF konnte nicht erstellt werden');
 await page.getByRole('button',{name:'OK',exact:true}).click();
 await page.unroute('**/hanken-grotesk-pdf.ttf');
 await page.evaluate(()=>{
  Object.defineProperty(navigator,'canShare',{value:()=>true,configurable:true});
  Object.defineProperty(navigator,'share',{value:async({files})=>{
   window.__sharedPdf={name:files[0].name,type:files[0].type,size:files[0].size};
   throw new DOMException('Canceled','AbortError');
  },configurable:true});
 });
 await page.locator('#reprint').click();
 await page.getByRole('button',{name:'PDF sichern',exact:true}).click();
 expect(await page.evaluate(()=>window.__sharedPdf)).toMatchObject({type:'application/pdf',name:expect.stringMatching(/\.pdf$/)});
 await expect(page.locator('#report')).toBeVisible();
 await expect(page.locator('#reprint')).toBeEnabled();
 await expect(page.locator('#modal')).toBeHidden();
});
