# SpecPulse 架构文档

> 用自然语言构建 React UI 的工具链。本文描述系统分层、数据流、桌面端集成、
> 动态导出与安全模型。配套：`README.md`（使用）、`docs/TODO.md`（规划）。

## 1. 总览

SpecPulse 把一段自然语言需求转成一个可运行、可继续编辑的 React 页面。核心思路是
**数据（UISpec）与渲染（React 组件）分离**：

```
prompt ──► LLM ──► UISpec(JSON) ──► reactGenerator ──► App.tsx ──► Vite 预览 / 导出
         (agent 层)   (spec 层)       (generator 层)             (runtime 层)
```

一条链上任何一层都能独立替换：换模型、换 spec 校验规则、换生成器输出格式，
互不影响。

## 2. 分层与职责

| 层 | 位置 | 职责 | 纯函数？ |
| --- | --- | --- | --- |
| Agent（LLM 封装） | `src/agent/agent.ts` | 自然语言 → 校验过的 UISpec | 否（调用外部 API） |
| Spec（数据模型） | `src/spec/types.ts` | UISpec 类型 + 校验 + 组件词汇表 | 是 |
| Generator（编译器） | `src/generator/reactGenerator.ts` | UISpec → App.tsx 源码 | **是** |
| Runtime（运行时） | `preview/src/{ui,ui3d,uiShadcn}.tsx` | 设计系统组件 + 3D + shadcn 组件 | 是 |
| 动态渲染器 | `preview/src/SpecRenderer.tsx` | 运行时按 UISpec 数据渲染（不编译） | 是 |
| CLI | `src/cli/*` | build / adjust / regenerate / export / ci | — |
| 桌面端 | `desktop/` | Electron 壳：操作台 UI + IPC + 预览 | — |

关键不变量：**`spec.json` 永远能重新生成页面**——generator 是确定性的纯函数，
不需要 LLM 就能编译回 App.tsx（`npm run regenerate` / 编辑保存即用）。

## 3. Spec 数据模型（`src/spec/types.ts`）

```ts
interface UINode {
  type: string;                       // 组件类型，须在 SUPPORTED_TYPES 内
  props?: Record<string, unknown>;    // 字符串/布尔/数组，不存函数
  children?: UINode[];
}
interface UISpec {
  title: string;
  root: UINode;                       // 通常为 Page 节点
}
```

- `SUPPORTED_TYPES`：DOM 组件（Page/Navbar/Heading/Button/Card/Form/Table…）、
  3D 组件（Scene3D/Box3D/…）、shadcn 扩展。**新增能力 = 扩展词汇表 + 对应运行时组件**。
- `collectTypes` / `validateSpecTypes` / `extractRequiredTypes`：生成前从 prompt 提取
  期望组件并校验 LLM 输出；缺失时 CLI 重试一次并提醒必须包含。
- props 只允许 JSON 值：`onClick` 只**声明**事件名（如 `"openModal"`），不执行——
  为将来把事件绑定到真实状态/动作预留。

## 4. Agent 层（`src/agent/agent.ts`）

三个提示词模式，共用 OpenAI 兼容客户端（`OPENAI_BASE_URL` 可指向任意兼容服务）：

1. **build**（`SYSTEM_PROMPT`）：需求 → UISpec（可参考 `spec/catalog.json` 组件目录）。
2. **reference**（`REFERENCE_SYSTEM_PROMPT`）：截图/设计稿 → UISpec，使用独立配置的
   视觉模型（`OPENAI_VISION_MODEL` / `OPENAI_VISION_BASE_URL`，可配不同 key）。
3. **adjust**（`ADJUST_SYSTEM_PROMPT`）：对已有 spec 做增量修改，未提及部分保持不变。

模型/密钥解析优先级：CLI 参数 > 环境变量（`OPENAI_MODEL` 等）> 默认 `gpt-4o-mini`。

## 5. Generator（`src/generator/reactGenerator.ts`）

- 输入 UISpec，输出**确定性**的 `App.tsx` 源码（含 `export default function App`）。
- 节点 → JSX 递归编译，List/Stat/Form 等有专门渲染分支。
- 编译期安全（见 §10）：`href`/`src` URL 白名单、属性值转义（`escAttr`）、
  文本转义（`escText`），LLM 无法注入出 JSX 结构。
- 产物：`generated/<stamp>-<title>/` 下 `App.tsx` + `spec.json` + `prompt.txt`。

## 6. CLI（`src/cli/`）

