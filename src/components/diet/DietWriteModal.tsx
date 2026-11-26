"use client";

import { format } from "date-fns";
import type { DietRow } from "./types";
import DietForm from "./DietForm";

interface DietWriteModalProps {
  selectedDate: Date;
  diets: DietRow[];
  formError: string | null;
  isSaving: boolean;
  calculatingId: number | null;
  onChange: (id: number, field: keyof DietRow, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (id: number) => void;
  onAiCalculate: (id: number, isEdit: boolean) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function DietWriteModal({
  selectedDate,
  diets,
  formError,
  isSaving,
  calculatingId,
  onChange,
  onAddRow,
  onRemoveRow,
  onAiCalculate,
  onSave,
  onClose,
}: DietWriteModalProps) {
  const currentTotal = diets.reduce((sum, r) => sum + (Number(r.calories) || 0), 0);

  return (
    <div className="modal-overlay">
      <div className="modal-content diet-modal">
        <div className="detail-header">
          <div className="detail-date-block">
            <span className="detail-date-main">{format(selectedDate, "yyyy. MM. dd")}</span>
            <span className="detail-date-sub">식단 등록</span>
          </div>
          <span className="calorie-total-badge">총 {Math.round(currentTotal)} kcal</span>
        </div>

        <DietForm
          rows={diets}
          isEdit={false}
          calculatingId={calculatingId}
          onChange={onChange}
          onRemoveRow={onRemoveRow}
          onAiCalculate={onAiCalculate}
        />

        {formError && <p className="form-error">{formError}</p>}

        <div className="detail-footer">
          <button onClick={onAddRow} className="btn-add">+ 추가</button>
          <button className="btn-save" onClick={onSave} disabled={isSaving}>
            {isSaving ? "저장 중..." : "저장하기"}
          </button>
          <button onClick={onClose} className="btn-close">취소</button>
        </div>
      </div>
    </div>
  );
}
