// Check the HTML that ships, not the source React/Next components.
import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import assert from 'node:assert/strict'

const root = resolve(process.argv[2] || '.')
const origin = `https://${readFileSync(join(root, 'CNAME'), 'utf8').trim()}`
const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8')
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
assert(urls.length > 0, 'Sitemap must have URLs')
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs')
const titles = new Set(), descriptions = new Set()
let pages = 0, schemas = 0
function localFile(url) {
  const path = decodeURIComponent(url.pathname).replace(/^\//, '')
  const direct = join(root, path || 'index.html')
  return url.pathname.endsWith('/') ? join(root, path, 'index.html') :
    statSync(direct, { throwIfNoEntry: false })?.isFile() ? direct : `${direct}.html`
}
function checkSchema(value) {
  if (Array.isArray(value)) return value.forEach(checkSchema)
  if (!value || typeof value !== 'object') return
  const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']]
  if (types.some(type => ['LocalBusiness', 'HomeAndConstructionBusiness', 'Organization'].includes(type))) {
    assert(!value.aggregateRating && !value.review, 'Self-serving business review markup')
  }
  for (const [key, content] of Object.entries(value)) {
    if (['url', 'item', 'image', 'thumbnailUrl', 'contentUrl'].includes(key) && typeof content === 'string' && content.startsWith(origin + '/')) {
      const url = new URL(content)
      assert(existsSync(localFile(url)), `JSON-LD points outside public artifact: ${content}`)
    }
    checkSchema(content)
  }
}
for (const href of urls) {
  const url = new URL(href)
  assert.equal(url.origin, origin, `Unexpected sitemap origin: ${href}`)
  assert(!url.search && !url.hash, `Sitemap contains a parameter or fragment: ${href}`)
  const file = localFile(url)
  assert(existsSync(file), `Sitemap points outside public artifact: ${href}`)
  if (!file.endsWith('.html')) continue
  pages++
  const html = readFileSync(file, 'utf8')
  const canonical = [...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/g)]
  assert.equal(canonical.length, 1, `${href}: canonical count`)
  assert.equal(new URL(canonical[0][1]).href, url.href, `${href}: canonical must match sitemap`)
  assert(!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*(noindex|nosnippet)/i.test(html), `${href}: index/snippet disabled`)
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]
  const description = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/)?.[1]
  assert(title && description, `${href}: missing title or description`)
  assert(!titles.has(title), `${href}: duplicate title`)
  assert(!descriptions.has(description), `${href}: duplicate description`)
  titles.add(title); descriptions.add(description)
  const body = html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '')
  assert.equal((body.match(/<h1\b/gi) || []).length, 1, `${href}: initial HTML needs one H1`)
  const og = html.match(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/)?.[1]
  if (og) assert.equal(new URL(og).href, url.href, `${href}: OG URL differs from canonical`)
  for (const block of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)) {
    schemas++
    checkSchema(JSON.parse(block[1]))
  }
}
console.log(`Search artifact: ${pages} HTML pages / ${urls.length} sitemap URLs / ${schemas} JSON-LD blocks; canonical, index/snippet, unique metadata and public schema targets passed`)
