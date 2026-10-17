---
name: implement-taiga-ticket
description: Setzt eine Taiga-User-Story bis zur QA-Bereitschaft um, ohne Pull Request. Aufruf mit der Story-Nummer, z. B. `/implement-taiga-ticket 27`. Prüft die Definition of Ready, ordnet die Story der aufrufenden Person und dem laufenden Sprint zu, plant, legt Branch und Taiga-Tasks an, implementiert, macht schnelle Checks (Typen, Lint, Unit-Tests), wartet auf Freigabe, committet, pusht den Branch, wartet auf die CI und setzt die Story auf Im Test. Danach prüft /qa-taiga-ticket, erst /finish-taiga-ticket erstellt den PR, und sichtbare Änderungen nimmt nach der Veröffentlichung eine andere Person ab.
argument-hint: <story-nummer>
disable-model-invocation: true
---

# Taiga-Story umsetzen

> **Für alle Agenten** (Claude Code, Codex u. a.). Aufruf in Claude Code mit `/implement-taiga-ticket`, in Codex mit `$implement-taiga-ticket`, jeweils gefolgt vom Argument. „Taiga-MCP `work`“ meint das Werkzeug `work` des MCP-Servers `taiga` (Claude Code: `mcp__taiga__work`). GitHub-Schritte bevorzugt über das GitHub-MCP, sonst mit `gh`. `<tmp>` ist ein temporärer Arbeitsordner außerhalb des Repositorys (Claude Code: Scratchpad der Sitzung, sonst `${TMPDIR:-/tmp}/moach`). Rückfragen mit Auswahl stellst du über das Auswahl-Werkzeug des Agenten (Claude Code: `AskUserQuestion`). Gibt es keins, stell sie als nummerierte Optionen im Chat und warte auf die Antwort.

Argument: das Aufruf-Argument ist die Nummer einer **User Story** (z. B. `27` oder `#27`). Fehlt sie, frag danach und mach nichts weiter.

Arbeite die Phasen der Reihe nach ab. **Zwei Haltepunkte sind Pflicht:** nach dem Plan (Phase 2) und nach der Umsetzung (Phase 5). Dort hältst du an und wartest auf ein ausdrückliches Go. Ein Go zum Plan ist kein Go zum Commit.

Dieser Skill macht nur **schnelle Checks** (Typprüfung, Lint, Unit-Tests). Kein Build, keine E2E-Tests, keine Screenshots, kein Abgleich der Acceptance Criteria mit Beleg. Das übernimmt `/qa-taiga-ticket` auf dem gepushten Branch.

**Kein Pull Request vor bestandener QA.** Dieser Skill erstellt nie einen PR, auch nicht als Entwurf. Den PR erstellt erst `/finish-taiga-ticket`.

Ablauf über alle Skills: umsetzen → Checks → Go → Commit + Push → CI grün → **Im Test** → `/qa-taiga-ticket` → bei Befunden zurück zu diesem Skill (Story wieder `In Arbeit`) → bei Bestehen `/finish-taiga-ticket` (PR, **Im Review**, Merge, Deployment) → bei sichtbaren Änderungen **Abnahme** in der Live-App durch eine andere Person → **Fertig**.

## Projektzuordnung

Bestimme das Projekt aus `git remote get-url origin`. Ist das Repo nicht in der Tabelle, halte an und frag nach. Rate nie.

| Repo | Taiga-Projekt | Basis-Branch | App-Ordner | Schnelle Checks | Fachliche Fragen | Technische Fragen (nur Architektur) |
|---|---|---|---|---|---|---|
| `Norddeutsche-Coder/m.oach` | `fynndow-moach` | `main` | `frontend/` | `npm run check`, `npm run lint`, `npm test` | `lukcy22` | `fynndow` |

Es gibt **keinen Product Owner, der entscheidet.** Freigaben (Go) gibt die Person, die den Skill aufruft.

