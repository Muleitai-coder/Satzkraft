const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { legacyContext, sampleProgram, sampleBackup } = require('../docs/prototyp/uebungsdatenbank/compatibility-probe.cjs');
const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');
const library = JSON.parse(fs.readFileSync(new URL('../uebungen.json', `file://${__filename}`), 'utf8'));
const copy = value => JSON.parse(JSON.stringify(value));
function section(a, b) { const i = html.indexOf(a), j = html.indexOf(b, i); assert.ok(i >= 0 && j > i, a); return html.slice(i,j); }
function context() {
 const c = legacyContext(true);
 Object.assign(c, { DATA_SCHEMA_VERSION:5, cloneJSON:copy, S:{personalExercises:{}, programs:{}, store:{}, active:'sample', week:1, day:'A', logs:{}},
 normalizeSwapName:name=>String(name||'').trim(), normalizeSwapWeight:weight=>weight||'', normalizeSwapDecision:()=>'',
 exerciseLogKey:ex=>`${c.S.week}|${c.S.day}|${ex.id}`, localWriteBlocked:()=>false, programWriteLocked:()=>false, flushSave:()=>true,
 setComplete:(ex,set)=>!!set&&set.reps!==''&&set.reps!=null&&(!ex.w||set.weight!==''&&set.weight!=null),
 reportNumber:value=>String(value),fmtSeconds:value=>`${Math.floor(value/60)}:${String(value%60).padStart(2,'0')} min`,dDate:()=>'',reportDuration:()=>'',
 exerciseValidForWeek:(ex,week)=>week>=(ex.fromWeek||1)&&week<=(ex.untilWeek||Infinity)
 });
 vm.runInContext(section('var EXERCISE_LIBRARY=', 'function loadExerciseLibrary('), c);
 vm.runInContext(section('function findExerciseLibraryEntry(', 'function canonicalExerciseName('), c);
 vm.runInContext(section('function exerciseLibraryTypeSignature(', 'function exerciseSwapSuggestions('), c);
 vm.runInContext(section('function snapshotPerformedExercise(', 'function exerciseHasEnteredData('), c);
 vm.runInContext(section('function reportFinite(', 'function reportNumber('), c);
 vm.runInContext(section('function reportDetailedProtocol(', 'function buildReport('), c);
 vm.runInContext(section('function exerciseDetailRows(', 'function renderExerciseDetail('), c);
 vm.runInContext(section('function storePersonalExercise(', 'function savePersonalExerciseForm('), c);
 c.setExerciseLibrary(copy(library));
 return c;
}
function definition(patch={}) {return {id:'custom_my_bench',name:'Meine Bank',type:'weight',perSide:false,weightConvention:'per_dumbbell',equipment:'Hantel',technique:'Kontrolliert bewegen.',...patch};}
function position(patch={}) {return {id:'A_0',name:'Kurzhantel-Bankdrücken',exerciseId:'dumbbell_bench_press',unit:'reps',w:true,bw:false,perSide:false,...patch};}
function customProgram(c, def=definition()) {return c.parseProgram(JSON.stringify(sampleProgram({name:def.name,exerciseId:def.id,exerciseDefinition:def,weightConvention:def.weightConvention,perSide:def.perSide}))).prog;}

