# SignalLoop

Campus issue reporting, front end only. Students report problems (broken lights, leaks, bins) and
track them; campus admins triage, assign and resolve them. Plain HTML, CSS and JavaScript: no
framework, no build step, no dependencies.

> Demo build. There is no server, real sign-in or AI model yet. See "Limits" below.

## Run it

- **VS Code:** install the Live Server extension, right-click `index.html`, choose "Open with Live Server".
- **Terminal:** `npm start`, then open http://localhost:3000 (or `python3 -m http.server 3000`).

Google Fonts (Manrope, Inter) load from the internet; offline, the app falls back to system fonts.

## Using the demo

On the sign-in screen pick **Student** or **Campus admin**. Any valid-looking email and any password works.
Try it with two tabs: submit a report as a student in one, and watch it appear in the admin incident queue in the other.

## Layout

| Path              | What it holds                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `index.html`      | Page shell                                                                                  |
| `src/app.js`      | Data, student and admin screens, hash router (`#/s/home`, `#/a/queue`, ...), event handlers |
| `src/styles.css`  | Colour tokens (light and dark), components, responsive rules                                |
| `assets/logo.png` | Logo and favicon                                                                            |

Screens are functions that return HTML strings (`studentScreens`, `adminScreens`). Click handlers live in
`actions` and are picked by the `data-act` attribute. Incident and state field names are short
(`t`, `c`, `l`...); the comments above `incidents` and `state` in `app.js` explain each one.

Responsive: phone (bottom tab bar), tablet, and desktop (sidebar layouts for both roles).

## Limits

- Data is stored in the browser's `localStorage`, so it is shared between tabs of one browser only, not between devices.
  Reset it with `localStorage.clear()` in the browser console.
- "AI" suggestions are simple keyword rules. Analytics numbers, the campus map and notifications are sample or in-app only.
- Voice input uses the browser's speech-to-text (Chrome/Edge, needs internet and mic permission). Audio is not saved.

## Next steps

Replace `localStorage` with a backend (for example Supabase) for real accounts, shared data, photo storage and roles.

## Formatting

`npm run format` (uses the settings in `.prettierrc`).
