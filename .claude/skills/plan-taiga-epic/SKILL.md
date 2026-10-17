---
name: plan-taiga-epic
description: Plant ein neues Taiga-Epic mit User Stories aus einer Freitext-Idee, z. B. `/plan-taiga-epic Onboarding für neue Läufer`. Untersucht den Code, klärt offene Punkte mit gezielten Rückfragen, prüft auf Dubletten, schneidet Stories (max. 3 Punkte) mit Acceptance Criteria und Schätzung pro Rolle und legt alles nach Freigabe im Backlog an. Kann auch neue Stories zu einem bestehenden Epic hinzufügen.
argument-hint: <idee oder epic-thema>
disable-model-invocation: true
---

# Taiga-Epic planen

> **Für alle Agenten** (Claude Code, Codex u. a.). Aufruf in Claude Code mit `/plan-taiga-epic`, in Codex mit `$plan-taiga-epic`, jeweils gefolgt vom Argument. „Taiga-MCP `work`“ meint das Werkzeug `work` des MCP-Servers `taiga` (Claude Code: `mcp__taiga__work`). GitHub-Schritte bevorzugt über das GitHub-MCP, sonst mit `gh`. `<tmp>` ist ein temporärer Arbeitsordner außerhalb des Repositorys (Claude Code: Scratchpad der Sitzung, sonst `${TMPDIR:-/tmp}/moach`). Rückfragen mit Auswahl stellst du über das Auswahl-Werkzeug des Agenten (Claude Code: `AskUserQuestion`). Gibt es keins, stell sie als nummerierte Optionen im Chat und warte auf die Antwort.

Eingabe: das Aufruf-Argument ist eine Idee in Freitext. Fehlt sie, frag danach.

Du legst **nur Epics und User Stories** an, keine Tasks und keine Issues. Tasks entstehen später durch `/implement-taiga-ticket`. Alles landet im **Backlog**, ohne Sprint. Angelegt wird **erst nach ausdrücklichem Go des Product Owners** (in diesem Projekt `fynndow`) zum Entwurf. Ideen und Fehler, die als Taiga-Issue gemeldet wurden, verarbeitet `/triage-taiga-issues`.

**Fachliche Fragen** (Verhalten für Läufer, Texte, Umfang im Detail) beantwortet `lukcy22`. Was die aufrufende Person nicht entscheiden kann oder will, stellst du nach dem Anlegen als Kommentar `## Fachliche Fragen an @lukcy22` an die betroffene Story (nummeriert, je Frage 2–4 Antwortmöglichkeiten, Empfehlung zuerst). Die Story bleibt dann `Neu`, bis die Fragen beantwortet sind (Definition of Ready). **Technische Fragen** (Architektur, Daten, Supabase, Abhängigkeiten) entscheidet `fynndow`.

## Projektzuordnung

Projekt aus `git remote get-url origin` bestimmen. Ist das Repo nicht in der Tabelle, halte an und frag. Rate nie.

| Repo | Taiga-Projekt |
|---|---|
| `Norddeutsche-Coder/m.oach` | `fynndow-moach` |

## Phase 1: Verstehen

1. **Bestand in Taiga laden:** alle Epics (Taiga-MCP `work`, `op: list`, `type: epic`) und alle Stories (`type: story`), dazu die Wiki-Seiten `home` und `definition-of-done` (Taiga-MCP `wiki`).
2. **Code untersuchen:** Finde die Stellen, die die Idee betrifft (Ansichten, Logik, Daten, Supabase, Tests). Was sich aus dem Code beantworten lässt, fragst du nicht.
3. **Dubletten prüfen:** Suche nach Epics und Stories mit gleichem oder überlappendem Inhalt (`op: list` mit `q`, Titel und Beschreibungen vergleichen).

## Phase 2: Rückfragen (grill-me)

Kläre alles, was für gute Stories fehlt: Ziel und Nutzen für Läufer, Umfang (was ist bewusst **nicht** drin), Verhalten in Sonderfällen, Abhängigkeiten, Datenschutz und Sicherheit, Messbarkeit der Acceptance Criteria.

- Stelle die Fragen über das Auswahl-Werkzeug des Agenten (siehe Hinweis oben), **immer als Einzelauswahl** (in Claude Code `multiSelect: false`), höchstens 4 pro Runde. Mehrfachauswahl nicht verwenden.
- Jede Frage hat 2–4 Optionen. Die empfohlene steht zuerst und trägt „(Recommended)“, mit kurzer Begründung.
- Frag, bis keine wesentliche Unklarheit mehr bleibt, in der Regel 1–3 Runden. Wiederhole nichts, was schon beantwortet ist.
- Gibt der Nutzer statt einer Option eigenen Text ein, lies ihn genau und richte dich danach.

## Phase 3: Entwurf (Haltepunkt)

Zeig den kompletten Entwurf im Chat:

