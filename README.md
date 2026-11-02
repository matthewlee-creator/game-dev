# HOI4 Grand Strategy Web Game (Europe 1936 - 1955)

A lightweight, real-time-with-pause browser-based Hearts of Iron IV style grand strategy game built in vanilla HTML5, CSS3, and JavaScript.

## Features Included
- **Tick & Time Engine:** Real-time day clock with speed controls (1x, 3x, 5x) and 1936-1955 sandbox boundaries.
- **Interactive Map:** Canvas node graph representing European provinces, control borders, and active combat front line markers.
- **Combat & Front Lines:** Unit combat width, entrenchment, organization vs. HP damage calculations, terrain penalties, and air/naval support modifiers.
- **Economy & Trade Engine:** Civilian factory trade deals for strategic resources (Steel, Aluminum, Oil, Rubber), naval trade route interdiction, and resource deficit production penalties.
- **AI & Personalities:** Ruler profiles, difficulty multipliers, historical AI focus, and stability/civil war management.
- **Historical Event System:** Historical event triggers (Anschluss 1938, Danzig or War 1939, NATO 1949) with modal popups and choices for annexation vs. puppet states.
- **Save System:** LocalStorage save/load functionality with monthly autosaves.

## How to Publish & Play on GitHub Pages

1. **Create a GitHub Repository:**
   - Go to [GitHub.com](https://github.com) and click **New Repository**.
   - Name it `hoi4-web-game` and set visibility to **Public**.

2. **Upload Files:**
   - Extract the contents of this ZIP archive.
   - Drag and drop all files (`index.html`, `style.css`, `*.js`, `README.md`) directly into your repository.
   - Commit the changes to the `main` branch.

3. **Enable GitHub Pages:**
   - Go to your repository **Settings** -> **Pages**.
   - Under **Build and deployment**, set Source to `Deploy from a branch`.
   - Select `main` branch and `/ (root)` folder, then click **Save**.
   - After 1-2 minutes, GitHub will give you a live URL (e.g., `https://yourusername.github.io/hoi4-web-game/`).

## How to Run Locally
Open `index.html` directly in any web browser, or serve it using Python:
```bash
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.
