# AGENTS.md

Anweisungen für KI-Coding-Agenten (Claude Code, Codex u. a.) und alle, die an M.oach arbeiten. `CLAUDE.md` verweist auf diese Datei. Pflege die Regeln nur hier.

## Projekt

M.oach ist ein Marathon-Coach als PWA: Trainingsplanung, Tagesbriefing mit Readiness, Kalender, Leistung und Intervals.icu-Anbindung. Optional gibt es Cloud-Sync und Coaching über Supabase. Die Nutzerdaten liegen primär im localStorage des Browsers.

- `frontend/`: Vite + React 19 + TypeScript. Die einzige App.
  - `src/features/today/`: Tagesansicht, bereits nach React/TypeScript migriert.
  - `src/legacy/app.js`: Übergangsmodul (ca. 2.900 Zeilen, imperatives DOM-Rendering) für alle noch nicht migrierten Ansichten, ohne Typprüfung.
  - `src/lib/`: gemeinsame Helfer (`format.ts` für Datum und Pace, `lifecycle.ts`, `navigation.ts`, `service-worker.ts`).
  - `src/sw/service-worker.js`: Quelle des Service Workers. `scripts/build-service-worker.mjs` erzeugt daraus beim Build `dist/sw.js`.
  - `tests/`: Playwright-E2E mit Fixtures. Unit-Tests liegen als `*.test.ts` neben dem Code.
  - `legacy-app/`: ursprüngliche Single-File-App, **nur Referenz** für die Migration. Wird nicht gebaut, nicht geprüft, nicht geändert.
- `backend/`: Supabase (Schema, Policies, Edge Functions). Wird gerade aufgebaut.
- `.github/workflows/`: `ci.yml` (Prüfungen bei jedem Push), `deploy.yml` (GitHub Pages bei Push auf `main`, nur nach grüner CI).

Sprache: Oberfläche, Doku, PR-Beschreibungen und Taiga auf **Deutsch**. Code, Bezeichner, Code-Kommentare und Commit-Nachrichten auf **Englisch**.

## Befehle

Voraussetzung: Node 22 (`.nvmrc`, mindestens 20.19) und **npm 11**. Ist npm älter: `npx --yes npm@11 …`.

Alles im Ordner `frontend/`:

| Zweck | Befehl |
|---|---|
| Abhängigkeiten | `npm ci` |
| Entwicklung | `npm run dev` |
| Typprüfung | `npm run check` |
| Lint | `npm run lint` |
| Formatierung prüfen | `npm run format` (Prettier: ohne Semikolon, einfache Anführungszeichen, Breite 100). Der Bestand ist noch nicht durchformatiert, deshalb nur neue oder geänderte Dateien formatieren, keine Massenformatierung nebenbei. |
| Unit-Tests | `npm test` (Vitest) |
| Build | `npm run build` |
| E2E-Tests | `npx playwright install chromium`, dann `npm run test:e2e` |

Vor jedem Commit müssen `check`, `lint`, `test`, `build` und `test:e2e` grün sein. Die CI prüft dasselbe.

Der Build braucht `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY`. Lokal stehen sie in `frontend/.env.local` (Vorlage: `.env.example`). Für Tests und Screenshots Testwerte verwenden (`https://test-project.supabase.co`, `sb_publishable_test_only_000000000000`). Die E2E-Tests blockieren alle externen Anfragen.

## Feste Regeln

