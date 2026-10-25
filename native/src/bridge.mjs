import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { createNativeStorage, createSingleViewLock } from './storage.mjs';

const panel = document.createElement('div');
panel.id = 'native-status'; panel.setAttribute('role','status');
const guard = document.createElement('div');
guard.id = 'native-guard'; guard.hidden = true;
guard.setAttribute('role','dialog'); guard.setAttribute('aria-modal','true');
guard.setAttribute('aria-label','Satzkraft speichern');
document.body.append(panel,guard);
let app, store, failed = false, busy = false, statusTimer, previousInert;
function showGuard(message, buttons = []) {
  const card = document.createElement('div');
  const p = document.createElement('p'); p.textContent = message; card.append(p);
  for (const [label, action] of buttons) {
    const button = document.createElement('button'); button.textContent = label;
    button.onclick = action; card.append(button);
  }
  guard.replaceChildren(card); guard.hidden = false;
  if (!previousInert) previousInert = new Map();
  for (const child of document.body.children) {
    if (child !== guard && child !== panel && !['SCRIPT','STYLE'].includes(child.tagName)) {
      if (!previousInert.has(child)) previousInert.set(child,child.inert);
      child.inert = true;
    }
  }
  card.querySelector('button')?.focus();
}
function hideGuard() {
  guard.hidden = true;
  if (previousInert) for (const [child,value] of previousInert) child.inert = value;
  previousInert = null;
}
// Runs before the core's event guards; native recovery controls always work.
for (const eventName of ['click','pointerdown','keydown','beforeinput','input','change','paste','focusout']) {
  document.addEventListener(eventName,event => {
    if (!guard.hidden && !guard.contains(event.target)) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
    if (!guard.hidden && eventName === 'keydown' && event.key === 'Tab') {
      const buttons = [...guard.querySelectorAll('button')];
      if (!buttons.length) { event.preventDefault(); return; }
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && event.target === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && event.target === last) { event.preventDefault(); first.focus(); }
    }
  },true);
}
function storageError() {
  failed = true;
  showGuard('Speichern nicht möglich. Lass die App geöffnet und sichere deine Trainingsdaten.',[
    ['Erneut speichern',async () => {
      try { await store.retry(); app?.flush(); await store.flush(); failed = false; hideGuard(); }
      catch { storageError(); }
    }],
    ['Backup sichern',async () => {
      if (app) await exportFile('satzkraft-notfall-backup.json',app.backup());
    }]
  ]);
}
function status(state) {
  clearTimeout(statusTimer);
  panel.textContent = state === 'pending' ? 'Speichert …' : state === 'saved' ? 'Gespeichert' : '';
  panel.hidden = !panel.textContent;
  if (state === 'saved') statusTimer = setTimeout(() => { panel.hidden = true; },1000);
  if (state === 'error') storageError();
}
async function withBusy(action) {
  if (busy) throw new Error('Ein Vorgang läuft bereits');
  busy = true; showGuard('Einen Moment …');
  try { return await action(); }
  finally { busy = false; if (failed) storageError(); else hideGuard(); }
}
async function exportFile(name,text,binary = false) {
  let path;
  try {
    return await withBusy(async () => {
      const safeName = String(name).replace(/[^a-zA-Z0-9äöüÄÖÜß._-]/g,'_').slice(0,120);
      // Cache names need uniqueness, not a secure-context-only UUID API.
      path = `exports/${Date.now()}-${Math.random().toString(36).slice(2)}/${safeName}`;
      const file = await Filesystem.writeFile({ path, data:text, directory:Directory.Cache, ...(binary ? {} : { encoding:Encoding.UTF8 }), recursive:true });
      // iOS Share rejects on cancellation. Only a completed handoff returns true.
      await Share.share({ title:'Satzkraft – Datei sichern', files:[file.uri], dialogTitle:'In Dateien sichern' });
      return true;
    });
  } catch { return false; }
  finally {
    if (path) await Filesystem.rmdir({ path:path.slice(0,path.lastIndexOf('/')), directory:Directory.Cache, recursive:true }).catch(() => {});
  }
}

async function start() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    throw new Error('Dieses Paket ist für die iPhone-App bestimmt.');
  }
  await Preferences.configure({ group:'Satzkraft' });
  store = await createNativeStorage({
    read:async () => (await Preferences.get({ key:'snapshot-v1' })).value,
    write:value => Preferences.set({ key:'snapshot-v1', value }), status
  });
  // Explicit file capability used by the shared export UI; storage stays native-only.
  window.SatzkraftFiles = {
    async savePdf(name, buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return exportFile(name, btoa(binary), true);
    }
  };
  window.SatzkraftNative = {
    storage:store, locks:createSingleViewLock(), exportFile, busy:withBusy,
    ownsControl:target => guard.contains(target),
    bind(core) {
      app = core;
      document.documentElement.classList.add('native-ready');
      const syncAppearance = () => {
        const light = document.documentElement.dataset.theme === 'light';
        SystemBars.setStyle({ style:light ? SystemBarsStyle.Light : SystemBarsStyle.Dark }).catch(() => {});
        Keyboard.setStyle({ style:light ? 'LIGHT' : 'DARK' }).catch(() => {});
      };
      syncAppearance();
      new MutationObserver(syncAppearance).observe(document.documentElement,{ attributes:true, attributeFilter:['data-theme'] });
      App.addListener('appStateChange',async ({ isActive }) => {
        if (!isActive) { app.flush(); try { await store.flush(); } catch { /* recovery is visible on return */ } }
      }).catch(storageError);
      Keyboard.setAccessoryBarVisible({ isVisible:true }).catch(() => {});
      Keyboard.addListener('keyboardDidShow',() => {
        const field = document.activeElement;
        if (field?.matches('input,textarea')) field.scrollIntoView({ block:'center', behavior:'smooth' });
      }).catch(() => {});
    }
  };
  const script = document.createElement('script'); script.src = 'native-app.js';
  script.onerror = () => showGuard('Die App konnte nicht gestartet werden. Bitte die App erneut aus Xcode installieren.');
  document.body.append(script);
}
start().catch(() => {
  showGuard('Satzkraft konnte den lokalen Speicher nicht öffnen. Deine gespeicherten Daten werden nicht überschrieben. Starte die App erneut; lösche sie nicht.',[
    ['Erneut öffnen',() => location.reload()]
  ]);
});
