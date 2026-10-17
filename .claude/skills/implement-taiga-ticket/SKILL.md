---
name: implement-taiga-ticket
description: Setzt eine Taiga-User-Story bis zur QA-Bereitschaft um, ohne Pull Request. Aufruf mit der Story-Nummer, z. B. `/implement-taiga-ticket 27`. Prüft die Definition of Ready, plant, legt Branch und Taiga-Tasks an, implementiert, macht schnelle Checks (Typen, Lint, Unit-Tests), wartet auf Freigabe, committet, pusht den Branch, wartet auf die CI und setzt die Story auf Im Test. Danach prüft /qa-taiga-ticket, der Product Owner nimmt ab, und erst /finish-taiga-ticket erstellt den PR.
argument-hint: <story-nummer>
disable-model-invocation: true
---

# Taiga-Story umsetzen

> **Für alle Agenten** (Claude Code, Codex u. a.). Aufruf in Claude Code mit `/implement-taiga-ticket`, in Codex mit `$implement-taiga-ticket`, jeweils gefolgt vom Argument. „Taiga-MCP `work`“ meint das Werkzeug `work` des MCP-Servers `taiga` (Claude Code: `mcp__taiga__work`). GitHub-Schritte bevorzugt über das GitHub-MCP, sonst mit `gh`. `<tmp>` ist ein temporärer Arbeitsordner außerhalb des Repositorys (Claude Code: Scratchpad der Sitzung, sonst `${TMPDIR:-/tmp}/moach`). Rückfragen mit Auswahl stellst du über das Auswahl-Werkzeug des Agenten (Claude Code: `AskUserQuestion`). Gibt es keins, stell sie als nummerierte Optionen im Chat und warte auf die Antwort.

Argument: das Aufruf-Argument ist die Nummer einer **User Story** (z. B. `27` oder `#27`). Fehlt sie, frag danach und mach nichts weiter.

Arbeite die Phasen der Reihe nach ab. **Zwei Haltepunkte sind Pflicht:** nach dem Plan (Phase 2) und nach der Umsetzung (Phase 5). Dort hältst du an und wartest auf ein ausdrückliches Go. Ein Go zum Plan ist kein Go zum Commit.

Dieser Skill macht nur **schnelle Checks** (Typprüfung, Lint, Unit-Tests). Kein Build, keine E2E-Tests, keine Screenshots, kein Abgleich der Acceptance Criteria mit Beleg. Das übernimmt `/qa-taiga-ticket` auf dem gepushten Branch.

**Kein Pull Request vor bestandener QA und Abnahme.** Dieser Skill erstellt nie einen PR, auch nicht als Entwurf. Den PR erstellt erst `/finish-taiga-ticket`.

Ablauf über alle Skills: umsetzen → Checks → Go → Commit + Push → CI grün → **Im Test** → `/qa-taiga-ticket` → bei Befunden zurück zu diesem Skill (Story wieder `In Arbeit`) → bei Bestehen **Abnahme** durch den Product Owner → `/finish-taiga-ticket` (PR, **Im Review**, Merge, Deployment, **Fertig**).

## Projektzuordnung

Bestimme das Projekt aus `git remote get-url origin`. Ist das Repo nicht in der Tabelle, halte an und frag nach. Rate nie.

| Repo | Taiga-Projekt | Basis-Branch | App-Ordner | Schnelle Checks | Product Owner | Fachliche Fragen | Technische Fragen |
|---|---|---|---|---|---|---|---|
| `Norddeutsche-Coder/m.oach` | `fynndow-moach` | `main` | `frontend/` | `npm run check`, `npm run lint`, `npm test` | `fynndow` | `lukcy22` | `fynndow` |

**Fachliche Fragen** (Verhalten, Texte, Umfang, Entwurf) beantwortet `lukcy22`, nicht der Agent und nicht die Entwicklung. Stell sie als Kommentar an die Story mit der Überschrift `## Fachliche Fragen an @lukcy22`: nummeriert, je Frage 2–4 Antwortmöglichkeiten in Alltagssprache, die empfohlene zuerst mit „(Empfehlung)“. Die Erwähnung `@lukcy22` löst die E-Mail von Taiga aus. Danach halte an. Weiter geht es erst, wenn `lukcy22` in einem Kommentar geantwortet hat. Antwortet er nicht, kann der Product Owner ausdrücklich an seiner Stelle entscheiden.

