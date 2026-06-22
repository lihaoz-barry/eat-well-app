import type { Macros } from "../lib/nutrition";

export default function MacroStat({ m, compact = false }: { m: Macros; compact?: boolean }) {
  return (
    <div className={"macro-stat" + (compact ? " compact" : "")}>
      <div className="macro-kcal">
        <span className="macro-num">{m.kcal}</span>
        <span className="macro-unit">kcal</span>
      </div>
      <div className="macro-split">
        <span><b>{m.protein}</b>g 蛋白</span>
        <span><b>{m.carbs}</b>g 碳水</span>
        <span><b>{m.fat}</b>g 脂肪</span>
      </div>
    </div>
  );
}