test('first complete set freezes the initial context through partial entry, renaming and later corrections',()=>{
 const c=context(),ex=position(); c.writeSets(ex,[{reps:'10',weight:''}]);assert.equal(c.S.logs['1|A|A_0'].performedExercise,undefined);
 c.writeSets(ex,[{reps:'10',weight:'20'}]);const snapshot=copy(c.S.logs['1|A|A_0'].performedExercise);
 assert.equal(snapshot.name,'Kurzhantel-Bankdrücken');assert.equal(snapshot.weightConvention,'per_dumbbell');
 ex.name='Langhantel-Bankdrücken';ex.perSide=true;c.writeSets(ex,[{reps:'12',weight:'22'}]);assert.deepEqual(copy(c.S.logs['1|A|A_0'].performedExercise),snapshot);
});
test('legacy values and corrections never acquire invented historical metadata',()=>{
 const c=context();c.S.logs['1|A|A_0']={sets:[{reps:'10',weight:'20'}]};c.writeSets(position(),[{reps:'11',weight:'20'}]);assert.equal(c.S.logs['1|A|A_0'].performedExercise,undefined);assert.equal(c.S.logs['1|A|A_0'].pendingPerformedExercise,undefined);
});
test('replacement snapshot records the performed identity and never assigns the original ID to a free replacement',()=>{
 const c=context(),ex=position({exerciseId:'barbell_back_squat',name:'Kniebeuge'});c.S.logs['1|A|A_0']={sets:[],swap:'Kurzhantel-Bankdrücken'};c.writeSets(ex,[{reps:'8',weight:'20'}]);assert.equal(c.S.logs['1|A|A_0'].performedExercise.exerciseId,'dumbbell_bench_press');
 c.S.logs['1|A|A_0']={sets:[],swap:'Freie Ersatzübung'};c.writeSets(ex,[{reps:'8',weight:'20'}]);assert.equal(c.S.logs['1|A|A_0'].performedExercise.exerciseId,undefined);assert.equal(c.S.logs['1|A|A_0'].performedExercise.name,'Freie Ersatzübung');
});
test('no write or new snapshot is made by a blocked window',()=>{const c=context();c.localWriteBlocked=()=>true;assert.equal(c.writeSets(position(),[{reps:'10',weight:'20'}]),false);assert.deepEqual(copy(c.S.logs),{});});
test('report and protocol use recorded name, unit, sides and all actual sets despite later plan changes',()=>{
 const c=context(),p=c.parseProgram(JSON.stringify(sampleProgram())).prog,ex=p.days[0].ex[0];
 const performed={version:1,name:'Damals Carry',unit:'seconds',weighted:true,bodyweight:false,perSide:true,weightConvention:'total'};
 const logs={'1|A|A_0':{sets:[{reps:'60',weight:'20'},{reps:'45',weight:'0'},{reps:'30',weight:'10'},{reps:'20',weight:'15'}],performedExercise:performed}};
 ex.name='Später Kniebeuge';ex.sets=1;const report=c.buildReportData(p,logs,[]);assert.equal(report.totalVolume,0);assert.equal(report.totalSets,4);assert.equal(report.exercises[0].type,'weighted_seconds');assert.equal(report.exercises[0].name,'Damals Carry');
 const protocol=c.reportDetailedProtocol(p,logs,[],{});assert.match(protocol,/Damals Carry/);assert.match(protocol,/1:00 min · 20 kg · je Seite/);assert.match(protocol,/0:20 min · 15 kg/);assert.doesNotMatch(protocol,/Später Kniebeuge/);
});
test('same name with different weight convention, identity or legacy context never shares a trend',()=>{
 const c=context(),p=c.parseProgram(JSON.stringify(sampleProgram())).prog;p.weeks=[p.weeks[0],{...p.weeks[0],n:2},{...p.weeks[0],n:3}];
 const base={version:1,name:'Bank',unit:'reps',weighted:true,bodyweight:false,perSide:false,exerciseId:'dumbbell_bench_press'};
 const logs={'1|A|A_0':{sets:[{reps:'8',weight:'20'}],performedExercise:{...base,weightConvention:'per_dumbbell'}},'2|A|A_0':{sets:[{reps:'8',weight:'40'}],performedExercise:{...base,weightConvention:'total'}},'3|A|A_0':{sets:[{reps:'8',weight:'40'}]}};
 assert.equal(c.buildReportData(p,logs,[]).exercises.length,3);
});
test('personal definition survives program import/export and rejects missing or inconsistent fields',()=>{
 const c=context(),def=definition(),p=customProgram(c,def);assert.ok(p);const out=c.exportTranslate(p);assert.deepEqual(copy(out.days[0].exercises[0].exerciseDefinition),def);assert.equal(c.parseProgram(JSON.stringify(out)).err,undefined);
 const mismatch=copy(out);mismatch.days[0].exercises[0].exerciseDefinition.perSide=true;assert.ok(c.parseProgram(JSON.stringify(mismatch)).err);
 delete mismatch.days[0].exercises[0].exerciseDefinition;assert.ok(c.parseProgram(JSON.stringify(mismatch)).err);
});
test('conflicting same-ID import is remapped on a copy and leaves the existing catalog and program untouched',()=>{
 const c=context(),existing=definition();c.S.personalExercises[existing.id]=existing;const incoming=definition({name:'Andere Bank',weightConvention:'total'}),p=customProgram(c,incoming),before=JSON.stringify(p);
 const prepared=c.preparePersonalProgram(p);assert.equal(prepared.remapped,1);assert.notEqual(prepared.program.days[0].ex[0].exerciseId,existing.id);assert.equal(JSON.stringify(p),before);assert.deepEqual(c.S.personalExercises[existing.id],existing);
});
test('identical personal imports reuse identity and collection creates only accepted missing definitions',()=>{
 const c=context(),def=definition();c.S.personalExercises[def.id]=copy(def);const p=customProgram(c);const ready=c.preparePersonalProgram(p);assert.equal(ready.remapped,0);c.collectPersonalProgramDefinitions(p);assert.equal(Object.keys(c.S.personalExercises).length,1);
});
test('personal rename keeps identity, new recording or device creates a separate variant and a failed save rolls back',()=>{
 const c=context(),original=definition();c.S.personalExercises[original.id]=copy(original);
 const renamed=c.storePersonalExercise({...original,name:'Neue Bezeichnung'},original.id);assert.equal(renamed.definition.id,original.id);
 const variant=c.storePersonalExercise({...renamed.definition,equipment:'Andere Hantel'},original.id);assert.ok(variant.newVariant);assert.notEqual(variant.definition.id,original.id);
 const before=copy(c.S.personalExercises);c.flushSave=()=>false;const failed=c.storePersonalExercise(definition({id:'custom_failed'}),null);assert.match(failed.error,/nicht gespeichert/);assert.deepEqual(copy(c.S.personalExercises),before);
});
test('backup v5 includes personal definitions and snapshots, accepts legacy v4 and rejects missing definitions or invalid historical fields',()=>{
 const c=context(),def=definition(),p=customProgram(c);c.S={programs:{sample:p},active:'sample',personalExercises:{[def.id]:def},store:{}};
 const raw=sampleBackup(p);raw.schemaVersion=5;raw.personalExercises=copy(c.S.personalExercises);raw.store.sample.logs['1|A|A_0'].performedExercise={version:1,name:def.name,exerciseId:def.id,unit:'reps',weighted:true,bodyweight:false,perSide:false,weightConvention:def.weightConvention};
 assert.equal(c.validateBackupFile(raw),null);c.S.store=raw.store;assert.deepEqual(JSON.parse(c.backupJSON()).personalExercises,raw.personalExercises);
 const missing=copy(raw);missing.personalExercises={};assert.match(c.validateBackupFile(missing),/fehlt/);
 const malformed=copy(raw);malformed.store.sample.logs['1|A|A_0'].performedExercise.perSide='false';assert.match(c.validateBackupFile(malformed),/historische/);
 const dishonest=copy(raw);dishonest.schemaVersion=4;assert.match(c.validateBackupFile(dishonest),/Datenversion 5/);
 const old=sampleBackup(c.parseProgram(JSON.stringify(sampleProgram())).prog);assert.equal(c.validateBackupFile(old),null);
});
test('backup bounds come from the historical recording and cannot be changed by the current program',()=>{
 const c=context(),p=c.parseProgram(JSON.stringify(sampleProgram({unit:'seconds'}))).prog,raw=sampleBackup(p);raw.schemaVersion=5;raw.store.sample.logs['1|A|A_0'].sets=[{reps:'8000',weight:'20'}];raw.store.sample.logs['1|A|A_0'].performedExercise={version:1,name:'Reps damals',unit:'reps',weighted:true,bodyweight:false,perSide:false,weightConvention:'total'};assert.equal(c.validateBackupFile(raw),null);
 raw.store.sample.logs['1|A|A_0'].performedExercise.unit='seconds';assert.match(c.validateBackupFile(raw),/Wiederholungs/);
});
test('detail history includes archived programs and replacement identity without claiming ambiguous legacy entries',()=>{
 const c=context(),def=definition(),p=customProgram(c);p.name='Archiv';p.archived=true;const snapshot={version:1,name:def.name,exerciseId:def.id,unit:'reps',weighted:true,bodyweight:false,perSide:false,weightConvention:'per_dumbbell'};
 c.S.programs={past:p};c.S.store={past:{history:[],logs:{'1|A|A_0':{sets:[{reps:'8',weight:'20'}],performedExercise:snapshot}}}};c.S.active='elsewhere';const rows=c.exerciseDetailRows(c.personalExerciseEntry(def));assert.equal(rows.length,1);assert.equal(rows[0].program,'Archiv');assert.match(rows[0].parts[0],/pro Hantel/);
});
test('personal limits reject overlong text, assistance, prototype keys and oversized catalog',()=>{
 const c=context();assert.ok(c.personalExerciseError(definition({name:'x'.repeat(81)})));assert.ok(c.personalExerciseError(definition({type:'assistance'})));assert.ok(c.personalExerciseError(definition({id:'__proto__'})));assert.ok(c.personalExerciseError(definition({technique:'x'.repeat(501)})));assert.ok(c.personalExerciseCatalogError(Object.fromEntries(Array.from({length:201},(_,i)=>[`custom_${i}`,definition({id:`custom_${i}`})]))));
});

