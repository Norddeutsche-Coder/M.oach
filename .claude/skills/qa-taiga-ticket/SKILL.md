---
name: qa-taiga-ticket
description: Unabhängige Qualitätsprüfung einer Taiga-User-Story. Aufruf mit optionaler Story-Nummer, z. B. `/qa-taiga-ticket 27`. Führt alle automatischen Prüfungen aus, prüft jede Acceptance Criteria mit Beleg, macht bei Änderungen an Oberfläche oder Logik Vorher/Nachher-Screenshots, reviewt den Diff, berichtet im Chat und in Taiga und setzt die Story bei Befunden zurück auf In progress. Prüft den gepushten Branch, bevor es einen PR gibt. Behebt selbst nichts.
argument-hint: [story-nummer]
disable-model-invocation: true
---

# QA einer Taiga-Story

> **Für alle Agenten** (Claude Code, Codex u. a.). Aufruf in Claude Code mit `/qa-taiga-ticket`, in Codex mit `$qa-taiga-ticket`, jeweils gefolgt vom Argument. „Taiga-MCP `work`“ meint das Werkzeug `work` des MCP-Servers `taiga` (Claude Code: `mcp__taiga__work`). GitHub-Schritte bevorzugt über das GitHub-MCP, sonst mit `gh`. `<tmp>` ist ein temporärer Arbeitsordner außerhalb des Repositorys (Claude Code: Scratchpad der Sitzung, sonst `${TMPDIR:-/tmp}/moach`). Rückfragen mit Auswahl stellst du über das Auswahl-Werkzeug des Agenten (Claude Code: `AskUserQuestion`). Gibt es keins, stell sie als nummerierte Optionen im Chat und warte auf die Antwort.

Du bist die unabhängige Prüfinstanz. **Du behebst nichts**, auch keine Kleinigkeiten. Du prüfst, belegst und berichtest. Code, Tests und Konfiguration änderst du nicht.

## 0. Story und Projekt bestimmen

1. Projekt aus `git remote get-url origin` bestimmen. Ist das Repo nicht in der Tabelle, halte an und frag.

   | Repo | Taiga-Projekt | Basis-Branch | App-Ordner | Prüfbefehle (im App-Ordner, in dieser Reihenfolge) |
   |---|---|---|---|---|
   | `Norddeutsche-Coder/m.oach` | `fynndow-moach` | `main` | `frontend/` | `npm run check`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` |

2. Story-Nummer: das Aufruf-Argument. Fehlt sie, aus dem Branch-Namen lesen (`…/tg-<nr>-…`). Gibt es keine, prüf nur den Diff gegen den Basis-Branch, ohne Taiga-Schritte, und sag das zu Beginn.
3. Story laden (Taiga-MCP `work`, `op: get`, `type: story`), außerdem ihre Tasks und das Wiki „definition-of-done“ (Taiga-MCP `wiki`, `op: get`).
4. **Prüfstand bestimmen.** Geprüft wird der **gepushte Branch** der Story (`origin/<branch>`, Branch `…/tg-<nr>-…`), genau in dem Stand, den `/implement-taiga-ticket` hinterlassen hat. Einen PR gibt es zu diesem Zeitpunkt noch nicht. Ihn erstellt erst `/finish-taiga-ticket` nach bestandener QA.
   - `git fetch origin` und einen Worktree `<tmp>/qa-tg-<nr>/branch-src` von `origin/<branch>` anlegen. **Alle Prüfungen (1–4) laufen in diesem Worktree**, nicht im Arbeitsverzeichnis. Im App-Ordner `npm ci`. Ist `package-lock.json` identisch mit dem aktuellen Stand, darf `node_modules` verlinkt werden.
   - Merke den Head-Commit des Branches (Kurz-SHA). Er steht im Bericht und im QA-Kommentar, `/finish-taiga-ticket` gleicht ihn ab.
   - Diff = `git diff origin/<basis>...origin/<branch>`.
   - Story-Status sollte `In Test` sein. Ist sie `In progress`, sag das zu Beginn, prüfe aber trotzdem.
   - Hat der lokale Branch Commits, die noch nicht gepusht sind, oder uncommittete Änderungen, prüfe trotzdem nur `origin/<branch>` und sag das zu Beginn.
   - **Gibt es für den Branch schon einen PR**, ist das ein **Befund** (Verstoß gegen den Ablauf: kein PR vor bestandener QA). Prüfe trotzdem weiter.

## 1. Automatische Prüfungen

Führe alle Prüfbefehle aus der Tabelle aus, auch wenn einer fehlschlägt. Halte pro Befehl fest: bestanden oder fehlgeschlagen, mit den relevanten Zeilen der Ausgabe. Für den Build braucht M.oach `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY`. Verwende Testwerte (`https://test-project.supabase.co`, `sb_publishable_test_only_000000000000`), nie echte Zugangsdaten. Jeder fehlgeschlagene Befehl ist ein **Befund**.

## 2. Acceptance Criteria

