// Mirrors the agent skills from .agents/skills (source, read by Codex) to
// .claude/skills (generated copy, read by Claude Code). Plain copies instead of
// symlinks, so the skills work on Windows without developer mode.
//
// Usage: node scripts/sync-skills.mjs          copy .agents/skills to .claude/skills
//        node scripts/sync-skills.mjs --check  exit 1 if the copy is out of date
import { cpSync, existsSync, lstatSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, '.agents', 'skills')
const target = join(root, '.claude', 'skills')

// Relative paths of all entries; symlinks are listed, not followed, so a
// leftover link counts as a difference.
function list(dir, base = dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    const stat = lstatSync(path)
    const rel = relative(base, path).split('\\').join('/')
    if (stat.isSymbolicLink()) return [`${rel} (symlink)`]
    return stat.isDirectory() ? list(path, base) : [rel]
  })
}

function differences() {
  const a = list(source)
  const b = list(target)
  const out = []
  for (const rel of a) {
    if (!b.includes(rel)) out.push(`missing in .claude/skills: ${rel}`)
    else if (!readFileSync(join(source, rel)).equals(readFileSync(join(target, rel))))
      out.push(`differs: ${rel}`)
  }
  for (const rel of b) if (!a.includes(rel)) out.push(`only in .claude/skills: ${rel}`)
  return out
}

if (process.argv.includes('--check')) {
  const diff = differences()
  if (diff.length) {
    console.error(diff.join('\n'))
    console.error('\n.claude/skills is out of date. Edit skills only in .agents/skills, then run:')
    console.error('  node scripts/sync-skills.mjs')
    process.exit(1)
  }
  console.log('.claude/skills matches .agents/skills')
} else {
  rmSync(target, { recursive: true, force: true })
  cpSync(source, target, { recursive: true })
  console.log('Copied .agents/skills to .claude/skills')
}
