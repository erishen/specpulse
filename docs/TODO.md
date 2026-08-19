# UI Agent TODO

> 来源：项目总体评审（2026-08-18）。按优先级排列，`[x]` 表示完成。

## 本次收尾已交付（2026-08-18）

- [x] 编辑保存后自动退出编辑模式，直接显示重编译结果
- [x] 启动时自动选中最新一条生成记录，编辑按钮立即可用
- [x] 调整输入框放大（textarea）+ 元素引用定位（点选组件得 `#1.2`、可复制、指令自动带选中上下文、CLI 展开 `#ref`、prompt 支持相对插入）
- [x] 提示词/调整输入框按屏幕高度自适应，示例区保底不被压缩
- [x] 检查器可折叠（×/▸）、工具栏移至底部不挡 Navbar/Hero、检查器子组件列表可深入 3D 场景
- [x] Form 提交按钮去重在编辑模式下的兜底检测（识别 `data-type`）
- [x] 指令截断上限 4000 → 8000
- [x] `desktop/src/App.tsx` 拆分：`hooks/useConsoleState.ts` + `components/{Sidebar,SettingsModal,PreviewBar}.tsx` + `lib/consoleHelpers.ts`
- [x] README 补充 Features / 桌面控制台 / 布局 / 词汇表

## P0 · 编辑器体验（当前最大短板）

- [ ] **Undo / Redo**：编辑态维护操作栈（patch / addChild / remove / move / duplicate），支持 ⌘Z / ⌘⇧Z，工具栏加撤销重做按钮
  - 位置：`preview/src/SpecEditor.tsx`（改造 `setDoc` 为 history 中间件）
- [ ] **拖拽排序**：支持在同一父级内拖拽重排子组件；需要先解决 `display: contents` 包装下拖拽占位的定位问题
- [ ] **快捷键**：删除（Del/⌘Backspace）、复制（⌘D）、上移/下移（⌘↑/⌘↓）、保存（⌘S）
- [ ] **组件树视图**：新增"大纲"面板（缩进树形结构，点击定位 + 拖拽），与点击即改互补，绕开 3D canvas 点不到的问题

## P1 · 数据与版本化

- [ ] **编辑前自动快照**：进入编辑模式前把当前 spec.json 备份为 `.bak`（或 `generated/<id>/prev/`），避免误操作后无法回滚
- [ ] **编辑保存失败保护**：`save-spec` 改为先写临时文件再原子替换；`runRegenerate` 失败时提示并可回滚 spec
- [ ] **记录差异视图**：调整/编辑后生成变更摘要（类型增减、文本 diff），保存到 `prompt.txt` 旁的 `diff.md`

## P2 · LLM 输出健壮性

- [ ] **编译期校验 + 自动修复**：对 spec 做静态检查（如 Form 内嵌套 Button、非法 props、缺失 theme），发现即自动修复并记录到日志，而不是依赖 prompt 规则预防
  - 位置：`src/generator/` 编译前加 `src/spec/validate.ts`
- [ ] **LLM 违规降级**：若校验无法自动修复，回退到上一版本 spec 并提示重试
- [ ] **prompt 规则回归测试**：把"禁止 Form 内 Button""必含 Navbar/Footer"等约束写进 `tests/`（用固定 spec 走 promptToSpec 的 mock 断言）

## P3 · 测试与质量

- [ ] **编辑器测试**：树操作（addChild/remove/move/duplicate/undo）用 React Testing Library 覆盖
- [ ] **消息协议测试**：console ↔ preview 的 `editor-state` / `save` / `select` 消息流加集成测试
- [ ] **CLI 冒烟测试**：`regenerate` / `adjust`（含 `#path` 展开）/ `export` 端到端跑通并断言产物存在
- [ ] **CI**：github actions 跑 typecheck + test + build（三端）

## P4 · 平台与打磨

- [ ] **浏览器端可用**：编辑/保存链路目前绑 Electron IPC；抽一层 `storage` 接口（localStorage / IndexedDB），让纯浏览器 preview 也能进编辑态（无法落盘时只做导出）
- [ ] **导出增强**：导出时内联第三方依赖（3D 场景库）、输出单 HTML 免构建可分享
- [ ] **记录清理**：操作台提供按标题搜索、批量删除、导出全部压缩包
- [ ] **UX 细节**：检查器折叠状态持久化（localStorage）；调整输入框增加常用模板（改色/加卡/插行）
