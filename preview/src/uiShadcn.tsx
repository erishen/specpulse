import React, { useState } from 'react';
import { sanitizeUrl } from './url.js';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { X, ChevronDown, ChevronLeft, ChevronRight, Menu, Check, ChevronUp, MoreHorizontal } from 'lucide-react';
import { cn } from './lib/utils.js';

type UIProps = Record<string, unknown> & { children?: React.ReactNode };

function pick(props: UIProps, key: string, fallback = ''): string {
  const value = props[key];
  return typeof value === 'string' ? value : fallback;
}

/* ─── Dialog ──────────────────────────────────────────────────── */

export function SDialog(props: UIProps) {
  const trigger = pick(props, 'trigger', '打开');
  const title = pick(props, 'title', '提示');
  const description = pick(props, 'description', '');
  const content = pick(props, 'content', '');

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">
          {trigger}
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg">
          <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          )}
          {content && <p className="mt-4 text-sm">{content}</p>}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ─── Tabs ────────────────────────────────────────────────────── */

export function STabs(props: UIProps) {
  const labels = Array.isArray(props.labels) ? props.labels.map(String) : ['Tab 1', 'Tab 2', 'Tab 3'];
  const contents = Array.isArray(props.contents) ? props.contents.map(String) : [];

  return (
    <TabsPrimitive.Root defaultValue={labels[0] ?? 'Tab 1'} className="w-full">
      <TabsPrimitive.List className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        {labels.map((label) => (
          <TabsPrimitive.Trigger
            key={label}
            value={label}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            {label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {labels.map((label, i) => (
        <TabsPrimitive.Content
          key={label}
          value={label}
          className="mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <p className="text-sm text-muted-foreground">{contents[i] ?? `内容 ${i + 1}`}</p>
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

/* ─── Switch ──────────────────────────────────────────────────── */

export function SSwitch(props: UIProps) {
  const label = pick(props, 'label', '开关');
  const [checked, setChecked] = useState(props.checked === true || props.checked === 'true');

  return (
    <div className="flex items-center gap-3">
      <SwitchPrimitives.Root
        checked={checked}
        onCheckedChange={setChecked}
        className={cn(
          'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-input',
        )}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </SwitchPrimitives.Root>
      <span className="text-sm font-medium leading-none">{label}</span>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────── */

export function SSkeleton(props: UIProps) {
  const width = pick(props, 'width', '100%');
  const height = pick(props, 'height', '20px');
  const radius = pick(props, 'radius', '4px');

  return (
    <div
      className="animate-pulse bg-muted rounded"
      style={{ width, height, borderRadius: radius }}
    />
  );
}

/* ─── Tooltip ─────────────────────────────────────────────────── */

export function STooltip(props: UIProps) {
  const trigger = pick(props, 'trigger', '悬停');
  const content = pick(props, 'content', '提示内容');

  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <button className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
            {trigger}
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

/* ─── DropdownMenu ────────────────────────────────────────────── */

export function SDropdownMenu(props: UIProps) {
  const trigger = pick(props, 'trigger', '选项菜单');
  const items = Array.isArray(props.items) ? props.items.map(String) : ['操作一', '操作二', '操作三'];

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
          {trigger}
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          {items.map((item, i) => (
            <DropdownMenuPrimitive.Item
              key={i}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              {item}
            </DropdownMenuPrimitive.Item>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

/* ─── Sheet (侧边抽屉) ───────────────────────────────────────── */

export function SSheet(props: UIProps) {
  const trigger = pick(props, 'trigger', '打开面板');
  const title = pick(props, 'title', '侧边面板');
  const content = pick(props, 'content', '这是侧边面板的内容区域。');
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">
          <Menu className="h-4 w-4" />
          {trigger}
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-border bg-background p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DialogPrimitive.Title className="text-lg font-semibold">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-sm opacity-70 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="text-sm text-muted-foreground">
            {content}
          </DialogPrimitive.Description>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ─── Toast (通知提示) ────────────────────────────────────────── */

export function SToast(props: UIProps) {
  const trigger = pick(props, 'trigger', '显示通知');
  const text = pick(props, 'text', '操作成功');
  const tone = pick(props, 'tone', 'default');

  const [visible, setVisible] = useState(false);

  const toneClasses: Record<string, string> = {
    default: 'border-border bg-background text-foreground',
    success: 'border-green-200 bg-green-50 text-green-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
  };

  return (
    <div className="relative">
      <button
        className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
        onClick={() => {
          setVisible(true);
          setTimeout(() => setVisible(false), 3000);
        }}
      >
        {trigger}
      </button>
      {visible && (
        <div className={cn(
          'fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-3 shadow-lg transition-all',
          toneClasses[tone] ?? toneClasses.default,
        )}>
          <p className="text-sm font-medium">{text}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Accordion (手风琴折叠) ──────────────────────────────────── */

export function SAccordion(props: UIProps) {
  const items = Array.isArray(props.items) ? props.items.map(String) : ['第一章节', '第二章节', '第三章节'];
  const contents = Array.isArray(props.contents) ? props.contents.map(String) : [];
  const collapsible = props.collapsible !== false && props.collapsible !== 'false';
  const type = props.type === 'multiple' ? 'multiple' : 'single';

  return (
    <AccordionPrimitive.Root
      type={type}
      collapsible={collapsible}
      className="w-full space-y-2"
    >
      {items.map((item, i) => (
        <AccordionPrimitive.Item
          key={i}
          value={item}
          className="rounded-lg border border-border bg-background"
        >
          <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between px-4 py-3 text-sm font-medium hover:underline [&[data-state=open]>svg]:rotate-180">
              {item}
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="px-4 pb-3 pt-0 text-muted-foreground">
              {contents[i] ?? `${item} 的内容`}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}

/* ─── Avatar (头像) ───────────────────────────────────────────── */

export function SAvatar(props: UIProps) {
  const src = sanitizeUrl(pick(props, 'src', ''));
  const name = pick(props, 'name', 'U');
  const size = pick(props, 'size', '40px');

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AvatarPrimitive.Root
      className="relative flex shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <AvatarPrimitive.Image
        src={src}
        alt={name}
        className="aspect-square h-full w-full object-cover"
      />
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

/* ─── Progress (进度条) ───────────────────────────────────────── */

export function SProgress(props: UIProps) {
  const raw = typeof props.value === 'number' ? props.value : parseFloat(pick(props, 'value', '50'));
  const value = Math.min(100, Math.max(0, isNaN(raw) ? 50 : raw));
  const label = pick(props, 'label', '');
  const tone = pick(props, 'tone', 'default');

  const indicatorClass: Record<string, string> = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">{Math.round(value)}%</span>
        </div>
      )}
      <ProgressPrimitive.Root
        value={value}
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <ProgressPrimitive.Indicator
          className={cn('h-full w-full flex-1 transition-all rounded-full', indicatorClass[tone] ?? indicatorClass.default)}
          style={{ transform: `translateX(-${100 - value}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}

/* ─── Separator (分隔线) ──────────────────────────────────────── */

export function SSeparator(props: UIProps) {
  const orientation = pick(props, 'orientation', 'horizontal') as 'horizontal' | 'vertical';
  const label = pick(props, 'label', '');

  if (label) {
    return (
      <div className="flex items-center gap-3 w-full">
        <SeparatorPrimitive.Root orientation="horizontal" className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground shrink-0">{label}</span>
        <SeparatorPrimitive.Root orientation="horizontal" className="flex-1 h-px bg-border" />
      </div>
    );
  }

  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      )}
    />
  );
}

/* ─── Checkbox (复选框) ───────────────────────────────────────── */

export function SCheckbox(props: UIProps) {
  const label = pick(props, 'label', '选项');
  const [checked, setChecked] = useState(props.checked === true || props.checked === 'true');

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <CheckboxPrimitive.Root
        checked={checked}
        onCheckedChange={(c) => setChecked(c === true)}
        className="peer h-4 w-4 shrink-0 rounded border border-primary shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <Check className="h-3 w-3" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <span className="text-sm font-medium leading-none">{label}</span>
    </label>
  );
}

/* ─── Select (下拉选择) ───────────────────────────────────────── */

export function SSelect(props: UIProps) {
  const label = pick(props, 'label', '选择');
  const placeholder = pick(props, 'placeholder', '请选择…');
  const options = Array.isArray(props.options) ? props.options.map(String) : ['选项一', '选项二', '选项三'];
  const defaultValue = pick(props, 'defaultValue', options[0] ?? '');

  return (
    <div className="w-full space-y-1.5">
      {label && <LabelPrimitive.Root className="text-sm font-medium">{label}</LabelPrimitive.Root>}
      <SelectPrimitive.Root defaultValue={defaultValue}>
        <SelectPrimitive.Trigger className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt}
                  value={opt}
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-3 w-3" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{opt}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}

/* ─── Toggle (切换按钮) ───────────────────────────────────────── */

export function SToggle(props: UIProps) {
  const label = pick(props, 'label', 'B');
  const variant = pick(props, 'variant', 'default');
  const [pressed, setPressed] = useState(props.pressed === true || props.pressed === 'true');

  const variantClass = variant === 'outline'
    ? 'border border-border bg-transparent data-[state=on]:bg-accent data-[state=on]:text-accent-foreground'
    : 'bg-transparent data-[state=on]:bg-accent data-[state=on]:text-accent-foreground';

  return (
    <TogglePrimitive.Root
      pressed={pressed}
      onPressedChange={setPressed}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variantClass,
      )}
    >
      {label}
    </TogglePrimitive.Root>
  );
}

/* ─── Label (表单标签) ────────────────────────────────────────── */

export function SLabel(props: UIProps) {
  const text = pick(props, 'text', '标签');
  const hint = pick(props, 'hint', '');

  return (
    <div className="space-y-1">
      <LabelPrimitive.Root className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {text}
      </LabelPrimitive.Root>
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/* ─── RadioGroup (单选组) ─────────────────────────────────────── */

export function SRadioGroup(props: UIProps) {
  const label = pick(props, 'label', '');
  const options = Array.isArray(props.options) ? props.options.map(String) : ['选项一', '选项二', '选项三'];
  const defaultValue = pick(props, 'defaultValue', options[0] ?? '');

  return (
    <div className="w-full space-y-2">
      {label && <LabelPrimitive.Root className="text-sm font-medium">{label}</LabelPrimitive.Root>}
      <RadioGroupPrimitive.Root defaultValue={defaultValue} className="flex flex-col gap-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <RadioGroupPrimitive.Item
              value={opt}
              className="aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </RadioGroupPrimitive.Root>
    </div>
  );
}

/* ─── Slider (滑块) ───────────────────────────────────────────── */

export function SSlider(props: UIProps) {
  const label = pick(props, 'label', '');
  const rawMin = typeof props.min === 'number' ? props.min : parseFloat(pick(props, 'min', '0'));
  const rawMax = typeof props.max === 'number' ? props.max : parseFloat(pick(props, 'max', '100'));
  const rawStep = typeof props.step === 'number' ? props.step : parseFloat(pick(props, 'step', '1'));
  const rawVal = typeof props.value === 'number' ? props.value : parseFloat(pick(props, 'value', '50'));
  const min = isNaN(rawMin) ? 0 : rawMin;
  const max = isNaN(rawMax) ? 100 : rawMax;
  const step = isNaN(rawStep) ? 1 : rawStep;
  const value = isNaN(rawVal) ? 50 : Math.min(max, Math.max(min, rawVal));
  const [val, setVal] = useState(value);

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">{val}</span>
        </div>
      )}
      <SliderPrimitive.Root
        value={[val]}
        onValueChange={([v]) => setVal(v)}
        min={min}
        max={max}
        step={step}
        className="relative flex w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    </div>
  );
}

/* ─── Pagination (分页) ───────────────────────────────────────── */

export function SPagination(props: UIProps) {
  const rawTotal = typeof props.total === 'number' ? props.total : parseInt(pick(props, 'total', '10'), 10);
  const total = isNaN(rawTotal) ? 10 : Math.max(1, rawTotal);
  const [current, setCurrent] = useState(1);

  const pages: (number | '...')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push('...');
    pages.push(total);
  }

  const btnBase = 'inline-flex items-center justify-center rounded-md text-sm h-8 min-w-[2rem] px-2 transition-colors';

  return (
    <nav className="flex items-center gap-1">
      <button
        className={cn(btnBase, 'border border-border hover:bg-accent', current <= 1 && 'opacity-50 pointer-events-none')}
        onClick={() => setCurrent((c) => Math.max(1, c - 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="px-1 text-muted-foreground text-sm">…</span>
        ) : (
          <button
            key={p}
            className={cn(btnBase, p === current ? 'bg-primary text-primary-foreground font-medium' : 'border border-border hover:bg-accent')}
            onClick={() => setCurrent(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        className={cn(btnBase, 'border border-border hover:bg-accent', current >= total && 'opacity-50 pointer-events-none')}
        onClick={() => setCurrent((c) => Math.min(total, c + 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

/* ─── Breadcrumb (面包屑) ─────────────────────────────────────── */

export function SBreadcrumb(props: UIProps) {
  const items = Array.isArray(props.items) ? props.items.map(String) : ['首页', '分类', '当前页'];
  const separator = pick(props, 'separator', '/');

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-muted-foreground text-xs">{separator}</span>}
          <span
            className={cn(
              i === items.length - 1
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground cursor-pointer transition-colors',
            )}
          >
            {item}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}

/* ─── Popover (弹出面板) ──────────────────────────────────────── */

export function SPopover(props: UIProps) {
  const trigger = pick(props, 'trigger', '打开');
  const title = pick(props, 'title', '');
  const content = pick(props, 'content', '弹出内容');

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
          {trigger}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content className="z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}
          <p className="text-sm text-muted-foreground">{content}</p>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/* ─── ContextMenu (右键菜单) ──────────────────────────────────── */

export function SContextMenu(props: UIProps) {
  const items = Array.isArray(props.items) ? props.items.map(String) : ['复制', '粘贴', '剪切'];
  const hint = pick(props, 'hint', '右键点击此区域');

  return (
    <ContextMenuPrimitive.Root>
      <ContextMenuPrimitive.Trigger>
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border px-8 py-6 text-sm text-muted-foreground select-none">
          {hint}
        </div>
      </ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          {items.map((item, i) => (
            <ContextMenuPrimitive.Item
              key={i}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              {item}
            </ContextMenuPrimitive.Item>
          ))}
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  );
}

/* ─── InputOTP (验证码输入) ───────────────────────────────────── */

export function SInputOTP(props: UIProps) {
  const label = pick(props, 'label', '验证码');
  const rawLen = typeof props.length === 'number' ? props.length : parseInt(pick(props, 'length', '6'), 10);
  const len = isNaN(rawLen) ? 6 : Math.min(8, Math.max(4, rawLen));
  const [values, setValues] = useState<string[]>(() => Array(len).fill(''));

  function handleChange(i: number, v: string) {
    if (v.length > 1) return;
    const next = [...values];
    next[i] = v;
    setValues(next);
    if (v && i < len - 1) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      const el = document.getElementById(`otp-${i - 1}`);
      el?.focus();
    }
  }

  return (
    <div className="w-full space-y-2">
      {label && <LabelPrimitive.Root className="text-sm font-medium">{label}</LabelPrimitive.Root>}
      <div className="flex gap-2">
        {Array.from({ length: len }, (_, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={values[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-center text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Badge (标签徽章) ────────────────────────────────────────── */

export function SBadge(props: UIProps) {
  const text = pick(props, 'text', '标签');
  const tone = pick(props, 'tone', 'default');
  const variant = pick(props, 'variant', 'filled');

  const tones: Record<string, string> = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    success: 'border-transparent bg-green-100 text-green-800',
    warning: 'border-transparent bg-amber-100 text-amber-800',
    danger: 'border-transparent bg-red-100 text-red-800',
    outline: 'border-border text-foreground',
  };

  const outlineTones: Record<string, string> = {
    default: 'border-primary text-primary bg-primary/5',
    secondary: 'border-secondary text-secondary-foreground bg-secondary/5',
    success: 'border-green-300 text-green-700 bg-green-50',
    warning: 'border-amber-300 text-amber-700 bg-amber-50',
    danger: 'border-red-300 text-red-700 bg-red-50',
    outline: 'border-border text-foreground',
  };

  const classes = variant === 'outline'
    ? (outlineTones[tone] ?? outlineTones.default)
    : (tones[tone] ?? tones.default);

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
      classes,
    )}>
      {text}
    </span>
  );
}
