"use client";

import "react-day-picker/dist/style.css";
import "./workout.css";
import "../diary/diary.css";
import React, { useState, useEffect } from "react";
import { createWorkout, fetchWorkouts, updateWorkoutsForDate, deleteWorkoutsByDate } from "./actions";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { ko } from "date-fns/locale";
import { format } from "date-fns";

interface WorkoutRow {
  id: number;
  part: string;
  name: string;
  reps: string;
  sets: string;
  restTime: string;
}

interface SavedWorkout {
  id: number;
  date: Date;
  part: string;
  workoutName: string;
  reps: number;
  sets: number;
  restTime: string;
}

const emptyRow = (): WorkoutRow => ({
  id: Date.now() + Math.random(),
  part: "",
  name: "",
  reps: "",
  sets: "",
  restTime: "",
});

export default function WorkoutPage() {
  const [isWriting, setIsWriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editWorkouts, setEditWorkouts] = useState<WorkoutRow[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [detailModal, setDetailModal] = useState<SavedWorkout[] | null>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([emptyRow()]);

  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const isSameDate = (d1: Date, d2: Date) => format(d1, "yyyy-MM-dd") === format(d2, "yyyy-MM-dd");

  const loadData = async () => {
    const data = await fetchWorkouts();
    setSavedWorkouts(Array.isArray(data) ? data.map((item: any) => ({ ...item, date: new Date(item.date) })) : []);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- 검증 (작성/수정 공용) ---
  const validate = (rows: WorkoutRow[]): string | null => {
    for (const row of rows) {
      if (!row.part.trim()) return "운동 부위를 입력해주세요.";
      if (!row.name.trim()) return "운동 이름을 입력해주세요.";
      if (!row.reps || Number(row.reps) <= 0) return "횟수를 입력해주세요.";
      if (!row.sets || Number(row.sets) <= 0) return "세트 수를 입력해주세요.";
      if (!row.restTime.trim()) return "휴식 시간을 입력해주세요.";
    }
    return null;
  };

  // --- 새 작성 모달 ---
  const addRow = () => setWorkouts((prev) => [...prev, emptyRow()]);
  const removeRow = (id: number) => setWorkouts((prev) => prev.filter((row) => row.id !== id));
  const handleChange = (id: number, field: keyof WorkoutRow, value: string) => {
    setWorkouts((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleOpenWrite = () => {
    const hasData = savedWorkouts.some((w) => isSameDate(w.date, selectedDate));
    if (hasData) {
      alert("이미 해당 날짜에 등록된 운동 일지가 있습니다.");
      return;
    }
    setFormError(null);
    setWorkouts([emptyRow()]);
    setIsWriting(true);
  };

  const handleSave = async () => {
    const error = validate(workouts);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setIsSaving(true);
    const result = await createWorkout(workouts, selectedDate);
    setIsSaving(false);

    if (!result.success) {
      setFormError(result.message ?? "저장 중 오류가 발생했습니다.");
      return;
    }
    await loadData();
    setIsWriting(false);
    setWorkouts([emptyRow()]);
  };

  // --- 상세 모달 ---
  const openDetail = (date: Date, items: SavedWorkout[]) => {
    setSelectedDate(date);
    setDetailModal(items);
  };

  const handleDeleteDay = async () => {
    if (!confirm("이 날짜의 운동 일지를 전체 삭제하시겠습니까?")) return;
    await deleteWorkoutsByDate(selectedDate);
    await loadData();
    setDetailModal(null);
  };

  // --- 수정 모달 ---
  const handleOpenEdit = () => {
    if (!detailModal) return;
    const rows: WorkoutRow[] = detailModal.map((w) => ({
      id: w.id,
      part: w.part,
      name: w.workoutName,
      reps: String(w.reps),
      sets: String(w.sets),
      restTime: w.restTime,
    }));
    setEditWorkouts(rows);
    setEditFormError(null);
    setDetailModal(null);
    setIsEditing(true);
  };

  const addEditRow = () => setEditWorkouts((prev) => [...prev, emptyRow()]);
  const removeEditRow = (id: number) => setEditWorkouts((prev) => prev.filter((row) => row.id !== id));
  const handleEditChange = (id: number, field: keyof WorkoutRow, value: string) => {
    setEditWorkouts((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleUpdate = async () => {
    const error = validate(editWorkouts);
    if (error) {
      setEditFormError(error);
      return;
    }
    setEditFormError(null);
    setIsUpdating(true);
    const result = await updateWorkoutsForDate(selectedDate, editWorkouts);
    setIsUpdating(false);

    if (!result.success) {
      setEditFormError(result.message ?? "수정 중 오류가 발생했습니다.");
      return;
    }
    await loadData();
    setIsEditing(false);
  };



  // --- 캘린더 날짜 칸 커스텀 ---
  function CustomDayButton({ day, modifiers, ...buttonProps }: DayButtonProps) {
    const dayWorkouts = savedWorkouts.filter((w) => isSameDate(w.date, day.date));

    return (
      <button {...buttonProps} className={`${buttonProps.className ?? ""} day-cell`}>
        <span className="day-number">{day.date.getDate()}</span>
        {dayWorkouts.length > 0 && (
          <div
            className="workout-preview"
            onClick={(e) => {
              e.stopPropagation();
              openDetail(day.date, dayWorkouts);
            }}
          >
            {dayWorkouts.slice(0, 1).map((w) => (
              <div key={w.id} className="workout-item">
                <b>{w.part}</b>
              </div>
            ))}
            {dayWorkouts.length > 1 && (
              <div className="workout-item">+{dayWorkouts.length - 1}개 더보기</div>
            )}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="workout-container">
      <header className="diary-header">
        <h1>운동 일지</h1>
      </header>

      <section className="calender-section">
        <div className="calendar-nav">

          <div className="nav-center">
            <select
              className="nav-select"
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
            >
              {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
            <select
              className="nav-select"
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                <option key={m} value={m}>{m + 1}월</option>
              ))}
            </select>
          </div>

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
          새 운동 일지 작성하기
        </button>
      </section>

      {/* 상세 모달: 수정 / 삭제(전체) / 닫기 */}
      {detailModal && (
  <div className="modal-overlay" onClick={() => setDetailModal(null)}>
        <div className="modal-content2" onClick={(e) => e.stopPropagation()}>

          {/* 날짜 헤더 */}
          <div className="detail-header">
            <div className="detail-date-block">
              <span className="detail-date-main">{format(selectedDate, "yyyy. MM. dd")}</span>
              <span className="detail-date-sub">{format(selectedDate, "EEEE", { locale: ko })}</span>
            </div>
            <span className="detail-count-badge">{detailModal.length}개 운동</span>
          </div>

          {/* 운동 목록 */}
          <div className="detail-list">
            {detailModal.map((w, i) => (
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

          {/* 버튼 영역 */}
          <div className="detail-footer">
            <button onClick={handleOpenEdit} className="btn-save">✏️ 수정</button>
            <button onClick={handleDeleteDay} className="btn-remove">🗑 삭제</button>
            <button onClick={() => setDetailModal(null)} className="btn-close">닫기</button>
          </div>

        </div>
      </div>
    )}

      {/* 새 작성 모달 */}
      {isWriting && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{format(selectedDate, "yyyy.MM.dd")} 운동 기록</h2>
            {workouts.map((row) => (
              <div key={row.id} className="workout-row">
                <input placeholder="부위" value={row.part} onChange={(e) => handleChange(row.id, "part", e.target.value)} />
                <input placeholder="운동 이름" value={row.name} onChange={(e) => handleChange(row.id, "name", e.target.value)} />
                <input type="number" placeholder="횟수" value={row.reps} onChange={(e) => handleChange(row.id, "reps", e.target.value)} />
                <input type="number" placeholder="세트" value={row.sets} onChange={(e) => handleChange(row.id, "sets", e.target.value)} />
                <input placeholder="휴식 시간 (예: 60초)" value={row.restTime} onChange={(e) => handleChange(row.id, "restTime", e.target.value)} />
                <button className="btn-remove" onClick={() => removeRow(row.id)}>×</button>
              </div>
            ))}

            {formError && <p className="form-error">{formError}</p>}

            <div style={{ marginTop: "20px" }}>
              <button onClick={addRow} className="btn-add">추가</button>
              <button className="btn-save" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장하기"}
              </button>
              <button onClick={() => { setIsWriting(false); setFormError(null); }} className="btn-remove">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
   {/* 수정 모달 */}
{isEditing && (
  <div className="modal-overlay">
    <div className="modal-content edit-modal">

      {/* 헤더 */}
      <div className="detail-header">
        <div className="detail-date-block">
          <span className="detail-date-main">{format(selectedDate, "yyyy. MM. dd")}</span>
          <span className="detail-date-sub">운동 기록 수정</span>
        </div>
        <span className="detail-count-badge">{editWorkouts.length}개 운동</span>
      </div>

      {/* 수정 목록 */}
      <div className="detail-list">
          {editWorkouts.map((row, i) => (
            <div key={row.id} className="edit-card">
              <div className="edit-card-header">
                <div className="detail-card-index">{i + 1}</div>
                <span className="edit-card-title">
                  {row.part || "부위 미입력"} — {row.name || "운동명 미입력"}
                </span>
                <button className="edit-delete-btn" onClick={() => removeEditRow(row.id)}>✕</button>
              </div>

              <div className="edit-fields">
                <div className="edit-field">
                  <label className="edit-label">부위</label>
                  <input
                    className="edit-input"
                    placeholder="예: 상체"
                    value={row.part}
                    onChange={(e) => handleEditChange(row.id, "part", e.target.value)}
                  />
                </div>
                <div className="edit-field">
                  <label className="edit-label">운동 이름</label>
                  <input
                    className="edit-input"
                    placeholder="예: 벤치프레스"
                    value={row.name}
                    onChange={(e) => handleEditChange(row.id, "name", e.target.value)}
                  />
                </div>
                <div className="edit-field edit-field-sm">
                  <label className="edit-label">횟수</label>
                  <input
                    className="edit-input"
                    type="number"
                    placeholder="회"
                    value={row.reps}
                    onChange={(e) => handleEditChange(row.id, "reps", e.target.value)}
                  />
                </div>
                <div className="edit-field edit-field-sm">
                  <label className="edit-label">세트</label>
                  <input
                    className="edit-input"
                    type="number"
                    placeholder="세트"
                    value={row.sets}
                    onChange={(e) => handleEditChange(row.id, "sets", e.target.value)}
                  />
                </div>
                <div className="edit-field edit-field-sm">
                  <label className="edit-label">휴식 시간</label>
                  <input
                    className="edit-input"
                    placeholder="예: 60초"
                    value={row.restTime}
                    onChange={(e) => handleEditChange(row.id, "restTime", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {editFormError && <p className="form-error">{editFormError}</p>}

        {/* 하단 버튼 */}
        <div className="detail-footer">
          <button onClick={addEditRow} className="btn-add">+ 추가</button>
          <button className="btn-save" onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? "수정 중..." : "✏️ 수정하기"}
          </button>
          <button onClick={() => { setIsEditing(false); setEditFormError(null); }} className="btn-close">
            닫기
          </button>
        </div>

      </div>
    </div>
  )}
    </div>
  );
}