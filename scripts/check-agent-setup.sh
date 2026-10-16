#!/usr/bin/env bash
# Prüft die Einrichtung für KI-Agenten (GitHub und Taiga), siehe docs/agent-setup.md.
# Zeigt keine Zugangsdaten an. Ändert nichts.
set -u

REPO="Norddeutsche-Coder/m.oach"
TAIGA_PROJECT="fynndow-moach"
fails=0
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$1"; [ -n "${2:-}" ] && printf '      → %s\n' "$2"; fails=$((fails + 1)); }
info() { printf '  · %s\n' "$1"; }
section() { printf '\n\033[1m%s\033[0m\n' "$1"; }

section "Werkzeuge"
if command -v node >/dev/null; then
  v=$(node -v | sed 's/^v//'); major=${v%%.*}; minor=$(echo "$v" | cut -d. -f2)
  if [ "$major" -gt 22 ] || { [ "$major" -eq 22 ] && [ "$minor" -ge 12 ]; } || { [ "$major" -eq 20 ] && [ "$minor" -ge 19 ]; }; then ok "Node $v"
  else bad "Node $v ist zu alt" "Node 22 installieren (siehe .nvmrc)"; fi
else bad "Node fehlt" "Node 22 installieren"; fi
if command -v npm >/dev/null; then
  n=$(npm -v); [ "${n%%.*}" -ge 11 ] && ok "npm $n" || bad "npm $n ist zu alt" "npm install --global npm@11"
else bad "npm fehlt"; fi
command -v python3 >/dev/null && ok "Python 3" || bad "Python 3 fehlt" "wird für die Online-Prüfungen gebraucht"

section "Variablen"
for var in GITHUB_PERSONAL_ACCESS_TOKEN TAIGA_USERNAME TAIGA_PASSWORD; do
  if [ -n "${!var:-}" ]; then ok "$var gesetzt"
  else bad "$var fehlt in dieser Shell" "in ~/.zshrc eintragen und ein neues Terminal öffnen (docs/agent-setup.md, Abschnitt 4)"; fi
done
if [ -f "$HOME/.zshrc" ]; then
  if grep -nE '^[[:space:]]*export[[:space:]]+(GITHUB_PERSONAL_ACCESS_TOKEN|TAIGA_[A-Z_]+)[[:space:]]+=' "$HOME/.zshrc" >/dev/null; then
    bad "~/.zshrc: Leerzeichen vor dem = (Variable wird so nicht gesetzt)" "export NAME='wert' ohne Leerzeichen schreiben"
  else ok "~/.zshrc: Schreibweise der Variablen in Ordnung"; fi
fi

section "Taiga"
if [ -n "${TAIGA_USERNAME:-}" ] && [ -n "${TAIGA_PASSWORD:-}" ] && command -v python3 >/dev/null; then
  TAIGA_PROJECT="$TAIGA_PROJECT" python3 -I - <<'PY'
import json, os, sys, urllib.request, urllib.error
api = os.environ.get("TAIGA_API_URL", "https://api.taiga.io/api/v1")
def call(m, p, b=None, t=None):
    r = urllib.request.Request(api + p, method=m, data=json.dumps(b).encode() if b is not None else None,
        headers={"Content-Type": "application/json", **({"Authorization": "Bearer " + t} if t else {})})
    with urllib.request.urlopen(r, timeout=20) as x: return json.load(x)
try:
    t = call("POST", "/auth", {"type": "normal", "username": os.environ["TAIGA_USERNAME"], "password": os.environ["TAIGA_PASSWORD"]})["auth_token"]
    print("OK Anmeldung bei Taiga")
except urllib.error.HTTPError as e:
    print(f"FAIL Anmeldung bei Taiga abgelehnt (HTTP {e.code})|Zugangsdaten prüfen, Login auf tree.taiga.io mit E-Mail und Passwort testen"); sys.exit()
except Exception as e:
    print(f"FAIL Taiga nicht erreichbar ({type(e).__name__})|Internetverbindung bzw. TAIGA_API_URL prüfen"); sys.exit()
try:
    p = call("GET", f"/projects/by_slug?slug={os.environ['TAIGA_PROJECT']}", t=t)
    print(f"OK Zugriff auf Projekt {p['slug']}")
