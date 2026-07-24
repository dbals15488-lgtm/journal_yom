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

// ===============================
// 타입 정의
// ===============================
interface DietRow {
  id: number;
  mealType: string;
  foodName: string;
  amount: string;
  protein: string;
  fat: string;
  carbs: string;
  calories: string;
}

interface SavedDiet {
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

const MEAL_TYPES = ["아침", "점심", "저녁", "간식"];

const emptyRow = (): DietRow => ({
  id: Date.now() + Math.random(),
  mealType: "아침",
  foodName: "",
  amount: "",
  protein: "",
  fat: "",
  carbs: "",
  calories: "",
});

const MEAL_COLORS: Record<string, { bg: string; text: string }> = {
  아침: { bg: "#fff7ed", text: "#c2410c" },
  점심: { bg: "#ecfdf5", text: "#047857" },
  저녁: { bg: "#eff6ff", text: "#1d4ed8" },
  간식: { bg: "#fdf2f8", text: "#be185d" },
};

export default function DietPage() {
  // --- 캘린더 ---
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [savedDiets, setSavedDiets] = useState<SavedDiet[]>([]);

  // --- 새 등록 모달 ---
  const [isWriting, setIsWriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [diets, setDiets] = useState<DietRow[]>([emptyRow()]);
  const [calculatingId, setCalculatingId] = useState<number | null>(null);

  // --- 상세 모달 ---
  const [detailModal, setDetailModal] = useState<SavedDiet[] | null>(null);

  // --- 수정 모달 ---
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
        ? data.map((item: any) => ({ ...item, date: new Date(item.date) }))
        : []
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===============================
  // 새 등록 관련
  // ===============================
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
          : r
      );

    if (isEdit) setEditDiets(updater);
    else setDiets(updater);
  };

  // 하루 하나만 등록 가능하도록 체크
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

  // ===============================
  // 상세 모달
  // ===============================
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

  // ===============================
  // 수정 모달
  // ===============================
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

  // ===============================
  // 실시간 총 칼로리
  // ===============================
  const currentTotal = diets.reduce((sum, r) => sum + (Number(r.calories) || 0), 0);
  const editTotal = editDiets.reduce((sum, r) => sum + (Number(r.calories) || 0), 0);
  const detailTotal = detailModal
    ? detailModal.reduce((sum, d) => sum + d.calories, 0)
    : 0;

  // ===============================
  // 캘린더 날짜 칸
  // ===============================
  function CustomDayButton({ day, modifiers, ...buttonProps }: DayButtonProps) {
    const dayDiets = savedDiets.filter((d) => isSameDate(d.date, day.date));
    const totalCal = dayDiets.reduce((sum, d) => sum + d.calories, 0);

    return (
      <button {...buttonProps} className={`${buttonProps.className ?? ""} day-cell`}>
        <span className="day-number">{day.date.getDate()}</span>
        {dayDiets.length > 0 && (
          <div
            className="workout-preview"
            onClick={(e) => {
              e.stopPropagation();
              openDetail(day.date, dayDiets);
            }}
          >
            <div className="calorie-badge">{Math.round(totalCal)} kcal</div>
          </div>
        )}
      </button>
    );
  }

