// Shared data boundary. No DOM, storage, or platform API calls.
// UTF-8 bytes, not JavaScript string length; the same budget is used for files,
// decoded text, persisted snapshots and regular exports.
function backupFileTooLarge(bytes) {
  return bytes > 20_000_000;
}
function backupSizeError(text) {
  if (typeof text !== "string" || !text.length) return "Die Datei ist leer.";
  if (backupFileTooLarge(new TextEncoder().encode(text).byteLength)) {
    return "Die Sicherung ist größer als 20 MB. Sichere den Originalstand und verkleinere die Bibliothek vor der Wiederherstellung.";
  }
  return null;
}
function removeParentReferences(programs, removedId) {
  for (const program of Object.values(programs)) {
    if (program.parent === removedId) delete program.parent;
  }
}
if (typeof module === "object" && module.exports) {
  module.exports = { backupFileTooLarge, backupSizeError, removeParentReferences };
}
