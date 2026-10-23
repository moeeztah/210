// 210 — offline workout tracker. Layout modeled on Strong / Hevy:
// templates -> live workout (Set | Previous | Weight | Reps | ✓) -> auto rest
// timer -> finish summary with PRs -> history, per-exercise records + charts.
// All data lives in localStorage; weights are stored internally in kg.

const STORE_KEY = '210-data-v1';
const KG_PER_LB = 0.45359237;
const PARTS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body'];
const REST_OPTIONS = [0, 30, 45, 60, 90, 120, 150, 180, 240, 300];
const SET_TYPES = { n: 'Normal', w: 'Warm-up', d: 'Drop set', f: 'Failure' };

// [name, body part, equipment, type]  type: weight = weight x reps, reps = reps only, time = duration
const LIBRARY = [
  ['Bench Press (Barbell)', 'Chest', 'Barbell', 'weight'],
  ['Incline Bench Press (Barbell)', 'Chest', 'Barbell', 'weight'],
  ['Decline Bench Press (Barbell)', 'Chest', 'Barbell', 'weight'],
  ['Bench Press (Dumbbell)', 'Chest', 'Dumbbell', 'weight'],
  ['Incline Bench Press (Dumbbell)', 'Chest', 'Dumbbell', 'weight'],
  ['Chest Fly (Dumbbell)', 'Chest', 'Dumbbell', 'weight'],
  ['Pec Deck (Machine)', 'Chest', 'Machine', 'weight'],
  ['Cable Crossover', 'Chest', 'Cable', 'weight'],
  ['Chest Press (Machine)', 'Chest', 'Machine', 'weight'],
  ['Push Up', 'Chest', 'Bodyweight', 'reps'],
  ['Chest Dip', 'Chest', 'Bodyweight', 'reps'],
  ['Deadlift (Barbell)', 'Back', 'Barbell', 'weight'],
  ['Bent Over Row (Barbell)', 'Back', 'Barbell', 'weight'],
  ['Pendlay Row (Barbell)', 'Back', 'Barbell', 'weight'],
  ['T-Bar Row', 'Back', 'Barbell', 'weight'],
  ['Row (Dumbbell)', 'Back', 'Dumbbell', 'weight'],
  ['Seated Row (Cable)', 'Back', 'Cable', 'weight'],
  ['Lat Pulldown (Cable)', 'Back', 'Cable', 'weight'],
  ['Pull Up', 'Back', 'Bodyweight', 'reps'],
  ['Chin Up', 'Back', 'Bodyweight', 'reps'],
  ['Pull Up (Weighted)', 'Back', 'Bodyweight', 'weight'],
  ['Straight Arm Pulldown (Cable)', 'Back', 'Cable', 'weight'],
  ['Rack Pull (Barbell)', 'Back', 'Barbell', 'weight'],
  ['Back Extension', 'Back', 'Bodyweight', 'reps'],
  ['Squat (Barbell)', 'Legs', 'Barbell', 'weight'],
  ['Front Squat (Barbell)', 'Legs', 'Barbell', 'weight'],
  ['Hack Squat (Machine)', 'Legs', 'Machine', 'weight'],
  ['Leg Press', 'Legs', 'Machine', 'weight'],
  ['Romanian Deadlift (Barbell)', 'Legs', 'Barbell', 'weight'],
  ['Romanian Deadlift (Dumbbell)', 'Legs', 'Dumbbell', 'weight'],
  ['Bulgarian Split Squat (Dumbbell)', 'Legs', 'Dumbbell', 'weight'],
  ['Lunge (Dumbbell)', 'Legs', 'Dumbbell', 'weight'],
  ['Goblet Squat (Kettlebell)', 'Legs', 'Kettlebell', 'weight'],
  ['Leg Extension (Machine)', 'Legs', 'Machine', 'weight'],
  ['Lying Leg Curl (Machine)', 'Legs', 'Machine', 'weight'],
  ['Seated Leg Curl (Machine)', 'Legs', 'Machine', 'weight'],
  ['Hip Thrust (Barbell)', 'Legs', 'Barbell', 'weight'],
  ['Hip Abduction (Machine)', 'Legs', 'Machine', 'weight'],
  ['Standing Calf Raise (Machine)', 'Legs', 'Machine', 'weight'],
  ['Seated Calf Raise (Machine)', 'Legs', 'Machine', 'weight'],
  ['Overhead Press (Barbell)', 'Shoulders', 'Barbell', 'weight'],
  ['Shoulder Press (Dumbbell)', 'Shoulders', 'Dumbbell', 'weight'],
  ['Shoulder Press (Machine)', 'Shoulders', 'Machine', 'weight'],
  ['Arnold Press (Dumbbell)', 'Shoulders', 'Dumbbell', 'weight'],
  ['Lateral Raise (Dumbbell)', 'Shoulders', 'Dumbbell', 'weight'],
  ['Lateral Raise (Cable)', 'Shoulders', 'Cable', 'weight'],
  ['Front Raise (Dumbbell)', 'Shoulders', 'Dumbbell', 'weight'],
  ['Reverse Fly (Dumbbell)', 'Shoulders', 'Dumbbell', 'weight'],
  ['Face Pull (Cable)', 'Shoulders', 'Cable', 'weight'],
  ['Upright Row (Barbell)', 'Shoulders', 'Barbell', 'weight'],
  ['Shrug (Dumbbell)', 'Shoulders', 'Dumbbell', 'weight'],
  ['Bicep Curl (Barbell)', 'Arms', 'Barbell', 'weight'],
  ['Bicep Curl (Dumbbell)', 'Arms', 'Dumbbell', 'weight'],
  ['Hammer Curl (Dumbbell)', 'Arms', 'Dumbbell', 'weight'],
  ['Preacher Curl (EZ Bar)', 'Arms', 'EZ Bar', 'weight'],
  ['Incline Curl (Dumbbell)', 'Arms', 'Dumbbell', 'weight'],
  ['Bicep Curl (Cable)', 'Arms', 'Cable', 'weight'],
  ['Triceps Pushdown (Cable)', 'Arms', 'Cable', 'weight'],
  ['Overhead Triceps Extension (Cable)', 'Arms', 'Cable', 'weight'],
  ['Skullcrusher (EZ Bar)', 'Arms', 'EZ Bar', 'weight'],
  ['Close Grip Bench Press (Barbell)', 'Arms', 'Barbell', 'weight'],
  ['Triceps Dip', 'Arms', 'Bodyweight', 'reps'],
  ['Wrist Curl (Dumbbell)', 'Arms', 'Dumbbell', 'weight'],
  ['Plank', 'Core', 'Bodyweight', 'time'],
  ['Side Plank', 'Core', 'Bodyweight', 'time'],
  ['Crunch', 'Core', 'Bodyweight', 'reps'],
  ['Cable Crunch', 'Core', 'Cable', 'weight'],
  ['Hanging Leg Raise', 'Core', 'Bodyweight', 'reps'],
  ['Ab Wheel Rollout', 'Core', 'Bodyweight', 'reps'],
  ['Russian Twist', 'Core', 'Bodyweight', 'reps'],
  ['Running', 'Cardio', 'Other', 'time'],
  ['Treadmill', 'Cardio', 'Machine', 'time'],
  ['Cycling', 'Cardio', 'Machine', 'time'],
  ['Rowing (Machine)', 'Cardio', 'Machine', 'time'],
  ['Stair Climber', 'Cardio', 'Machine', 'time'],
  ['Elliptical', 'Cardio', 'Machine', 'time'],
  ['Jump Rope', 'Cardio', 'Other', 'time'],
  ['Power Clean (Barbell)', 'Full Body', 'Barbell', 'weight'],
  ['Clean and Jerk (Barbell)', 'Full Body', 'Barbell', 'weight'],
  ['Kettlebell Swing', 'Full Body', 'Kettlebell', 'weight'],
  ["Farmer's Walk (Dumbbell)", 'Full Body', 'Dumbbell', 'weight'],
  ['Thruster (Barbell)', 'Full Body', 'Barbell', 'weight'],
  ['Burpee', 'Full Body', 'Bodyweight', 'reps'],
].map(([name, part, equip, type]) => ({ id: slug(name), name, part, equip, type }));

// ---------- helpers ----------
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const $ = (sel, root = document) => root.querySelector(sel);
const clone = (o) => JSON.parse(JSON.stringify(o));