  // ===============================
  // 입력 폼 렌더링 (새 등록/수정 공통)
  // ===============================
  const renderDietForm = (
    rows: DietRow[],
    isEdit: boolean,
    handleChangeFn: (id: number, field: keyof DietRow, value: string) => void,
    removeRowFn: (id: number) => void,
    calcId: number | null
  ) => (
    <div className="detail-list">
      {rows.map((row, i) => (
        <div key={row.id} className="diet-card">
          <div className="diet-card-header">
            <div className="detail-card-index">{i + 1}</div>
            <select
              className="meal-select"
              value={row.mealType}
              onChange={(e) => handleChangeFn(row.id, "mealType", e.target.value)}
              style={{
                background: MEAL_COLORS[row.mealType]?.bg,
                color: MEAL_COLORS[row.mealType]?.text,
              }}
            >
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button className="edit-delete-btn" onClick={() => removeRowFn(row.id)}>✕</button>
          </div>

          <div className="diet-input-row">
            <div className="edit-field">
              <label className="edit-label">음식명</label>
              <input
                className="edit-input"
                placeholder="예: 닭가슴살"
                value={row.foodName}
                onChange={(e) => handleChangeFn(row.id, "foodName", e.target.value)}
              />
            </div>
            <div className="edit-field">
              <label className="edit-label">양 (그람 과 갯수 혹은 갯수만 적어주세요 그럼 나머진 자동으로 AI가 계산해줍니다.)</label>
              <input
                className="edit-input"
                placeholder="예: 100g, 1개"
                value={row.amount}
                onChange={(e) => handleChangeFn(row.id, "amount", e.target.value)}
              />
            </div>
            <button
              className="btn-ai"
              onClick={() => handleAiCalculate(row.id, isEdit)}
              disabled={calcId === row.id}
            >
              {calcId === row.id ? "계산 중..." : "✨ AI 계산"}
            </button>
          </div>

          <div className="diet-nutrition-row">
            <div className="edit-field edit-field-sm">
              <label className="edit-label">단백질(g)</label>
              <input className="edit-input" type="number" value={row.protein}
                onChange={(e) => handleChangeFn(row.id, "protein", e.target.value)} />
            </div>
            <div className="edit-field edit-field-sm">
              <label className="edit-label">지방(g)</label>
              <input className="edit-input" type="number" value={row.fat}
                onChange={(e) => handleChangeFn(row.id, "fat", e.target.value)} />
            </div>
            <div className="edit-field edit-field-sm">
              <label className="edit-label">탄수화물(g)</label>
              <input className="edit-input" type="number" value={row.carbs}
                onChange={(e) => handleChangeFn(row.id, "carbs", e.target.value)} />
            </div>
            <div className="edit-field edit-field-sm">
              <label className="edit-label">칼로리</label>
              <input className="edit-input" type="number" value={row.calories}
                onChange={(e) => handleChangeFn(row.id, "calories", e.target.value)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

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
          onMonthChange={(date) => {
            setViewYear(date.getFullYear());
            setViewMonth(date.getMonth());
          }}
          components={{ DayButton: CustomDayButton }}
          locale={ko}
        />

        <button onClick={handleOpenWrite} className="write-open-btn">
          새 식단 등록하기
        </button>
      </section>

      {/* 상세 모달 */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
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
              {detailModal.map((d, i) => (
                <div key={d.id} className="detail-card">
                  <div className="detail-card-index">{i + 1}</div>
                  <div className="detail-card-body">
                    <div className="detail-card-top">
                      <span
                        className="detail-part-tag"
                        style={{
                          background: MEAL_COLORS[d.mealType]?.text,
                        }}
                      >
                        {d.mealType}
                      </span>
                      <span className="detail-exercise-name">
                        {d.foodName} <span className="detail-amount">({d.amount}개) </span>
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
              <button onClick={handleOpenEdit} className="btn-save">✏️ 수정</button>
              <button onClick={handleDeleteDay} className="btn-remove">🗑 삭제</button>
              <button onClick={() => setDetailModal(null)} className="btn-close">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 새 등록 모달 */}
      {isWriting && (
        <div className="modal-overlay">
          <div className="modal-content diet-modal">
            <div className="detail-header">
              <div className="detail-date-block">
                <span className="detail-date-main">{format(selectedDate, "yyyy. MM. dd")}</span>
                <span className="detail-date-sub">식단 등록</span>
              </div>
              <span className="calorie-total-badge">총 {Math.round(currentTotal)} kcal</span>
            </div>

            {renderDietForm(diets, false, handleChange, removeRow, calculatingId)}

            {formError && <p className="form-error">{formError}</p>}

            <div className="detail-footer">
              <button onClick={addRow} className="btn-add">+ 추가</button>
              <button className="btn-save" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장하기"}
              </button>
              <button onClick={() => { setIsWriting(false); setFormError(null); }} className="btn-close">
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content diet-modal">
            <div className="detail-header">
              <div className="detail-date-block">
                <span className="detail-date-main">{format(selectedDate, "yyyy. MM. dd")}</span>
                <span className="detail-date-sub">식단 수정</span>
              </div>
              <span className="calorie-total-badge">총 {Math.round(editTotal)} kcal</span>
            </div>

            {renderDietForm(editDiets, true, handleEditChange, removeEditRow, editCalculatingId)}

            {editFormError && <p className="form-error">{editFormError}</p>}

            <div className="detail-footer">
              <button onClick={addEditRow} className="btn-add">+ 추가</button>
              <button className="btn-save" onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? "수정 중..." : "✏️ 수정하기"}
              </button>
              <button onClick={() => { setIsEditing(false); setEditFormError(null); }} className="btn-close">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}