import { getRecipe } from "../data/recipes";
import type { DayKey, DayPlan, Goal, Slot } from "./types";

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export function sumIds(ids: string[]): Macros {
  return ids.reduce<Macros>((acc, id) => {
    const r = getRecipe(id);
    if (!r) return acc;
    return {
      kcal: acc.kcal + r.kcal,
      protein: acc.protein + r.protein,
      carbs: acc.carbs + r.carbs,
      fat: acc.fat + r.fat,
    };
  }, { ...ZERO });
}

export function sumDay(day: DayPlan): Macros {
  const all = [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snack];
  return sumIds(all);
}

/** 参考区间(每人/天)。仅作温和参考,不是硬性指标。 */
export const GOAL_BAND: Record<Goal, { kcal: [number, number]; note: string }> = {
  增肌: { kcal: [2200, 2600], note: "轻微热量盈余 + 高蛋白,配合力量训练" },
  减脂: { kcal: [1500, 1800], note: "温和热量缺口,蛋白保持高位、多吃蔬菜" },
  均衡: { kcal: [1800, 2100], note: "维持热量,营养均衡为主" },
};

/** 注意:计划里很多主菜是 2 人份。这里给的是"整桌"合计,人均约为一半。 */
export function perPerson(m: Macros): Macros {
  return {
    kcal: Math.round(m.kcal / 2),
    protein: Math.round(m.protein / 2),
    carbs: Math.round(m.carbs / 2),
    fat: Math.round(m.fat / 2),
  };
}

const dayMap: Record<number, DayKey> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

export function todayKey(d = new Date()): DayKey {
  return dayMap[d.getDay()];
}

/** 按当前时间推断"现在该吃哪一餐" */
export function currentSlot(d = new Date()): Slot {
  const h = d.getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 16) return "snack";
  if (h < 21) return "dinner";
  return "snack";
}

export function round(n: number): number {
  return Math.round(n);
}
