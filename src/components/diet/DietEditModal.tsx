"use client";

import { format } from "date-fns";
import type { DietRow } from "./types";
import DietForm from "./DietForm";

interface DietEditModalProps {
  selectedDate: Date;
  editDiets: DietRow[];
  editFormError: string | null;
  isUpdating: boolean;
  editCalculatingId: number | null;
  onChange: (id: number, field: keyof DietRow, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (id: number) => void;
  onAiCalculate: (id: number, isEdit: boolean) => void;
  onUpdate: () => void;
  onClose: () => void;
}

export default function DietEditModal({
  selectedDate,
  editDiets,
  editFormError,
  isUpdating,
  editCalculatingId,
  onChange,
  onAddRow,
  onRemoveRow,
  onAiCalculate,
  onUpdate,
  onClose,
}: DietEditModalProps) {
  const editTotal = editDiets.reduce((sum, r) => sum + (Number(r.calories) || 0), 0);

  return (
    <div className="modal-overlay">
      <div className="modal-content diet-modal">
        <div className="detail-header">
          <div className="detail-date-block">
            <span className="detail-date-main">{format(selectedDate, "yyyy. MM. dd")}</span>
            <span className="detail-date-sub">식단 수정</span>
          </div>
          <span className="calorie-total-badge">총 {Math.round(editTotal)} kcal</span>
        </div>

        <DietForm
          rows={editDiets}
          isEdit={true}
          calculatingId={editCalculatingId}
          onChange={onChange}
          onRemoveRow={onRemoveRow}
          onAiCalculate={onAiCalculate}
        />

        {editFormError && <p className="form-error">{editFormError}</p>}

        <div className="detail-footer">
          <button onClick={onAddRow} className="btn-add">+ 추가</button>
          <button className="btn-save" onClick={onUpdate} disabled={isUpdating}>
            {isUpdating ? "수정 중..." : "✏️ 수정하기"}
          </button>
          <button onClick={onClose} className="btn-close">취소</button>
        </div>
      </div>
    </div>
  );
}
