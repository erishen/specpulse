import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPPORTED_TYPES, SUPPORTED_3D_TYPES } from '../src/spec/types.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

interface Catalog {
  categories: { name: string; components: { type: string }[] }[];
}

const catalog = JSON.parse(
  readFileSync(join(root, 'src', 'spec', 'catalog.json'), 'utf8'),
) as Catalog;

test('catalog.json covers exactly the supported types (no drift)', () => {
  const catalogTypes = catalog.categories.flatMap((c) => c.components.map((cc) => cc.type)).sort();
  const supported = [...SUPPORTED_TYPES].sort();
  assert.deepEqual(catalogTypes, supported);
});

test('catalog.json documents every 3D type as a separate group', () => {
  const threeDGroup = catalog.categories.find((c) => c.name.includes('3D'));
  assert.ok(threeDGroup, 'expected a 3D category');
  const types = threeDGroup.components.map((c) => c.type).sort();
  assert.deepEqual(types, [...SUPPORTED_3D_TYPES].sort());
});
