import { useEffect, useState, type ComponentType } from 'react';
import * as UI from './ui.js';
import * as UI3D from './ui3d.js';
import * as UIShadcn from './uiShadcn.js';
import type { UINode, UISpec } from './types.js';
import './editor.css';

const COMPONENTS: Record<string, ComponentType<any>> = {
  ...Object.fromEntries(Object.entries(UI).map(([name, c]) => [name, c as ComponentType<any>])),
  ...Object.fromEntries(Object.entries(UI3D).map(([name, c]) => [name, c as ComponentType<any>])),
  ...Object.fromEntries(Object.entries(UIShadcn).map(([name, c]) => [name, c as ComponentType<any>])),
};

type Path = number[];

function cloneNode(node: UINode): UINode {
  return {
    type: node.type,
    props: node.props ? { ...node.props } : undefined,
    children: node.children ? node.children.map(cloneNode) : undefined,
  };
}

function cloneSpec(spec: UISpec): UISpec {
  return { title: spec.title, root: cloneNode(spec.root) };
}

function walk(root: UINode, path: Path): UINode {
  let cur = root;
  for (const i of path) {
    const next = cur.children?.[i];
    if (!next) throw new Error('invalid path');
    cur = next;
  }
  return cur;
}

function getAt(root: UINode, path: Path): UINode | null {
  try {
    return walk(root, path);
  } catch {
    return null;
  }
}

function updateProps(spec: UISpec, path: Path, patch: Record<string, unknown>): UISpec {
  const newRoot = cloneNode(spec.root);
  const target = path.length === 0 ? newRoot : walk(newRoot, path);
  target.props = { ...(target.props ?? {}), ...patch };
  return { ...spec, root: newRoot };
}

function mutateChildren(spec: UISpec, path: Path, fn: (arr: UINode[]) => void): UISpec {
  const newRoot = cloneNode(spec.root);
  const target = path.length === 0 ? newRoot : walk(newRoot, path);
  target.children = target.children ?? [];
  fn(target.children);
  return { ...spec, root: newRoot };
}

/* ─── Field model for the inspector ─────────────────────────────── */

interface FieldDef {
  key: string;
  label: string;
  kind?: 'text' | 'number' | 'select' | 'bool' | 'list' | 'rows' | 'textarea' | 'json';
  options?: string[];
}

const F = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({
  key,
  label,
  kind: 'text',
  ...extra,
});

