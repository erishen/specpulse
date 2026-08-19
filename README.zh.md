# SpecPulse

用自然语言构建 React UI。LLM 把你的需求转成声明式 UI spec，生成器把 spec 编译成真正的 React 组件，Vite 预览实时展示。

```
prompt ──► LLM ──► UI spec (JSON 树) ──► React 组件 ──► Vite 预览
         (src/agent)   (src/spec)      (src/generator)   (preview/)
```

## 功能

- **设计系统 + 4 套主题** — `preview/src/index.css` 基于设计 token；每个 `Page`
  可传 `theme` 属性（`light` / `dark` / `midnight` / `aurora`），整套配色随之切换
  （玻璃拟态卡片、暗色适配的表格/角标/步骤条…）。
- **增量调整** — 不必重新生成，在「调整」框里继续改（"把标题改蓝色"、
  "在 hero 下面加一张 Stat 卡片"）。
- **元素引用** — 编辑模式下点击任意组件得到 `#1.2` 式路径引用（工具栏可见、可复制），
  粘贴进「调整」框即可精确定位（"在 #1.2 左边插入一个按钮"）。
- **页面点击编辑** — 点「编辑」把预览切换成 spec 驱动编辑器：点击组件、在检查器里改
  字段、增删/排序子组件，点「保存」纯编译 `spec.json → App.tsx`（不调用 LLM）。
- **参考图生成** — 上传截图或设计稿，视觉模型复刻出类似 UI。

## 快速开始

```bash
cp .env.example .env        # 填入 OPENAI_API_KEY
npm install                 # 根目录依赖
npm --prefix preview install  # preview 依赖
npm run preview             # 终端 1：vite 预览 :5173
npm run build -- "一个云存储创业公司的落地页，带导航、hero 标题、功能卡片和 CTA 按钮"
```

交互式模式（对同一预览反复重生成）：

```bash
npm run agent
```

精选示例提示词见 `docs/examples.md`（也内置在桌面操作台的「示例」chips 里）。

离线管线冒烟测试（无需 LLM）：

```bash
npm run ci                   # 编译 tests/fixtures/pricing.json -> preview/src/App.tsx
```

## 桌面操作台（Electron）

左侧输入提示词、右侧实时预览，生成历史存 localStorage。预览由 Electron 主进程
拉起的 vite dev server（:5278）提供；操作台 UI 跑在 :5277。

```bash
npm --prefix desktop install     # 含 electron（见下方说明）

npm run desktop                  # 生产：构建操作台并打开窗口
npm run desktop:dev              # 开发：electron + 操作台 vite -- 热更新
# dev 模式还需单独启动操作台 vite 服务：
npm --prefix desktop run dev
```

- **生成链路（主进程 → CLI → 预览）**：操作台点「生成」调用 `IPC.build(prompt)`；
  主进程 `spawn node --import tsx src/cli/build.ts "<prompt>"`（纯 argv 传参，绝不
  经 shell），写出 `preview/src/App.tsx`；操作台刷新 iframe `?t=` 查询参数重载。
- **调整**：对当前记录的 `spec.json` 做 LLM diff（`src/cli/adjust.ts`），未提及部分
  保持不变。选中元素的 `#ref` 会自动附加为上下文；指令里的 `#1.2` 引用会在调用前
  展开为具体节点描述。
- **编辑（点击即改）**：操作台通过 `postMessage` 把记录 spec 发给预览 iframe；
  `preview/src/PreviewRoot.tsx` 把编译版 `App` 换成 spec 驱动的 `SpecEditor`。
  保存会写 `spec.json` 并重跑 `src/cli/regenerate.ts`（纯编译、无 LLM），随后退出编辑态。
- **历史**：每次生成都会归档到 `generated/<stamp>-<title>/`
  （`prompt.txt` + `spec.json` + `App.tsx`）。操作台的「已保存」列表可随时恢复到预览。
  `generated/` 未加入 gitignore——想版本化历史就提交它。
- **导出**：`src/cli/export.ts` 把记录打包成**动态**单文件 HTML 放到 `exports/`（已 gitignore）：
  页面运行时从 `spec.json` 渲染，改 JSON 页面就变、无需重新构建。spec 同时内嵌在
  HTML 里（`file://` 双击照样能用），并随包附带 `exports/<id>/spec.json`（+ `prompt.txt`）。
- **首次启动**：还没有 `.env` 时操作台只提示、不报错。填好根目录 `.env` 的
  `OPENAI_API_KEY` 后重新生成即可。
- **electron 二进制说明**：本仓库锁定 `electron@37.10.3`。若网络下载卡住
  （国内镜像），用 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm --prefix
  desktop install` 安装；或把 `work/harness/datapulse/desktop` 下装好的
  `node_modules/electron` 拷到 `desktop/node_modules`，跳过 npm postinstall。

## 目录结构

```
generated/<stamp>-<title>/   每次生成的自动归档
                             (prompt.txt + spec.json + App.tsx；有 spec.json 即可
                             重新生成——生成器是纯函数)
