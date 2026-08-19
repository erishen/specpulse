import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { specToComponent } from '../src/generator/reactGenerator.js';
import type { UISpec } from '../src/spec/types.js';
import { isUINode, collectTypes, extractRequiredTypes, validateSpecTypes } from '../src/spec/types.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('pricing fixture compiles to a React component', () => {
  const spec = JSON.parse(readFileSync(join(root, 'tests', 'fixtures', 'pricing.json'), 'utf-8')) as UISpec;
  const source = specToComponent(spec);
  assert.match(source, /import \{ Page, Navbar/);
  assert.match(source, /export default function App\(\)/);
  assert.match(source, /<Heading level="1" text="Simple pricing for every team"\/>/);
  assert.match(source, /<Button label="Get started" variant="primary"\/>/);
  assert.match(source, /<Badge text="\$29 \/ month" tone="success"\/>/);
  assert.match(source, /export const pageTitle = "Plans & Pricing"/);
});

test('isUINode validates supported types only', () => {
  assert.equal(isUINode({ type: 'Button' }), true);
  assert.equal(isUINode({ type: 'Canvas' }), false);
  assert.equal(isUINode('nope'), false);
  assert.equal(isUINode(null), false);
});

test('nested children are rendered with indentation', () => {
  const spec: UISpec = {
    title: 'Nested',
    root: {
      type: 'Page',
      props: { title: 'Nested' },
      children: [
        {
          type: 'Card',
          props: {},
          children: [
            { type: 'Button', props: { label: 'Go', variant: 'primary' } },
          ],
        },
      ],
    },
  };
  const source = specToComponent(spec);
  assert.match(source, /    <Card >\n      <Button label="Go" variant="primary"\/>\n    <\/Card>/);
});

test('3D spec injects the ui3d import and emits Scene3D shapes', () => {
  const spec = JSON.parse(
    readFileSync(join(root, 'tests', 'fixtures', 'threejs.json'), 'utf-8'),
  ) as UISpec;
  const source = specToComponent(spec);
  assert.match(
    source,
    /import \{ Scene3D, Box3D, Sphere3D, Torus3D, Plane3D, Cylinder3D, Cone3D, Icosahedron3D, TorusKnot3D \} from '.\/ui3d.js';/,
  );
  assert.match(source, /<Scene3D background="#0f172a" height="480px">/);
  assert.match(source, /<Sphere3D position="0,0.8,0" radius="0.8" color="#22d3ee"\/>/);
  assert.match(source, /<Plane3D position="0,-0.5,0" size="24,24,1" color="#1e293b"\/>/);
});

test('pure DOM spec does not pull in the 3D runtime', () => {
  const source = specToComponent({
    title: 'Plain',
    root: { type: 'Page', props: { title: 'Plain' } },
  });
  assert.doesNotMatch(source, /ui3d/);
});

test('extended components render arrays/booleans as JSX expressions', () => {
  const spec: UISpec = {
    title: 'Ext',
    root: {
      type: 'Page',
      props: { title: 'Ext' },
      children: [
        { type: 'Stat', props: { label: '收入', value: 128, unit: '万', tone: 'success' } },
        { type: 'Progress', props: { label: '进度', value: 75 } },
        {
          type: 'Table',
          props: { headers: ['日期', '收入'], rows: [['周一', '3000'], ['周二', '4500']] },
        },
        { type: 'Checkbox', props: { label: '同意', checked: true } },
        { type: 'Select', props: { label: '城市', options: ['北京', '上海'] } },
        { type: 'Steps', props: { items: ['注册', '完善', '提交'] } },
        { type: 'Timeline', props: { items: ['2022 入职', '2024 晋升'] } },
        { type: 'Quote', props: { text: '少即是多', author: '设计名言' } },
        { type: 'CodeBlock', props: { code: 'const a = 1', language: 'js' } },
        { type: 'Avatar', props: { name: 'Zhang San' } },
        { type: 'Image', props: { src: 'https://example.com/a.png', width: '100%' } },
        { type: 'Alert', props: { text: '注意', tone: 'warning' } },
        { type: 'Footer', props: { text: '© 2026' } },
        { type: 'Cylinder3D', props: { position: '0,1,0', radius: 0.5, height: 2, color: '#f472b6' } },
      ],
    },
  };
  const source = specToComponent(spec);
  assert.match(source, /import \{ Page, Navbar, Heading, Hero, Paragraph, Button, Input, Textarea, Card, List, Badge, Divider, Form, Link, Image, Avatar, Stat, Progress, Alert, Table, Checkbox, Select, Quote, CodeBlock, Steps, Timeline, Footer, Row, Grid \} from '.\/ui.js';/);
  assert.match(source, /import \{ Scene3D, Box3D, Sphere3D, Torus3D, Plane3D, Cylinder3D, Cone3D, Icosahedron3D, TorusKnot3D \} from '.\/ui3d.js';/);
  assert.match(source, /<Stat label="收入" value="128" unit="万" tone="success"\/>/);
  assert.match(source, /headers=\{\["日期","收入"\]\}/);
  assert.match(source, /rows=\{\[\["周一","3000"\],\["周二","4500"\]\]\}/);
  assert.match(source, /<Checkbox label="同意" checked=\{true\}\/>/);
  assert.match(source, /options=\{\["北京","上海"\]\}/);
  assert.match(source, /<Cylinder3D position="0,1,0" radius="0.5" height="2" color="#f472b6"\/>/);
});

