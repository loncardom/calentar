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
- `calendarStartDate` and `calendarEndDate`: optional ISO dates for showing a tentative planning window in the calendar
- `dateLabel`: friendly vague or range text like `late July` or `July 17-19`
- location, address, attendees, organizer, driver notes, cost, links, tags, notes, and `imagePrompt`

If an event has a real `date`, it appears in the dated list and calendar. If `date` is `null`, it stays in the “Still planning” section; add calendar start and end dates when it should also appear as a tentative range in the calendar.

## Build

```bash
npm run build
npm run preview
```

The static build is written to `dist/`.

## Deploy To GitHub Pages

This project uses `base: './'` in [`vite.config.ts`](vite.config.ts), so the built assets work on project pages, user pages, and custom domains.

The included workflow at [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) builds the app and publishes `dist/`.

1. Push the repository to GitHub.
2. In the repository settings, go to **Settings -> Pages**.
3. Set **Build and deployment -> Source** to **GitHub Actions**.
4. Push to `main`, or run the **Deploy GitHub Pages** workflow manually from the Actions tab.

If the repository is named `<username>.github.io`, it publishes at `https://<username>.github.io/`. If the repository has another name, it publishes at `https://<username>.github.io/<repository-name>/`.

GitHub Pages can take a few minutes to update after the workflow completes.

## Run With Docker And Nginx

```bash
docker build -t summer-plans .
docker run --rm -p 8080:80 summer-plans
```

Open `http://localhost:8080`.
