"use client";

import type { DietRow } from "./types";
import { MEAL_TYPES, MEAL_COLORS } from "./types";

interface DietFormProps {
  rows: DietRow[];
  isEdit: boolean;
  calculatingId: number | null;
  onChange: (id: number, field: keyof DietRow, value: string) => void;
  onRemoveRow: (id: number) => void;
  onAiCalculate: (id: number, isEdit: boolean) => void;
}

export default function DietForm({
  rows,
  isEdit,
  calculatingId,
  onChange,
  onRemoveRow,
  onAiCalculate,
}: DietFormProps) {
  return (
    <div className="detail-list">
      {rows.map((row, i) => (
        <div key={row.id} className="diet-card">
          <div className="diet-card-header">
            <div className="detail-card-index">{i + 1}</div>
            <select
              className="meal-select"
              value={row.mealType}
              onChange={(e) => onChange(row.id, "mealType", e.target.value)}
              style={{
                background: MEAL_COLORS[row.mealType]?.bg,
                color: MEAL_COLORS[row.mealType]?.text,
              }}
            >
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button className="edit-delete-btn" onClick={() => onRemoveRow(row.id)}>✕</button>
          </div>

          <div className="diet-input-row">
            <div className="edit-field">
              <label className="edit-label">음식명</label>
              <input
                className="edit-input"
                placeholder="예: 닭가슴살"
                value={row.foodName}
                onChange={(e) => onChange(row.id, "foodName", e.target.value)}
              />
            </div>
            <div className="edit-field">
              <label className="edit-label">양 (그람 과 갯수 혹은 갯수만 적어주세요 그럼 나머진 자동으로 AI가 계산해줍니다.)</label>
              <input
                className="edit-input"
                placeholder="예: 100g, 1개"
                value={row.amount}
                onChange={(e) => onChange(row.id, "amount", e.target.value)}
              />
            </div>
            <button
              className="btn-ai"
              onClick={() => onAiCalculate(row.id, isEdit)}
              disabled={calculatingId === row.id}
            >
              {calculatingId === row.id ? "계산 중..." : "✨ AI 계산"}
            </button>
          </div>

          <div className="diet-nutrition-row">
            <div className="edit-field edit-field-sm">
              <label className="edit-label">단백질(g)</label>
              <input className="edit-input" type="number" value={row.protein}
                onChange={(e) => onChange(row.id, "protein", e.target.value)} />
            </div>
            <div className="edit-field edit-field-sm">
              <label className="edit-label">지방(g)</label>
              <input className="edit-input" type="number" value={row.fat}
                onChange={(e) => onChange(row.id, "fat", e.target.value)} />
            </div>
            <div className="edit-field edit-field-sm">
              <label className="edit-label">탄수화물(g)</label>
              <input className="edit-input" type="number" value={row.carbs}
                onChange={(e) => onChange(row.id, "carbs", e.target.value)} />
            </div>
            <div className="edit-field edit-field-sm">
              <label className="edit-label">칼로리</label>
              <input className="edit-input" type="number" value={row.calories}
                onChange={(e) => onChange(row.id, "calories", e.target.value)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