test('generator groups Heading + Button into Hero', () => {
  const spec: UISpec = {
    title: 'Landing',
    root: {
      type: 'Page',
      props: { title: 'Landing' },
      children: [
        { type: 'Heading', props: { level: 1, text: 'Welcome' } },
        { type: 'Button', props: { label: 'Get started', variant: 'primary' } },
        { type: 'Button', props: { label: 'Learn more', variant: 'secondary' } },
        { type: 'Paragraph', props: { text: 'Some description' } },
      ],
    },
  };
  const source = specToComponent(spec);
  assert.match(source, /<Hero /);
  assert.match(source, /text="Welcome"/);
  assert.match(source, /<Button label="Get started" variant="primary"\/>/);
  assert.match(source, /<Button label="Learn more" variant="secondary"\/>/);
  assert.match(source, /<\/Hero>/);
  assert.match(source, /<Paragraph /);
});

test('generator passes a Page theme prop through to the component', () => {
  const spec: UISpec = {
    title: 'Dark landing',
    root: {
      type: 'Page',
      props: { title: 'Dark landing', theme: 'midnight' },
      children: [{ type: 'Heading', props: { level: 1, text: 'Hi' } }],
    },
  };
  const source = specToComponent(spec);
  assert.match(source, /<Page title="Dark landing" theme="midnight">/);
});

test('generator does not group Heading without following Buttons', () => {
  const spec: UISpec = {
    title: 'Simple',
    root: {
      type: 'Page',
      props: { title: 'Simple' },
      children: [
        { type: 'Heading', props: { level: 2, text: 'Title' } },
        { type: 'Paragraph', props: { text: 'Content' } },
      ],
    },
  };
  const source = specToComponent(spec);
  assert.doesNotMatch(source, /<Hero/);
  assert.match(source, /<Heading /);
});

test('collectTypes walks nested spec tree', () => {
  const spec: UISpec = {
    title: 'Test',
    root: {
      type: 'Page',
      children: [
        { type: 'Navbar', props: { brand: 'X' } },
        {
          type: 'Card',
          children: [
            { type: 'Heading', props: { text: 'Hi' } },
            { type: 'Button', props: { label: 'Go' } },
          ],
        },
      ],
    },
  };
  const types = collectTypes(spec);
  assert.deepEqual(types, new Set(['Page', 'Navbar', 'Card', 'Heading', 'Button']));
});

test('extractRequiredTypes parses Chinese prefix', () => {
  const prompt = '页面需要包含以下组件：Button, Card, Heading\n\n做一个登录页';
  assert.deepEqual(extractRequiredTypes(prompt), ['Button', 'Card', 'Heading']);
});

test('extractRequiredTypes handles Chinese commas', () => {
  const prompt = '页面需要包含以下组件：Button，Card\n\n内容';
  assert.deepEqual(extractRequiredTypes(prompt), ['Button', 'Card']);
});

test('extractRequiredTypes returns empty when no prefix', () => {
  assert.deepEqual(extractRequiredTypes('做一个登录页'), []);
});

test('validateSpecTypes returns ok when all required types present', () => {
  const spec: UISpec = {
    title: 'T',
    root: {
      type: 'Page',
      children: [
        { type: 'Button', props: { label: 'Go' } },
        { type: 'Card', children: [{ type: 'Heading', props: { text: 'Hi' } }] },
      ],
    },
  };
  const result = validateSpecTypes(spec, ['Button', 'Card', 'Heading']);
  assert.equal(result.ok, true);
});

test('validateSpecTypes returns missing types', () => {
  const spec: UISpec = {
    title: 'T',
    root: {
      type: 'Page',
      children: [{ type: 'Button', props: { label: 'Go' } }],
    },
  };
  const result = validateSpecTypes(spec, ['Button', 'Card', 'Table']);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.deepEqual(result.missing, ['Card', 'Table']);
  }
});

test('validateSpecTypes with empty required always passes', () => {
  const spec: UISpec = { title: 'T', root: { type: 'Page' } };
  const result = validateSpecTypes(spec, []);
  assert.equal(result.ok, true);
});

test('unsafe URL props are dropped at compile time', () => {
  const spec: UISpec = {
    title: 'T',
    root: {
      type: 'Page',
      children: [
        { type: 'Link', props: { text: 'evil', href: 'javascript:alert(1)' } },
        { type: 'Image', props: { src: 'data:text/html,<script>1</script>' } },
        { type: 'Link', props: { text: 'ok', href: 'https://example.com/a' } },
        { type: 'Link', props: { text: 'ok2', href: '#section' } },
      ],
    },
  };
  const source = specToComponent(spec);
  assert.doesNotMatch(source, /javascript:/);
  assert.doesNotMatch(source, /data:text\/html/);
  assert.match(source, /href="https:\/\/example.com\/a"/);
  assert.match(source, /href="#section"/);
});

test('crafted prop values cannot break out of JSX attributes', () => {
  const spec: UISpec = {
    title: 'T',
    root: {
      type: 'Page',
      children: [{ type: 'Button', props: { label: 'a" onMouseOver="x' } }],
    },
  };
  const source = specToComponent(spec);
  assert.doesNotMatch(source, / onMouseOver="/);
  assert.match(source, /label="a&quot; onMouseOver=&quot;x"/);
});
