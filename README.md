# DeepOS

**One task. Park the rest.**

A free, open-source focus timer built around one habit: when a stray thought shows up mid-task, don't chase it. Park it in one line and keep working. Review everything you parked after the session.

No account. No cookies. What you write never leaves your browser. Only anonymous usage counts (Vercel Web Analytics) are collected; see the Privacy Policy in the app.

## How it works

1. **Pick one task.** Name it, set a start time (backdate it if you already began), choose 15 / 25 / 45 / 60 / 90 minutes or an open session.
2. **Park every other thought.** A box under the timer takes any idea, worry or to-do in one line. Press `P` to jump to it, `Enter` to park, and you're back.
3. **Review later.** The inbox shows each parked thought with the task you were on when it came up. Go through them one at a time: focus on it now, keep it for later, or drop it.

## Features

- **Drift-free timer.** Time is calculated from timestamps, not by counting ticks, so background tabs and sleep don't skew it. It survives a page refresh.
- **Pause and resume.** Paused time isn't counted as focus.
- **Park box with context.** Every parked thought remembers when it came up and which task you were on.
- **One-by-one review.** Triage the inbox card by card so every thought gets a real decision.
- **Float on top.** In Chrome and Edge, a mini timer with its own park box floats above all your other apps (Document Picture-in-Picture API).
- **Gentle chime** when the planned time is up. The tab title shows the running clock.
- **History.** Today's focused time, sessions and parked thoughts, plus a 7-day chart.
- **Backup and restore** as a JSON file to move between devices.
- Light and dark themes, keyboard friendly, works on mobile.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests for the timer and inbox logic
npm run build      # production build in dist/
```

`npm run build:single` produces one self-contained `index.html`, handy for sharing as a single file.

## Deploy

It's a static site. On Vercel or Netlify: framework **Vite**, build command `npm run build`, output directory `dist`.

## Project structure

```
src/
  lib/store.ts          state, reducer and localStorage persistence (shared by the main and floating windows)
  lib/time.ts           time formatting helpers
  lib/chime.ts          Web Audio chime, no audio files
  hooks/                clock, chime and floating-window hooks
  components/           Focus, Park box, Inbox (with review mode), History, floating mini window
```

## Contributing

Issues and pull requests are welcome. The goal is to stay small: features should help someone stay on one task, not add more to manage.

## License

MIT © Kanok Hossain
