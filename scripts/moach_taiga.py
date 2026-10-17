# Deterministic Taiga and git helpers for the agent skills in .agents/skills.
# The skills call these commands instead of writing API code on every run, so
# results are reproducible and the agent only reads a compact summary.
#
# Credentials come from TAIGA_USERNAME and TAIGA_PASSWORD and are never printed.
# Usage: python3 -I scripts/moach_taiga.py <command> [args]   (see --help)
import argparse
import datetime
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

API = os.environ.get("TAIGA_API_URL", "https://api.taiga.io/api/v1")
PROJECTS = {"Norddeutsche-Coder/m.oach": "fynndow-moach"}
BASE_BRANCH = "main"
STATUS_RANK = {"In Arbeit": 0, "Im Test": 1, "Im Review": 2, "Abnahme": 3,
               "Bereit": 4, "Neu": 5, "Fertig": 6, "Archiviert": 7}
QUESTION_HEADS = ("## Fachliche Fragen an @", "## Technische Fragen an @")
RESOLVING_PREFIXES = ("Antworten", "Entschieden")


class Taiga:
    def __init__(self, slug):
        self.token = None
        self.token = self.call("POST", "/auth", {"type": "normal", "username": os.environ["TAIGA_USERNAME"],
                                                 "password": os.environ["TAIGA_PASSWORD"]})["auth_token"]
        self.project = self.call("GET", f"/projects/by_slug?slug={slug}")
        self.pid = self.project["id"]
        self.slug = slug

    def call(self, method, path, body=None):
        req = urllib.request.Request(
            API + path, method=method,
            data=json.dumps(body).encode() if body is not None else None,
            headers={"Content-Type": "application/json", "x-disable-pagination": "True",
                     **({"Authorization": "Bearer " + self.token} if self.token else {})})
        with urllib.request.urlopen(req) as res:
            raw = res.read()
            return json.loads(raw) if raw else {}

    def story(self, ref):
        return self.call("GET", f"/userstories/by_ref?project={self.pid}&ref={ref}")

    def comments(self, kind, obj_id):
        entries = self.call("GET", f"/history/{kind}/{obj_id}?type=comment")
        return sorted((h for h in entries if h.get("comment")), key=lambda h: h["created_at"])

    def me(self):
        return self.call("GET", "/users/me")["username"]

    def current_sprint(self):
        today = datetime.date.today().isoformat()
        return next((s for s in self.call("GET", f"/milestones?project={self.pid}&closed=false")
                     if s["estimated_start"] <= today <= s["estimated_finish"]), None)

    def roles(self):
        return {r["name"]: str(r["id"]) for r in self.project["roles"] if r["computable"]}

    def point_ids(self):
        return {p["value"]: p["id"] for p in self.project["points"] if p["value"] is not None}


def run(cmd, check=False):
    res = subprocess.run(cmd, capture_output=True, text=True)
    if check and res.returncode != 0:
        sys.exit(f"Befehl fehlgeschlagen: {' '.join(cmd)}\n{res.stderr.strip()}")
    return res


def detect_slug():
    url = run(["git", "remote", "get-url", "origin"]).stdout.strip()
    repo = re.sub(r"(\.git)?$", "", url.split("github.com")[-1].lstrip(":/"))
    if repo not in PROJECTS:
        sys.exit(f"Repository {repo or '?'} ist keinem Taiga-Projekt zugeordnet.")
    return PROJECTS[repo]


def ok(flag):
    return "✅" if flag else "❌"


# --- commands -----------------------------------------------------------------

def cmd_me(t, _):
    print(t.me())


def cmd_current_sprint(t, _):
    s = t.current_sprint()
    print(f"{s['name']} · id {s['id']} · {s['estimated_start']}–{s['estimated_finish']}" if s else "Kein laufender Sprint.")


def cmd_pending_questions(t, args):
    me, sprint = t.me(), t.current_sprint()
    if not sprint:
        print("Kein laufender Sprint, keine Suche nötig.")
        return
    heads = tuple(h + me for h in QUESTION_HEADS)
    found = 0
    for us in t.call("GET", f"/userstories?project={t.pid}&milestone={sprint['id']}"):
        if us["status_extra_info"]["is_closed"] or us["ref"] in args.exclude:
            continue
        comments = t.comments("userstory", us["id"])
        asked = [i for i, c in enumerate(comments) if c["comment"].lstrip().startswith(heads)]
        if not asked:
            continue
        later = comments[asked[-1] + 1:]
        if any(c["user"]["username"] == me or c["comment"].lstrip().startswith(RESOLVING_PREFIXES) for c in later):
            continue
        found += 1
        question = comments[asked[-1]]
        print(f"#{us['ref']} {us['subject']} · gefragt am {question['created_at'][:10]}\n{question['comment'].strip()}\n")
    print(f"{found} offene Fragerunde(n) an @{me} in {sprint['name']}.")


