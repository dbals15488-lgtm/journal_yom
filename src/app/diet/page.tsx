"use client";

import "react-day-picker/dist/style.css";
import "./diet.css";
import "../workout/workout.css";
import "../diary/diary.css";
import React, { useState, useEffect } from "react";
import {
  createDiet,
  fetchDiets,
  calculateNutrition,
  updateDietsForDate,
  deleteDietsByDate,
} from "./actions";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { ko } from "date-fns/locale";
import { format } from "date-fns";

import { type DietRow, type SavedDiet, emptyRow } from "../../components/diet/types";
import DietDetailModal from "../../components/diet/DietDetailModal";
import DietWriteModal from "../../components/diet/DietWriteModal";
import DietEditModal from "../../components/diet/DietEditModal";

export default function DietPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [savedDiets, setSavedDiets] = useState<SavedDiet[]>([]);

  const [isWriting, setIsWriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [diets, setDiets] = useState<DietRow[]>([emptyRow()]);
  const [calculatingId, setCalculatingId] = useState<number | null>(null);

  const [detailModal, setDetailModal] = useState<SavedDiet[] | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editDiets, setEditDiets] = useState<DietRow[]>([]);
  const [editCalculatingId, setEditCalculatingId] = useState<number | null>(null);

  const isSameDate = (d1: Date, d2: Date) =>
    format(d1, "yyyy-MM-dd") === format(d2, "yyyy-MM-dd");

  const loadData = async () => {
    const data = await fetchDiets();
    setSavedDiets(
      Array.isArray(data)
        ? data.map((item: SavedDiet) => ({ ...item, date: new Date(item.date) }))
        : [],
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  // 새 등록
  const addRow = () => setDiets((prev) => [...prev, emptyRow()]);
  const removeRow = (id: number) => setDiets((prev) => prev.filter((r) => r.id !== id));
  const handleChange = (id: number, field: keyof DietRow, value: string) => {
    setDiets((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleAiCalculate = async (id: number, isEdit = false) => {
    const source = isEdit ? editDiets : diets;
    const row = source.find((r) => r.id === id);
    if (!row) return;

    if (!row.foodName.trim() || !row.amount.trim()) {
      alert("먼저 음식명과 양을 입력해주세요.");
      return;
    }

    if (isEdit) setEditCalculatingId(id);
    else setCalculatingId(id);

    const result = await calculateNutrition(row.foodName, row.amount);

    if (isEdit) setEditCalculatingId(null);
    else setCalculatingId(null);

    if (!result.success || !result.data) {
      alert(result.message ?? "AI 계산 실패");
      return;
    }

    const updater = (prev: DietRow[]) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              protein: String(result.data.protein),
              fat: String(result.data.fat),
              carbs: String(result.data.carbs),
              calories: String(result.data.calories),
            }
          : r,
      );

    if (isEdit) setEditDiets(updater);
    else setDiets(updater);
  };

  const handleOpenWrite = () => {
    const hasData = savedDiets.some((d) => isSameDate(d.date, selectedDate));
    if (hasData) {
      alert("이미 해당 날짜에 등록된 식단이 있습니다.");
      return;
    }
    setFormError(null);
    setDiets([emptyRow()]);
    setIsWriting(true);
  };

  const handleSave = async () => {
    setFormError(null);
    setIsSaving(true);
    const result = await createDiet(diets, selectedDate);
    setIsSaving(false);
    if (!result.success) {
      setFormError(result.message ?? "저장 중 오류가 발생했습니다.");
      return;
    }
    await loadData();
    setIsWriting(false);
    setDiets([emptyRow()]);
  };

  // 상세
  const openDetail = (date: Date, items: SavedDiet[]) => {
    setSelectedDate(date);
    setDetailModal(items);
  };

  const handleDeleteDay = async () => {
    if (!confirm("이 날짜의 식단을 전체 삭제하시겠습니까?")) return;
    await deleteDietsByDate(selectedDate);
    await loadData();
    setDetailModal(null);
  };

  // 수정
  const handleOpenEdit = () => {
    if (!detailModal) return;
    const rows: DietRow[] = detailModal.map((d) => ({
      id: d.id,
      mealType: d.mealType,
      foodName: d.foodName,
      amount: d.amount,
      protein: String(d.protein),
      fat: String(d.fat),
      carbs: String(d.carbs),
      calories: String(d.calories),
    }));
    setEditDiets(rows);
    setEditFormError(null);
    setDetailModal(null);
    setIsEditing(true);
  };

  const addEditRow = () => setEditDiets((prev) => [...prev, emptyRow()]);
  const removeEditRow = (id: number) => setEditDiets((prev) => prev.filter((r) => r.id !== id));
  const handleEditChange = (id: number, field: keyof DietRow, value: string) => {
    setEditDiets((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleUpdate = async () => {
    setEditFormError(null);
    setIsUpdating(true);
    const result = await updateDietsForDate(selectedDate, editDiets);
    setIsUpdating(false);
    if (!result.success) {
      setEditFormError(result.message ?? "수정 중 오류가 발생했습니다.");
      return;
    }
    await loadData();
    setIsEditing(false);
  };

  function CustomDayButton({ day, modifiers, ...buttonProps }: DayButtonProps) {
    const dayDiets = savedDiets.filter((d) => isSameDate(d.date, day.date));
    const totalCal = dayDiets.reduce((sum, d) => sum + d.calories, 0);

    return (
      <button {...buttonProps} className={`${buttonProps.className ?? ""} day-cell`}>
        <span className="day-number">{day.date.getDate()}</span>
        {dayDiets.length > 0 && (
          <div
            className="workout-preview"
            onClick={(e) => { e.stopPropagation(); openDetail(day.date, dayDiets); }}
          >
            <div className="calorie-badge">{Math.round(totalCal)} kcal</div>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="workout-container">
      <header className="diary-header">
        <h1>식단 관리</h1>
      </header>

      <section className="calender-section">
        <div className="calendar-nav">
          <select className="nav-select" value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}>
            {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select className="nav-select" value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i).map((m) => (
              <option key={m} value={m}>{m + 1}월</option>
            ))}
          </select>
        </div>

        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(day) => { if (day) setSelectedDate(day); }}
          month={new Date(viewYear, viewMonth)}
          onMonthChange={(date) => { setViewYear(date.getFullYear()); setViewMonth(date.getMonth()); }}
          components={{ DayButton: CustomDayButton }}
          locale={ko}
        />

        <button onClick={handleOpenWrite} className="write-open-btn">
          새 식단 등록하기
        </button>
      </section>

      {detailModal && (
        <DietDetailModal
          selectedDate={selectedDate}
          diets={detailModal}
          onClose={() => setDetailModal(null)}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteDay}
        />
      )}

      {isWriting && (
        <DietWriteModal
          selectedDate={selectedDate}
          diets={diets}
          formError={formError}
          isSaving={isSaving}
          calculatingId={calculatingId}
          onChange={handleChange}
          onAddRow={addRow}
          onRemoveRow={removeRow}
          onAiCalculate={handleAiCalculate}
          onSave={handleSave}
          onClose={() => { setIsWriting(false); setFormError(null); }}
        />
      )}

      {isEditing && (
        <DietEditModal
          selectedDate={selectedDate}
          editDiets={editDiets}
          editFormError={editFormError}
          isUpdating={isUpdating}
          editCalculatingId={editCalculatingId}
          onChange={handleEditChange}
          onAddRow={addEditRow}
          onRemoveRow={removeEditRow}
          onAiCalculate={handleAiCalculate}
          onUpdate={handleUpdate}
          onClose={() => { setIsEditing(false); setEditFormError(null); }}
        />
      )}
    </div>
  );
}