Taiga-Status in diesem Projekt (Name, Slug in Klammern):
- **User Story:** Neu (`neu`), Bereit (`bereit`, Definition of Ready erfüllt), In Arbeit (`in-arbeit`), Im Test (`im-test`, gepusht, wartet auf QA), Abnahme (`abnahme`, QA bestanden, wartet auf den Product Owner), Im Review (`im-review`, PR offen), Fertig (`fertig`), Archiviert (`archiviert`)
- **Task:** Neu, In Arbeit, Im Test (erledigt, wartet auf QA), Im Review, Erledigt (setzt `/qa-taiga-ticket` nach bestandener QA), Blockiert

Lies außerdem die Wiki-Seiten `definition-of-ready` und `definition-of-done` (Taiga-MCP `wiki`, op `get`). Ihre Punkte gelten zusätzlich zu den Acceptance Criteria.

**Hotfix:** Trägt die Story den Tag `hotfix` (dringender Fehler in der Live-App), entfallen die Prüfung der Definition of Ready, das WIP-Limit und der Entwurf. Alles andere gilt unverändert. Ablauf siehe Wiki-Seite `hotfix`.

## Phase 1: Story laden und Lage prüfen

1. Story laden: Taiga-MCP `work` mit `op: get`, `type: story`, `item: #<nr>`, `project: <slug>`. Merke Titel, Beschreibung, Acceptance Criteria (Checkliste), Tags, Epic, Status, Sprint und Punkte.
2. Bestehende Tasks und Kommentare der Story laden (`op: list`, `type: task`, Filter auf die Story; Taiga-MCP `comments`, `op: list`).
3. Git-Lage prüfen:
   - `git status`: Gibt es uncommittete Änderungen, die nicht zu dieser Story gehören, halte an und frag.
   - `git fetch origin` und nach einem Branch suchen, der `tg-<nr>-` im Namen trägt (lokal und remote).
4. **Fortsetzen statt neu anfangen:** Ist die Story schon `In Arbeit` oder gibt es den Branch, wechsle dorthin. Lies die offenen Tasks (vor allem `QA: …`, `Abnahme: …` und `Release: …` mit Geprüft, Erwartet, Tatsächlich, Ursache, Vorschlag), die Kommentare von QA und Product Owner und `git diff origin/<basis>...HEAD` und plane nur noch den Rest. Der Haltepunkt nach dem Plan gilt trotzdem.
5. Ist die Story `Fertig` oder `Im Review`, oder `Im Test` bzw. `Abnahme` ohne offene Tasks, halte an und melde den Stand. Nächster Schritt ist dann `/qa-taiga-ticket`, die Abnahme durch den Product Owner bzw. `/finish-taiga-ticket`.
6. **WIP-Limit:** Gibt es außer dieser eine andere Story im Status `In Arbeit` (`op: list`, `type: story`, `status: In Arbeit`), halte an und frag, ob die andere zuerst fertig werden soll. Höchstens eine Story ist gleichzeitig in Arbeit (gilt nicht für `hotfix`).
7. **Definition of Ready:** Ist die Story `Bereit`, weiter. Ist sie `Neu`, prüf die Punkte der Wiki-Seite `definition-of-ready` und zeig das Ergebnis im Plan. Fehlende fachliche Punkte sind Fragen an `lukcy22`, fehlende Schätzung oder Priorität klärt der Product Owner.
8. **Entwurf bei Oberflächen-Stories:** Betrifft die Story die Oberfläche (sichtbare Ansichten, Texte, Layout), braucht sie einen freigegebenen Entwurf: einen Link (z. B. Figma) oder ein Bild in der Story und einen Kommentar des Product Owners „Entwurf freigegeben“ oder „Kein Entwurf nötig“. Fehlt das, ist es eine fachliche Frage an `lukcy22`.

## Phase 2: Plan (Haltepunkt 1)

