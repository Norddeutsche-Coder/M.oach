# Sorts the user stories of the running Taiga sprint: stories being worked on
# first, then open ones, done ones last; the previous order is kept within each
# group. Credentials come from TAIGA_USERNAME and TAIGA_PASSWORD and are never
# printed.
#
# Usage: python3 -I sort_sprint.py <project-slug>
import datetime
import json
import os
import sys
import urllib.request

API = os.environ.get("TAIGA_API_URL", "https://api.taiga.io/api/v1")
RANK = {"In Arbeit": 0, "Im Test": 1, "Im Review": 2, "Abnahme": 3,
        "Bereit": 4, "Neu": 5, "Fertig": 6, "Archiviert": 7}


def call(method, path, body=None, token=None):
    req = urllib.request.Request(
        API + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json", "x-disable-pagination": "True",
                 **({"Authorization": "Bearer " + token} if token else {})})
    with urllib.request.urlopen(req) as res:
        raw = res.read()
        return json.loads(raw) if raw else {}


def main(slug):
    token = call("POST", "/auth", {"type": "normal", "username": os.environ["TAIGA_USERNAME"],
                                   "password": os.environ["TAIGA_PASSWORD"]})["auth_token"]
    pid = call("GET", f"/projects/by_slug?slug={slug}", token=token)["id"]
    today = datetime.date.today().isoformat()
    sprint = next((s for s in call("GET", f"/milestones?project={pid}&closed=false", token=token)
                   if s["estimated_start"] <= today <= s["estimated_finish"]), None)
    if not sprint:
        print("Kein laufender Sprint, nichts zu sortieren.")
        return
    stories = sorted(call("GET", f"/userstories?project={pid}&milestone={sprint['id']}", token=token),
                     key=lambda u: (RANK.get(u["status_extra_info"]["name"], 5), u["sprint_order"]))
    # The bulk sprint-order endpoint answers 405 on tree.taiga.io, so patch each story.
    for order, story in enumerate(stories, start=1):
        if story["sprint_order"] != order:
            call("PATCH", f"/userstories/{story['id']}", {"sprint_order": order, "version": story["version"]}, token=token)
    print(sprint["name"] + ": " + ", ".join(f"#{u['ref']} {u['status_extra_info']['name']}" for u in stories))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Aufruf: python3 -I sort_sprint.py <project-slug>")
    main(sys.argv[1])
