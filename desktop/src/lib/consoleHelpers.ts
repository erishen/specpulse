export interface HistoryItem {
  prompt: string;
  title: string;
  at: string;
}

export type Tab = 'starters' | 'saved' | 'history';

export const HISTORY_KEY = 'specpulse.history.v1';

export const DEFAULT_STARTERS: string[] = [
  '做一个深色 3D 落地页：导航(品牌+定价+文档)、大标题、副标题、CTA 按钮、3D 场景(蓝色立方体+青色球体+金色圆环+深色地面)、三张功能卡片、页脚标语',
  '做定价页：大标题、三张价格卡片(基础/专业/企业，各带价格 Badge、功能列表、CTA)，专业版主色高亮',
  '做一个简洁登录页：大标题「欢迎回来」、邮箱和密码输入框、登录按钮、注册提示',
  '做数据看板：标题「业务概览」、四张指标卡片(总收入/新增用户/转化率/活跃度)、三张列表卡片',
  '做产品 3D 展厅：大标题、3D 场景(红色圆环+银色球体+蓝色立方体错落摆放)、产品规格列表、购买按钮',
  '做活动报名页：活动信息卡片(日期+地点+名额 Badge)、报名表单(姓名、邮箱、备注)、提交按钮',
];

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 50) : [];
  } catch {
    return [];
  }
}

export function saveHistory(item: HistoryItem) {
  const next = [item, ...loadHistory().filter((h) => h.prompt !== item.prompt)].slice(0, 50);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export const TABS: { key: Tab; label: string }[] = [
  { key: 'starters', label: '示例' },
  { key: 'saved', label: '已保存' },
  { key: 'history', label: '历史' },
];