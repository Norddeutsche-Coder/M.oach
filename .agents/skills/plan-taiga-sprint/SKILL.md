---
name: plan-taiga-sprint
description: Schließt den laufenden Taiga-Sprint ab (Bilanz, unfertige Stories, Retro und Sprint-Bericht in Alltagssprache im Wiki) und plant den nächsten nach Kapazität, Velocity und festen Prioritätsregeln. Aufruf `/plan-taiga-sprint`. Fragt per Auswahl nach Abweichungen, Änderungen und Freigabe und legt erst nach Go an.
argument-hint: (keine)
disable-model-invocation: true
---

# Taiga-Sprint abschließen und planen

> **Für alle Agenten** (Claude Code, Codex u. a.). Aufruf in Claude Code mit `/plan-taiga-sprint`, in Codex mit `$plan-taiga-sprint`, jeweils gefolgt vom Argument. „Taiga-MCP `work`“ meint das Werkzeug `work` des MCP-Servers `taiga` (Claude Code: `mcp__taiga__work`). GitHub-Schritte bevorzugt über das GitHub-MCP, sonst mit `gh`. `<tmp>` ist ein temporärer Arbeitsordner außerhalb des Repositorys (Claude Code: Scratchpad der Sitzung, sonst `${TMPDIR:-/tmp}/moach`). Rückfragen mit Auswahl stellst du über das Auswahl-Werkzeug des Agenten (Claude Code: `AskUserQuestion`). Gibt es keins, stell sie als nummerierte Optionen im Chat und warte auf die Antwort.

Du arbeitest im Dialog nach der grill-me-Methode: kurze Zusammenfassungen, Entscheidungen über das Auswahl-Werkzeug des Agenten (siehe Hinweis oben), **immer Einzelauswahl** (in Claude Code `multiSelect: false`), höchstens 4 Fragen pro Runde, die empfohlene Option zuerst mit „(Recommended)“. Keine langen Textblöcke zum Durchlesen. Tabellen kurz halten. In Taiga wird **erst nach Go** etwas geändert.

## Projektzuordnung

Projekt aus `git remote get-url origin` bestimmen. Ist das Repo nicht in der Tabelle, halte an und frag.

| Repo | Taiga-Projekt | Sprintlänge | Standard-Kapazität |
|---|---|---|---|
| `Norddeutsche-Coder/m.oach` | `fynndow-moach` | 14 Tage | 14 Arbeitstage (1 Punkt = 1 Arbeitstag) |

## Phase 1: Lage erfassen

1. Sprints laden (Taiga-MCP `sprints`, `op: list`) und den laufenden bzw. zuletzt offenen Sprint bestimmen, mit Details und Stories (`op: get`, `op: stats`).
2. Alle Stories laden (Taiga-MCP `work`, `op: list`, `type: story`) mit Status, Punkten, Sprint, Tags und Epic. Für Abhängigkeiten die Zeile `**Abhängig von:**` in der Beschreibung lesen (`op: get`).
3. Epics laden (`type: epic`).
4. Entscheiden:
   - Endet der laufende Sprint in höchstens 2 Tagen oder ist er vorbei → **Phase 2 (Abschluss)**, danach Phase 3.
   - Sonst → nur Phase 3, mit dem Hinweis, dass der laufende Sprint noch bis `<Datum>` geht. Frag, ob trotzdem schon der nächste Sprint geplant werden soll.
   - Gibt es keinen Sprint → nur Phase 3.

## Phase 2: Abschluss des laufenden Sprints

1. **Bilanz** (kurz im Chat): geplante Punkte, erledigte Punkte (Status `Fertig`), Anzahl Stories je Status, dazu Stories, die während des Sprints nachträglich aufgenommen wurden (Kommentar „In Sprint … aufgenommen“), mit ihren Punkten. Sie zählen zu den erledigten Punkten, aber nicht zu den geplanten, und gehören als Thema in die Retro.
2. **Unfertige Stories** (Status ungleich `Fertig`/`Archiviert`) wandern in den neuen Sprint.
   - Status **`Im Test`**, **`Abnahme`** oder **`Im Review`** (Umsetzung fertig, nur noch QA, Abnahme bzw. Abschluss offen): Die Punkte sinken **auf 25 %**. Je Rolle anteilig rechnen, dann auf den nächsten Wert der Taiga-Skala aufrunden (½, 1, 2, 3, …). Rollen mit 0 bleiben 0, eine Rolle mit Anteil nie unter ½. Beispiele: 2 → ½, 3 → 1, 1 → ½, Front 2 + Back 1 → Front ½ + Back ½.
   - Alle anderen unfertigen Stories behalten ihre vollen Punkte.
   - Zeig die Liste (Nummer, Titel, Status, Punkte alt → neu).
