# Frontend

Die bisherige App wird mit Vite gebaut und in einer Svelte-Anwendung gestartet.

## Start und Prüfungen

```sh
npm ci
npm run dev
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

Für die Installation wird npm 11 empfohlen (alternativ `npx --yes npm@11 ci`). Die Browserprüfungen starten den Produktionsbuild auf Port 4173. Sie verwenden lokale Testdaten und blockieren externe Anfragen.

## Aufteilung und Migrationsgrenze

- `src/App.svelte`: Svelte-Lebenszyklus, aktive Ansicht und Hosts für bestehende Ansichten.
- `src/components/`: Kopfbereich und Navigation als echte Svelte-Komponenten mit TypeScript.
- `src/lib/navigation.ts`: typisierte Ansichten und Navigation.
- `src/lib/format.ts`: Datums- und Zeitformatierung mit lokalen Kalendertagen.
- `src/lib/lifecycle.ts`: Aufräumen von Timern, globalen Listenern, Requests und Observern.
- `src/config/supabase.ts`: öffentliche Supabase-Konfiguration.
- `src/app.css`: ausgelagertes bisheriges Stylesheet.
- `src/legacy/app.js`: Übergangsmodul mit bisheriger Fachlogik, DOM-Rendering und API-Zugriffen.
- `public/`: Manifest und Bilder.
- `service-worker.js`, `scripts/build-service-worker.mjs`: Offline- und Push-Unterstützung für die tatsächlichen Vite-Build-Dateien.

Die Migration zu Svelte und TypeScript ist noch nicht vollständig. Das JavaScript-Übergangsmodul ist ausdrücklich von der Typprüfung ausgenommen; seine Schnittstelle zu Svelte ist typisiert. Kalender, Tagesansicht, Läufe, Leistung, Race, Profil, Coaching und Anmeldung rendern derzeit weiterhin imperativ in leere, von Svelte bereitgestellte Hosts. Svelte besitzt die Navigation und Sichtbarkeit der Ansichten; das Übergangsmodul deren Inhalte. Neue Svelte-Inhalte dürfen nicht in diese Hosts eingefügt werden, solange deren alter Renderer aktiv ist.

Svelte-HMR ist während dieses Übergangs deaktiviert, damit Änderungen einen vollständigen Neustart ermöglichen und alte DOM-Referenzen nicht weiterbenutzt werden. Bestehende Speicher-Schlüssel bleiben erhalten. Browserdaten sind an den Origin gebunden: Daten einer veröffentlichten App sind auf localhost nicht automatisch vorhanden.

## Supabase

Ohne `.env.local` verwendet die App weiterhin die bisherigen öffentlichen Projektwerte. Abweichende Werte können aus `.env.example` in `.env.local` übernommen werden. `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` werden beim Build eingebunden. Bereits lokal gespeicherte Betreiber-Einstellungen unter `moach_sb` haben aus Kompatibilitätsgründen weiterhin Vorrang.

Service-Role- und Secret-Schlüssel gehören niemals in `VITE_*`-Variablen. Anmeldung, Cloud-Synchronisierung und Intervals.icu verwenden vorerst die vorhandenen Adapter im Übergangsmodul. Ein zentraler Supabase-Service und die Backend-Migrationen folgen separat.

## Offline und Veröffentlichung

Der Produktionsbuild enthält `sw.js` mit einer aus den gebauten Dateien erzeugten Cache-Liste. Die Registrierung erfolgt nur im Produktionsmodus in einem sicheren Browser-Kontext (HTTPS oder localhost). Im Entwicklungsmodus gibt es keine neue Service-Worker-Registrierung. Relative Asset-Pfade unterstützen die Auslieferung unter einem Unterverzeichnis. Veröffentlicht wird später der Inhalt von `dist/`.

Browserprüfungen decken Login-Darstellung und Pflichtfeldvalidierung, Registrierung, Hauptnavigation, vorhandene lokale Daten, Profilspeicherung und Offline-Neuladen auf Desktop und mobiler Chromium-Ansicht ab. Echte Cloud-Anmeldung, Synchronisierung, Push-Zustellung und die fachliche Richtigkeit der bestehenden Trainingsregeln sind damit nicht geprüft.

Als Nächstes wird jeweils eine Ansicht einschließlich ihrer Daten-Schnittstelle vollständig nach Svelte/TypeScript übertragen und ihr alter Renderer entfernt.

Grundlagen: [Vite](https://vite.dev/guide/), [Svelte-Lebenszyklus](https://svelte.dev/docs/svelte/lifecycle-hooks), [Supabase](https://supabase.com/docs/reference/javascript/initializing).
