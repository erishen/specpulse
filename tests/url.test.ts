import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeUrl } from '../preview/src/url.js';

test('sanitizeUrl keeps safe URL schemes', () => {
  assert.equal(sanitizeUrl('https://example.com/a.png'), 'https://example.com/a.png');
  assert.equal(sanitizeUrl('http://example.com'), 'http://example.com');
  assert.equal(sanitizeUrl('blob:https://example.com/uuid'), 'blob:https://example.com/uuid');
  assert.equal(sanitizeUrl('data:image/png;base64,AAA='), 'data:image/png;base64,AAA=');
  assert.equal(sanitizeUrl('#section'), '#section');
  assert.equal(sanitizeUrl('/pages/home.json'), '/pages/home.json');
  assert.equal(sanitizeUrl('../img/a.png'), '../img/a.png');
});

test('sanitizeUrl blocks script injection schemes', () => {
  assert.equal(sanitizeUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeUrl('JaVaScRiPt:alert(1)'), '');
  assert.equal(sanitizeUrl('data:text/html,<script>x</script>'), '');
  assert.equal(sanitizeUrl('vbscript:msgbox(1)'), '');
  assert.equal(sanitizeUrl('file:///etc/passwd'), '');
});

test('sanitizeUrl trims and rejects junk', () => {
  assert.equal(sanitizeUrl('  https://ok.com  '), 'https://ok.com');
  assert.equal(sanitizeUrl('javascript:alert(1)\nhttps://ok.com'), '');
  assert.equal(sanitizeUrl(''), '');
  assert.equal(sanitizeUrl(undefined as unknown as string), '');
});