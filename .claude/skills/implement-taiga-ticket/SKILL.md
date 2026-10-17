---
name: implement-taiga-ticket
description: Setzt eine Taiga-User-Story bis zur QA-Bereitschaft um, ohne Pull Request. Aufruf mit der Story-Nummer, z. B. `/implement-taiga-ticket 27`. Lädt Story und Acceptance Criteria, plant, legt Branch und Taiga-Tasks an, implementiert, macht schnelle Checks (Typen, Lint, Unit-Tests), wartet auf Freigabe, committet, pusht den Branch, wartet auf die CI und setzt die Story auf In Test. Die gründliche Prüfung macht danach /qa-taiga-ticket auf dem Branch, den PR erstellt erst /finish-taiga-ticket nach bestandener QA.
argument-hint: <story-nummer>
disable-model-invocation: true
---

# Taiga-Story umsetzen

Argument: `$ARGUMENTS` ist die Nummer einer **User Story** (z. B. `27` oder `#27`). Fehlt sie, frag danach und mach nichts weiter.

Arbeite die Phasen der Reihe nach ab. **Zwei Haltepunkte sind Pflicht:** nach dem Plan (Phase 2) und nach der Umsetzung (Phase 5). Dort hältst du an und wartest auf ein ausdrückliches Go. Ein Go zum Plan ist kein Go zum Commit.

Dieser Skill macht nur **schnelle Checks** (Typprüfung, Lint, Unit-Tests). Kein Build, keine E2E-Tests, keine Screenshots, kein Abgleich der Acceptance Criteria mit Beleg. Das übernimmt `/qa-taiga-ticket` auf dem gepushten Branch.

**Kein Pull Request vor bestandener QA.** Dieser Skill erstellt nie einen PR, auch nicht als Entwurf. Den PR erstellt erst `/finish-taiga-ticket`, nachdem `/qa-taiga-ticket` für den aktuellen Head-Commit des Branches mit „bestanden“ durchgelaufen ist und alles geprüft hat.

Ablauf über alle Skills: umsetzen → Checks → Go → Commit + Push → CI grün auf dem Branch → **In Test** → `/qa-taiga-ticket` → bei Befunden zurück zu diesem Skill (Story wieder `In progress`, QA-Tasks offen) → bei Bestehen `/finish-taiga-ticket` (PR erstellen, **In Review**, Merge, Deployment, Done).

## Projektzuordnung

Bestimme das Projekt aus `git remote get-url origin`. Ist das Repo nicht in der Tabelle, halte an und frag nach. Rate nie.

| Repo | Taiga-Projekt | Basis-Branch | App-Ordner | Schnelle Checks |
|---|---|---|---|---|
| `Norddeutsche-Coder/m.oach` | `fynndow-moach` | `main` | `frontend/` | `npm run check`, `npm run lint`, `npm test` |

Taiga-Status (Slugs) in diesem Projekt:
- **User Story:** `new`, `ready-to-implement`, `in-progress`, `in-test` (umgesetzt, wartet auf QA), `in-review` (QA bestanden, PR offen), `done`
- **Task:** `New`, `In progress`, `In Review`, `Closed`, `Blockiert`

Lies außerdem das Wiki „definition-of-done“ des Taiga-Projekts (`mcp__taiga__wiki`, op `get`). Seine Punkte gelten zusätzlich zu den Acceptance Criteria.

## Phase 1: Story laden und Lage prüfen

1. Story laden: `mcp__taiga__work` mit `op: get`, `type: story`, `item: #<nr>`, `project: <slug>`. Merke Titel, Beschreibung, Acceptance Criteria (Checkliste), Tags, Epic, Status, Sprint und Punkte.
2. Bestehende Tasks der Story laden (`op: list`, `type: task`, Filter auf die Story).
3. Git-Lage prüfen:
   - `git status`: Gibt es uncommittete Änderungen, die nicht zu dieser Story gehören, halte an und frag.
   - `git fetch origin` und nach einem Branch suchen, der `tg-<nr>-` im Namen trägt (lokal und remote).
4. **Fortsetzen statt neu anfangen:** Ist die Story schon `in-progress` oder gibt es den Branch, wechsle dorthin. Lies die offenen Tasks (vor allem `QA: …` und `Release: …` mit Geprüft, Erwartet, Tatsächlich, Ursache, Vorschlag), den QA-Kommentar und `git diff origin/<basis>...HEAD` und plane nur noch den Rest. Der Haltepunkt nach dem Plan gilt trotzdem.
5. Ist die Story `done` oder `in-review`, oder `in-test` ohne offene QA-Tasks, halte an und melde den Stand. Nächster Schritt ist dann `/qa-taiga-ticket` bzw. `/finish-taiga-ticket`.

