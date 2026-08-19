import { useEffect, useRef, useState } from 'react';
import type { UISpec } from './electron.d';

interface Props {
  token: number;
  mode: 'preview' | 'showcase';
  id?: string;
  spec?: UISpec | null;
  editMode?: boolean;
}

function waitForServer(url: string, retries = 40): Promise<void> {
  return new Promise((resolve) => {
    const probe = async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) return resolve();
      } catch {
        /* server not up yet */
      }
      if (--retries <= 0) return resolve();
      setTimeout(probe, 250);
    };
    probe();
  });
}

export default function PreviewPane({ token, mode, id, spec, editMode }: Props) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [waiting, setWaiting] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function postState() {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      { source: 'specpulse-console', type: 'view', view: mode === 'showcase' ? 'showcase' : 'page' },
      '*',
    );
    win.postMessage(
      { source: 'specpulse-console', type: 'editor-state', id, spec, editMode: !!editMode },
      '*',
    );
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const env = await window.specpulseApi.getEnv();
      const url = `${env.previewUrl}/?t=${Date.now()}`;
      await waitForServer(url);
      if (!cancelled) {
        setPreviewUrl(url);
        setWaiting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    postState();
  }, [token, mode, id, spec, editMode]);

  return (
    <div className="preview-frame">
      {waiting && <div className="preview-loading">正在启动预览服务…</div>}
      {previewUrl && (
        <iframe
          ref={iframeRef}
          key={token}
          title="ui-preview"
          src={previewUrl}
          sandbox="allow-scripts allow-same-origin"
          allow="clipboard-write"
          onLoad={postState}
        />
      )}
    </div>
  );
}