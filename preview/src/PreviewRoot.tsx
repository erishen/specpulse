import { useEffect, useState } from 'react';
import App from './App.js';
import SpecEditor from './SpecEditor.js';
import { Showcase } from './showcase.js';
import type { UISpec } from './types.js';

interface EditorState {
  id: string;
  spec: UISpec;
}

/**
 * Renders the compiled App by default. When the console posts an
 * editor-state message (editMode on), switches to spec-driven editing;
 * a view message switches between the page and the component gallery
 * (组件库) without reloading the iframe.
 */
export default function PreviewRoot() {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [view, setView] = useState<'page' | 'showcase'>('page');

  useEffect(() => {
    const allowedOrigins = new Set([
      'http://localhost:5277',
      'http://127.0.0.1:5277',
      'null',
      'file://',
    ]);
    function onMessage(e: MessageEvent) {
      // Only trust the Electron console (dev :5277 or packaged file:// => 'null').
      if (!allowedOrigins.has(e.origin)) return;
      if (e.data?.source !== 'specpulse-console') return;
      const { type, id, spec, editMode, view: nextView } = e.data as {
        type?: string;
        id?: string;
        spec?: UISpec;
        editMode?: boolean;
        view?: 'page' | 'showcase';
      };
      if (type === 'view' && (nextView === 'page' || nextView === 'showcase')) {
        setView(nextView);
        return;
      }
      if (type !== 'editor-state') return;
      if (editMode && id && spec && spec.root) {
        setEditor({ id, spec });
      } else {
        setEditor(null);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (editor) {
    return (
      <SpecEditor
        key={editor.id}
        spec={editor.spec}
        onSaved={(spec) => {
          window.parent.postMessage({ source: 'specpulse-editor', action: 'save', id: editor.id, spec }, '*');
        }}
        onExit={() => {
          window.parent.postMessage({ source: 'specpulse-editor', action: 'exit' }, '*');
        }}
        onSelectRef={(info) => {
          window.parent.postMessage({ source: 'specpulse-editor', action: 'select', ...info }, '*');
        }}
      />
    );
  }

  if (view === 'showcase') {
    return <Showcase />;
  }

  return <App />;
}