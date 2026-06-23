"use client";

import "react-day-picker/dist/style.css";
import "./workout.css"; 
import "../diary/diary.css"

import React, { useState, useEffect } from "react";
import { createWorkout, deleteWorkout, fetchWorkouts } from "./actions";
import { DayPicker } from "react-day-picker";
import { ko } from "date-fns/locale";
import { format, isSameDay } from "date-fns"; 

export default function WorkoutPage() {
  const [isWriting, setIsWriting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<any[]>([]);

  const isSameDate = (d1: Date, d2: Date) => {
    return format(d1, "yyyy-MM-dd") === format(d2, "yyyy-MM-dd");
  };

  useEffect(() => {
    async function loadWorkouts() {
      try {
        const data = await fetchWorkouts();
        const workoutArray = Array.isArray(data) ? data : [];
        
        const formattedData = workoutArray.map(item => ({
          ...item,
          date: new Date(item.date)
        }));
        
        setSavedWorkouts(formattedData);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
        setSavedWorkouts([]);
      }
    }
    loadWorkouts();
  }, []);



  const [workouts, setWorkouts] = useState([
    { id: Date.now(), name: "", reps: 0, sets: 0, restTime: "" }
  ]);

  const addRow = (index: number) => {
    if (workouts.length < 15) {
      const newWorkouts = [...workouts];
      newWorkouts.splice(index + 1, 0, { id: Date.now(), name: "", reps: 0, sets: 0, restTime: "" });
      setWorkouts(newWorkouts);
    } else {
      alert("운동은 최대 15개까지 추가 가능합니다.");
    }
  };

  const removeRow = (id: number) => {
    setWorkouts(workouts.filter((row) => row.id !== id));
  };

  const handleChange = (id: number, field: string, value: string | number) => {
    setWorkouts(workouts.map((row) => row.id === id ? { ...row, [field]: value } : row));
  };

  return (
    <div className="workout-container">
      <header className="diary-header">
        <h1>운동 일지</h1>
      </header>

<main className="diary-content">
  <section className="calender-section">
    <DayPicker
      mode="single"
      selected={selectedDate}
      onSelect={(day) => {
        if (day) {
          setSelectedDate(day);
          const found = Array.isArray(savedWorkouts) 
            ? savedWorkouts.find(w => isSameDate(w.date, day)) 
            : null;
      
          if (found) {
            setSelectedWorkout(found);
          } else {
            setSelectedWorkout(null);
          }
        }
      }}
      components={{
        DayContent: (props) => (
          <div className="day-cell">
            <span className="day-number">{format(props.date, "d")}</span>
            <div className="workout-preview">
              {savedWorkouts
                .filter(w => isSameDate(w.date, props.date)) // 여기서 props.date 사용
                .slice(0, 2)
                .map((w, i) => (
                  <span key={i} className="workout-item">{w.workoutName}</span>
                ))
              }
            </div>
          </div>
        )
      }}
      locale={ko}
    />
    <button className="write-open-btn" onClick={() => setIsWriting(true)}>새 운동 일지 작성하기</button>
  </section>

  {selectedWorkout && (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{format(selectedDate, "yyyy년 MM월 dd일")} 운동</h2>
        <p>운동: {selectedWorkout.workoutName}</p>
        <p>{selectedWorkout.reps}회 / {selectedWorkout.sets}세트 / 휴식: {selectedWorkout.restTime}</p>
        <button onClick={() => { setIsWriting(true); setSelectedWorkout(null); }}>수정</button>
        <button onClick={async () => { await deleteWorkout(selectedWorkout.id); setSelectedWorkout(null); }}>삭제</button>
        <button onClick={() => setSelectedWorkout(null)}>취소</button>
      </div>
    </div>
  )}

  {isWriting && (
       <section className="write-section">
       <h2>운동 기록 작성 ({selectedDate.toLocaleDateString()})</h2>
       {workouts.map((row, index) => (
         <div key={row.id} className="workout-row">
           <input placeholder="운동 이름" value={row.name} onChange={(e) => handleChange(row.id, "name", e.target.value)} />
           <input type="number" placeholder="횟수" value={row.reps || ""} onChange={(e) => handleChange(row.id, "reps", Number(e.target.value))} />
           <input type="number" placeholder="세트" value={row.sets || ""} onChange={(e) => handleChange(row.id, "sets", Number(e.target.value))} />
           <input type="text" placeholder="휴식 (예: 1:30)" value={row.restTime} onChange={(e) => handleChange(row.id, "restTime", e.target.value)} />
           
           <button className="btn-add" onClick={() => addRow(index)}>+</button>
           {workouts.length > 1 && (
             <button className="btn-remove" onClick={() => removeRow(row.id)}>-</button>
           )}
         </div>
       ))}
       
       <div style={{ marginTop: "20px" }}>
       <button className="btn-save" onClick={async () => {
            const result = await createWorkout(workouts, selectedDate); 
            
            if(result?.success){
                alert("운동 일지가 저장되었습니다.");
                setIsWriting(false);
            } else {
                alert("저장에 실패했습니다.");
            }
          }}>저장하기</button>
         <button className="delete-btn" onClick={() => setIsWriting(false)} style={{ marginLeft: "10px" }}>취소</button>
       </div>
     </section>
  )}
</main>
    </div>
  );
}