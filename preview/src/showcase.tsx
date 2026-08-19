import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Page,
  Navbar,
  Heading,
  Hero,
  Paragraph,
  Button,
  Input,
  Textarea,
  Card,
  List,
  Badge,
  Divider,
  Form,
  Image,
  Avatar,
  Stat,
  Progress,
  Alert,
  Table,
  Checkbox,
  Select,
  Quote,
  CodeBlock,
  Steps,
  Timeline,
  Footer,
} from './ui.js';
import {
  Scene3D,
  Box3D,
  Sphere3D,
  Torus3D,
  Plane3D,
  Cylinder3D,
  Cone3D,
  Icosahedron3D,
  TorusKnot3D,
} from './ui3d.js';
import {
  SDialog,
  STabs,
  SSwitch,
  SSkeleton,
  STooltip,
  SDropdownMenu,
  SSheet,
  SToast,
  SAccordion,
  SAvatar,
  SProgress,
  SSeparator,
  SCheckbox,
  SSelect,
  SToggle,
  SLabel,
  SRadioGroup,
  SSlider,
  SPagination,
  SBreadcrumb,
  SPopover,
  SContextMenu,
  SInputOTP,
  SBadge,
} from './uiShadcn.js';
import './index.css';
import './showcase.css';

function componentText(type: string): string {
  return type;
}

