import backupPolicy from '../../src/core/backup-policy.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { parse } from 'acorn';
import { createNativeStorage, createSingleViewLock } from '../src/storage.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
test('Native checkpoints serialize writes and include edits made while saving',async () => {
  const writes = [], releases = [], states = [];
  const store = await createNativeStorage({ read:async()=>null, write:value => new Promise(resolve=>{writes.push(value);releases.push(resolve);}), status:s=>states.push(s) });
  store.setItem('cali-plan-v3','one'); await tick();
  store.setItem('cali-plan-v3','two'); store.setItem('theme','dark');
  assert.equal(writes.length,1); releases.shift()(); await tick();
  assert.equal(writes.length,2); assert.equal(states.at(-1),'pending');
  const done = store.flush(); releases.shift()(); await done;
  assert.equal(states.at(-1),'saved');
  const loaded = await createNativeStorage({ read:async()=>writes.at(-1),write:async()=>assert.fail('no bootstrap write') });
  assert.equal(loaded.getItem('cali-plan-v3'),'two'); assert.equal(loaded.getItem('theme'),'dark');
});
test('Unreadable native storage blocks bootstrap without overwriting',async () => {
  for (const value of ['broken','{}','{"version":1,"values":42}','{"version":1,"values":{"key":7}}']) {
    await assert.rejects(createNativeStorage({read:async()=>value,write:async()=>assert.fail('must not write')}));
  }
  await assert.rejects(createNativeStorage({read:async()=>{throw new Error('locked');},write:async()=>assert.fail('must not write')}),/locked/);
});
test('Failed save remains pending and can be retried without losing the draft',async () => {
  let fail=true, disk=null; const states=[];
  const store=await createNativeStorage({read:async()=>null,write:async v=>{if(fail)throw new Error('full');disk=v;},status:s=>states.push(s)});
  store.setItem('cali-plan-v3','draft'); await assert.rejects(store.flush(),/full/);
  assert.equal(store.getItem('cali-plan-v3'),'draft'); assert.equal(states.at(-1),'error');
  assert.throws(()=>store.setItem('cali-plan-v3','other'),/full/);
  fail=false; await store.retry(); assert.equal(JSON.parse(disk).values['cali-plan-v3'],'draft');
});
test('Failed restore leaves working data untouched; confirmed delete survives restart',async () => {
  let fail=false,disk=JSON.stringify({version:1,values:{'cali-plan-v3':'old',theme:'dark'}});
  const store=await createNativeStorage({read:async()=>disk,write:async v=>{if(fail)throw new Error('full');disk=v;}});
  fail=true; await assert.rejects(store.commit({'cali-plan-v3':'restore'}),/full/);
  assert.equal(store.getItem('cali-plan-v3'),'old');
  fail=false; await store.commit({'satzkraft-reset-v1':'deleted'});
  const loaded=await createNativeStorage({read:async()=>disk,write:async()=>{}});
  assert.equal(loaded.getItem('cali-plan-v3'),null); assert.equal(loaded.getItem('theme'),null);
});
test('Native single-view lock denies concurrent ownership',async () => {
  const locks=createSingleViewLock();let release;
  const first=locks.request('writer',{},lock=>{assert.ok(lock);return new Promise(r=>release=r);});
  await locks.request('writer',{},lock=>assert.equal(lock,null)); release();await first;
  await locks.request('writer',{},lock=>assert.ok(lock));
});

const app = await readFile(new URL('../www/native-app.js',import.meta.url),'utf8');
const functions = parse(app,{ecmaVersion:'latest'}).body.filter(n=>n.type==='FunctionDeclaration');
function functionSource(name){const fn=functions.find(n=>n.id.name===name);assert.ok(fn,name);return app.slice(fn.start,fn.end);}
test('Native backup waits for sharing and does not record cancellation as success',async () => {
  let complete, meta=0;
  const ctx=vm.createContext({...backupPolicy,Date,downloadText:()=>new Promise(r=>complete=r),backupDatePart:()=> '2026-10-22',backupJSON:()=> '{}',totalCompletedTrainings:()=>1,writeBackupMeta:()=>meta++});
  vm.runInContext(functionSource('downloadFullBackup'),ctx);
  const canceled=ctx.downloadFullBackup('backup');assert.equal(meta,0);complete(false);assert.equal(await canceled,false);assert.equal(meta,0);
  const success=ctx.downloadFullBackup('backup');assert.equal(meta,0);complete(true);assert.equal(await success,true);assert.equal(meta,1);
});
test('Canceled safety backup never commits an imported state',async () => {
  let actions, committed=0;
  const ctx=vm.createContext({localWriteBlocked:()=>false,programWriteLocked:()=>false,showModal:(t,m,a)=>actions=a,downloadFullBackup:async()=>false,window:{SatzkraftNative:{storage:{commit:()=>committed++}}}});
  vm.runInContext(functionSource('confirmBackupRestore'),ctx);
  ctx.confirmBackupRestore({});await actions[0].action();assert.equal(committed,0);
});
test('Native artifact bundles resources, has no remote server and keeps Safari storage separate',async () => {
  const config=JSON.parse(await readFile(new URL('../capacitor.config.json',import.meta.url),'utf8'));
  assert.equal(config.server,undefined);assert.equal(config.webDir,'www');
  assert.doesNotMatch(app,/\blocalStorage\b/);assert.match(app,/SatzkraftNative\.storage/);
  assert.match(app,/if\(false\)\{ \/\* Native assets are bundled/);
  const web=await readFile(new URL('../../index.html',import.meta.url),'utf8');
  assert.match(web,/if\("serviceWorker" in navigator\)/);assert.doesNotMatch(web,/SatzkraftNative/);
  const plist=await readFile(new URL('../ios/App/App/Info.plist',import.meta.url),'utf8');
  assert.match(plist,/<key>UIApplicationSupportsMultipleScenes<\/key>\s*<false\/>/);
});
