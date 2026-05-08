"use client"

import { useEffect, useState } from 'react';

import Link from 'next/link';

import styles from './page.module.css'

import Sidebar from '@/components/layout/Sidebar'
import Calendar from '@/components/layout/Calendar'
import HabitEditor from '@/components/HabitEditor/HabitEditor';
// import { useRecords } from '@/context/RecordContext';


export default function Home() {
  
  // 상태(state) 만들기 : 현재 어떤 달을 보고 있는지?
  const today = new Date()
  const [ selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 지금 몇월인지 기록
  const [selectedYear, setSelectedYear] = useState(today.getFullYear()) // 년도 기록
  const [selectedDay, setSelectedDay] = useState(null)
  

  // 중요! 모든 기록을 담는 저장소 (배열)
  

  const [dbRecords, setDbRecords] = useState([]); //빈배열 

  const fetchRecords = async () => {
    try{
      const response = await fetch('/api/record'); //우리가 만든 api 호출
      if (response.ok){
        const data = await response.json();
        setDbRecords(data) // 가져온 데이터를 바구니에 담기
      }
    }catch(error) {
      console.error("데이터 로드 실패:", error);
    }
  };

    useEffect(() => {
      fetchRecords();
    }, []);

  // 저장 함수

  const handleSaveAfter = async () => {
    await fetchRecords(); // DB에 저장됐으니 다시 금고에서 꺼내오기
    setSelectedDay(null); // 에디터 닫기
  }

  

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  const filteredRecords = dbRecords.filter(record => {
    const recordDate = new Date(record.createdAt);
    return (recordDate.getMonth() + 1) === selectedMonth;
  })

  
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
            onSave={handleSaveAfter}
            />
          )}

          
          <div style={{marginTop:'2rem'}}> 
            <h3 style={{marginBottom:'20px'}}>내 기록 리스트 ({filteredRecords.length}개)</h3>
            <div className={styles.recordGrid}>
                {filteredRecords.map( r => (
                  <Link key={r.id} href={`/detail/${r.id}`} style={{textDecoration:'none'}}>
                    <div className={styles.recordCard}>
                        <div className={styles.recordHeader}>
                          <div>
                          <span className={styles.dateTag}>
                            {new Date(r.createdAt).getMonth() +1}월 {new Date(r.createdAt).getDate()}일
                            </span>
                          <strong className={styles.recordTitle}>{r.title}</strong>
                          </div>
                         
                            
                          <span className={styles.timeTag}>
                            {new Date(r.createdAt).toLocaleTimeString('ko-KR',{
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            </span>
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
