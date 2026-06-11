"use client"

import React, { useEffect, useState } from "react"
import "./diary.css";
import { getDiaryList, createDiary, deleteDiary } from "./actions"
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

// Turbopack 환경에 안전하게 에디터 기본 CSS 로드
import "react-quill-new/dist/quill.snow.css";


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
    'script', 'header', 'blockquote', 'code-block', 'list', 'bullet', 'indent', 'direction', 'align', 'link', 'image', 'video'
];

export default function DiaryPage() {
    const {data : session, status} = useSession();

    // 상태 관리
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [viewDate, setViewDate] = useState(() => new Date());
    const [selectedFile, setSelectedFile] = useState<File | null>(null); 
    
    const [isWriting, setIsWriting] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isHtmlMode, setIsHtmlMode] = useState(false);

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
    const currentYear = new Date().getFullYear();
    const yearRange = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i); 
    const months = Array.from({ length: 12 }, (_, i) => i); 

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

    useEffect(() => {
        async function fetchLogs() {
            if (session) {
                const data = await getDiaryList();
                setRecords(data);
            } else {
                setRecords([]);
            }
        }
        fetchLogs();
    }, [session]);

    const hasRecord = (day: number) => {
        return records.some(record => {
            const recordDate = new Date(record.createdAt);
            return recordDate.getFullYear() === viewDate.getFullYear() &&
                   recordDate.getMonth() === viewDate.getMonth() &&
                   recordDate.getDate() === day;
        })
    }

    // 저장 처리 함수 (MySQL DB 연동)
    const handleSave = async () => {
        const isContentEmpty = !content || content === "<p><br></p>" || content.trim() === "";

        if (!title.trim() || isContentEmpty) {
            alert("제목과 내용을 모두 입력해주세요!")
            return
        }

        let uploadedFileUrl: string | null = null;
        
        if (selectedFile) {
            try {
                const formData = new FormData();
                formData.append("file", selectedFile);

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                if (!response.ok) {
                    throw new Error("파일 업로드 서버 에러")
                }

                const uploadResult = await response.json();
                uploadedFileUrl = uploadResult.fileUrl;
            } catch (err) {
                alert("파일 업로드 도중 오류가 발생했습니다.")
                console.error(err)
            }
        }

        const result = await createDiary(title, content, selectedDate.toISOString(), uploadedFileUrl);

        if (result.success) {
            alert("일지가 성공적으로 저장되었습니다.")
            setTitle("");
            setContent(""); 
            setSelectedFile(null);
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
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                alert("파일 크기는 5MB 이하의 파일만 업로드할 수 있습니다.")
                e.target.value = '';
                setSelectedFile(null);
                return
            }
            setSelectedFile(file);
        }
    };

    const handleViewChange = (year: number, month: number) => {
        setViewDate(new Date(year, month, 1));
    };

    return (
        <div className="diary-container">
          

            <header className="diary-header">
                <button onClick={() => window.location.href = "/"} className="back-btn">⬅ 메인으로</button>
                <h1>오늘의 일지</h1>
                <div className="user-info">
                    {status === "loading" ? (
                        <span>⏳ 확인 중...</span>
                    ) : session?.user ? (
                        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end",flexDirection:'column' }}>
                            <span>👤 {session.user.name || (session.user as any).userId || "유저"} 님</span>
                             <Link href="/api/auth/signout" className="logout-btn" style={{ fontSize: '12px', color: '#999', textDecoration: 'underline' }}>
                                로그아웃
                            </Link>
                        </div>
                       
                        
                    ) : (
                        <Link href="/login" style={{ color: "#ff4d4f", fontWeight: "bold", textDecoration: 'none' }}>⚠️ 로그인이 필요합니다.</Link>
                    )

                    }
                </div>
            </header>

            <main className="diary-content">
                {!isWriting ? (
                    <>
                        {/* 달력 영역 */}
                        <section className="calender-section">
                            <div className="calendar-temp">
                                <div className="calendar-selector">
                                    <select 
                                        value={viewDate.getFullYear()} 
                                        onChange={(e) => handleViewChange(Number(e.target.value), viewDate.getMonth())}
                                        className="calendar-select-dropdown"
                                    >
                                        {yearRange.map(y => <option key={y} value={y}>{y}년</option>)}
                                    </select>
                                    <select 
                                        value={viewDate.getMonth()} 
                                        onChange={(e) => handleViewChange(viewDate.getFullYear(), Number(e.target.value))}
                                        className="calendar-select-dropdown"
                                    >
                                        {months.map(m => <option key={m} value={m}>{m + 1}월</option>)}
                                    </select>
                                </div>
                                <h1 style={{ textAlign: "center", margin: "15px 0" }}>{viewDate.getMonth() + 1}월</h1>

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
                        <input type="text" placeholder="제목을 입력하세요" className="write-title" value={title} onChange={(e) => setTitle(e.target.value)} />

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
                                <input 
                                    type="file" 
                                    className="file-upload"
                                    onChange={handleFileChange}
                                /> 
                                <span style={{ color: 'red', fontSize: '12px', marginLeft: '10px' }}>*파일은 5MB 이하만 등록이 가능합니다.</span>
                            </div>
                            
                            <div>
                                <button className="view-btn" onClick={handleSave} style={{ marginRight: '5px' }}>저장하기</button>
                                <button className="delete-btn" onClick={() => {
                                    setTitle("");
                                    setContent("");
                                    setSelectedFile(null);
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