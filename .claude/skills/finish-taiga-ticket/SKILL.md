---
name: finish-taiga-ticket
description: Schließt eine Taiga-User-Story nach bestandener QA und Abnahme durch den Product Owner ab. Aufruf mit der Story-Nummer, z. B. `/finish-taiga-ticket 27`. Prüft CI, QA, Abnahme und Acceptance Criteria auf dem Branch, wartet auf Go, erstellt erst dann den PR, setzt die Story auf Im Review, merged den PR per Squash, wartet auf das Deployment, macht einen Smoke-Test der Live-App, setzt Story und Tasks auf Fertig/Erledigt, schreibt einen Release-Kommentar und eine Neuigkeit in Alltagssprache und räumt den Branch auf. Bei Fehlern nach dem Merge hält er an und bereitet einen Revert vor.
argument-hint: <story-nummer>
disable-model-invocation: true
---

# Taiga-Story abschließen

> **Für alle Agenten** (Claude Code, Codex u. a.). Aufruf in Claude Code mit `/finish-taiga-ticket`, in Codex mit `$finish-taiga-ticket`, jeweils gefolgt vom Argument. „Taiga-MCP `work`“ meint das Werkzeug `work` des MCP-Servers `taiga` (Claude Code: `mcp__taiga__work`). GitHub-Schritte bevorzugt über das GitHub-MCP, sonst mit `gh`. `<tmp>` ist ein temporärer Arbeitsordner außerhalb des Repositorys (Claude Code: Scratchpad der Sitzung, sonst `${TMPDIR:-/tmp}/moach`). Rückfragen mit Auswahl stellst du über das Auswahl-Werkzeug des Agenten (Claude Code: `AskUserQuestion`). Gibt es keins, stell sie als nummerierte Optionen im Chat und warte auf die Antwort.

Argument: das Aufruf-Argument ist die Nummer der **User Story**. Fehlt sie, frag danach.

**Ein Haltepunkt:** vor dem PR und dem Merge. Nach dem Go läuft alles bis „Fertig“ durch, außer etwas schlägt fehl.

**Erst QA und Abnahme, dann PR.** Der PR wird ausschließlich in diesem Skill erstellt, und nur, wenn `/qa-taiga-ticket` für den aktuellen Head-Commit des Branches mit „bestanden“ durchgelaufen ist und der Product Owner danach „Abgenommen“ kommentiert hat. Fehlt eins davon, wird kein PR erstellt.

**Product Owner** in diesem Projekt: `fynndow`. Bei Stories mit Tag `hotfix` ist die Abnahme optional, das nennst du im Haltepunkt.

## Projektzuordnung

Projekt aus `git remote get-url origin` bestimmen. Ist das Repo nicht in der Tabelle, halte an und frag.

| Repo | Taiga-Projekt | Basis-Branch | Live-URL | Deploy-Workflow | App-Ordner |
|---|---|---|---|---|---|
| `Norddeutsche-Coder/m.oach` | `fynndow-moach` | `main` | `https://norddeutsche-coder.github.io/m.oach/` | `Deploy` (`.github/workflows/deploy.yml`) | `frontend/` |

GitHub: bevorzugt das GitHub-MCP (`pull_request_read`, `merge_pull_request`). Für Workflow-Läufe die GitHub-API per `curl` mit `Authorization: Bearer $GITHUB_PERSONAL_ACCESS_TOKEN`. Den Token nie ausgeben.

## Phase 1: Bedingungen prüfen

