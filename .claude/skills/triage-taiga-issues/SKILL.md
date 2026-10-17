---
name: triage-taiga-issues
description: Verarbeitet neue Ideen und Fehlermeldungen aus Taiga-Issues, die auch Nicht-Techniker anlegen können. Aufruf `/triage-taiga-issues` oder mit einer Issue-Nummer, z. B. `/triage-taiga-issues 12`. Klärt offene Punkte mit lukcy22 (fachlich), fynndow (Architektur) und der meldenden Person, macht nach Go der aufrufenden Person daraus Stories im Backlog (Fehler mit Tag bug, dringende mit hotfix) oder ergänzt bestehende, trägt die meldende Person als Beobachter ein und schließt das Issue mit einem Verweis.
argument-hint: [issue-nummer]
disable-model-invocation: true
---

# Ideen und Fehler aus Taiga-Issues übernehmen

> **Für alle Agenten** (Claude Code, Codex u. a.). Aufruf in Claude Code mit `/triage-taiga-issues`, in Codex mit `$triage-taiga-issues`, optional gefolgt von einer Issue-Nummer. „Taiga-MCP `work`“ meint das Werkzeug `work` des MCP-Servers `taiga` (Claude Code: `mcp__taiga__work`). Rückfragen mit Auswahl stellst du über das Auswahl-Werkzeug des Agenten (Claude Code: `AskUserQuestion`). Gibt es keins, stell sie als nummerierte Optionen im Chat und warte auf die Antwort.

Meldungen kommen von allen Beteiligten, auch ohne Technikkenntnis, nach der Vorlage auf der Wiki-Seite `ideen-und-fehler-melden`. Dieser Skill macht daraus Stories, die `/implement-taiga-ticket` umsetzen kann. **Angelegt oder geändert wird erst nach Go der Person, die den Skill aufruft.** Einen entscheidenden Product Owner gibt es nicht.

## Projektzuordnung

Projekt aus `git remote get-url origin` bestimmen. Ist das Repo nicht in der Tabelle, halte an und frag.

| Repo | Taiga-Projekt | Fachliche Fragen | Technische Fragen (nur Architektur) |
|---|---|---|---|
| `Norddeutsche-Coder/m.oach` | `fynndow-moach` | `lukcy22` | `fynndow` |

Issue-Arten: Fehler, Idee, Frage. Issue-Status: Neu, In Klärung, Rückfrage (wartet auf die meldende Person), Übernommen (Story angelegt oder ergänzt), Erledigt (ohne Story beantwortet), Abgelehnt, Zurückgestellt.

## Phase 1: Meldungen laden

1. Mit Issue-Nummer: nur dieses Issue (Taiga-MCP `work`, `op: get`, `type: issue`). Sonst alle offenen Issues mit Status `Neu` oder `Rückfrage` mit neuer Antwort (`op: list`, `type: issue`), älteste zuerst. Kommentare je Issue laden (Taiga-MCP `comments`, `op: list`).
2. Bestand laden: Epics und Stories (`op: list`, `type: epic` bzw. `story`) und die Wiki-Seiten `home` und `definition-of-ready`.
3. Je Issue:
   - **Fehler:** Lässt er sich im Code nachvollziehen? Fundstelle (`datei:zeile`) suchen, betroffene Ansicht bestimmen. Ist es ein Datenverlust, ein Sicherheitsproblem oder macht er die Live-App für viele unbenutzbar, schlag den Tag `hotfix` vor (Wiki `hotfix`).
   - **Idee:** Gibt es schon ein passendes Epic oder eine Story? Passt sie zu den Grundsätzen des Epics?
   - **Frage:** Lässt sie sich direkt beantworten (Code, Wiki)?
   - **Dubletten:** Story oder Issue mit gleichem Inhalt (`op: list` mit `q`).

## Phase 2: Vorschlag (Haltepunkt)

Zeig je Issue in einer kurzen Tabelle: Nummer, Art, Titel, meldende Person und einen Vorschlag:
- **Neue Story** mit Titel (als Ergebnis formuliert), Epic, Tags (`bug` bei Fehlern, ggf. `hotfix`), grober Schätzung pro Rolle (UX, Design, Front, Back; 0, ½, 1, 2, 3; höchstens 3 Punkte gesamt) und den Acceptance Criteria. Bei Fehlern gehören „Erwartet“ und „Tatsächlich“ der Meldung in die Beschreibung.
- **Bestehende Story ergänzen** (Nummer und was ergänzt wird),
- **Direkt beantworten** (Antworttext in Alltagssprache) → Status `Erledigt`,
- **Rückfrage** an die meldende Person (Frage in Alltagssprache) → Status `Rückfrage`,
- **Ablehnen** oder **Zurückstellen**, mit Begründung in Alltagssprache.

