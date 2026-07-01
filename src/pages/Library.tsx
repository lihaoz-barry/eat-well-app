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

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

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
  const [previewing, setPreviewing] = useState<string | null>(null);

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
    setPreviewing(null);
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
    if (previewing === recipe.id) setPreviewing(null);
    flash(`已保存「${recipe.name}」到餐点库`);
  }

  const previewRecipe = aiResults.find((r) => r.id === previewing);

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
                <p className="ai-results-head">
                  AI 推荐 ({aiResults.length} 道) — 点击卡片预览详情
                </p>
                <div className="recipe-grid">
                  {aiResults.map((r) => (
                    <article
                      className={"recipe-card ai-card" + (previewing === r.id ? " selected" : "")}
                      key={r.id}
                      style={{ ["--accent" as string]: r.accent }}
                    >
                      <div
                        className="card-top"
                        style={{ cursor: "pointer" }}
                        onClick={() => setPreviewing(previewing === r.id ? null : r.id)}
                      >
                        <span className="card-emoji">{r.emoji}</span>
                        <div className="card-tags">
                          {r.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                        </div>
                        <span className="ai-badge">AI</span>
                      </div>
                      <div className="card-body">
                        <span
                          className="card-name"
                          style={{ cursor: "pointer" }}
                          onClick={() => setPreviewing(previewing === r.id ? null : r.id)}
                        >
                          {r.name}
                        </span>
                        <p className="card-blurb">{r.blurb}</p>
                        <p className="card-macro">
                          <b>{r.kcal}</b> kcal · 蛋白 {r.protein}g · {r.servings} 人份
                        </p>
                      </div>
                      <div className="card-foot">
                        <button
                          className="btn-mini ghost"
                          onClick={() => setPreviewing(previewing === r.id ? null : r.id)}
                        >
                          {previewing === r.id ? "收起" : "预览"}
                        </button>
                        <button className="btn-mini" onClick={() => saveToLibrary(r)}>
                          保存到库
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Preview detail panel */}
                {previewRecipe && (
                  <div className="ai-preview" style={{ ["--accent" as string]: previewRecipe.accent }}>
                    <div className="ai-preview-header">
                      <div className="ai-preview-title-row">
                        <span className="ai-preview-emoji">{previewRecipe.emoji}</span>
                        <div>
                          <h3 className="ai-preview-name">{previewRecipe.name}</h3>
                          <p className="ai-preview-en">{previewRecipe.nameEn}</p>
                        </div>
                      </div>
                      <button className="btn-mini" onClick={() => saveToLibrary(previewRecipe)}>
                        保存到库
                      </button>
                    </div>

                    <p className="ai-preview-blurb">{previewRecipe.blurb}</p>

                    <div className="ai-preview-macros">
                      <div><b>{previewRecipe.kcal}</b><span>kcal</span></div>
                      <div><b>{previewRecipe.protein}g</b><span>蛋白</span></div>
                      <div><b>{previewRecipe.carbs}g</b><span>碳水</span></div>
                      <div><b>{previewRecipe.fat}g</b><span>脂肪</span></div>
                      <div><b>{previewRecipe.servings}</b><span>人份</span></div>
                    </div>

                    <div className="ai-preview-section">
                      <h4>🛒 食材清单</h4>
                      <ul className="ai-preview-ingredients">
                        {previewRecipe.ingredients.map((ing, i) => (
                          <li key={i}>
                            <span className="ai-ing-name">{ing.name}</span>
                            <span className="ai-ing-group">{ing.group}</span>
                            <span className="ai-ing-amt">{ing.amount}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="ai-preview-section">
                      <h4>👨‍🍳 制作步骤</h4>
                      <ol className="ai-preview-steps">
                        {previewRecipe.steps.map((step, i) => (
                          <li key={i}>
                            <div className="ai-step-head">
                              <span className="ai-step-no">STEP {i + 1}</span>
                              <span className="ai-step-title">{step.title}</span>
                              {step.timerSeconds && (
                                <span className="ai-step-timer">⏱ {fmt(step.timerSeconds)}</span>
                              )}
                            </div>
                            <p className="ai-step-content">{step.content}</p>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="ai-preview-foot">
                      <button className="btn-mini ghost" onClick={() => setPreviewing(null)}>
                        收起预览
                      </button>
                      <button className="btn" onClick={() => saveToLibrary(previewRecipe)}>
                        ✓ 选这道,保存到餐点库
                      </button>
                    </div>
                  </div>
                )}
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
