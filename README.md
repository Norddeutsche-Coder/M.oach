# M.oach

Marathon-Coach mit Trainingsplanung, Tagesbriefing und Intervals.icu-Anbindung.

## Struktur

- `frontend/`: neue Web-App mit Vite, TypeScript und Svelte.
- `backend/`: Supabase-Backend; Datenbankschema und serverseitige Funktionen werden hier versioniert.
- `frontend/legacy-app/`: ursprüngliche App mit HTML, Service Worker, Manifest und Bildern. Der Ordner dient nur als Referenz für die Migration und wird nach deren Abschluss gelöscht.

## Entwicklung

Voraussetzung: Node.js 20.19+ oder 22.12+ und npm 11 (die Engine-Anforderungen der installierten Pakete gelten zusätzlich).

```sh
cd frontend
npm ci
npm run dev
```

Die Abhängigkeiten wurden mit npm 11 installiert; npm 10.8.2 scheiterte bei der Auflösung der Vorlage. Falls nötig: `npx --yes npm@11 ci` statt `npm ci`.

Prüfen und bauen: `npm run check` und `npm run build` im Ordner `frontend/`.
Browserprüfungen: nach dem Build `npx playwright install chromium` und `npm run test:e2e` ausführen. Details und Grenzen der Migration stehen in [frontend/README.md](frontend/README.md).

Der Build liegt unter `frontend/dist/`; `npm run preview` zeigt ihn lokal an.

Die bisherige App lässt sich separat mit `python3 -m http.server 8080 --directory frontend/legacy-app` unter `http://localhost:8080` öffnen.

## Migrationsstand

Das Frontend enthält jetzt die bestehende Oberfläche im Vite-Build. Kopfbereich und Navigation sind Svelte-Komponenten; die übrigen Ansichten und die Fachlogik laufen zunächst in einem gekennzeichneten JavaScript-Übergangsmodul. Die vollständige Svelte-/TypeScript-Migration folgt ansichtsweise. Die bisherige App bleibt unter `frontend/legacy-app/` während der Migration erhalten. Das Hosting wird in diesem Schritt nicht umgestellt.

Nächste Schritte:

1. Tagesansicht und ihren Datenvertrag vollständig nach Svelte/TypeScript übertragen; anschließend die weiteren Ansichten.
2. Supabase-Schema, Zugriffsregeln und vorhandene Funktionen erfassen und unter `backend/` versionieren.
3. Speicherung und API-Zugriffe aus der Oberfläche lösen; Trainingslogik in TypeScript überführen und prüfen.
4. Echte Cloud-Anmeldung, Synchronisierung und Push prüfen; danach Hosting auf `frontend/dist/` umstellen. Offline-Neuladen ist im Vite-Build bereits integriert und browsergetestet.

Das bestehende Supabase-Projekt wird durch dieses Grundgerüst nicht verändert.