3. **Retro**, zuerst die Daten berechnen:
   - geplant und erledigt, als Verhältnis in Prozent,
   - Velocity der letzten bis zu 3 Sprints,
   - Schätzabweichungen: Stories, die deutlich länger dauerten. Anhaltspunkte sind die Zeitspanne von „In Arbeit“ bis „Fertig“ laut Historie bzw. Kommentaren, die Zahl der QA-Runden (QA-Tasks), Abnahme-Runden (Abnahme-Tasks) und Release-Tasks.

   Dann nacheinander drei Fragen über das Auswahl-Werkzeug des Agenten (siehe Hinweis oben), je mit 2–3 vorformulierten Antwortvorschlägen aus den Daten (der Nutzer kann frei antworten): **Was lief gut? Was lief schlecht? Was änderst du im nächsten Sprint?**
4. **Sprint-Bericht in Alltagssprache** entwerfen, für alle Beteiligten ohne Technikkenntnis: was fertig ist und was Läufer davon haben, was sich verschoben hat und warum, was im nächsten Sprint kommt. Höchstens 10 Zeilen, keine Fachbegriffe (kein PR, CI, Merge), Story-Nummern nur in Klammern.
5. **Freigabe Abschluss:** Zeig kurz, was passieren wird (Punkte senken, Stories verschieben, Sprint schließen, Retro-Eintrag, Sprint-Bericht), und frag nach Go. Erst danach Phase 2.5.

### Phase 2.5: Abschluss ausführen (nach Go)

- Punkte senken über die Taiga-API (siehe „API-Helfer“). Vorher pro betroffener Story einen Kommentar anlegen: `Punkte für Sprint <neu> von <alt> auf <neu> gesenkt (Umsetzung fertig, nur noch QA, Abnahme bzw. Abschluss offen).`
- Die Stories werden erst in Phase 4 dem neuen Sprint zugeordnet, wenn der neue Sprint existiert.
- Den alten Sprint schließen (API: `PATCH /milestones/{id}` mit `{"closed": true}`).
- Retro-Eintrag in die Wiki-Seite `retrospektiven` (Taiga-MCP `wiki`, `op: get`, dann `op: update`). Gibt es schon einen Abschnitt für diesen Sprint mit Platzhaltern, fülle ihn aus, sonst füge oben einen neuen ein. Format:
  ```
  ## Sprint <n> · <start>–<ende>
  **Geplant:** x Punkte · **Erledigt:** y Punkte (z %) · **Velocity (Ø 3 Sprints):** v
  **Was lief gut?** …
  **Was lief schlecht?** …
  **Was ändere ich im nächsten Sprint?** …
  **Schätzung:** <deutliche Abweichungen mit Story-Nummer und vermutetem Grund> | keine Auffälligkeiten
  **Übernommen in Sprint <n+1>:** #… (Punkte alt → neu)
  ```
- Sprint-Bericht oben in die Wiki-Seite `sprint-berichte` einfügen (`op: get`, dann `op: update`), Überschrift `## Sprint <n> · <start>–<ende>`. Dazu im Chat der Vorschlag für eine Sprint-Vorführung von 15 Minuten: welche 2–3 Stories gezeigt werden und wo (Live-App oder Screenshots).

## Phase 3: Planning des nächsten Sprints

1. **Kapazität:** Standard 14 Tage. Frage einmal: „Fehlen im nächsten Sprint Tage (Urlaub, Rennen, Krankheit)?“ mit Optionen wie „Nein, 14 Tage (Recommended)“, „2–3 Tage weniger“, „eine Woche weniger“ und freier Eingabe.
2. **Planungsziel = Velocity:** Durchschnitt der erledigten Punkte der letzten bis zu 3 abgeschlossenen Sprints, gedeckelt auf die Kapazität. Gibt es noch keinen abgeschlossenen Sprint, gelten 90 % der Kapazität (abgerundet auf ½). Nenn die Zahl und woraus sie entsteht.
3. **Vorschlag zusammenstellen** in dieser festen Reihenfolge, bis das Planungsziel erreicht ist:
   1. Stories mit Tag `hotfix`,
   2. unfertige Stories aus dem letzten Sprint (mit den ggf. gesenkten Punkten),
   3. Stories mit Tag `sicherheit`, `rls` oder `datenverlust`,
   4. Stories mit Tag `bug`,
   5. alle übrigen Stories, deren Abhängigkeiten erledigt oder im selben Sprint vor ihnen eingeplant sind. Reihenfolge nach Epic, wie es im Backlog steht, innerhalb des Epics nach Story-Nummer.

   Regeln:
   - Eine Story, deren Abhängigkeit weder erledigt noch eingeplant ist, kommt nicht in den Sprint.
   - **Nur Stories im Status `Bereit`** (Definition of Ready erfüllt, Wiki `definition-of-ready`) kommen in den Vorschlag, außer übernommene und `hotfix`. Stories im Status `Neu` prüfst du gegen die Definition of Ready: Ist sie erfüllt, setzt du sie selbst auf `Bereit` (mit Kommentar) und nimmst sie in den Vorschlag auf. Sonst listest du sie als „vor dem Einplanen klären“ mit dem fehlenden Punkt.
   - Ungeschätzte Stories (`?` oder 0 Punkte) schlägst du nicht vor, du listest sie als „vor dem Einplanen schätzen“.
   - Überschreitet die nächste Story das Ziel, prüfe kleinere Stories weiter unten in der Reihenfolge, statt sofort aufzuhören. Das Ziel wird nicht überschritten.
