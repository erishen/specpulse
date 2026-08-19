import type { EnvInfo } from '../electron.d';

interface Props {
  pageTitle: string;
  previewMode: 'preview' | 'showcase';
  currentId: string;
  busy: boolean;
  exporting: boolean;
  editMode: boolean;
  env: EnvInfo | null;
  onMode: (mode: 'preview' | 'showcase') => void;
  onEdit: () => void;
  onExport: () => void;
}

export default function PreviewBar({
  pageTitle, previewMode, currentId, busy, exporting, editMode, env,
  onMode, onEdit, onExport,
}: Props) {
  return (
    <div className="preview-bar">
      <div className="preview-modes">
        <button
          className={`preview-mode${previewMode === 'preview' ? ' active' : ''}`}
          onClick={() => onMode('preview')}
        >
          预览
        </button>
        <button
          className={`preview-mode${previewMode === 'showcase' ? ' active' : ''}`}
          onClick={() => onMode('showcase')}
        >
          组件库
        </button>
      </div>
      <span className="preview-title">{pageTitle || '待生成'}</span>
      <div className="preview-actions">
        <button
          className={`edit-btn${editMode ? ' on' : ''}`}
          onClick={onEdit}
          disabled={!currentId || busy || previewMode !== 'preview'}
          title={currentId ? (editMode ? '退出页面编辑' : '进入编辑模式：直接在预览中点击组件修改') : '先生成一个或恢复一条记录'}
        >
          {editMode ? '完成编辑' : '编辑'}
        </button>
        <button
          className="export-btn"
          onClick={onExport}
          disabled={!currentId || busy || exporting}
          title={currentId ? '导出当前页面为单文件 HTML' : '先生成一个或恢复一条记录'}
        >
          {exporting ? '导出中…' : '导出'}
        </button>
        {env && (
          <button className="open-browser" onClick={() => window.specpulseApi.openExternal(env.previewUrl)}>
            浏览器打开
          </button>
        )}
      </div>
    </div>
  );
}