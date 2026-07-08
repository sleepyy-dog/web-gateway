import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));

test('SKILL.md is a thin gateway that delegates to OpenCLI and web-access', () => {
  const skill = read('SKILL.md');

  assert.match(skill, /opencli\/skills\/opencli-usage\/SKILL\.md/);
  assert.match(skill, /web-access\/SKILL\.md/);
  assert.match(skill, /GitHub/);
  assert.match(skill, /WebSearch、WebFetch、curl、Jina/);
  assert.doesNotMatch(skill, /\/screenshot|截图|视频帧采样/);
});

test('vendored OpenCLI and web-access contain their own skill entrypoints', () => {
  assert.equal(exists('opencli/skills/opencli-usage/SKILL.md'), true);
  assert.equal(exists('web-access/SKILL.md'), true);
});

test('web-access carries the CDP extension transport implementation', () => {
  assert.equal(exists('web-access/extension/manifest.json'), true);
  assert.equal(exists('web-access/scripts/check-cdp.mjs'), true);
  assert.equal(exists('web-access/scripts/cdp-extension-transport.mjs'), true);

  const webAccessSkill = read('web-access/SKILL.md');
  assert.match(webAccessSkill, /CDP extension transport/);
});
