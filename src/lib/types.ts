export type Slot = "breakfast" | "lunch" | "dinner" | "snack";

export type Category = "早餐" | "主菜" | "配菜" | "主食" | "汤" | "加餐";

export type Goal = "增肌" | "减脂" | "均衡";

export interface Ingredient {
  name: string;
  amount: string; // free text e.g. "1 条", "200 g", "适量"
  group: "蛋白" | "蔬菜" | "主食" | "调味" | "水果坚果奶";
}

export interface RecipeStep {
  title: string;
  content: string;
  timerSeconds?: number;
}

export interface Recipe {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  accent: string; // hex, drives the booklet + placeholder style
  category: Category;
  slots: Slot[]; // which meal slots this fits
  tags: Goal[];
  servings: number;
  /** per serving */
  kcal: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  blurb: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
}

export const SLOT_LABEL: Record<Slot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "加餐",
};

export const SLOT_ORDER: Slot[] = ["breakfast", "lunch", "dinner", "snack"];

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "mon", label: "周一", short: "一" },
  { key: "tue", label: "周二", short: "二" },
  { key: "wed", label: "周三", short: "三" },
  { key: "thu", label: "周四", short: "四" },
  { key: "fri", label: "周五", short: "五" },
  { key: "sat", label: "周六", short: "六" },
  { key: "sun", label: "周日", short: "日" },
];

export type DayPlan = Record<Slot, string[]>; // recipe ids
export type WeekPlan = Record<DayKey, DayPlan>;
