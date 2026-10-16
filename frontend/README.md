# Frontend

Die M.oach-Web-App wird mit Vite, React 19 und TypeScript gebaut.

## Start und Prüfungen

```sh
npm ci
npm run dev
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

Für die Installation wird npm 11 verwendet. Die Browserprüfungen starten den Produktionsbuild auf Port 4173, verwenden lokale Testdaten und blockieren externe Anfragen.

## Aufteilung und Migrationsgrenze

- `src/App.tsx`: React-Wurzel, aktive Ansicht und Hosts für noch nicht migrierte Ansichten.
- `src/components/`: Kopfbereich und Navigation als React-Komponenten mit TypeScript.
- `src/features/today/`: vollständig in React dargestellte Tagesansicht mit typisiertem Datenmodell und Trainingsaufbereitung.
- `src/lib/navigation.ts`: typisierte Ansichten und Navigation.
- `src/lib/format.ts`: Datums- und Zeitformatierung mit lokalen Kalendertagen.
- `src/lib/lifecycle.ts`: Aufräumen von Timern, globalen Listenern, Requests und Observern.
- `src/config/supabase.ts`: öffentliche Supabase-Konfiguration.
- `src/app.css`: globales Stylesheet.
- `src/legacy/app.js`: Übergangsmodul mit bestehender Fachlogik, API-Zugriffen und DOM-Rendering für die übrigen Ansichten.
- `legacy-app/`: unveränderte ursprüngliche Single-File-App als Migrationsreferenz; sie wird nach Abschluss der Migration gelöscht.
- `public/`: Manifest und Bilder der neuen App.
- `service-worker.js` und `scripts/build-service-worker.mjs`: Offline- und Push-Unterstützung für die tatsächlichen Vite-Build-Dateien.

Die Migration zu React und TypeScript ist noch nicht vollständig. Das JavaScript-Übergangsmodul ist von der Typprüfung ausgenommen; seine Schnittstelle zu React ist typisiert. Kalender, Läufe, Leistung, Race, Profil, Coaching und Anmeldung rendern weiterhin imperativ in leere Hosts aus `src/App.tsx`. Die Tagesansicht unter `src/features/today/` ist bereits migriert und erhält ihre Daten über eine typisierte Schnittstelle aus dem Übergangsmodul. React besitzt die Navigation und Sichtbarkeit der Ansichten.

Bestehende localStorage-Schlüssel bleiben während der Migration erhalten. Browserdaten sind an den Origin gebunden: Daten einer veröffentlichten App sind auf localhost nicht automatisch vorhanden.

## Supabase

Ohne `.env.local` verwendet die App derzeit die bisherigen öffentlichen Projektwerte. Abweichende Werte können aus `.env.example` in `.env.local` übernommen werden. `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` werden beim Build eingebunden. Bereits lokal gespeicherte Betreiber-Einstellungen unter `moach_sb` haben aus Kompatibilitätsgründen weiterhin Vorrang.

Service-Role- und Secret-Schlüssel gehören niemals in `VITE_*`-Variablen. Anmeldung, Cloud-Synchronisierung und Intervals.icu verwenden vorerst die vorhandenen Adapter im Übergangsmodul. Ein zentraler Supabase-Service und die Backend-Migrationen folgen separat.

## Offline und Veröffentlichung

Der Produktionsbuild enthält `sw.js` mit einer aus den gebauten Dateien erzeugten Cache-Liste. Die Registrierung erfolgt nur im Produktionsmodus in einem sicheren Browserkontext (HTTPS oder localhost). Relative Asset-Pfade unterstützen die Auslieferung unter einem Unterverzeichnis. Veröffentlicht wird später der Inhalt von `dist/`.

Browserprüfungen decken Anmeldung, Registrierung, Hauptnavigation, vorhandene lokale Daten, Profilspeicherung, Offline-Neuladen sowie mehrere Zustände der migrierten Tagesansicht auf Desktop und mobiler Chromium-Ansicht ab. Echte Cloud-Anmeldung, Synchronisierung und Push-Zustellung sind damit nicht geprüft.

Als Nächstes wird jeweils eine weitere Ansicht einschließlich ihrer Daten-Schnittstelle vollständig nach React/TypeScript übertragen und ihr alter Renderer entfernt.

Grundlagen: [Vite](https://vite.dev/guide/), [React Effects](https://react.dev/reference/react/useEffect), [Supabase](https://supabase.com/docs/reference/javascript/initializing).
