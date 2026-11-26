"use client";

import { format } from "date-fns";
import type { WorkoutRow } from "./types";

interface WorkoutEditModalProps {
  selectedDate: Date;
  editWorkouts: WorkoutRow[];
  editFormError: string | null;
  isUpdating: boolean;
  onChange: (id: number, field: keyof WorkoutRow, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (id: number) => void;
  onUpdate: () => void;
  onClose: () => void;
}

export default function WorkoutEditModal({
  selectedDate,
  editWorkouts,
  editFormError,
  isUpdating,
  onChange,
  onAddRow,
  onRemoveRow,
  onUpdate,
  onClose,
}: WorkoutEditModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content edit-modal">
        <div className="detail-header">
          <div className="detail-date-block">
            <span className="detail-date-main">{format(selectedDate, "yyyy. MM. dd")}</span>
            <span className="detail-date-sub">운동 기록 수정</span>
          </div>
          <span className="detail-count-badge">{editWorkouts.length}개 운동</span>
        </div>

        <div className="detail-list">
          {editWorkouts.map((row, i) => (
            <div key={row.id} className="edit-card">
              <div className="edit-card-header">
                <div className="detail-card-index">{i + 1}</div>
                <span className="edit-card-title">
                  {row.part || "부위 미입력"} — {row.name || "운동명 미입력"}
                </span>
                <button className="edit-delete-btn" onClick={() => onRemoveRow(row.id)}>✕</button>
              </div>

              <div className="edit-fields">
                <div className="edit-field">
                  <label className="edit-label">부위</label>
                  <input className="edit-input" placeholder="예: 상체" value={row.part} onChange={(e) => onChange(row.id, "part", e.target.value)} />
                </div>
                <div className="edit-field">
                  <label className="edit-label">운동 이름</label>
                  <input className="edit-input" placeholder="예: 벤치프레스" value={row.name} onChange={(e) => onChange(row.id, "name", e.target.value)} />
                </div>
                <div className="edit-field edit-field-sm">
                  <label className="edit-label">횟수</label>
                  <input className="edit-input" type="number" placeholder="회" value={row.reps} onChange={(e) => onChange(row.id, "reps", e.target.value)} />
                </div>
                <div className="edit-field edit-field-sm">
                  <label className="edit-label">세트</label>
                  <input className="edit-input" type="number" placeholder="세트" value={row.sets} onChange={(e) => onChange(row.id, "sets", e.target.value)} />
                </div>
                <div className="edit-field edit-field-sm">
                  <label className="edit-label">휴식 시간</label>
                  <input className="edit-input" placeholder="예: 60초" value={row.restTime} onChange={(e) => onChange(row.id, "restTime", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {editFormError && <p className="form-error">{editFormError}</p>}

        <div className="detail-footer">
          <button onClick={onAddRow} className="btn-add">+ 추가</button>
          <button className="btn-save" onClick={onUpdate} disabled={isUpdating}>
            {isUpdating ? "수정 중..." : "✏️ 수정하기"}
          </button>
          <button onClick={onClose} className="btn-close">닫기</button>
        </div>
      </div>
    </div>
  );
}