Ist ein Issue fachlich unklar (was soll für Läufer passieren, welche Texte, welcher Umfang), stell die Fragen an `lukcy22`: als Kommentar `## Fachliche Fragen an @lukcy22` am Issue, nummeriert, je Frage 2–4 Antwortmöglichkeiten, Empfehlung zuerst. Setz das Issue auf `In Klärung` und verarbeite es erst nach seiner Antwort. Fragen zu Priorität und zur technischen Umsetzung klärst du mit `fynndow` über das Auswahl-Werkzeug (Einzelauswahl, höchstens 4 pro Runde, empfohlene Option zuerst mit „(Recommended)“). **Halte an** und warte auf ein Go der aufrufenden Person. Änderungswünsche arbeitest du ein und zeigst den Vorschlag erneut.

## Phase 3: Umsetzen (erst nach Go)

1. **Neue Stories** anlegen (`op: create`, `type: story`, `status: "Neu"` bzw. `"Bereit"`, wenn die Definition of Ready schon erfüllt ist, `tags`), Format wie in `/plan-taiga-epic` (Problem / Ziel in Alltagssprache, Umsetzung, Abhängig von, Entwurf bei Oberflächen-Stories, Acceptance Criteria). Unten in die Beschreibung: `Gemeldet in Issue #<nr> von <Person>.` Mit dem Epic verknüpfen (`op: link`). Punkte pro Rolle über die Taiga-API wie in `/plan-taiga-epic` setzen.
2. **Bestehende Stories ergänzen:** Beschreibung erweitern, nicht ersetzen (`op: update`), mit Verweis auf das Issue.
3. **Meldende Person als Beobachter** jeder neuen oder ergänzten Story eintragen, damit Taiga sie über Statusänderungen informiert. Das MCP kann keine Beobachter setzen, deshalb über die Taiga-API (Zugangsdaten aus `TAIGA_USERNAME` und `TAIGA_PASSWORD`, nie ausgeben):
   ```python
   # python3 -I -
   import json, os, urllib.request
   API = os.environ.get("TAIGA_API_URL", "https://api.taiga.io/api/v1")
   def call(m, p, b=None, t=None):
       r = urllib.request.Request(API + p, method=m, data=json.dumps(b).encode() if b is not None else None,
           headers={"Content-Type": "application/json", **({"Authorization": "Bearer " + t} if t else {})})
       with urllib.request.urlopen(r) as x:
           s = x.read(); return json.loads(s) if s else {}
   t = call("POST", "/auth", {"type": "normal", "username": os.environ["TAIGA_USERNAME"], "password": os.environ["TAIGA_PASSWORD"]})["auth_token"]
   pid = call("GET", f"/projects/by_slug?slug={SLUG}", t=t)["id"]
   issue = call("GET", f"/issues/by_ref?project={pid}&ref={ISSUE_REF}", t=t)
   us = call("GET", f"/userstories/by_ref?project={pid}&ref={STORY_REF}", t=t)
   watchers = sorted(set(us["watchers"]) | {issue["owner"]})
   call("PATCH", f"/userstories/{us['id']}", {"watchers": watchers, "version": us["version"]}, t=t)
   ```
4. **Issue beantworten:** Kommentar in Alltagssprache an das Issue (Taiga-MCP `comments`, `op: add`): was daraus wird, Link zur Story (`https://tree.taiga.io/project/<slug>/us/<nr>`) und dass die Person automatisch Bescheid bekommt, wenn sich etwas tut. Danach den Status setzen: `Übernommen`, `Erledigt`, `Rückfrage`, `Abgelehnt` oder `Zurückgestellt` (`op: update`, `type: issue`).

## Abschlussbericht

- Tabelle: Issue → Ergebnis (neue Story #…, ergänzte Story #…, beantwortet, Rückfrage, abgelehnt, zurückgestellt),
- neue Stories mit Punkten, Epic und Tags; Hinweis, welche wegen erfüllter Definition of Ready auf `Bereit` stehen und welche mit welchem fehlenden Punkt auf `Neu` bleiben,
- Stories mit Tag `hotfix` gesondert mit dem Hinweis, sie sofort in den laufenden Sprint zu nehmen (Wiki `hotfix`).

## Grenzen

- Nichts löschen. Bestehende Stories nur ergänzen, nie inhaltlich überschreiben.
- Keine Sprints anlegen oder zuordnen, keine Tasks, keinen Code ändern.
- Keine Zugangsdaten oder Secrets in Beschreibungen und Kommentaren. Enthält eine Meldung ein Secret oder persönliche Gesundheitsdaten, nicht wiederholen, die aufrufende Person darauf hinweisen und die Regeln aus AGENTS.md (Abschnitt Secrets) befolgen.
