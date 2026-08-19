import { TABS } from '../lib/consoleHelpers';
import type { ConsoleState } from '../hooks/useConsoleState';

export default function Sidebar({ s }: { s: ConsoleState }) {
  const {
    prompt, setPrompt, busy, error, currentId, activeRef,
    adjustInput, setAdjustInput,
    selectedComponents, setSelectedComponents,
    starters, refreshingStarters,
    activeTab, setActiveTab, generated, history,
    referenceImage, referencePreview, env,
    inputRef, fileInputRef,
    generate, generateFromReference, adjust, fill, refreshStarters,
    restore, deleteSaved, clearSaved, deleteHistory, clearHistory,
    exportPage, exporting, handleFileSelect, clearReference,
  } = s;

  return (
    <aside className="panel">
      <div className="panel-header">
        <h1>SpecPulse</h1>
        <div className="model-tags">
          <span className="model-tag">{env?.model ?? '…'}</span>
          {env?.visionModel && env.visionModel !== env.model && (
            <span className="model-tag vision">👁 {env.visionModel}</span>
          )}
          <button className="settings-btn" onClick={() => s.setShowSettings(true)} title="模型设置">
            ⚙
          </button>
        </div>
      </div>

      {selectedComponents.size > 0 && (
        <div className="component-chips">
          {Array.from(selectedComponents).map((type) => (
            <span key={type} className="component-chip">
              {type}
              <button
                className="chip-remove"
                onClick={() => setSelectedComponents((prev) => { const n = new Set(prev); n.delete(type); return n; })}
              >×</button>
            </span>
          ))}
        </div>
      )}

      {/* Reference image input */}
      <div className="reference-section">
        <div className="reference-header">
          <span className="reference-label">参考图（可选）</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            className="reference-upload"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            {referenceImage ? '更换图片' : '上传图片'}
          </button>
          {referenceImage && (
            <button className="reference-clear" onClick={clearReference} disabled={busy}>
              清除
            </button>
          )}
        </div>
        {referencePreview && (
          <div className="reference-preview">
            <img src={referencePreview} alt="参考图预览" />
          </div>
        )}
        {!referenceImage && (
          <div className="reference-hint">
            上传截图或设计稿，AI 会分析并生成类似的 UI
          </div>
        )}
      </div>

      <textarea
        ref={inputRef}
        className="prompt-input"
        placeholder={selectedComponents.size > 0 ? '补充描述（可选），或直接点生成' : '描述你想要的 UI，例如：做一个深色背景的产品展示页，带导航、hero 标题、3D 场景和 CTA 按钮'}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') generate();
        }}
      />

      {!env?.hasKey && (
        <div className="warn">未检测到 OPENAI_API_KEY，请在项目根目录 .env 中配置后再生成</div>
      )}
      {error && <div className="error">{error}</div>}

      <button
        className="generate"
        onClick={() => referenceImage ? generateFromReference() : generate()}
        disabled={busy || (!prompt.trim() && selectedComponents.size === 0 && !referenceImage)}
      >
        {busy ? '生成中…' : referenceImage ? '参考图生成' : '生成 UI'}
        <kbd>⌘↵</kbd>
      </button>

      <div className="adjust-row">
        <textarea
          className="adjust-input"
          rows={3}
          placeholder={
            !currentId
              ? '先生成或恢复一个页面后，可在此增量调整'
              : activeRef
                ? `在「#${activeRef.ref} ${activeRef.type}」基础上调整，如：它左边插入一个按钮、标题改红色`
                : '调整当前页面，如：标题改蓝色、加一张功能卡片。可先用「编辑」点选元素获得 #引用号'
          }
          value={adjustInput}
          disabled={!currentId || busy}
          onChange={(e) => setAdjustInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') adjust();
          }}
        />
        <button
          className="adjust-btn"
          onClick={adjust}
          disabled={!currentId || !adjustInput.trim() || busy}
          title="基于当前页面增量调整（未提及部分保持不变）"
        >
          {busy ? '处理中…' : '调整'}
        </button>
      </div>

      <div className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            {t.key === 'saved' && generated.length > 0 && (
              <span className="tab-count">{generated.length}</span>
            )}
            {t.key === 'history' && history.length > 0 && (
              <span className="tab-count">{history.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'starters' && (
          <div className="starter-list">
            <div className="starter-header">
              <span className="empty">{starters.length} 条示例</span>
              <button
                className="starter-refresh"
                onClick={refreshStarters}
                disabled={refreshingStarters}
                title="换一批新的示例提示词"
              >
                {refreshingStarters ? '生成中…' : '↻ 换一批'}
              </button>
            </div>
            {starters.map((s) => (
              <button key={s} className="starter" onClick={() => fill(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            {generated.length > 0 && (
              <div className="list-header">
                <span className="empty">{generated.length} 条</span>
                <button className="clear-all" onClick={clearSaved}>
                  清空
                </button>
              </div>
            )}
            <div className="saved-list">
              {generated.length === 0 && <div className="empty">还没有生成记录</div>}
              {generated.map((g) => (
                <div key={g.id} className="saved-item">
                  <button className="saved-main" onClick={() => restore(g)} title={g.prompt || g.id}>
                    <span className="item-title">{g.title}</span>
                    <span className="item-meta">{g.id}</span>
                  </button>
                  <button className="saved-restore" onClick={() => restore(g)} title="恢复到预览">
                    恢复
                  </button>
                  <button
                    className="saved-export"
                    onClick={() => exportPage(g.id)}
                    disabled={exporting}
                    title="导出可直接使用的单文件 HTML"
                  >
                    导出
                  </button>
                  <button
                    className="saved-delete"
                    onClick={() => deleteSaved(g)}
                    title="删除记录"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {history.length > 0 && (
              <div className="list-header">
                <span className="empty">{history.length} 条</span>
                <button className="clear-all" onClick={clearHistory}>
                  清空
                </button>
              </div>
            )}
            <div className="saved-list">
              {history.length === 0 && <div className="empty">还没有生成记录</div>}
              {history.map((h) => (
                <div key={h.prompt} className="saved-item">
                  <button className="history-item" onClick={() => fill(h.prompt)}>
                    <span className="item-title">{h.prompt}</span>
                    <span className="item-meta">
                      {h.title} · {h.at}
                    </span>
                  </button>
                  <button
                    className="saved-delete"
                    onClick={() => deleteHistory(h)}
                    title="删除记录"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}