const unit = () => data.settings.unit;
function toDisp(kg) {
  if (kg == null) return '';
  const v = unit() === 'kg' ? kg : kg / KG_PER_LB;
  return String(Math.round(v * 10) / 10);
}
function fromDisp(s) {
  const v = parseFloat(String(s).replace(',', '.'));
  if (!isFinite(v)) return null;
  return unit() === 'kg' ? v : v * KG_PER_LB;
}
function fmtNum(n) { return Math.round(n).toLocaleString(); }
function fmtVol(kg) { return `${fmtNum(unit() === 'kg' ? kg : kg / KG_PER_LB)} ${unit()}`; }
function fmtDur(sec) {
  if (sec == null) return '';
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
function fmtLong(ms) {
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}
function parseTime(s) {
  s = String(s).trim();
  if (!s) return null;
  if (s.includes(':')) {
    const parts = s.split(':').map((p) => parseInt(p, 10) || 0);
    return parts.reduce((acc, p) => acc * 60 + p, 0);
  }
  const v = parseInt(s, 10);
  return isFinite(v) ? v : null;
}
function fmtDate(ts, opts = { weekday: 'short', month: 'short', day: 'numeric' }) { return new Date(ts).toLocaleDateString(undefined, opts); }
function fmtTime(ts) { return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
function ago(ts) {
  const d = Math.floor((startOfDay(Date.now()) - startOfDay(ts)) / 86400000);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} wk ago`;
  return fmtDate(ts, { month: 'short', day: 'numeric', year: 'numeric' });
}
function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
function startOfWeek(ts) { const d = new Date(startOfDay(ts)); d.setDate(d.getDate() - d.getDay()); return d.getTime(); }
const e1rm = (w, r) => (w > 0 && r > 0 ? (r === 1 ? w : w * (1 + r / 30)) : 0);

// ---------- storage ----------
function seedTemplates() {
  const t = (name, items) => ({ id: uid(), name, exercises: items.map(([id, n, r]) => ({ exId: id, rest: null, sets: Array.from({ length: n }, () => ({ type: 'n', w: null, r, t: null })) })) });
  return [
    t('Push Day', [['bench-press-barbell', 4, 8], ['incline-bench-press-dumbbell', 3, 10], ['overhead-press-barbell', 3, 8], ['lateral-raise-dumbbell', 3, 15], ['triceps-pushdown-cable', 3, 12]]),
    t('Pull Day', [['deadlift-barbell', 3, 5], ['pull-up', 3, 8], ['bent-over-row-barbell', 3, 8], ['face-pull-cable', 3, 15], ['bicep-curl-dumbbell', 3, 12]]),
    t('Leg Day', [['squat-barbell', 4, 6], ['romanian-deadlift-barbell', 3, 8], ['leg-press', 3, 12], ['lying-leg-curl-machine', 3, 12], ['standing-calf-raise-machine', 4, 15]]),
    t('Full Body', [['squat-barbell', 3, 5], ['bench-press-barbell', 3, 5], ['bent-over-row-barbell', 3, 8], ['overhead-press-barbell', 2, 8], ['plank', 2, null]]),
  ];
}
function defaults() {
  return { version: 1, workouts: [], templates: seedTemplates(), customExercises: [], settings: { unit: 'lbs', rest: 90, restByEx: {}, overload: true, weeklyGoal: 4, repRange: {} }, active: null };
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (err) {
    console.warn('Could not load saved data', err);
  }
  return defaults();
}
function normalize(d) {
  const base = defaults();
  const out = Object.assign(base, d);
  out.settings = Object.assign(defaults().settings, d.settings || {});
  out.workouts = (out.workouts || []).sort((a, b) => b.start - a.start);
  return out;
}
let saveFailed = false;
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    saveFailed = false;
  } catch (err) {
    if (!saveFailed) toast('Could not save — storage is unavailable. Export a backup!');
    saveFailed = true;
  }
}

let data = load();

// ---------- exercises ----------
let exMap = new Map();
function rebuildExMap() { exMap = new Map([...LIBRARY, ...data.customExercises].map((e) => [e.id, e])); }
rebuildExMap();
const getEx = (id) => exMap.get(id) || { id, name: 'Unknown exercise', part: 'Other', equip: '', type: 'weight' };
const allExercises = () => [...exMap.values()].sort((a, b) => a.name.localeCompare(b.name));
const restFor = (exId) => data.settings.restByEx[exId] ?? data.settings.rest;

function historyFor(exId, beforeTs = Infinity) {
  const out = [];
  for (const w of data.workouts) {
    if (w.start >= beforeTs) continue;
    for (const e of w.exercises) if (e.exId === exId) out.push({ workout: w, sets: e.sets });
  }
  return out;
}
function previousSets(exId, beforeTs) {
  const h = historyFor(exId, beforeTs);
  return h.length ? h[0].sets : [];
}
function bestsOf(sets) {
  const b = { heaviest: 0, e1rm: 0, vol: 0, reps: 0, time: 0 };
  for (const s of sets) {
    if (s.type === 'w') continue;
    const w = s.w || 0, r = s.r || 0, t = s.t || 0;
    b.heaviest = Math.max(b.heaviest, r > 0 ? w : 0);
    b.e1rm = Math.max(b.e1rm, e1rm(w, r));
    b.vol = Math.max(b.vol, w * r);
    b.reps = Math.max(b.reps, r);
    b.time = Math.max(b.time, t);
  }
  return b;
}
function fmtSet(s, type) {
  if (type === 'time') return fmtDur(s.t);
  if (type === 'reps') return `${s.r ?? 0} reps`;
  return `${toDisp(s.w ?? 0)} ${unit()} × ${s.r ?? 0}`;
}
function bestSet(sets, type) {
  let best = null, score = -1;
  for (const s of sets) {
    const sc = type === 'time' ? s.t || 0 : type === 'reps' ? s.r || 0 : e1rm(s.w || 0, s.r || 0) || (s.r || 0) / 1000;
    if (sc > score) { score = sc; best = s; }
  }
  return best;
}
function workoutVolume(w) {
  let v = 0;
  for (const e of w.exercises) for (const s of e.sets) if (s.type !== 'w') v += (s.w || 0) * (s.r || 0);
  return v;
}
const setCount = (w) => w.exercises.reduce((n, e) => n + e.sets.length, 0);
function weekStreak() {
  const wkSet = new Set(data.workouts.map((w) => startOfWeek(w.start)));
  const cur = new Date(startOfWeek(Date.now()));
  if (!wkSet.has(cur.getTime())) cur.setDate(cur.getDate() - 7); // this week isn't over yet
  let n = 0;
  while (wkSet.has(startOfWeek(cur.getTime()))) { n++; cur.setDate(cur.getDate() - 7); }
  return n;
}

// ---------- progressive overload (double progression) ----------
// Each exercise has a rep range. Hit the top of the range on every working set
// -> add weight and drop back to the bottom. Otherwise -> same weight, +1 rep.
const REP_RANGES = [[3, 5], [5, 8], [6, 10], [8, 12], [10, 15], [12, 20]];
const working = (sets) => sets.filter((s) => s.type !== 'w');

function incrementKg(ex) {
  const big = ['Legs', 'Full Body', 'Back'].includes(ex.part) && ['Barbell', 'Machine'].includes(ex.equip);
  return unit() === 'kg' ? (big ? 5 : 2.5) : (big ? 10 : 5) * KG_PER_LB;
}
function defaultRange(sets) {
  const reps = working(sets).map((s) => s.r || 0).filter(Boolean).sort((a, b) => a - b);
  if (!reps.length) return [8, 12];
  const med = reps[Math.floor(reps.length / 2)];
  return [med, med + (med <= 6 ? 2 : med <= 12 ? 4 : 5)];
}
function rangeFor(exId) {
  if (data.settings.repRange[exId]) return data.settings.repRange[exId];
  const h = historyFor(exId);
  return defaultRange(h.length ? h[h.length - 1].sets : []); // baseline = first session ever logged
}

function suggestFor(exId, beforeTs) {
  const ex = getEx(exId);
  const last = working(previousSets(exId, beforeTs));
  if (!last.length) return null;
  if (ex.type === 'time') {
    const sets = last.map((s) => ({ t: Math.ceil(((s.t || 0) * 1.1) / 5) * 5 }));
    return { kind: 'up', sets, head: `Hold ${fmtDur(Math.max(...sets.map((s) => s.t)))}`, why: '+10% time over last session' };
  }
  if (ex.type === 'reps') {
    const sets = last.map((s) => ({ r: (s.r || 0) + 1 }));
    return { kind: 'reps', sets, head: `${sets.map((s) => s.r).join(' / ')} reps`, why: '+1 rep on every set vs last time' };
  }
  const [lo, hi] = rangeFor(exId);
  const topW = Math.max(...last.map((s) => s.w || 0));
  const top = last.filter((s) => Math.abs((s.w || 0) - topW) < 0.01);
  if (topW > 0 && top.every((s) => (s.r || 0) >= hi)) {
    const nw = topW + incrementKg(ex);
    return {
      kind: 'up',
      sets: last.map(() => ({ w: nw, r: lo })),
      head: `${toDisp(nw)} ${unit()} × ${lo}`,
      why: `You hit ${hi} reps on every set — add ${toDisp(incrementKg(ex))} ${unit()}`,
    };
  }
  const sets = last.map((s) => ({ w: s.w, r: Math.min(hi, (s.r || 0) + 1) }));
  const minR = Math.min(...sets.map((s) => s.r));
  return {
    kind: 'reps',
    sets,
    head: `${toDisp(topW)} ${unit()} × ${minR === hi ? hi : `${minR}+`}`,
    why: `Add a rep — reach ${hi} on every set, then go up in weight (range ${lo}–${hi})`,
  };
}

// Best e1RM (or reps/time) hasn't beaten the session before the last 3 -> stalled.
function stallFor(exId) {
  const ex = getEx(exId);
  const h = historyFor(exId).slice(0, 4);
  if (h.length < 4) return null;
  const score = (sets) => { const b = bestsOf(sets); return ex.type === 'weight' ? b.e1rm : ex.type === 'reps' ? b.reps : b.time; };
  const base = score(h[3].sets);
  if (h.slice(0, 3).some((x) => score(x.sets) > base + 1e-6)) return null;
  if (ex.type !== 'weight') return { why: 'No progress in 3 sessions — try an extra set or a harder variation' };
  const w = Math.max(...working(h[0].sets).map((s) => s.w || 0)) * 0.9;
  return { why: `No progress in 3 sessions — deload to ~${toDisp(w)} ${unit()} (−10%) and build back up` };
}

// Did this exercise beat the previous session (any of: best e1RM, reps, time, total volume)?
function beatLast(e, beforeTs) {
  const prev = previousSets(e.exId, beforeTs);
  if (!prev.length) return null;
  const a = bestsOf(e.sets), b = bestsOf(prev);
  const vol = (sets) => working(sets).reduce((v, s) => v + (s.w || 0) * (s.r || 0) + (s.r || 0) * 0.001 + (s.t || 0) * 0.001, 0);
  return a.heaviest > b.heaviest + 1e-6 || a.e1rm > b.e1rm + 1e-6 || a.reps > b.reps || a.time > b.time || vol(e.sets) > vol(prev) + 1e-6;
}

const PR_KINDS = {
  weight: [['heaviest', 'Heaviest weight', (v) => `${toDisp(v)} ${unit()}`], ['e1rm', 'Best est. 1RM', (v) => `${toDisp(v)} ${unit()}`], ['vol', 'Best set volume', (v) => fmtVol(v)]],
  reps: [['reps', 'Most reps', (v) => `${v} reps`]],
  time: [['time', 'Longest', (v) => fmtDur(v)]],
};
function computePRs(w) {
  const prs = [];
  for (const e of w.exercises) {
    const type = getEx(e.exId).type;
    const priorSets = historyFor(e.exId, w.start).flatMap((h) => h.sets);
    if (!priorSets.length) continue; // first time doing it -> baseline, not a PR
    const prior = bestsOf(priorSets), now = bestsOf(e.sets);
    for (const [key] of PR_KINDS[type]) {
      if (now[key] > prior[key] + 1e-6) prs.push({ exId: e.exId, kind: key, value: now[key] });
    }
  }
  return prs;
}
function fmtPR(pr) {
  const type = getEx(pr.exId).type;
  const k = PR_KINDS[type].find(([key]) => key === pr.kind);
  return k ? { label: k[1], value: k[2](pr.value) } : { label: pr.kind, value: pr.value };
}

// ---------- UI primitives ----------
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2400);
}

let modalClose = null;
function openModal(html, { tall = false, onClose } = {}) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-box ${tall ? 'tall' : ''}">${html}</div>`;
  m.hidden = false;
  modalClose = onClose || null;
  return m.firstElementChild;
}
function closeModal() {
  const m = $('#modal');
  m.hidden = true;
  m.innerHTML = '';
  const cb = modalClose;
  modalClose = null;
  if (cb) cb();
}
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

function actionSheet(title, items) {
  const box = openModal(`
    ${title ? `<h3>${esc(title)}</h3>` : ''}
    <div class="action-list">
      ${items.map((it, i) => `<button class="btn ${it.danger ? 'danger' : ''} ${it.on ? 'on' : ''}" data-i="${i}">${esc(it.label)}</button>`).join('')}
      <button class="btn" data-i="cancel">Cancel</button>
    </div>`);
  box.querySelectorAll('[data-i]').forEach((b) =>
    b.addEventListener('click', () => {
      closeModal();
      if (b.dataset.i !== 'cancel') items[+b.dataset.i].run();
    })
  );
}

function confirmBox(title, msg, okLabel = 'OK', danger = false) {
  return new Promise((resolve) => {
    const box = openModal(`
      <h3>${esc(title)}</h3><p>${esc(msg)}</p>
      <div class="btn-row"><button class="btn" data-r="0">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-r="1">${esc(okLabel)}</button></div>`,
      { onClose: () => resolve(false) });
    box.querySelectorAll('[data-r]').forEach((b) =>
      b.addEventListener('click', () => {
        modalClose = null;
        closeModal();
        resolve(b.dataset.r === '1');
      })
    );
  });
}

function promptBox(title, value, okLabel = 'Save') {
  return new Promise((resolve) => {
    const box = openModal(`
      <h3>${esc(title)}</h3>
      <label class="field"><input id="promptInput" value="${esc(value)}" /></label>
      <div class="btn-row"><button class="btn" data-r="0">Cancel</button><button class="btn primary" data-r="1">${esc(okLabel)}</button></div>`,
      { onClose: () => resolve(null) });
    const input = $('#promptInput', box);
    input.focus();
    input.select();
    const done = (ok) => { modalClose = null; const v = input.value.trim(); closeModal(); resolve(ok && v ? v : null); };
    box.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => done(b.dataset.r === '1')));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(true); });
  });
}

