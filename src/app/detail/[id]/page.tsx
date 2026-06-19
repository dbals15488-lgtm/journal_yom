"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import styles from "./Detail.module.css";
import { updateDiary } from "../../diary/actions";
import dynamic from "next/dynamic";

import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(
  async () => {
    const { default: MQ } = await import("react-quill-new");
    return MQ;
  },
  {
    ssr: false,
    loading: () => <p className={styles.loading}>에디터를 로딩 중입니다..</p>,
  }
);

const modules: any = {
  toolbar: {
    container: [
      ["htmlEdit"],
      [{ font: [] }, { size: [] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ header: "1" }, { header: "2" }, "blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }, { align: [] }],
      ["link", "image", "video"],
      ["clean"],
    ],
  },
};

const formats = [
  "font", "size", "bold", "italic", "underline", "strike", "color", "background",
  "script", "header", "blockquote", "code-block", "list", "indent", "direction", "align", "link", "image", "video",
];

export default function RecordDetailPage() {
  const params = useParams();
  const id = params?.id ? String(params.id).replace(/[^0-9]/g, "") : "";
  const router = useRouter();

  const [record, setRecord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // 파일 상태 관리 (항상 배열로 초기화)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFileUrls, setExistingFileUrls] = useState([]);

  const [isHtmlMode, setIsHtmlMode] = useState(false);

  const formatHtmlSource = (htmlString) => {
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
        setEditContent((currentContent) => formatHtmlSource(currentContent));
      }
      return nextMode;
    });
  };

  if (modules.toolbar && !modules.toolbar.handlers) {
    modules.toolbar.handlers = { htmlEdit: toggleHtmlMode };
  }

  const getFileName = (url) => {
    if (!url) return "";
    return url.split("/").pop() || "첨부파일";
  };

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/record/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRecord(data);
        setEditTitle(data.title || "");
        setEditContent(data.content || "");
        // 배열 형식으로 확실하게 저장
        
        const urls = Array.isArray(data.fileUrl) ? data.fileUrl : (data.fileUrl ? data.fileUrl.split(',') : []);
        setExistingFileUrls(urls);

        setSelectedFiles([])
      }
    } catch (error) {
      console.error("로딩 실패:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm("정말 이 기록을 삭제하시겠습니까?")) {
      const res = await fetch(`/api/record/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("삭제되었습니다.");
        router.push("/diary");
      }
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (existingFileUrls.length + selectedFiles.length + files.length > 3) {
      alert("파일은 최대 3개까지만 등록 가능합니다.");
      return;
    }
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleUpdate = async () => {
    let finalFileUrls = [...existingFileUrls]; // 기존 파일들 유지
  
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
  
        if (res.ok) {
          const data = await res.json();
          // 서버에서 반환하는 데이터의 키값 확인 (data.url 또는 data.fileUrl)
          finalFileUrls.push(data.fileUrl || data.url);
        } else {
          alert("일부 파일 업로드에 실패했습니다.");
          return; // 업로드 실패 시 저장 중단
        }
      }
  
      // 서버로 데이터 전송
      const result = await updateDiary(String(id), editTitle, editContent, finalFileUrls);
  
      if (result?.success) {
        alert("수정되었습니다.");
        setIsEditing(false);
        fetchRecord();
      } else {
        alert("데이터 저장에 실패했습니다: " + (result?.error || "알 수 없는 오류"));
      }
    } catch (err) {
      console.error("저장 중 에러 발생:", err);
      alert("저장 과정에서 문제가 발생했습니다.");
    }
  };

  if (!record) {
    return <div className={styles.container}>데이터를 안전하게 불러오는 중입니다...</div>;
  }

  return (
    <div className={isHtmlMode ? "html-mode" : ""} style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
      <nav className={styles.nav}>
        <button onClick={() => router.push("/diary")} className={styles.backBtn}>← 목록으로 돌아가기</button>
      </nav>

      <article className={styles.card}>
        {isEditing ? (
          <>
            <input className={styles.titleInput} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            
            <div style={{ marginTop: '20px', marginBottom: '20px', backgroundColor: '#fff', textAlign: 'left', color: '#000' }}>
              {isHtmlMode ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="ql-toolbar ql-snow" style={{ padding: '8px 15px' }}>
                    <button type="button" className="ql-htmlEdit" onClick={toggleHtmlMode} />
                  </div>
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} style={{ width: '100%', height: '350px', padding: '15px', border: '1px solid #ccc' }} />
                </div>
              ) : (
                <ReactQuill theme="snow" value={editContent} onChange={setEditContent} modules={modules} formats={formats} style={{ height: '350px', marginBottom: '100px' }} />
              )}
            </div>

            {/* 파일 관리 섹션 */}
            <div className={styles.fileSection}>
              <label className={styles.fileLabel}>첨부파일 수정 (최대 3개)</label>
              
              {existingFileUrls.map((url, index) => (
                <div key={`existing-${index}`} className={styles.fileStatus}>
                  <span>📁 기존: {getFileName(url)}</span>
                  <button type="button" onClick={() => setExistingFileUrls(prev => prev.filter((_, i) => i !== index))}>삭제</button>
                </div>
              ))}

              {selectedFiles.map((file, index) => (
                <div key={`new-${index}`} className={styles.fileStatus}>
                  <span>✨ 새 파일: {file.name}</span>
                  <button type="button" onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}>취소</button>
                </div>
              ))}

              <div className="file_upload_box" style={{ marginTop: '10px' }}>
                <input type="file" multiple className={styles.fileUpload} onChange={handleFileChange} />
                <span style={{ color: 'red' }}>*파일은 5MB이하만 등록 가능합니다.</span>
              </div>
            </div>

            <div className={styles.btnGroup}>
              <button className={styles.saveBtn} onClick={handleUpdate}>저장하기</button>
              <button type="button" className={styles.cancelBtn} onClick={() => { setEditContent(record.content || ""); setIsEditing(false); setIsHtmlMode(false); fetchRecord(); }}>취소</button>
            </div>
          </>
        ) : (
          <>
            <header>
              <div className={styles.badge}>번호 : #{record.id}</div>
              <p className={styles.time}>최종 작성 일자 : {record.updatedAt ? new Date(record.updatedAt).toLocaleString() : ""}</p>
              <h2 className={styles.title}>{record.title}</h2>
            </header>

            <section className={styles.content} dangerouslySetInnerHTML={{ __html: record.content || "" }} />

            {/* 상세 보기 시 모든 파일 표시 */}
            {existingFileUrls.length > 0 && (
              <div className={styles.downloadSection}>
                <span className={styles.downloadTitle}>📎 첨부파일 :</span>
                {existingFileUrls.map((url, index) => (
                  <a key={index} href={url} download target="_blank" rel="noopener noreferrer" className={styles.downloadLink} style={{ display: "block" }}>
                    {getFileName(url)}
                  </a>
                ))}
              </div>
            )}

            <div className={styles.footer}>
              <button className={styles.editBtn} onClick={() => setIsEditing(true)}>수정하기</button>
              <button className={styles.deleteBtn} onClick={handleDelete}>삭제하기</button>
              <button className={styles.back2Btn} onClick={() => router.push("/diary")}>목록</button>
            </div>
          </>
        )}
      </article>
    </div>
  );
}