```

```
src/
  spec/types.ts        UI 元素词汇表 + UISpec 类型
  agent/agent.ts       LLM 封装：自然语言 -> 通过校验的 UISpec
  generator/reactGenerator.ts   UISpec -> App.tsx 源码（纯函数、确定性强）
  cli/build.ts         一次性 CLI：prompt -> 组件文件
  cli/agent.ts         交互式 REPL
  cli/ci.ts            离线冒烟测试
  cli/adjust.ts        对已有记录做增量 LLM 调整
  cli/regenerate.ts    纯编译：spec.json -> App.tsx（页面编辑后使用）
  cli/export.ts        把记录打包成动态单文件 HTML（运行时渲染 spec.json）
preview/               Vite + React 运行时，渲染生成的 App.tsx
  src/ui.tsx           生成器产出的设计系统组件
  src/ui3d.tsx         react-three-fiber 3D 组件（Scene3D、Box3D…）
  src/uiShadcn.tsx     基于 radix 的 shadcn 风格组件
  src/SpecEditor.tsx   页面点击编辑（spec 驱动，无 LLM）
  src/PreviewRoot.tsx  根据操作台消息在编译版 App 与 SpecEditor 之间切换
desktop/               Electron 操作台：控制台 UI + 负责拉起 CLI 的 IPC 主进程
tests/                 node:test + fixtures（TDD）
```

## 设计理念

- **关注点分离**：agent（LLM）/ spec（数据）/ generator（编译）/ preview（运行时）。
  任意一层可替换。
- **JSON 进、JSX 出**：生成器是纯函数且确定性强，无需 LLM 即可单元测试。
- **小型词汇表**：DOM = `Page, Navbar, Heading, Hero, Paragraph, Button, Input,
  Textarea, Card, List, Badge, Divider, Form, Link, Image, Avatar, Stat, Progress,
  Alert, Table, Checkbox, Select, Quote, CodeBlock, Steps, Timeline, Footer, Row,
  Grid`；3D（react-three-fiber）= `Scene3D, Box3D, Sphere3D, Torus3D, Plane3D,
  Cylinder3D, Cone3D, Icosahedron3D, TorusKnot3D`；另有 `uiShadcn.tsx` 提供 radix
  系扩展。扩展 `SUPPORTED_TYPES` + 对应运行时文件即可扩充能力。
- **`onClick` 只声明不执行**：props 可以引用处理器名字；真正的 agent 接线流程
  会把它绑定到应用状态。

## 安全与隐私

桌面操作台对自身渲染进程和（LLM 生成、不可信的）预览内容做了加固：

- **Electron**：`contextIsolation` + `nodeIntegration:false` + `sandbox:true`；
  preload 极简，只暴露 10 个 IPC 方法。IPC 参数用 `cleanString` 限长，
  `generated/` 访问有路径穿越校验，CLI 用 argv 数组拉起（绝不经 shell）。
- **postMessage**：操作台只接受预览来源（`http://localhost:5278`）的消息；
  预览只信任操作台来源（dev `:5277` / 打包后 `'file://'` 或 `'null'`）。发送端仍是 `'*'`，但接收端校验。
- **iframe**：`sandbox="allow-scripts allow-same-origin"`，阻止生成页面做顶层跳转、
  弹窗、表单提交和下载。
- **CSP**：`preview/index.html` 与 `desktop/index.html` 都带 CSP meta
  （`script-src 'self' 'unsafe-inline'`、图片仅 `https:/data:/blob:`、`connect-src`
  仅本机 ws 用于 HMR），单文件导出后依然生效。
- **生成器白名单**：`href`/`src` 属性编译期清洗（仅 http(s)、`data:image/*`、blob、
  `#`、相对路径；`javascript:` 等直接丢弃），属性值和列表文本做转义，杜绝注出 JSX。
- **密钥**：`get-env` 返回脱敏 Key，`.env` 已 gitignore，代码路径不打印 API Key。

**已知的、设计使然的暴露**（这是一个把文本发给 LLM 的工具）：提示词以明文存储
（localStorage 历史 + `generated/<id>/prompt.txt` + `spec.json`）并发送给 LLM 供应商；
参考图功能会把所选图片的本地**文件路径**发给供应商；生成页面可能加载外部 `https:`
图片（会向该域名暴露你的 IP）。

## 测试

```bash
npm test          # node:test，无需联网
npm run typecheck # tsc --noEmit（根目录 + preview + desktop）
npm --prefix preview run build
npm --prefix desktop run build
```

## 路线图

见 `docs/TODO.md` 的优先级清单（编辑器撤销/拖拽、spec 快照+回滚、LLM 输出校验、
纯浏览器模式…）。

暂未列入其中的想法：
- [ ] 处理器绑定（把 `onClick` 映射到状态/动作，而不是空置）
- [ ] 生成数据感知组件（复用 datapulse 的表格/图表）
- [ ] 截图回归对比
- [ ] 用 `React.lazy(Scene3D)` 对 3D 运行时做代码分割，让无 3D 页面保持轻量
