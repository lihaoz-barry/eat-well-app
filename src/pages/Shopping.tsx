import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getRecipe } from "../data/recipes";
import { DAYS, SLOT_ORDER } from "../lib/types";
import type { Ingredient } from "../lib/types";
import { usePlan } from "../lib/store";

const GROUP_ORDER: Ingredient["group"][] = ["蛋白", "蔬菜", "主食", "水果坚果奶", "调味"];

export default function Shopping() {
  const { plan } = usePlan();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    // 收集本周所有用到的食材,按名称去重,记录来自哪些菜
    const map = new Map<string, { ing: Ingredient; dishes: Set<string> }>();
    for (const d of DAYS) {
      for (const s of SLOT_ORDER) {
        for (const id of plan[d.key][s]) {
          const r = getRecipe(id);
          if (!r) continue;
          for (const ing of r.ingredients) {
            const key = ing.name;
            if (!map.has(key)) map.set(key, { ing, dishes: new Set() });
            map.get(key)!.dishes.add(r.name);
          }
        }
      }
    }
    const out: Record<string, { ing: Ingredient; dishes: string[] }[]> = {};
    for (const g of GROUP_ORDER) out[g] = [];
    for (const { ing, dishes } of map.values()) {
      (out[ing.group] ||= []).push({ ing, dishes: [...dishes] });
    }
    for (const g of GROUP_ORDER) out[g].sort((a, b) => b.dishes.length - a.dishes.length);
    return out;
  }, [plan]);

  const total = GROUP_ORDER.reduce((n, g) => n + grouped[g].length, 0);
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div className="page shopping">
      <header className="page-head">
        <p className="eyebrow">购物清单</p>
        <h1>这一周要买的</h1>
        <p className="lede">根据你周计划里选的菜自动汇总。买好就勾掉。</p>
      </header>

      {total === 0 ? (
        <div className="empty-state">
          <p>周计划还是空的,先去挑几道菜吧。</p>
          <Link className="btn" to="/library">去餐点库</Link>
        </div>
      ) : (
        <>
          <div className="shop-progress">
            <div className="shop-progress-bar">
              <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
            </div>
            <span className="shop-progress-num">{done} / {total}</span>
          </div>

          {GROUP_ORDER.map((g) =>
            grouped[g].length === 0 ? null : (
              <section className="shop-group" key={g}>
                <h2>{g}</h2>
                <ul>
                  {grouped[g].map(({ ing, dishes }) => {
                    const on = !!checked[ing.name];
                    return (
                      <li key={ing.name} className={on ? "checked" : ""}>
                        <label>
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() =>
                              setChecked((c) => ({ ...c, [ing.name]: !c[ing.name] }))
                            }
                          />
                          <span className="shop-name">{ing.name}</span>
                          <span className="shop-amt">{ing.amount}</span>
                        </label>
                        <span className="shop-from">{dishes.slice(0, 3).join("、")}{dishes.length > 3 ? "…" : ""}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ),
          )}
        </>
      )}
    </div>
  );
}
