// Public browser configuration only. The existing project's RLS remains authoritative.
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://vlzuaoyhxfqtdbncmfvu.supabase.co',
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_jaZO9LSAJschiXT3BLmdRg_8yFDebaY',
}
