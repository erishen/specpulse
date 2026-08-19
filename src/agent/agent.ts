import 'dotenv/config';
import OpenAI from 'openai';
import { readFileSync } from 'node:fs';
import { isUINode, type UISpec } from '../spec/types.js';

interface CatalogEntry {
  type: string;
  summary: string;
  prompt: string;
}

interface Catalog {
  categories: { name: string; components: CatalogEntry[] }[];
}

const CATALOG = JSON.parse(
  readFileSync(new URL('../spec/catalog.json', import.meta.url), 'utf8'),
) as Catalog;

/** The LLM vocab is derived from catalog.json so prompt and UI stay in sync. */
const VOCAB = `Available element types: ${CATALOG.categories
  .flatMap((c) => c.components)
  .map((c) => c.type)
  .join(', ')}.
Common props by type:
${CATALOG.categories
  .map((c) => c.components.map((cc) => `- ${cc.type}: ${cc.prompt}`).join('\n'))
  .join('\n')}

Never invent element types outside the list. For repeated rows, use List.`;

const SYSTEM_PROMPT = `You are SpecPulse, a specialist that turns natural language UI requests into a declarative JSON structure.

${VOCAB}

## Page Theme (pick one on the root Page)
Set the Page.theme prop. Choose based on the user's intent:
- "light" (default) — clean white/gray, business, forms, dashboards.
- "dark" — pure dark background, developer tools, terminal-ish, minimal.
- "midnight" — deep navy with indigo/purple glows. Best for tech products, 3D scenes, premium landing pages.
- "aurora" — dark gradient with cyan/pink glow accents. Best for creative, gaming, futuristic.

## Mandatory Page Structure
A complete page must NOT be a single vertical stack. Build a full page skeleton:
1. Navbar (brand + Link items) at the top.
2. Hero (Heading level=1 + supporting Paragraph + primary/secondary Buttons).
3. Body sections wrapped in Grid/Row/Card — never loose elements.
4. Footer at the bottom.

## Layout Rules (CRITICAL)
- NEVER stack everything vertically. Use Row and Grid containers to create professional layouts.
- Use Grid(cols=2|3|4) for: stat cards, feature cards, pricing cards, dashboard widgets, any repeated card pattern.
- Use Row for: horizontal button groups, inline label+value pairs, nav items, side-by-side content.
- Wrap related cards in a Grid. Example: 4 stat cards → Grid(cols=4) > [Stat, Stat, Stat, Stat].
- Use Row(gap="24px", align="center") for hero sections with title + buttons.
- Give each section a Heading(level=2) so the page has clear visual rhythm.

## Design Principles
- Visual hierarchy: Heading(level=1) for page title, Heading(level=2) for section titles, Heading(level=3) for card titles.
- Spacing: Use gap props on Row/Grid (16px-24px typical). Don't cram elements together.
- Grouping: Related items go inside a Card. Use Card(title="...") to label groups.
- Color: Use Badge/Alert tones (success/warning/danger/info) semantically, not randomly.
- Balance: Distribute content evenly. If you have 3+ similar items, use Grid.
- 3D: if a request involves product display / tech / futuristic, add a Scene3D and place it in the hero or a dedicated section.
- Form: a Form with onSubmitLabel ALREADY renders its own submit button. NEVER put a Button inside a Form — that creates a duplicate submit button. Put Input/Textarea (and optional checkbox) as the Form's children only.

## className for Fine-tuning
Any component accepts a className prop. Available special values:
- "highlighted" — use on a Card to make it stand out (gradient border, elevated shadow, scaled up). Perfect for pricing "recommended" cards or featured items.
- "mt-4" / "mb-6" for vertical spacing adjustments
- "w-full" for full-width elements
- "text-center" for centered text

Reply with ONLY a JSON object matching this shape, no markdown:
{"title":"<human readable page title>","root":{"type":"...","props":{...},"children":[...]}}.
"children" is an OPTIONAL top-level array of nested element nodes.`;

const REFERENCE_SYSTEM_PROMPT = `You are SpecPulse, a specialist that analyzes UI screenshots/mockups and recreates them as declarative JSON structures.

Analyze the provided image carefully:
- Identify the layout structure (header, main content, sidebar, footer)
- Recognize UI components (buttons, inputs, cards, lists, tables, etc.)
- Note the visual hierarchy and spacing
- Extract text content where visible

Recreate this UI using the available component types below. Match the layout and content as closely as possible.

${VOCAB}

## Page Theme (pick one on the root Page)
Set Page.theme: "light" | "dark" | "midnight" | "aurora". For screenshots that are dark or have colored glows, prefer "midnight" or "aurora"; for light/mostly-white UIs, use "light".

## Layout Rules (CRITICAL)
- Use Grid(cols=N) for repeated card/widget patterns.
- Use Row for horizontal element groups.
- Preserve the original layout structure (columns, rows, grids).
- Include a Navbar and Footer when the reference has them.

Reply with ONLY a JSON object matching this shape, no markdown:
{"title":"<human readable page title>","root":{"type":"...","props":{...},"children":[...]}}.
"children" is an OPTIONAL top-level array of nested element nodes.`;