def cmd_sort_sprint(t, _):
    sprint = t.current_sprint()
    if not sprint:
        print("Kein laufender Sprint, nichts zu sortieren.")
        return
    stories = sorted(t.call("GET", f"/userstories?project={t.pid}&milestone={sprint['id']}"),
                     key=lambda u: (STATUS_RANK.get(u["status_extra_info"]["name"], 5), u["sprint_order"]))
    # The bulk sprint-order endpoint answers 405 on tree.taiga.io, so patch each story.
    for order, us in enumerate(stories, start=1):
        if us["sprint_order"] != order:
            t.call("PATCH", f"/userstories/{us['id']}", {"sprint_order": order, "version": us["version"]})
    print(sprint["name"] + ": " + ", ".join(f"#{u['ref']} {u['status_extra_info']['name']}" for u in stories))


def parse_estimates(pairs, roles):
    est = {}
    for pair in pairs:
        name, _, value = pair.partition("=")
        if name not in roles:
            sys.exit(f"Unbekannte Rolle {name}. Erlaubt: {', '.join(roles)}")
        est[name] = float(value.replace("½", "0.5"))
    return est


def cmd_set_points(t, args):
    roles, ids = t.roles(), t.point_ids()
    est = parse_estimates(args.estimates, roles)
    us = t.story(args.ref)
    t.call("PATCH", f"/userstories/{us['id']}",
           {"points": {rid: ids[est.get(name, 0)] for name, rid in roles.items()}, "version": us["version"]})
    total = t.story(args.ref)["total_points"]
    expected = sum(est.values())
    print(f"#{args.ref}: {total} Punkte {ok(abs((total or 0) - expected) < 1e-9)} (erwartet {expected:g})")


def cmd_reduce_points(t, args):
    ids = t.point_ids()
    values = {v: k for k, v in ids.items()}
    scale = sorted(v for v in ids if v > 0)
    for ref in args.refs:
        us = t.story(ref)
        before = us["total_points"]
        new = {}
        for role_id, point_id in us["points"].items():
            value = values.get(point_id) or 0
            new[role_id] = ids[next(s for s in scale if s >= value * 0.25)] if value else ids[0]
        t.call("PATCH", f"/userstories/{us['id']}", {"points": new, "version": us["version"]})
        print(f"#{ref}: {before:g} → {t.story(ref)['total_points']:g} Punkte")


def cmd_close_sprint(t, args):
    sprint = next((s for s in t.call("GET", f"/milestones?project={t.pid}")
                   if s["name"] == args.sprint or str(s["id"]) == args.sprint), None)
    if not sprint:
        sys.exit(f"Sprint {args.sprint} nicht gefunden.")
    body = {"closed": True, **({"version": sprint["version"]} if "version" in sprint else {})}
    t.call("PATCH", f"/milestones/{sprint['id']}", body)
    print(f"{sprint['name']} geschlossen.")


def cmd_epic_color(t, args):
    ep = t.call("GET", f"/epics/by_ref?project={t.pid}&ref={args.ref}")
    t.call("PATCH", f"/epics/{ep['id']}", {"color": args.color, "version": ep["version"]})
    print(f"Epic #{args.ref}: Farbe {args.color}")


def cmd_tag_color(t, args):
    # Only from_tag and color; sending to_tag makes Taiga reject the request.
    t.call("POST", f"/projects/{t.pid}/edit_tag", {"from_tag": args.tag, "color": args.color})
    print(f"Tag {args.tag}: Farbe {args.color}")


def cmd_set_pr_link(t, args):
    us = t.story(args.ref)
    attr = next(a for a in t.call("GET", f"/userstory-custom-attributes?project={t.pid}") if a["name"] == "Pull Request")
    cur = t.call("GET", f"/userstories/custom-attributes-values/{us['id']}")
    values = {**cur["attributes_values"], str(attr["id"]): args.url}
    t.call("PATCH", f"/userstories/custom-attributes-values/{us['id']}",
           {"attributes_values": values, "version": cur["version"]})
    print(f"#{args.ref}: Pull Request {args.url}")


def cmd_add_watcher(t, args):
    issue = t.call("GET", f"/issues/by_ref?project={t.pid}&ref={args.issue}")
    us = t.story(args.story)
    watchers = sorted(set(us["watchers"]) | {issue["owner"]})
    t.call("PATCH", f"/userstories/{us['id']}", {"watchers": watchers, "version": us["version"]})
    print(f"#{args.story}: meldende Person aus Issue #{args.issue} beobachtet die Story.")