1. Story laden (Taiga-MCP `work`, `op: get`, `type: story`), dazu ihre Tasks und Kommentare (Taiga-MCP `comments`, `op: list`).
2. Branch finden: `git fetch origin`, Branch `…/tg-<nr>-…` auf `origin`. Gibt es keinen, halte an. Merke den Head-Commit (Kurz-SHA).
3. Prüfen, ob es schon einen PR für den Branch gibt (`list_pull_requests` bzw. `gh pr list --head <branch>`). Das sollte nicht so sein. Gibt es doch einen, weise im Haltepunkt darauf hin und verwende ihn weiter, statt einen zweiten zu erstellen.
4. Prüfe **alle** Bedingungen und halte das Ergebnis je Punkt fest:
   - [ ] **CI grün** für den Head-Commit des Branches (`GET /repos/<repo>/actions/runs?head_sha=<sha>` bzw. `gh run list --commit <sha>`). Läuft sie noch, warte darauf, höchstens 15 Minuten.
   - [ ] **QA bestanden:** Der neueste QA-Kommentar an der Story (`## QA ✅ bestanden · … · Branch <branch> @ <head>`) nennt den aktuellen Head-Commit des Branches (Kurz-SHA). Ein älteres „bestanden“ für einen früheren Commit zählt nicht.
   - [ ] **Basis eingearbeitet:** Die QA hat nur den Branch geprüft. Enthält `origin/<basis>` Commits, die nicht im Branch sind (`git log origin/<branch>..origin/<basis>`), liste sie auf und frag, ob vorher `<basis>` in den Branch gemergt und `/qa-taiga-ticket` erneut ausgeführt werden soll. Empfehlung: ja, wenn diese Commits dieselben Dateien berühren.
   - [ ] **Abgenommen:** Der neueste Kommentar des Product Owners nach dem letzten QA-Kommentar beginnt mit „Abgenommen“.
     - Beginnt er mit „Nicht abgenommen“: Lege pro genanntem Punkt einen Task `Abnahme: <Punkt>` (Status `Neu`) an, setze die Story auf `In Arbeit` und halte an. Nächster Schritt ist `/implement-taiga-ticket <nr>`.
     - Gibt es noch keine Antwort: Halte an und bitte den Product Owner um die Abnahme (Hinweis auf den Abschnitt „Zur Abnahme“ im QA-Kommentar).
   - [ ] **Story-Status `Abnahme`.**
   - [ ] **Keine offenen QA- oder Abnahme-Tasks** (`QA: …`, `Abnahme: …` mit Status ungleich `Erledigt`).
   - [ ] **Alle Acceptance Criteria abgehakt** in der Story-Beschreibung (`- [x]`). Ist eine noch `- [ ]`, aber laut QA-Kommentar erfüllt, darfst du sie im Zuge des Abschlusses abhaken. Das sagst du im Haltepunkt ausdrücklich.
   - [ ] **Keine sonstigen offenen Tasks.** Gibt es welche, liste sie auf und frag, ob sie geschlossen, in eine neue Story verschoben oder zuerst erledigt werden sollen.
   - [ ] **Ohne Konflikte mergebar:** `git merge-tree --write-tree origin/<basis> origin/<branch>` meldet keine Konflikte.
5. Merke dir die aktuell live ausgelieferte Version: Lade `<Live-URL>` und notiere den Dateinamen des Haupt-Bundles (`assets/index-<hash>.js`).

## Phase 2: Freigabe (Haltepunkt)

Zeig:
- Story (Nummer, Titel, Punkte), Branch mit Head-Commit, Anzahl Commits und `git diff --stat origin/<basis>...origin/<branch>`,
- die Bedingungen mit ✅/❌,
- den geplanten PR: Titel `<Story-Titel> (TG-<nr>)` und die Beschreibung (siehe Phase 3),
- die geplante Squash-Commit-Nachricht: Titel `<PR-Titel>` (enthält `TG-<nr>`), Text als kurze Zusammenfassung der Änderungen, **ohne** `Co-authored-by:`-Zeilen für KI-Agenten (GitHub schlägt sie beim Squash automatisch vor, entferne sie),
- was danach automatisch passiert (PR erstellen, Im Review, Checks abwarten, Merge, Deploy abwarten, Smoke-Test, Fertig, Neuigkeit, Aufräumen).

Ist eine Bedingung ❌, **erstelle keinen PR und merge nicht**. Nenn, was fehlt und wer bzw. welcher Skill das erledigt (`/implement-taiga-ticket`, `/qa-taiga-ticket`, Abnahme durch den Product Owner). Ist alles ✅, **halte an** und warte auf ein Go.

## Phase 3: PR und Merge (erst nach Go)

