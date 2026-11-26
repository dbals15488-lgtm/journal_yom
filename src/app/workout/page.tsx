"use client";

import "react-day-picker/dist/style.css";
import "./workout.css";
import "../diary/diary.css";
import React, { useState, useEffect } from "react";
import { createWorkout, fetchWorkouts, updateWorkoutsForDate, deleteWorkoutsByDate } from "./actions";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { ko } from "date-fns/locale";
import { format } from "date-fns";

import { type WorkoutRow, type SavedWorkout, emptyRow } from "../../components/workout/types";
import WorkoutDetailModal from "../../components/workout/WorkoutDetailModal";
import WorkoutWriteModal from "../../components/workout/WorkoutWriteModal";
import WorkoutEditModal from "../../components/workout/WorkoutEditModal";

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
    setSavedWorkouts(
      Array.isArray(data) ? data.map((item: SavedWorkout) => ({ ...item, date: new Date(item.date) })) : [],
    );
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // 새 작성
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
    if (error) { setFormError(error); return; }
    setFormError(null);
    setIsSaving(true);
    const result = await createWorkout(workouts, selectedDate);
    setIsSaving(false);
    if (!result.success) { setFormError(result.message ?? "저장 중 오류가 발생했습니다."); return; }
    await loadData();
    setIsWriting(false);
    setWorkouts([emptyRow()]);
  };

  // 상세
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

  // 수정
  const handleOpenEdit = () => {
    if (!detailModal) return;
    const rows: WorkoutRow[] = detailModal.map((w) => ({
      id: w.id, part: w.part, name: w.workoutName,
      reps: String(w.reps), sets: String(w.sets), restTime: w.restTime,
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
    if (error) { setEditFormError(error); return; }
    setEditFormError(null);
    setIsUpdating(true);
    const result = await updateWorkoutsForDate(selectedDate, editWorkouts);
    setIsUpdating(false);
    if (!result.success) { setEditFormError(result.message ?? "수정 중 오류가 발생했습니다."); return; }
    await loadData();
    setIsEditing(false);
  };

  function CustomDayButton({ day, modifiers, ...buttonProps }: DayButtonProps) {
    const dayWorkouts = savedWorkouts.filter((w) => isSameDate(w.date, day.date));

    return (
      <button {...buttonProps} className={`${buttonProps.className ?? ""} day-cell`}>
        <span className="day-number">{day.date.getDate()}</span>
        {dayWorkouts.length > 0 && (
          <div
            className="workout-preview"
            onClick={(e) => { e.stopPropagation(); openDetail(day.date, dayWorkouts); }}
          >
            {dayWorkouts.slice(0, 1).map((w) => (
              <div key={w.id} className="workout-item"><b>{w.part}</b></div>
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
            <select className="nav-select" value={viewYear} onChange={(e) => setViewYear(Number(e.target.value))}>
              {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
            <select className="nav-select" value={viewMonth} onChange={(e) => setViewMonth(Number(e.target.value))}>
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
          onMonthChange={(date) => { setViewYear(date.getFullYear()); setViewMonth(date.getMonth()); }}
          components={{ DayButton: CustomDayButton }}
          locale={ko}
        />
        <button onClick={handleOpenWrite} className="write-open-btn">
          새 운동 일지 작성하기
        </button>
      </section>

      {detailModal && (
        <WorkoutDetailModal
          selectedDate={selectedDate}
          workouts={detailModal}
          onClose={() => setDetailModal(null)}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteDay}
        />
      )}

      {isWriting && (
        <WorkoutWriteModal
          selectedDate={selectedDate}
          workouts={workouts}
          formError={formError}
          isSaving={isSaving}
          onChange={handleChange}
          onAddRow={addRow}
          onRemoveRow={removeRow}
          onSave={handleSave}
          onClose={() => { setIsWriting(false); setFormError(null); }}
        />
      )}

      {isEditing && (
        <WorkoutEditModal
          selectedDate={selectedDate}
          editWorkouts={editWorkouts}
          editFormError={editFormError}
          isUpdating={isUpdating}
          onChange={handleEditChange}
          onAddRow={addEditRow}
          onRemoveRow={removeEditRow}
          onUpdate={handleUpdate}
          onClose={() => { setIsEditing(false); setEditFormError(null); }}
        />
      )}
    </div>
  );
}
