"use client"

import { useState } from 'react';

import Link from 'next/link';

import styles from './page.module.css'

import Sidebar from '@/components/layout/Sidebar'
import Calendar from '@/components/layout/Calendar'
import HabitEditor from '@/components/HabitEditor/HabitEditor';
import { useRecords } from '@/context/RecordContext';


export default function Home() {
  
  // 상태(state) 만들기 : 현재 어떤 달을 보고 있는지?
  const today = new Date()
  const [ selectedMonth, setSelectedMonth] = useState(today.getMonth() +1); // 지금 몇월인지 기록
  const [selectedYear, setSelectedYear] = useState(today.getFullYear()) // 년도 기록
  const [selectedDay, setSelectedDay] = useState(null)

  // 중요! 모든 기록을 담는 저장소 (배열)
  

  const {records, addRecord} = useRecords();

  // 저장 함수

  const handleSave = (title, text) => {

    // 현재 시간
    const now = new Date();

    // 시간 표기 
    const timeString = now.toLocaleTimeString('ko-KR', {
      hour : '2-digit',
      minute : '2-digit',
      second : '2-digit',
    });

    const newRecord = {
      id : Date.now(),
      title,
      content: text,
      saveTime : timeString,  //우리가 읽을 수 있는 시간으로 추가
      month: selectedMonth,
      day: selectedDay,
    };
    addRecord(newRecord)
    alert("저장되어습니다.")
  }

  

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  
  return (
    <div className={styles.container}>
      {/* 사이드바 영역 */}
      <Sidebar
      months={months}
      selectedMonth={selectedMonth}
      onMonthSelect={(m) =>{
        setSelectedMonth(m);
        setSelectedDay(null)
      }}
      />

      {/* 메인 영역 */}
      <main className={styles.main}>
            <header>
              <h1 style={{fontSize:'2.5rem', fontWeight:'800'}}>{selectedMonth}월 학습 일지</h1>
            </header>

            <Calendar 
            selectedMonth={selectedMonth}
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
            />

          {selectedDay && (
            // 날짜가 선택되었을 때만 에디터 등장
            <HabitEditor
            selectedMonth={selectedMonth}
            selectedDay={selectedDay}
            onSave={handleSave}
            />
          )}

          {/* 저장된 기록들 확인용 (나중에 바꿀예정) */}
          <div style={{marginTop:'2rem'}}> 
            <h3 style={{marginBottom:'20px'}}>내 기록 리스트 ({records.length}개)</h3>
            <div className={styles.recordGrid}>
                {records.map( r => (
                  <Link key={r.id} href={`/detail/${r.id}`} style={{textDecoration:'none'}}>
                    <div className={styles.recordCard}>
                        <div className={styles.recordHeader}>
                          <span className={styles.dateTag}><span className={styles.dayTag}>{r.month}월{r.day}</span>{r.title}</span>
                          <span className={styles.timeTag}>{r.saveTime}</span>
                        </div>
                    </div>
                  </Link>
                ))}
            </div>
            
          </div>
      </main>
    </div>
  );
}
