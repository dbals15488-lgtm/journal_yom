"use client"

import React, { useEffect, useState } from "react"
import "./diary.css";
import { getDiaryList, createDiary, deleteDiary } from "./actions"
import Link from "next/link";
import dynamic from "next/dynamic";

const ToastEditor = dynamic(() => import("../../components/ToastEditor/ToastEditor"),{
    ssr: false,
    loading: () => <p>에디더를 로딩 중입니다..</p>
})

export default function DiaryPage() {
    // 1. 상태 관리
    const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // 내가 실제로 클릭한 날짜
    const [viewDate, setViewDate] = useState<Date>(new Date()); // 현재 달력으로 보여줄 년/월 시점
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // 파일 담아둘 임시 저장소
    
    const [isWriting, setIsWriting] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");


    // 2. 년도/월 데이터 계산
    const currentYear = new Date().getFullYear();
    const yearRange = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i); // 현 년도 기준 -3 ~ +3
    const months = Array.from({ length: 12 }, (_, i) => i); // 0 ~ 11 (1월~12월)

    // 해당 월의 마지막 날짜 구하기 (예: 2월은 28일 혹은 29일)
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

    useEffect(() => {
        async function fetchLogs() {
            const data = await getDiaryList();
            setRecords(data);
        }
        fetchLogs();
    }, [])

    // 3. 별 표시 로직 수정 (하드코딩 제거)
    const hasRecord = (day: number) => {
        return records.some(record => {
            const recordDate = new Date(record.createdAt);
            return recordDate.getFullYear() === viewDate.getFullYear() &&
                   recordDate.getMonth() === viewDate.getMonth() &&
                   recordDate.getDate() === day;
        })
    }

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            alert("제목과 내용을 모두 입력해주세요!")
            return
        }

        let uploadedFileUrl: string | null = null;
        
      if(selectedFile){
        try{
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if(!response.ok){
                throw new Error("파일 업로드 서버 에러")
            }

            const uploadResult = await response.json();
            uploadedFileUrl = uploadResult.fileUrl;
        }catch(err){
            alert("파일 업로드 도중 오류가 발생했습니다.")
            console.error(err)
        }
      }

      const result = await createDiary(title, content, selectedDate.toISOString(), uploadedFileUrl);

      if(result.success){
        alert("일지가 성공적으로 저장되었습니다.")
        setTitle("");
        setContent("");
        setSelectedFile(null);
        setIsWriting(false);
        const updatedData = await getDiaryList();
        setRecords(updatedData);
      } else{
        alert("오류가 발생했습니다 :" + result.error);
      }
    };

    const handleDelete = async (id: number) => {
        if(!window.confirm("정말로 이 일지를 삭제하시겠습니까?")){
            return;
        }

        const result = await deleteDiary(id);

        if(result.success){
            alert("일지가 성공적으로 삭제되었습니다.");
            setActiveId(null);

            const updatedData = await getDiaryList();
            setRecords(updatedData);
        }else{
            alert("삭제 도중 오류가 발생했습니다.:" + result.error);
        }
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
    
          const maxSize = 5 * 1024 * 1024;
          if(file.size > maxSize){
            alert("파일 크기는 5MB 이하의 파일만 업로드할 수 있습니다.")
            e.target.value = '';
            setSelectedFile(null);
            return
          }
    
          setSelectedFile(file);
        }
      };


    // 년도 혹은 월 변경 핸들러
    const handleViewChange = (year: number, month: number) => {
        setViewDate(new Date(year, month, 1));
    };

    return (
        <div className="diary-container">
            <header className="diary-header">
                <button onClick={() => window.location.href = "/"} className="back-btn">⬅ 메인으로</button>
                <h1>오늘의 일지</h1>
                <div className="user-info">👤 사용자 님</div>
            </header>

            <main className="diary-content">
                {!isWriting ? (
                    <>
                        <section className="calender-section">
                            <div className="calendar-temp">
                                <div className="calendar-selector">
                                    <select 
                                        value={viewDate.getFullYear()} 
                                        onChange={(e) => handleViewChange(Number(e.target.value), viewDate.getMonth())}
                                        className="calendar-selector"
                                    >
                                        {yearRange.map(y => <option key={y} value={y}>{y}년</option>)}
                                    </select>
                                    <select 
                                        value={viewDate.getMonth()} 
                                        onChange={(e) => handleViewChange(viewDate.getFullYear(), Number(e.target.value))}
                                        className="calendar-selector"
                                    >
                                        {months.map(m => <option key={m} value={m}>{m + 1}월</option>)}
                                    </select>
                                </div>
                                <h1 style={{textAlign:"center"}}>{viewDate.getMonth() + 1}월</h1>

                                <div className="calendar-grid">
                                    {[...Array(daysInMonth)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`day ${
                                                selectedDate.getFullYear() === viewDate.getFullYear() &&
                                                selectedDate.getMonth() === viewDate.getMonth() &&
                                                selectedDate.getDate() === i + 1 ? 'active' : ''
                                            }`}
                                            onClick={() => setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1))}
                                        >
                                            {i + 1}
                                            {hasRecord(i + 1) && <span className="star">⭐</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button className="write-open-btn" onClick={() => setIsWriting(true)}>새 일지 작성하기</button>
                        </section>

                        <section className="list-section">
                            <h3>{selectedDate.toLocaleDateString()} 기록</h3>
                            {records.filter(r => new Date(r.createdAt).toDateString() === selectedDate.toDateString()).length > 0 ? (
                                records
                                    .filter(r => new Date(r.createdAt).toDateString() === selectedDate.toDateString())
                                    .map((item: any) => {
                                        const isSelected = activeId === item.id;
                                        return (
                                            <div key={item.id} className={`record-item ${isSelected ? 'active' : ''}`}
                                                onClick={() => setActiveId(isSelected ? null : item.id)}
                                                style={{ display: "flex", flexDirection: "column", gap: "5px", cursor: "pointer", position: "relative" }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" ,width:"100%"}}>
                                                    <div className="record-text-group">
                                                        <h4>{item.title}</h4>
                                                        <div dangerouslySetInnerHTML={{__html: item.content}} />
                                                    </div>
                                                    {isSelected && (
                                                        <div className="action-btn-group" onClick={(e) => e.stopPropagation()}>
                                                            <Link href={`/detail/${item.id}`}><button className="view-btn">보기</button></Link>
                                                            <button className="delete-btn" onClick={() => handleDelete(item.id)}>삭제</button>
                                                        </div>
                                                    )}
                                                </div>

                                            
                                            </div>
                                        );
                                    })
                            ) : (
                                <p className="no-data">작성된 기록이 없습니다.</p>
                            )}
                        </section>
                    </>
                ) : (
                    <section className="write-section">
                        <div className="write-header"><h2 style={{marginBottom:'10px'}}>일지 작성하기</h2></div>
                        <input type="text" placeholder="제목을 입력하세요" className="write-title" value={title} onChange={(e) => setTitle(e.target.value)} />

                        <div style={{ marginTop: '25px', marginBottom: '25px', backgroundColor: '#fff', textAlign: 'left' }}>
                            <ToastEditor content={content} setContent={setContent} />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div className="file_upload_box">
                                <input 
                                type="file" 
                                className="file-upload"
                                onChange={handleFileChange}
                                /> 
                                <span style={{color:'red'}}>*파일은 5MB이하만 등록이가능합니다.</span>
                            </div>
                            
                            <div>
                                <button className="view-btn" onClick={handleSave}>저장하기</button>
                                <button className="delete-btn" onClick={() =>
                                    {setTitle("");
                                    setContent("")
                                    setSelectedFile(null);
                                    setIsWriting(false)}}>취소</button>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}