## Phase 2: Plan (Haltepunkt 1)

Untersuche den betroffenen Code selbst, bevor du fragst. Was sich aus dem Code beantworten lässt, schlägst du nach. Zeig dann:

- **Ziel** der Story in einem Satz.
- **Acceptance Criteria** einzeln, jeweils mit: wie du sie erfüllst.
- **Schritte** als nummerierte Liste. Sie werden zu Taiga-Tasks, deshalb jeder Schritt klar abgegrenzt und höchstens ein halber Tag.
- **Betroffene Dateien.**
- **Offene Fragen:** Jede unklare oder dem Code widersprechende Acceptance Criteria, jeweils mit deinem Vorschlag.
- **Risiken**, z. B. Änderungen an localStorage-Schlüsseln, Supabase, Service Worker.
- **Branch-Name:** `<typ>/tg-<nr>-<kurztitel>`. Typ `fix`, wenn die Story den Tag `bug` hat, `chore` für reine Infrastruktur oder Doku, sonst `feat`. Der Kurztitel ist englisch, kleingeschrieben, mit Bindestrichen, höchstens 5 Wörter.

**Halte an** und warte auf ein Go. Wenn es offene Fragen gab, schreib die getroffenen Entscheidungen danach als Kommentar an die Story (`mcp__taiga__comments`).

## Phase 3: Vorbereiten (erst nach Go zum Plan)

1. Branch von aktuellem `origin/<basis>` anlegen. Beim Fortsetzen den vorhandenen nehmen.
2. Story auf `in-progress` setzen (`mcp__taiga__work`, `op: update`, `status: In progress`).
3. Für jeden Planschritt, den es noch nicht gibt, einen Task in der Story anlegen (`op: create`, `type: task`, `parent: #<nr>`, Status `New`, als Batch).

## Phase 4: Umsetzen

- Arbeite die Tasks der Reihe nach ab. Setz jeden beim Beginn auf `In progress` und nach Abschluss auf `Closed`.
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

1. Committen. Die Nachricht im Format `<typ>: <beschreibung> TG-<nr>`, z. B. `fix: stop suggesting to move the race TG-17`. **Keinen** Status-Befehl wie `#in-test` an den Commit hängen, den Status setzt dieser Skill selbst. Mehrere sinnvolle Commits sind erlaubt, jeder mit `TG-<nr>`. **Keine `Co-Authored-By:`-Zeile für KI-Agenten** (siehe AGENTS.md des Projekts).
2. `git push -u origin <branch>`. Niemals auf den Basis-Branch pushen, niemals force-pushen. **Keinen PR erstellen.**
3. **Fortsetzung nach QA-Befunden:** Die behobenen QA-Tasks auf `Closed` setzen und einen Kommentar an die Story schreiben: `Nachbesserung nach QA · <Branch> @ <head-kurz-sha>` mit den behobenen QA-Tasks und je einem Satz zur Behebung.
4. **CI abwarten:** Die CI läuft bei jedem Push. Den Lauf für den Head-Commit des Branches abfragen (`gh run list --branch <branch> --commit <sha>` bzw. `GET /repos/<repo>/actions/runs?head_sha=<sha>`), höchstens 15 Minuten, etwa jede Minute. Ist sie rot, zeig den fehlgeschlagenen Job mit Ursache und halte an. Nach deinem Go zur Behebung geht es zurück zu Phase 4, die Story bleibt `In progress`.
5. Ist die CI grün, die Story auf `In Test` setzen. Nächster Schritt: `/qa-taiga-ticket <nr>`.

## Abschlussbericht

Kurz und auf Deutsch:
- Branch, Head-Commit (Kurz-SHA) und Link zum CI-Lauf,
- Status in Taiga (Story und Tasks),
- erfüllte Acceptance Criteria und gegebenenfalls nicht erfüllte mit Grund,
- was die QA besonders prüfen sollte,
- Auffälligkeiten außerhalb des Umfangs als Vorschlag für neue Stories. Lege sie **nicht** selbst an,
- der Hinweis, dass der PR erst nach bestandener QA durch `/finish-taiga-ticket` entsteht.

## Grenzen

- **Nie einen Pull Request erstellen**, auch keinen Entwurf. Das macht `/finish-taiga-ticket` nach bestandener QA.
- Nie mergen, die Story nie auf `In Review` oder `Done` setzen.
- Keine Änderungen an GitHub-, Taiga- oder Supabase-Einstellungen, keine Migrationen gegen das Live-Projekt.
- Keine Zugangsdaten, Tokens oder Secrets in Code, Commits oder Taiga-Kommentaren.
- Geht etwas außerhalb des Plans schief, oder erfordert die Story Schritte, die nicht im freigegebenen Plan standen, halte an und frag.
