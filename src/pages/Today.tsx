import { Link } from "react-router-dom";
import { getRecipe } from "../data/recipes";
import MacroStat from "../components/MacroStat";
import { DAYS, SLOT_LABEL, SLOT_ORDER } from "../lib/types";
import type { Slot } from "../lib/types";
import {
  GOAL_BAND,
  currentSlot,
  perPerson,
  sumDay,
  sumIds,
  todayKey,
} from "../lib/nutrition";
import { usePlan } from "../lib/store";

export default function Today() {
  const { plan, goal } = usePlan();
  const dk = todayKey();
  const slot = currentSlot();
  const dayPlan = plan[dk];
  const dayName = DAYS.find((d) => d.key === dk)?.label ?? "";
  const nowIds = dayPlan[slot];
  const dayTotal = sumDay(dayPlan);
  const perDay = perPerson(dayTotal);
  const band = GOAL_BAND[goal];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "夜深了";
    if (h < 11) return "早上好";
    if (h < 14) return "午安";
    if (h < 18) return "下午好";
    return "晚上好";
  })();

  return (
    <div className="page today">
      <header className="today-head">
        <p className="eyebrow">{dayName} · {greeting}</p>
        <h1>现在该吃 <span className="accent-word">{SLOT_LABEL[slot]}</span></h1>
      </header>

      <section className="now-card">
        <div className="now-card-tab">{SLOT_LABEL[slot]}</div>
        {nowIds.length === 0 ? (
          <div className="now-empty">
            <p>这一餐还没安排。</p>
            <Link className="btn" to="/plan">去周计划安排</Link>
          </div>
        ) : (
          <>
            <ul className="now-list">
              {nowIds.map((id) => {
                const r = getRecipe(id);
                if (!r) return null;
                return (
                  <li key={id}>
                    <Link to={`/recipe/${id}`} className="now-dish" style={{ ["--accent" as string]: r.accent }}>
                      <span className="dish-emoji">{r.emoji}</span>
                      <span className="dish-text">
                        <span className="dish-name">{r.name}</span>
                        <span className="dish-meta">{r.kcal} kcal · 蛋白 {r.protein}g · {r.steps.length} 步</span>
                      </span>
                      <span className="dish-go" aria-hidden="true">›</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <MacroStat m={sumIds(nowIds)} compact />
          </>
        )}
      </section>

      <section className="day-overview">
        <div className="section-head">
          <h2>今天一整天</h2>
          <Link className="link-quiet" to="/plan">编辑</Link>
        </div>
        {SLOT_ORDER.map((s: Slot) => {
          const ids = dayPlan[s];
          return (
            <div className="overview-row" key={s}>
              <span className={"overview-slot" + (s === slot ? " current" : "")}>{SLOT_LABEL[s]}</span>
              <span className="overview-dishes">
                {ids.length === 0
                  ? <span className="muted">—</span>
                  : ids.map((id) => getRecipe(id)?.name).filter(Boolean).join("、")}
              </span>
            </div>
          );
        })}

        <div className="day-total">
          <div>
            <p className="eyebrow">全天合计(整桌)</p>
            <MacroStat m={dayTotal} />
          </div>
          <div className="per-person">
            <p className="eyebrow">人均约</p>
            <p className="pp-kcal"><b>{perDay.kcal}</b> kcal</p>
            <p className="pp-band">
              {goal} 参考 {band.kcal[0]}–{band.kcal[1]} kcal
            </p>
          </div>
        </div>
        <p className="band-note">{band.note}。数值为估算,供参考。</p>
      </section>
    </div>
  );
}
