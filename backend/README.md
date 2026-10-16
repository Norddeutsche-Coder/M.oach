# Backend – Supabase

Dieser Ordner enthält künftig das versionierte Supabase-Backend. Beim Einrichten des lokalen Backends kommen die lokale Supabase-Konfiguration, SQL-Migrationen mit Row Level Security, Edge Functions und ausschließlich lokale Testdaten hinzu. Die Supabase-CLI wird dann aus `backend/` ausgeführt.

Zuerst müssen Schema, Auth-Konfiguration, RLS-Regeln und Edge Functions des bestehenden Projekts erfasst werden. Die bisherige App unter `frontend/legacy-app/` enthält bereits Supabase-Zugriffe, aber das Repository enthält bisher keine Backend-Implementierung. Aus Client-Code allein lässt sich das bestehende Schema nicht zuverlässig rekonstruieren.

Dieser Schritt legt nur die Verzeichnisgrenze fest. Es werden keine Migrationen auf das bestehende Projekt angewendet.
