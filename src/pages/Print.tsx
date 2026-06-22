import { getRecipe } from "../data/recipes";
import { DAYS, SLOT_LABEL, SLOT_ORDER } from "../lib/types";
import { perPerson, sumDay } from "../lib/nutrition";
import { usePlan } from "../lib/store";

export default function Print() {
  const { plan, goal } = usePlan();

  return (
    <div className="page print-page">
      <div className="print-controls no-print">
        <div>
          <p className="eyebrow">打印 / 导出 PDF</p>
          <h1>一周餐单(可打印)</h1>
          <p className="lede">点下面的按钮,在弹出的打印窗口里选「另存为 PDF」即可得到 PDF 文件。</p>
        </div>
        <button className="btn big" onClick={() => window.print()}>打印 / 存为 PDF</button>
      </div>

      <div className="print-sheet">
        <header className="sheet-head">
          <h2>两人健康餐单 · 本周</h2>
          <span className="sheet-goal">目标:{goal}</span>
        </header>

        <table className="sheet-table">
          <thead>
            <tr>
              <th>日</th>
              {SLOT_ORDER.map((s) => <th key={s}>{SLOT_LABEL[s]}</th>)}
              <th>合计 / 人均</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((d) => {
              const dp = plan[d.key];
              const total = sumDay(dp);
              const pp = perPerson(total);
              return (
                <tr key={d.key}>
                  <th className="sheet-day">{d.label}</th>
                  {SLOT_ORDER.map((s) => (
                    <td key={s}>
                      {dp[s].length === 0
                        ? <span className="sheet-empty">—</span>
                        : dp[s].map((id) => getRecipe(id)?.name).filter(Boolean).join("、")}
                    </td>
                  ))}
                  <td className="sheet-kcal">
                    {total.kcal} kcal<br />
                    <small>人均 {pp.kcal}</small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="sheet-foot">
          说明:主菜多为 2 人份,合计为整桌估算,人均约为一半。数值仅供参考。
        </p>
      </div>
    </div>
  );
}
