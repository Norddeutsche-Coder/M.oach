---
name: finish-taiga-ticket
description: Schließt eine Taiga-User-Story nach Review ab. Aufruf mit der Story-Nummer, z. B. `/finish-taiga-ticket 27`. Prüft CI, QA und Acceptance Criteria, wartet auf Go, merged den PR per Squash, wartet auf das Deployment, macht einen Smoke-Test der Live-App, setzt Story und Tasks auf Done/Closed, schreibt einen Release-Kommentar und räumt den Branch auf. Bei Fehlern nach dem Merge hält er an und bereitet einen Revert vor.
argument-hint: <story-nummer>
disable-model-invocation: true
---

# Taiga-Story abschließen

Argument: `$ARGUMENTS` ist die Nummer der **User Story**. Fehlt sie, frag danach.

**Ein Haltepunkt:** vor dem Merge. Nach dem Go läuft alles bis „Done“ durch, außer etwas schlägt fehl.

## Projektzuordnung

Projekt aus `git remote get-url origin` bestimmen. Ist das Repo nicht in der Tabelle, halte an und frag.

| Repo | Taiga-Projekt | Basis-Branch | Live-URL | Deploy-Workflow | App-Ordner |
|---|---|---|---|---|---|
| `Norddeutsche-Coder/m.oach` | `fynndow-moach` | `main` | `https://norddeutsche-coder.github.io/m.oach/` | `Deploy` (`.github/workflows/deploy.yml`) | `frontend/` |

GitHub: bevorzugt das GitHub-MCP (`pull_request_read`, `merge_pull_request`). Für Workflow-Läufe die GitHub-API per `curl` mit `Authorization: Bearer $GITHUB_PERSONAL_ACCESS_TOKEN`. Den Token nie ausgeben.

## Phase 1: Bedingungen prüfen

1. Story laden (`mcp__taiga__work`, `op: get`, `type: story`), dazu ihre Tasks und Kommentare (`mcp__taiga__comments`, `op: list`).
2. PR finden: aus dem Story-Feld „Pull Request“, sonst über den Branch `…/tg-<nr>-…` (`list_pull_requests` bzw. `search_pull_requests`). Gibt es keinen offenen PR, halte an.
3. Prüfe **alle** Bedingungen und halte das Ergebnis je Punkt fest:
   - [ ] **CI grün** für den aktuellen Head-Commit des PRs (`pull_request_read`, Methode `get_status`, bzw. Check-Runs). Läuft sie noch, warte darauf, höchstens 15 Minuten.
   - [ ] **QA bestanden:** Der neueste QA-Kommentar an der Story (`## QA ✅ bestanden · … · PR #<pr> @ <head> · Merge-Stand <merge>`) nennt den aktuellen Head-Commit des PRs (Kurz-SHA). Ein älteres „bestanden“ für einen früheren Commit zählt nicht.
   - [ ] **Basis unverändert seit der QA:** Ist `<basis>` seit dem geprüften Merge-Stand weitergegangen (anderer Merge eines anderen PRs), weise darauf hin und frag, ob vor dem Merge erneut `/qa-taiga-ticket` laufen soll. Empfehlung: ja, wenn die neuen Commits auf `<basis>` dieselben Dateien berühren.
   - [ ] **Story-Status `In Review`.**
   - [ ] **Keine offenen QA-Tasks** (`QA: …` mit Status ungleich `Closed`).
   - [ ] **Alle Acceptance Criteria abgehakt** in der Story-Beschreibung (`- [x]`). Ist eine noch `- [ ]`, aber laut QA-Kommentar erfüllt, darfst du sie im Zuge des Abschlusses abhaken. Das sagst du im Haltepunkt ausdrücklich.
   - [ ] **Keine sonstigen offenen Tasks.** Gibt es welche, liste sie auf und frag, ob sie geschlossen, in eine neue Story verschoben oder zuerst erledigt werden sollen.
   - [ ] **PR mergebar:** keine Konflikte, Branch aktuell gegenüber dem Basis-Branch.
4. Merke dir die aktuell live ausgelieferte Version: Lade `<Live-URL>` und notiere den Dateinamen des Haupt-Bundles (`assets/index-<hash>.js`).

## Phase 2: Freigabe (Haltepunkt)

Zeig:
- Story (Nummer, Titel, Punkte), PR (Nummer, Titel, Link, Anzahl Commits, `+/-` Zeilen),
- die Bedingungen mit ✅/❌,
- die geplante Squash-Commit-Nachricht: Titel `<PR-Titel>` (enthält `TG-<nr>`), Text als kurze Zusammenfassung der Änderungen, **ohne** `Co-authored-by:`-Zeilen für KI-Agenten (GitHub schlägt sie beim Squash automatisch vor, entferne sie),
- was danach automatisch passiert (Merge, Deploy abwarten, Smoke-Test, Done, Aufräumen).

Ist eine Bedingung ❌, **merge nicht**. Nenn, was fehlt und welcher Skill das erledigt (`/implement-taiga-ticket`, `/qa-taiga-ticket`). Ist alles ✅, **halte an** und warte auf ein Go.

## Phase 3: Merge (erst nach Go)

