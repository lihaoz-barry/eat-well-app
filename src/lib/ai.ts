import type { Recipe } from "./types";
import type { AiProvider } from "./store";

interface GenerateParams {
  provider: AiProvider;
  apiKey: string;
  preferences: string;
  existingIds: string[];
}

const SYSTEM_PROMPT = `你是一个专业的中餐营养师和厨师。请根据用户的食材偏好,生成正好3道适合两人家庭的健康食谱。

每道食谱必须严格遵循以下JSON格式,返回 { "recipes": [...] }:
{
  "id": "kebab-case-english-id",
  "name": "中文菜名",
  "nameEn": "English Name",
  "emoji": "单个emoji",
  "accent": "#十六进制颜色",
  "category": "早餐" | "主菜" | "配菜" | "主食" | "汤" | "加餐" (选一个),
  "slots": ["breakfast", "lunch", "dinner", "snack" 中选一个或多个],
  "tags": ["增肌", "减脂", "均衡" 中选一个或多个],
  "servings": 数字(通常1或2),
  "kcal": 每份卡路里(数字),
  "protein": 每份蛋白质克数(数字),
  "carbs": 每份碳水克数(数字),
  "fat": 每份脂肪克数(数字),
  "blurb": "一句话描述,20字以内",
  "ingredients": [
    { "name": "食材名", "amount": "用量如2个、200g、适量", "group": "蛋白" | "蔬菜" | "主食" | "调味" | "水果坚果奶" }
  ],
  "steps": [
    { "title": "步骤标题", "content": "详细步骤说明", "timerSeconds": 可选秒数或不写 }
  ]
}

要求:
1. 营养数据要合理准确
2. 步骤要详细实用,适合家庭厨房
3. 每道菜的accent颜色要不同且适合菜品风格
4. 只返回JSON,不要其他文字`;

function buildUserMessage(preferences: string, existingIds: string[]): string {
  let msg = `我的偏好: ${preferences}`;
  if (existingIds.length > 0) {
    msg += `\n\n注意: id不能与以下已有食谱重复: ${existingIds.join(", ")}`;
  }
  return msg;
}

async function callOpenAI(apiKey: string, preferences: string, existingIds: string[]): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(preferences, existingIds) },
      ],
      temperature: 0.8,
    }),
  });

  if (res.status === 401) throw new Error("API Key 无效,请检查你的 OpenAI Key。");
  if (!res.ok) throw new Error(`OpenAI 请求失败 (${res.status})`);

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callClaude(apiKey: string, preferences: string, existingIds: string[]): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildUserMessage(preferences, existingIds) },
      ],
    }),
  });

  if (res.status === 401) throw new Error("API Key 无效,请检查你的 Anthropic Key。");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Claude 请求失败 (${res.status})${text ? ": " + text.slice(0, 200) : ""}`);
  }

  const data = await res.json();
  const block = data.content?.find((b: { type: string }) => b.type === "text");
  return block?.text ?? "";
}

const VALID_CATEGORIES = ["早餐", "主菜", "配菜", "主食", "汤", "加餐"] as const;
const VALID_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
const VALID_TAGS = ["增肌", "减脂", "均衡"] as const;
const VALID_GROUPS = ["蛋白", "蔬菜", "主食", "调味", "水果坚果奶"] as const;

function validateRecipe(r: Record<string, unknown>, existingIds: Set<string>): Recipe | null {
  if (!r || typeof r !== "object") return null;
  if (typeof r.id !== "string" || typeof r.name !== "string") return null;

  let id = String(r.id).replace(/[^a-z0-9-]/g, "").slice(0, 40) || "ai-recipe";
  while (existingIds.has(id)) id += `-${Date.now().toString(36).slice(-4)}`;
  existingIds.add(id);

  const category = VALID_CATEGORIES.includes(r.category as typeof VALID_CATEGORIES[number])
    ? (r.category as Recipe["category"])
    : "主菜";

  const slots = Array.isArray(r.slots)
    ? (r.slots.filter((s: unknown) => VALID_SLOTS.includes(s as typeof VALID_SLOTS[number])) as Recipe["slots"])
    : ["lunch", "dinner"] as Recipe["slots"];

  const tags = Array.isArray(r.tags)
    ? (r.tags.filter((t: unknown) => VALID_TAGS.includes(t as typeof VALID_TAGS[number])) as Recipe["tags"])
    : ["均衡"] as Recipe["tags"];

  const ingredients = Array.isArray(r.ingredients)
    ? r.ingredients.map((ing: Record<string, unknown>) => ({
        name: String(ing?.name ?? "食材"),
        amount: String(ing?.amount ?? "适量"),
        group: VALID_GROUPS.includes(ing?.group as typeof VALID_GROUPS[number])
          ? (ing.group as Recipe["ingredients"][number]["group"])
          : "调味" as const,
      }))
    : [];

  const steps = Array.isArray(r.steps)
    ? r.steps.map((s: Record<string, unknown>) => ({
        title: String(s?.title ?? "步骤"),
        content: String(s?.content ?? ""),
        ...(typeof s?.timerSeconds === "number" ? { timerSeconds: s.timerSeconds } : {}),
      }))
    : [];

  return {
    id,
    name: String(r.name),
    nameEn: String(r.nameEn ?? r.name ?? ""),
    emoji: typeof r.emoji === "string" ? r.emoji.slice(0, 2) : "🍽",
    accent: typeof r.accent === "string" && r.accent.startsWith("#") ? r.accent : "#3e7c66",
    category,
    slots: slots.length > 0 ? slots : ["lunch", "dinner"],
    tags: tags.length > 0 ? tags : ["均衡"],
    servings: typeof r.servings === "number" ? r.servings : 2,
    kcal: typeof r.kcal === "number" ? Math.round(r.kcal) : 200,
    protein: typeof r.protein === "number" ? Math.round(r.protein) : 10,
    carbs: typeof r.carbs === "number" ? Math.round(r.carbs) : 20,
    fat: typeof r.fat === "number" ? Math.round(r.fat) : 8,
    blurb: String(r.blurb ?? "AI 推荐菜品"),
    ingredients,
    steps: steps.length > 0 ? steps : [{ title: "制作", content: "按食材准备并烹饪。" }],
  };
}

export async function generateRecipes({ provider, apiKey, preferences, existingIds }: GenerateParams): Promise<Recipe[]> {
  if (!apiKey.trim()) throw new Error("请先输入 API Key。");
  if (!preferences.trim()) throw new Error("请输入你的食材偏好或需求。");

  const raw = provider === "claude"
    ? await callClaude(apiKey, preferences, existingIds)
    : await callOpenAI(apiKey, preferences, existingIds);

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI 返回的内容无法解析,请重试。");

  let parsed: { recipes?: unknown[] };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("AI 返回的 JSON 格式有误,请重试。");
  }

  const arr = Array.isArray(parsed.recipes) ? parsed.recipes : Array.isArray(parsed) ? parsed : [];
  if (arr.length === 0) throw new Error("AI 没有返回任何食谱,请换个描述再试。");

  const idSet = new Set(existingIds);
  const results = arr
    .map((r) => validateRecipe(r as Record<string, unknown>, idSet))
    .filter((r): r is Recipe => r !== null);

  if (results.length === 0) throw new Error("AI 返回的食谱格式不合规,请重试。");
  return results;
}
