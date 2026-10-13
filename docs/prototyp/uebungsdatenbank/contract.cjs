'use strict';

// Isolierter Vertragsprototyp. Kein App-Ladepfad, Speicherzugriff oder Progressionsaufruf.
const VALUES = Object.freeze({
  metric: ['reps', 'seconds'],
  loadMode: ['none', 'external', 'added', 'assistance'],
  loadEntry: ['not_applicable', 'total', 'per_implement', 'machine_display'],
  laterality: ['bilateral', 'unilateral_each_side'],
  counting: ['total', 'per_side'],
  domain: ['strength', 'skill', 'mobility', 'cardio'],
  role: ['compound', 'accessory', 'isolation', 'skill', 'mobility', 'cardio'],
  movement: ['squat', 'horizontal_push', 'vertical_pull', 'horizontal_pull', 'anti_extension', 'carry', 'full_body', 'overhead_support', 'hip_mobility', 'locomotion'],
  target: ['quadriceps', 'glutes', 'chest', 'back', 'core', 'grip', 'shoulders', 'hip_region', 'whole_body'],
  equipment: ['barbell', 'rack', 'dumbbell', 'flat_bench', 'machine', 'pullup_bar', 'mat', 'kettlebell', 'none', 'wall', 'bench', 'treadmill'],
  progression: ['load', 'reps', 'duration', 'variant', 'reduce_assistance', 'none'],
  relation: ['equipment_alternative', 'equivalent', 'easier', 'harder', 'progression_step', 'regression_step']
});
const TRACKING_KEYS = ['metric', 'loadMode', 'loadEntry', 'laterality', 'counting'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const normalizeName = value => typeof value === 'string' ? value.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '') : '';
const issue = (errors, path, code, message) => errors.push({ path, code, message });

function fields(value, allowed, path, errors) {
  if (!object(value)) { issue(errors, path, 'object_required', 'Objekt erforderlich.'); return false; }
  for (const key of Object.keys(value)) if (!allowed.includes(key)) issue(errors, `${path}.${key}`, 'unknown_field', 'Feld gehört nicht zum Prototypvertrag.');
  return true;
}
function choice(value, allowed, path, errors) {
  if (!allowed.includes(value)) issue(errors, path, 'invalid_enum', 'Nicht erlaubter Wert.');
}
function list(value, allowed, path, errors, required = false) {
  if (!Array.isArray(value)) { issue(errors, path, 'array_required', 'Liste erforderlich.'); return; }
  if (required && !value.length) issue(errors, path, 'empty_list', 'Mindestens ein Eintrag erforderlich.');
  const seen = new Set();
  value.forEach((item, index) => {
    if (allowed) choice(item, allowed, `${path}[${index}]`, errors);
    else if (!text(item)) issue(errors, `${path}[${index}]`, 'text_required', 'Text erforderlich.');
    if (seen.has(item)) issue(errors, `${path}[${index}]`, 'duplicate', 'Doppelter Eintrag.');
    seen.add(item);
  });
}

function validateTracking(tracking, path = 'tracking') {
  const errors = [];
  if (!fields(tracking, TRACKING_KEYS, path, errors)) return errors;
  for (const key of TRACKING_KEYS) choice(tracking[key], VALUES[key], `${path}.${key}`, errors);
  if ((tracking.loadMode === 'none') !== (tracking.loadEntry === 'not_applicable')) issue(errors, path, 'load_entry_conflict', 'Ohne Last gilt not_applicable; Last benötigt eine Eingabekonvention.');
  if (tracking.loadMode === 'added' && tracking.loadEntry !== 'total') issue(errors, path, 'added_entry_conflict', 'Zusatzgewicht wird im ersten Prototyp gesamt erfasst.');
  if (tracking.loadMode === 'assistance' && (tracking.metric !== 'reps' || tracking.loadEntry !== 'machine_display')) issue(errors, path, 'assistance_conflict', 'Unterstützung ist hier Wiederholungen mit Geräteanzeige.');
  if ((tracking.laterality === 'unilateral_each_side') !== (tracking.counting === 'per_side')) issue(errors, path, 'counting_conflict', 'Je Seite ausführen und je Seite zählen gehören zusammen.');
  return errors;
}