1. **PR erstellen** nach `<basis>`, bevorzugt mit dem GitHub-MCP (`create_pull_request`), sonst `gh pr create`. Gibt es eine PR-Vorlage im Repo, nutz sie. Titel: `<Story-Titel> (TG-<nr>)`. Die Beschreibung ist auf Deutsch:
   - **Kurz gesagt:** 2–3 Sätze ohne Fachbegriffe, was sich für Läufer ändert,
   - Worum es geht (1–2 Sätze) und ein Link zur Story `https://tree.taiga.io/project/<slug>/us/<nr>`,
   - Änderungen,
   - die Acceptance Criteria als abgehakte Checkliste,
   - QA: Link zum QA-Kommentar bzw. „QA bestanden für `<head-kurz-sha>`“,
   - Abnahme: „Abgenommen durch <Product Owner> am <Datum>“,
   - Risiken bzw. was beim Review zu beachten ist,
   - abschließend die Attribution-Zeile für PR-Beschreibungen, falls der Agent eine vorgibt.
2. Den PR-Link in das Story-Feld **„Pull Request“** eintragen. Das MCP kann keine eigenen Felder setzen, deshalb über die Taiga-API mit `TAIGA_USERNAME` und `TAIGA_PASSWORD` aus der Umgebung:
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
3. Story auf `Im Review` setzen.
4. **Checks des PR abwarten** (`pull_request_read`, Methode `get_status`, bzw. Check-Runs, z. B. der Secret-Scan), höchstens 15 Minuten. Ist einer rot, halte an, zeig Job und Ursache. Die Story bleibt `Im Review`.
5. Gegebenenfalls die laut QA erfüllten Acceptance Criteria in der Story abhaken (`op: update`, Beschreibung mit `- [x]`).
6. PR per **Squash** mergen (`merge_pull_request`, `merge_method: squash`, mit Commit-Titel und -Text aus Phase 2). Nie mit Admin-Rechten Schutzregeln umgehen. Lehnt GitHub den Merge ab, halte an und melde den Grund.
7. Merge-Commit-SHA notieren.

## Phase 4: Deployment und Smoke-Test

1. **Deploy-Lauf abwarten:** Lauf des Deploy-Workflows für den Merge-Commit finden (`GET /repos/<repo>/actions/runs?head_sha=<sha>`) und warten, bis er abgeschlossen ist, höchstens 20 Minuten, Abfrage etwa jede Minute. Ergebnis und Link notieren.
2. **Neue Version live:** `<Live-URL>` laden, bis der Bundle-Name sich gegenüber Phase 1 geändert hat (höchstens 5 Minuten, GitHub Pages cached kurz).
3. **Smoke-Test mit Screenshot:** die betroffene Ansicht der Story auf der Live-URL mit Testdaten aufnehmen, Handy hell, plus Dunkelmodus, falls die Story die Oberfläche betrifft. Verwende das Skript des QA-Skills, das alle externen Anfragen blockiert (keine echten Konten, keine Anfragen an Supabase oder Intervals.icu):
   `node <repo>/.agents/skills/qa-taiga-ticket/scripts/shots.cjs <app-ordner>/node_modules/@playwright/test <Live-URL> <tmp>/release-tg-<nr> <szenarien.json>` (`<repo>` ist das Wurzelverzeichnis des Repositorys)
   Szenarien wie im QA-Skill beschrieben (localStorage-Testdaten, festes Datum, Reiter). Bei M.oach ist für die Live-Version kein `moach_sb` nötig.
   **Jeden Screenshot ansehen.** Prüfe: Die App startet ohne Fehlermeldung, die Änderung der Story ist sichtbar, die Konsole zeigt keine Fehler (das Skript meldet sie).
4. Schlägt einer dieser Schritte fehl, weiter mit **Phase 6**.

## Phase 5: Abschließen (nur wenn Phase 4 erfolgreich)

