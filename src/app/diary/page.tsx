"use client"

import React, { useEffect, useState ,useMemo} from "react"
import "./diary.css";
import { getDiaryList, createDiary, deleteDiary } from "./actions"
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

// Turbopack 환경에 안전하게 에디터 기본 CSS 로드
import "react-quill-new/dist/quill.snow.css";
import { DayPicker } from "react-day-picker";
import 'react-day-picker/dist/style.css'
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 💡 1. Next.js 환경에서 React-Quill 안전하게 로드
const ReactQuill = dynamic(
    async () => {
        const { default: MQ } = await import("react-quill-new");
        return MQ;
    },
    { 
        ssr: false, 
        loading: () => <p>에디터를 로딩 중입니다...</p> 
    }
);

const modules = {
    toolbar: {
        container: [
            ['htmlEdit'], 
            [{ 'font': [] }, { 'size': [] }],
            ['bold', 'italic', 'underline', 'strike'],        
            [{ 'color': [] }, { 'background': [] }],          
            [{ 'script': 'sub' }, { 'script': 'super' }],      
            [{ 'header': '1' }, { 'header': '2' }, 'blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }, { 'align': [] }],        
            ['link', 'image', 'video'],                       
            ['clean']                                         
        ]
    }
};

const formats = [
    'font', 'size', 'bold', 'italic', 'underline', 'strike', 'color', 'background',
    'script', 'header', 'blockquote', 'code-block', 'list', 'indent', 'direction', 'align', 'link', 'image', 'video'
];

export default function DiaryPage() {
    const {data : session, status} = useSession();

    // 상태 관리
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [viewDate, setViewDate] = useState(() => new Date());
    const [selectedFile, setSelectedFile] = useState<File[]>([]); 
    const [isLoaded, setIsLoaded] = useState(false);
    
    const [isWriting, setIsWriting] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isHtmlMode, setIsHtmlMode] = useState(false);

    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

    const formatHtmlSource = (htmlString: string) => {
        if (!htmlString) return "";
        return htmlString
            .replace(/\n/g, "")
            .replace(/(<\/p>|<\/div>|<\/h1>|<\/h2>|<\/blockquote>|<\/pre>|<br\s*\/?>)/gi, "$1\n")
            .replace(/(<p>|<p\s[^>]*>|<div>|<div\s[^>]*>|<h1>|<h2>|<blockquote>|<pre>)/gi, "\n$1")
            .replace(/\n+/g, "\n")
            .trim();
    };

    const toggleHtmlMode = () => {
        setIsHtmlMode((prev) => {
            const nextMode = !prev;
            if (nextMode) {
                setContent((currentContent) => formatHtmlSource(currentContent));
            }
            return nextMode;
        });
    };

    // 툴바 내부 커스텀 핸들러 연결
    if (modules.toolbar && !(modules.toolbar as any).handlers) {
        (modules.toolbar as any).handlers = {
            htmlEdit: toggleHtmlMode
        };
    }

    // 년도/월 데이터 계산
    const yearRange = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i); 
    const months = Array.from({ length: 12 }, (_, i) => i); 

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

    useEffect(() => {
        async function fetchLogs() {
            if (session) {
                const data = await getDiaryList();
                setRecords(data);
                setIsLoaded(true)
            }
        }
        fetchLogs();
    }, [session]);

  

    // 저장 처리 함수 (MySQL DB 연동)
    const handleSave = async () => {
        const isContentEmpty = !content || content === "<p><br></p>" || content.trim() === "";

        if (!title.trim() || isContentEmpty) {
            alert("제목과 내용을 모두 입력해주세요!")
            return
        }

        let uploadedFileUrls: string[] = [];
        
        if (selectedFile && selectedFile.length > 0) {
            for (const file of selectedFile) {
                const formData = new FormData();
                formData.append("file", file);
                const response = await fetch("/api/upload", { method: "POST", body: formData });
                const data = await response.json();
                if (data.fileUrl) uploadedFileUrls.push(data.fileUrl); 
            }
        }

        const result = await createDiary(title, content, selectedDate.toISOString(), uploadedFileUrls);

        if (result.success) {
            alert("일지가 성공적으로 저장되었습니다.")
            setTitle("");
            setContent(""); 
            setSelectedFile([]);
            setIsWriting(false);
            setIsHtmlMode(false); 
            const updatedData = await getDiaryList();
            setRecords(updatedData);
        } else {
            alert("오류가 발생했습니다: " + result.error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("정말로 이 일지를 삭제하시겠습니까?")) {
            return;
        }

        const result = await deleteDiary(id);

        if (result.success) {
            alert("일지가 성공적으로 삭제되었습니다.");
            setActiveId(null);
            const updatedData = await getDiaryList();
            setRecords(updatedData);
        } else {
            alert("삭제 도중 오류가 발생했습니다.:" + result.error);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
          
            if(selectedFile.length >= 3) {
                alert("파일은 최대 3개까지만 등록 가능합니다.");
                return;
            }
            if(file.size > 5 * 1024 * 1024){
                alert("5MB 이하 파일만 가능합니다.")
                return;
            }
            setSelectedFile((prev) => [...prev, file])
        }
    };

    const handleViewChange = (year: number, month: number) => {
        setViewDate(new Date(year, month, 1));
    };

    const hasRecord = (date: Date) => {
        if (!date || isNaN(date.getTime())) return false;
        
        return records.some(record => {
          if (!record?.createdAt) return false;
          
          const recordDate = new Date(record.createdAt);
          
          if (isNaN(recordDate.getTime())) return false;
          
          return (
            recordDate.getFullYear() === date.getFullYear() &&
            recordDate.getMonth() === date.getMonth() &&
            recordDate.getDate() === date.getDate()
          );
        });
      };



    return (
        <div className="diary-container">
          

            <header className="diary-header">
                <h1>오늘의 일지</h1>
            </header>

            <main className="diary-content">
                {!isWriting ? (
                    <>
                        {/* 달력 영역 */}
                        <section className="calender-section">
                        <div className="calendar-temp">
                            <div className="calendar-controls">
                                <select value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))}>
                                    {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}년</option>)}
                                </select>
                                <select value={currentMonth} onChange={(e) => setCurrentMonth(Number(e.target.value))}>
                                    {Array.from({length: 12}, (_, i) => i).map(m => (
                                    <option key={m} value={m}>{m + 1}월</option>
                                    ))}
                                </select>
                                </div>

                                {/* 달력 컴포넌트 */}
                                <DayPicker
                                    key={isLoaded ? `loaded-${records.length}` : 'loading'} 
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(day) => day && setSelectedDate(day)}
                                    month={new Date(currentYear, currentMonth)}
                                    locale={ko}
                                    modifiers={{ hasRecord: hasRecord }}
                                    modifiersClassNames={{ hasRecord: 'has-record' }}
                                />
                            </div>
                            <button className="write-open-btn" 
                            onClick={() => {
                                if (!session){
                                    alert("로그인이 필요한 서비스입니다.");
                                    window.location.href = "/login"
                                    return
                                }
                                setIsWriting(true)
                            }}>
                                새 일지 작성하기</button>
                        </section>

                        {/* 리스트 영역 */}
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
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                                    <div className="record-text-group">
                                                        <h4>{item.title}</h4>
                                                        <div dangerouslySetInnerHTML={{ __html: item.content }} />
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
                    /* 작성 폼 영역 */
                    <section className="write-section">
                        <div className="write-header"><h2 style={{ marginBottom: '10px' }}>일지 작성하기</h2></div>
                        <input type="text" placeholder="제목을 입력해주세요" className="write-title" value={title} onChange={(e) => setTitle(e.target.value)} />

                        <div 
                        className={isHtmlMode ? "html-mode" : ""}
                        style={{ marginTop: '25px', marginBottom: '25px', backgroundColor: '#fff', textAlign: 'left', color: '#000' }}>
                            {isHtmlMode ? (
                                /* HTML 소스 직접 편집 모드 창 */
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div className="ql-toolbar ql-snow" style={{ padding: '8px 15px' }}>
                                        <button type="button" className="ql-htmlEdit" onClick={toggleHtmlMode} />
                                    </div>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '350px',
                                            padding: '15px',
                                            fontFamily: 'monospace',
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            border: '1px solid #ccc',
                                            borderTop: 'none',
                                            outline: 'none',
                                            backgroundColor: '#fff',
                                            color: '#000',
                                            resize: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        placeholder="HTML 소스코드를 입력해 주세요."
                                    />
                                    <div style={{ height: '50px' }} /> 
                                </div>
                            ) : (
                                <ReactQuill 
                                    theme="snow"
                                    value={content}
                                    onChange={setContent}
                                    modules={modules}
                                    formats={formats}
                                    style={{ height: '350px', marginBottom: '100px' }} 
                                />
                            )}
                        </div>

                        {/* 하단 버튼 및 파일 업로드 */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div className="file_upload_box">
                              <div className="file-list" style={{ marginBottom: '10px' }}>
                                {selectedFile.map((file, idx) => (
                                    <div key={idx} style={{ fontSize: '12px', marginBottom: '4px' }}>
                                    📄 {file.name} 
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedFile(prev => prev.filter((_, i) => i !== idx))}
                                        style={{ marginLeft: '10px', cursor: 'pointer' }}
                                    >삭제</button>
                                </div>
                                ))}
                              </div>
                              <input 
                                    type="file" 
                                    className="file-upload"
                                    onChange={handleFileChange}
                                />
                                <span style={{ color: 'red', fontSize: '12px', marginLeft: '10px' }}>
                                    *파일은 5MB 이하, 최대 3개까지 등록이 가능합니다.
                                </span>
                            </div>
                            
                            <div>
                                <button className="view-btn" onClick={handleSave} style={{ marginRight: '5px' }}>저장하기</button>
                                <button className="delete-btn" onClick={() => {
                                    setTitle("");
                                    setContent("");
                                    setSelectedFile([]);
                                    setIsWriting(false);
                                    setIsHtmlMode(false);
                                }}>취소</button>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}