Prüfe jede Acceptance Criteria der Story einzeln und unabhängig davon, ob sie in Taiga abgehakt ist:
- **Erfüllt**, mit Beleg: welcher Test sie abdeckt (Datei und Testname), welche Codestelle (Datei:Zeile) oder welcher Screenshot.
- **Nicht erfüllt** oder **nicht belegbar**: Das ist ein **Befund**, mit Begründung.

Prüfe ebenso die Punkte der Definition of Done, soweit sie vor dem Merge prüfbar sind. Merge, Deployment und Live-Test sind es nicht, die markierst du als „nach dem Merge“.

## 3. Screenshots (bei Änderungen an Oberfläche oder Logik)

**Wann:** Wenn der Diff die Oberfläche betrifft (`.tsx`, `.css`, `index.html`, `src/legacy/app.js`, `public/`) oder Logik, die in der Oberfläche sichtbar wird (Trainingsplan, Readiness, Anpassungen, Berechnungen, Texte). Bei Logikänderungen prüfst du, **ob das neue Verhalten in der Oberfläche ankommt**. Dafür baust du Testdaten, die genau den betroffenen Fall auslösen (z. B. Readiness-Wert 8, Renntag, Plan mit genau 5 Wochen). Reine Änderungen an Tests, Doku oder CI brauchen keine Screenshots.

**Vorgehen (Vorher/Nachher):**
1. Arbeitsordner unter `<tmp>` anlegen, z. B. `<tmp>/qa-tg-<nr>/`, darin `branch/`, `basis/` und `szenarien.json`.
2. **Nachher:** Im App-Ordner des Prüfstands (Worktree aus Abschnitt 0) mit Testwerten bauen, dann `npx vite preview --host 127.0.0.1 --port 4181 --strictPort` im Hintergrund starten.
3. **Vorher:** `git worktree add <tmp>/qa-tg-<nr>/worktree origin/<basis>`. Im App-Ordner des Worktrees `npm ci`. Ist `package-lock.json` identisch, darf stattdessen `node_modules` vom aktuellen Stand verlinkt werden. Dann bauen und auf Port 4182 starten.
4. `szenarien.json` schreiben: pro betroffener Ansicht und Fall ein Szenario, jeweils **Handy und Desktop, hell und dunkel**. Testdaten für M.oach werden über localStorage gesetzt, Vorlage siehe `frontend/tests/today.spec.ts` (Funktion `seed`) und `frontend/tests/fixtures/`. Immer mit festem Datum.
5. Für beide Stände ausführen:
   `node <repo>/.agents/skills/qa-taiga-ticket/scripts/shots.cjs <app-ordner>/node_modules/@playwright/test http://127.0.0.1:<port>/ <tmp>/qa-tg-<nr>/<branch|basis> <szenarien.json>` (`<repo>` ist das Wurzelverzeichnis des Repositorys)
6. **Jeden Screenshot ansehen** (Bild öffnen, in Claude Code mit dem Read-Tool) und Vorher/Nachher vergleichen. Prüfe:
   - Ist die beabsichtigte Änderung sichtbar und richtig (inhaltlich und visuell)?
   - Gibt es Regressionen: Überlappungen, abgeschnittener Text, unschöne Umbrüche (z. B. Wert und Einheit getrennt), leere Bereiche, falsche Farben, Dunkelmodus, Inhalt hinter der Navigation?
   - Konsolenfehler, die das Skript meldet?
   Fehler sind **Befunde**, reine Geschmacksfragen **Hinweise**.
7. Aufräumen: Preview-Server beenden und alle Worktrees mit `git worktree remove` entfernen. Die Screenshots bleiben unter `<tmp>`.

## 4. Code-Review

Lies den Diff und prüfe:
- Fehler in der Logik, nicht behandelte Fälle, Datums- und Zeitzonenfehler,
- Sicherheit: XSS (`innerHTML` mit Nutzerdaten ohne `esc()`), Secrets im Code, RLS-relevante Änderungen,
- Änderungen an localStorage-Schlüsseln ohne Migration, Service Worker, Supabase-Schema,
- Änderungen außerhalb des Umfangs der Story,
- abgeschwächte, übersprungene (`.skip`, `.fixme`) oder gelöschte Tests.

Einordnung:
- **Befund:** Fehler, Sicherheitsproblem, Verstoß gegen Acceptance Criteria oder Definition of Done.
- **Hinweis:** optionale Verbesserung (Benennung, Lesbarkeit, Stil).

## Pflichtangaben je Befund

Jeder Befund wird überall (Chat, Taiga-Kommentar, QA-Task) mit denselben fünf Angaben beschrieben. Ein Befund ohne Ursache ist unvollständig: Untersuche ihn, bis du sie benennen kannst. Kannst du sie wirklich nicht finden, schreib „Ursache unklar“ und was du bereits ausgeschlossen hast.