def cmd_finish_check(t, args):
    ref = args.ref
    us = t.story(ref)
    run(["git", "fetch", "-q", "origin"], check=True)
    branches = [b.strip().removeprefix("origin/") for b in
                run(["git", "branch", "-r", "--list", f"origin/*tg-{ref}-*"]).stdout.splitlines() if b.strip()]
    if len(branches) != 1:
        sys.exit(f"❌ Branch: {'keiner' if not branches else ', '.join(branches)} für tg-{ref} gefunden.")
    branch = branches[0]
    remote = f"origin/{branch}"
    base = f"origin/{BASE_BRANCH}"
    sha = run(["git", "rev-parse", remote], check=True).stdout.strip()
    short = sha[:7]
    results = []

    runs = json.loads(run(["gh", "run", "list", "--commit", sha, "--json", "workflowName,status,conclusion,url"]).stdout or "[]")
    if not runs:
        results.append(("⏳", f"CI: noch kein Lauf für {short}"))
    elif any(r["status"] != "completed" for r in runs):
        results.append(("⏳", "CI: läuft noch (" + ", ".join(r["workflowName"] for r in runs if r["status"] != "completed") + ")"))
    else:
        failed = [r for r in runs if r["conclusion"] != "success"]
        results.append((ok(not failed), "CI: " + ("grün" if not failed else "rot: " + ", ".join(f"{r['workflowName']} {r['url']}" for r in failed))))

    comments = t.comments("userstory", us["id"])
    qa = [c for c in comments if c["comment"].lstrip().startswith("## QA")]
    last_qa = qa[-1]["comment"].splitlines()[0] if qa else ""
    results.append((ok("✅ bestanden" in last_qa and short in last_qa),
                    f"QA: {last_qa.strip() or 'kein QA-Kommentar'} (Head {short})"))

    behind = run(["git", "rev-list", "--count", f"{remote}..{base}"]).stdout.strip()
    if behind and behind != "0":
        mb = run(["git", "merge-base", remote, base]).stdout.strip()
        ours = set(run(["git", "diff", "--name-only", f"{mb}..{remote}"]).stdout.split())
        theirs = set(run(["git", "diff", "--name-only", f"{mb}..{base}"]).stdout.split())
        overlap = sorted(ours & theirs)
        results.append(("⚠️" if overlap else "✅",
                        f"Basis: {behind} neue Commit(s) auf {BASE_BRANCH}" +
                        (f", gleiche Dateien: {', '.join(overlap)}" if overlap else ", keine gemeinsamen Dateien")))
    else:
        results.append(("✅", f"Basis: Branch enthält {BASE_BRANCH}"))

    status = us["status_extra_info"]["name"]
    results.append((ok(status == "Im Test"), f"Status: {status}"))

    tasks = t.call("GET", f"/tasks?project={t.pid}&user_story={us['id']}")
    open_tasks = [f"#{x['ref']} {x['subject']} ({x['status_extra_info']['name']})" for x in tasks
                  if not x["status_extra_info"]["is_closed"]]
    results.append((ok(not open_tasks), "Offene Tasks: " + ("keine" if not open_tasks else "; ".join(open_tasks))))

    desc = us.get("description") or ""
    ac = desc.split("## Acceptance Criteria", 1)[-1] if "## Acceptance Criteria" in desc else desc
    unchecked, checked = len(re.findall(r"^- \[ \]", ac, re.M)), len(re.findall(r"^- \[x\]", ac, re.M | re.I))
    results.append((ok(unchecked == 0), f"Acceptance Criteria: {checked} abgehakt, {unchecked} offen"))

    conflict = run(["git", "merge-tree", "--write-tree", base, remote]).returncode != 0
    results.append((ok(not conflict), "Mergebar: " + ("Konflikte" if conflict else "ohne Konflikte")))

    prs = json.loads(run(["gh", "pr", "list", "--head", branch, "--state", "open", "--json", "number,url"]).stdout or "[]")
    results.append(("⚠️" if prs else "✅", "PR: " + (", ".join(p["url"] for p in prs) if prs else "noch keiner")))

    print(f"Story #{ref} {us['subject']} · Branch {branch} @ {short} · zugeordnet: "
          f"{(us.get('assigned_to_extra_info') or {}).get('username', '–')}")
    for mark, text in results:
        print(f"{mark} {text}")


