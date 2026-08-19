import { useEffect, useState } from 'react';
import type { EnvConfig, EnvInfo } from '../electron.d';

interface Props {
  env: EnvInfo | null;
  open: boolean;
  onClose: () => void;
  onEnvSaved: (env: EnvInfo) => void;
  onError: (message: string) => void;
}

export default function SettingsModal({ env, open, onClose, onEnvSaved, onError }: Props) {
  const [form, setForm] = useState<{
    model: string; visionModel: string;
    apiKey: string; baseUrl: string;
    visionApiKey: string; visionBaseUrl: string;
  }>({
    model: '', visionModel: '', apiKey: '', baseUrl: '',
    visionApiKey: '', visionBaseUrl: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        model: env?.model ?? '',
        visionModel: env?.visionModel ?? '',
        apiKey: '', baseUrl: '',
        visionApiKey: '', visionBaseUrl: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function save() {
    const config: EnvConfig = {};
    if (form.model.trim()) config.model = form.model.trim();
    if (form.visionModel.trim()) config.visionModel = form.visionModel.trim();
    if (form.apiKey.trim()) config.apiKey = form.apiKey.trim();
    if (form.baseUrl.trim()) config.baseUrl = form.baseUrl.trim();
    if (form.visionApiKey.trim()) config.visionApiKey = form.visionApiKey.trim();
    if (form.visionBaseUrl.trim()) config.visionBaseUrl = form.visionBaseUrl.trim();
    setSaving(true);
    try {
      await window.specpulseApi.saveEnv(config);
      onEnvSaved(await window.specpulseApi.getEnv());
      onClose();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>模型设置</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="settings-section">
            <span className="settings-section-title">文本模型</span>
            <label className="settings-field">
              <span className="settings-label">模型名称</span>
              <input
                className="settings-input"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                placeholder="例如：gpt-4o-mini"
              />
            </label>
            <label className="settings-field">
              <span className="settings-label">API Key</span>
              <input
                className="settings-input"
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                placeholder={env?.apiKey ? `当前：${env.apiKey}（留空不修改）` : 'sk-...'}
              />
            </label>
            <label className="settings-field">
              <span className="settings-label">Base URL</span>
              <input
                className="settings-input"
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
                placeholder="例如：https://api.openai.com/v1"
              />
            </label>
          </div>
          <div className="settings-section">
            <span className="settings-section-title">视觉模型</span>
            <span className="settings-hint">用于分析截图/设计稿，需支持图片输入</span>
            <label className="settings-field">
              <span className="settings-label">模型名称</span>
              <input
                className="settings-input"
                value={form.visionModel}
                onChange={(e) => setForm((f) => ({ ...f, visionModel: e.target.value }))}
                placeholder="例如：gpt-4o"
              />
            </label>
            <label className="settings-field">
              <span className="settings-label">API Key</span>
              <input
                className="settings-input"
                type="password"
                value={form.visionApiKey}
                onChange={(e) => setForm((f) => ({ ...f, visionApiKey: e.target.value }))}
                placeholder={env?.visionApiKey ? `当前：${env.visionApiKey}（留空不修改）` : '留空则复用文本模型 Key'}
              />
            </label>
            <label className="settings-field">
              <span className="settings-label">Base URL</span>
              <input
                className="settings-input"
                value={form.visionBaseUrl}
                onChange={(e) => setForm((f) => ({ ...f, visionBaseUrl: e.target.value }))}
                placeholder="留空则复用文本模型 Base URL"
              />
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose}>取消</button>
          <button className="modal-save" onClick={save} disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}