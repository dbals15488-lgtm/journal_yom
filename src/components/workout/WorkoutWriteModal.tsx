"use client";

import { format } from "date-fns";
import type { WorkoutRow } from "./types";

interface WorkoutWriteModalProps {
  selectedDate: Date;
  workouts: WorkoutRow[];
  formError: string | null;
  isSaving: boolean;
  onChange: (id: number, field: keyof WorkoutRow, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (id: number) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function WorkoutWriteModal({
  selectedDate,
  workouts,
  formError,
  isSaving,
  onChange,
  onAddRow,
  onRemoveRow,
  onSave,
  onClose,
}: WorkoutWriteModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{format(selectedDate, "yyyy.MM.dd")} 운동 기록</h2>
        {workouts.map((row) => (
          <div key={row.id} className="workout-row">
            <input placeholder="부위" value={row.part} onChange={(e) => onChange(row.id, "part", e.target.value)} />
            <input placeholder="운동 이름" value={row.name} onChange={(e) => onChange(row.id, "name", e.target.value)} />
            <input type="number" placeholder="횟수" value={row.reps} onChange={(e) => onChange(row.id, "reps", e.target.value)} />
            <input type="number" placeholder="세트" value={row.sets} onChange={(e) => onChange(row.id, "sets", e.target.value)} />
            <input placeholder="휴식 시간 (예: 60초)" value={row.restTime} onChange={(e) => onChange(row.id, "restTime", e.target.value)} />
            <button className="btn-remove" onClick={() => onRemoveRow(row.id)}>×</button>
          </div>
        ))}

        {formError && <p className="form-error">{formError}</p>}

        <div className="workout-modal-actions">
          <button onClick={onAddRow} className="btn-add">추가</button>
          <button className="btn-save" onClick={onSave} disabled={isSaving}>
            {isSaving ? "저장 중..." : "저장하기"}
          </button>
          <button onClick={onClose} className="btn-remove">취소</button>
        </div>
      </div>
    </div>
  );
}
