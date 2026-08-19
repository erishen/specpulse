/**
 * Local type mirrors of the project's UISpec / UINode.
 * Kept in the preview so its tsconfig stays self-contained.
 */

export type UIElementType =
  | 'Page' | 'Navbar' | 'Heading' | 'Hero' | 'Paragraph' | 'Button'
  | 'Input' | 'Textarea' | 'Card' | 'List' | 'Badge' | 'Divider'
  | 'Form' | 'Link' | 'Image' | 'Avatar' | 'Stat' | 'Progress'
  | 'Alert' | 'Table' | 'Checkbox' | 'Select' | 'Quote' | 'CodeBlock'
  | 'Steps' | 'Timeline' | 'Footer' | 'Row' | 'Grid'
  | 'Scene3D' | 'Box3D' | 'Sphere3D' | 'Torus3D' | 'Plane3D'
  | 'Cylinder3D' | 'Cone3D' | 'Icosahedron3D' | 'TorusKnot3D'
  | 'SDialog' | 'STabs' | 'SSwitch' | 'SSkeleton' | 'STooltip'
  | 'SDropdownMenu' | 'SSheet' | 'SToast'
  | 'SAccordion' | 'SAvatar' | 'SProgress' | 'SSeparator'
  | 'SCheckbox' | 'SSelect' | 'SToggle' | 'SLabel'
  | 'SRadioGroup' | 'SSlider' | 'SPagination' | 'SBreadcrumb'
  | 'SPopover' | 'SContextMenu' | 'SInputOTP' | 'SBadge';

export interface UINode {
  type: UIElementType;
  props?: Record<string, unknown>;
  children?: UINode[];
}

export interface UISpec {
  title: string;
  root: UINode;
}