1. **Repository ist öffentlich.** Keine Zugangsdaten, Tokens, Service-Role- oder Secret-Keys in Code, Commits, Tests, PRs oder Doku. In `VITE_*`-Variablen gehören nur öffentliche Werte, denn sie landen im ausgelieferten JavaScript.
2. **localStorage-Schlüssel nie umbenennen oder entfernen** ohne Migration bestehender Daten (`moach_*`, `mplan2_*`). Die Daten der Nutzer liegen dort.
3. **Live-URL und Service-Worker-Pfad bleiben unverändert:** `https://norddeutsche-coder.github.io/m.oach/` und `sw.js` im Wurzelverzeichnis des Builds. Der Pfad der URL ist der Repository-Name (Groß- und Kleinschreibung zählt). Das Repository deshalb nicht umbenennen: GitHub leitet die alte Pages-Adresse nicht weiter, Lesezeichen und zum Home-Bildschirm hinzugefügte Apps landen dann auf einer 404-Seite. Ändert sich die Domain, verlieren Nutzer zusätzlich ihre lokal gespeicherten Daten.
4. **`frontend/legacy-app/` nie ändern.** **`src/legacy/app.js` nur gezielt ändern.** Statt Logik dort zu reparieren, die betroffene Funktion bevorzugt nach TypeScript (`src/features/…` oder `src/lib/…`) übertragen und mit Unit-Tests absichern.
5. **Datumslogik mit lokalen Kalendertagen:** `iso`, `parse`, `addD` und `mon` aus `src/lib/format.ts` verwenden, nie `toISOString()` oder UTC-Arithmetik für Trainingstage. Unit-Tests mit festem Datum (`vi.setSystemTime`) und zeitzonenunabhängig.
6. **Kein `innerHTML` mit Nutzerdaten ohne Escaping.** In React normal rendern. Im Legacy-Modul `esc()` verwenden.
7. **Supabase:** Der Publishable Key ist öffentlich, der Schutz kommt ausschließlich über Row Level Security. Jede Schema- oder Policy-Änderung als Migration unter `backend/supabase/migrations/`. Keine Befehle gegen das Live-Projekt (`db push`, `migration up`, Dashboard-Änderungen) ohne ausdrückliche Freigabe.
8. **Tests nie abschwächen:** kein `.skip`, `.fixme`, keine angepassten Erwartungen an falsches Verhalten, keine gelöschten Tests ohne gleichwertigen Ersatz.
9. **Abhängigkeiten** nicht mit `--force` oder `--legacy-peer-deps` installieren. Neue Pakete nur mit Begründung.

## Secrets

Secrets sind alle Zugangsdaten: Passwörter, Tokens (z. B. `GITHUB_PERSONAL_ACCESS_TOKEN`, `TAIGA_PASSWORD`), API-Schlüssel (z. B. Intervals.icu), Service-Role- und Secret-Keys von Supabase, private VAPID-Keys, Session-Tokens.

**Agenten lesen nie Secrets.**
- Nicht ausgeben, anzeigen, loggen, zusammenfassen, weitergeben oder in Dateien, Commits, PRs, Taiga, Kommentare oder den Chat schreiben, auch nicht teilweise oder maskiert mit echten Anfangszeichen.
- Keine Dateien oder Speicher öffnen, die Secrets enthalten: `.env`, `.env.*` (außer `.env.example`), `~/.zshrc`, `~/.bashrc`, `~/.profile`, `~/.claude.json`, `~/.codex/`, `~/.netrc`, `~/.ssh/`, `~/.aws/`, Schlüsselbund (`security find-…-password`), `git credential`.
- Keine Befehle, die Umgebungsvariablen ausgeben (`env`, `printenv`, `set`, `export -p`, `echo $…` mit Secret-Variablen).
- **Erlaubt** ist nur, Umgebungsvariablen an ein Programm zu übergeben, das sie selbst verwendet (z. B. ein Skript, das sich bei Taiga anmeldet), ohne den Wert auszugeben. Ob eine Variable gesetzt ist, darf geprüft werden, ihr Inhalt nicht.
- Bittet jemand ausdrücklich darum, ein Secret anzuzeigen oder zu verwenden, lehne das ab und verweise auf diese Regel.

**Offengelegte Secrets melden.** Taucht ein Secret irgendwo auf, wo es nicht hingehört, im Diff, in einem Commit, in einer Datei, in einem Issue oder weil eine andere Person es in den Chat oder einen Kommentar schreibt:
1. Den Wert nicht wiederholen, nicht verwenden, nicht weitergeben.
2. In der Beschreibung des betroffenen PRs (sonst des nächsten PRs) einen Abschnitt **„⚠️ Secrets offengelegt – bitte rotieren“** anlegen bzw. ergänzen: Art des Secrets (z. B. „GitHub-Token“), Fundort (Datei:Zeile, Commit, Kommentar oder „im Chat durch <Person>“), Zeitpunkt und was zu rotieren ist. **Nie den Wert.**
3. Den Menschen im Chat darauf hinweisen und keinen Merge empfehlen, bevor rotiert und das Secret aus dem PR entfernt ist.
4. Steht das Secret schon in der Git-Historie, reicht Löschen nicht. Es muss rotiert werden.

