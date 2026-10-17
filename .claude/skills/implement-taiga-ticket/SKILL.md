---
name: implement-taiga-ticket
description: Setzt eine Taiga-User-Story vollständig bis zum Pull Request um. Aufruf mit der Story-Nummer, z. B. `/implement-taiga-ticket 27`. Lädt Story und Acceptance Criteria, plant, legt Branch und Taiga-Tasks an, implementiert, macht schnelle Checks (Typen, Lint, Unit-Tests), wartet auf Freigabe, committet, öffnet den PR, wartet auf die CI und setzt die Story auf In Review. Die gründliche Prüfung macht danach /qa-taiga-ticket auf dem Merge-Stand des PR.
argument-hint: <story-nummer>
disable-model-invocation: true
---

# Taiga-Story umsetzen

Argument: `$ARGUMENTS` ist die Nummer einer **User Story** (z. B. `27` oder `#27`). Fehlt sie, frag danach und mach nichts weiter.

Arbeite die Phasen der Reihe nach ab. **Zwei Haltepunkte sind Pflicht:** nach dem Plan (Phase 2) und nach der Umsetzung (Phase 5). Dort hältst du an und wartest auf ein ausdrückliches Go. Ein Go zum Plan ist kein Go zum Commit.

Dieser Skill macht nur **schnelle Checks** (Typprüfung, Lint, Unit-Tests). Kein Build, keine E2E-Tests, keine Screenshots, kein Abgleich der Acceptance Criteria mit Beleg. Das übernimmt `/qa-taiga-ticket`, nachdem der PR offen ist, auf dem Merge-Stand des PR (also dem späteren `main`, noch nicht live).

Ablauf über alle Skills: umsetzen → Checks → Go → Commit + PR → CI grün → **In Review** → `/qa-taiga-ticket` → bei Befunden zurück zu diesem Skill (Story wieder `In progress`, QA-Tasks offen) → bei Bestehen `/finish-taiga-ticket` (Merge, Deployment, Done).

## Projektzuordnung

Bestimme das Projekt aus `git remote get-url origin`. Ist das Repo nicht in der Tabelle, halte an und frag nach. Rate nie.

| Repo | Taiga-Projekt | Basis-Branch | App-Ordner | Schnelle Checks |
|---|---|---|---|---|
| `Norddeutsche-Coder/m.oach` | `fynndow-moach` | `main` | `frontend/` | `npm run check`, `npm run lint`, `npm test` |

Taiga-Status (Slugs) in diesem Projekt:
- **User Story:** `new`, `ready-to-implement`, `in-progress`, `in-review`, `done`
- **Task:** `New`, `In progress`, `In Review`, `Closed`, `Blockiert`

Lies außerdem das Wiki „definition-of-done“ des Taiga-Projekts (`mcp__taiga__wiki`, op `get`). Seine Punkte gelten zusätzlich zu den Acceptance Criteria.

## Phase 1: Story laden und Lage prüfen

1. Story laden: `mcp__taiga__work` mit `op: get`, `type: story`, `item: #<nr>`, `project: <slug>`. Merke Titel, Beschreibung, Acceptance Criteria (Checkliste), Tags, Epic, Status, Sprint und Punkte.
2. Bestehende Tasks der Story laden (`op: list`, `type: task`, Filter auf die Story).
3. Git-Lage prüfen:
   - `git status`: Gibt es uncommittete Änderungen, die nicht zu dieser Story gehören, halte an und frag.
   - `git fetch origin` und nach einem Branch suchen, der `tg-<nr>-` im Namen trägt (lokal und remote).
4. **Fortsetzen statt neu anfangen:** Ist die Story schon `in-progress` oder gibt es den Branch, wechsle dorthin. Lies die offenen Tasks (vor allem `QA: …` und `Release: …` mit Geprüft, Erwartet, Tatsächlich, Ursache, Vorschlag), den QA-Kommentar und `git diff origin/<basis>...HEAD` und plane nur noch den Rest. Der Haltepunkt nach dem Plan gilt trotzdem. Gibt es schon einen offenen PR, wird er in Phase 6 weiterverwendet.
5. Ist die Story `done`, oder `in-review` ohne offene QA-Tasks, halte an und melde den Stand. Nächster Schritt ist dann `/qa-taiga-ticket` bzw. `/finish-taiga-ticket`.

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

## Phase 6: Committen und PR (erst nach Go)