| 命令 | 作用 |
| --- | --- |
| `build.ts "<prompt>"` | 生成 + 校验（缺类型自动重试）+ 写 `preview/src/App.tsx` + 归档 |
| `agent.ts` | 交互式 REPL，对同一预览反复生成 |
| `ci.ts` | 离线冒烟：编译 fixture（无 LLM） |
| `adjust.ts` | 对指定记录增量调整；把 `#1.2` 引用展开为具体节点描述（`expandRefs`） |
| `regenerate.ts` | 纯编译 `spec.json → App.tsx`（页面编辑保存后使用，无 LLM） |
| `export.ts` | 动态单文件导出（见 §9） |

所有 CLI 由主进程用 `spawn(node --import tsx <cli> <args>)` **数组参数**拉起，不经 shell。

## 7. 桌面操作台（Electron）

```
desktop/main.cjs          主进程：创建 BrowserWindow、IPC 处理器、拉起预览 vite(:5278)
desktop/preload.cjs       contextBridge 暴露 specpulseApi（14 个 invoke 方法）
desktop/src/              渲染进程（React）
  main.tsx                挂载点
  App.tsx                 薄容器（41 行）
  hooks/useConsoleState.ts  全部状态 + IPC 编排 + 消息监听（返回 ConsoleState）
  components/Sidebar.tsx    提示词输入 / 调整框 / 历史 / 设置入口
  components/SettingsModal.tsx  模型·Key·BaseUrl 配置
  components/PreviewBar.tsx   预览页脚：模式切换（预览/组件库）+ 标题 + 编辑 + 导出 + 浏览器打开
  lib/consoleHelpers.ts    历史读写、TABS、示例 chips
```

操作台除「预览」外还有一个**组件库（showcase）**模式：iframe 加载
`preview/src/DynamicApp.tsx`，用 `SpecRenderer` 渲染 `pages/*.json` 里的示例
组件陈列，方便查看/演示设计系统能力。

### 7.1 进程与端口

- 操作台 UI：Vite `:5277`（`base:'./'`，dev 用 vite、生产用 `loadFile` 打包产物）。
- 预览：主进程拉起独立 vite dev server `:5278`，iframe 通过 `?t=<token>` 强制刷新。
- 生产模式不依赖 dev server，构建产物仍能工作。

### 7.2 生成 / 调整 / 编辑链路

1. **生成**：`IPC.build(prompt)` → 主进程 spawn CLI → 写 `preview/src/App.tsx` →
   iframe 换 token 重载。控制台只等待 CLI 退出码，不接触生成内容。
2. **调整**：`IPC.adjust(id, instruction)` → CLI 读 `generated/<id>/spec.json`，
   `expandRefs` 展开 `#引用`，调用 LLM 后写回并重编译。
3. **编辑（点击即改）**：不经过 LLM。见 §8。

### 7.3 消息协议（postMessage）

预览 iframe 与操作台同用 `postMessage`，发送端 target `'*'`，**接收端校验来源**：

```
console ──► iframe:  { source:'specpulse-console', type:'editor-state', id, spec, editMode }
iframe ──► console:  { source:'specpulse-editor', action:'save'|'exit'|'select', ... }
```

- console 只接受来源为预览 origin（`http://localhost:5278`）的消息；
- 预览只信任 `localhost:5277` / `127.0.0.1:5277` / `'null'` / `'file://'`
  （打包后的 file:// 场景在 Electron 里 origin 是 `'file://'`，普通浏览器里是 `'null'`）。

### 7.4 IPC（preload 暴露 `window.specpulseApi`）

`build` / `reference` / `adjust` / `get-env` / `save-env` / `generate-starters` /
`open-external` / `list-generated` / `load-generated` / `delete-generated` /
`clear-generated` / `export-generated` / `get-spec` / `save-spec` 共 14 个，
全部 `ipcRenderer.invoke`，主进程 `ipcMain.handle` 一一对应。

## 8. 页面内编辑系统

### 8.1 SpecEditor（`preview/src/SpecEditor.tsx`）

- 操作台把记录 spec 通过 `editor-state` 消息推给 iframe，`PreviewRoot` 把编译版
  `App` 换成 spec 驱动的 `SpecEditor`（数据→组件实时渲染，无需重编译）。
- 点击任意组件 → 检查器编辑字段；**子组件列表**可深入选中 3D 场景内部对象。
- 检查器可折叠；顶部工具栏固定底部居中，含当前元素引用 chip（可复制 `#1.2`）。
- Form 去重：编辑态下包装节点用 `data-type` 属性标记，避免重复渲染表单按钮。

### 8.2 元素引用（`#路径`）

- 选中节点 → 生成 `#父.子` 路径（如 `#1.2`），经 `select` 消息上报操作台。
- 操作台保存 `activeRef`；提交调整指令时自动注入
  `[用户当前选中元素] 类型 …，文本「…」，引用路径 …` 作为上下文（不带 `#`，
  避免与 `expandRefs` 二次展开冲突）。
