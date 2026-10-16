import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

const output = fileURLToPath(new URL('../dist/', import.meta.url))
async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(entry => entry.isDirectory()
    ? collect(join(directory, entry.name)) : [join(directory, entry.name)]))
  return files.flat()
}
const paths = (await collect(output)).filter(path => relative(output, path) !== 'sw.js').sort()
const template = await readFile(new URL('../src/sw/service-worker.js', import.meta.url), 'utf8')
const hash = createHash('sha256').update(template)
for (const path of paths) { hash.update(relative(output, path)); hash.update(await readFile(path)) }
const files = paths.map(path => relative(output, path).split('\\').join('/'))
const worker = template.replace('__BUILD_VERSION__', JSON.stringify(hash.digest('hex').slice(0, 16)))
  .replace('__PRECACHE_FILES__', JSON.stringify(files))
await writeFile(join(output, 'sw.js'), worker)
console.log(`Service worker generated for ${files.length} build files.`)
