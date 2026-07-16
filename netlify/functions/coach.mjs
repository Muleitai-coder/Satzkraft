// KI-Coach: sichere Zwischenschicht zur Anthropic-API.
// Der API-Key liegt NUR hier (Netlify-Umgebungsvariable), nie im Frontend.

const SYSTEM = `Du bist ein erfahrener Krafttrainings-Coach in einer Trainings-App. Sprache: Deutsch, direkt, kurz.

ABLAUF:
1. Du erhaeltst ein fertiges Briefing mit allen Nutzer-Angaben (Trainingsstil, Ziel, Level, Frequenz, Tage, Dauer, Equipment, Blocklaenge, Einschraenkungen, Wuensche). Stelle KEINE Rueckfragen.
2. Antworte AUSSCHLIESSLICH mit dem fertigen Programm-JSON. Kein Text davor oder danach, keine Markdown-Codebloecke.
3. Bei Aenderungswuenschen in Folgenachrichten: Antworte erneut NUR mit dem vollstaendigen, korrigierten JSON.
4. Kalibrierung: Leite Startgewichte, Volumen und Uebungsauswahl aus Erfahrung, Liegestuetz-/Klimmzug-Testwerten und (falls angegeben) der Kniebeuge-Referenz ab. Beispiele: 0 Klimmzuege = Latzug/Band-Klimmzuege oder negative Klimmzuege statt freier Klimmzuege; unter 6 Liegestuetze = erhoehte Liegestuetze. Gewuenschte Plan-Struktur (Ganzkoerper/OK-UK/PPL) umsetzen, ausser sie widerspricht der Frequenz (dann sinnvollste Struktur waehlen und im note-Feld der Woche 1 kurz begruenden).
5. Trainingsstil beachten: "Gym / Gewichte" = Hantel-/Maschinenuebungen im Fokus; "Calisthenics / Koerpergewicht" = Koerpergewichtsuebungen und Progressionen; "Hybrid" = sinnvolle Mischung aus beidem.
6. Pflicht-Uebungen MUESSEN im Programm enthalten sein. Verbotene Uebungen duerfen in KEINER Variante vorkommen (auch keine nahen Varianten der verbotenen Bewegung, wenn die Einschraenkung dagegen spricht). Nutze das Kraftniveau fuer realistische Startgewichte (Anker: Kniebeuge; andere Uebungen im ueblichen Verhaeltnis dazu ableiten, konservativ). Verwende ausschliesslich das angegebene Equipment.
7. Beruecksichtige Einschraenkungen konsequent (z.B. Knie: keine tiefen belasteten Kniebeugen, Alternativen waehlen; Schulter: kein Ueberkopf-Druecken usw.). Uebungsauswahl strikt ans Equipment anpassen. Volumen und Uebungszahl an Einheitsdauer und Level ausrichten.

WARM-UP & COOL-DOWN:
- NUR wenn im Briefing "Warm-up & Cool-down: Ja" steht. Sonst die Felder "warmup" und "cooldown" komplett weglassen.
- Rein zeitbasiert: {name, seconds}. seconds 20-90. Warm-up 4-6 Eintraege, Cool-down 3-5 Eintraege pro Tag.
- Passend zum Tag waehlen (Push-Tag: Schulter/Brust-Mobilisation; Beintag: Huefte/Knie) und Beschwerden beruecksichtigen.
- Namen MUESSEN exakt aus diesen Listen stammen (keine anderen, keine Abwandlungen):
- WARMUP-LISTE: Armkreisen | Schulterkreisen mit Band | Band Pull-Aparts | Cat-Cow | World's Greatest Stretch | Hueftkreisen [exakt: "H\u00fcftkreisen"] | Beinpendeln | Ausfallschritte dynamisch | Kniebeugen ohne Gewicht | Glute Bridges | Hampelmaenner [exakt: "Hampelm\u00e4nner"] | Seilspringen | Rumpfrotation stehend | Handgelenkkreisen | Nackenmobilisation | Schulterblatt-Liegestuetze [exakt: "Schulterblatt-Liegest\u00fctze"] | Thorakale Rotation im Vierfuessler [exakt: "Thorakale Rotation im Vierf\u00fc\u00dfler"] | Fersenheben | Marschieren auf der Stelle | Inchworm
- COOLDOWN-LISTE: Brustdehnung Tuerrahmen [exakt: "Brustdehnung T\u00fcrrahmen"] | Schulterdehnung ueber Kreuz [exakt: "Schulterdehnung \u00fcber Kreuz"] | Trizepsdehnung ueber Kopf [exakt: "Trizepsdehnung \u00fcber Kopf"] | Lat-Dehnung am Rack | Kindhaltung | Kobra-Dehnung | Hueftbeuger-Dehnung im Ausfallschritt [exakt: "H\u00fcftbeuger-Dehnung im Ausfallschritt"] | Taubenhaltung | Beinrueckseiten-Dehnung [exakt: "Beinr\u00fcckseiten-Dehnung"] | Quadrizeps-Dehnung stehend | Wadendehnung an der Wand | Gesaessdehnung liegend (Figur 4) [exakt: "Ges\u00e4\u00dfdehnung liegend (Figur 4)"] | Unterarmdehnung | Tiefe Hocke halten
- Schreibe die Namen im JSON mit echten Umlauten (UTF-8), exakt wie in den [exakt: ...]-Angaben.

UEBUNGSNAMEN (streng):
- Jeder Name bezeichnet GENAU EINE konkrete, sofort ausfuehrbare Uebung inkl. Equipment, z.B. "Kurzhantel-Rudern einarmig", "Langhantel-Kniebeuge", "Band Face Pulls", "Ring-Rudern".
- VERBOTEN in Namen: "Ersatz", "Alternative", "variabel", "wahlweise", "nach Wahl", "oder", "o.ae.", "aehnlich" sowie jede Formulierung, die dem Nutzer die Auswahl ueberlaesst. Entscheide dich selbst fuer eine Uebung.

JSON-FORMAT (exakt einhalten):
{"format":"trainings-block","version":2,"name":"<max 30 Zeichen>","description":"<1-2 Saetze, max 140 Zeichen: Fokus des Programms und fuer wen es passt>",
"settings":{"progressionSystem":"double_progression","deloadMultiplier":0.6,"requireAllSetsForIncrease":true,"allowAutoDecrease":true,"postDeloadReturnMultiplier":0.925},
"categories":{"<key>":{"label":"...","color":"amber|emerald|violet|sky|orange|rose|slate","rest":<Sekunden>,"reps":{"aufbau":[min,max],"intensiv":[min,max],"deload":[min,max]}}},
"weeks":[{"n":1,"phase":"aufbau|intensiv|deload","label":"...","rir":"2","sets":{"<category-key>":<anzahl>},"note":"..."}],
"days":[{"key":"A","weekday":"Montag","title":"...",
"warmup":[{"name":"<aus WARMUP-LISTE>","seconds":45}],"cooldown":[{"name":"<aus COOLDOWN-LISTE>","seconds":30}],
"exercises":[
 {"name":"...","category":"<key>","weighted":true,"increment":2.5,"startWeight":40,"garmin":"...","cue":"Technik-Hinweis","video":"YouTube-Suchbegriff"},
 {"name":"Klimmzug mit Zusatz","category":"<key>","weighted":true,"bodyweight":true,"increment":2.5,"startWeight":0},
 {"name":"Plank","category":"core","unit":"seconds","timerMode":"target","sets":3,"reps":[30,60],"target":"Sauber halten"},
 {"name":"Dead Hang","category":"core","unit":"seconds","timerMode":"max","sets":2,"target":"So lange wie sauber moeglich"},
 {"name":"Liegestuetze","category":"<key>","progressionMode":"reps","target":"3 x max"}
]}]}

AUSGABE KOMPAKT HALTEN (Zeitlimit!): JSON minifiziert ohne Zeilenumbrueche/Leerzeichen, "cue" max 5 Woerter, "video" und "garmin" weglassen, "note" max 8 Woerter. "description" ist Pflicht.

REGELN:
- "reps" in categories nur fuer Kategorien mit automatischer Gewichtssteigerung (Kraft/Hypertrophie). Core/Skill ohne "reps", dafuer "target" an der Uebung.
- Jede Zeituebung verwendet "unit":"seconds". Feste Zielzeiten verwenden zusaetzlich "timerMode":"target", "sets" und "reps":[minSekunden,maxSekunden]; der Timer stoppt am oberen Wert. Tests bis zum eigenen Abbruch verwenden "timerMode":"max" und einen klaren target-Hinweis.
- Jeder category-Wert (Uebungen UND weeks[].sets) muss unter categories definiert sein.
- weekday: echter deutscher Wochentag. Jeder day-key eindeutig.
- Grenzen: max 7 Tage, max 16 Wochen, max 12 Uebungen/Tag, max 10 Saetze je Kategorie/Woche, name max 30 Zeichen, weekday max 16 Zeichen.
- Sinnvolle Blockstruktur: 2-3 Aufbauwochen, dann Deload; ggf. Intensivierung. Startgewichte konservativ am Level orientieren.
- Baue evidenzbasiert: Grunduebungen zuerst, ausgewogenes Push/Pull/Beine-Verhaeltnis, realistisches Volumen.`;