// ---------- charts ----------
function lineChart(points, fmtY) {
  if (points.length < 2) return `<div class="empty small">Log this exercise in at least 2 workouts to see a chart.</div>`;
  const W = 320, H = 150, pl = 36, pr = 10, pt = 10, pb = 22;
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (y0 === y1) { y0 -= 1; y1 += 1; }
  const pad = (y1 - y0) * 0.1; y0 -= pad; y1 += pad;
  const sx = (x) => pl + ((x - x0) / (x1 - x0 || 1)) * (W - pl - pr);
  const sy = (y) => pt + (1 - (y - y0) / (y1 - y0)) * (H - pt - pb);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${sx(x1).toFixed(1)},${H - pb} L${sx(x0).toFixed(1)},${H - pb} Z`;
  const ticks = [y1 - pad, (y0 + y1) / 2, y0 + pad];
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img">
    ${ticks.map((t) => `<line class="axis" x1="${pl}" x2="${W - pr}" y1="${sy(t)}" y2="${sy(t)}" stroke-dasharray="2 4"/><text x="${pl - 4}" y="${sy(t) + 3}" text-anchor="end">${esc(fmtY(t))}</text>`).join('')}
    <path class="area" d="${area}"/><path class="line" d="${d}"/>
    ${points.map((p) => `<circle class="pt" cx="${sx(p.x)}" cy="${sy(p.y)}" r="3"/>`).join('')}
    <text x="${pl}" y="${H - 6}">${fmtDate(x0, { month: 'short', day: 'numeric' })}</text>
    <text x="${W - pr}" y="${H - 6}" text-anchor="end">${fmtDate(x1, { month: 'short', day: 'numeric' })}</text>
  </svg></div>`;
}
function barChart(values, labels) {
  const W = 320, H = 130, pb = 20, pt = 14, gap = 6;
  const max = Math.max(1, ...values);
  const bw = (W - gap * (values.length - 1)) / values.length;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img">
    ${values.map((v, i) => {
      const h = v ? Math.max(4, (v / max) * (H - pb - pt)) : 3;
      const x = i * (bw + gap), y = H - pb - h;
      return `<rect class="bar ${v ? '' : 'zero'}" x="${x}" y="${y}" width="${bw}" height="${h}" rx="3"/>
        ${v ? `<text x="${x + bw / 2}" y="${y - 3}" text-anchor="middle">${v}</text>` : ''}
        ${labels[i] ? `<text x="${i === values.length - 1 ? x + bw : x + bw / 2}" y="${H - 5}" text-anchor="${i === values.length - 1 ? 'end' : 'middle'}">${esc(labels[i])}</text>` : ''}`;
    }).join('')}
  </svg></div>`;
}

// Front + back body silhouettes; each region is tagged with the body part it lights up for.
const BODY_FRONT = [
  ['Shoulders', 'e', 36, 52, 11, 9], ['Shoulders', 'e', 84, 52, 11, 9],
  ['Chest', 'r', 42, 45, 17, 21, 6], ['Chest', 'r', 61, 45, 17, 21, 6],
  ['Arms', 'r', 21, 61, 11, 27, 5], ['Arms', 'r', 88, 61, 11, 27, 5],
  ['Arms', 'r', 17, 91, 10, 27, 5], ['Arms', 'r', 93, 91, 10, 27, 5],
  ['Core', 'r', 46, 69, 28, 41, 7],
  ['Legs', 'r', 40, 116, 18, 52, 8], ['Legs', 'r', 62, 116, 18, 52, 8],
  ['Legs', 'r', 42, 172, 14, 40, 6], ['Legs', 'r', 64, 172, 14, 40, 6],
];
const BODY_BACK = [
  ['Back', 'r', 46, 37, 28, 14, 6],
  ['Shoulders', 'e', 36, 52, 11, 9], ['Shoulders', 'e', 84, 52, 11, 9],
  ['Back', 'r', 40, 52, 40, 40, 9], ['Back', 'r', 48, 93, 24, 16, 5],
  ['Arms', 'r', 21, 61, 11, 27, 5], ['Arms', 'r', 88, 61, 11, 27, 5],
  ['Arms', 'r', 17, 91, 10, 27, 5], ['Arms', 'r', 93, 91, 10, 27, 5],
  ['Legs', 'r', 41, 111, 38, 22, 10],
  ['Legs', 'r', 40, 135, 18, 36, 8], ['Legs', 'r', 62, 135, 18, 36, 8],
  ['Legs', 'r', 42, 175, 14, 37, 6], ['Legs', 'r', 64, 175, 14, 37, 6],
];
function muscleMap(counts, legend = true) {
  const full = counts['Full Body'] || 0;
  const heat = (p) => {
    const n = (counts[p] || 0) + full * 0.5;
    return n <= 0 ? null : n < 4 ? 0.45 : n < 10 ? 0.75 : 1;
  };
  const fig = (regions, label) => `<svg viewBox="0 0 120 232" role="img" aria-label="${label} muscle map">
    <circle class="base" cx="60" cy="19" r="13"/><rect class="base" x="54" y="30" width="12" height="9" rx="3"/>
    <circle class="base" cx="22" cy="124" r="5"/><circle class="base" cx="98" cy="124" r="5"/>
    <ellipse class="base" cx="49" cy="218" rx="8" ry="5"/><ellipse class="base" cx="71" cy="218" rx="8" ry="5"/>
    ${regions.map(([p, shape, x, y, w, h, r]) => {
      const a = heat(p);
      const fill = a ? `style="fill:rgba(229,22,31,${a})"` : '';
      return shape === 'e' ? `<ellipse class="m" cx="${x}" cy="${y}" rx="${w}" ry="${h}" ${fill}/>` : `<rect class="m" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${fill}/>`;
    }).join('')}
    <text class="lbl" x="60" y="231">${label}</text>
  </svg>`;
  return `<div class="muscle-map">${fig(BODY_FRONT, 'FRONT')}${fig(BODY_BACK, 'BACK')}</div>
    ${legend ? '' : '<!--'}<div class="mm-legend"><span><i style="background:rgba(229,22,31,.45)"></i>1–3 sets</span><span><i style="background:rgba(229,22,31,.75)"></i>4–9</span><span><i style="background:rgb(229,22,31)"></i>10+</span></div>${legend ? '' : '-->'}`;
}
function setsByPart(workouts) {
  const out = {};
  for (const w of workouts) for (const e of w.exercises) {
    const p = getEx(e.exId).part;
    out[p] = (out[p] || 0) + working(e.sets).length;
  }
  return out;
}
function ring(value, goal, label) {
  const r = 38, c = 2 * Math.PI * r, pct = Math.min(1, goal ? value / goal : 0);
  return `<svg class="ring" viewBox="0 0 92 92"><circle class="track" cx="46" cy="46" r="${r}" fill="none" stroke-width="9"/>
    <circle class="fill" cx="46" cy="46" r="${r}" fill="none" stroke-width="9" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 46 46)"/>
    <text x="46" y="48" text-anchor="middle" font-size="22">${value}/${goal}</text><text class="sub" x="46" y="62" text-anchor="middle">${esc(label)}</text></svg>`;
}
function sparkline(vals) {
  if (vals.length < 2) return '<svg></svg>';
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${((i / (vals.length - 1)) * 86 + 2).toFixed(1)},${(26 - ((v - min) / span) * 22).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 90 28"><path d="${d}"/></svg>`;
}
const pctChange = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);

// ---------- routing ----------
const route = { tab: 'workout', stack: [] };
const TAB_PAGES = { workout: pageWorkout, history: pageHistory, exercises: pageExercises, progress: pageProgress };

function go(tab) {
  route.tab = tab;
  route.stack = [];
  render();
  window.scrollTo(0, 0);
}
function push(pageFn, ...args) {
  route.stack.push({ fn: pageFn, args });
  render();
  window.scrollTo(0, 0);
}
function back() {
  route.stack.pop();
  render();
}
$('#backBtn').addEventListener('click', back);
document.querySelectorAll('.tabbar .tab').forEach((b) => b.addEventListener('click', () => go(b.dataset.tab)));