const ADJUST_SYSTEM_PROMPT = `You are SpecPulse, a specialist that iteratively refines an EXISTING declarative UI spec.

You will receive the current spec (JSON) and a change request. Return the COMPLETE updated spec as JSON, no markdown. Keep every part the user did NOT ask to change EXACTLY as it was — only apply the requested changes. Follow this shape:
{"title":"<human readable page title>","root":{"type":"...","props":{...},"children":[...]}}.
"children" is an OPTIONAL top-level array of nested element nodes.

## Element references
The user may refer to specific elements by path reference like "#1.2" meaning root.children[1].children[2]. Such references have already been expanded into concrete descriptions like "#1.2 [Heading「产品规格」]". When a change mentions "这个元素/它/当前元素", apply the change to that element.

## Relative insertion
- "在 XX 上面/前面" → insert BEFORE that sibling; "在 XX 下面/后面" → insert AFTER that sibling.
- "在 XX 左边/右边" → same row order: before/after within a Row/Grid sibling list.
- When inserting into an element, keep the existing children's order and insert the new node at the requested position.
- Keep using Row/Grid for multiple items in one line; do not drop layout containers when adding siblings.

${VOCAB}`;

export interface AgentOptions {
  model?: string;
}

/** Image input for vision-based generation */
export interface ImageInput {
  /** Base64 data URL (e.g., "data:image/png;base64,...") or HTTP URL */
  url: string;
  /** Optional detail level for vision processing */
  detail?: 'low' | 'high' | 'auto';
}

function parseSpec(content: string): UISpec {
  let raw: { title?: unknown; root?: unknown };
  try {
    raw = JSON.parse(content) as { title?: unknown; root?: unknown };
  } catch {
    throw new Error('[specpulse] LLM 返回的内容不是合法 JSON，请重试');
  }
  if (typeof raw.title !== 'string' || !isUINode(raw.root)) {
    throw new Error('[specpulse] LLM 输出未通过 spec 结构校验，请重试');
  }
  return { title: raw.title, root: raw.root };
}

export function createAgent(options: AgentOptions = {}) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('[specpulse] OPENAI_API_KEY is not set. Copy .env.example to .env first.');
  }
  const baseURL = process.env.OPENAI_BASE_URL ?? process.env.LLM_BASE_URL;
  const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  const model =
    options.model ?? process.env.OPENAI_MODEL ?? process.env.LLM_MODEL ?? 'gpt-4o-mini';

  // Vision model may use a different API key / base URL (e.g., different provider)
  const visionModel =
    process.env.OPENAI_VISION_MODEL ?? process.env.LLM_VISION_MODEL ?? model;
  const visionApiKey = process.env.OPENAI_VISION_API_KEY ?? process.env.LLM_VISION_API_KEY ?? apiKey;
  const visionBaseURL = process.env.OPENAI_VISION_BASE_URL ?? process.env.LLM_VISION_BASE_URL ?? baseURL;
  const visionClient =
    visionApiKey === apiKey && visionBaseURL === baseURL
      ? client
      : new OpenAI({ apiKey: visionApiKey, ...(visionBaseURL ? { baseURL: visionBaseURL } : {}) });

  return {
    /** Get the configured model names for display */
    getModels() {
      return { text: model, vision: visionModel };
    },

    async promptToSpec(prompt: string): Promise<UISpec> {
      const response = await client.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      });
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('[specpulse] LLM returned no content');
      return parseSpec(content);
    },

    /**
     * Generate a UISpec from a reference image (screenshot/mockup).
     * Requires a vision-capable model (e.g., gpt-4o, gpt-4-vision-preview).
     * Uses OPENAI_VISION_MODEL or LLM_VISION_MODEL env var, falls back to main model.
     */
    async referenceToSpec(
      image: ImageInput,
      additionalPrompt?: string,
    ): Promise<UISpec> {
      const userContent: OpenAI.ChatCompletionContentPart[] = [
        {
          type: 'image_url',
          image_url: {
            url: image.url,
            detail: image.detail ?? 'auto',
          },
        },
      ];

      if (additionalPrompt) {
        userContent.push({
          type: 'text',
          text: `Additional instructions: ${additionalPrompt}`,
        });
      } else {
        userContent.push({
          type: 'text',
          text: '请分析这个 UI 截图/设计稿，用可用的组件类型重现这个界面。',
        });
      }

      const response = await visionClient.chat.completions.create({
        model: visionModel,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: REFERENCE_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      });
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('[specpulse] LLM returned no content');
      return parseSpec(content);
    },

    async adjustSpec(spec: UISpec, instruction: string): Promise<UISpec> {
      const response = await client.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ADJUST_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Current spec:\n${JSON.stringify(spec, null, 2)}\n\nChange request: ${instruction}`,
          },
        ],
      });
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('[specpulse] LLM returned no content');
      return parseSpec(content);
    },
  };
}