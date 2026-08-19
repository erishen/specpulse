export type UIElementType =
  | 'Page'
  | 'Navbar'
  | 'Heading'
  | 'Hero'
  | 'Paragraph'
  | 'Button'
  | 'Input'
  | 'Textarea'
  | 'Card'
  | 'List'
  | 'Badge'
  | 'Divider'
  | 'Form'
  | 'Link'
  | 'Image'
  | 'Avatar'
  | 'Stat'
  | 'Progress'
  | 'Alert'
  | 'Table'
  | 'Checkbox'
  | 'Select'
  | 'Quote'
  | 'CodeBlock'
  | 'Steps'
  | 'Timeline'
  | 'Footer'
  | 'Row'
  | 'Grid'
  | 'Scene3D'
  | 'Box3D'
  | 'Sphere3D'
  | 'Torus3D'
  | 'Plane3D'
  | 'Cylinder3D'
  | 'Cone3D'
  | 'Icosahedron3D'
  | 'TorusKnot3D'
  | 'SDialog'
  | 'STabs'
  | 'SSwitch'
  | 'SSkeleton'
  | 'STooltip'
  | 'SDropdownMenu'
  | 'SSheet'
  | 'SToast'
  | 'SAccordion'
  | 'SAvatar'
  | 'SProgress'
  | 'SSeparator'
  | 'SCheckbox'
  | 'SSelect'
  | 'SToggle'
  | 'SLabel'
  | 'SRadioGroup'
  | 'SSlider'
  | 'SPagination'
  | 'SBreadcrumb'
  | 'SPopover'
  | 'SContextMenu'
  | 'SInputOTP'
  | 'SBadge';

export interface UINode {
  type: UIElementType;
  props?: Record<string, unknown>;
  children?: UINode[];
}

export interface UISpec {
  title: string;
  root: UINode;
}

export const SUPPORTED_TYPES: readonly UIElementType[] = [
  'Page',
  'Navbar',
  'Heading',
  'Hero',
  'Paragraph',
  'Button',
  'Input',
  'Textarea',
  'Card',
  'List',
  'Badge',
  'Divider',
  'Form',
  'Link',
  'Image',
  'Avatar',
  'Stat',
  'Progress',
  'Alert',
  'Table',
  'Checkbox',
  'Select',
  'Quote',
  'CodeBlock',
  'Steps',
  'Timeline',
  'Footer',
  'Row',
  'Grid',
  'Scene3D',
  'Box3D',
  'Sphere3D',
  'Torus3D',
  'Plane3D',
  'Cylinder3D',
  'Cone3D',
  'Icosahedron3D',
  'TorusKnot3D',
  'SDialog',
  'STabs',
  'SSwitch',
  'SSkeleton',
  'STooltip',
  'SDropdownMenu',
  'SSheet',
  'SToast',
  'SAccordion',
  'SAvatar',
  'SProgress',
  'SSeparator',
  'SCheckbox',
  'SSelect',
  'SToggle',
  'SLabel',
  'SRadioGroup',
  'SSlider',
  'SPagination',
  'SBreadcrumb',
  'SPopover',
  'SContextMenu',
  'SInputOTP',
  'SBadge',
];

export const SUPPORTED_3D_TYPES: readonly UIElementType[] = [
  'Scene3D',
  'Box3D',
  'Sphere3D',
  'Torus3D',
  'Plane3D',
  'Cylinder3D',
  'Cone3D',
  'Icosahedron3D',
  'TorusKnot3D',
];

export const SUPPORTED_SHADCN_TYPES: readonly UIElementType[] = [
  'SDialog',
  'STabs',
  'SSwitch',
  'SSkeleton',
  'STooltip',
  'SDropdownMenu',
  'SSheet',
  'SToast',
  'SAccordion',
  'SAvatar',
  'SProgress',
  'SSeparator',
  'SCheckbox',
  'SSelect',
  'SToggle',
  'SLabel',
  'SRadioGroup',
  'SSlider',
  'SPagination',
  'SBreadcrumb',
  'SPopover',
  'SContextMenu',
  'SInputOTP',
  'SBadge',
];

export function isUINode(value: unknown): value is UINode {
  if (typeof value !== 'object' || value === null) return false;
  const node = value as Record<string, unknown>;
  return typeof node.type === 'string' && SUPPORTED_TYPES.includes(node.type as UIElementType);
}

/** Recursively collect every element type present in a UISpec tree. */
export function collectTypes(spec: UISpec): Set<string> {
  const types = new Set<string>();
  function walk(node: UINode) {
    types.add(node.type);
    for (const child of node.children ?? []) walk(child);
  }
  walk(spec.root);
  return types;
}

/** Parse the "页面需要包含以下组件：X, Y, Z" prefix that the desktop console prepends. */
export function extractRequiredTypes(prompt: string): string[] {
  const m = prompt.match(/页面需要包含以下组件：([^\n]+)/);
  if (!m) return [];
  return m[1]
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Check that a spec contains all required types. Returns { ok, missing }. */
export function validateSpecTypes(
  spec: UISpec,
  required: string[],
): { ok: true; missing: [] } | { ok: false; missing: string[] } {
  if (required.length === 0) return { ok: true, missing: [] };
  const present = collectTypes(spec);
  const missing = required.filter((t) => !present.has(t));
  return missing.length === 0
    ? { ok: true, missing: [] }
    : { ok: false, missing };
}