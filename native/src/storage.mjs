// Synchronous working copy for the existing app, serialized native checkpoints.
// Only a resolved checkpoint is reported as saved. Never substitute empty data
// for an unreadable native store.
export async function createNativeStorage({ read, write, status = () => {} }) {
  const raw = await read();
  let values = Object.create(null);
  if (raw !== null) {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !parsed.values || typeof parsed.values !== 'object' || Array.isArray(parsed.values) ||
        Object.values(parsed.values).some(value => typeof value !== 'string')) {
      throw new Error('Ungültiger lokaler Speicher');
    }
    values = Object.assign(Object.create(null), parsed.values);
  }
  let revision = 0, saved = 0, running = null, failure = null, exclusive = false;
  const encode = value => JSON.stringify({ version: 1, values: value });
  function changed() {
    revision++;
    status('pending');
    queueMicrotask(() => { flush().catch(() => {}); });
  }
  async function flush() {
    if (failure) throw failure;
    if (running) return running;
    if (saved === revision) return;
    running = (async () => {
      while (saved !== revision) {
        const next = revision, payload = encode(values);
        await write(payload);
        saved = next;
      }
      status('saved');
    })().catch(error => {
      failure = error; status('error'); throw error;
    }).finally(() => { running = null; });
    return running;
  }
  function writable() {
    if (failure) throw failure;
    if (exclusive) throw new Error('Speicher wird gerade ersetzt');
  }
  return {
    getItem(key) { return values[key] ?? null; },
    setItem(key, value) {
      writable(); value = String(value);
      if (values[key] === value) return;
      values[key] = value; changed();
    },
    removeItem(key) {
      writable(); if (!Object.hasOwn(values, key)) return;
      delete values[key]; changed();
    },
    snapshot() { return { ...values }; },
    flush,
    async retry() { failure = null; await flush(); },
    // Restore/delete replace the complete checkpoint; a rejected write leaves
    // the working copy unchanged. Callers keep the app blocked until completion.
    async commit(next) {
      if (exclusive) throw new Error('Speicher wird gerade ersetzt');
      exclusive = true;
      try {
        await flush(); status('pending');
        await write(encode(next));
        values = Object.assign(Object.create(null), next);
        saved = ++revision;
        status('saved');
      } catch (error) {
        status('error'); throw error;
      } finally { exclusive = false; }
    }
  };
}

// The generated iOS target owns exactly one WKWebView and has no scene/window
// creation. This replaces Web Locks only in that native target, never in Safari.
export function createSingleViewLock() {
  let held = false;
  return { async request(name, options, callback) {
    if (held) return callback(null);
    held = true;
    try { return await callback({ name, mode: 'exclusive' }); }
    finally { held = false; }
  } };
}