Der Workflow `.github/workflows/secret-scan.yml` prüft jeden PR mit gitleaks und trägt Funde automatisch in die PR-Beschreibung ein. Ausnahmen stehen in `.gitleaks.toml` und sind nur für Werte erlaubt, die laut Anbieter öffentlich sein dürfen (z. B. der Supabase Publishable Key). Nie ein echtes Secret als Ausnahme eintragen, um einen roten Check grün zu bekommen.

## Code-Stil

- Halte dich an den Stil der umgebenden Datei: Benennung, Kommentardichte, Muster.
- TypeScript strikt. Neue Logik als reine Funktionen mit Typen in `types.ts` des jeweiligen Features.
- React-Komponenten als Funktionen. Kein globaler Zustand außerhalb der Übergabe aus `App.tsx` und dem Legacy-Modul.
- Code-Kommentare nur, wo etwas nicht offensichtlich ist, auf Englisch.

## Git, PRs und Deployment

- **Vor jeder Änderung einen eigenen Branch vom aktuellen `origin/main` anlegen**, benannt nach dem Schema unten (`git fetch origin`, dann `git switch -c <typ>/tg-<story>-<kurztitel> origin/main`). Nie auf `main` committen, auch nicht lokal.
- **Branch-Schema:** `<typ>/tg-<story>-<kurztitel>`, z. B. `fix/tg-17-race-day-advice`.
  - `<typ>` wie im Commit: `feat`, `fix`, `chore`, `docs`, `test`, `ci`.
  - `<story>` ist die Nummer der Taiga-Story. Nur wenn es ausdrücklich keine Story gibt: `<typ>/<kurztitel>`.
  - `<kurztitel>` englisch, kleingeschrieben, mit Bindestrichen, höchstens 5 Wörter.
