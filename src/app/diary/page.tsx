"use client";

import React, { useEffect, useState } from "react";
import "./diary.css";
import { getDiaryList, createDiary, deleteDiary } from "./actions";
import { useSession } from "next-auth/react";

import "react-quill-new/dist/quill.snow.css";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import DiaryWriteForm from "../../components/diary/DiaryWriteForm";
import DiaryRecordList from "../../components/diary/DiaryRecordList";

interface DiaryRecord {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  fileUrl: string[];
  userId: number;
}

export default function DiaryPage() {
  const { data: session } = useSession();

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [records, setRecords] = useState<DiaryRecord[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File[]>([]);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  useEffect(() => {
    async function fetchLogs() {
      if (session) {
        const data = await getDiaryList();
        setRecords(data);
        setIsLoaded(true);
      }
    }
    fetchLogs();
  }, [session]);

  const handleSave = async () => {
    const isContentEmpty = !content || content === "<p><br></p>" || content.trim() === "";
    if (!title.trim() || isContentEmpty) {
      alert("제목과 내용을 모두 입력해주세요!");
      return;
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
      alert("일지가 성공적으로 저장되었습니다.");
      setTitle("");
      setContent("");
      setSelectedFile([]);
      setIsWriting(false);
      const updatedData = await getDiaryList();
      setRecords(updatedData);
    } else {
      alert("오류가 발생했습니다: " + result.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("정말로 이 일지를 삭제하시겠습니까?")) return;
    const result = await deleteDiary(id);
    if (result.success) {
      alert("일지가 성공적으로 삭제되었습니다.");
      setActiveId(null);
      const updatedData = await getDiaryList();
      setRecords(updatedData);
    } else {
      alert("삭제 도중 오류가 발생했습니다.:" + result.error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (selectedFile.length >= 3) {
        alert("파일은 최대 3개까지만 등록 가능합니다.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("5MB 이하 파일만 가능합니다.");
        return;
      }
      setSelectedFile((prev) => [...prev, file]);
    }
  };

  const hasRecord = (date: Date) => {
    if (!date || isNaN(date.getTime())) return false;
    return records.some((record) => {
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

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setSelectedFile([]);
    setIsWriting(false);
  };

  return (
    <div className="diary-container">
      <header className="diary-header">
        <h1>오늘의 일지</h1>
      </header>

      <main className="diary-content">
        {!isWriting ? (
          <>
            <section className="calender-section">
              <div className="calendar-temp">
                <div className="calendar-controls">
                  <select value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))}>
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </select>
                  <select value={currentMonth} onChange={(e) => setCurrentMonth(Number(e.target.value))}>
                    {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                      <option key={m} value={m}>{m + 1}월</option>
                    ))}
                  </select>
                </div>

                <DayPicker
                  key={isLoaded ? `loaded-${records.length}` : "loading"}
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => day && setSelectedDate(day)}
                  month={new Date(currentYear, currentMonth)}
                  locale={undefined}
                  modifiers={{ hasRecord }}
                  modifiersClassNames={{ hasRecord: "has-record" }}
                />
              </div>
              <button
                className="write-open-btn"
                onClick={() => {
                  if (!session) {
                    alert("로그인이 필요한 서비스입니다.");
                    window.location.href = "/login";
                    return;
                  }
                  setIsWriting(true);
                }}
              >
                새 일지 작성하기
              </button>
            </section>

            <DiaryRecordList
              records={records}
              selectedDate={selectedDate}
              activeId={activeId}
              onToggle={setActiveId}
              onDelete={handleDelete}
            />
          </>
        ) : (
          <DiaryWriteForm
            title={title}
            content={content}
            selectedFile={selectedFile}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onFileChange={handleFileChange}
            onFileRemove={(idx) => setSelectedFile((prev) => prev.filter((_, i) => i !== idx))}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </main>
    </div>
  );
}