1. Committen. Die Nachricht im Format `<typ>: <beschreibung> TG-<nr>`, z. B. `fix: stop suggesting to move the race TG-17`. **Keinen** Status-Befehl wie `#in-review` an den Commit hängen, den Status setzt dieser Skill selbst. Mehrere sinnvolle Commits sind erlaubt, jeder mit `TG-<nr>`. **Keine `Co-Authored-By:`-Zeile für KI-Agenten** (siehe AGENTS.md des Projekts).
2. `git push -u origin <branch>`. Niemals auf den Basis-Branch pushen, niemals force-pushen.
3. **Gibt es für den Branch schon einen offenen PR** (Fortsetzung nach QA-Befunden), aktualisiert der Push ihn. Ergänze die PR-Beschreibung um einen Abschnitt „Nachbesserung nach QA“ mit den behobenen QA-Tasks und setze diese auf `Closed`. Weiter mit Schritt 5.
   **Sonst** PR nach `<basis>` öffnen. Bevorzugt mit dem GitHub-MCP (`create_pull_request`). Gibt es eine PR-Vorlage im Repo, nutz sie. Titel: `<Story-Titel> (TG-<nr>)`. Die Beschreibung ist auf Deutsch:
   - Worum es geht (1–2 Sätze) und ein Link zur Story `https://tree.taiga.io/project/<slug>/us/<nr>`,
   - Änderungen,
   - die Acceptance Criteria als abgehakte Checkliste,
   - Risiken bzw. was beim Review zu beachten ist,
   - abschließend die Attribution-Zeile der Sitzung für PR-Beschreibungen.

   Ist das GitHub-MCP nicht verbunden, öffne die Vergleichsseite mit vorausgefülltem Titel und Text im Browser (`open "https://github.com/<repo>/compare/<basis>...<branch>?expand=1&title=…&body=…"`) und sag, dass der Klick auf „Create pull request“ noch fehlt.
4. Den PR-Link in das Story-Feld **„Pull Request“** eintragen. Das MCP kann keine eigenen Felder setzen, deshalb über die Taiga-API mit `TAIGA_USERNAME` und `TAIGA_PASSWORD` aus der Umgebung:
   ```python
   # python3 -I - ; Zugangsdaten nie ausgeben
   import json, os, urllib.request
   API = os.environ.get("TAIGA_API_URL", "https://api.taiga.io/api/v1")
   def call(m, p, b=None, t=None):
       r = urllib.request.Request(API + p, method=m, data=json.dumps(b).encode() if b is not None else None,
           headers={"Content-Type": "application/json", **({"Authorization": "Bearer " + t} if t else {})})
       with urllib.request.urlopen(r) as x: return json.load(x)
   t = call("POST", "/auth", {"type": "normal", "username": os.environ["TAIGA_USERNAME"], "password": os.environ["TAIGA_PASSWORD"]})["auth_token"]
   pid = call("GET", f"/projects/by_slug?slug={SLUG}", t=t)["id"]
   us = call("GET", f"/userstories/by_ref?project={pid}&ref={NR}", t=t)
   attr = next(a for a in call("GET", f"/userstory-custom-attributes?project={pid}", t=t) if a["name"] == "Pull Request")
   cur = call("GET", f"/userstories/custom-attributes-values/{us['id']}", t=t)
   vals = {**cur["attributes_values"], str(attr["id"]): PR_URL}
   call("PATCH", f"/userstories/custom-attributes-values/{us['id']}", {"attributes_values": vals, "version": cur["version"]}, t=t)
   ```
   Wird der PR erst durch einen Klick im Browser angelegt, trägst du den Link ein, sobald es ihn gibt (`gh` bzw. GitHub-MCP oder die öffentliche API zum Nachsehen).
5. **CI abwarten:** den Status des PR-Head-Commits abfragen (GitHub-MCP `pull_request_read`, Methode `get_status`), höchstens 15 Minuten, etwa jede Minute. Ist sie rot, zeig den fehlgeschlagenen Job mit Ursache und halte an. Nach deinem Go zur Behebung geht es zurück zu Phase 4, die Story bleibt `In progress`.
6. Ist die CI grün, die Story auf `In Review` setzen. Nächster Schritt: `/qa-taiga-ticket <nr>`.

## Abschlussbericht

Kurz und auf Deutsch:
- PR-Link und Branch,
- Status in Taiga (Story und Tasks),
- erfüllte Acceptance Criteria und gegebenenfalls nicht erfüllte mit Grund,
- was beim Review zu beachten ist,
- Auffälligkeiten außerhalb des Umfangs als Vorschlag für neue Stories. Lege sie **nicht** selbst an.

## Grenzen

- Nie mergen, nie die Story auf `done` setzen. Beides macht `/finish-taiga-ticket` nach bestandener QA.
- Keine Änderungen an GitHub-, Taiga- oder Supabase-Einstellungen, keine Migrationen gegen das Live-Projekt.
- Keine Zugangsdaten, Tokens oder Secrets in Code, Commits, PR-Texten oder Taiga-Kommentaren.
- Geht etwas außerhalb des Plans schief, oder erfordert die Story Schritte, die nicht im freigegebenen Plan standen, halte an und frag.
