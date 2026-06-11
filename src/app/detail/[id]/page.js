"use client"

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react'; 
import styles from './Detail.module.css';
import { updateDiary } from '../../diary/actions'; 
import dynamic from 'next/dynamic';

// Turbopack 안전 로딩용 Quill 기본 CSS
import "react-quill-new/dist/quill.snow.css";

// React-Quill 비동기 dynamic 로드
const ReactQuill = dynamic(
    async () => {
        const { default: MQ } = await import("react-quill-new");
        return MQ;
    },
    { 
        ssr: false, 
        loading: () => <p className={styles.loading}>에디터를 로딩 중입니다..</p>
    }
);

// 툴바 세팅
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

export default function RecordDetailPage(){
  const params = useParams();
  const id = params?.id ? String(params.id).replace(/[^0-9]/g, '') : '';
  const router = useRouter();

  // 상태 관리
  const [record, setRecord] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 
  const [editTitle, setEditTitle] = useState(''); 
  const [editContent, setEditContent] = useState(''); 

  // 파일 관리
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState(null);

  // 소스 모드 상태 및 정렬 포맷터
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
      modules.toolbar.handlers = {
          htmlEdit: toggleHtmlMode
      };
  }

  const getFileName = (url) => {
    if (!url) return '';
    return url.split('/').pop() || '첨부파일';
  };

  const fetchRecord = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/record/${id}`); 
      if (res.ok) {
        const data = await res.json(); 
        setRecord(data);               
        setEditTitle(data.title || '');      
        setEditContent(data.content || '');   
        setExistingFileUrl(data.fileUrl || null); 
        setSelectedFile(null); 
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
      const res = await fetch(`/api/record/${id}`, { method: 'DELETE' }); 
      if (res.ok) {
        alert("삭제되었습니다.");
        router.push('/diary'); 
      }
    }
  };

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

  const handleUpdate = async () => {
    if (!id || !record) return;
    let finalFileUrl = record.fileUrl; 
  
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
  
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
  
        if (!uploadRes.ok) {
          throw new Error("파일 업로드 서버 에러");
        }
  
        const uploadData = await uploadRes.json();
        finalFileUrl = uploadData.url || uploadData.fileUrl; 
  
      } catch (error) {
        console.error("파일 업로드 중 실패:", error);
        alert("파일 업로드에 실패하여 수정을 중단합니다.");
        return; 
      }
    } 
    else if (existingFileUrl === null) {
      finalFileUrl = null;
    }
  
    const result = await updateDiary(id, editTitle, editContent, finalFileUrl);
  
    if (result && result.success) {
      alert("수정되었습니다.");
      setIsEditing(false); 
      setIsHtmlMode(false); 
      fetchRecord();       
    } else {
      alert(result?.error || "수정 중 오류가 발생했습니다.");
    }
  };

  if (!record){
    return <div className={styles.container}>데이터를 안전하게 불러오는 중입니다...</div>
  }
  
  return (
    <div className={isHtmlMode ? "html-mode" : ""}
      style={{maxWidth:"800px",margin: "40px auto",padding: "20px"}}
    >
   

      <nav className={styles.nav}>
        <button onClick={() => router.push('/diary')} className={styles.backBtn}>
          ← 목록으로 돌아가기
        </button>
      </nav>

      <article className={styles.card}>
        {isEditing ? (
            <>
              <input
                className={styles.titleInput}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)} 
              />
              
              <div style={{ marginTop: '20px', marginBottom: '20px', backgroundColor: '#fff', textAlign: 'left', color: '#000' }}>
                {isHtmlMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="ql-toolbar ql-snow" style={{ padding: '8px 15px' }}>
                            <button type="button" className="ql-htmlEdit" onClick={toggleHtmlMode} />
                        </div>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
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
                        value={editContent}
                        onChange={setEditContent}
                        modules={modules}
                        formats={formats}
                        style={{ height: '350px', marginBottom: '100px' }} 
                    />
                )}
              </div>

              <div className={styles.fileSection}>
                <label className={styles.fileLabel}>첨부파일 수정 :</label>

                {existingFileUrl && (
                  <div className={styles.fileStatus}>
                      <span className={styles.fileName}>📁 기존 파일: {getFileName(existingFileUrl)}</span>
                      <button 
                        type='button'
                        className={styles.fileDeleteBtn}
                        onClick={() => setExistingFileUrl(null)}
                      >
                        기존 파일 삭제
                      </button>
                  </div>
                )}

                {selectedFile && (
                  <div className={styles.fileStatus}>
                      <span className={styles.newFileName}>✨ 새로 선택됨: {selectedFile.name}</span>
                      <button
                        type='button'
                        className={styles.fileDeleteBtn}
                        onClick={() => setSelectedFile(null)}
                      >
                        선택 취소
                      </button>
                  </div>
                )}
              </div>

              <div>
                <div className="file_upload_box" style={{marginTop:'10px'}}>
                <input 
                  type='file' 
                  className={styles.fileUpload}
                  onChange={handleFileChange}
                />
                 <span style={{color:'red'}}>*파일은 5MB이하만 등록이가능합니다.</span>
                </div>
               
                <div className={styles.btnGroup}>
                  <button className={styles.saveBtn} onClick={handleUpdate}>저장하기</button>
                  <button 
                    type='button'
                    className={styles.cancelBtn} 
                    onClick={() => {
                        setEditContent(record.content || ''); 
                        setIsEditing(false);
                        setIsHtmlMode(false);
                        fetchRecord(); 
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            </>
        ) : (
          <>
            <header>
              <div className={styles.badge}>번호 : #{record.id}</div>
              
              <p className={styles.time}>작성일자 : {record.updatedAt ? new Date(record.updatedAt).toLocaleString("ko-KR",{
                month: "long", day: "numeric", hour: "numeric", minute:"2-digit", second:"2-digit", hour12: false
              }) : ''}</p>
              
              <h2 className={styles.title}>{record.title}</h2>
              <p className={styles.time2}>
                최근 수정 : {new Date(record.createdAt || record.updatedAt).toLocaleString()}
              </p>
            </header>

            <section 
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: record.content || '' }} 
            />

            {record.fileUrl && (
              <div className={styles.downloadSection}>
                  <span className={styles.downloadTitle}>📎 첨부파일 :</span>
                  <a 
                    href={record.fileUrl}
                    download
                    target='_blank'
                    rel="noopener noreferrer"
                    className={styles.downloadLink}
                  >
                    {getFileName(record.fileUrl)}
                  </a>
              </div>
            )}

            <div className={styles.footer}>
              <button className={styles.editBtn} onClick={() => setIsEditing(true)}>수정하기</button>
              <button className={styles.deleteBtn} onClick={handleDelete}>삭제하기</button>
              <button className={styles.back2Btn} onClick={() => router.push('/diary')}>목록</button>
            </div>
          </>
        )}
      </article> {/* 💡 복구 완료된 닫는 태그 */}
    </div>
  )
}