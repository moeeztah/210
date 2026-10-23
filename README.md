# 210

Offline workout tracker PWA, laid out like Strong (with a few Hevy touches).
Black + red theme.
Pure static HTML/CSS/vanilla JS — no backend, no build step, no accounts.
All data stays on the device in `localStorage`.

## Features

- **Workout tab** — "Start an Empty Workout" or start from a template
  (Push / Pull / Legs / Full Body are seeded; create, edit, duplicate, delete your own).
- **Live workout** — Strong-style set table: `Set | Previous | lbs | Reps | ✓`.
  - Previous column shows what you did last time; tap it to copy those numbers.
  - Empty boxes show greyed hints; ticking ✓ on an empty set uses the hint.
  - Tap the set number for Warm-up (W) / Drop (D) / Failure (F) or to delete it.
  - Rest timer starts automatically when you tick a set (−15 / +15 / Skip, beeps + vibrates).
    Rest time is per exercise (⋯ menu) and remembered.
  - ⋯ menu per exercise: note, rest timer, replace, reorder, remove.
  - Minimize the workout to browse the app; a bar at the bottom brings it back.
    An in-progress workout survives closing the app.
- **Progressive overload (double progression)** — every exercise has a rep range
  (set automatically from your first session, change it via ⋯ → Rep range).
  Hit the top of the range on every working set → the app targets +5 lbs
  (+10 lbs for barbell/machine legs & back) back at the bottom of the range;
  otherwise it targets +1 rep. Reps-only exercises: +1 rep/set; timed: +10%.
  Targets show as a chip on each exercise (tap FILL) and as the greyed hints.
  3 sessions without beating your best → "Plateau" warning with a −10% deload.
  The finish screen scores which exercises beat last time. Toggle in Progress → Settings.
- **Visuals** — weekly-goal ring + streak + week-over-week volume on the Workout tab,
  front/back muscle heat map (last 7 days, per workout, per exercise),
  strength-trend sparklines, workouts/week and volume/week charts.
- **Finish** — summary with duration, volume, sets and new PRs
  (heaviest weight, best est. 1RM, best set volume / most reps / longest time).
- **History** — calendar of workout days + workout cards with best set per exercise.
  Open one to see every set, rename, delete, save as template, or "Perform Again".
- **Exercises** — ~85 built-in exercises, search + body-part filter, custom exercises
  (weight × reps, reps only, or time). Each has records, a progress chart and full history.
- **Progress** — workouts, week streak, PR count, total volume, workouts per week,
  sets per muscle (last 30 days), lbs/kg toggle, default rest, backup export/import.

## Run locally

```bash
python -m http.server 8210
```

Open `http://localhost:8210`.

## Install on your phone

Same as QuizIT: push this folder to a GitHub repo and turn on GitHub Pages
(Settings → Pages → Deploy from branch, root `/`), or use Cloudflare Pages
(no build command, output `/`). Open the HTTPS URL on your phone →
Add to Home Screen.

**Back up your data** from Progress → Export backup now and then — clearing
the browser's site data wipes the log.

## Files

- `app.js` — everything (exercise library, storage, pages, workout editor, charts)
- `styles.css` — dark/light theme
- `sw.js` — offline cache (stale-while-revalidate)
- `scripts/generate-icons.js` — regenerates `icons/` (`node scripts/generate-icons.js`)
