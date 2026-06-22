import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RECIPES } from "../data/recipes";
import { DAYS, SLOT_LABEL, SLOT_ORDER } from "../lib/types";
import type { Category, DayKey, Goal, Slot } from "../lib/types";
import { usePlan } from "../lib/store";

const CATS: ("全部" | Category)[] = ["全部", "早餐", "主菜", "配菜", "主食", "汤", "加餐"];
const GOALS: ("全部" | Goal)[] = ["全部", "增肌", "减脂", "均衡"];

export default function Library() {
  const { addToSlot } = usePlan();
  const [cat, setCat] = useState<(typeof CATS)[number]>("全部");
  const [goal, setGoal] = useState<(typeof GOALS)[number]>("全部");
  const [adding, setAdding] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const list = useMemo(
    () =>
      RECIPES.filter((r) => (cat === "全部" ? true : r.category === cat)).filter((r) =>
        goal === "全部" ? true : r.tags.includes(goal),
      ),
    [cat, goal],
  );

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="page library">
      <header className="page-head">
        <p className="eyebrow">餐点库</p>
        <h1>挑菜,排进你的一周</h1>
        <p className="lede">这些都是食谱里那套均衡餐。选好后点「加入计划」放到某天某一餐。</p>
      </header>

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
