const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { jsPDF } = require('jspdf');
const { createReportPdf } = require('../src/core/pdf-document.js');
const tokens = fs.readFileSync(new URL('../src/styles/tokens.css', `file://${__filename}`), 'utf8');
const palette = Object.fromEntries(['ink','muted','accent'].map(role => {
  const hex = tokens.match(new RegExp('--pdf-'+role+':#([0-9a-f]{6})'))[1];
  return [role, [0,2,4].map(offset => parseInt(hex.slice(offset,offset+2),16))];
}));
const font = fs.readFileSync(new URL('../fonts/hanken-grotesk-pdf.ttf', `file://${__filename}`)).toString('base64');

test('creates an actual PDF with embedded font and valid object offsets without changing the report', () => {
  const content = {palette,title:'Rücken & Füße',kind:'Auswertung',subtitle:'Prüfung',blocks:[{heading:'Übung',lines:['1:00 min · 0 kg · je Seite']}]};
  const before = JSON.stringify(content);
  const bytes = Buffer.from(createReportPdf(jsPDF,font,content));
  const pdf = bytes.toString('latin1');
  assert.match(pdf, /^%PDF-1\./);
  assert.match(pdf, /\/FontFile2/);
  assert.match(pdf, /\/ToUnicode/);
  const offset = Number(pdf.match(/startxref\s+(\d+)/)[1]);
  assert.equal(bytes.subarray(offset,offset+4).toString(), 'xref');
  assert.equal(JSON.stringify(content),before);
});

test('paginates a long protocol and embeds its font once instead of truncating the last week', () => {
  const content = {palette,title:'Langes Protokoll',kind:'Trainingsprotokoll',subtitle:'Prüfung',blocks:Array.from({length:100},(_,i)=>({heading:'Woche '+(i+1),lines:['Notiz '.repeat(100)]}))};
  const pdf = Buffer.from(createReportPdf(jsPDF,font,content)).toString('latin1');
  const count = Number(pdf.match(/\/Type \/Pages\s+\/Kids[^]*?\/Count (\d+)/)[1]);
  assert.ok(count>10 && count<100, `unexpected page count ${count}`);
  assert.equal((pdf.match(/\/FontFile2/g)||[]).length,1);
});