4. **Vorschlag zeigen** als kurze Tabelle (Reihenfolge, Nummer, Titel, Punkte, Grund der Auswahl: „Hotfix“, „übernommen“, „Sicherheit“, „Bug“, „Abhängigkeit erfüllt“), dazu die Summe gegen das Planungsziel und die 3–5 nächsten Kandidaten, die knapp nicht hineinpassen.
5. **Anpassen per Auswahl:** Frag in einer Runde: „Passt der Vorschlag?“ (Go / Story tauschen / Ziel ändern), und bei Bedarf gezielt, welche Story raus und welche rein soll. Wiederholen bis zum Go.

## Phase 4: Anlegen (nach Go)

1. Neuen Sprint anlegen (Taiga-MCP `sprints`, `op: create`): Name `Sprint <n+1>`, Start = Tag nach dem Ende des letzten Sprints (bzw. das genannte Startdatum), Ende = Start + 13 Tage.
2. Die Stories dem Sprint zuordnen (Taiga-MCP `work`, `op: update`, `sprint`).
3. Prüfen (`op: get` auf den Sprint): Die Punktsumme entspricht dem Vorschlag.
4. **Sprint sortieren:** `python3 -I <repo>/.agents/skills/plan-taiga-sprint/scripts/sort_sprint.py <slug>` ausführen (`<repo>` ist das Wurzelverzeichnis des Repositorys). Stories in Bearbeitung (In Arbeit, Im Test, Im Review, Abnahme) stehen dann oben, offene darunter, fertige unten.

## API-Helfer (Punkte senken, Sprint schließen)

Das MCP kann keine Punkte pro Rolle setzen und keine Sprints schließen. Zugangsdaten aus `TAIGA_USERNAME` und `TAIGA_PASSWORD`, nie ausgeben:
```python
# python3 -I -
import json, math, os, urllib.request
API = os.environ.get("TAIGA_API_URL", "https://api.taiga.io/api/v1")
def call(m, p, b=None, t=None):
    r = urllib.request.Request(API + p, method=m, data=json.dumps(b).encode() if b is not None else None,
        headers={"Content-Type": "application/json", **({"Authorization": "Bearer " + t} if t else {})})
    with urllib.request.urlopen(r) as x:
        s = x.read(); return json.loads(s) if s else {}
t = call("POST", "/auth", {"type": "normal", "username": os.environ["TAIGA_USERNAME"], "password": os.environ["TAIGA_PASSWORD"]})["auth_token"]
proj = call("GET", f"/projects/by_slug?slug={SLUG}", t=t)
val_by_id = {x["id"]: x["value"] for x in proj["points"]}
id_by_val = {x["value"]: x["id"] for x in proj["points"] if x["value"] is not None}
scale = sorted(v for v in id_by_val if v > 0)
def reduce25(v):
    if not v: return 0
    return next(s for s in scale if s >= v * 0.25)          # aufrunden auf die Skala, mindestens ½
for ref in REFS_IN_REVIEW:
    us = call("GET", f"/userstories/by_ref?project={proj['id']}&ref={ref}", t=t)
    new = {rid: id_by_val[reduce25(val_by_id[pid] or 0)] for rid, pid in us["points"].items()}
    call("PATCH", f"/userstories/{us['id']}", {"points": new, "version": us["version"]}, t=t)
# Sprint schließen
ms = call("GET", f"/milestones/{SPRINT_ID}", t=t)
call("PATCH", f"/milestones/{SPRINT_ID}", {"closed": True, "version": ms.get("version")} if "version" in ms else {"closed": True}, t=t)
```

## Abschlussbericht

- Abschluss (falls erfolgt): Bilanz, übernommene Stories mit Punkten alt → neu, Links zur Retro-Seite und zum Sprint-Bericht,
- neuer Sprint: Name, Zeitraum, Link zum Taskboard (`https://tree.taiga.io/project/<slug>/taskboard/<sprint-slug>`),
- Stories mit Punkten und Summe gegen Planungsziel und Kapazität,
- Stories, die vor dem Einplanen geschätzt werden müssen,
- Startempfehlung: `/implement-taiga-ticket <erste Story>`.

## Grenzen

- Nichts löschen, keine Stories anlegen oder inhaltlich ändern (außer Punkte senken nach Go der aufrufenden Person und Status `Bereit` bei erfüllter Definition of Ready).
- Keinen Sprint ohne Go anlegen, schließen oder befüllen.
- Keinen Code ändern.
