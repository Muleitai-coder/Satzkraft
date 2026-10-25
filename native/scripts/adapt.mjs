import { parse } from 'acorn';
import { fullAncestor } from 'acorn-walk';

// Native capability adaptation happens on parsed JS, not text replacement of
// application data. Generated files remain inspectable. The web build is intact.
export function adaptApp(source, overrides) {
  const parseJS = text => parse(text, { ecmaVersion: 'latest' });
  const replacements = new Map();
  for (const node of parseJS(overrides).body) {
    if (node.type === 'FunctionDeclaration') replacements.set(node.id.name, overrides.slice(node.start, node.end));
  }
  const edits = [];
  for (const node of parseJS(source).body) {
    if (node.type === 'FunctionDeclaration' && replacements.has(node.id.name)) {
      edits.push({ start: node.start, end: node.end, text: replacements.get(node.id.name) });
      replacements.delete(node.id.name);
    }
  }
  // The browser currently names this helper requestPersistentStorageOnce.
  if (replacements.size) throw new Error(`Native hooks missing: ${[...replacements.keys()]}`);
  source = applyEdits(source, edits);
  const tree = parseJS(source), changes = [], functions = new Set();
  const asyncCalls = new Set(['downloadText', 'downloadFullBackup', 'clearLocalAppData', 'handleBackupReminder', 'replaceRecoveredState']);
  fullAncestor(tree, (node, state, ancestors) => {
    if (node.type === 'Identifier' && node.name === 'localStorage') {
      changes.push({ start: node.start, end: node.end, text: 'window.SatzkraftNative.storage' });
    }
    if (node.type === 'MemberExpression' && node.object.name === 'navigator' && node.property.name === 'locks') {
      changes.push({ start: node.start, end: node.end, text: 'window.SatzkraftNative.locks' });
    }
    if (node.type !== 'CallExpression' || !asyncCalls.has(node.callee.name)) return;
    const parent = ancestors.at(-2);
    const fn = ancestors.slice(0,-1).reverse().find(n => /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n.type));
    if (!fn) throw new Error('Native async operation outside function');
    if (!fn.async) functions.add(fn);
    if (parent?.type !== 'AwaitExpression') {
      changes.push({ start: node.start, end: node.start, text: '(await ' });
      changes.push({ start: node.end, end: node.end, text: ')' });
    }
  });
  for (const fn of functions) changes.push({ start: fn.start, end: fn.start, text: 'async ' });
  source = applyEdits(source, changes);
  const worker = 'if("serviceWorker" in navigator){';
  if (source.split(worker).length !== 2) throw new Error('Service-worker hook changed');
  source = source.replace(worker, 'if(false){ /* Native assets are bundled. */');
  source = source.replace('im lokalen Browserspeicher dieses Geräts', 'im lokalen App-Speicher dieses iPhones')
    .replace('beim Löschen der Browserdaten verloren gehen', 'beim Löschen der App verloren gehen')
    .replace('Der lokale Browserspeicher wird', 'Der lokale App-Speicher wird');
  // Native overlay buttons remain usable if a storage error blocked the core UI.
  if (source.split('if(notice.contains(target)){').length !== 2) throw new Error('Native recovery hook changed');
  source = source.replace('if(notice.contains(target)){', 'if(window.SatzkraftNative.ownsControl(target))return;\n if(notice.contains(target)){');
  source += '\nwindow.SatzkraftNative.bind({ flush: flushSave, backup: backupJSON });\n';
  parseJS(source);
  // Every transformed asynchronous call must be awaited, including recovery.
  fullAncestor(parseJS(source), (node, state, ancestors) => {
    if (node.type !== 'CallExpression' || !asyncCalls.has(node.callee.name)) return;
    if (ancestors.at(-2)?.type !== 'AwaitExpression') throw new Error(`Unawaited native call: ${node.callee.name}`);
    if (node.callee.name === 'downloadText' && node.arguments.length !== 2) throw new Error('Unexpected export contract');
  });
  return source;
}

function applyEdits(text, edits) {
  for (const edit of edits.sort((a,b) => b.start-a.start || b.end-a.end)) {
    text = text.slice(0,edit.start)+edit.text+text.slice(edit.end);
  }
  return text;
}
