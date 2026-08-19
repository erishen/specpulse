import type { UINode, UISpec } from '../spec/types.js';
import { SUPPORTED_3D_TYPES, SUPPORTED_SHADCN_TYPES, SUPPORTED_TYPES } from '../spec/types.js';

const BASE_TYPES = SUPPORTED_TYPES.filter(
  (t) => !SUPPORTED_3D_TYPES.includes(t) && !SUPPORTED_SHADCN_TYPES.includes(t),
);
const UI_IMPORTS = BASE_TYPES.join(', ');
const UI3D_IMPORTS = [...SUPPORTED_3D_TYPES].join(', ');
const SHADCN_IMPORTS = [...SUPPORTED_SHADCN_TYPES].join(', ');

function childNodes(node: UINode): UINode[] {
  return node.children ?? [];
}

/** Walk a children array and group Heading + adjacent Buttons into Hero nodes. */
function groupHeroChildren(children: UINode[]): UINode[] {
  const result: UINode[] = [];
  let i = 0;
  while (i < children.length) {
    const node = children[i];
    if (node.type === 'Heading') {
      const buttons: UINode[] = [];
      let j = i + 1;
      while (j < children.length && children[j].type === 'Button') {
        buttons.push(children[j]);
        j++;
      }
      if (buttons.length > 0) {
        result.push({
          type: 'Hero',
          props: { text: node.props?.text ?? '', level: node.props?.level ?? 1 },
          children: buttons,
        });
        i = j;
        continue;
      }
    }
    result.push(groupHeroesInNode(node));
    i++;
  }
  return result;
}

/** Recursively apply Hero grouping to a single node and its descendants. */
function groupHeroesInNode(node: UINode): UINode {
  const children = node.children;
  if (!children || children.length === 0) return node;
  return { ...node, children: groupHeroChildren(children).map(groupHeroesInNode) };
}

/** Apply Hero grouping to an entire spec. */
function groupHeroes(spec: UISpec): UISpec {
  return { ...spec, root: groupHeroesInNode(spec.root) };
}

function textProp(props: Record<string, unknown>, key: string, fallback = ''): string {
  const value = props[key];
  return typeof value === 'string' ? value : fallback;
}

/** Props whose values are URLs and must be whitelisted at compile time. */
const URL_PROPS = new Set(['href', 'src']);

/** Allow http(s), data:image/*, blob:, in-page anchors and relative paths. */
function sanitizeUrl(value: string): string {
  const v = value.trim();
  if (/^https?:/i.test(v)) return v;
  if (/^blob:/i.test(v)) return v;
  if (/^data:image\//i.test(v)) return v;
  if (v.startsWith('#')) return v;
  if (/^\.{0,2}\//.test(v)) return v;
  return '';
}

/** Escape an attribute value so a crafted prop can't break out of JSX. */
function escAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Escape JSX text content (list items) so a crafted string can't inject markup. */
function escText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderProps(props: Record<string, unknown>): string {
  return Object.entries(props)
    .filter(([key]) => key !== 'children')
    .map(([key, value]) => {
      if (typeof value === 'boolean') return `${key}={${value}}`;
      if (Array.isArray(value)) return `${key}={${JSON.stringify(value)}}`;
      let str = String(value);
      if (URL_PROPS.has(key)) {
        str = sanitizeUrl(str);
        if (!str) return null; // drop unsafe URLs entirely
      }
      return `${key}="${escAttr(str)}"`;
    })
    .filter((entry): entry is string => entry !== null)
    .join(' ');
}

function renderList(node: UINode, depth: number): string {
  const indent = '  '.repeat(depth);
  const props = node.props ?? {};
  const items = Array.isArray(props.items) ? props.items.map(String) : [];
  const ordered = props.ordered === true;
  const rows = items.map((item) => `${indent}    <li>${escText(item)}</li>`).join('\n');
  return `${indent}<List ordered={${ordered}}>\n${rows}\n${indent}</List>`;
}

function renderNode(node: UINode, depth: number): string {
  if (node.type === 'List') return renderList(node, depth);

  const indent = '  '.repeat(depth);
  const props = node.props ?? {};
  const children = childNodes(node);

  const inline =
    children.length === 0
      ? `<${node.type} ${renderProps(props).trimEnd()}/>`
      : `<${node.type} ${renderProps(props).trimEnd()}>\n${renderChildren(children, depth + 1)}${indent}</${node.type}>`;

  return `${indent}${inline}`;
}

function renderChildren(children: UINode[], depth: number): string {
  return children.map((child) => `${renderNode(child, depth)}\n`).join('');
}

function containsAny3D(node: UINode): boolean {
  if (SUPPORTED_3D_TYPES.includes(node.type)) return true;
  return childNodes(node).some(containsAny3D);
}

function containsAnyShadcn(node: UINode): boolean {
  if (SUPPORTED_SHADCN_TYPES.includes(node.type)) return true;
  return childNodes(node).some(containsAnyShadcn);
}

export function specToComponent(spec: UISpec): string {
  const grouped = groupHeroes(spec);
  const title = textProp(grouped.root.props ?? {}, 'title', grouped.title);
  const body = renderNode(grouped.root, 1);
  const lines = [
    `import { ${UI_IMPORTS} } from './ui.js';`,
  ];
  if (containsAny3D(grouped.root)) {
    lines.push(`import { ${UI3D_IMPORTS} } from './ui3d.js';`);
  }
  if (containsAnyShadcn(grouped.root)) {
    lines.push(`import { ${SHADCN_IMPORTS} } from './uiShadcn.js';`);
  }
  const header = lines.join('\n');
  return `${header}

export default function App() {
  return (
${body}
  );
}

export const pageTitle = ${JSON.stringify(title)};
`;
}

export { renderNode, renderProps };