**Fachliche Fragen** (Verhalten, Texte, Umfang, Entwurf) beantwortet `lukcy22`, nicht der Agent und nicht die Entwicklung. Stell sie als Kommentar an die Story mit der Überschrift `## Fachliche Fragen an @lukcy22`: nummeriert, je Frage 2–4 Antwortmöglichkeiten in Alltagssprache, die empfohlene zuerst mit „(Empfehlung)“. Die Erwähnung `@lukcy22` löst die E-Mail von Taiga aus. Danach halte an. Weiter geht es erst, wenn `lukcy22` in einem Kommentar geantwortet hat. Antwortet er nach **2 Arbeitstagen** nicht, darf die aufrufende Person selbst entscheiden, mit einem Kommentar, der mit „Entschieden“ beginnt (z. B. `Entschieden nach 2 Arbeitstagen ohne Antwort: 1: A, 2: B`).

**Technische Fragen** gehen nur an `fynndow`, wenn sie die **Architektur** beeinflussen: neue Abhängigkeiten oder Bibliotheken, Datenmodell, localStorage-Schlüssel und -Format, Supabase (Schema, RLS, Edge Functions), Sync, Offline und Service Worker, Sicherheit, neue Module oder Ordner und Schnittstellen zwischen Features, Aufteilung zwischen Legacy-Modul und React. Stell sie im Dialog über das Auswahl-Werkzeug, mit Empfehlung. Läuft die Sitzung ohne ihn, als Kommentar `## Technische Fragen an @fynndow` an die Story, dann anhalten. **Alle übrigen technischen Entscheidungen triffst du selbst** (Umsetzung innerhalb eines Features, Benennung, Aufteilung in Komponenten und Funktionen, Testaufbau) und dokumentierst sie im Plan und im Kommentar „Technische Entscheidungen“.

Taiga-Status in diesem Projekt (Name, Slug in Klammern):
- **User Story:** Neu (`neu`), Bereit (`bereit`, Definition of Ready erfüllt), In Arbeit (`in-arbeit`), Im Test (`im-test`, gepusht, wartet auf QA), Im Review (`im-review`, PR offen), Abnahme (`abnahme`, live, wartet auf die Abnahme durch eine andere Person), Fertig (`fertig`), Archiviert (`archiviert`)
- **Task:** Neu, In Arbeit, Im Test (erledigt, wartet auf QA), Im Review, Erledigt (setzt `/qa-taiga-ticket` nach bestandener QA), Blockiert

Lies außerdem die Wiki-Seiten `definition-of-ready` und `definition-of-done` (Taiga-MCP `wiki`, op `get`). Ihre Punkte gelten zusätzlich zu den Acceptance Criteria.

**Hotfix:** Trägt die Story den Tag `hotfix` (dringender Fehler in der Live-App), entfallen die Prüfung der Definition of Ready, das WIP-Limit und der Entwurf. Alles andere gilt unverändert. Ablauf siehe Wiki-Seite `hotfix`.

## Phase 0: Offene Rückfragen an die aufrufende Person

Bevor du die Story lädst, prüfst du, ob in **anderen Stories des laufenden Sprints** noch Fragen an die aufrufende Person unbeantwortet sind. Sie sollen beantwortet werden, bevor neue Arbeit beginnt, sonst bleiben andere Stories stehen.