- CLI 侧 `expandRefs` 再把指令中的 `#1.2` 展开为 `#1.2 [Type「text」]`，让 LLM
  精确定位；`ADJUST_SYSTEM_PROMPT` 定义了相对插入语义（上下/左右、#引用）。

### 8.3 保存流程

`SpecEditor → save 消息 → 操作台 → IPC.save-spec → 写 spec.json → 触发
regenerate.ts 纯编译 App.tsx → 退出编辑态`。全程无 LLM。

## 9. 动态导出（`src/cli/export.ts`）

导出产物是**数据驱动**的单文件 HTML，页面运行时由 `SpecRenderer` 按 spec 渲染：

```
exports/<id>/
  index.html    # 单文件：内嵌 spec + 全部组件运行时（含 CSP meta）
  spec.json     # 部署时改 JSON 即改页面，无需重新构建
  prompt.txt
  dist/ + dist.zip
```

- 构建入口：`preview/dynamic.html` + `preview/src/dynamic-main.tsx`
  （`vite.dynamic.config.ts`，`inlineDynamicImports` + `assetsInlineLimit` 全内联）。
- spec 双通道：`file://` 下直接读内嵌 `window.__UIAGENT_SPEC__`（避免 fetch 的
  CORS 报错）；静态托管时优先 `fetch('./spec.json')` 实现真·动态更新。
- 内嵌时把 `<` 转义为 `\u003c`，防 spec 文本逃逸出内联脚本。

## 10. 安全与隐私模型

针对两股不可信输入：**LLM 生成的内容**（spec/页面）与**外部网络**（图片、链接）。

| 面 | 措施 |
| --- | --- |
| Electron | `contextIsolation` + `nodeIntegration:false` + `sandbox:true`；preload 仅暴露 14 个方法 |
| IPC 参数 | `cleanString` 限长；`generated/` 访问做路径穿越校验；`open-external` 仅 http(s) |
| 进程拉起 | `spawn` 数组参数，绝不经过 shell |
| postMessage | 两端各自校验对方 origin（见 §7.3） |
| iframe | `sandbox="allow-scripts allow-same-origin"`：禁顶层跳转/弹窗/表单/下载 |
| CSP | `preview/index.html`、`desktop/index.html`、动态导出均带 CSP meta；图片仅
  `https:/data:/blob:`，`connect-src` 仅本机 ws（HMR），`script-src 'self' 'unsafe-inline'` |
| 生成器 | `href`/`src` 编译期白名单（http(s)、`data:image/*`、blob、`#`、相对路径；
  `javascript:` 等直接丢弃）；属性值/列表文本转义 |
| 密钥 | `.env` gitignore；`get-env` 返回脱敏 Key；全代码路径不打印 API Key |

**设计使然的暴露**（工具属性，需知悉）：提示词明文落盘（localStorage +
`generated/<id>/`）并发送给 LLM 供应商；参考图功能会把所选图片的本地**文件路径**
发给供应商；生成页面可能加载外部 `https:` 图片（向该域名暴露 IP）。

## 11. 测试策略

- 框架：`node:test` + fixtures，全离线可跑（20 个用例），TDD 驱动。
- 重点覆盖：generator 确定性输出、类型校验、**编译期注入防护**
  （`javascript:` URL、JSX 属性/文本逃逸）。
- `npm run typecheck` 覆盖根目录 + preview + desktop 三端。
- `npm run ci` 是 pipeline 的离线冒烟。

## 12. 关键设计决策

1. **JSON 进、JSX 出**：generator 纯函数化 → 免 LLM 可测、可离线、可存档重建。
2. **小词汇表**：控制 LLM 输出空间，减少幻觉组件；扩展点收敛在
   `SUPPORTED_TYPES` + 运行时组件文件。
3. **编辑不走 LLM**：spec 驱动编辑器把「改文案/调结构」做成即时、免费、确定性操作；
   LLM 只负责生成与意图级调整。
4. **数据即契约**：spec 是唯一事实源，桌面/预览/导出三端都以它为输入，天然一致。
5. **安全内置在编译期**：URL 白名单与转义发生在代码生成阶段，而非运行时补丁，
   单文件导出后依然有效。

## 13. 扩展点 / 下一步

- 事件绑定：把 `onClick` 声明映射到真实 state/action（见 README Roadmap）。
- 数据感知组件：复用 datapulse 表格/图表能力，让 spec 引用真实数据源。
- 3D 懒加载：`React.lazy(Scene3D)` 拆包，无 3D 页面保持轻量。
- 截图回归：为生成记录做视觉 diff。
- 纯浏览器模式：去掉 Electron，用服务端/纯前端跑 agent。