except urllib.error.HTTPError as e:
    print(f"FAIL Kein Zugriff auf Projekt {os.environ['TAIGA_PROJECT']} (HTTP {e.code})|In Taiga ins Projekt einladen lassen")
PY
else info "übersprungen (Variablen fehlen)"; fi | while IFS= read -r line; do
  case "$line" in
    OK\ *) ok "${line#OK }" ;;
    FAIL\ *) msg=${line#FAIL }; bad "${msg%%|*}" "${msg#*|}"; echo "__FAIL__" >> "${TMPDIR:-/tmp}/agent-setup-fails.$$" ;;
    *) echo "$line" ;;
  esac
done

section "GitHub"
if [ -n "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ] && command -v python3 >/dev/null; then
  REPO="$REPO" python3 -I - <<'PY'
import json, os, urllib.request, urllib.error
tok, repo = os.environ["GITHUB_PERSONAL_ACCESS_TOKEN"], os.environ["REPO"]
def get(p):
    r = urllib.request.Request("https://api.github.com" + p, headers={"Authorization": "Bearer " + tok, "Accept": "application/vnd.github+json"})
    try:
        with urllib.request.urlopen(r, timeout=20) as x: return x.status, json.load(x)
    except urllib.error.HTTPError as e: return e.code, None
    except Exception: return 0, None
s, me = get("/user")
if s == 200: print(f"OK Token gültig (angemeldet als {me['login']})")
elif s == 0: print("FAIL GitHub nicht erreichbar|Internetverbindung prüfen")
else: print(f"FAIL Token ungültig oder abgelaufen (HTTP {s})|Neuen Token anlegen (docs/agent-setup.md, Abschnitt 2)")
if s == 200:
    for path, label, hint in [(f"/repos/{repo}", "Repository", "Token auf das Repository m.oach beschränken, Resource owner Norddeutsche-Coder, ggf. Freigabe durch Admin"),
                              (f"/repos/{repo}/pulls?per_page=1", "Pull Requests", "Recht Pull requests: Read and write"),
                              (f"/repos/{repo}/actions/runs?per_page=1", "Actions", "Recht Actions: Read-only")]:
        c, _ = get(path)
        print(f"OK Zugriff auf {label}" if c == 200 else f"FAIL Kein Zugriff auf {label} (HTTP {c})|{hint}")
PY
else info "übersprungen (Token fehlt)"; fi | while IFS= read -r line; do
  case "$line" in
    OK\ *) ok "${line#OK }" ;;
    FAIL\ *) msg=${line#FAIL }; bad "${msg%%|*}" "${msg#*|}"; echo "__FAIL__" >> "${TMPDIR:-/tmp}/agent-setup-fails.$$" ;;
    *) echo "$line" ;;
  esac
done
plugins="$HOME/.claude/plugins/installed_plugins.json"
if [ -f "$plugins" ] && grep -q '"github@' "$plugins"; then ok "GitHub-Plugin für Claude Code installiert"
else bad "GitHub-Plugin für Claude Code nicht gefunden" "In Claude Code /plugin aufrufen und github installieren"; fi

section "Projekt"
root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
if [ -f "$root/.mcp.json" ] && grep -q '"taiga"' "$root/.mcp.json"; then ok ".mcp.json enthält den Taiga-Server"
else bad ".mcp.json mit Taiga-Server fehlt" "Repository aktualisieren (git pull)"; fi
[ -f "$root/AGENTS.md" ] && ok "AGENTS.md vorhanden" || bad "AGENTS.md fehlt"

# Fehler aus den Unterprozessen (Pipes) einsammeln
f="${TMPDIR:-/tmp}/agent-setup-fails.$$"
if [ -f "$f" ]; then fails=$((fails + $(wc -l < "$f"))); rm -f "$f"; fi

printf '\n'
if [ "$fails" -eq 0 ]; then
  printf '\033[32mAlles eingerichtet.\033[0m In Claude Code mit /mcp prüfen, dass github und taiga verbunden sind.\n'
else
  printf '\033[31m%s Problem(e) gefunden.\033[0m Details in docs/agent-setup.md.\n' "$fails"
  printf 'Hinweis: Nach Änderungen an ~/.zshrc VS Code bzw. das Terminal komplett neu starten.\n'
  exit 1
fi