def cmd_sprint_stats(t, _):
    sprints = sorted(t.call("GET", f"/milestones?project={t.pid}"), key=lambda s: s["estimated_start"])
    closed = [s for s in sprints if s["closed"]][-3:]
    for s in closed:
        print(f"{s['name']}: geplant {s.get('total_points') or 0:g}, erledigt {s.get('closed_points') or 0:g}")
    if closed:
        print(f"Velocity (Ø {len(closed)}): {sum(s.get('closed_points') or 0 for s in closed) / len(closed):g}")
    cur = t.current_sprint() or next((s for s in reversed(sprints) if not s["closed"]), None)
    if not cur:
        print("Kein offener Sprint.")
        return
    stories = t.call("GET", f"/userstories?project={t.pid}&milestone={cur['id']}")
    by_status = {}
    for us in stories:
        by_status.setdefault(us["status_extra_info"]["name"], []).append(us)
    print(f"{cur['name']} ({cur['estimated_start']}–{cur['estimated_finish']}):")
    for name in sorted(by_status, key=lambda n: STATUS_RANK.get(n, 9)):
        items = by_status[name]
        print(f"  {name}: {len(items)} Stories, {sum(u['total_points'] or 0 for u in items):g} Punkte · "
              + ", ".join(f"#{u['ref']}" for u in items))
    added = [u for u in stories if any(c["comment"].startswith(f"In Sprint {cur['name']} aufgenommen")
                                       for c in t.comments("userstory", u["id"]))]
    if added:
        print("  Nachträglich aufgenommen: " + ", ".join(f"#{u['ref']} ({u['total_points'] or 0:g})" for u in added))


def cmd_compare_shots(_, args):
    before, after = Path(args.before), Path(args.after)
    digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
    old = {p.name: digest(p) for p in before.glob("*.png")}
    new = {p.name: digest(p) for p in after.glob("*.png")}
    changed = sorted(n for n in new if n in old and new[n] != old[n])
    added = sorted(n for n in new if n not in old)
    removed = sorted(n for n in old if n not in new)
    unchanged = sorted(n for n in new if n in old and new[n] == old[n])
    print(f"geändert: {len(changed)} · neu: {len(added)} · entfallen: {len(removed)} · unverändert: {len(unchanged)}")
    for label, names in (("geändert", changed), ("neu", added), ("entfallen", removed), ("unverändert", unchanged)):
        for n in names:
            print(f"{label}: {n}")


def main():
    parser = argparse.ArgumentParser(description="Taiga- und Git-Helfer für die Agent-Skills.")
    parser.add_argument("--project", help="Taiga-Projekt-Slug (Standard: aus git remote)")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("me", help="Taiga-Konto der Sitzung")
    sub.add_parser("current-sprint", help="laufender Sprint")
    p = sub.add_parser("pending-questions", help="offene Fragen an mich im laufenden Sprint")
    p.add_argument("--exclude", type=int, nargs="*", default=[], help="Story-Nummern ausnehmen")
    sub.add_parser("sort-sprint", help="laufenden Sprint nach Status sortieren")
    p = sub.add_parser("set-points", help="Punkte pro Rolle setzen, z. B. 27 Front=2 Back=0.5")
    p.add_argument("ref", type=int)
    p.add_argument("estimates", nargs="+")
    p = sub.add_parser("reduce-points", help="Punkte auf 25 %% senken")
    p.add_argument("refs", type=int, nargs="+")
    p = sub.add_parser("close-sprint", help="Sprint schließen (Name oder ID)")
    p.add_argument("sprint")
    p = sub.add_parser("epic-color")
    p.add_argument("ref", type=int)
    p.add_argument("color")
    p = sub.add_parser("tag-color")
    p.add_argument("tag")
    p.add_argument("color")
    p = sub.add_parser("set-pr-link")
    p.add_argument("ref", type=int)
    p.add_argument("url")
    p = sub.add_parser("add-watcher", help="meldende Person eines Issues als Beobachter der Story")
    p.add_argument("story", type=int)
    p.add_argument("issue", type=int)
    p = sub.add_parser("finish-check", help="Bedingungen vor PR und Merge")
    p.add_argument("ref", type=int)
    sub.add_parser("sprint-stats", help="Velocity und Stand des laufenden Sprints")
    p = sub.add_parser("compare-shots", help="Screenshots vorher/nachher vergleichen (ohne Taiga)")
    p.add_argument("before")
    p.add_argument("after")
    args = parser.parse_args()

    if args.command == "compare-shots":
        return cmd_compare_shots(None, args)
    taiga = Taiga(args.project or detect_slug())
    globals()["cmd_" + args.command.replace("-", "_")](taiga, args)


if __name__ == "__main__":
    main()