1. Aufrufende Person bestimmen: Taiga-Konto der Sitzung (`GET /users/me`).
2. Nur die offenen Stories (Status nicht `Fertig`/`Archiviert`) im **laufenden Sprint** durchsuchen, also im offenen Sprint, dessen Zeitraum das heutige Datum enthält. Backlog, andere Sprints und Issues nicht. Gibt es keinen laufenden Sprint, entfällt Phase 0. Offen ist eine Frage, wenn ein Kommentar mit `## Fachliche Fragen an @<person>` oder `## Technische Fragen an @<person>` beginnt und danach weder ein Kommentar dieser Person folgt noch ein Kommentar einer anderen Person, der mit „Antworten“ oder „Entschieden“ beginnt (z. B. wenn die aufrufende Person nach 2 Arbeitstagen ohne Antwort entschieden hat). Das MCP kann Kommentare nicht projektweit durchsuchen, deshalb über die Taiga-API (Zugangsdaten aus `TAIGA_USERNAME` und `TAIGA_PASSWORD`, nie ausgeben):
   ```python
   # python3 -I -
   import json, os, urllib.request
   API = os.environ.get("TAIGA_API_URL", "https://api.taiga.io/api/v1")
   def call(m, p, b=None, t=None):
       r = urllib.request.Request(API + p, method=m, data=json.dumps(b).encode() if b is not None else None,
           headers={"Content-Type": "application/json", "x-disable-pagination": "True", **({"Authorization": "Bearer " + t} if t else {})})
       with urllib.request.urlopen(r) as x:
           s = x.read(); return json.loads(s) if s else {}
   t = call("POST", "/auth", {"type": "normal", "username": os.environ["TAIGA_USERNAME"], "password": os.environ["TAIGA_PASSWORD"]})["auth_token"]
   me = call("GET", "/users/me", t=t)["username"]
   pid = call("GET", f"/projects/by_slug?slug={SLUG}", t=t)["id"]
   import datetime
   today = datetime.date.today().isoformat()
   sprint = next((s for s in call("GET", f"/milestones?project={pid}&closed=false", t=t)
                  if s["estimated_start"] <= today <= s["estimated_finish"]), None)
   if not sprint:
       raise SystemExit("Kein laufender Sprint, Phase 0 entfällt.")
   heads = (f"## Fachliche Fragen an @{me}", f"## Technische Fragen an @{me}")
   for it in call("GET", f"/userstories?project={pid}&milestone={sprint['id']}", t=t):
       if it["status_extra_info"]["is_closed"] or it["ref"] == NR:
           continue
       comments = sorted((h for h in call("GET", f"/history/userstory/{it['id']}?type=comment", t=t) if h.get("comment")), key=lambda h: h["created_at"])
       asked = [i for i, h in enumerate(comments) if h["comment"].lstrip().startswith(heads)]
       later = comments[asked[-1] + 1:] if asked else []
       if asked and not any(h["user"]["username"] == me or h["comment"].lstrip().startswith(("Antworten", "Entschieden")) for h in later):
           print(sprint["name"], it["ref"], it["subject"], comments[asked[-1]]["created_at"][:10])
   ```
3. **Gibt es offene Fragen:** Zeig sie zuerst, je Story mit Nummer, Titel und den Fragen samt Antwortmöglichkeiten. Frag über das Auswahl-Werkzeug, ob sie jetzt beantwortet werden (Empfehlung) oder erst später. Antwortet die Person im Dialog, schreib die Antworten als Kommentar an die jeweilige Story: `Antworten von @<person> (im Dialog mit <Agent>): 1: …, 2: …`. Ist eine dieser Stories dadurch vollständig geklärt und erfüllt die Definition of Ready, setz sie auf `Bereit`. Danach geht es mit der aufgerufenen Story weiter.
4. **Keine offenen Fragen:** kurz melden und mit Phase 1 weitermachen.

## Phase 1: Story laden und Lage prüfen

1. Story laden: Taiga-MCP `work` mit `op: get`, `type: story`, `item: #<nr>`, `project: <slug>`. Merke Titel, Beschreibung, Acceptance Criteria (Checkliste), Tags, Epic, Status, Sprint und Punkte.
2. Bestehende Tasks und Kommentare der Story laden (`op: list`, `type: task`, Filter auf die Story; Taiga-MCP `comments`, `op: list`).
3. Git-Lage prüfen:
   - `git status`: Gibt es uncommittete Änderungen, die nicht zu dieser Story gehören, halte an und frag.
   - `git fetch origin` und nach einem Branch suchen, der `tg-<nr>-` im Namen trägt (lokal und remote).