function render() {
  const top = route.stack[route.stack.length - 1];
  const page = top ? top.fn(...top.args) : TAB_PAGES[route.tab]();
  $('#headerTitle').textContent = page.title;
  $('#backBtn').hidden = !top;
  $('#headerRight').innerHTML = page.right || '';
  $('#app').innerHTML = page.html;
  document.querySelectorAll('.tabbar .tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === route.tab));
  if (page.after) page.after();
  renderActiveChrome();
}

// ---------- page: workout (start) ----------
function pageWorkout() {
  const lastByTpl = {};
  for (const w of data.workouts) if (w.templateId && !lastByTpl[w.templateId]) lastByTpl[w.templateId] = w.start;
  const tplCards = data.templates.map((t) => `
    <button class="card" data-act="tpl-open" data-id="${t.id}">
      <div class="tpl-name">${esc(t.name)}</div>
      <div class="tpl-sub">${esc(t.exercises.map((e) => getEx(e.exId).name).join(', ') || 'No exercises')}</div>
      ${lastByTpl[t.id] ? `<div class="small dim" style="margin-top:6px">⏱ ${ago(lastByTpl[t.id])}</div>` : ''}
    </button>`).join('');
  const wk = startOfWeek(Date.now());
  const lastWk = wk - 7 * 86400000;
  const thisW = data.workouts.filter((w) => w.start >= wk);
  const prevW = data.workouts.filter((w) => w.start >= lastWk && w.start < wk);
  const volNow = thisW.reduce((v, w) => v + workoutVolume(w), 0);
  const volChg = pctChange(volNow, prevW.reduce((v, w) => v + workoutVolume(w), 0));
  return {
    title: 'Workout',
    html: `
      <div class="card hero">
        ${ring(thisW.length, data.settings.weeklyGoal, 'THIS WEEK')}
        <div class="hero-stats">
          <div><div class="k">Streak</div><div class="v">🔥 ${weekStreak()} week${weekStreak() === 1 ? '' : 's'}</div></div>
          <div><div class="k">Volume this week</div><div class="v">${fmtVol(volNow)} ${volChg != null ? `<span class="small ${volChg >= 0 ? 'up' : 'down'}">${volChg >= 0 ? '▲' : '▼'} ${Math.abs(volChg)}%</span>` : ''}</div></div>
        </div>
      </div>
      <h2 class="section">Quick start</h2>
      <button class="btn primary block" data-act="start-empty">Start an Empty Workout</button>
      <h2 class="section">My templates <button class="link-btn" data-act="tpl-new">+ Template</button></h2>
      ${data.templates.length ? `<div class="tpl-grid">${tplCards}</div>` : `<div class="empty">No templates yet. Create one, or finish a workout and save it as a template.</div>`}`,
  };
}

function templatePreview(id) {
  const t = data.templates.find((x) => x.id === id);
  if (!t) return;
  const box = openModal(`
    <h3>${esc(t.name)}</h3>
    <div class="stack" style="margin-bottom:16px">
      ${t.exercises.map((e) => `<div class="row"><span>${e.sets.length} × ${esc(getEx(e.exId).name)}</span><span class="small dim">${esc(getEx(e.exId).part)}</span></div>`).join('') || '<div class="dim">No exercises</div>'}
    </div>
    <button class="btn primary block" data-r="start">Start Workout</button>
    <div class="btn-row" style="margin-top:10px">
      <button class="btn" data-r="edit">Edit</button>
      <button class="btn" data-r="dup">Duplicate</button>
      <button class="btn danger" data-r="del">Delete</button>
    </div>`);
  box.querySelector('[data-r="start"]').onclick = () => { closeModal(); startWorkout(t, t.id); };
  box.querySelector('[data-r="edit"]').onclick = () => { closeModal(); tplDraft = null; push(pageTemplateEditor, t.id); };
  box.querySelector('[data-r="dup"]').onclick = () => {
    closeModal();
    data.templates.push({ ...clone(t), id: uid(), name: `${t.name} (copy)` });
    save();
    render();
  };
  box.querySelector('[data-r="del"]').onclick = async () => {
    closeModal();
    if (await confirmBox('Delete template?', `"${t.name}" will be removed. Your workout history is kept.`, 'Delete', true)) {
      data.templates = data.templates.filter((x) => x.id !== id);
      save();
      render();
    }
  };
}

function defaultWorkoutName() {
  const h = new Date().getHours();
  return h < 12 ? 'Morning Workout' : h < 17 ? 'Afternoon Workout' : 'Evening Workout';
}

async function startWorkout(src, templateId = null) {
  if (data.active) {
    const ok = await confirmBox('Workout in progress', 'Discard your current workout and start a new one?', 'Discard & start', true);
    if (!ok) return;
  }
  data.active = {
    id: uid(),
    name: src ? src.name : defaultWorkoutName(),
    start: Date.now(),
    note: '',
    templateId,
    restTimer: null,
    exercises: (src ? src.exercises : []).map((e) => ({
      exId: e.exId,
      note: '',
      rest: e.rest ?? restFor(e.exId),
      sets: e.sets.map((s) => ({ type: s.type || 'n', w: null, r: null, t: null, hw: s.w ?? null, hr: s.r ?? null, ht: s.t ?? null, done: false })),
    })),
  };
  save();
  sheetOpen = true;
  renderActiveChrome();
  renderSheet();
}

// ---------- editor (shared by live workout + template editor) ----------
let sheetOpen = false;
let tplDraft = null;

function docOf(el) {
  const host = el.closest('[data-doc]');
  return host && host.dataset.doc === 'tpl' ? tplDraft : data.active;
}
function rerenderDoc(doc) {
  if (doc === tplDraft) renderTplEditorBody();
  else renderSheet();
}
function persist(doc) { if (doc !== tplDraft) save(); }

function setLabel(sets, i) {
  const s = sets[i];
  if (s.type !== 'n') return s.type.toUpperCase();
  let n = 0;
  for (let j = 0; j <= i; j++) if (sets[j].type === 'n') n++;
  return String(n);
}

function exerciseCards(doc, mode) {
  const live = mode === 'workout';
  return doc.exercises.map((e, ei) => {
    const ex = getEx(e.exId);
    const single = ex.type !== 'weight';
    const prev = previousSets(e.exId, live ? doc.start : Infinity);
    const cls = `set-row ${single ? 'single' : ''} ${live ? '' : 'no-check'}`;
    const valCol = ex.type === 'time' ? 'Time' : 'Reps';
    const sugg = live && data.settings.overload ? suggestFor(e.exId, doc.start) : null;
    const stall = live && data.settings.overload ? stallFor(e.exId) : null;
    // Map suggestion sets onto this workout's working (non-warm-up) sets, in order.
    const hints = [];
    let wi = 0;
    for (const s of e.sets) hints.push(s.type === 'w' || !sugg ? null : sugg.sets[Math.min(wi++, sugg.sets.length - 1)]);
    const rows = e.sets.map((s, si) => {
      const p = prev[si];
      const above = si > 0 ? e.sets[si - 1] : null;
      const ph = (f) => {
        const v = hints[si]?.[f] ?? p?.[f] ?? s['h' + f] ?? above?.[f] ?? null;
        return v == null ? '' : f === 'w' ? toDisp(v) : f === 't' ? fmtDur(v) : String(v);
      };
      const val = (f) => (s[f] == null ? '' : f === 'w' ? toDisp(s[f]) : f === 't' ? fmtDur(s[f]) : String(s[f]));
      return `<div class="${cls} ${s.done ? 'done' : ''}" data-ei="${ei}" data-si="${si}">
        <button class="set-num ${s.type}" data-act="set-type">${setLabel(e.sets, si)}</button>
        <button class="prev" data-act="use-prev">${p ? esc(fmtSet(p, ex.type)) : '—'}</button>
        ${ex.type === 'weight' ? `<input data-f="w" inputmode="decimal" value="${val('w')}" placeholder="${ph('w')}" />` : ''}
        ${ex.type === 'time'
          ? `<input data-f="t" inputmode="numeric" value="${val('t')}" placeholder="${ph('t') || 'm:ss'}" />`
          : `<input data-f="r" inputmode="numeric" value="${val('r')}" placeholder="${ph('r')}" />`}
        ${live ? `<button class="check" data-act="toggle-set" aria-label="Complete set">✓</button>` : ''}
      </div>`;
    }).join('');
    return `<div class="ex-card" data-ei="${ei}">
      <div class="ex-head">
        <button class="ex-name" data-act="ex-open" data-ex="${e.exId}">${esc(ex.name)}</button>
        <span class="ex-rest">${e.rest ? `⏱ ${fmtDur(e.rest)}` : ''}</span>
        <button class="icon-btn" data-act="ex-menu" data-ei="${ei}" aria-label="Exercise options">⋯</button>
      </div>
      ${stall ? `<button class="ovl stall" data-act="ovl-info" data-ei="${ei}"><span>⚠️</span><span><b>Plateau</b><span class="why">${esc(stall.why)}</span></span></button>`
        : sugg ? `<button class="ovl" data-act="ovl-fill" data-ei="${ei}"><span>${sugg.kind === 'up' ? '📈' : '➕'}</span><span>Target <b>${esc(sugg.head)}</b><span class="why">${esc(sugg.why)}</span></span><span class="fill-tag">FILL</span></button>` : ''}
      ${e.note != null && e.note !== '' || e.showNote ?`<textarea class="ex-note" data-f="exnote" data-ei="${ei}" rows="1" placeholder="Exercise note">${esc(e.note || '')}</textarea>` : ''}
      <div class="${cls} hdr"><div>Set</div><div>Previous</div>${ex.type === 'weight' ? `<div>${unit()}</div>` : ''}<div>${valCol}</div>${live ? '<div>✓</div>' : ''}</div>
      ${rows}
      <button class="add-set" data-act="add-set" data-ei="${ei}">+ Add Set</button>
    </div>`;
  }).join('');
}

// live workout sheet
function renderSheet() {
  const a = data.active;
  const sheet = $('#sheet');
  if (!a) { sheet.innerHTML = ''; return; }
  const scroll = sheet.scrollTop;
  sheet.innerHTML = `
    <div class="sheet-head">
      <button class="icon-btn chev" data-act="minimize" aria-label="Minimize"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
      <div class="timer mono" id="elapsed">${fmtDur((Date.now() - a.start) / 1000)}</div>
      <button class="btn good sm" data-act="finish">Finish</button>
    </div>
    <div class="sheet-body">
      <input class="title-input" data-f="wname" value="${esc(a.name)}" aria-label="Workout name" />
      <div class="small dim">${fmtDate(a.start)} · started ${fmtTime(a.start)}</div>
      <textarea class="note-input" data-f="wnote" rows="1" placeholder="Workout note">${esc(a.note)}</textarea>
      ${exerciseCards(a, 'workout')}
      <button class="btn ghost block" data-act="add-ex" style="margin-top:14px">+ Add Exercises</button>
      <button class="btn danger block" data-act="cancel-workout" style="margin-top:10px">Cancel Workout</button>
    </div>
    <div id="restBar" class="rest-bar" hidden></div>`;
  sheet.scrollTop = scroll;
  tick();
}

function renderActiveChrome() {
  const a = data.active;
  const sheet = $('#sheet');
  const showSheet = !!a && sheetOpen;
  if (showSheet && sheet.hidden) { sheet.hidden = false; renderSheet(); document.body.style.overflow = 'hidden'; }
  if (!showSheet && !sheet.hidden) { sheet.hidden = true; document.body.style.overflow = ''; }
  $('#activeBar').hidden = !a || sheetOpen;
  if (a) $('#activeBarName').textContent = a.name || 'Workout';
  tick();
}

// template editor page
function pageTemplateEditor(id) {
  if (!tplDraft || tplDraft._for !== (id || 'new')) {
    const t = id && data.templates.find((x) => x.id === id);
    tplDraft = t ? { ...clone(t), _for: id } : { id: null, name: 'New Template', exercises: [], _for: 'new' };
  }
  return {
    title: id ? 'Edit Template' : 'New Template',
    right: `<button class="btn primary sm" data-act="tpl-save">Save</button>`,
    html: `<div data-doc="tpl" id="tplEditor"></div>`,
    after: renderTplEditorBody,
  };
}
function renderTplEditorBody() {
  const host = $('#tplEditor');
  if (!host) return;
  host.innerHTML = `
    <input class="title-input" data-f="wname" value="${esc(tplDraft.name)}" aria-label="Template name" />
    <div class="small dim">Set targets are optional — they show as hints when you start the workout.</div>
    ${exerciseCards(tplDraft, 'template')}
    <button class="btn ghost block" data-act="add-ex" style="margin-top:14px">+ Add Exercises</button>`;
}
function saveTemplate() {
  const name = tplDraft.name.trim() || 'Untitled Template';
  const t = { id: tplDraft.id || uid(), name, exercises: tplDraft.exercises.map((e) => ({ exId: e.exId, rest: e.rest ?? null, sets: e.sets.map(({ type, w, r, t: tt }) => ({ type, w, r, t: tt })) })) };
  const i = data.templates.findIndex((x) => x.id === t.id);
  if (i >= 0) data.templates[i] = t;
  else data.templates.push(t);
  save();
  tplDraft = null;
  toast('Template saved');
  go('workout');
}

function saveAsTemplate(w) {
  promptBox('Save as template', w.name).then((name) => {
    if (!name) return;
    data.templates.push({
      id: uid(),
      name,
      exercises: w.exercises.map((e) => ({ exId: e.exId, rest: e.rest ?? null, sets: e.sets.map((s) => ({ type: s.type, w: null, r: s.r ?? null, t: s.t ?? null })) })),
    });
    save();
    toast('Template saved');
    render();
  });
}

// ---------- rest timer ----------
let audioCtx = null;
function startRest(sec) {
  if (!sec || !data.active) return;
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); } catch (err) { /* no audio */ }
  data.active.restTimer = { end: Date.now() + sec * 1000, total: sec };
  save();
  tick();
}
function adjustRest(delta) {
  const r = data.active?.restTimer;
  if (!r) return;
  r.end += delta * 1000;
  r.total = Math.max(1, r.total + delta);
  if (r.end <= Date.now()) data.active.restTimer = null;
  save();
  tick();
}
function beep() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  if (!audioCtx) return;
  try {
    [0, 0.25, 0.5].forEach((off) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, audioCtx.currentTime + off);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + off + 0.2);
      o.connect(g).connect(audioCtx.destination);
      o.start(audioCtx.currentTime + off);
      o.stop(audioCtx.currentTime + off + 0.2);
    });
  } catch (err) { /* ignore */ }
}