const FIELD_SETS: Record<string, FieldDef[]> = {
  Page: [
    F('title', '记录标题（不进页面，保存后用于命名记录）'),
    F('theme', '主题', { kind: 'select', options: ['light', 'dark', 'midnight', 'aurora'] }),
  ],
  Navbar: [F('brand', '品牌名称')],
  Heading: [F('text', '文本'), F('level', '级别', { kind: 'select', options: ['1', '2', '3'] })],
  Hero: [F('text', '标题'), F('level', '级别', { kind: 'select', options: ['1', '2', '3'] })],
  Paragraph: [F('text', '文本')],
  Button: [
    F('label', '按钮文字'),
    F('variant', '样式', { kind: 'select', options: ['primary', 'secondary', 'danger'] }),
  ],
  Badge: [
    F('text', '文字'),
    F('tone', '色调', { kind: 'select', options: ['success', 'warning', 'danger', 'info'] }),
  ],
  Card: [F('title', '标题'), F('width', '宽度')],
  Link: [F('text', '文字'), F('href', '链接')],
  Input: [
    F('label', '标签'),
    F('placeholder', '占位符'),
    F('defaultValue', '默认值'),
    F('type', '类型', { kind: 'select', options: ['text', 'password', 'number', 'email', 'tel'] }),
  ],
  Textarea: [F('label', '标签'), F('placeholder', '占位符'), F('rows', '行数', { kind: 'number' })],
  Stat: [
    F('label', '标签'),
    F('value', '数值'),
    F('unit', '单位'),
    F('tone', '色调', { kind: 'select', options: ['success', 'warning', 'danger', 'info'] }),
  ],
  List: [F('items', '项目（逗号分隔）', { kind: 'list' }), F('ordered', '有序列表', { kind: 'bool' })],
  Image: [F('src', '图片地址'), F('alt', '替代文本'), F('width', '宽度'), F('height', '高度'), F('radius', '圆角')],
  Avatar: [F('name', '姓名'), F('src', '图片地址'), F('size', '尺寸')],
  Alert: [
    F('text', '文本'),
    F('tone', '色调', { kind: 'select', options: ['success', 'warning', 'danger', 'info'] }),
  ],
  Progress: [
    F('label', '标签'),
    F('value', '进度 (0-100)', { kind: 'number' }),
    F('tone', '色调', { kind: 'select', options: ['success', 'warning', 'danger', 'info'] }),
  ],
  Quote: [F('text', '引用内容'), F('author', '作者')],
  CodeBlock: [F('code', '代码', { kind: 'textarea' })],
  Steps: [F('items', '步骤（逗号分隔）', { kind: 'list' })],
  Timeline: [F('items', '节点（逗号分隔）', { kind: 'list' })],
  Table: [
    F('headers', '表头（逗号分隔）', { kind: 'list' }),
    F('rows', '数据行（每行单元格用逗号分隔）', { kind: 'rows' }),
  ],
  Checkbox: [F('label', '文字'), F('checked', '选中', { kind: 'bool' })],
  Select: [
    F('label', '标签'),
    F('options', '选项（逗号分隔）', { kind: 'list' }),
    F('defaultValue', '默认值'),
  ],
  Form: [F('onSubmitLabel', '提交按钮文字'), F('width', '宽度')],
  Row: [
    F('gap', '间距'),
    F('align', '对齐', { kind: 'select', options: ['stretch', 'center', 'start', 'end'] }),
    F('justify', '水平对齐', { kind: 'select', options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'] }),
    F('wrap', '换行', { kind: 'bool' }),
    F('width', '宽度'),
  ],
  Grid: [F('cols', '列数', { kind: 'number' }), F('gap', '间距'), F('width', '宽度')],
  Footer: [F('text', '文字')],
  Scene3D: [F('background', '背景色'), F('height', '高度'), F('camera', '相机位置')],
  Box3D: [F('position', '位置'), F('size', '尺寸'), F('rotation', '旋转'), F('color', '颜色')],
  Sphere3D: [F('position', '位置'), F('radius', '半径', { kind: 'number' }), F('color', '颜色')],
  Torus3D: [
    F('position', '位置'),
    F('radius', '半径', { kind: 'number' }),
    F('tube', '管径', { kind: 'number' }),
    F('rotation', '旋转'),
    F('color', '颜色'),
  ],
  Plane3D: [F('position', '位置'), F('size', '尺寸'), F('color', '颜色')],
  Cylinder3D: [
    F('position', '位置'),
    F('radius', '半径', { kind: 'number' }),
    F('height', '高度', { kind: 'number' }),
    F('color', '颜色'),
  ],
  Cone3D: [
    F('position', '位置'),
    F('radius', '半径', { kind: 'number' }),
    F('height', '高度', { kind: 'number' }),
    F('color', '颜色'),
  ],
  Icosahedron3D: [F('position', '位置'), F('radius', '半径', { kind: 'number' }), F('color', '颜色')],
  TorusKnot3D: [
    F('position', '位置'),
    F('radius', '半径', { kind: 'number' }),
    F('tube', '管径', { kind: 'number' }),
    F('color', '颜色'),
  ],
  SDialog: [F('trigger', '触发按钮'), F('title', '标题'), F('description', '描述'), F('content', '内容', { kind: 'textarea' })],
  STabs: [F('labels', '标签（逗号分隔）', { kind: 'list' }), F('contents', '内容（逗号分隔）', { kind: 'list' })],
  SSwitch: [F('label', '标签'), F('checked', '默认选中', { kind: 'bool' })],
  SSkeleton: [F('width', '宽度'), F('height', '高度'), F('radius', '圆角')],
  STooltip: [F('trigger', '触发元素'), F('content', '提示内容')],
  SDropdownMenu: [F('trigger', '触发按钮'), F('items', '菜单项（逗号分隔）', { kind: 'list' })],
  SSheet: [F('trigger', '触发按钮'), F('title', '标题'), F('content', '内容', { kind: 'textarea' })],
  SToast: [F('trigger', '触发按钮'), F('text', '通知文案'), F('tone', '色调', { kind: 'select', options: ['default', 'success', 'warning', 'danger'] })],
  SAccordion: [
    F('items', '标题（逗号分隔）', { kind: 'list' }),
    F('contents', '内容（逗号分隔）', { kind: 'list' }),
    F('collapsible', '可折叠', { kind: 'bool' }),
    F('type', '模式', { kind: 'select', options: ['single', 'multiple'] }),
  ],
  SAvatar: [F('src', '图片地址'), F('name', '姓名'), F('size', '尺寸')],
  SProgress: [F('value', '进度 (0-100)', { kind: 'number' }), F('label', '标签'), F('tone', '色调', { kind: 'select', options: ['default', 'success', 'warning', 'danger'] })],
  SSeparator: [F('orientation', '方向', { kind: 'select', options: ['horizontal', 'vertical'] }), F('label', '标签')],
  SCheckbox: [F('label', '文字'), F('checked', '选中', { kind: 'bool' })],
  SSelect: [
    F('label', '标签'),
    F('placeholder', '占位符'),
    F('defaultValue', '默认值'),
    F('options', '选项（逗号分隔）', { kind: 'list' }),
  ],
  SToggle: [F('label', '文字'), F('variant', '样式', { kind: 'select', options: ['default', 'outline'] }), F('pressed', '按下', { kind: 'bool' })],
  SLabel: [F('text', '文字'), F('hint', '提示')],
  SRadioGroup: [F('label', '标签'), F('defaultValue', '默认值'), F('options', '选项（逗号分隔）', { kind: 'list' })],
  SSlider: [F('label', '标签'), F('min', '最小值', { kind: 'number' }), F('max', '最大值', { kind: 'number' }), F('step', '步长', { kind: 'number' }), F('value', '初始值', { kind: 'number' })],
  SPagination: [F('total', '总页数', { kind: 'number' })],
  SBreadcrumb: [F('separator', '分隔符'), F('items', '路径（逗号分隔）', { kind: 'list' })],
  SPopover: [F('trigger', '触发按钮'), F('title', '标题'), F('content', '内容', { kind: 'textarea' })],
  SContextMenu: [F('hint', '提示'), F('items', '菜单项（逗号分隔）', { kind: 'list' })],
  SInputOTP: [F('label', '标签'), F('length', '位数', { kind: 'number' })],
  SBadge: [F('text', '文字'), F('tone', '色调', { kind: 'select', options: ['default', 'secondary', 'success', 'warning', 'danger'] }), F('variant', '样式', { kind: 'select', options: ['filled', 'outline'] })],
};

const CHILD_PALETTE: Record<string, string[]> = {
  Page: ['Navbar', 'Hero', 'Heading', 'Paragraph', 'Card', 'Row', 'Grid', 'List', 'Divider', 'Footer', 'Scene3D'],
  Card: ['Heading', 'Paragraph', 'Button', 'Badge', 'List', 'Stat', 'Image', 'Table', 'Row', 'Grid', 'Divider'],
  Row: ['Button', 'Badge', 'Link', 'Stat', 'Avatar', 'Progress', 'Alert', 'Input', 'Checkbox'],
  Grid: ['Card', 'Stat', 'Badge'],
  Navbar: ['Link'],
  Hero: ['Button'],
  Form: ['Input', 'Textarea', 'Select', 'Checkbox'],
  Scene3D: ['Box3D', 'Sphere3D', 'Torus3D', 'Plane3D', 'Cylinder3D', 'Cone3D', 'Icosahedron3D', 'TorusKnot3D'],
  Footer: [],
};

const DEFAULT_NODE: Record<string, () => UINode> = {
  Heading: () => ({ type: 'Heading', props: { level: 2, text: '新标题' } }),
  Paragraph: () => ({ type: 'Paragraph', props: { text: '新段落文本，点击右侧可修改。' } }),
  Button: () => ({ type: 'Button', props: { label: '新按钮', variant: 'primary' } }),
  Badge: () => ({ type: 'Badge', props: { text: '新标签', tone: 'info' } }),
  Card: () => ({
    type: 'Card',
    props: { title: '新卡片' },
    children: [{ type: 'Paragraph', props: { text: '卡片内容' } }],
  }),
  Row: () => ({ type: 'Row', props: { gap: '16px' }, children: [] }),
  Grid: () => ({ type: 'Grid', props: { cols: 2, gap: '20px' }, children: [] }),
  Divider: () => ({ type: 'Divider' }),
  List: () => ({ type: 'List', props: { ordered: false, items: ['项目一', '项目二'] } }),
  Stat: () => ({ type: 'Stat', props: { label: '指标', value: '0' } }),
  Link: () => ({ type: 'Link', props: { href: '#', text: '链接' } }),
  Image: () => ({ type: 'Image', props: { src: 'https://picsum.photos/640/360' } }),
  Input: () => ({ type: 'Input', props: { label: '输入框', placeholder: '请输入' } }),
  Textarea: () => ({ type: 'Textarea', props: { label: '备注', placeholder: '请输入' } }),
  Select: () => ({ type: 'Select', props: { label: '选择', options: ['选项一', '选项二'] } }),
  Checkbox: () => ({ type: 'Checkbox', props: { label: '选项' } }),
  Table: () => ({
    type: 'Table',
    props: { headers: ['列一', '列二'], rows: [['A', 'B'], ['C', 'D']] },
  }),
  Navbar: () => ({
    type: 'Navbar',
    props: { brand: '品牌' },
    children: [{ type: 'Link', props: { href: '#', text: '首页' } }],
  }),
  Hero: () => ({
    type: 'Hero',
    props: { level: 1, text: '大标题' },
    children: [{ type: 'Button', props: { label: '按钮', variant: 'primary' } }],
  }),
  Footer: () => ({ type: 'Footer', props: { text: '© 2026' } }),
  Scene3D: () => ({
    type: 'Scene3D',
    props: { background: '#0f172a', height: '360px' },
    children: [{ type: 'Box3D', props: { color: '#3b82f6' } }],
  }),
  Box3D: () => ({ type: 'Box3D', props: { color: '#3b82f6' } }),
  Sphere3D: () => ({ type: 'Sphere3D', props: { color: '#22d3ee', radius: 1 } }),
  Torus3D: () => ({ type: 'Torus3D', props: { color: '#f59e0b', radius: 1, tube: 0.3 } }),
  Plane3D: () => ({ type: 'Plane3D', props: { color: '#334155' } }),
  Cylinder3D: () => ({ type: 'Cylinder3D', props: { color: '#f472b6', radius: 0.6, height: 1.6 } }),
  Cone3D: () => ({ type: 'Cone3D', props: { color: '#34d399', radius: 0.6, height: 1.6 } }),
  Icosahedron3D: () => ({ type: 'Icosahedron3D', props: { color: '#a78bfa', radius: 0.8 } }),
  TorusKnot3D: () => ({ type: 'TorusKnot3D', props: { color: '#fb7185', radius: 0.8, tube: 0.25 } }),
};

/* ─── Node tree (clickable, spec-driven) ────────────────────────── */

interface TreeCtx {
  selected: Path;
  hovered: Path | null;
  onSelect: (p: Path, node: UINode) => void;
  onHover: (p: Path | null) => void;
}

function describeText(node: UINode): string {
  const p = node.props ?? {};
  for (const k of ['text', 'label', 'title', 'brand', 'name', 'value']) {
    const v = p[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function isSelected(path: Path, selected: Path): boolean {
  if (path.length !== selected.length) return false;
  return path.every((v, i) => v === selected[i]);
}

function TreeNode({ node, path, ctx }: { node: UINode; path: Path; ctx: TreeCtx }) {
  const Component = COMPONENTS[node.type];
  if (!Component) return null;
  const children = (node.children ?? []).map((child, i) => (
    <TreeNode key={i} node={child} path={[...path, i]} ctx={ctx} />
  ));
  const el = Component
    ? (
        <Component {...node.props}>{children.length > 0 ? children : undefined}</Component>
      )
    : null;
  const selected = isSelected(path, ctx.selected);
  const hovered = ctx.hovered != null && isSelected(path, ctx.hovered);
  return (
    <span
      className={`editor-node${selected ? ' selected' : ''}${hovered ? ' hovered' : ''}`}
      data-path={path.join('.')}
      data-type={node.type}
      onClick={(e) => {
        e.stopPropagation();
        ctx.onSelect(path, node);
      }}
      onMouseEnter={() => ctx.onHover(path)}
      onMouseLeave={() => ctx.onHover(null)}
    >
      {el}
    </span>
  );
}

/* ─── Inspector field ───────────────────────────────────────────── */

function FieldEditor({
  field,
  node,
  onPatch,
}: {
  field: FieldDef;
  node: UINode;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const props = node.props ?? {};
  const [jsonDraft, setJsonDraft] = useState<string>(JSON.stringify(props, null, 2));

  useEffect(() => {
    setJsonDraft(JSON.stringify(props, null, 2));
  }, [node]);

  switch (field.kind) {
    case 'number':
      return (
        <input
          type="number"
          value={String(props[field.key] ?? 0)}
          onChange={(e) =>
            onPatch({ [field.key]: e.target.value === '' ? 0 : Number(e.target.value) })
          }
        />
      );
    case 'select':
      return (
        <select
          value={String(props[field.key] ?? field.options?.[0] ?? '')}
          onChange={(e) => onPatch({ [field.key]: e.target.value })}
        >
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case 'bool': {
      const v = props[field.key] === true || props[field.key] === 'true';
      return (
        <select value={v ? 'true' : 'false'} onChange={(e) => onPatch({ [field.key]: e.target.value === 'true' })}>
          <option value="true">是</option>
          <option value="false">否</option>
        </select>
      );
    }
    case 'list': {
      const value = Array.isArray(props[field.key]) ? (props[field.key] as unknown[]).join(', ') : '';
      return (
        <input
          value={value}
          onChange={(e) =>
            onPatch({
              [field.key]: e.target.value
                .split(/[,，]/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      );
    }
    case 'rows': {
      const rows = Array.isArray(props[field.key])
        ? (props[field.key] as unknown[][]).map((r) => r.map(String).join(', ')).join('\n')
        : '';
      return (
        <textarea
          value={rows}
          rows={4}
          onChange={(e) =>
            onPatch({
              [field.key]: e.target.value
                .split('\n')
                .map((line) =>
                  line
                    .split(/[,，]/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
                .filter((r) => r.length > 0),
            })
          }
        />
      );
    }
    case 'textarea':
      return (
        <textarea
          rows={4}
          value={String(props[field.key] ?? '')}
          onChange={(e) => onPatch({ [field.key]: e.target.value })}
        />
      );
    case 'json':
      return (
        <textarea
          rows={8}
          value={jsonDraft}
          onChange={(e) => setJsonDraft(e.target.value)}
          onBlur={() => {
            try {
              const parsed = JSON.parse(jsonDraft) as Record<string, unknown>;
              onPatch(parsed);
            } catch {
              setJsonDraft(JSON.stringify(props, null, 2));
            }
          }}
        />
      );
    default:
      return (
        <input
          value={String(props[field.key] ?? '')}
          onChange={(e) => onPatch({ [field.key]: e.target.value })}
        />
      );
  }
}

/* ─── Main editor ───────────────────────────────────────────────── */

export default function SpecEditor({
  spec,
  onSaved,
  onExit,
  onSelectRef,
}: {
  spec: UISpec;
  onSaved: (s: UISpec) => void;
  onExit: () => void;
  onSelectRef?: (info: { ref: string; type: string; text?: string } | null) => void;
}) {
  const [doc, setDoc] = useState<UISpec>(() => cloneSpec(spec));
  const [selected, setSelected] = useState<Path>([]);
  const [hovered, setHovered] = useState<Path | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);

  useEffect(() => {
    setDoc(cloneSpec(spec));
    setSelected([]);
    onSelectRef?.(null);
  }, [spec]);

  const selectedNode = getAt(doc.root, selected);
  const refLabel = selected.length === 0 ? 'root' : `#${selected.join('.')}`;
  const isRoot = selected.length === 0;
  const isLast = !isRoot && (() => {
    try {
      const parent = walk(doc.root, selected.slice(0, -1));
      return selected[selected.length - 1] >= (parent.children?.length ?? 0) - 1;
    } catch {
      return true;
    }
  })();

  function handleSelect(p: Path, node: UINode) {
    setSelected(p);
    const text = describeText(node);
    onSelectRef?.({ ref: `#${p.join('.')}`, type: node.type, text: text || undefined });
  }

  async function copyRef() {
    if (!selectedNode) return;
    try {
      await navigator.clipboard.writeText(refLabel);
    } catch {
      // Clipboard API may be blocked in a cross-origin iframe; fall back to
      // execCommand("copy") with a temporary selection.
      const ta = document.createElement('textarea');
      ta.value = refLabel;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopyFlash(true);
    setTimeout(() => setCopyFlash(false), 1200);
  }

  function patch(p: Record<string, unknown>) {
    setDoc((d) => updateProps(d, selected, p));
  }

  function removeNode() {
    if (selected.length === 0) return;
    setDoc((d) => mutateChildren(d, selected.slice(0, -1), (arr) => arr.splice(selected[selected.length - 1], 1)));
    setSelected(selected.slice(0, -1));
  }

  function duplicateNode() {
    if (selected.length === 0) return;
    const idx = selected[selected.length - 1];
    const node = getAt(doc.root, selected);
    if (!node) return;
    setDoc((d) => mutateChildren(d, selected.slice(0, -1), (arr) => arr.splice(idx + 1, 0, cloneNode(node))));
    setSelected([...selected.slice(0, -1), idx + 1]);
  }

  function move(dir: -1 | 1) {
    if (selected.length === 0) return;
    const idx = selected[selected.length - 1];
    const parentPath = selected.slice(0, -1);
    setDoc((d) =>
      mutateChildren(d, parentPath, (arr) => {
        const j = idx + dir;
        if (j < 0 || j >= arr.length) return;
        [arr[idx], arr[j]] = [arr[j], arr[idx]];
      }),
    );
    setSelected([...parentPath, idx + dir]);
  }

  function addChild(type: string) {
    setDoc((d) =>
      mutateChildren(d, selected, (arr) => arr.push(DEFAULT_NODE[type]?.() ?? { type, props: {} })),
    );
  }

  function save() {
    onSaved(cloneSpec(doc));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  }

  const fields = selectedNode ? (FIELD_SETS[selectedNode.type] ?? [{ key: 'props', label: 'props（JSON）', kind: 'json' }]) : [];
  const palette = selectedNode ? (CHILD_PALETTE[selectedNode.type] ?? []) : [];
  const childList = selectedNode?.children ?? [];

  return (
    <div className="editor-root">
      <div className="editor-toolbar">
        <span className="editor-mode-label">
          编辑模式 · 点击组件进行修改
          {selectedNode && (
            <>
              <button className="ref-chip" onClick={copyRef} title="复制引用号，可粘贴到「调整」输入框">
                {refLabel} <small>复制</small>
              </button>
              {copyFlash && <span className="copy-toast">已复制 {refLabel}</span>}
            </>
          )}
        </span>
        <button className="save-btn" onClick={save}>
          {savedFlash ? '已保存 ✓' : '保存'}
        </button>
        <button className="exit-btn" onClick={onExit}>
          完成编辑
        </button>
      </div>

      <TreeNode node={doc.root} path={[]} ctx={{ selected, hovered, onSelect: handleSelect, onHover: setHovered }} />

      {!inspectorOpen && (
        <button className="editor-inspector-toggle" onClick={() => setInspectorOpen(true)}>
          检查器 ▸
        </button>
      )}

      <div className={`editor-inspector${inspectorOpen ? '' : ' collapsed'}`}>
        {selectedNode ? (
          <>
            <div className="editor-inspector-header">
              <h3>
                {selectedNode.type}
                <span className="editor-type">#{selected.join('.') || 'root'}</span>
              </h3>
              <button className="editor-collapse-btn" onClick={() => setInspectorOpen(false)} title="收起检查器">
                ×
              </button>
            </div>
            {fields.map((f) => (
              <div className="editor-field" key={f.key}>
                <label>{f.label}</label>
                <FieldEditor field={f} node={selectedNode} onPatch={patch} />
              </div>
            ))}
            <div className="editor-actions">
              {!isRoot && (
                <>
                  <button onClick={() => setSelected(selected.slice(0, -1))}>选择父级</button>
                  <button onClick={move.bind(null, -1)}>上移</button>
                  <button onClick={move.bind(null, 1)} disabled={isLast}>下移</button>
                  <button onClick={duplicateNode}>复制</button>
                  <button className="danger" onClick={removeNode}>删除</button>
                </>
              )}
            </div>
            {childList.length > 0 && (
              <div className="editor-children">
                <label>子组件（点击选中，可深入 3D 场景）</label>
                <div className="editor-children-list">
                  {childList.map((child, i) => (
                    <button
                      key={i}
                      className="editor-child-item"
                      onClick={() => handleSelect([...selected, i], child)}
                    >
                      <span className="child-ref">#{[...selected, i].join('.')}</span>
                      {child.type}
                      {describeText(child) ? `「${describeText(child)}」` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {palette.length > 0 && (
              <div className="editor-palette">
                <label>添加子组件</label>
                <div className="palette-grid">
                  {palette.map((t) => (
                    <button key={t} onClick={() => addChild(t)}>
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="editor-empty">未选中组件 — 点击页面中的组件开始编辑</div>
        )}
      </div>
    </div>
  );
}