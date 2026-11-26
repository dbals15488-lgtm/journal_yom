"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { SavedWorkout } from "./types";

interface WorkoutDetailModalProps {
  selectedDate: Date;
  workouts: SavedWorkout[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function WorkoutDetailModal({
  selectedDate,
  workouts,
  onClose,
  onEdit,
  onDelete,
}: WorkoutDetailModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content2" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-date-block">
            <span className="detail-date-main">{format(selectedDate, "yyyy. MM. dd")}</span>
            <span className="detail-date-sub">{format(selectedDate, "EEEE", { locale: ko })}</span>
          </div>
          <span className="detail-count-badge">{workouts.length}개 운동</span>
        </div>

        <div className="detail-list">
          {workouts.map((w, i) => (
            <div key={w.id} className="detail-card">
              <div className="detail-card-index">{i + 1}</div>
              <div className="detail-card-body">
                <div className="detail-card-top">
                  <span className="detail-part-tag">{w.part}</span>
                  <span className="detail-exercise-name">{w.workoutName}</span>
                </div>
                <div className="detail-card-stats">
                  <span className="stat-pill">🔁 {w.reps}회</span>
                  <span className="stat-pill">📦 {w.sets}세트</span>
                  <span className="stat-pill">⏱ 휴식 {w.restTime}</span>
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
