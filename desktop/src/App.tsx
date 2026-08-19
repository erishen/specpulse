import PreviewPane from './PreviewPane';
import Sidebar from './components/Sidebar';
import PreviewBar from './components/PreviewBar';
import SettingsModal from './components/SettingsModal';
import { useConsoleState } from './hooks/useConsoleState';

export default function App() {
  const s = useConsoleState();

  return (
    <div className="console">
      <Sidebar s={s} />

      <main className="preview-pane">
        <PreviewBar
          pageTitle={s.pageTitle}
          previewMode={s.previewMode}
          currentId={s.currentId}
          busy={s.busy}
          exporting={s.exporting}
          editMode={s.editMode}
          env={s.env}
          onMode={s.setPreviewMode}
          onEdit={s.toggleEditMode}
          onExport={() => s.currentId && s.exportPage(s.currentId)}
        />
        <PreviewPane token={s.token} mode={s.previewMode} id={s.currentId} spec={s.editSpec} editMode={s.editMode} />
      </main>

      <SettingsModal
        env={s.env}
        open={s.showSettings}
        onClose={() => s.setShowSettings(false)}
        onEnvSaved={(env) => {
          s.setEnv(env);
          s.setShowSettings(false);
        }}
        onError={(msg) => s.setError(msg)}
      />
    </div>
  );
}