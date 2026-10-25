const { test, expect } = require('@playwright/test');
const { createStaticServer } = require('./static-server.cjs');
const fs = require('node:fs');
const path = require('node:path');
let server, origin;
test.beforeAll(async () => {
  server=createStaticServer();
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  origin=`http://127.0.0.1:${server.address().port}/native/www/`;
});
test.afterAll(async()=>{if(server)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});});

// Native plugins are deliberate test doubles. This checks the generated JS/DOM
// adapter, not UIKit, Apple signing, UserDefaults persistence or an iOS keyboard.
test('NATIVE-01: iPhone package – touch, storage, canceled sharing, recovery and restore',async({page,context})=>{
  test.setTimeout(120000);
  let disk=null, failWrites=false, shareCount=0, finishShare, lastFileOptions;
  const files=new Map(), errors=[], systemStyles=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.exposeBinding('qaNative',async(source,plugin,method,options)=>{
    if(plugin==='SystemBars'){systemStyles.push(options.style);return{};}
    if(plugin==='Preferences'){
      if(method==='get')return{value:disk};
      if(method==='set'){if(failWrites)throw new Error('disk full');disk=options.value;}
      return{};
    }
    if(plugin==='Filesystem'){
      if(method==='writeFile'){lastFileOptions=options;files.set(options.path,options.data);return{uri:'file:///cache/'+options.path};}
      if(method==='rmdir'){for(const key of files.keys())if(key.startsWith(options.path+'/'))files.delete(key);}
      return{};
    }
    if(plugin==='Share'){
      shareCount++;
      return new Promise((resolve,reject)=>{finishShare=ok=>ok?resolve({activityType:'saveToFiles'}):reject(new Error('Share canceled'));});
    }
    return{};
  });
  await context.addInitScript(()=>{
    window.CapacitorCustomPlatform={name:'ios'};
    const methods={SystemBars:['setStyle'],Preferences:['configure','get','set'],Filesystem:['writeFile','rmdir'],Share:['share'],Keyboard:['setStyle','setAccessoryBarVisible','addListener','removeListener'],App:['addListener','removeListener']};
    window.Capacitor={
      PluginHeaders:Object.entries(methods).map(([name,entries])=>({name,methods:entries.map(name=>({name,rtype:name==='addListener'?'callback':'promise'}))})),
      nativePromise:(plugin,method,options)=>window.qaNative(plugin,method,options),
      nativeCallback:()=> 'test-listener'
    };
    localStorage.setItem('cali-plan-v3','browser-only-data');
  });
  await page.goto(origin);
  await expect.poll(()=>page.evaluate(()=>typeof localWriterState==='undefined'?'pending':localWriterState)).toBe('owner');
  await expect(page.locator('#startw')).toBeVisible();
  await page.locator('#startw').tap();
  const reps=page.locator('input[id^="rep-"]').first();
  await reps.scrollIntoViewIfNeeded(); await reps.tap(); await reps.fill('8'); await reps.blur();
  await page.evaluate(async()=>{flushSave();await SatzkraftNative.storage.flush();});
  const before=JSON.parse(disk).values['cali-plan-v3'];
  expect(JSON.stringify(JSON.parse(before).store)).toContain('"reps":"8"');
  expect(await page.evaluate(()=>localStorage.getItem('cali-plan-v3'))).toBe('browser-only-data');
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>typeof localWriterState==='undefined'?'pending':localWriterState)).toBe('owner');
  expect(await page.evaluate(()=>JSON.stringify(S.logs))).toContain('"reps":"8"');
  // End the paused workout to make restore available.
  await page.locator('#stopw').tap();
  await page.getByRole('button',{name:'Speichern & später fortsetzen',exact:true}).tap();
  await page.locator('#settingsbtn').tap();
  await page.locator('[data-settheme="light"]').tap();
  await expect.poll(()=>systemStyles.at(-1)).toBe('LIGHT');
  await page.locator('[data-settings-backup]').tap();
  await expect.poll(()=>shareCount).toBe(1);
  expect(await page.evaluate(()=>readBackupMeta().lastAt)).toBe(0);
  expect(files.size).toBe(1);finishShare(false);
  await expect(page.locator('#modal')).toContainText('Backup fehlgeschlagen');
  expect(await page.evaluate(()=>readBackupMeta().lastAt)).toBe(0);
  await page.getByRole('button',{name:'OK',exact:true}).tap();
  await page.locator('#settingsbtn').tap();
  await page.locator('[data-settings-backup]').tap();
  await expect.poll(()=>shareCount).toBe(2);
  const backup=[...files.values()][0];expect(JSON.parse(backup).schemaVersion).toBe(5);
  finishShare(true);
  await expect.poll(()=>page.evaluate(()=>readBackupMeta().lastAt)).toBeGreaterThan(0);
  await expect.poll(()=>files.size).toBe(0);
  await page.getByRole('button',{name:'Fertig',exact:true}).tap();
  // Inject a native disk failure, then recover through the real error overlay.
  failWrites=true;
  await page.evaluate(()=>SatzkraftNative.storage.setItem('training-theme-v1','dark'));
  await expect(page.locator('#native-guard')).toContainText('Speichern nicht möglich');
  failWrites=false;
  await page.getByRole('button',{name:'Erneut speichern',exact:true}).tap();
  await expect(page.locator('#native-guard')).toBeHidden();
  await page.locator('#libbtn').tap();
  // Exercise the shared import validation and native confirmation flow. The
  // real iOS document picker is deliberately left to physical acceptance.
  await page.evaluate(text=>importBackup(text),backup);
  await page.getByRole('button',{name:'Sichern & wiederherstellen',exact:true}).tap();
  await expect.poll(()=>shareCount).toBe(3);
  finishShare(false);
  await expect(page.locator('#native-guard')).toBeHidden();
  const preserved=JSON.parse(disk).values['cali-plan-v3'];
  expect(preserved).toBe(await page.evaluate(()=>SatzkraftNative.storage.getItem(KEY)));
  await page.evaluate(text=>importBackup(text),backup);
  await page.getByRole('button',{name:'Sichern & wiederherstellen',exact:true}).tap();
  await expect.poll(()=>shareCount).toBe(4);finishShare(true);
  await Promise.all([
    page.waitForEvent('load'),
    page.getByRole('button',{name:'Datei geprüft – wiederherstellen',exact:true}).tap()
  ]);
  await expect.poll(()=>page.evaluate(()=>typeof localWriterState==='undefined'?'pending':localWriterState)).toBe('owner');
  expect(JSON.parse(JSON.parse(disk).values['cali-plan-v3']).programs).toEqual(JSON.parse(backup).programs);
  expect(await page.evaluate(()=>S.programs)).toEqual(JSON.parse(backup).programs);
  await page.locator('#pdf').tap();
  await page.locator('#reprint').tap();
  await expect(page.getByRole('button',{name:'Drucken',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'PDF sichern',exact:true}).tap();
  await expect.poll(()=>shareCount).toBe(5);
  expect(lastFileOptions.encoding).toBeUndefined(); // Base64 bytes, never UTF-8 text.
  expect(Buffer.from([...files.values()][0],'base64').subarray(0,5).toString()).toBe('%PDF-');
  finishShare(true);
  await expect.poll(()=>files.size).toBe(0);
  await expect(page.locator('#native-guard')).toBeHidden();
  expect(errors).toEqual([]);
  fs.mkdirSync(path.resolve(__dirname,'test-results'),{recursive:true});
  await page.screenshot({path:path.resolve(__dirname,'test-results/native-iphone.png'),scale:'css'});
});
