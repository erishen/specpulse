import { useEffect, useRef, useState } from 'react';
import type { EnvInfo, GeneratedEntry, UISpec } from '../electron.d';
import { DEFAULT_STARTERS, HISTORY_KEY, loadHistory, saveHistory, type HistoryItem, type Tab } from '../lib/consoleHelpers';

/**
 * All console state + IPC orchestration, extracted so App.tsx stays a thin
 * layout and Sidebar/SettingsModal/PreviewBar stay presentational.
 */
export function useConsoleState() {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [generated, setGenerated] = useState<GeneratedEntry[]>([]);
  const [env, setEnv] = useState<EnvInfo | null>(null);
  const [token, setToken] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('starters');
  const [currentId, setCurrentId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [adjustInput, setAdjustInput] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());
  const [starters, setStarters] = useState<string[]>(DEFAULT_STARTERS);
  const [refreshingStarters, setRefreshingStarters] = useState(false);
  const [previewMode, setPreviewMode] = useState<'preview' | 'showcase'>('preview');
  const [referenceImage, setReferenceImage] = useState<string>('');
  const [referencePreview, setReferencePreview] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editSpec, setEditSpec] = useState<UISpec | null>(null);
  const [activeRef, setActiveRef] = useState<{ ref: string; type: string; text?: string } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.specpulseApi.getEnv().then(setEnv).catch(() => setEnv(null));
    refreshGenerated().then((list) => {
      const latest = list[0];
      if (latest) {
        setCurrentId(latest.id);
        setPageTitle(latest.title);
        setPrompt(latest.prompt || '');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const previewHost = env?.previewUrl || 'http://localhost:5278';
    const allowedOrigins = new Set([previewHost, previewHost.replace('localhost', '127.0.0.1')]);

    function onMessage(e: MessageEvent) {
      // Only trust messages from the preview iframe origin; anything else (a
      // malicious page that got a window reference, another app tab, …) is dropped.
      if (!allowedOrigins.has(e.origin)) return;
      if (e.data?.source === 'specpulse-showcase') {
        const { action, type } = e.data as { action: 'select' | 'deselect'; type: string };
        if (!type) return;
        setSelectedComponents((prev) => {
          const next = new Set(prev);
          if (action === 'select') next.add(type);
          else next.delete(type);
          return next;
        });
        return;
      }
      if (e.data?.source === 'specpulse-editor') {
        const { action, id, spec } = e.data as { action?: string; id?: string; spec?: UISpec; ref?: string; type?: string; text?: string };
        if (action === 'save' && id && spec) {
          handleSpecSave(id, spec);
        } else if (action === 'exit') {
          setEditMode(false);
          setEditSpec(null);
          setActiveRef(null);
        } else if (action === 'select') {
          setActiveRef(e.data.ref && e.data.type ? { ref: e.data.ref, type: e.data.type, text: e.data.text } : null);
        }
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env?.previewUrl]);

  async function refreshGenerated(): Promise<GeneratedEntry[]> {
    try {
      const list = await window.specpulseApi.listGenerated();
      setGenerated(list);
      return list;
    } catch {
      setGenerated([]);
      return [];
    }
  }

  async function toggleEditMode() {
    if (editMode) {
      setEditMode(false);
      setEditSpec(null);
      return;
    }
    if (!currentId) return;
    setError('');
    try {
      const spec = await window.specpulseApi.getSpec(currentId);
      setEditSpec(spec);
      setEditMode(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSpecSave(id: string, spec: UISpec) {
    try {
      const res = await window.specpulseApi.saveSpec(id, spec);
      setPageTitle(res.title || spec.title);
      setEditMode(false);
      setEditSpec(null);
      setToken((t) => t + 1);
      refreshGenerated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function restore(entry: GeneratedEntry) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await window.specpulseApi.loadGenerated(entry.id);
      setPageTitle(entry.title);
      setPrompt(entry.prompt);
      setCurrentId(entry.id);
      setEditMode(false);
      setEditSpec(null);
      setToken((t) => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    const userInput = prompt.trim();
    if ((!userInput && selectedComponents.size === 0) || busy) return;
    setBusy(true);
    setError('');
    try {
      let fullPrompt = userInput;
      if (selectedComponents.size > 0) {
        const compList = Array.from(selectedComponents).join(', ');
        fullPrompt = userInput
          ? `页面需要包含以下组件：${compList}\n\n${userInput}`
          : `页面需要包含以下组件：${compList}`;
      }
      const result = await window.specpulseApi.build(fullPrompt);
      setPageTitle(result.title);
      setCurrentId(result.id);
      setEditMode(false);
      setEditSpec(null);
      saveHistory({ prompt: userInput || `组件：${Array.from(selectedComponents).join(', ')}`, title: result.title, at: new Date().toLocaleTimeString() });
      setHistory(loadHistory());
      setToken((t) => t + 1);
      refreshGenerated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function generateFromReference() {
    if (!referenceImage || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await window.specpulseApi.reference(referenceImage, prompt.trim() || undefined);
      setPageTitle(result.title);
      setCurrentId(result.id);
      setEditMode(false);
      setEditSpec(null);
      saveHistory({ prompt: `参考图生成: ${referenceImage.slice(0, 50)}...`, title: result.title, at: new Date().toLocaleTimeString() });
      setHistory(loadHistory());
      setToken((t) => t + 1);
      refreshGenerated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setReferencePreview(dataUrl);
      // In Electron, file input exposes the real path; fall back to the name elsewhere.
      const filePath = (file as unknown as { path?: string }).path || file.name;
      setReferenceImage(filePath);
    };
    reader.readAsDataURL(file);
  }

  function clearReference() {
    setReferenceImage('');
    setReferencePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function adjust() {
    const instruction = adjustInput.trim();
    if (!currentId || !instruction || busy) return;
    setBusy(true);
    setError('');
    try {
      const selectedHint = activeRef
        ? `\n\n[用户当前选中元素] 类型 ${activeRef.type}${activeRef.text ? `，文本「${activeRef.text}」` : ''}，引用路径 ${activeRef.ref}。指令中出现"这个/它/当前元素"通常指该元素。`
        : '';
      const result = await window.specpulseApi.adjust(currentId, `${instruction}${selectedHint}`);
      setPageTitle(result.title);
      setCurrentId(result.id);
      setEditMode(false);
      setEditSpec(null);
      setActiveRef(null);
      setAdjustInput('');
      saveHistory({
        prompt: `调整「${currentId}」: ${instruction}`,
        title: result.title,
        at: new Date().toLocaleTimeString(),
      });
      setHistory(loadHistory());
      setToken((t) => t + 1);
      refreshGenerated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function fill(promptText: string) {
    setPrompt(promptText);
    inputRef.current?.focus();
  }

  async function refreshStarters() {
    if (refreshingStarters) return;
    setRefreshingStarters(true);
    try {
      const result = await window.specpulseApi.generateStarters();
      if (result.length > 0) setStarters(result);
    } catch {
      /* keep current starters on failure */
    } finally {
      setRefreshingStarters(false);
    }
  }

  async function deleteSaved(entry: GeneratedEntry) {
    if (!window.confirm(`删除生成记录「${entry.title}」？`)) return;
    try {
      await window.specpulseApi.deleteGenerated(entry.id);
      if (currentId === entry.id) setCurrentId('');
      refreshGenerated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function clearSaved() {
    if (!window.confirm('清空全部已保存的生成记录？此操作会删除 generated/ 下所有文件，不可恢复。')) return;
    try {
      await window.specpulseApi.clearGenerated();
      refreshGenerated();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function deleteHistory(item: HistoryItem) {
    setHistory((prev) => {
      const next = prev.filter((h) => h.prompt !== item.prompt).slice(0, 50);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* quota */
      }
      return next;
    });
  }

  function clearHistory() {
    if (!window.confirm('清空全部历史记录（仅本机 localStorage）？')) return;
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* best-effort */
    }
    setHistory([]);
  }

  async function exportPage(id: string) {
    if (exporting) return;
    setExporting(true);
    setError('');
    try {
      await window.specpulseApi.exportGenerated(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  }

  return {
    prompt, setPrompt,
    busy, error, setError, pageTitle,
    history, generated, env, setEnv,
    token, activeTab, setActiveTab,
    currentId, exporting, adjustInput, setAdjustInput,
    selectedComponents, setSelectedComponents,
    starters, refreshingStarters,
    previewMode, setPreviewMode,
    referenceImage, referencePreview,
    showSettings, setShowSettings,
    editMode, editSpec, activeRef,
    inputRef, fileInputRef,
    refreshGenerated,
    toggleEditMode, handleSpecSave, restore,
    generate, generateFromReference,
    handleFileSelect, clearReference,
    adjust, fill, refreshStarters,
    deleteSaved, clearSaved, deleteHistory, clearHistory,
    exportPage,
  };
}

export type ConsoleState = ReturnType<typeof useConsoleState>;