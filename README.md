# Summer Plans

A static Vite + React + TypeScript site for sharing summer plans with friends. It shows dated events, tentative ideas, filters, a month calendar, and detail modals with maps and event links.

## Run Locally

```bash
npm install
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173`.

## Edit Events

Update [`src/data/events.json`](src/data/events.json). The app is intentionally data-only for now, so there is no backend, database, authentication, or editing UI.

Each event supports:

- `status`: `confirmed`, `planning`, `idea`, or `cancelled`
- `category`: `movie`, `show`, `trip`, `outdoor`, `food`, or `other`
- `date`: ISO date like `2026-07-04`, or `null` for tentative plans
- `dateLabel`: friendly vague or range text like `late July` or `July 17-19`
- location, address, attendees, organizer, driver notes, cost, links, tags, notes, and `imagePrompt`

If an event has a real `date`, it appears in the dated list and calendar. If `date` is `null`, it appears in the “Still planning” section and calendar side panel.

## Build

```bash
npm run build
npm run preview
```

The static build is written to `dist/`.

## Deploy To GitHub Pages

This project uses `base: './'` in [`vite.config.ts`](vite.config.ts), so the built assets work on project pages as well as custom domains.

One simple GitHub Pages workflow is:

1. Build with `npm run build`.
2. Upload or publish the `dist/` folder to GitHub Pages.
3. If using GitHub Actions, configure the Pages action to build the app and deploy `dist/`.

Example build steps for an action:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
- run: npm ci
- run: npm run build
```

## Run With Docker And Nginx

```bash
docker build -t summer-plans .
docker run --rm -p 8080:80 summer-plans
```

Open `http://localhost:8080`.