4. **Fortsetzen statt neu anfangen:** Ist die Story schon `In Arbeit` oder gibt es den Branch, wechsle dorthin. Lies die offenen Tasks (vor allem `QA: …`, `Abnahme: …` und `Release: …` mit Geprüft, Erwartet, Tatsächlich, Ursache, Vorschlag), die Kommentare von QA, Abnahme und Fragerunden und `git diff origin/<basis>...HEAD` und plane nur noch den Rest. Der Haltepunkt nach dem Plan gilt trotzdem.
5. Ist die Story `Fertig`, `Im Review` oder `Abnahme`, oder `Im Test` ohne offene Tasks, halte an und melde den Stand. Nächster Schritt ist dann `/qa-taiga-ticket`, `/finish-taiga-ticket` bzw. die Abnahme durch die andere Person. Wurde eine Story „Nicht abgenommen“, steht sie mit `Abnahme: …`-Tasks auf `In Arbeit`. Dann setzt du diese Tasks auf einem neuen Branch um.
6. **Wer arbeitet:** Die Story gehört der Person, die diesen Skill aufruft. Das ist das Taiga-Konto der Sitzung, angemeldet über `TAIGA_USERNAME` (im Taiga-MCP `assignee: "me"`, in der API `GET /users/me`). Ist die Story schon einer anderen Person zugeordnet, halte an und frag, ob du sie übernehmen sollst. Ohne ausdrückliches Ja wird nicht umgehängt.
7. **WIP-Limit:** Gibt es außer dieser eine andere Story im Status `In Arbeit`, die der aufrufenden Person zugeordnet ist (`op: list`, `type: story`, `status: In Arbeit`, `assignee: "me"`), halte an und frag, ob die andere zuerst fertig werden soll. Höchstens eine Story pro Person ist gleichzeitig in Arbeit (gilt nicht für `hotfix`).
8. **Definition of Ready:** Ist die Story `Bereit`, weiter. Ist sie `Neu`, prüf die Punkte der Wiki-Seite `definition-of-ready` und zeig das Ergebnis im Plan. Fehlende fachliche Punkte sind Fragen an `lukcy22`, eine fehlende Schätzung ergänzt du im Plan. Sind danach alle Punkte erfüllt, setz die Story selbst auf `Bereit`.
9. **Entwurf bei Oberflächen-Stories:** Betrifft die Story die Oberfläche (sichtbare Ansichten, Texte, Layout), braucht sie einen freigegebenen Entwurf: einen Link (z. B. Figma) oder ein Bild in der Story und einen Kommentar von `lukcy22` „Entwurf freigegeben“ oder „Kein Entwurf nötig“. Fehlt das, ist es eine fachliche Frage an `lukcy22`.

## Phase 2: Plan (Haltepunkt 1)

Untersuche den betroffenen Code selbst, bevor du fragst. Was sich aus dem Code beantworten lässt, schlägst du nach. Zeig dann:

- **Kurz gesagt:** 2–3 Sätze ohne Fachbegriffe: was sich für Läufer ändert und woran man es sieht.
- **Ziel** der Story in einem Satz.
- **Definition of Ready:** erfüllt, oder welche Punkte fehlen (nur bei Status `Neu`).
- **Acceptance Criteria** einzeln, jeweils mit: wie du sie erfüllst.
- **Schritte** als nummerierte Liste. Sie werden zu Taiga-Tasks, deshalb jeder Schritt klar abgegrenzt und höchstens ein halber Tag.
- **Betroffene Dateien.**
- **Fachliche Fragen an `lukcy22`:** Verhalten, Texte, Umfang, Entwurf, fehlende fachliche Punkte der Definition of Ready. Jeweils mit deinem Vorschlag, in Alltagssprache. Gibt es welche, schreib sie wie oben beschrieben als Kommentar an die Story und halte an. Bereits beantwortete Fragen übernimmst du aus den Kommentaren.
- **Technische Fragen an `fynndow`** (nur Architektur, siehe oben): jeweils mit Alternativen und Empfehlung.
- **Technische Entscheidungen**, die du selbst triffst: kurz aufgelistet, damit sie nachvollziehbar sind.
- **Risiken**, z. B. Änderungen an localStorage-Schlüsseln, Supabase, Service Worker.
- **Branch-Name:** `<typ>/tg-<nr>-<kurztitel>`. Typ `fix`, wenn die Story den Tag `bug` oder `hotfix` hat, `chore` für reine Infrastruktur oder Doku, sonst `feat`. Der Kurztitel ist englisch, kleingeschrieben, mit Bindestrichen, höchstens 5 Wörter.