Untersuche den betroffenen Code selbst, bevor du fragst. Was sich aus dem Code beantworten lässt, schlägst du nach. Zeig dann:

- **Kurz gesagt:** 2–3 Sätze ohne Fachbegriffe: was sich für Läufer ändert und woran man es sieht.
- **Ziel** der Story in einem Satz.
- **Definition of Ready:** erfüllt, oder welche Punkte fehlen (nur bei Status `Neu`).
- **Acceptance Criteria** einzeln, jeweils mit: wie du sie erfüllst.
- **Schritte** als nummerierte Liste. Sie werden zu Taiga-Tasks, deshalb jeder Schritt klar abgegrenzt und höchstens ein halber Tag.
- **Betroffene Dateien.**
- **Fachliche Fragen an `lukcy22`:** Verhalten, Texte, Umfang, Entwurf, fehlende fachliche Punkte der Definition of Ready. Jeweils mit deinem Vorschlag, in Alltagssprache. Gibt es welche, schreib sie wie oben beschrieben als Kommentar an die Story und halte an. Bereits beantwortete Fragen übernimmst du aus den Kommentaren.
- **Technische Fragen an `fynndow`:** was du technisch vorhast, wo es Alternativen gibt (Architektur, Bibliotheken, Datenmodell, localStorage, Supabase, Tests), jeweils mit Empfehlung. Sie entscheidet `fynndow`, im Dialog über das Auswahl-Werkzeug. Läuft die Sitzung ohne ihn, als Kommentar `## Technische Fragen an @fynndow` an die Story, dann anhalten.
- **Risiken**, z. B. Änderungen an localStorage-Schlüsseln, Supabase, Service Worker.
- **Branch-Name:** `<typ>/tg-<nr>-<kurztitel>`. Typ `fix`, wenn die Story den Tag `bug` oder `hotfix` hat, `chore` für reine Infrastruktur oder Doku, sonst `feat`. Der Kurztitel ist englisch, kleingeschrieben, mit Bindestrichen, höchstens 5 Wörter.

**Halte an** und warte auf ein Go. Ein Go zum Plan gibt es erst, wenn alle fachlichen Fragen von `lukcy22` (oder ausdrücklich vom Product Owner) beantwortet sind. Ebenso müssen die technischen Fragen von `fynndow` entschieden sein. Schreib die technischen Entscheidungen danach als Kommentar an die Story (Taiga-MCP `comments`).

## Phase 3: Vorbereiten (erst nach Go zum Plan)

1. Branch von aktuellem `origin/<basis>` anlegen. Beim Fortsetzen den vorhandenen nehmen.
2. Story auf `In Arbeit` setzen (Taiga-MCP `work`, `op: update`, `status: In Arbeit`).
3. Für jeden Planschritt, den es noch nicht gibt, einen Task in der Story anlegen (`op: create`, `type: task`, `parent: #<nr>`, Status `Neu`, als Batch).

## Phase 4: Umsetzen

- Arbeite die Tasks der Reihe nach ab. Setz jeden beim Beginn auf `In Arbeit` und nach Abschluss auf `Im Test`. Auf `Erledigt` setzt sie erst `/qa-taiga-ticket` nach bestandener QA.
- Bei Oberflächen-Stories setzt du den freigegebenen Entwurf um. Weichst du ab, weil der Entwurf technisch nicht passt, notier die Abweichung für den Abschlussbericht und die Abnahme.
- Halte dich an den Stil des umgebenden Codes. Ändere nichts außerhalb des Umfangs der Story. Fällt dir etwas anderes auf, notier es für den Abschlussbericht.
- Kann ein Task nicht abgeschlossen werden, setz ihn auf `Blockiert`, schreib den Grund als Kommentar und halte an.

## Phase 5: Schnelle Checks und Freigabe (Haltepunkt 2)

