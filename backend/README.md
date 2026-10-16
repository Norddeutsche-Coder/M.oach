# Backend – Supabase

Dieser Ordner enthält künftig das versionierte Supabase-Backend:

```text
backend/
  supabase/
    config.toml    # lokale Supabase-Konfiguration
    migrations/    # SQL-Schema und Row Level Security
    functions/     # Edge Functions
    seed.sql       # ausschließlich lokale Testdaten
```

Die Supabase-CLI wird aus `backend/` ausgeführt. Die gezeigten Dateien werden erst beim Einrichten des lokalen Backends angelegt.

Zuerst müssen Schema, Auth-Konfiguration, RLS-Regeln und Edge Functions des bestehenden Projekts erfasst werden. Die bisherige App unter `frontend/legacy-app/` enthält bereits Supabase-Zugriffe, aber das Repository enthält bisher keine Backend-Implementierung. Aus Client-Code allein lässt sich das bestehende Schema nicht zuverlässig rekonstruieren.

Dieser Schritt legt nur die Verzeichnisgrenze fest. Es werden keine Migrationen auf das bestehende Projekt angewendet.