function validateCatalog(catalog) {
  const errors = [], warnings = [], ids = new Set(), nameIndex = new Map();
  if (!fields(catalog, ['format', 'version', 'exercises'], '$', errors)) return { valid: false, errors, warnings };
  if (catalog.format !== 'satzkraft-exercise-prototype' || catalog.version !== 1) issue(errors, '$', 'format', 'Isoliertes Prototypformat Version 1 erforderlich.');
  if (!Array.isArray(catalog.exercises) || !catalog.exercises.length) {
    issue(errors, '$.exercises', 'exercises_required', 'Übungen erforderlich.');
    return { valid: false, errors, warnings };
  }
  catalog.exercises.forEach((ex, index) => {
    const path = `$.exercises[${index}]`;
    if (!fields(ex, ['id', 'origin', 'name', 'aliases', 'domain', 'role', 'movement', 'targets', 'equipment', 'tracking', 'progression', 'technique', 'substitutes'], path, errors)) return;
    if (!text(ex.id) || !/^[a-z][a-z0-9_]{2,79}$/.test(ex.id)) issue(errors, `${path}.id`, 'id', 'Stabile ID erforderlich.');
    if (ids.has(ex.id)) issue(errors, `${path}.id`, 'duplicate_id', 'ID bereits vergeben.');
    ids.add(ex.id);
    choice(ex.origin, ['built_in', 'custom'], `${path}.origin`, errors);
    if (ex.origin === 'custom' && !/^custom_/.test(ex.id || '')) issue(errors, `${path}.id`, 'custom_id', 'Persönliche ID benötigt custom_.');
    if (ex.origin === 'built_in' && /^custom_/.test(ex.id || '')) issue(errors, `${path}.id`, 'built_in_id', 'Integrierte ID darf nicht custom_ verwenden.');
    if (fields(ex.name, ['de', 'en'], `${path}.name`, errors)) {
      if (!text(ex.name.de)) issue(errors, `${path}.name.de`, 'text_required', 'Deutscher Name erforderlich.');
      if (ex.origin === 'built_in' && !text(ex.name.en)) issue(errors, `${path}.name.en`, 'text_required', 'Englischer Name für integrierte Übungen erforderlich.');
      if (ex.name.en !== undefined && !text(ex.name.en)) issue(errors, `${path}.name.en`, 'text_required', 'Optionaler englischer Name darf nicht leer oder ungültig sein.');
    }
    list(ex.aliases, null, `${path}.aliases`, errors);
    choice(ex.domain, VALUES.domain, `${path}.domain`, errors);
    choice(ex.role, VALUES.role, `${path}.role`, errors);
    if (['skill', 'mobility', 'cardio'].includes(ex.domain) && ex.role !== ex.domain) issue(errors, `${path}.role`, 'role_conflict', 'Domäne und Rolle passen nicht zusammen.');
    choice(ex.movement, VALUES.movement, `${path}.movement`, errors);
    list(ex.targets, VALUES.target, `${path}.targets`, errors, true);
    if (fields(ex.equipment, ['required', 'alternatives'], `${path}.equipment`, errors)) {
      list(ex.equipment.required, VALUES.equipment, `${path}.equipment.required`, errors, true);
      if (Array.isArray(ex.equipment.required) && ex.equipment.required.includes('none') && ex.equipment.required.length > 1) issue(errors, `${path}.equipment.required`, 'equipment_conflict', 'none darf nicht mit anderem Equipment kombiniert werden.');
      if (!Array.isArray(ex.equipment.alternatives)) issue(errors, `${path}.equipment.alternatives`, 'array_required', 'Alternative Ausstattungen als Liste erforderlich.');
      else ex.equipment.alternatives.forEach((group, i) => {
        list(group, VALUES.equipment, `${path}.equipment.alternatives[${i}]`, errors, true);
        if (Array.isArray(group) && group.includes('none') && group.length > 1) issue(errors, `${path}.equipment.alternatives[${i}]`, 'equipment_conflict', 'none darf nicht kombiniert werden.');
      });
    }
    errors.push(...validateTracking(ex.tracking, `${path}.tracking`));
    if (fields(ex.progression, ['primary', 'secondary'], `${path}.progression`, errors)) {
      choice(ex.progression.primary, VALUES.progression, `${path}.progression.primary`, errors);
      if (ex.progression.secondary !== undefined) choice(ex.progression.secondary, VALUES.progression, `${path}.progression.secondary`, errors);
      const t = ex.tracking || {};
      for (const mode of [ex.progression.primary, ex.progression.secondary].filter(Boolean)) {
        if (mode === 'load' && !['external', 'added'].includes(t.loadMode)) issue(errors, `${path}.progression`, 'progression_load', 'Laststeigerung passt nicht zu dieser Lastbedeutung.');
        if (mode === 'reduce_assistance' && t.loadMode !== 'assistance') issue(errors, `${path}.progression`, 'progression_assistance', 'Unterstützung reduzieren benötigt Unterstützung.');
        if (mode === 'reps' && t.metric !== 'reps' || mode === 'duration' && t.metric !== 'seconds') issue(errors, `${path}.progression`, 'progression_metric', 'Progression passt nicht zum Messwert.');
      }
      if (t.loadMode === 'assistance' && ex.progression.primary !== 'reduce_assistance') issue(errors, `${path}.progression`, 'assistance_direction', 'Unterstützung darf keine gewöhnliche Lastprogression erhalten.');
      if (ex.domain === 'mobility' && ex.progression.primary !== 'none') issue(errors, `${path}.progression`, 'mobility_progression', 'Mobilität erhält hier keine automatische Leistungssteigerung.');
    }
    if (ex.technique !== undefined) {
      if (fields(ex.technique, ['cue'], `${path}.technique`, errors) && !text(ex.technique.cue)) issue(errors, `${path}.technique.cue`, 'text_required', 'Techniktext darf nicht leer sein.');
    } else if (ex.origin === 'built_in') issue(errors, `${path}.technique`, 'technique_required', 'Integrierte Übungen benötigen einen Techniktext.');
    if (fields(ex.substitutes, ['status', 'relations'], `${path}.substitutes`, errors)) {
      choice(ex.substitutes.status, ['maintained', 'no_default_substitute'], `${path}.substitutes.status`, errors);
      if (!Array.isArray(ex.substitutes.relations)) issue(errors, `${path}.substitutes.relations`, 'array_required', 'Beziehungen als Liste erforderlich.');
      else if ((ex.substitutes.status === 'maintained') !== !!ex.substitutes.relations.length) issue(errors, `${path}.substitutes`, 'substitute_conflict', 'Gepflegte Beziehungen oder ausdrücklich keine Standardalternative wählen.');
    }
    for (const name of [ex.name?.de, ex.name?.en, ...(Array.isArray(ex.aliases) ? ex.aliases : [])]) {
      const key = normalizeName(name);
      if (!key) continue;
      if (!nameIndex.has(key)) nameIndex.set(key, new Set());
      nameIndex.get(key).add(ex.id);
    }
  });
  catalog.exercises.forEach((ex, index) => {
    if (!object(ex) || !Array.isArray(ex.substitutes?.relations)) return;
    const seen = new Set();
    ex.substitutes.relations.forEach((relation, i) => {
      const path = `$.exercises[${index}].substitutes.relations[${i}]`;
      if (!fields(relation, ['exerciseId', 'relation'], path, errors)) return;
      choice(relation.relation, VALUES.relation, `${path}.relation`, errors);
      if (!ids.has(relation.exerciseId) || relation.exerciseId === ex.id) issue(errors, `${path}.exerciseId`, 'relation_target', 'Andere vorhandene Übung erforderlich.');
      if (seen.has(relation.exerciseId)) issue(errors, path, 'duplicate_relation', 'Ziel bereits gepflegt.');
      seen.add(relation.exerciseId);
    });
  });
  for (const [name, matches] of nameIndex) if (matches.size > 1) warnings.push({ path: '$.exercises', code: 'ambiguous_name', name, exerciseIds: [...matches] });
  return { valid: errors.length === 0, errors, warnings };
}

