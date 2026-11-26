"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { SavedDiet } from "./types";
import { MEAL_COLORS } from "./types";

interface DietDetailModalProps {
  selectedDate: Date;
  diets: SavedDiet[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function DietDetailModal({
  selectedDate,
  diets,
  onClose,
  onEdit,
  onDelete,
}: DietDetailModalProps) {
  const detailTotal = diets.reduce((sum, d) => sum + d.calories, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content2 diet-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-date-block">
            <span className="detail-date-main">{format(selectedDate, "yyyy. MM. dd")}</span>
            <span className="detail-date-sub">
              {format(selectedDate, "EEEE", { locale: ko })}
            </span>
          </div>
          <span className="calorie-total-badge">총 {Math.round(detailTotal)} kcal</span>
        </div>

        <div className="detail-list">
          {diets.map((d, i) => (
            <div key={d.id} className="detail-card">
              <div className="detail-card-index">{i + 1}</div>
              <div className="detail-card-body">
                <div className="detail-card-top">
                  <span
                    className="detail-part-tag"
                    style={{ background: MEAL_COLORS[d.mealType]?.text }}
                  >
                    {d.mealType}
                  </span>
                  <span className="detail-exercise-name">
                    {d.foodName} <span className="detail-amount">({d.amount}개)</span>
                  </span>
                </div>
                <div className="detail-card-stats">
                  <span className="stat-pill">🥩 단백질 {d.protein}g</span>
                  <span className="stat-pill">🥑 지방 {d.fat}g</span>
                  <span className="stat-pill">🍞 탄수 {d.carbs}g</span>
                  <span className="stat-pill stat-calorie">🔥 {d.calories} kcal</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="detail-footer">
          <button onClick={onEdit} className="btn-save">✏️ 수정</button>
          <button onClick={onDelete} className="btn-remove">🗑 삭제</button>
          <button onClick={onClose} className="btn-close">닫기</button>
        </div>
      </div>
    </div>
  );
}
