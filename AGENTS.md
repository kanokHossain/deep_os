# AGENTS.md

Guidance for anyone (human or AI agent) changing DeepOS.

## What DeepOS is

A free, open-source focus timer. Pick one task, start the timer, dump any distracting thought into the brain dump, and deal with it later. Live at https://deepos.app.

Tagline: **One task, a clear head. Dump the noise, keep working.** The header shows only the second line, "Dump the noise, keep working."; the banner and share image use both.

## The README rule (always)

Every change to the app must keep the GitHub README true and current, in the same commit:

1. **Update the text.** If a feature, label, button, shortcut, limit or privacy detail changed, update the matching lines in `README.md` (How it works, Features, Privacy, Known limits). Never leave a renamed or removed feature in the README.
2. **Retake the screenshots.** Run `python3 scripts/readme-shots.py`. It builds the app, seeds demo data and rewrites `docs/focus.jpg`, `docs/session-dark.jpg`, `docs/brain-dump.jpg` and `docs/analytics-dark.jpg`. If you add a new screen, add it to the `shots` list in that script and to the README.
3. **Banner.** `docs/banner.png` is the same image as `public/og-image.png`. If the logo or tagline changes, regenerate both and keep them identical.
4. **Look before you commit.** Open the new screenshots and check them. Don't commit a screenshot you haven't looked at.

## Wording

The app is for people under mental pressure, so copy is calm, plain and short.

- The action word for adding a thought is **Dump** (button "Dump", "thoughts dumped"). Don't bring back "park" or "unload".
- The sections are **Focus**, **Brain dump** and **Analytics**.
- Session lengths are **15m, 25m, 45m and Open**.
- Never say local data is encrypted. Data lives in the browser's localStorage. "End-to-end encrypted" only describes sync, which doesn't exist yet.
- Never track what people type. Analytics events carry counts and choices only.
- The project is on Vercel's free plan, where custom events can be sent but not read. Anything the owner needs to count (like sync votes) is also recorded as a page view of a virtual path, e.g. `/vote/sync`, which shows under Analytics > Pages.
- Keep the Privacy Policy (`src/components/LegalPage.tsx`) true whenever data handling changes.

## Design

- Calm, neutral glass surfaces. Amber (`--sun`) is an accent for thoughts, not a background. Teal (`--accent`) is for focus and primary actions.
- Every page uses the same frame: 8 of 12 columns on desktop, 10 of 12 on tablet, full width on phones.
- Long lists scroll inside their card (brain dump, sessions) instead of growing the page.
- Check light and dark mode, and a 390px-wide phone, for every visual change.

## Working on the code

```bash
npm install
npm run dev
npm test           # must pass before every commit
npx tsc -p .       # must be clean
npm run build
```

- State lives in `src/lib/store.ts` (reducer + localStorage, shared with the pop-out window). Selectors must return stable references.
- The timer is computed from timestamps, never by counting ticks.
- Routing is hash-based: `#focus`, `#inbox`, `#analytics` (`#history` still redirects), `#privacy`, `#terms`.

## Shipping

- Every push to `main` deploys to production on Vercel automatically. Check the deployment is READY after pushing.
- One change per commit, with a message that says what changed for the user.
- Don't buy domains, change Vercel or GitHub settings, or publish releases without the owner's explicit yes.