function tick() {
  const a = data.active;
  if (!a) return;
  const el = fmtDur((Date.now() - a.start) / 1000);
  const elapsed = $('#elapsed');
  if (elapsed) elapsed.textContent = el;
  const barTime = $('#activeBarTime');
  const bar = $('#restBar');
  const r = a.restTimer;
  if (r) {
    const left = (r.end - Date.now()) / 1000;
    if (left <= 0) {
      a.restTimer = null;
      save();
      beep();
      toast('Rest over — next set!');
    } else {
      if (barTime) barTime.textContent = `Rest ${fmtDur(Math.ceil(left))}`;
      if (bar) {
        if (bar.hidden || !bar.firstChild) {
          bar.innerHTML = `<div class="track"><span></span></div>
            <div class="row"><button class="btn sm" data-act="rest-adj" data-d="-15">−15</button><div class="time mono"></div><button class="btn sm" data-act="rest-adj" data-d="15">+15</button><button class="btn sm primary" data-act="rest-skip">Skip</button></div>`;
          bar.hidden = false;
        }
        bar.querySelector('.time').textContent = fmtDur(Math.ceil(left));
        bar.querySelector('.track > span').style.width = `${Math.max(0, Math.min(100, (left / r.total) * 100))}%`;
      }
      return;
    }
  }
  if (bar && !bar.hidden) { bar.hidden = true; bar.innerHTML = ''; }
  if (barTime) barTime.textContent = el;
}
setInterval(tick, 250);

// ---------- finish ----------
async function finishWorkout() {
  const a = data.active;
  const exercises = a.exercises
    .map((e) => ({ exId: e.exId, note: e.note || '', rest: e.rest, sets: e.sets.filter((s) => s.done).map(({ type, w, r, t }) => ({ type, w, r, t })) }))
    .filter((e) => e.sets.length);
  if (!exercises.length) {
    if (await confirmBox('No sets completed', 'Tick off at least one set (✓) to save this workout. Discard it instead?', 'Discard', true)) discardWorkout();
    return;
  }
  const unchecked = a.exercises.reduce((n, e) => n + e.sets.filter((s) => !s.done).length, 0);
  if (unchecked && !(await confirmBox('Finish workout?', `${unchecked} set${unchecked > 1 ? 's are' : ' is'} not ticked off and won't be saved.`, 'Finish'))) return;

  for (const e of a.exercises) if (e.rest != null) data.settings.restByEx[e.exId] = e.rest;
  // Lock in a rep range the first time an exercise is logged so overload targets don't drift.
  for (const e of exercises) if (getEx(e.exId).type === 'weight' && !data.settings.repRange[e.exId]) data.settings.repRange[e.exId] = defaultRange(e.sets);
  const w = { id: a.id, name: a.name.trim() || defaultWorkoutName(), start: a.start, end: Date.now(), note: a.note, templateId: a.templateId, exercises };
  w.prs = computePRs(w);
  data.workouts.unshift(w);
  data.workouts.sort((x, y) => y.start - x.start);
  data.active = null;
  sheetOpen = false;
  save();
  renderActiveChrome();
  render();
  showSummary(w);
}
function discardWorkout() {
  data.active = null;
  sheetOpen = false;
  save();
  renderActiveChrome();
  render();
}
function showSummary(w) {
  const n = data.workouts.length - data.workouts.indexOf(w);
  const box = openModal(`
    <div class="summary-hero"><div class="big">${w.prs.length ? '🏆' : '💪'}</div><h3>Nice work!</h3><div class="dim">This is your ${ordinal(n)} workout.</div></div>
    <div class="card">
      <div class="w-title" style="font-weight:700">${esc(w.name)}</div>
      <div class="w-date small dim" style="margin:2px 0 8px">${fmtDate(w.start, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      <div class="w-stats small dim" style="display:flex;gap:14px;flex-wrap:wrap"><span>⏱ ${fmtLong(w.end - w.start)}</span><span>🏋 ${fmtVol(workoutVolume(w))}</span><span>${setCount(w)} sets</span></div>
    </div>
    ${(() => {
      const rows = w.exercises.map((e) => ({ e, beat: beatLast(e, w.start) })).filter((x) => x.beat !== null);
      if (!rows.length) return '';
      const hit = rows.filter((x) => x.beat).length;
      return `<h2 class="section">Progressive overload · ${hit}/${rows.length} beat last time</h2><div class="card">${rows.map(({ e, beat }) =>
        `<div class="ovl-line"><span class="arrow ${beat ? 'yes' : 'no'}">${beat ? '▲' : '='}</span><span style="flex:1">${esc(getEx(e.exId).name)}</span><span class="small ${beat ? 'up' : 'dim'}">${beat ? 'Progressed' : 'Matched / below'}</span></div>`).join('')}</div>`;
    })()}
    <h2 class="section">Muscles worked</h2>
    <div class="card">${muscleMap(setsByPart([w]))}</div>
    ${w.prs.length ? `<h2 class="section">Personal records</h2><div class="card">${w.prs.map((p) => { const f = fmtPR(p); return `<div class="pr-line"><span>🏆</span><span style="flex:1"><b>${esc(getEx(p.exId).name)}</b><br><span class="small dim">${esc(f.label)}</span></span><span class="pill pr">${esc(f.value)}</span></div>`; }).join('')}</div>` : ''}
    <div class="btn-row" style="margin-top:8px">
      ${w.templateId ? '' : `<button class="btn" data-r="tpl">Save as Template</button>`}
      <button class="btn primary" data-r="done">Done</button>
    </div>`);
  box.querySelector('[data-r="done"]').onclick = closeModal;
  const tb = box.querySelector('[data-r="tpl"]');
  if (tb) tb.onclick = () => { closeModal(); saveAsTemplate(w); };
}
function ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