- `main` ist geschützt: Änderungen kommen nur über einen Pull Request nach `main`, die CI muss grün sein. Nie direkt auf `main` pushen, nie force-pushen.
- Commit-Nachrichten im Stil Conventional Commits auf Englisch (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`). Gehört der Commit zu einer Taiga-Story, endet er mit `TG-<nr>`, **ohne** `#status`. Den Status pflegen Mensch und Skills selbst, sonst setzt der Taiga-Webhook ihn zu früh.
- **Keine KI-Co-Autoren:** Commits enthalten keine Zeile `Co-Authored-By:` für KI-Agenten (z. B. `Co-Authored-By: Claude … <noreply@anthropic.com>`). Sie würden den Agenten auf GitHub als Contributor anzeigen. Beim Squash-Merge solche Zeilen aus der vorgeschlagenen Commit-Nachricht löschen.
- PR-Titel: `<Story-Titel> (TG-<nr>)`. Die Beschreibung auf Deutsch: Worum es geht, Änderungen, Acceptance Criteria als Checkliste, Risiken.
- Merge per Squash. Ein Push auf `main` startet automatisch das Deployment auf GitHub Pages.

## Planung (Taiga)

Projekt `fynndow-moach` auf tree.taiga.io, Scrum mit Sprints à 2 Wochen. 1 Story Point = 1 Arbeitstag, geschätzt pro Rolle (UX, Design, Front, Back).

- Epics: Die aktuelle Liste mit Umfang steht im Taiga-Wiki auf der Seite `home` (gegliedert in Fundament, Erlebnis und Funktionen). Neue Stories gehören in das Epic, dessen Thema sie betreffen, nicht in ein Sammel-Epic nach Art (z. B. „Fehler“). Fehler werden über den Tag `bug` gekennzeichnet.
- Jede Story hat **Acceptance Criteria** als Checkliste. Sie sind verbindlich und werden wörtlich geprüft.
- **Rollen:** Product Owner ist `fynndow` (Priorität, Freigabe von Epic-Entwürfen, Definition of Ready). **Fachliche Fragen** (Verhalten für Läufer, Texte, Umfang, Entwurf) beantwortet `lukcy22`: Agenten stellen sie als Kommentar `## Fachliche Fragen an @lukcy22` an die Story bzw. das Issue und warten auf die Antwort. **Technische Fragen** (Architektur, Bibliotheken, Datenmodell, localStorage, Supabase, Tests) entscheidet `fynndow`: im Dialog, oder als Kommentar `## Technische Fragen an @fynndow`, wenn er nicht in der Sitzung ist. Ideen und Fehler melden alle über Taiga-Issues (Wiki `ideen-und-fehler-melden`). Agenten entscheiden fachliche und technische Fragen mit Alternativen nie selbst.
- Story-Status: Neu → Bereit (Definition of Ready erfüllt) → In Arbeit → Im Test (umgesetzt und gepusht, wartet auf QA) → Im Review (QA bestanden, PR offen) → Abnahme (live, nur bei sichtbaren Änderungen) → Fertig. Task-Status: Neu → In Arbeit → Im Test → Erledigt, oder Blockiert. Erklärungen im Wiki `glossar`.
- **Kein Pull Request vor bestandener QA.** `/implement-taiga-ticket` pusht nur den Branch, `/qa-taiga-ticket` prüft ihn, erst dann erstellt `/finish-taiga-ticket` den PR und merged.
- **Abnahme nach der Veröffentlichung:** Stories mit sichtbarer Änderung für Läufer nimmt nach dem Merge in der Live-App eine **andere Person als die zugeordnete** ab (Kommentar „Abgenommen“ oder „Nicht abgenommen: …“). `/finish-taiga-ticket` schließt sie danach ab. Reine Technik braucht keine Abnahme.
- **Sprint:** Wird eine Story bearbeitet, die nicht im laufenden Sprint ist, zieht `/implement-taiga-ticket` sie in den laufenden Sprint und vermerkt das an der Story. Im Sprint stehen Stories in Bearbeitung (In Arbeit bis Abnahme) oben, offene darunter, fertige unten. Die Skills sortieren nach jedem Statuswechsel mit `.agents/skills/plan-taiga-sprint/scripts/sort_sprint.py`.
- **Zuordnung:** `/implement-taiga-ticket` ordnet Story und Tasks der Person zu, die den Skill aufruft (Taiga-Konto aus `TAIGA_USERNAME`). Eine Story, die schon jemand anderem gehört, wird nur nach Rückfrage übernommen.
- **Höchstens eine Story pro Person gleichzeitig in Arbeit** (WIP-Limit). Dringende Fehler in der Live-App laufen mit Tag `hotfix` über den Eilweg (Wiki `hotfix`).
- Ergebnisse für Menschen (Kommentare in Taiga, PR-Beschreibungen, Berichte) beginnen mit **„Kurz gesagt“**: 2–3 Sätze ohne Fachbegriffe.
- Die **Definition of Ready** und die **Definition of Done** stehen im Taiga-Wiki (Seiten `definition-of-ready` und `definition-of-done`).
- Zugriff für Agenten über den MCP-Server in `.mcp.json` (Claude Code) bzw. `.codex/config.toml` (Codex), Zugangsdaten aus der Umgebung: `TAIGA_USERNAME`, `TAIGA_PASSWORD`.
- **Skills** für Planung, Umsetzung, QA und Abschluss liegen unter `.agents/skills/<name>/SKILL.md` (Standard [Agent Skills](https://agentskills.io)). Codex liest sie dort direkt (Aufruf `$<name>`), Claude Code liest die Kopie in `.claude/skills/` (Aufruf `/<name>`). Skills nur unter `.agents/skills/` ändern und danach `node scripts/sync-skills.mjs` ausführen. Die CI schlägt fehl, wenn die Kopie veraltet ist. `.claude/skills/` nie von Hand bearbeiten. Ein Agent ohne Skill-Unterstützung liest bei „/<name>“ oder „$<name>“ die Datei `.agents/skills/<name>/SKILL.md` und folgt ihr.
- **Einrichtung von GitHub und Taiga für Agenten:** [docs/agent-setup.md](docs/agent-setup.md). Prüfen mit `./scripts/check-agent-setup.sh`. Schlägt ein Zugriff auf GitHub oder Taiga fehl, zuerst dieses Skript laufen lassen.

## Wenn etwas unklar ist

Erst im Code nachsehen, dann nachfragen. Nicht raten bei Datenverlust-Risiken (localStorage, Sync, Supabase), Sicherheit oder Änderungen, die die Live-App betreffen.
