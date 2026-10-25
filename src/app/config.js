var CAT_COLORS=["amber","emerald","violet","sky","orange","rose","slate"];
var LIMITS={maxDays:7,maxWeeks:16,maxExPerDay:12,maxSets:10,maxNameLen:30,maxLabelLen:16};
var WD_ABBR=["Mo","Di","Mi","Do","Fr","Sa","So"];
var WD_CANON=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
var WD_MAP={montag:0,mo:0,monday:0,dienstag:1,di:1,tuesday:1,mittwoch:2,mi:2,wednesday:2,donnerstag:3,do:3,thursday:3,freitag:4,fr:4,friday:4,samstag:5,sa:5,sonnabend:5,saturday:5,sonntag:6,so:6,sunday:6};
// ---------- Progression ----------
var PROGRESSION=window.SatzkraftProgression;
if(!PROGRESSION)throw new Error("Progressionsmodul konnte nicht geladen werden.");
var VALID_PROGRESSION_MODES=PROGRESSION.VALID_MODES;
var DEFAULT_WORKOUT_SETTINGS=PROGRESSION.DEFAULT_SETTINGS;
var GRACE=60*60*1000, HARDCAP=3*60*60*1000;
function ytUrl(q){return "https://www.youtube.com/results?search_query="+encodeURIComponent(q);}