function validatePerformance(exercise, record) {
  const errors = [], warnings = [];
  errors.push(...validateTracking(exercise?.tracking));
  if (!fields(record, ['exerciseId', 'positionId', 'trackingSnapshot', 'context', 'sets'], 'record', errors)) return { valid: false, errors, warnings };
  if (record.exerciseId !== exercise?.id) issue(errors, 'record.exerciseId', 'identity_conflict', 'Leistung gehört zu einer anderen Übung.');
  if (!text(record.positionId)) issue(errors, 'record.positionId', 'position_required', 'Programmposition erforderlich.');
  errors.push(...validateTracking(record.trackingSnapshot, 'record.trackingSnapshot'));
  // Unabhängig von Feldreihenfolge; aktuelle Stammdaten dürfen alte Erfassung nicht ersetzen.
  if (TRACKING_KEYS.some(key => record.trackingSnapshot?.[key] !== exercise?.tracking?.[key])) issue(errors, 'record.trackingSnapshot', 'historical_tracking_conflict', 'Historische Erfassung weicht ab; separat erhalten.');
  const t = record.trackingSnapshot || {};
  if (fields(record.context, ['loadEntryConfirmation', 'countingConfirmation', 'deviceVariant'], 'record.context', errors)) {
    choice(record.context.loadEntryConfirmation, t.loadMode === 'none' ? ['not_applicable'] : ['confirmed', 'unconfirmed'], 'record.context.loadEntryConfirmation', errors);
    choice(record.context.countingConfirmation, ['confirmed', 'unconfirmed'], 'record.context.countingConfirmation', errors);
    if (record.context.deviceVariant !== null && !text(record.context.deviceVariant)) issue(errors, 'record.context.deviceVariant', 'device_variant', 'Gerätekennung oder null erforderlich.');
  }
  if (!Array.isArray(record.sets) || !record.sets.length) issue(errors, 'record.sets', 'sets_required', 'Mindestens ein Satz erforderlich.');
  else record.sets.forEach((set, index) => {
    const path = `record.sets[${index}]`;
    if (!fields(set, ['value', 'load'], path, errors)) return;
    if (!Number.isInteger(set.value) || set.value < 1 || set.value > (t.metric === 'seconds' ? 5999 : 9999)) issue(errors, `${path}.value`, 'set_value', 'Positiver ganzzahliger Messwert innerhalb der App-Grenzen erforderlich.');
    if (t.loadMode === 'none') {
      if (set.load !== null) issue(errors, `${path}.load`, 'unexpected_load', 'Ohne Last wird null gespeichert.');
    } else if (set.load === null) warnings.push({ path: `${path}.load`, code: 'missing_load', message: 'Gewicht fehlt; nicht als 0 interpretieren.' });
    else if (typeof set.load !== 'number' || !Number.isFinite(set.load) || set.load < 0 || set.load > 2000 || Math.abs(set.load * 10 - Math.round(set.load * 10)) > 1e-8) issue(errors, `${path}.load`, 'set_load', 'Last von 0 bis 2000 kg mit höchstens einer Dezimalstelle erforderlich.');
  });
  return { valid: errors.length === 0, errors, warnings };
}