function DemoGroup({
  name,
  tag,
  type,
  selected,
  onToggle,
  children,
}: {
  name: string;
  tag: string;
  type: string;
  selected: boolean;
  onToggle: (type: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="demo-group">
      <div className="demo-head">
        <Heading level="2" text={name} />
        <button className={`demo-select${selected ? ' on' : ''}`} onClick={() => onToggle(type)}>
          {selected ? '取消' : '选择'}
        </button>
      </div>
      <code className="demo-tag">{tag}</code>
      <div className="demo-box">{children}</div>
    </section>
  );
}

function MiniScene({ children, background = "#0f172a" }: { children: React.ReactNode; background?: string }) {
  return (
    <Scene3D background={background} height="220px" camera="3.2,2.6,3.2">
      {children}
    </Scene3D>
  );
}

export function Showcase() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<'basic' | 'three' | 'shadcn'>('basic');

  function toggleSelect(type: string) {
    const next = !selected[type];
    setSelected({ ...selected, [type]: next });
    window.parent.postMessage(
      {
        source: 'specpulse-showcase',
        action: next ? 'select' : 'deselect',
        type,
        text: componentText(type),
      },
      '*'
    );
  }
  return (
    <Page title="SpecPulse 组件库">
      <Navbar brand="SpecPulse 组件库">
        <button
          className={`tab-btn${tab === 'basic' ? ' active' : ''}`}
          onClick={() => setTab('basic')}
        >
          基础组件
        </button>
        <button
          className={`tab-btn${tab === 'three' ? ' active' : ''}`}
          onClick={() => setTab('three')}
        >
          3D 组件
        </button>
        <button
          className={`tab-btn${tab === 'shadcn' ? ' active' : ''}`}
          onClick={() => setTab('shadcn')}
        >
          高级组件
        </button>
      </Navbar>
      <div className="showcase-hero">
        <div className="showcase-hero-inner">
          <Heading level="1" text="SpecPulse 组件库" />
          <Paragraph text="每个组件都是真实渲染的实例，可在「组件」文档中查看 props 说明。选择组件后即可用于生成。" />
          <div className="showcase-counts">
            <span className="showcase-count">26 基础</span>
            <span className="showcase-count">9 个 3D</span>
            <span className="showcase-count">24 高级</span>
          </div>
        </div>
      </div>

      {tab === 'basic' && (
      <section id="basic">
        <Heading level="2" text="基础组件" />
        <p className="section-desc">常用 UI 构建块：按钮、表单、数据展示、导航等。</p>
        <div className="demo-grid">
          <DemoGroup name="按钮 Button" tag="variant: primary | secondary | danger" type="Button" selected={!!selected.Button} onToggle={toggleSelect}>
            <div className="demo-row">
              <Button label="主要按钮" variant="primary" />
              <Button label="次要按钮" variant="secondary" />
              <Button label="危险按钮" variant="danger" />
            </div>
          </DemoGroup>

          <DemoGroup name="标题 Heading" tag="level: 1 | 2 | 3" type="Heading" selected={!!selected.Heading} onToggle={toggleSelect}>
            <Heading level="1" text="一级标题" />
            <Heading level="2" text="二级标题" />
            <Heading level="3" text="三级标题" />
          </DemoGroup>

          <DemoGroup name="Hero 标题+按钮" tag="level, text + children: Button" type="Hero" selected={!!selected.Hero} onToggle={toggleSelect}>
            <Hero text="欢迎使用产品" level="1">
              <Button label="立即开始" variant="primary" />
              <Button label="了解更多" variant="secondary" />
            </Hero>
          </DemoGroup>

          <DemoGroup name="段落 Paragraph" tag="text" type="Paragraph" selected={!!selected.Paragraph} onToggle={toggleSelect}>
            <Paragraph text="这是一段演示文案，用于展示段落组件的排版与样式效果，适合放置介绍性内容。" />
          </DemoGroup>

          <DemoGroup name="图片 Image" tag="src, width, height, radius" type="Image" selected={!!selected.Image} onToggle={toggleSelect}>
            <Image src="https://picsum.photos/640/320" width="100%" radius="12px" />
          </DemoGroup>

          <DemoGroup name="头像 Avatar" tag="src | name, size" type="Avatar" selected={!!selected.Avatar} onToggle={toggleSelect}>
            <div className="demo-row">
              <Avatar name="Zhang San" size="56px" />
              <Avatar name="Li Si" size="40px" />
            </div>
          </DemoGroup>

          <DemoGroup name="指标 Stat" tag="label, value, unit, tone" type="Stat" selected={!!selected.Stat} onToggle={toggleSelect}>
            <div className="demo-row">
              <Stat label="总收入" value="128" unit="万" tone="success" />
              <Stat label="新增用户" value="2048" tone="info" />
              <Stat label="转化率" value="3.2" unit="%" tone="warning" />
            </div>
          </DemoGroup>

          <DemoGroup name="进度条 Progress" tag="value(0-100), label, tone" type="Progress" selected={!!selected.Progress} onToggle={toggleSelect}>
            <div className="demo-col">
              <Progress label="完成度" value={85} tone="success" />
              <Progress label="风险" value={40} tone="danger" />
            </div>
          </DemoGroup>

          <DemoGroup name="提示条 Alert" tag="text, tone" type="Alert" selected={!!selected.Alert} onToggle={toggleSelect}>
            <div className="demo-col">
              <Alert text="操作成功" tone="success" />
              <Alert text="注意检查配置" tone="warning" />
              <Alert text="出现错误" tone="danger" />
            </div>
          </DemoGroup>

          <DemoGroup name="表格 Table" tag="headers: string[], rows: string[][]" type="Table" selected={!!selected.Table} onToggle={toggleSelect}>
            <Table
              headers={['月份', '营收', '利润']}
              rows={[['一月', '3000', '800'], ['二月', '4500', '1200'], ['三月', '5200', '1500']]}
            />
          </DemoGroup>

          <DemoGroup name="复选框 Checkbox" tag="label, checked" type="Checkbox" selected={!!selected.Checkbox} onToggle={toggleSelect}>
            <div className="demo-col">
              <Checkbox label="订阅产品周报" checked={true} />
              <Checkbox label="开启提醒" />
            </div>
          </DemoGroup>

          <DemoGroup name="下拉选择 Select" tag="label, options, defaultValue" type="Select" selected={!!selected.Select} onToggle={toggleSelect}>
            <Select label="选择城市" options={['北京', '上海', '广州', '深圳']} defaultValue="北京" />
          </DemoGroup>

          <DemoGroup name="引用 Quote" tag="text, author" type="Quote" selected={!!selected.Quote} onToggle={toggleSelect}>
            <Quote text="简单，往往是最好的设计。" author="设计原则" />
          </DemoGroup>

          <DemoGroup name="代码块 CodeBlock" tag="code, language" type="CodeBlock" selected={!!selected.CodeBlock} onToggle={toggleSelect}>
            <CodeBlock code={`const greet = (name: string) => \`你好, \${name}\`;`} language="ts" />
          </DemoGroup>

          <DemoGroup name="步骤条 Steps" tag="items: string[]" type="Steps" selected={!!selected.Steps} onToggle={toggleSelect}>
            <Steps items={['创建项目', '配置内容', '发布上线']} />
          </DemoGroup>

          <DemoGroup name="时间线 Timeline" tag="items: string[]" type="Timeline" selected={!!selected.Timeline} onToggle={toggleSelect}>
            <Timeline items={['2022 加入团队', '2024 晋升资深工程师', '2026 获得最佳项目奖']} />
          </DemoGroup>

          <DemoGroup name="列表 List" tag="items: string[]（或 children）" type="List" selected={!!selected.List} onToggle={toggleSelect}>
            <List ordered={false} items={['支持多行数据', '可作为功能清单', '也可用 ordered 变有序列表']} />
          </DemoGroup>

          <DemoGroup name="角标 Badge" tag="text, tone: success|warning|danger|info" type="Badge" selected={!!selected.Badge} onToggle={toggleSelect}>
            <div className="demo-row">
              <Badge text="成功" tone="success" />
              <Badge text="警告" tone="warning" />
              <Badge text="危险" tone="danger" />
              <Badge text="信息" tone="info" />
            </div>
          </DemoGroup>

          <DemoGroup name="表单 Form" tag="onSubmitLabel + Input/Textarea/Button" type="Form" selected={!!selected.Form} onToggle={toggleSelect}>
            <Form onSubmitLabel="提交">
              <Input label="姓名" placeholder="请输入姓名" />
              <Textarea label="留言" placeholder="请输入留言" rows={2} />
            </Form>
          </DemoGroup>

          <DemoGroup name="卡片 Card" tag="title + children" type="Card" selected={!!selected.Card} onToggle={toggleSelect}>
            <Card title="功能卡片">
              <Paragraph text="卡片用于承载一组相关内容，可以放入任意子组件。" />
            </Card>
          </DemoGroup>

          <DemoGroup name="分隔线 Divider" tag="（无参数）" type="Divider" selected={!!selected.Divider} onToggle={toggleSelect}>
            <Paragraph text="上面" />
            <Divider />
            <Paragraph text="下面" />
          </DemoGroup>
        </div>
      </section>
      )}

      {tab === 'three' && (
      <section id="three">
        <Heading level="2" text="3D 组件" />
        <p className="section-desc">基于 Three.js 的 3D 几何体，支持鼠标拖拽旋转查看。</p>
        <div className="three-grid">
          <DemoGroup name="Scene3D 容器" tag="容器：相机/灯光/背景/旋转；几何体须放入其中" type="Scene3D" selected={!!selected.Scene3D} onToggle={toggleSelect}>
            <MiniScene background="#1e293b">
              <Box3D position="-1.2,0,0" size="0.8,0.8,0.8" rotation="0.3,0.5,0" color="#3b82f6" />
              <Sphere3D position="0,0.5,0" radius="0.6" color="#22d3ee" />
              <Torus3D position="1.2,0,0" radius="0.5" tube="0.2" color="#f59e0b" />
            </MiniScene>
          </DemoGroup>

          <DemoGroup name="Box3D 立方体" tag="position, size, rotation, color" type="Box3D" selected={!!selected.Box3D} onToggle={toggleSelect}>
            <MiniScene background="#0c4a6e">
              <Box3D position="0,-0.5,0" size="1,1,1" rotation="0.4,0.6,0" color="#3b82f6" />
              <Box3D position="0,0.8,0" size="0.6,0.6,0.6" rotation="0.2,0.8,0.1" color="#60a5fa" />
            </MiniScene>
          </DemoGroup>

          <DemoGroup name="Sphere3D 球体" tag="position, radius, color" type="Sphere3D" selected={!!selected.Sphere3D} onToggle={toggleSelect}>
            <MiniScene background="#164e63">
              <Sphere3D position="-0.8,0,0" radius="0.5" color="#22d3ee" />
              <Sphere3D position="0.8,0,0" radius="0.5" color="#06b6d4" />
              <Sphere3D position="0,0.8,0" radius="0.4" color="#67e8f9" />
            </MiniScene>
          </DemoGroup>

          <DemoGroup name="Torus3D 圆环" tag="position, radius, tube, color" type="Torus3D" selected={!!selected.Torus3D} onToggle={toggleSelect}>
            <MiniScene background="#451a03">
              <Torus3D position="0,0,0" radius="0.9" tube="0.25" color="#f59e0b" />
              <Torus3D position="0,0,0" radius="0.6" tube="0.15" color="#fbbf24" />
            </MiniScene>
          </DemoGroup>

          <DemoGroup name="Plane3D 平面" tag="position, size, color（可作地面）" type="Plane3D" selected={!!selected.Plane3D} onToggle={toggleSelect}>
            <MiniScene background="#1e293b">
              <Plane3D position="0,-0.8,0" size="5,5,1" color="#334155" />
              <Box3D position="-1,0,0" size="0.6,0.6,0.6" color="#60a5fa" />
              <Sphere3D position="1,0.2,0" radius="0.4" color="#22d3ee" />
            </MiniScene>
          </DemoGroup>

          <DemoGroup name="Cylinder3D 圆柱" tag="position, radius, height, color" type="Cylinder3D" selected={!!selected.Cylinder3D} onToggle={toggleSelect}>
            <MiniScene background="#500724">
              <Cylinder3D position="-0.7,0,0" radius="0.5" height="1.2" color="#f472b6" />
              <Cylinder3D position="0.7,0,0" radius="0.4" height="1.6" color="#ec4899" />
            </MiniScene>
          </DemoGroup>

          <DemoGroup name="Cone3D 圆锥" tag="position, radius, height, color" type="Cone3D" selected={!!selected.Cone3D} onToggle={toggleSelect}>
            <MiniScene background="#052e16">
              <Cone3D position="0,0,0" radius="0.8" height="1.6" color="#34d399" />
              <Sphere3D position="0,1.2,0" radius="0.3" color="#6ee7b7" />
            </MiniScene>
          </DemoGroup>

          <DemoGroup name="Icosahedron3D 多面体" tag="position, radius, color" type="Icosahedron3D" selected={!!selected.Icosahedron3D} onToggle={toggleSelect}>
            <MiniScene background="#2e1065">
              <Icosahedron3D position="0,0,0" radius="1" color="#a78bfa" />
              <Sphere3D position="0,0,0" radius="0.5" color="#c4b5fd" />
            </MiniScene>
          </DemoGroup>

          <DemoGroup name="TorusKnot3D 环形结" tag="position, radius, tube, color" type="TorusKnot3D" selected={!!selected.TorusKnot3D} onToggle={toggleSelect}>
            <MiniScene background="#4c0519">
              <TorusKnot3D position="0,0,0" radius="0.8" tube="0.25" color="#fb7185" />
            </MiniScene>
          </DemoGroup>
        </div>
      </section>
      )}

      {tab === 'shadcn' && (
      <section id="shadcn">
        <Heading level="2" text="高级组件（shadcn/ui）" />
        <p className="section-desc">基于 Radix UI + Tailwind CSS 的交互组件，提供更丰富的 UI 模式。</p>
        <div className="demo-grid">
          <DemoGroup name="对话框 Dialog" tag="trigger, title, description, content" type="SDialog" selected={!!selected.SDialog} onToggle={toggleSelect}>
            <SDialog trigger="打开对话框" title="确认操作" description="此操作不可撤销，是否继续？" content="对话框可以承载需要用户确认或填写的信息。" />
          </DemoGroup>

          <DemoGroup name="选项卡 Tabs" tag="labels: string[], contents: string[]" type="STabs" selected={!!selected.STabs} onToggle={toggleSelect}>
            <STabs labels={['概览', '详情', '设置']} contents={['这是概览内容，展示关键数据摘要。', '这是详情内容，包含完整的业务信息。', '这是设置内容，用于调整偏好配置。']} />
          </DemoGroup>

          <DemoGroup name="开关 Switch" tag="label, checked" type="SSwitch" selected={!!selected.SSwitch} onToggle={toggleSelect}>
            <div className="demo-col">
              <SSwitch label="启用通知" />
              <SSwitch label="深色模式" checked={true} />
            </div>
          </DemoGroup>

          <DemoGroup name="骨架屏 Skeleton" tag="width, height, radius" type="SSkeleton" selected={!!selected.SSkeleton} onToggle={toggleSelect}>
            <div className="demo-col" style={{ gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <SSkeleton width="48px" height="48px" radius="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <SSkeleton width="60%" height="16px" />
                  <SSkeleton width="40%" height="14px" />
                </div>
              </div>
              <SSkeleton width="100%" height="80px" radius="8px" />
            </div>
          </DemoGroup>

          <DemoGroup name="工具提示 Tooltip" tag="trigger, content" type="STooltip" selected={!!selected.STooltip} onToggle={toggleSelect}>
            <STooltip trigger="悬停查看提示" content="这是一段工具提示内容" />
          </DemoGroup>

          <DemoGroup name="下拉菜单 DropdownMenu" tag="trigger, items: string[]" type="SDropdownMenu" selected={!!selected.SDropdownMenu} onToggle={toggleSelect}>
            <SDropdownMenu trigger="操作菜单" items={['编辑', '复制', '收藏', '删除']} />
          </DemoGroup>

          <DemoGroup name="侧边面板 Sheet" tag="trigger, title, content" type="SSheet" selected={!!selected.SSheet} onToggle={toggleSelect}>
            <SSheet trigger="打开侧边面板" title="通知中心" content="这里是侧边面板的内容区域，适合放置详情、设置或辅助信息。" />
          </DemoGroup>

          <DemoGroup name="通知 Toast" tag="trigger, text, tone" type="SToast" selected={!!selected.SToast} onToggle={toggleSelect}>
            <div className="demo-row">
              <SToast trigger="成功通知" text="保存成功" tone="success" />
              <SToast trigger="警告通知" text="请注意检查配置" tone="warning" />
              <SToast trigger="错误通知" text="操作失败，请重试" tone="danger" />
            </div>
          </DemoGroup>

          <DemoGroup name="手风琴 Accordion" tag="items: string[], contents: string[]" type="SAccordion" selected={!!selected.SAccordion} onToggle={toggleSelect}>
            <SAccordion items={['什么是 SpecPulse？', '支持哪些组件？', '如何开始使用？']} contents={['SpecPulse 是一个自然语言驱动的 UI 生成器。', '支持基础组件、3D 组件和 shadcn 高级组件三大类。', '描述你想要的界面，点击生成即可。']} />
          </DemoGroup>

          <DemoGroup name="头像 Avatar" tag="src, name, size" type="SAvatar" selected={!!selected.SAvatar} onToggle={toggleSelect}>
            <div className="demo-row">
              <SAvatar name="Zhang San" size="48px" />
              <SAvatar name="Li Si" size="40px" />
              <SAvatar name="Wang Wu" size="32px" />
            </div>
          </DemoGroup>

          <DemoGroup name="进度条 Progress" tag="value(0-100), label, tone" type="SProgress" selected={!!selected.SProgress} onToggle={toggleSelect}>
            <div className="demo-col">
              <SProgress label="项目进度" value={72} tone="default" />
              <SProgress label="磁盘使用" value={85} tone="danger" />
              <SProgress value={45} tone="warning" />
            </div>
          </DemoGroup>

          <DemoGroup name="分隔线 Separator" tag="orientation, label" type="SSeparator" selected={!!selected.SSeparator} onToggle={toggleSelect}>
            <div className="demo-col">
              <SSeparator />
              <SSeparator label="或者" />
            </div>
          </DemoGroup>

          <DemoGroup name="复选框 Checkbox" tag="label, checked" type="SCheckbox" selected={!!selected.SCheckbox} onToggle={toggleSelect}>
            <div className="demo-col">
              <SCheckbox label="同意服务条款" checked={true} />
              <SCheckbox label="订阅邮件通知" />
            </div>
          </DemoGroup>

          <DemoGroup name="下拉选择 Select" tag="label, options, placeholder" type="SSelect" selected={!!selected.SSelect} onToggle={toggleSelect}>
            <SSelect label="选择框架" options={['React', 'Vue', 'Svelte', 'Angular']} placeholder="请选择…" />
          </DemoGroup>

          <DemoGroup name="切换按钮 Toggle" tag="label, variant" type="SToggle" selected={!!selected.SToggle} onToggle={toggleSelect}>
            <div className="demo-row">
              <SToggle label="B" />
              <SToggle label="I" variant="outline" />
              <SToggle label="U" pressed={true} />
            </div>
          </DemoGroup>

          <DemoGroup name="表单标签 Label" tag="text, hint" type="SLabel" selected={!!selected.SLabel} onToggle={toggleSelect}>
            <div className="demo-col">
              <SLabel text="用户名" hint="请输入 4-16 位字符" />
              <SLabel text="邮箱地址" />
            </div>
          </DemoGroup>

          <DemoGroup name="单选组 RadioGroup" tag="label, options: string[]" type="SRadioGroup" selected={!!selected.SRadioGroup} onToggle={toggleSelect}>
            <SRadioGroup label="选择套餐" options={['基础版', '专业版', '企业版']} defaultValue="专业版" />
          </DemoGroup>

          <DemoGroup name="滑块 Slider" tag="label, min, max, step, value" type="SSlider" selected={!!selected.SSlider} onToggle={toggleSelect}>
            <div className="demo-col">
              <SSlider label="音量" min={0} max={100} value={60} />
              <SSlider label="亮度" min={0} max={100} step={10} value={40} />
            </div>
          </DemoGroup>

          <DemoGroup name="分页 Pagination" tag="total" type="SPagination" selected={!!selected.SPagination} onToggle={toggleSelect}>
            <SPagination total={20} />
          </DemoGroup>

          <DemoGroup name="面包屑 Breadcrumb" tag="items: string[], separator" type="SBreadcrumb" selected={!!selected.SBreadcrumb} onToggle={toggleSelect}>
            <SBreadcrumb items={['首页', '产品', '详情页']} separator="/" />
          </DemoGroup>

          <DemoGroup name="弹出面板 Popover" tag="trigger, title, content" type="SPopover" selected={!!selected.SPopover} onToggle={toggleSelect}>
            <SPopover trigger="点击弹出" title="快捷操作" content="这里可以放置快捷操作、筛选条件等浮层内容。" />
          </DemoGroup>

          <DemoGroup name="右键菜单 ContextMenu" tag="items: string[], hint" type="SContextMenu" selected={!!selected.SContextMenu} onToggle={toggleSelect}>
            <SContextMenu items={['复制', '粘贴', '剪切', '删除']} hint="在此区域右键点击" />
          </DemoGroup>

          <DemoGroup name="验证码 InputOTP" tag="label, length(4-8)" type="SInputOTP" selected={!!selected.SInputOTP} onToggle={toggleSelect}>
            <SInputOTP label="请输入验证码" length={6} />
          </DemoGroup>

          <DemoGroup name="标签徽章 Badge" tag="text, tone, variant" type="SBadge" selected={!!selected.SBadge} onToggle={toggleSelect}>
            <div className="demo-row" style={{ flexWrap: 'wrap' }}>
              <SBadge text="默认" tone="default" />
              <SBadge text="成功" tone="success" />
              <SBadge text="警告" tone="warning" />
              <SBadge text="危险" tone="danger" />
              <SBadge text="描边" tone="default" variant="outline" />
              <SBadge text="成功描边" tone="success" variant="outline" />
            </div>
          </DemoGroup>
        </div>
      </section>
      )}

      <Footer text="© 2026 SpecPulse · 组件库" />
    </Page>
  );
}

// Standalone entry (showcase.html). When embedded in the console's preview
// iframe, PreviewRoot renders <Showcase/> directly — no duplicate mount.
if (typeof window !== 'undefined' && window.location.pathname.endsWith('showcase.html')) {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <Showcase />
    </React.StrictMode>,
  );
}
