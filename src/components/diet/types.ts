export interface DietRow {
  id: number;
  mealType: string;
  foodName: string;
  amount: string;
  protein: string;
  fat: string;
  carbs: string;
  calories: string;
}

export interface SavedDiet {
  id: number;
  date: Date;
  foodName: string;
  amount: string;
  mealType: string;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

export const MEAL_TYPES = ["아침", "점심", "저녁", "간식"];

export const MEAL_COLORS: Record<string, { bg: string; text: string }> = {
  아침: { bg: "#fff7ed", text: "#c2410c" },
  점심: { bg: "#ecfdf5", text: "#047857" },
  저녁: { bg: "#eff6ff", text: "#1d4ed8" },
  간식: { bg: "#fdf2f8", text: "#be185d" },
};

export const emptyRow = (): DietRow => ({
  id: Date.now() + Math.random(),
  mealType: "아침",
  foodName: "",
  amount: "",
  protein: "",
  fat: "",
  carbs: "",
  calories: "",
});