1. Alle restlichen Tasks der Story auf `Erledigt` setzen.
2. Story auf `Fertig` setzen.
3. Screenshot(s) des Smoke-Tests an die Story hängen (Taiga-MCP `attachments`, `op: upload`, `type: story`, Beschreibung „Live · Handy · hell“ o. Ä.).
4. Release-Kommentar an die Story (Taiga-MCP `comments`, `op: add`):
   ```
   ## Released ✅ · <Datum>

   **Kurz gesagt:** <1–2 Sätze ohne Fachbegriffe: was Läufer ab jetzt in der App bemerken>

   - **PR:** #<nr> <Link> (Squash)
   - **Merge-Commit:** <kurz-sha> <Link>
   - **Deployment:** <Link zum Deploy-Lauf> · <Dauer>
   - **Live:** <Live-URL> · Version <bundle-name>
   - **Smoke-Test:** <geprüfte Ansicht(en)> · ✅ ohne Konsolenfehler · Screenshot angehängt
   ```
5. **Neuigkeit eintragen:** Bemerken Läufer die Änderung, oben in der Wiki-Seite `neuigkeiten` eine Zeile ergänzen (Taiga-MCP `wiki`, `op: get`, dann `op: update`): `- <Datum>: <was Läufer davon haben, ohne Fachbegriffe> (#<nr>)`. Reine Technik-Änderungen überspringen.
6. **Aufräumen:**
   - Remote-Branch löschen, falls GitHub ihn nicht automatisch gelöscht hat (`git push origin --delete <branch>`),
   - lokal auf den Basis-Branch wechseln, `git pull --ff-only`, lokalen Branch löschen (`git branch -d`, nicht `-D`). Weigert sich Git, halte an und frag,
   - temporäre Ordner unter `<tmp>` bleiben bestehen.

## Phase 6: Fehler nach dem Merge

Story **nicht** auf Fertig setzen. Sie bleibt `Im Review`.

1. Einen Task in der Story anlegen: Titel `Release: <kurze Beschreibung>`, Status `Neu`, Beschreibung mit **Geprüft, Erwartet, Tatsächlich, Ursache, Vorschlag** (wie im QA-Skill), mit Link zum Deploy-Lauf bzw. Screenshot.
2. **Revert vorbereiten, nicht ausführen:**
   - Branch `revert/tg-<nr>-<kurztitel>` vom aktuellen Basis-Branch, `git revert <merge-sha>` (Squash-Commit, daher ohne `-m`), pushen,
   - PR „Revert: <PR-Titel>“ öffnen, mit Begründung und Link zum Release-Task,
   - **nicht mergen.**
3. Im Chat melden: was fehlgeschlagen ist (die fünf Angaben), der Link zum Revert-PR, und die Frage, ob reverted oder vorwärts korrigiert werden soll (`/implement-taiga-ticket <nr>` arbeitet den Release-Task ab).
4. Auf Go zum Revert: Revert-PR mergen (Squash), Deployment abwarten, Smoke-Test wiederholen und das Ergebnis als Kommentar an die Story. Die Story auf `In Arbeit` setzen.

## Abschlussbericht

- **Kurz gesagt** (1–2 Sätze ohne Fachbegriffe),
- Ergebnis: ✅ released oder ❌ mit Grund,
- PR, Merge-Commit, Deploy-Lauf, Live-Version,
- Smoke-Test mit 1–2 Screenshots direkt im Chat (Bild öffnen, in Claude Code mit dem Read-Tool),
- Taiga-Status von Story und Tasks,
- aufgeräumte Branches.

## Grenzen

- Nie einen PR erstellen ohne bestandene QA für den aktuellen Head-Commit des Branches und ohne Abnahme (außer `hotfix`).
- Nie selbst abnehmen. Die Abnahme ist ein Kommentar des Product Owners.
- Nie einen PR erstellen oder mergen ohne Go und nie bei einer nicht erfüllten Bedingung. Schutzregeln nie umgehen.
- Nie force-pushen, nie direkt auf den Basis-Branch pushen (der Revert läuft immer über einen PR).
- Kein automatischer Revert ohne Go.
- Keine echten Zugangsdaten im Smoke-Test, keine Anfragen an Live-Backends.
- Keinen Code ändern, außer dem Revert in Phase 6.
