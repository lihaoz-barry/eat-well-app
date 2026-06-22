import { useCallback, useEffect, useState } from "react";
import type { DayKey, DayPlan, Goal, Slot, WeekPlan } from "./types";

const PLAN_KEY = "liangren.plan.v1";
const GOAL_KEY = "liangren.goal.v1";

const emptyDay = (): DayPlan => ({
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
});

const blankWeek = (): WeekPlan => ({
  mon: emptyDay(),
  tue: emptyDay(),
  wed: emptyDay(),
  thu: emptyDay(),
  fri: emptyDay(),
  sat: emptyDay(),
  sun: emptyDay(),
});

/** 首次打开时预填的推荐一周(对应 markdown 餐单),用户可随意改 */
function seedWeek(): WeekPlan {
  const w = blankWeek();
  const set = (d: DayKey, s: Slot, ids: string[]) => (w[d][s] = ids);

  set("mon", "breakfast", ["oat-egg"]);
  set("mon", "lunch", ["pepper-chicken", "brown-rice"]);
  set("mon", "dinner", ["steamed-bass", "garlic-broccoli", "brown-rice"]);
  set("mon", "snack", ["greek-yogurt"]);

  set("tue", "breakfast", ["grain-porridge"]);
  set("tue", "lunch", ["tomato-beef", "brown-rice"]);
  set("tue", "dinner", ["shrimp-edamame", "pan-tofu", "sweet-potato"]);
  set("tue", "snack", ["almonds"]);

  set("wed", "breakfast", ["ww-sandwich"]);
  set("wed", "lunch", ["blanched-shrimp", "brown-rice"]);
  set("wed", "dinner", ["tomato-basa", "garlic-broccoli"]);
  set("wed", "snack", ["greek-yogurt"]);

  set("thu", "breakfast", ["oat-egg"]);
  set("thu", "lunch", ["pepper-chicken", "brown-rice"]);
  set("thu", "dinner", ["winter-melon-soup", "baby-bokchoy", "brown-rice"]);
  set("thu", "snack", ["almonds"]);

  set("fri", "breakfast", ["sweet-potato", "oat-egg"]);
  set("fri", "lunch", ["pepper-chicken", "sweet-potato"]);
  set("fri", "dinner", ["steamed-bass", "baby-bokchoy", "brown-rice"]);
  set("fri", "snack", ["almonds"]);

  set("sat", "breakfast", ["grain-porridge"]);
  set("sat", "lunch", ["tomato-beef", "garlic-broccoli", "brown-rice"]);
  set("sat", "dinner", ["blanched-shrimp", "garlic-broccoli"]);
  set("sat", "snack", ["greek-yogurt"]);

  set("sun", "breakfast", ["ww-sandwich"]);
  set("sun", "lunch", []);
  set("sun", "dinner", ["pan-tofu", "brown-rice"]);
  set("sun", "snack", ["greek-yogurt"]);

  return w;
}

function loadPlan(): WeekPlan {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return seedWeek();
    const parsed = JSON.parse(raw) as WeekPlan;
    // shallow validation
    if (parsed && parsed.mon && parsed.sun) return parsed;
    return seedWeek();
  } catch {
    return seedWeek();
  }
}

function loadGoal(): Goal {
  const raw = localStorage.getItem(GOAL_KEY) as Goal | null;
  return raw === "增肌" || raw === "减脂" || raw === "均衡" ? raw : "均衡";
}

export function usePlan() {
  const [plan, setPlan] = useState<WeekPlan>(loadPlan);
  const [goal, setGoal] = useState<Goal>(loadGoal);

  useEffect(() => {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }, [plan]);

  useEffect(() => {
    localStorage.setItem(GOAL_KEY, goal);
  }, [goal]);

  const addToSlot = useCallback((day: DayKey, slot: Slot, recipeId: string) => {
    setPlan((prev) => {
      const next = structuredClone(prev);
      if (!next[day][slot].includes(recipeId)) next[day][slot].push(recipeId);
      return next;
    });
  }, []);

  const removeFromSlot = useCallback(
    (day: DayKey, slot: Slot, recipeId: string) => {
      setPlan((prev) => {
        const next = structuredClone(prev);
        next[day][slot] = next[day][slot].filter((id) => id !== recipeId);
        return next;
      });
    },
    [],
  );

  const clearDay = useCallback((day: DayKey) => {
    setPlan((prev) => {
      const next = structuredClone(prev);
      next[day] = emptyDay();
      return next;
    });
  }, []);

  const resetToSeed = useCallback(() => setPlan(seedWeek()), []);
  const clearAll = useCallback(() => setPlan(blankWeek()), []);

  return {
    plan,
    goal,
    setGoal,
    addToSlot,
    removeFromSlot,
    clearDay,
    resetToSeed,
    clearAll,
  };
}