test('archiving removes choices but keeps identity available to existing program details',()=>{
 const c=context(),def=definition({archived:true});c.S.personalExercises[def.id]=def;
 assert.equal(c.personalExerciseEntries().length,0);assert.equal(c.findExerciseLibraryEntryById(def.id).definition.id,def.id);
});
test('a full catalog rejects an additional imported exercise before catalog collection',()=>{
 const c=context();for(let i=0;i<200;i++){const def=definition({id:`custom_existing_${i}`});c.S.personalExercises[def.id]=def;}
 const before=JSON.stringify(c.S.personalExercises),prepared=c.preparePersonalProgram(customProgram(c));assert.match(prepared.error,/200/);assert.equal(JSON.stringify(c.S.personalExercises),before);
});
test('normalization preserves legacy raw values and validates new snapshots before use',()=>{
 const c=context();c.alias=()=>{};c.migrateProgram=()=>{};c.newStore=()=>({week:1,day:'A',tg:{},logs:{},history:[],workout:null});
 vm.runInContext(section('function sanitizePendingReplacements(', 'function syncStore('),c);
 const p=c.parseProgram(JSON.stringify(sampleProgram())).prog,legacy=sampleBackup(p),before=JSON.stringify(legacy.store.sample.logs);c.normalize(legacy);assert.equal(legacy.schemaVersion,5);assert.equal(JSON.stringify(legacy.store.sample.logs),before);
 const invalid=sampleBackup(p);invalid.store.sample.logs['1|A|A_0'].performedExercise={version:1,name:'Fehler'};assert.throws(()=>c.normalize(invalid),/Historische Erfassung/);
 const future=sampleBackup(p);future.schemaVersion=6;assert.throws(()=>c.normalize(future),/Unbekannte Datenversion/);
});


test('editing an existing program after personal name or technique changes keeps the known semantic identity',()=>{
 const c=context(),def=definition();const p=customProgram(c,def);c.S.personalExercises[def.id]={...def,name:'Umbenannt',technique:'Andere Technikbeschreibung.'};
 const internal=c.preparePersonalProgram(p,true);assert.equal(internal.remapped,0);assert.equal(internal.program.days[0].ex[0].exerciseId,def.id);
 const external=c.preparePersonalProgram(p);assert.equal(external.remapped,1);assert.equal(c.S.personalExercises[def.id].name,'Umbenannt');
});
