import React from 'react';
import type { UISpec, UINode } from './types.js';
import * as UI from './ui.js';
import * as UI3D from './ui3d.js';
import * as UIShadcn from './uiShadcn.js';

/** Map of all available components by type name */
const COMPONENTS: Record<string, React.ComponentType<any>> = {
  ...Object.fromEntries(
    Object.entries(UI).map(([name, comp]) => [name, comp as React.ComponentType<any>]),
  ),
  ...Object.fromEntries(
    Object.entries(UI3D).map(([name, comp]) => [name, comp as React.ComponentType<any>]),
  ),
  ...Object.fromEntries(
    Object.entries(UIShadcn).map(([name, comp]) => [name, comp as React.ComponentType<any>]),
  ),
};

/** Render a single UINode to React element */
function renderNode(node: UINode, key: string | number): React.ReactElement | null {
  const Component = COMPONENTS[node.type];
  if (!Component) {
    console.warn(`[SpecRenderer] Unknown component type: ${node.type}`);
    return null;
  }

  const props: Record<string, unknown> = { ...node.props, key };

  // Render children recursively
  if (node.children && node.children.length > 0) {
    props.children = node.children.map((child: UINode, i: number) => renderNode(child, i));
  }

  return React.createElement(Component, props);
}

/** Props for SpecRenderer */
export interface SpecRendererProps {
  spec: UISpec;
  /** Optional wrapper component (defaults to React.Fragment) */
  wrapper?: React.ComponentType<any>;
}

/**
 * Dynamically render a UISpec at runtime.
 *
 * Usage:
 *   import spec from './pages/home.json';
 *   <SpecRenderer spec={spec} />
 *
 * Or with fetch:
 *   const spec = await fetch('/api/pages/home').then(r => r.json());
 *   <SpecRenderer spec={spec} />
 */
export function SpecRenderer({ spec, wrapper: Wrapper }: SpecRendererProps) {
  const content = renderNode(spec.root, 'root');

  if (Wrapper) {
    return <Wrapper>{content}</Wrapper>;
  }

  return <>{content}</>;
}

/**
 * Load a spec from a URL and render it.
 * Shows loading state while fetching.
 */
export function RemoteSpecRenderer({
  url,
  wrapper,
}: {
  url: string;
  wrapper?: React.ComponentType<any>;
}) {
  const [spec, setSpec] = React.useState<UISpec | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setSpec(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) return <div style={{ color: 'red', padding: 20 }}>Failed to load: {error}</div>;
  if (!spec) return <div style={{ padding: 20, color: '#666' }}>Loading...</div>;

  return <SpecRenderer spec={spec} wrapper={wrapper} />;
}

export default SpecRenderer;