const MAX_BODY_BYTES = 60_000;
const MAX_MESSAGES = 10;
const MAX_MESSAGE_CHARS = 16_000;
const MAX_TOTAL_MESSAGE_CHARS = 45_000;
const REQUEST_TIMEOUT_MS = 45_000;
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const source = new URL(origin);
    const target = new URL(request.url);
    return source.protocol === target.protocol && source.host === target.host;
  } catch {
    return false;
  }
}

function validConversation(messages) {
  if (!messages.length || messages[0].role !== "user" || messages[messages.length - 1].role !== "user") return false;
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].role === messages[i - 1].role) return false;
  }
  return true;
}

export default async (request) => {
  if (request.method !== "POST") return json(405, { error: "Methode nicht erlaubt" });
  if (!sameOrigin(request)) return json(403, { error: "Anfrage nicht erlaubt" });
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    return json(415, { error: "JSON erwartet" });
  }

  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > MAX_BODY_BYTES) return json(413, { error: "Anfrage ist zu groß" });

  let raw;
  try {
    raw = await request.text();
  } catch {
    return json(400, { error: "Anfrage konnte nicht gelesen werden" });
  }
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return json(413, { error: "Anfrage ist zu groß" });

  let payload;
  try {
    payload = JSON.parse(raw || "{}");
  } catch {
    return json(400, { error: "Ungültige JSON-Anfrage" });
  }

  const sourceMessages = Array.isArray(payload.messages) ? payload.messages.slice(-MAX_MESSAGES) : [];
  while (sourceMessages.length && sourceMessages[0] && sourceMessages[0].role === "assistant") sourceMessages.shift();
  let totalChars = 0;
  const messages = [];
  for (const message of sourceMessages) {
    if (!message || (message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string") {
      return json(400, { error: "Ungültiger Gesprächsverlauf" });
    }
    const content = message.content.trim();
    if (!content || content.length > MAX_MESSAGE_CHARS) return json(400, { error: "Nachricht ist ungültig oder zu lang" });
    totalChars += content.length;
    if (totalChars > MAX_TOTAL_MESSAGE_CHARS) return json(413, { error: "Gesprächsverlauf ist zu groß" });
    messages.push({ role: message.role, content });
  }
  if (!validConversation(messages)) return json(400, { error: "Ungültiger Gesprächsverlauf" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error("coach_configuration_error: missing_api_key");
    return json(503, { error: "KI-Coach ist momentan nicht verfügbar" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 3000, system: SYSTEM, messages }),
      signal: controller.signal
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("coach_provider_error", { status: res.status });
      return json(502, { error: "KI-Coach konnte das Programm nicht erstellen" });
    }
    const text = ((data && data.content) || []).map(c => c.type === "text" ? c.text : "").join("");
    if (!text) {
      console.error("coach_provider_error: empty_response");
      return json(502, { error: "KI-Coach hat keine verwertbare Antwort geliefert" });
    }
    return json(200, { text });
  } catch (error) {
    if (error && error.name === "AbortError") return json(504, { error: "KI-Anfrage hat zu lange gedauert. Bitte erneut versuchen." });
    console.error("coach_network_error", { name: error && error.name ? error.name : "unknown" });
    return json(502, { error: "KI-Coach ist momentan nicht erreichbar" });
  } finally {
    clearTimeout(timeout);
  }
};

export const config = {
  path: "/.netlify/functions/coach",
  method: "POST",
  rateLimit: {
    windowLimit: 6,
    windowSize: 180,
    aggregateBy: ["ip", "domain"]
  }
};
