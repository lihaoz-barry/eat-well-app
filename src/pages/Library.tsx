import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RECIPES, getAllRecipes } from "../data/recipes";
import { DAYS, SLOT_LABEL, SLOT_ORDER } from "../lib/types";
import type { Category, DayKey, Goal, Recipe, Slot } from "../lib/types";
import { useAiSettings, useCustomRecipes, usePlan } from "../lib/store";
import { generateRecipes } from "../lib/ai";

const CATS: ("全部" | Category)[] = ["全部", "早餐", "主菜", "配菜", "主食", "汤", "加餐"];
const GOALS: ("全部" | Goal)[] = ["全部", "增肌", "减脂", "均衡"];

const BUILTIN_IDS = new Set(RECIPES.map((r) => r.id));

export default function Library() {
  const { addToSlot } = usePlan();
  const { provider, setProvider, apiKey, setApiKey } = useAiSettings();
  const { customRecipes, addCustomRecipe } = useCustomRecipes();
  const [cat, setCat] = useState<(typeof CATS)[number]>("全部");
  const [goal, setGoal] = useState<(typeof GOALS)[number]>("全部");
  const [adding, setAdding] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Recipe[]>([]);

  const allRecipes = useMemo(() => getAllRecipes(), [customRecipes]);

  const list = useMemo(
    () =>
      allRecipes
        .filter((r) => (cat === "全部" ? true : r.category === cat))
        .filter((r) => (goal === "全部" ? true : r.tags.includes(goal))),
    [cat, goal, allRecipes],
  );

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const results = await generateRecipes({
        provider,
        apiKey,
        preferences,
        existingIds: allRecipes.map((r) => r.id),
      });
      setAiResults(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败,请重试。");
    } finally {
      setLoading(false);
    }
  }

  function saveToLibrary(recipe: Recipe) {
    addCustomRecipe(recipe);
    setAiResults((prev) => prev.filter((r) => r.id !== recipe.id));
    flash(`已保存「${recipe.name}」到餐点库`);
  }

  return (
    <div className="page library">
      <header className="page-head">
        <p className="eyebrow">餐点库</p>
        <h1>挑菜,排进你的一周</h1>
        <p className="lede">选好后点「加入计划」放到某天某一餐。也可以用 AI 生成新菜品。</p>
      </header>

      {/* AI Section */}
      <section className="ai-section">
        <button className="ai-toggle" onClick={() => setAiOpen(!aiOpen)}>
          <span>✨ AI 推荐食谱</span>
          <span style={{ marginLeft: "auto" }}>{aiOpen ? "▾" : "▸"}</span>
        </button>

        {aiOpen && (
          <div className="ai-panel">
            <div className="ai-settings">
              <div className="ai-provider-toggle" role="tablist" aria-label="AI 服务">
                <button
                  className={provider === "openai" ? "on" : ""}
                  onClick={() => setProvider("openai")}
                >
                  OpenAI
                </button>
                <button
                  className={provider === "claude" ? "on" : ""}
                  onClick={() => setProvider("claude")}
                >
                  Claude
                </button>
              </div>
              <input
                type="password"
                className="ai-key-input"
                placeholder={provider === "openai" ? "sk-... (OpenAI Key)" : "sk-ant-... (Anthropic Key)"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="ai-prompt-row">
              <input
                type="text"
                className="ai-input"
                placeholder="输入偏好食材或需求,如:高蛋白、用鸡胸肉和西兰花..."
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && apiKey && preferences && !loading) handleGenerate();
                }}
              />
              <button
                className="btn ai-go"
                disabled={!apiKey || !preferences || loading}
                onClick={handleGenerate}
              >
                {loading ? "生成中..." : "生成"}
              </button>
            </div>

            {error && <p className="ai-error">{error}</p>}

            {loading && (
              <div className="ai-loading">
                <span className="spinner" />
                <span>AI 正在为你设计菜品...</span>
              </div>
            )}

            {aiResults.length > 0 && (
              <div className="ai-results">
                <p className="ai-results-head">AI 推荐 ({aiResults.length} 道) — 点击保存到餐点库</p>
                <div className="recipe-grid">
                  {aiResults.map((r) => (
                    <article className="recipe-card" key={r.id} style={{ ["--accent" as string]: r.accent }}>
                      <div className="card-top">
                        <span className="card-emoji">{r.emoji}</span>
                        <div className="card-tags">
                          {r.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                        </div>
                        <span className="ai-badge">AI</span>
                      </div>
                      <div className="card-body">
                        <span className="card-name">{r.name}</span>
                        <p className="card-blurb">{r.blurb}</p>
                        <p className="card-macro">
                          <b>{r.kcal}</b> kcal · 蛋白 {r.protein}g · {r.servings} 人份
                        </p>
                      </div>
                      <div className="card-foot">
                        <button className="btn-mini" onClick={() => saveToLibrary(r)}>
                          保存到库
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="filters">
        <div className="chip-row" role="tablist" aria-label="按类型">
          {CATS.map((c) => (
            <button
              key={c}
              className={"chip" + (cat === c ? " on" : "")}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="chip-row" role="tablist" aria-label="按目标">
          {GOALS.map((g) => (
            <button
              key={g}
              className={"chip ghost" + (goal === g ? " on" : "")}
              onClick={() => setGoal(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="recipe-grid">
        {list.map((r) => (
          <article className="recipe-card" key={r.id} style={{ ["--accent" as string]: r.accent }}>
            <Link to={`/recipe/${r.id}`} className="card-top">
              <span className="card-emoji">{r.emoji}</span>
              <div className="card-tags">
                {r.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
              </div>
              {!BUILTIN_IDS.has(r.id) && <span className="ai-badge">AI</span>}
            </Link>
            <div className="card-body">
              <Link to={`/recipe/${r.id}`} className="card-name">{r.name}</Link>
              <p className="card-blurb">{r.blurb}</p>
              <p className="card-macro">
                <b>{r.kcal}</b> kcal · 蛋白 {r.protein}g · {r.servings} 人份
              </p>
            </div>
            <div className="card-foot">
              <Link to={`/recipe/${r.id}`} className="btn-mini ghost">看做法</Link>
              <button className="btn-mini" onClick={() => setAdding(adding === r.id ? null : r.id)}>
                加入计划
              </button>
            </div>

            {adding === r.id && (
              <AddPicker
                slots={r.slots}
                onPick={(day, slot) => {
                  addToSlot(day, slot, r.id);
                  setAdding(null);
                  flash(`已加入 ${DAYS.find((d) => d.key === day)?.label} · ${SLOT_LABEL[slot]}`);
                }}
                onClose={() => setAdding(null)}
              />
            )}
          </article>
        ))}
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function AddPicker({
  slots,
  onPick,
  onClose,
}: {
  slots: Slot[];
  onPick: (day: DayKey, slot: Slot) => void;
  onClose: () => void;
}) {
  const [day, setDay] = useState<DayKey>("mon");
  const usable = SLOT_ORDER.filter((s) => slots.includes(s));
  return (
    <div className="add-picker" onClick={(e) => e.stopPropagation()}>
      <div className="picker-row">
        <label>哪天</label>
        <div className="day-pills">
          {DAYS.map((d) => (
            <button
              key={d.key}
              className={"day-pill" + (day === d.key ? " on" : "")}
              onClick={() => setDay(d.key)}
            >
              {d.short}
            </button>
          ))}
        </div>
      </div>
      <div className="picker-row">
        <label>哪一餐</label>
        <div className="slot-pills">
          {usable.map((s) => (
            <button key={s} className="slot-pill" onClick={() => onPick(day, s)}>
              {SLOT_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      <button className="picker-close" onClick={onClose} aria-label="关闭">取消</button>
    </div>
  );
}
