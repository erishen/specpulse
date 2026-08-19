import React from 'react';
import ReactDOM from 'react-dom/client';
import { SpecRenderer } from './SpecRenderer';
import type { UISpec } from './types';
import './index.css';

declare global {
  interface Window {
    __UIAGENT_SPEC__?: UISpec;
  }
}

/** Prefer an external spec.json (edit it without rebuilding), fall back to the
 *  embedded copy baked in at export time. On file://, fetching a sibling file is
 *  CORS-blocked, so go straight to the embedded spec (no noisy console errors). */
async function loadSpec(): Promise<UISpec> {
  if (window.location.protocol !== 'file:') {
    const res = await fetch('./spec.json').catch(() => null);
    if (res && res.ok) return res.json();
  }
  if (window.__UIAGENT_SPEC__) return window.__UIAGENT_SPEC__;
  throw new Error('spec.json 未找到（请将本文件与 spec.json 一起部署）');
}

function DynamicPage() {
  const [state, setState] = React.useState<{ spec?: UISpec; error?: string }>({});
  const [retry, setRetry] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    loadSpec()
      .then((spec) => {
        if (!alive) return;
        document.title = spec.title || document.title;
        setState({ spec });
      })
      .catch((err) => {
        if (alive) setState({ error: err instanceof Error ? err.message : String(err) });
      });
    return () => {
      alive = false;
    };
  }, [retry]);

  if (state.error) {
    return (
      <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', color: '#b91c1c' }}>
        加载失败：{state.error}
        <button
          onClick={() => setRetry((n) => n + 1)}
          style={{ marginLeft: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
        >
          重试
        </button>
      </div>
    );
  }
  if (!state.spec) {
    return <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', color: '#6b7280' }}>加载中…</div>;
  }
  return <SpecRenderer spec={state.spec} />;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DynamicPage />
  </React.StrictMode>,
);