1. Die schnellen Checks aus der Tabelle im App-Ordner ausführen.
2. **Schlägt etwas fehl:** Ursache suchen und beheben, **höchstens 3 Runden**. Tests nie abschwächen, überspringen (`.skip`, `.fixme`) oder Erwartungen an falsches Verhalten anpassen. Ist es nach 3 Runden nicht grün, halte an und zeig Fehler, Ursache und Vorschlag.
3. Wenn alles grün ist, zeig:
   - die Ergebnisse der Checks (eine Zeile je Befehl),
   - jede Acceptance Criteria mit ✅ umgesetzt bzw. ❌ offen und Grund,
   - `git diff --stat` und die wichtigsten Änderungen,
   - die geplante Commit-Nachricht.

**Halte an** und warte auf ein Go. **Ohne Go wird nichts committet oder gepusht.**

## Phase 6: Committen und pushen (erst nach Go)

1. Committen. Die Nachricht im Format `<typ>: <beschreibung> TG-<nr>`, z. B. `fix: stop suggesting to move the race TG-17`. **Keinen** Status-Befehl wie `#im-test` an den Commit hängen, den Status setzt dieser Skill selbst. Mehrere sinnvolle Commits sind erlaubt, jeder mit `TG-<nr>`. **Keine `Co-Authored-By:`-Zeile für KI-Agenten** (siehe AGENTS.md des Projekts).
2. `git push -u origin <branch>`. Niemals auf den Basis-Branch pushen, niemals force-pushen. **Keinen PR erstellen.**
3. **Fortsetzung nach QA- oder Abnahme-Befunden:** Die behobenen `QA: …`- bzw. `Abnahme: …`-Tasks auf `Im Test` setzen.
4. **CI abwarten:** Die CI läuft bei jedem Push. Den Lauf für den Head-Commit des Branches abfragen (`gh run list --branch <branch> --commit <sha>` bzw. `GET /repos/<repo>/actions/runs?head_sha=<sha>`), höchstens 15 Minuten, etwa jede Minute. Ist sie rot, zeig den fehlgeschlagenen Job mit Ursache und halte an. Nach deinem Go zur Behebung geht es zurück zu Phase 4, die Story bleibt `In Arbeit`.
5. Ist die CI grün, die Story auf `Im Test` setzen und einen Kommentar an die Story schreiben:
   ```
   ## Umgesetzt · <Datum> · Branch <branch> @ <head-kurz-sha>

   **Kurz gesagt:** <2–3 Sätze ohne Fachbegriffe: was sich für Läufer ändert, wo man es sieht>

   **Für die QA:** <was besonders zu prüfen ist, Abweichungen vom Entwurf>
   **Behoben nach QA/Abnahme:** <Tasks mit je einem Satz> | –
   ```
   Nächster Schritt: `/qa-taiga-ticket <nr>`.

## Abschlussbericht

Kurz und auf Deutsch, beginnend mit **Kurz gesagt** (2–3 Sätze ohne Fachbegriffe):
- Branch, Head-Commit (Kurz-SHA) und Link zum CI-Lauf,
- Status in Taiga (Story und Tasks),
- erfüllte Acceptance Criteria und gegebenenfalls nicht erfüllte mit Grund,
- was die QA besonders prüfen sollte,
- Auffälligkeiten außerhalb des Umfangs als Vorschlag für neue Stories. Lege sie **nicht** selbst an,
- der Hinweis, dass nach der QA der Product Owner abnimmt und erst dann `/finish-taiga-ticket` den PR erstellt.

## Grenzen

- **Nie einen Pull Request erstellen**, auch keinen Entwurf. Das macht `/finish-taiga-ticket` nach QA und Abnahme.
- Nie mergen, die Story nie auf `Abnahme`, `Im Review` oder `Fertig` setzen.
- Fachliche Fragen nie selbst entscheiden, sondern `lukcy22` vorlegen. Technische Fragen mit Alternativen nie selbst entscheiden, sondern `fynndow` vorlegen.
- Keine Änderungen an GitHub-, Taiga- oder Supabase-Einstellungen, keine Migrationen gegen das Live-Projekt.
- Keine Zugangsdaten, Tokens oder Secrets in Code, Commits oder Taiga-Kommentaren.
- Geht etwas außerhalb des Plans schief, oder erfordert die Story Schritte, die nicht im freigegebenen Plan standen, halte an und frag.
