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
            {dayWorkouts.slice(0, 3).map((w) => (
              <div key={w.id} className="workout-item">
                <b>{w.part}</b>
              </div>
            ))}
            {dayWorkouts.length > 3 && (
              <div className="workout-item">+{dayWorkouts.length - 3}개 더보기</div>
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
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(day) => { if (day) setSelectedDate(day); }}
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
            <h2>{format(selectedDate, "yyyy.MM.dd")}</h2>
            {detailModal.map((w) => (
              <div key={w.id} className="detail-item">
                <p>
                  {w.part} - 운동: {w.workoutName} / ({w.reps}회 × {w.sets}세트) 휴식 {w.restTime}분
                </p>
              </div>
            ))}
            <div style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent:'flex-end' }}>
              <button onClick={handleOpenEdit} className="btn-save">수정</button>
              <button onClick={handleDeleteDay} className="btn-remove">삭제</button>
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
      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{format(selectedDate, "yyyy.MM.dd")} 운동 기록 수정</h2>
            {editWorkouts.map((row) => (
              <div key={row.id} className="workout-row">
                <input placeholder="부위" value={row.part} onChange={(e) => handleEditChange(row.id, "part", e.target.value)} />
                <input placeholder="운동 이름" value={row.name} onChange={(e) => handleEditChange(row.id, "name", e.target.value)} />
                <input type="number" placeholder="횟수" value={row.reps} onChange={(e) => handleEditChange(row.id, "reps", e.target.value)} />
                <input type="number" placeholder="세트" value={row.sets} onChange={(e) => handleEditChange(row.id, "sets", e.target.value)} />
                <input placeholder="휴식 시간 (예: 60초)" value={row.restTime} onChange={(e) => handleEditChange(row.id, "restTime", e.target.value)} />
                <button className="btn-remove" onClick={() => removeEditRow(row.id)}>×</button>
              </div>
            ))}

            {editFormError && <p className="form-error">{editFormError}</p>}

            <div style={{ marginTop: "20px" }}>
              <button onClick={addEditRow} className="btn-add">추가</button>
              <button className="btn-save" onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? "수정 중..." : "수정하기"}
              </button>
              <button onClick={() => { setIsEditing(false); setEditFormError(null); }} className="btn-remove">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}