function describePerformance(exercise, record) {
  const validation = validatePerformance(exercise, record);
  if (!validation.valid) return { ...validation, summary: null, e1RM: null, strengthVolume: null, trendScore: null };
  const t = record.trackingSnapshot;
  const number = value => value.toLocaleString('de-DE', { useGrouping: false, maximumFractionDigits: 1 });
  const labels = record.sets.map(set => {
    let result = t.metric === 'seconds' ? `${Math.floor(set.value / 60)}:${String(set.value % 60).padStart(2, '0')} min` : `${set.value} Wdh`;
    if (record.context.countingConfirmation !== 'confirmed') result += ' · Zählweise nicht bestätigt';
    else if (t.counting === 'per_side') result += ' je Seite';
    if (t.loadMode !== 'none') {
      if (set.load === null) result += ' · Gewicht fehlt';
      else {
        result += ` · ${t.loadMode === 'added' ? '+' : ''}${number(set.load)} kg`;
        if (t.loadMode === 'assistance') result += ' Unterstützung';
        else if (record.context.loadEntryConfirmation === 'confirmed' && t.loadEntry === 'per_implement') result += ' pro Hantel';
        else if (record.context.loadEntryConfirmation === 'confirmed' && t.loadEntry === 'total' && t.loadMode === 'external') result += ' gesamt';
      }
      if (record.context.loadEntryConfirmation !== 'confirmed') result += ' · Gewichtskonvention nicht bestätigt';
    }
    if (t.loadEntry === 'machine_display') result += ` · ${record.context.deviceVariant || 'Gerät nicht bestätigt'}`;
    return result;
  });
  // Dieser Prototyp zeigt ausschließlich Istwerte; bestehende Reportformeln bleiben unberührt.
  return { ...validation, summary: labels.join(' / '), e1RM: null, strengthVolume: null, trendScore: null };
}

function comparisonEligibility(exercise, first, second) {
  if (!validatePerformance(exercise, first).valid || !validatePerformance(exercise, second).valid) return { allowed: false, reason: 'invalid_or_different_tracking' };
  if (first.context.countingConfirmation !== 'confirmed' || second.context.countingConfirmation !== 'confirmed') return { allowed: false, reason: 'counting_unconfirmed' };
  if (exercise.tracking.loadMode !== 'none' && (first.context.loadEntryConfirmation !== 'confirmed' || second.context.loadEntryConfirmation !== 'confirmed')) return { allowed: false, reason: 'load_entry_unconfirmed' };
  if (exercise.tracking.loadMode !== 'none' && [...first.sets, ...second.sets].some(set => set.load === null)) return { allowed: false, reason: 'missing_load' };
  if (exercise.tracking.loadEntry === 'machine_display' && (!first.context.deviceVariant || first.context.deviceVariant !== second.context.deviceVariant)) return { allowed: false, reason: 'device_variant_unconfirmed_or_changed' };
  if (['mobility', 'cardio'].includes(exercise.domain)) return { allowed: false, reason: 'no_performance_ranking' };
  if (exercise.tracking.metric === 'seconds' && exercise.tracking.loadMode !== 'none') return { allowed: false, reason: 'no_scalar_for_time_and_load' };
  return { allowed: true, reason: 'same_identity_tracking_and_context' };
}

module.exports = { VALUES, TRACKING_KEYS, normalizeName, validateTracking, validateCatalog, validatePerformance, describePerformance, comparisonEligibility };
