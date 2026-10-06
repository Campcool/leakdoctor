import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
test('process stylesheet excludes blocking base64 and retains all three original WebP images', () => {
  const css = readFileSync(new URL('assets/process-images.css', root), 'utf8');
  assert(Buffer.byteLength(css) < 1024);
  assert(!css.includes('data:'));
  const hashes = {
    aircon:'4f85bde81a344764fcb4a4897e0dd81878acaa6b29b7d20f32282ec76f2f2be0',
    washer:'7bcf65b4f9a4c77712f304e25ffba75f4b9fafd71ac4c135930d246db2b78024',
    leak:'229ba1501290d50ed86cb947812c9d5da4b329fe8ef9fb55d219fb3c42052cd3',
  };
  for (const [name, hash] of Object.entries(hashes)) {
    const file = readFileSync(new URL(`assets/process-media/${name}.webp`, root));
    assert.equal(createHash('sha256').update(file).digest('hex'), hash);
    assert(css.includes(`process-media/${name}.webp`));
  }
  for (const page of ['index.html','leak-repair.html']) {
    const html = readFileSync(new URL(page, root), 'utf8');
    assert(html.includes('process-images.css?v=20261006-external'));
    assert(html.includes('class="process-photo'));
  }
});
