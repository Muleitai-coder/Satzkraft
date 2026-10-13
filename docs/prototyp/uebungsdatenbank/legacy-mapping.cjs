'use strict';

const { normalizeName, validateCatalog } = require('./contract.cjs');
const clone = value => structuredClone(value);

function legacyTracking(source, representation) {
  const errors = [];
  const fail = message => errors.push(message);
  if (!source || typeof source !== 'object' || Array.isArray(source)) return { errors: ['Kein Übungsobjekt.'] };
  for (const field of ['distance', 'distanceMeters', 'pace', 'leftSets', 'rightSets']) if (source[field] !== undefined) fail(`${field} ist im ersten Prototyp nicht darstellbar.`);
  let metric, loadMode, perSide;
  if (representation === 'library') {
    if (!['gewicht', 'kgz', 'koerpergewicht', 'zeit'].includes(source.typ)) fail('Unbekannter Bibliothekstyp.');
    for (const field of ['weightedTime', 'einseitig']) if (source[field] !== undefined && typeof source[field] !== 'boolean') fail(`${field} muss boolesch sein.`);
    if (source.weightedTime === true && source.typ !== 'zeit') fail('weightedTime widerspricht dem Bibliothekstyp.');
    metric = source.typ === 'zeit' ? 'seconds' : 'reps';
    loadMode = source.weightedTime === true || source.typ === 'gewicht' ? 'external' : source.typ === 'kgz' ? 'added' : 'none';
    perSide = source.einseitig;
  } else if (['external', 'internal'].includes(representation)) {
    const weightedKey = representation === 'external' ? 'weighted' : 'w';
    const addedKey = representation === 'external' ? 'bodyweight' : 'bw';
    const timerKey = representation === 'external' ? 'timerMode' : 'tmode';
    for (const field of [weightedKey, addedKey, 'perSide']) if (source[field] !== undefined && typeof source[field] !== 'boolean') fail(`${field} muss boolesch sein.`);
    if (source.unit !== undefined && !['reps', 'seconds', 'time'].includes(source.unit)) fail('Nicht darstellbare Einheit.');
    if (source[timerKey] !== undefined && !['target', 'max'].includes(source[timerKey])) fail('Unbekannter Timermodus.');
    if (source[timerKey] && source.unit === 'reps') fail('Timermodus widerspricht Wiederholungen.');
    if (source[addedKey] === true && source[weightedKey] !== true) fail('Zusatzgewicht ohne Gewichtserfassung.');
    metric = ['seconds', 'time'].includes(source.unit) || source[timerKey] ? 'seconds' : 'reps';
    loadMode = source[weightedKey] === true ? source[addedKey] === true ? 'added' : 'external' : 'none';
    perSide = source.perSide;
  } else fail('Unbekannte Quellstruktur.');
  return { errors, metric, loadMode, perSide };
}

function createLegacyResolver(catalog) {
  if (!validateCatalog(catalog).valid) throw new Error('Ungültiger Prototypkatalog.');
  // Eigene Kopie: Änderungen des Aufrufers dürfen den aufgelösten Vertrag nicht verändern.
  const exercises = clone(catalog.exercises), byId = new Map(), byName = new Map();
  for (const ex of exercises) {
    byId.set(ex.id, ex);
    for (const name of [ex.name.de, ex.name.en, ...ex.aliases]) {
      const key = normalizeName(name);
      if (!byName.has(key)) byName.set(key, new Set());
      byName.get(key).add(ex.id);
    }
  }
  return function resolve(source, representation) {
    const raw = clone(source);
    const result = (status, reasons, extra = {}) => ({ status, reasons, legacy: raw, ...extra });
    const tracking = legacyTracking(source, representation);
    if (tracking.errors.length) return result('nicht_darstellbar', tracking.errors);
    const name = representation === 'library' ? source.de : source.name;
    const candidates = [...(byName.get(normalizeName(name)) || [])];
    let ex;
    if (source.exerciseId !== undefined) {
      ex = byId.get(source.exerciseId);
      if (!ex) return result('nicht_darstellbar', ['Unbekannte exerciseId; kein stiller Namens-Fallback.']);
    } else {
      if (!candidates.length) return result('nicht_darstellbar', ['Nicht im zwölfteiligen Referenzkatalog enthalten oder Name unbekannt.']);
      if (candidates.length !== 1) return result('bestaetigung_noetig', ['Name/Alias mehrdeutig; bewusste Auswahl erforderlich.'], { candidates });
      ex = byId.get(candidates[0]);
    }
    const reasons = [], warnings = [];
    if (source.exerciseId !== undefined && normalizeName(name) && !candidates.includes(ex.id)) warnings.push('ID bestimmt die Identität; abweichenden Namen in einer späteren Vorschau sichtbar machen.');
    if (tracking.metric !== ex.tracking.metric) reasons.push('Messwert widerspricht der Definition.');
    if (tracking.loadMode !== ex.tracking.loadMode) reasons.push(ex.tracking.loadMode === 'assistance' ? 'Altstruktur beschreibt normales Gewicht statt Unterstützung; nicht durch gewöhnliche Lastlogik ausführen.' : 'Lastbedeutung widerspricht der Definition.');
    if (tracking.perSide !== undefined && tracking.perSide !== (ex.tracking.counting === 'per_side')) reasons.push('Explizite Seitenzählung widerspricht der Definition.');
    if (tracking.perSide === undefined && ex.tracking.counting === 'per_side') reasons.push('Je-Seite-Regel im Altbestand nicht bestätigt.');
    return result(reasons.length ? 'bestaetigung_noetig' : 'eindeutig', reasons.length ? reasons : ['Identität und darstellbare Alt-Erfassung eindeutig zugeordnet.'], {
      exerciseId: ex.id,
      // source.id ist die Programmposition, niemals eine Bibliotheks-ID.
      positionId: representation === 'internal' ? source.id ?? null : null,
      proposedTracking: clone(ex.tracking),
      legacyTracking: { metric: tracking.metric, loadMode: tracking.loadMode, perSide: tracking.perSide ?? null },
      historicalContext: { loadEntryConfirmation: tracking.loadMode === 'none' ? 'not_applicable' : 'unconfirmed', countingConfirmation: tracking.perSide === true ? 'confirmed' : 'unconfirmed', deviceVariant: null },
      warnings
    });
  };
}

module.exports = { legacyTracking, createLegacyResolver };