- **Geprüft:** was genau, z. B. Befehl (`npm run test:e2e`), Testdatei und Testname, Acceptance Criteria im Wortlaut, Screenshot-Szenario (Ansicht, Gerät, hell/dunkel, Testdaten).
- **Erwartet:** das korrekte Ergebnis laut Acceptance Criteria, Definition of Done oder Test.
- **Tatsächlich:** was passiert ist, mit einem kurzen Auszug der Fehlermeldung (höchstens 10 Zeilen, Pfade gekürzt) oder dem Screenshot-Dateinamen.
- **Ursache:** warum es fehlschlägt, mit Fundstelle (Datei:Zeile) und Erklärung in 1–3 Sätzen.
- **Vorschlag:** wie es sich beheben lässt, ohne den Test abzuschwächen.

## 5. Ergebnis in Taiga (nur mit Story)

**Gibt es mindestens einen Befund:**
1. Story auf `In progress` setzen (Taiga-MCP `work`, `op: update`, `status: In progress`).
2. Pro Befund einen Task in der Story anlegen, Titel `QA: <kurze Beschreibung>`, Status `New`. Die Beschreibung enthält die fünf Pflichtangaben (Geprüft, Erwartet, Tatsächlich, Ursache, Vorschlag). Mehrere als Batch (`op: create`, `type: task`, `items`). Gibt es einen gleichnamigen offenen QA-Task schon, lege keinen doppelten an, sondern ergänze ihn als Kommentar.

**Gibt es keinen Befund:** Den Story-Status nicht ändern (bleibt `In Test`). Alle Tasks der Story mit Status `In Test` auf `Closed` setzen, auch behobene QA-Tasks.

**In beiden Fällen:**
1. Relevante Screenshots an die Story hängen (Taiga-MCP `attachments`, `op: upload`, `type: story`, `filePath`). Gemeint sind die Nachher-Bilder, die Befunde oder die beabsichtigte Änderung zeigen, und dazu die Vorher-Bilder für den Vergleich. Höchstens 8, mit Beschreibung wie „Nachher · Handy · dunkel · Readiness 8“.
2. Einen Kommentar an die Story (Taiga-MCP `comments`, `op: add`):
   ```
   ## QA <✅ bestanden | ❌ nicht bestanden> · <Datum> · Branch <branch> @ <head-kurz-sha>

   ### Was geprüft wurde
   **Automatische Prüfungen**
   - `npm run check` ✅
   - `npm run lint` ✅
   - `npm test` ✅ n Tests in m Dateien
   - `npm run build` ✅
   - `npm run test:e2e` ❌ n von m bestanden (fehlgeschlagen: <Testnamen>)

   **Acceptance Criteria:** x von y erfüllt
   - ✅/❌ <AC im Wortlaut> – <Beleg bzw. Grund>

   **Definition of Done:** <erfüllt / Abweichungen>
   **Screenshots:** <Szenarien in Kurzform, z. B. „Heute · Handy/Desktop · hell/dunkel · Readiness 8“>, Vorher/Nachher, <Anzahl> angehängt | keine nötig, weil <Grund>
   **Code-Review:** <geprüfte Bereiche in einem Satz>

   ### Befunde (→ QA-Tasks #…)
   **1. <Kurztitel>** (QA-Task #<nr>)
   - Geprüft: …
   - Erwartet: …
   - Tatsächlich: …
   - Ursache: … (`datei:zeile`)
   - Vorschlag: …

   ### Hinweise
   - … | keine
   ```
   Bei „bestanden“ entfällt der Abschnitt „Befunde“, der Abschnitt „Was geprüft wurde“ bleibt immer vollständig.

## 6. Bericht im Chat

Derselbe Inhalt wie der Kommentar, also immer vollständig, was geprüft wurde, und je Befund die fünf Pflichtangaben. Zusätzlich:
- die Pfade der wichtigsten Screenshots. Zeig 2–4 aussagekräftige Bilder direkt (Bild öffnen, in Claude Code mit dem Read-Tool),
- bei Befunden: die angelegten QA-Tasks mit Nummer und den Hinweis, dass `/implement-taiga-ticket <nr>` beim Fortsetzen die offenen QA-Tasks abarbeitet,
- bei bestanden: dass jetzt `/finish-taiga-ticket <nr>` den PR erstellen, mergen und veröffentlichen kann. Die Story bleibt `In Test`.

## Grenzen

- Nichts beheben, nichts committen, pushen oder mergen, keinen PR erstellen. Nur QA-Tasks, Kommentare, Anhänge, den Story-Status `In progress` bei Befunden und bei bestandener QA den Task-Status `Closed` (von `In Test`) in Taiga anlegen bzw. setzen.
- Story nie auf `In Review` oder `Done` setzen.
- Keine echten Zugangsdaten für Builds oder Screenshots verwenden. Keine Anfragen an Live-Systeme (das Skript blockiert externe Hosts).
- Kann ein Schritt nicht ausgeführt werden (z. B. Build schlägt fehl, deshalb keine Screenshots), ist das ein Befund. Weiterprüfen, was noch geht.