// ---------- exercise picker ----------
function openPicker({ multi = true, onPick }) {
  const st = { q: '', part: null, sel: new Set(), creating: false };
  const box = openModal('', { tall: true });
  const draw = () => {
    if (st.creating) {
      box.innerHTML = `
        <h3>New exercise</h3>
        <label class="field"><span>Name</span><input id="nxName" value="${esc(st.q)}" placeholder="e.g. Landmine Press" /></label>
        <label class="field"><span>Body part</span><select id="nxPart">${PARTS.map((p) => `<option>${p}</option>`).join('')}<option>Other</option></select></label>
        <label class="field"><span>Equipment</span><select id="nxEquip">${['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Kettlebell', 'EZ Bar', 'Bodyweight', 'Band', 'Other'].map((p) => `<option>${p}</option>`).join('')}</select></label>
        <label class="field"><span>Tracks</span><select id="nxType"><option value="weight">Weight × reps</option><option value="reps">Reps only</option><option value="time">Time</option></select></label>
        <div class="btn-row"><button class="btn" id="nxCancel">Back</button><button class="btn primary" id="nxSave">Create</button></div>`;
      $('#nxCancel', box).onclick = () => { st.creating = false; draw(); };
      $('#nxSave', box).onclick = () => {
        const name = $('#nxName', box).value.trim();
        if (!name) return toast('Give it a name');
        let id = 'c-' + slug(name);
        if (exMap.has(id)) id += '-' + uid().slice(-4);
        data.customExercises.push({ id, name, part: $('#nxPart', box).value, equip: $('#nxEquip', box).value, type: $('#nxType', box).value, custom: true });
        rebuildExMap();
        save();
        st.creating = false;
        st.q = '';
        if (!multi) { closeModal(); onPick([id]); return; }
        st.sel.add(id);
        draw();
      };
      return;
    }
    box.innerHTML = `
      <div class="row" style="margin-bottom:10px">
        <button class="link-btn" id="pkClose">Cancel</button>
        <b>${multi ? 'Add Exercises' : 'Replace Exercise'}</b>
        <button class="link-btn" id="pkNew">+ New</button>
      </div>
      <input class="search" id="pkSearch" placeholder="Search" value="${esc(st.q)}" />
      <div class="chips">${['All', ...PARTS].map((p) => `<button class="chip ${(st.part || 'All') === p ? 'on' : ''}" data-part="${p}">${p}</button>`).join('')}</div>
      <div class="scroll"><div class="ex-list" id="pkList"></div></div>
      ${multi ? `<button class="btn primary block" id="pkAdd" style="margin-top:12px">Add (${st.sel.size})</button>` : ''}`;
    $('#pkClose', box).onclick = closeModal;
    $('#pkNew', box).onclick = () => { st.creating = true; draw(); };
    const search = $('#pkSearch', box);
    search.oninput = () => { st.q = search.value; drawList(); };
    box.querySelectorAll('[data-part]').forEach((c) => (c.onclick = () => { st.part = c.dataset.part === 'All' ? null : c.dataset.part; draw(); }));
    if (multi) $('#pkAdd', box).onclick = () => { if (!st.sel.size) return toast('Pick at least one exercise'); closeModal(); onPick([...st.sel]); };
    drawList();
  };
  const drawList = () => {
    const list = filterExercises(st.q, st.part);
    const host = $('#pkList', box);
    host.innerHTML = list.length
      ? list.map((e) => exItem(e, st.sel.has(e.id), multi)).join('')
      : `<div class="empty small">No match. Tap “+ New” to create “${esc(st.q)}”.</div>`;
    host.querySelectorAll('[data-pick]').forEach((b) => (b.onclick = () => {
      const id = b.dataset.pick;
      if (!multi) { closeModal(); onPick([id]); return; }
      st.sel.has(id) ? st.sel.delete(id) : st.sel.add(id);
      b.classList.toggle('sel');
      $('#pkAdd', box).textContent = `Add (${st.sel.size})`;
    }));
  };
  draw();
}
function filterExercises(q, part) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  return allExercises().filter((e) => (!part || e.part === part) && terms.every((t) => `${e.name} ${e.part} ${e.equip}`.toLowerCase().includes(t)));
}
const timesDone = (id) => data.workouts.reduce((n, w) => n + (w.exercises.some((e) => e.exId === id) ? 1 : 0), 0);
function exItem(e, sel, pick) {
  const n = timesDone(e.id);
  return `<button class="ex-item ${sel ? 'sel' : ''}" ${pick ? `data-pick="${e.id}"` : `data-act="ex-open" data-ex="${e.id}"`}>
    <span class="avatar">${esc(e.name[0])}</span>
    <span class="meta"><div class="t">${esc(e.name)}</div><div class="s">${esc(e.part)} · ${esc(e.equip)}${n ? ` · ${n}×` : ''}</div></span>
    ${pick ? '<span class="tick"></span>' : ''}
  </button>`;
}