1. Gegebenenfalls die laut QA erfüllten Acceptance Criteria in der Story abhaken (`op: update`, Beschreibung mit `- [x]`).
2. PR per **Squash** mergen (`merge_pull_request`, `merge_method: squash`, mit Commit-Titel und -Text aus Phase 2). Nie mit Admin-Rechten Schutzregeln umgehen. Lehnt GitHub den Merge ab, halte an und melde den Grund.
3. Merge-Commit-SHA notieren.

## Phase 4: Deployment und Smoke-Test

1. **Deploy-Lauf abwarten:** Lauf des Deploy-Workflows für den Merge-Commit finden (`GET /repos/<repo>/actions/runs?head_sha=<sha>`) und warten, bis er abgeschlossen ist, höchstens 20 Minuten, Abfrage etwa jede Minute. Ergebnis und Link notieren.
2. **Neue Version live:** `<Live-URL>` laden, bis der Bundle-Name sich gegenüber Phase 1 geändert hat (höchstens 5 Minuten, GitHub Pages cached kurz).
3. **Smoke-Test mit Screenshot:** die betroffene Ansicht der Story auf der Live-URL mit Testdaten aufnehmen, Handy hell, plus Dunkelmodus, falls die Story die Oberfläche betrifft. Verwende das Skript des QA-Skills, das alle externen Anfragen blockiert (keine echten Konten, keine Anfragen an Supabase oder Intervals.icu):
   `node <repo>/.claude/skills/qa-taiga-ticket/scripts/shots.cjs <app-ordner>/node_modules/@playwright/test <Live-URL> <scratchpad>/release-tg-<nr> <szenarien.json>` (`<repo>` ist das Wurzelverzeichnis des Repositorys)
   Szenarien wie im QA-Skill beschrieben (localStorage-Testdaten, festes Datum, Reiter). Bei M.oach ist für die Live-Version kein `moach_sb` nötig.
   **Jeden Screenshot ansehen.** Prüfe: Die App startet ohne Fehlermeldung, die Änderung der Story ist sichtbar, die Konsole zeigt keine Fehler (das Skript meldet sie).
4. Schlägt einer dieser Schritte fehl, weiter mit **Phase 6**.

## Phase 5: Abschließen (nur wenn Phase 4 erfolgreich)

1. Alle restlichen Tasks der Story auf `Closed` setzen.
2. Story auf `Done` setzen.
3. Screenshot(s) des Smoke-Tests an die Story hängen (`mcp__taiga__attachments`, `op: upload`, `type: story`, Beschreibung „Live · Handy · hell“ o. Ä.).
4. Release-Kommentar an die Story (`mcp__taiga__comments`, `op: add`):
   ```
   ## Released ✅ · <Datum>
   - **PR:** #<nr> <Link> (Squash)
   - **Merge-Commit:** <kurz-sha> <Link>
   - **Deployment:** <Link zum Deploy-Lauf> · <Dauer>
   - **Live:** <Live-URL> · Version <bundle-name>
   - **Smoke-Test:** <geprüfte Ansicht(en)> · ✅ ohne Konsolenfehler · Screenshot angehängt
   ```
5. **Aufräumen:**
   - Remote-Branch löschen, falls GitHub ihn nicht automatisch gelöscht hat (`git push origin --delete <branch>`),
   - lokal auf den Basis-Branch wechseln, `git pull --ff-only`, lokalen Branch löschen (`git branch -d`, nicht `-D`). Weigert sich Git, halte an und frag,
   - temporäre Ordner im Scratchpad bleiben bestehen.

## Phase 6: Fehler nach dem Merge

Story **nicht** auf Done setzen. Sie bleibt `In Review`.

1. Einen Task in der Story anlegen: Titel `Release: <kurze Beschreibung>`, Status `New`, Beschreibung mit **Geprüft, Erwartet, Tatsächlich, Ursache, Vorschlag** (wie im QA-Skill), mit Link zum Deploy-Lauf bzw. Screenshot.
2. **Revert vorbereiten, nicht ausführen:**
   - Branch `revert/tg-<nr>-<kurztitel>` vom aktuellen Basis-Branch, `git revert <merge-sha>` (Squash-Commit, daher ohne `-m`), pushen,
   - PR „Revert: <PR-Titel>“ öffnen, mit Begründung und Link zum Release-Task,
   - **nicht mergen.**
3. Im Chat melden: was fehlgeschlagen ist (die fünf Angaben), der Link zum Revert-PR, und die Frage, ob reverted oder vorwärts korrigiert werden soll (`/implement-taiga-ticket <nr>` arbeitet den Release-Task ab).
4. Auf Go zum Revert: Revert-PR mergen (Squash), Deployment abwarten, Smoke-Test wiederholen und das Ergebnis als Kommentar an die Story. Die Story auf `In progress` setzen.

## Abschlussbericht

- Ergebnis: ✅ released oder ❌ mit Grund,
- PR, Merge-Commit, Deploy-Lauf, Live-Version,
- Smoke-Test mit 1–2 Screenshots direkt im Chat (Read-Tool),
- Taiga-Status von Story und Tasks,
- aufgeräumte Branches.

## Grenzen

- Nie mergen ohne Go und nie bei einer nicht erfüllten Bedingung. Schutzregeln nie umgehen.
- Nie force-pushen, nie direkt auf den Basis-Branch pushen (der Revert läuft immer über einen PR).
- Kein automatischer Revert ohne Go.
- Keine echten Zugangsdaten im Smoke-Test, keine Anfragen an Live-Backends.
- Keinen Code ändern, außer dem Revert in Phase 6.
