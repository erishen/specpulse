# 数据感知组件 —— 接口草案

> 目标：让 SpecPulse 生成的页面能显示**真实数据**，与 DataPulse 数据源打通，
> 形成「问数据 → 得交互看板」闭环。本文是接口草案，供评审后再实现。

## 1. 目标与非目标

**目标**
- spec 节点可引用运行时数据，组件从数据渲染（Table 行、Chart 系列、Stat 数值）。
- 与 DataPulse 打通：`dataSource.kind = 'datapulse'` 时由 DataPulse 执行查询。
- 导出仍保持现有形态：单文件 HTML 内嵌数据快照；部署时可替换数据（动态）。

**非目标（本期不做）**
- 不做前端直连数据库（SQL 只发生在受控 CLI 子进程，运行时只见已解析数据）。
- 不做复杂交互图表（本期 Chart 为轻量 SVG/Canvas 自绘，后续可换 ECharts）。

## 2. Spec 扩展（`src/spec/types.ts`）

```ts
/** 一次可复用的数据绑定：节点通过 dataRef 引用 datasets.id */
interface DatasetBinding {
  id: string;                        // 如 "sales_by_month"
  dataSource: {
    kind: 'datapulse' | 'inline';    // datapulse = 走 DataPulse 查询
    source: string;                  // datapulse 数据源名 / sqlite 路径
    query: string;                   // 只读 SELECT（复用 DataPulse 只读守卫）
    cacheMs?: number;                // 快照缓存（默认 0 = 每次刷新取）
  };
  /** 行 → 组件 props 的映射；缺省按列名直接喂 */
  mapping?: {
    labelsCol?: string;              // 标签列（如 month）
    series?: { name: string; valueCol: string }[];  // 多序列（如 {name:'营收', valueCol:'amount'}）
  };
}

interface UISpec {
  title: string;
  root: UINode;
  datasets?: DatasetBinding[];       // NEW：可选，spec 根级
}

/** 数据能力组件专用 prop（UINode.props 内） */
// { "type":"Chart", "props": { "title":"月度营收", "dataRef":"sales_by_month" } }
```

规则：
- 只有数据能力组件接受 `dataRef`（`Table` / `Chart` / `Stat` / `Steps`…），
  白名单见 `DATA_CAPABLE`（`src/generator/reactGenerator.ts`）。
- 其余组件见到 `dataRef` 编译期丢弃（安全：LLM 无法把数据引用塞进任意组件）。
- `spec.datasets` 缺省时页面退化为纯静态（完全向后兼容）。

## 3. 数据能力组件（`preview/src/ui.tsx`）

新增三个（或扩展现有）轻量组件，自绘零依赖，避免 ECharts CDN 破坏 CSP：

```ts
interface ChartProps {
  title?: string;
  type?: 'line' | 'bar' | 'pie';      // 默认 'line'
  data?: { labels: string[]; series: { name: string; values: number[] }[] };
  height?: number;
}
interface StatProps { label: string; data?: { value: number; delta?: number }; suffix?: string; ... }
// Table 增加 data 模式：rows: Record<string, string|number>[]，列由表头推断
```

Generator 编译规则（`reactGenerator.ts`）：
```
props.dataRef === "x"
  → <Chart ... data={DATA["x"]} />        // DATA 由 binder 注入（见 §5）
  → 无 dataRef 时保留静态 props.data
```

## 4. Binder CLI（`src/cli/bind.ts`，新增）

把 spec 里的 `datasets` 解析成运行时数据。两种输出模式：

| 模式 | 行为 | 适用 |
| --- | --- | --- |
| **快照**（默认） | 执行查询 → 数据内嵌进导出 HTML / 编译产物 | file:// 双击、离线 |
| **实时** | 生成 `data.json` 与导出并置，运行时 fetch（同 spec.json 机制） | 静态托管改数即变 |

CLI 签名：
```
npm run bind -- <id> [--live]
# 快照: 重写 generated/<id>/spec.json 里 datasets → 替换为 data payload? 否——
#       数据单独存 sidecar <id>/data.json，spec 不变（spec 仍是"查询意图"）
```
关键：**spec.json 永远保留查询意图**（`datasets`），解析结果放 sidecar
`data.json`，这样快照/实时/重新解析三态互不污染。

## 5. 运行时注入（`preview/src/runtime.ts`，新增）

```ts
// 编译/导出时注入：
window.__UIAGENT_DATA__ = { "sales_by_month": { labels:[...], series:[...] } };
// runtime 读取 + 校验（只接受 JSON 值），组件经 props.data 拿到
export const DATA: Record<string, unknown> = window.__UIAGENT_DATA__ ?? {};
```

- 解析在**服务器侧/CLI**完成（datapulse 只读 SELECT），运行时只见数字与字符串。
- `Chart` 收到 `data` 后再做一次形状清洗（对齐 datapulse `sanitizeDashboardSpec` 的
  防御风格：坏数据丢弃而非抛错）。

## 6. 与 DataPulse 的两种打通方式

**A. 适配器（本期，低成本）**：datapulse `dashboard` 输出
`{ charts: [{type,title,labels,series}] }` → 转换器 `datapulseToSpec()` 生成
SpecPulse 的 `Chart` 节点 spec。不新增数据源协议，纯格式适配，立即能跑。

**B. 深绑定（下期）**：spec 里 `dataSource.kind='datapulse'` + `source`/`query`；
`bind.ts` 通过 datapulse 的 `DataSource` 契约（SQLite/Postgres/MySQL 方言无关）
执行查询、聚合，产出 `Chart.data` / `Table.rows`。复用其只读 SELECT 守卫。

建议顺序：**先 A 打通闭环**（今天的数据就能出现在 SpecPulse 页面），
**再 B 让 LLM 直接生成带查询的数据页**。

## 7. 安全

- SQL 只在 `bind.ts` 子进程执行，复用 DataPulse 只读 SELECT 守卫 + 超时 kill。
- 运行时只接触已解析 JSON；`data.json` 过一遍与 generator 相同的 URL/类型清洗。
- 内嵌/导出的 `data` 与 spec 一样做 `<` 转义（防逃逸内联脚本）。
- CSP 不变（Chart 自绘无外部请求；实时模式 `connect-src 'self'` 已放行同源 fetch）。

## 8. 落地步骤

1. `src/spec/types.ts` 加 `DatasetBinding` + `DATA_CAPABLE` 白名单 + 校验。
2. `preview/src/ui.tsx` 加 `Chart`，`Table`/`Stat` 支持 `data`。
3. `src/generator/reactGenerator.ts`：`dataRef` 编译规则 + 非能力组件丢弃。
4. `src/cli/bind.ts`（快照 + `--live`）+ `preview/src/runtime.ts`。
5. datapulse `datapulseToSpec` 适配器，出第一个「真实数据落地页」验证。
6. `export.ts` 携带 `data.json`；README/架构文档同步。