**Epic** (oder: „Stories für bestehendes Epic #<nr>“)
- Titel (kurz, deutsch), Beschreibung mit Ziel in einem Satz, Hintergrund und den Grundsätzen bzw. dem, was ausdrücklich nicht dazugehört.
- Farbe als Hex-Wert. Sie muss sich von den bestehenden Epics unterscheiden.

**Dubletten und Überschneidungen:** Für jede gefundene Überschneidung ein Vorschlag mit Begründung: in das bestehende Epic hängen, bestehende Story ergänzen oder trotzdem neu anlegen. Gibt es keine, schreib das ausdrücklich.

**Stories**, als Tabelle zur Übersicht (Nr. im Entwurf, Titel, Punkte gesamt und pro Rolle, Tags, Abhängigkeiten), dann jede Story ausführlich im Format:

```
**Problem / Ziel:** Was fehlt oder stört heute, aus Sicht der Läufer, in Alltagssprache und ohne Fachbegriffe verständlich. Bei Bugs mit Fundstelle (`datei:zeile`) in einem eigenen Satz danach.

**Umsetzung:** Grober Lösungsweg in 2–5 Punkten. Keine Detailplanung, die macht /implement-taiga-ticket.

**Abhängig von:** andere Stories (falls vorhanden)

**Entwurf:** nötig, vor der Umsetzung vom Product Owner freigeben (nur bei Stories, die die Oberfläche ändern)

## Acceptance Criteria
- [ ] Prüfbare Aussage mit konkretem Wert, Zustand oder Ergebnis (z. B. „auf 390 × 844 px ohne Scrollen sichtbar“, „Wert 8 ergibt Stufe 2“).
- [ ] Welche Tests das Verhalten absichern (Unit und/oder E2E).
```

Regeln für Stories:
- **Höchstens 3 Punkte (= 3 Arbeitstage) pro Story.** Größeres teilst du fachlich sinnvoll auf, sodass jede Story für sich einen nutzbaren Stand liefert.
- **Schätzung pro Rolle:** UX, Design, Front, Back. 1 Punkt = 1 Arbeitstag. Erlaubte Werte pro Rolle: 0, ½, 1, 2, 3. Rollen ohne Anteil bekommen 0.
- **Acceptance Criteria** sind einzeln prüfbar, enthalten keine vagen Wörter wie „schnell“ oder „schön“ ohne Maßstab und decken Sonderfälle ab. `/qa-taiga-ticket` prüft sie wörtlich.
- **Tags:** bevorzugt bestehende Tags des Projekts wiederverwenden. Neue nur, wenn nötig, dann mit Farbvorschlag.
- **Oberflächen-Stories** tragen die Zeile „Entwurf: nötig“. Die Rolle Design bekommt dann mindestens ½ Punkt.
- Titel kurz und als Ergebnis formuliert („Readiness nur einmal anzeigen“, nicht „Readiness-Anzeige überarbeiten“).

**Summe:** Punkte gesamt und pro Rolle, grob in Sprints à 14 Arbeitstagen.

**Halte an** und warte auf ein Go des Product Owners. Änderungswünsche arbeitest du ein und zeigst den Entwurf erneut, bis das Go kommt.

## Phase 4: Anlegen (erst nach Go)

1. **Epic** anlegen (Taiga-MCP `work`, `op: create`, `type: epic`, `subject`, `description`). Beim Erweitern eines bestehenden Epics entfällt das.
2. **Stories** als Batch anlegen (`op: create`, `type: story`, `items`, höchstens 20 pro Aufruf), jeweils mit `subject`, `description`, `status: "Neu"`, `tags`. Kein Sprint. Auf `Bereit` setzt der Product Owner eine Story erst, wenn die Definition of Ready (Wiki `definition-of-ready`) erfüllt ist.
3. **Mit dem Epic verknüpfen:** jede Story mit `op: link`, `type: story`, `item: #<story>`, `parent: #<epic>`.
4. **Freigegebene Ergänzungen bestehender Stories** mit `op: update` vornehmen. Dabei die vorhandene Beschreibung erweitern, nicht ersetzen.
5. **Punkte, Farben und neue Tag-Farben** über die Taiga-API setzen. Das MCP kann keine Punkte pro Rolle und keine Farben. Zugangsdaten aus `TAIGA_USERNAME` und `TAIGA_PASSWORD`, nie ausgeben:
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
   proj = call("GET", f"/projects/by_slug?slug={SLUG}", t=t)
   roles = {r["name"]: str(r["id"]) for r in proj["roles"] if r["computable"]}   # z. B. UX, Design, Front, Back
   points = {x["value"]: x["id"] for x in proj["points"] if x["value"] is not None}  # 0, 0.5, 1, 2, 3, …
   # Punkte pro Story: ESTIMATES = {ref: {"Front": 2, "Back": 1}, …}
   for ref, est in ESTIMATES.items():
       us = call("GET", f"/userstories/by_ref?project={proj['id']}&ref={ref}", t=t)
       call("PATCH", f"/userstories/{us['id']}", {"points": {rid: points[est.get(name, 0)] for name, rid in roles.items()}, "version": us["version"]}, t=t)
   # Epic-Farbe
   ep = call("GET", f"/epics/by_ref?project={proj['id']}&ref={EPIC_REF}", t=t)
   call("PATCH", f"/epics/{ep['id']}", {"color": EPIC_COLOR, "version": ep["version"]}, t=t)
   # Neue Tag-Farben: nur from_tag + color senden (to_tag würde einen Fehler auslösen)
   for tag, color in NEW_TAG_COLORS.items():
       call("POST", f"/projects/{proj['id']}/edit_tag", {"from_tag": tag, "color": color}, t=t)
   ```
   Prüfe danach mit einem `GET`, ob jede Story die erwartete Punktsumme hat.

## Abschlussbericht

- Epic mit Nummer und Link (`https://tree.taiga.io/project/<slug>/epic/<nr>`),
- Tabelle der angelegten Stories (Nummer, Titel, Punkte),
- Summe der Punkte und grobe Sprint-Anzahl,
- ergänzte bestehende Stories,
- Hinweis, dass alles im Backlog mit Status `Neu` liegt, der Product Owner Stories nach der Definition of Ready auf `Bereit` setzt und sie dann mit `/implement-taiga-ticket <nr>` umgesetzt werden können.

## Grenzen

- Nichts löschen. Bestehende Stories nur nach Freigabe ergänzen, nie inhaltlich überschreiben.
- Keine Sprints anlegen oder zuordnen, keine Tasks, keine Issues.
- Keinen Code ändern.
- Keine Zugangsdaten oder Secrets in Beschreibungen.