**Halte an** und warte auf ein Go. Ein Go zum Plan gibt es erst, wenn alle fachlichen Fragen von `lukcy22` (oder nach 2 Arbeitstagen ohne Antwort mit „Entschieden“ von der aufrufenden Person) beantwortet sind. Ebenso müssen die Architektur-Fragen von `fynndow` entschieden sein. Schreib die technischen Entscheidungen danach als Kommentar an die Story (Taiga-MCP `comments`).

## Phase 3: Vorbereiten (erst nach Go zum Plan)

1. Branch von aktuellem `origin/<basis>` anlegen. Beim Fortsetzen den vorhandenen nehmen.
2. Story der aufrufenden Person zuordnen und auf `In Arbeit` setzen (Taiga-MCP `work`, `op: update`, `assignee: "me"`, `status: In Arbeit`).
   **Laufender Sprint:** Ist die Story nicht im laufenden Sprint, zieh sie hinein (`op: update`, `sprint: <Name>`). Laufend ist der offene Sprint, dessen Zeitraum das heutige Datum enthält (Taiga-MCP `sprints`, `op: list`). Gibt es keinen, halte an und frag, ob ein Sprint angelegt (`/plan-taiga-sprint`) oder ohne Sprint gearbeitet werden soll. Schreib dazu einen Kommentar an die Story: `In Sprint <Name> aufgenommen (vorher: <alter Sprint> | Backlog), <Punkte> Punkte zusätzlich zur Planung.`
3. Für jeden Planschritt, den es noch nicht gibt, einen Task in der Story anlegen (`op: create`, `type: task`, `parent: #<nr>`, Status `Neu`, `assignee: "me"`, als Batch). Beim Fortsetzen offene Tasks ohne Zuordnung ebenfalls der aufrufenden Person zuordnen.

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
- Status in Taiga (Story und Tasks), Zuordnung und Sprint, bei nachträglicher Aufnahme mit dem Hinweis, dass der Sprint jetzt um <Punkte> Punkte über der Planung liegt,
- erfüllte Acceptance Criteria und gegebenenfalls nicht erfüllte mit Grund,
- was die QA besonders prüfen sollte,
- Auffälligkeiten außerhalb des Umfangs als Vorschlag für neue Stories. Lege sie **nicht** selbst an,
- der Hinweis, dass nach der QA `/finish-taiga-ticket` den PR erstellt und sichtbare Änderungen nach der Veröffentlichung von einer anderen Person abgenommen werden.

## Grenzen

- **Nie einen Pull Request erstellen**, auch keinen Entwurf. Das macht `/finish-taiga-ticket` nach bestandener QA.
- Nie mergen, die Story nie auf `Abnahme`, `Im Review` oder `Fertig` setzen.
- Fachliche Fragen nie selbst entscheiden, sondern `lukcy22` vorlegen. Technische Fragen, die die Architektur beeinflussen, nie selbst entscheiden, sondern `fynndow` vorlegen. Andere technische Fragen nicht vorlegen, sondern selbst entscheiden und dokumentieren.
- Keine Änderungen an GitHub-, Taiga- oder Supabase-Einstellungen, keine Migrationen gegen das Live-Projekt.
- Keine Zugangsdaten, Tokens oder Secrets in Code, Commits oder Taiga-Kommentaren.
- Geht etwas außerhalb des Plans schief, oder erfordert die Story Schritte, die nicht im freigegebenen Plan standen, halte an und frag.
