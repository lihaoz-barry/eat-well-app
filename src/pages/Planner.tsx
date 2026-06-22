import { Link } from "react-router-dom";
import { getRecipe } from "../data/recipes";
import { DAYS, SLOT_LABEL, SLOT_ORDER } from "../lib/types";
import type { DayKey, Goal, Slot } from "../lib/types";
import { perPerson, sumDay, todayKey } from "../lib/nutrition";
import { usePlan } from "../lib/store";

const GOALS: Goal[] = ["增肌", "减脂", "均衡"];

export default function Planner() {
  const { plan, goal, setGoal, removeFromSlot, clearDay, resetToSeed, clearAll } = usePlan();
  const tk = todayKey();

  return (
    <div className="page planner">
      <header className="page-head">
        <p className="eyebrow">周计划</p>
        <h1>这一周吃什么</h1>
        <p className="lede">改动会自动保存,刷新或关掉再打开都还在。</p>
      </header>

      <div className="planner-bar">
        <div className="goal-toggle" role="tablist" aria-label="目标">
          {GOALS.map((g) => (
            <button
              key={g}
              className={"goal-btn" + (goal === g ? " on" : "")}
              onClick={() => setGoal(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="planner-actions">
          <Link className="btn-mini ghost" to="/library">+ 加菜</Link>
          <button className="btn-mini ghost" onClick={resetToSeed}>恢复推荐</button>
          <button className="btn-mini danger" onClick={clearAll}>清空</button>
        </div>
      </div>

      <div className="week">
        {DAYS.map((d) => {
          const dayPlan = plan[d.key];
          const total = sumDay(dayPlan);
          const pp = perPerson(total);
          return (
            <section className={"day-card" + (d.key === tk ? " is-today" : "")} key={d.key}>
              <header className="day-card-head">
                <h2>{d.label}{d.key === tk && <span className="today-pin">今天</span>}</h2>
                <div className="day-card-kcal">
                  <span>{total.kcal}<small> kcal</small></span>
                  <span className="pp">人均 {pp.kcal}</span>
                </div>
              </header>

              {SLOT_ORDER.map((s: Slot) => (
                <SlotRow key={s} day={d.key} slot={s} ids={dayPlan[s]} onRemove={removeFromSlot} />
              ))}

              <button className="clear-day" onClick={() => clearDay(d.key)}>清空这天</button>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SlotRow({
  day,
  slot,
  ids,
  onRemove,
}: {
  day: DayKey;
  slot: Slot;
  ids: string[];
  onRemove: (d: DayKey, s: Slot, id: string) => void;
}) {
  return (
    <div className="slot-row">
      <span className="slot-name">{SLOT_LABEL[slot]}</span>
      <div className="slot-dishes">
        {ids.length === 0 ? (
          <Link to="/library" className="add-hint">+ 加菜</Link>
        ) : (
          ids.map((id) => {
            const r = getRecipe(id);
            if (!r) return null;
            return (
              <span className="dish-chip" key={id} style={{ ["--accent" as string]: r.accent }}>
                <Link to={`/recipe/${id}`} className="dish-chip-name">
                  {r.emoji} {r.name}
                </Link>
                <button
                  className="dish-chip-x"
                  aria-label={`移除 ${r.name}`}
                  onClick={() => onRemove(day, slot, id)}
                >
                  ×
                </button>
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
