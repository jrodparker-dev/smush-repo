import test from 'node:test';
import assert from 'node:assert/strict';

import {deepMerge, normalizeSourceText} from '../src/brain/dataMerge.js';

test('deepMerge overlays nested objects and replaces arrays', () => {
  const base = {
    pikachu: {types: ['Electric'], stats: {spe: 90, spa: 50}},
  };
  const override = {
    pikachu: {stats: {spa: 55}, abilities: ['Static', 'Lightning Rod']},
  };

  const merged = deepMerge(base, override);

  assert.deepEqual(merged, {
    pikachu: {
      types: ['Electric'],
      stats: {spe: 90, spa: 55},
      abilities: ['Static', 'Lightning Rod'],
    },
  });
});

test('normalizeSourceText unifies line endings and strips trailing whitespace', () => {
  const raw = 'line1  \r\nline2\t\r\n';
  const normalized = normalizeSourceText(raw);
  assert.equal(normalized, 'line1\nline2\n');
});
