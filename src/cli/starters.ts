import OpenAI from 'openai';
import 'dotenv/config';

const DEFAULT_STARTERS = [
  '做一个深色 3D 落地页：导航(品牌+定价+文档)、大标题、副标题、CTA 按钮、3D 场景(蓝色立方体+青色球体+金色圆环+深色地面)、三张功能卡片、页脚标语',
  '做定价页：大标题、三张价格卡片(基础/专业/企业，各带价格 Badge、功能列表、CTA)，专业版主色高亮',
  '做一个简洁登录页：大标题「欢迎回来」、邮箱和密码输入框、登录按钮、注册提示',
  '做数据看板：标题「业务概览」、四张指标卡片(总收入/新增用户/转化率/活跃度)、三张列表卡片',
  '做产品 3D 展厅：大标题、3D 场景(红色圆环+银色球体+蓝色立方体错落摆放)、产品规格列表、购买按钮',
  '做活动报名页：活动信息卡片(日期+地点+名额 Badge)、报名表单(姓名、邮箱、备注)、提交按钮',
];

const STARTERS_SYSTEM = `你是 SpecPulse 的示例提示词生成器。根据可用的 UI 组件类型，生成 6 条多样化的示例提示词，帮助用户快速体验不同页面类型的生成效果。

要求：
- 用中文
- 每条 30-80 字，一句话描述页面结构和关键组件
- 覆盖不同场景：落地页、仪表盘、表单、定价页、展示页、社交页等
- 自然提及组件名称（如导航、卡片、Badge、3D 场景、表单、表格等）
- 每条风格/配色/布局不同

返回 JSON 数组，格式：["提示词1", "提示词2", ...]，共 6 条，不要其他内容。`;

async function main() {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY;
  if (!apiKey) {
    console.log(JSON.stringify(DEFAULT_STARTERS));
    return;
  }

  try {
    const baseURL = process.env.OPENAI_BASE_URL ?? process.env.LLM_BASE_URL;
    const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
    const model = process.env.OPENAI_MODEL ?? process.env.LLM_MODEL ?? 'gpt-4o-mini';

    const response = await client.chat.completions.create({
      model,
      temperature: 0.9,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: STARTERS_SYSTEM },
        { role: 'user', content: '请生成 6 条新的示例提示词。' },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('no content');

    const parsed = JSON.parse(content);
    let arr: string[];
    if (Array.isArray(parsed)) {
      arr = parsed.filter((s): s is string => typeof s === 'string');
    } else if (parsed && typeof parsed === 'object') {
      const firstArray = Object.values(parsed).find(Array.isArray);
      arr = (firstArray ?? []).filter((s): s is string => typeof s === 'string');
    } else {
      arr = [];
    }
    if (arr.length < 3) throw new Error('too few starters');
    console.log(JSON.stringify(arr.slice(0, 6)));
  } catch {
    console.log(JSON.stringify(DEFAULT_STARTERS));
  }
}

main();