// ---------- page: history ----------
let calMonth = null;
function pageHistory() {
  if (!data.workouts.length) {
    return { title: 'History', html: `<div class="empty">No workouts yet.<br>Finish your first workout and it will show up here.</div>` };
  }
  if (!calMonth) { const d = new Date(); calMonth = new Date(d.getFullYear(), d.getMonth(), 1); }
  let html = calendar(calMonth);
  let lastMonth = '';
  for (const w of data.workouts) {
    const m = fmtDate(w.start, { month: 'long', year: 'numeric' });
    if (m !== lastMonth) { html += `<div class="month-label">${m}</div>`; lastMonth = m; }
    html += workoutCard(w);
  }
  return { title: 'History', html };
}
function calendar(month) {
  const y = month.getFullYear(), mo = month.getMonth();
  const days = new Date(y, mo + 1, 0).getDate();
  const first = new Date(y, mo, 1).getDay();
  const on = new Set(data.workouts.filter((w) => { const d = new Date(w.start); return d.getFullYear() === y && d.getMonth() === mo; }).map((w) => new Date(w.start).getDate()));
  const now = new Date();
  const isThisMonth = now.getFullYear() === y && now.getMonth() === mo;
  let cells = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<div class="dow">${d}</div>`).join('');
  for (let i = 0; i < first; i++) cells += '<div></div>';
  for (let d = 1; d <= days; d++) cells += `<div class="day ${on.has(d) ? 'on' : ''} ${isThisMonth && d === now.getDate() ? 'today' : ''}">${d}</div>`;
  return `<div class="card cal">
    <div class="cal-head"><button class="icon-btn" data-act="cal" data-d="-1">‹</button><span>${month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} · ${on.size} day${on.size === 1 ? '' : 's'}</span><button class="icon-btn" data-act="cal" data-d="1">›</button></div>
    <div class="cal-grid">${cells}</div>
  </div>`;
}
function workoutCard(w) {
  return `<button class="card w-card" data-act="w-open" data-id="${w.id}">
    <div class="w-title">${esc(w.name)}</div>
    <div class="w-date">${fmtDate(w.start)} · ${fmtTime(w.start)}</div>
    <div class="w-stats"><span>⏱ ${fmtLong(w.end - w.start)}</span><span>🏋 ${fmtVol(workoutVolume(w))}</span>${w.prs?.length ? `<span class="pill pr">🏆 ${w.prs.length} PR${w.prs.length > 1 ? 's' : ''}</span>` : ''}</div>
    <div class="w-lines">
      ${w.exercises.map((e) => { const ex = getEx(e.exId); const b = bestSet(e.sets, ex.type); return `<span>${e.sets.length} × ${esc(ex.name)}</span><span class="best">${b ? esc(fmtSet(b, ex.type)) : ''}</span>`; }).join('')}
    </div>
  </button>`;
}

function pageWorkoutDetail(id) {
  const w = data.workouts.find((x) => x.id === id);
  if (!w) return { title: 'Workout', html: '<div class="empty">Workout not found.</div>' };
  const prSet = new Set((w.prs || []).map((p) => p.exId));
  return {
    title: w.name,
    right: `<button class="icon-btn" data-act="w-menu" data-id="${w.id}" aria-label="Options">⋯</button>`,
    html: `
      <div class="small dim">${fmtDate(w.start, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · ${fmtTime(w.start)}–${fmtTime(w.end)}</div>
      <div class="stats-grid" style="margin:14px 0">
        <div class="card"><div class="v">${fmtLong(w.end - w.start)}</div><div class="k">Duration</div></div>
        <div class="card"><div class="v">${fmtNum(unit() === 'kg' ? workoutVolume(w) : workoutVolume(w) / KG_PER_LB)}</div><div class="k">Volume (${unit()})</div></div>
        <div class="card"><div class="v">${w.prs?.length || 0}</div><div class="k">PRs</div></div>
      </div>
      ${w.note ? `<div class="note">${esc(w.note)}</div>` : ''}
      ${w.exercises.map((e) => {
        const ex = getEx(e.exId);
        return `<div class="card detail-ex">
          <div class="row"><button class="ex-name name" data-act="ex-open" data-ex="${e.exId}" style="padding:0">${esc(ex.name)}</button>${prSet.has(e.exId) ? '<span class="pill pr">🏆 PR</span>' : ''}</div>
          ${e.note ? `<div class="note">${esc(e.note)}</div>` : ''}
          ${e.sets.map((s, i) => `<div class="detail-set"><span class="n">${setLabel(e.sets, i)}</span><span>${esc(fmtSet(s, ex.type))}</span><span class="dim small">${ex.type === 'weight' && s.r ? `1RM ${toDisp(e1rm(s.w || 0, s.r))}` : ''}</span></div>`).join('')}
        </div>`;
      }).join('')}
      <button class="btn primary block" data-act="w-repeat" data-id="${w.id}">Perform Again</button>`,
  };
}

// ---------- page: exercises ----------
const exFilter = { q: '', part: null };
function pageExercises() {
  return {
    title: 'Exercises',
    right: `<button class="link-btn" data-act="ex-new">+ New</button>`,
    html: `
      <input class="search" id="exSearch" placeholder="Search exercises" value="${esc(exFilter.q)}" />
      <div class="chips">${['All', ...PARTS].map((p) => `<button class="chip ${(exFilter.part || 'All') === p ? 'on' : ''}" data-act="ex-part" data-part="${p}">${p}</button>`).join('')}</div>
      <div class="ex-list" id="exList"></div>`,
    after: () => {
      const s = $('#exSearch');
      s.oninput = () => { exFilter.q = s.value; drawExList(); };
      drawExList();
    },
  };
}
function drawExList() {
  const list = filterExercises(exFilter.q, exFilter.part);
  $('#exList').innerHTML = list.length ? list.map((e) => exItem(e, false, false)).join('') : `<div class="empty small">No exercises found.</div>`;
}

function pageExerciseDetail(id) {
  const ex = getEx(id);
  const hist = historyFor(id);
  const all = hist.flatMap((h) => h.sets);
  const b = bestsOf(all);
  const kg = (v) => `${toDisp(v)} ${unit()}`;
  let records, points, fmtY;
  if (ex.type === 'weight') {
    records = [[kg(b.e1rm), 'Est. 1 rep max'], [kg(b.heaviest), 'Heaviest weight'], [fmtVol(b.vol), 'Best set volume'], [String(hist.length), 'Times performed']];
    points = hist.map((h) => ({ x: h.workout.start, y: bestsOf(h.sets).e1rm })).filter((p) => p.y > 0);
    fmtY = (v) => toDisp(v);
  } else if (ex.type === 'reps') {
    records = [[String(b.reps), 'Most reps'], [String(all.reduce((n, s) => n + (s.r || 0), 0)), 'Total reps'], [String(hist.length), 'Times performed']];
    points = hist.map((h) => ({ x: h.workout.start, y: bestsOf(h.sets).reps }));
    fmtY = (v) => String(Math.round(v));
  } else {
    records = [[fmtDur(b.time), 'Longest'], [fmtLong(all.reduce((n, s) => n + (s.t || 0), 0) * 1000), 'Total time'], [String(hist.length), 'Times performed']];
    points = hist.map((h) => ({ x: h.workout.start, y: bestsOf(h.sets).time }));
    fmtY = (v) => fmtDur(v);
  }
  points.reverse();
  const chartLabel = ex.type === 'weight' ? 'Best est. 1RM' : ex.type === 'reps' ? 'Most reps' : 'Longest set';
  return {
    title: ex.name,
    right: ex.custom ? `<button class="icon-btn" data-act="ex-del" data-ex="${id}" aria-label="Delete">🗑</button>` : '',
    html: `
      <div class="small dim">${esc(ex.part)} · ${esc(ex.equip)}${ex.custom ? ' · custom' : ''}</div>
      ${hist.length ? `
        ${(() => {
          const st = stallFor(id), sg = suggestFor(id, Infinity);
          const range = ex.type === 'weight' ? `<div class="small dim" style="margin-top:6px">Rep range ${rangeFor(id).join('–')} · change it from the ⋯ menu during a workout</div>` : '';
          if (st) return `<h2 class="section">Next session</h2><div class="ovl stall" style="margin:0"><span>⚠️</span><span><b>Plateau</b><span class="why">${esc(st.why)}</span></span></div>${range}`;
          if (sg) return `<h2 class="section">Next session</h2><div class="ovl" style="margin:0"><span>${sg.kind === 'up' ? '📈' : '➕'}</span><span>Target <b>${esc(sg.head)}</b><span class="why">${esc(sg.why)}</span></span></div>${range}`;
          return '';
        })()}
        <h2 class="section">Records</h2>
        <div class="records">${records.map(([v, k]) => `<div class="card"><div class="v">${esc(v)}</div><div class="k">${esc(k)}</div></div>`).join('')}</div>
        <h2 class="section">${chartLabel}</h2>
        <div class="card">${lineChart(points, fmtY)}</div>
        <h2 class="section">History</h2>
        ${hist.slice(0, 30).map((h) => `<button class="card" data-act="w-open" data-id="${h.workout.id}">
          <div class="row"><b>${esc(h.workout.name)}</b><span class="small dim">${fmtDate(h.workout.start, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
          <div style="margin-top:6px">${h.sets.map((s, i) => `<div class="detail-set"><span class="n">${setLabel(h.sets, i)}</span><span>${esc(fmtSet(s, ex.type))}</span><span class="dim small">${ex.type === 'weight' && s.r ? `1RM ${toDisp(e1rm(s.w || 0, s.r))}` : ''}</span></div>`).join('')}</div>
        </button>`).join('')}`
      : `<div class="empty">You haven't logged this exercise yet.</div>`}
      <h2 class="section">Muscles</h2>
      <div class="card">${muscleMap({ [ex.part]: 10 }, false)}</div>`,
  };
}

// ---------- page: progress / profile ----------
function pageProgress() {
  const ws = data.workouts;
  const thisWeek = startOfWeek(Date.now());
  const weeks = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(thisWeek); d.setDate(d.getDate() - i * 7);
    weeks.push(d.getTime());
  }
  const perWeek = weeks.map((wk, i) => ws.filter((w) => w.start >= wk && w.start < (weeks[i + 1] ?? Infinity)).length);
  const labels = weeks.map((wk, i) => (i % 3 === 2 || i === 11 ? fmtDate(wk, { month: 'numeric', day: 'numeric' }) : ''));

  const volPerWeek = weeks.map((wk, i) => ws.filter((w) => w.start >= wk && w.start < (weeks[i + 1] ?? Infinity)).reduce((v, w) => v + workoutVolume(w), 0));
  const volDisp = volPerWeek.map((v) => Math.round((unit() === 'kg' ? v : v / KG_PER_LB) / 1000 * 10) / 10);
  const streak = weekStreak();

  const since = Date.now() - 30 * 86400000;
  const split = setsByPart(ws.filter((w) => w.start >= since));
  const splitRows = Object.entries(split).sort((a, b) => b[1] - a[1]);
  const maxSplit = Math.max(1, ...splitRows.map((r) => r[1]));
  const week = setsByPart(ws.filter((w) => w.start >= Date.now() - 7 * 86400000));
  const totalVol = ws.reduce((v, w) => v + workoutVolume(w), 0);
  const totalPrs = ws.reduce((n, w) => n + (w.prs?.length || 0), 0);
  const s = data.settings;

  // Strength trends: most-logged weighted exercises, best e1RM per session, change over the window.
  const counts = {};
  for (const w of ws) for (const e of w.exercises) if (getEx(e.exId).type === 'weight') counts[e.exId] = (counts[e.exId] || 0) + 1;
  const trends = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => {
    const vals = historyFor(id).slice(0, 10).map((h) => bestsOf(h.sets).e1rm).reverse();
    return { id, vals, chg: vals.length > 1 ? vals[vals.length - 1] - vals[0] : 0 };
  });

  return {
    title: 'Progress',
    html: `
      <div class="stats-grid">
        <div class="card"><div class="v">${ws.length}</div><div class="k">Workouts</div></div>
        <div class="card"><div class="v">${streak}</div><div class="k">Week streak</div></div>
        <div class="card"><div class="v">${totalPrs}</div><div class="k">PRs</div></div>
      </div>
      <div class="card" style="margin-top:10px"><div class="row"><span class="dim small">Total volume lifted</span><b>${fmtVol(totalVol)}</b></div></div>
      <h2 class="section">Muscles · last 7 days</h2>
      <div class="card">${muscleMap(week)}</div>
      <h2 class="section">Strength trend · est. 1RM</h2>
      <div class="card">${trends.length ? trends.map((t) => `<button class="trend-row" data-act="ex-open" data-ex="${t.id}">
          <span><div class="t">${esc(getEx(t.id).name)}</div><div class="s">${toDisp(t.vals[t.vals.length - 1])} ${unit()} · ${t.vals.length} sessions</div></span>
          ${sparkline(t.vals)}
          <span class="chg ${t.chg > 0 ? 'up' : 'down'}">${t.chg > 0 ? '▲' : t.chg < 0 ? '▼' : '–'} ${t.chg ? toDisp(Math.abs(t.chg)) : ''}</span>
        </button>`).join('') : '<div class="dim small">Log a few weighted workouts to see your strength trends.</div>'}</div>
      <h2 class="section">Workouts per week</h2>
      <div class="card">${barChart(perWeek, labels)}</div>
      <h2 class="section">Volume per week · thousand ${unit()}</h2>
      <div class="card">${barChart(volDisp, labels)}</div>
      <h2 class="section">Sets per muscle · last 30 days</h2>
      <div class="card">${splitRows.length ? splitRows.map(([p, n]) => `<div class="split-row"><span>${esc(p)}</span><div class="split-bar"><span style="width:${(n / maxSplit) * 100}%"></span></div><span class="small dim">${n}</span></div>`).join('') : '<div class="dim small">No workouts in the last 30 days.</div>'}</div>
      <h2 class="section">Settings</h2>
      <div class="card">
        <div class="setting-row"><span>Units</span><div class="seg"><button class="${s.unit === 'lbs' ? 'on' : ''}" data-act="unit" data-u="lbs">lbs</button><button class="${s.unit === 'kg' ? 'on' : ''}" data-act="unit" data-u="kg">kg</button></div></div>
        <div class="setting-row"><span>Weekly goal</span><select id="weeklyGoal">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${n === s.weeklyGoal ? 'selected' : ''}>${n} workouts</option>`).join('')}</select></div>
        <div class="setting-row"><span>Progressive overload targets</span><div class="seg"><button class="${s.overload ? 'on' : ''}" data-act="overload" data-v="1">On</button><button class="${s.overload ? '' : 'on'}" data-act="overload" data-v="0">Off</button></div></div>
        <div class="setting-row"><span>Default rest timer</span><select id="restDefault">${REST_OPTIONS.map((r) => `<option value="${r}" ${r === s.rest ? 'selected' : ''}>${r ? fmtDur(r) : 'Off'}</option>`).join('')}</select></div>
      </div>
      <h2 class="section">Your data</h2>
      <div class="card">
        <p class="small dim" style="margin:0 0 12px;line-height:1.5">Everything is stored on this device only. Export a backup now and then so you never lose your log.</p>
        <div class="btn-row"><button class="btn" data-act="export">Export backup</button><button class="btn" data-act="import">Import backup</button></div>
        <button class="btn danger block" data-act="reset" style="margin-top:10px">Erase all data</button>
      </div>`,
    after: () => {
      $('#restDefault').onchange = (e) => { data.settings.rest = +e.target.value; save(); toast('Default rest updated'); };
      $('#weeklyGoal').onchange = (e) => { data.settings.weeklyGoal = +e.target.value; save(); toast('Weekly goal updated'); };
    },
  };
}

function exportData() {
  const { active, ...rest } = data;
  const blob = new Blob([JSON.stringify({ app: '210', exported: new Date().toISOString(), ...rest }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `210-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$('#importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.workouts)) throw new Error('missing workouts');
    if (!(await confirmBox('Import backup?', `This replaces everything on this device with ${parsed.workouts.length} workouts from the backup.`, 'Import', true))) return;
    const { app, exported, ...rest } = parsed;
    data = normalize({ ...rest, active: data.active });
    rebuildExMap();
    save();
    toast('Backup imported');
    render();
  } catch (err) {
    toast('That file is not a valid 210 backup');
  }
});

// ---------- events ----------
const actions = {
  'start-empty': () => startWorkout(null),
  'tpl-open': (el) => templatePreview(el.dataset.id),
  'tpl-new': () => { tplDraft = null; push(pageTemplateEditor, null); },
  'tpl-save': saveTemplate,
  'open-sheet': () => { sheetOpen = true; renderActiveChrome(); },
  minimize: () => { sheetOpen = false; renderActiveChrome(); },
  finish: finishWorkout,
  'cancel-workout': async () => {
    if (await confirmBox('Cancel workout?', 'All progress in this workout will be lost.', 'Cancel workout', true)) discardWorkout();
  },
  'add-ex': (el) => {
    const doc = docOf(el);
    openPicker({
      onPick: (ids) => {
        for (const id of ids) {
          const live = doc === data.active;
          const prev = previousSets(id, live ? doc.start : Infinity);
          const n = Math.max(1, prev.length || 3);
          doc.exercises.push({ exId: id, note: '', rest: live ? restFor(id) : null, sets: Array.from({ length: n }, (_, i) => ({ type: prev[i]?.type || 'n', w: null, r: null, t: null, done: false })) });
        }
        persist(doc);
        rerenderDoc(doc);
      },
    });
  },
  'add-set': (el) => {
    const doc = docOf(el);
    const e = doc.exercises[+el.dataset.ei];
    e.sets.push({ type: 'n', w: null, r: null, t: null, done: false });
    persist(doc);
    rerenderDoc(doc);
  },
  'set-type': (el) => {
    const doc = docOf(el);
    const row = el.closest('.set-row');
    const e = doc.exercises[+row.dataset.ei];
    const si = +row.dataset.si;
    const s = e.sets[si];
    actionSheet('Set type', [
      ...Object.entries(SET_TYPES).map(([k, label]) => ({ label, on: s.type === k, run: () => { s.type = k; persist(doc); rerenderDoc(doc); } })),
      { label: 'Delete set', danger: true, run: () => { e.sets.splice(si, 1); persist(doc); rerenderDoc(doc); } },
    ]);
  },
  'use-prev': (el) => {
    const doc = docOf(el);
    const row = el.closest('.set-row');
    const e = doc.exercises[+row.dataset.ei];
    const p = previousSets(e.exId, doc === data.active ? doc.start : Infinity)[+row.dataset.si];
    if (!p) return;
    Object.assign(e.sets[+row.dataset.si], { w: p.w, r: p.r, t: p.t });
    persist(doc);
    rerenderDoc(doc);
  },
  'ovl-fill': (el) => {
    const doc = data.active;
    const e = doc.exercises[+el.dataset.ei];
    const sugg = suggestFor(e.exId, doc.start);
    if (!sugg) return;
    let wi = 0;
    for (const s of e.sets) {
      if (s.type === 'w') continue;
      const h = sugg.sets[Math.min(wi++, sugg.sets.length - 1)];
      if (!s.done) Object.assign(s, { w: h.w ?? s.w, r: h.r ?? s.r, t: h.t ?? s.t });
    }
    save();
    renderSheet();
    toast('Targets filled — beat them!');
  },
  'ovl-info': async (el) => {
    const e = data.active.exercises[+el.dataset.ei];
    const st = stallFor(e.exId);
    if (st) await confirmBox('Plateau detected', `${getEx(e.exId).name}: ${st.why}. Plateaus are normal — a short deload usually breaks them.`, 'Got it');
  },
  'toggle-set': (el) => {
    const doc = data.active;
    const row = el.closest('.set-row');
    const e = doc.exercises[+row.dataset.ei];
    const s = e.sets[+row.dataset.si];
    const type = getEx(e.exId).type;
    if (!s.done) {
      // Empty fields adopt the greyed-out placeholder, like Strong.
      const fields = type === 'weight' ? ['w', 'r'] : type === 'time' ? ['t'] : ['r'];
      for (const f of fields) {
        if (s[f] == null) {
          const ph = row.querySelector(`[data-f="${f}"]`)?.placeholder;
          if (ph) s[f] = f === 'w' ? fromDisp(ph) : f === 't' ? parseTime(ph) : parseInt(ph, 10);
        }
      }
      if (type === 'weight' && s.w == null) s.w = 0;
      const need = type === 'time' ? s.t : s.r;
      if (!need) { toast(type === 'time' ? 'Enter a time first' : 'Enter reps first'); return; }
      s.done = true;
      startRest(e.rest);
    } else {
      s.done = false;
    }
    save();
    renderSheet();
  },
  'ex-menu': (el) => {
    const doc = docOf(el);
    const ei = +el.dataset.ei;
    const e = doc.exercises[ei];
    const items = [
      { label: e.showNote || e.note ? 'Hide note' : 'Add note', run: () => { if (e.showNote || e.note) { e.showNote = false; e.note = ''; } else e.showNote = true; persist(doc); rerenderDoc(doc); } },
      { label: `Rest timer: ${e.rest ? fmtDur(e.rest) : 'Off'}`, run: () => actionSheet('Rest timer', REST_OPTIONS.map((r) => ({ label: r ? fmtDur(r) : 'Off', on: (e.rest || 0) === r, run: () => { e.rest = r; persist(doc); rerenderDoc(doc); } }))) },
      ...(getEx(e.exId).type === 'weight' ? [{ label: `Rep range: ${rangeFor(e.exId).join('–')}`, run: () => actionSheet('Rep range (progressive overload)', REP_RANGES.map((rg) => ({ label: `${rg[0]}–${rg[1]} reps`, on: rangeFor(e.exId).join() === rg.join(), run: () => { data.settings.repRange[e.exId] = rg; save(); rerenderDoc(doc); } }))) }] : []),
      { label: 'Replace exercise', run:() => openPicker({ multi: false, onPick: ([id]) => { e.exId = id; persist(doc); rerenderDoc(doc); } }) },
    ];
    if (ei > 0) items.push({ label: 'Move up', run: () => { doc.exercises.splice(ei - 1, 0, doc.exercises.splice(ei, 1)[0]); persist(doc); rerenderDoc(doc); } });
    if (ei < doc.exercises.length - 1) items.push({ label: 'Move down', run: () => { doc.exercises.splice(ei + 1, 0, doc.exercises.splice(ei, 1)[0]); persist(doc); rerenderDoc(doc); } });
    items.push({ label: 'Remove exercise', danger: true, run: () => { doc.exercises.splice(ei, 1); persist(doc); rerenderDoc(doc); } });
    actionSheet(getEx(e.exId).name, items);
  },
  'ex-open': (el) => {
    if (sheetOpen) { sheetOpen = false; renderActiveChrome(); }
    push(pageExerciseDetail, el.dataset.ex);
  },
  'ex-part': (el) => { exFilter.part = el.dataset.part === 'All' ? null : el.dataset.part; render(); },
  'ex-new': () => openPicker({ multi: false, onPick: ([id]) => push(pageExerciseDetail, id) }),
  'ex-del': async (el) => {
    const id = el.dataset.ex;
    const n = timesDone(id);
    const msg = n ? `It appears in ${n} logged workout${n > 1 ? 's' : ''}; those entries will show as “Unknown exercise”.` : 'This custom exercise will be removed.';
    if (!(await confirmBox('Delete exercise?', msg, 'Delete', true))) return;
    data.customExercises = data.customExercises.filter((e) => e.id !== id);
    rebuildExMap();
    save();
    back();
  },
  'rest-adj': (el) => adjustRest(+el.dataset.d),
  'rest-skip': () => { if (data.active) { data.active.restTimer = null; save(); tick(); } },
  cal: (el) => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + +el.dataset.d, 1); render(); },
  'w-open': (el) => push(pageWorkoutDetail, el.dataset.id),
  'w-repeat': (el) => {
    const w = data.workouts.find((x) => x.id === el.dataset.id);
    if (w) startWorkout(w, w.templateId || null);
  },
  'w-menu': (el) => {
    const w = data.workouts.find((x) => x.id === el.dataset.id);
    if (!w) return;
    actionSheet(w.name, [
      { label: 'Rename', run: async () => { const n = await promptBox('Rename workout', w.name); if (n) { w.name = n; save(); render(); } } },
      { label: 'Save as template', run: () => saveAsTemplate(w) },
      { label: 'Delete workout', danger: true, run: async () => {
        if (!(await confirmBox('Delete workout?', 'This permanently removes it from your history.', 'Delete', true))) return;
        data.workouts = data.workouts.filter((x) => x.id !== w.id);
        save();
        back();
      } },
    ]);
  },
  unit: (el) => { data.settings.unit = el.dataset.u; save(); render(); if (data.active && sheetOpen) renderSheet(); },
  overload: (el) => { data.settings.overload = el.dataset.v === '1'; save(); render(); },
  export: exportData,
  import: () => $('#importFile').click(),
  reset: async () => {
    if (!(await confirmBox('Erase all data?', 'Deletes every workout, template and custom exercise on this device. Export a backup first if you might want it.', 'Erase everything', true))) return;
    data = defaults();
    sheetOpen = false;
    rebuildExMap();
    save();
    go('workout');
  },
};

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.closest('#modal')) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el, ev);
});

document.addEventListener('input', (ev) => {
  const el = ev.target;
  const f = el.dataset?.f;
  if (!f) return;
  const doc = docOf(el);
  if (!doc) return;
  if (f === 'wname') { doc.name = el.value; if (doc === data.active) $('#activeBarName').textContent = el.value || 'Workout'; }
  else if (f === 'wnote') doc.note = el.value;
  else if (f === 'exnote') doc.exercises[+el.dataset.ei].note = el.value;
  else {
    const row = el.closest('.set-row');
    const s = doc.exercises[+row.dataset.ei].sets[+row.dataset.si];
    s[f] = f === 'w' ? fromDisp(el.value) : f === 't' ? parseTime(el.value) : (parseInt(el.value, 10) || null);
  }
  persist(doc);
});
// Select the whole number on focus so retyping a weight is one tap.
document.addEventListener('focusin', (ev) => { if (ev.target.matches?.('.set-row input')) ev.target.select(); });

// ---------- boot ----------
if (data.active) sheetOpen = false; // resume minimized; tap the bar to reopen
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW registration failed', err)));
}
