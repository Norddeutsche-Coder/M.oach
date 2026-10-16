// Public browser configuration only. The existing project's RLS remains authoritative.
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
const missingMessage =
  'Supabase-Konfiguration fehlt. Lege für die lokale Entwicklung eine .env.local anhand von .env.example an.'

type SupabaseConfig = Readonly<{ url: string; key: string }>

export const supabaseConfig: SupabaseConfig =
  url && key
    ? { url, key }
    : {
        // The legacy adapter reads a valid moach_sb value before these fallbacks.
        get url(): string {
          throw new Error(missingMessage)
        },
        get key(): string {
          throw new Error(missingMessage)
        },
      }
