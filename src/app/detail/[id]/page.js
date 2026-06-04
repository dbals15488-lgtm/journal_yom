"use client"

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react'; 
import styles from './Detail.module.css';
import { updateDiary } from '../../diary/actions'; 
import dynamic from 'next/dynamic';


// 에디터 비동기 로드 구역
const ToastEditor = dynamic(() => import("../../../components/ToastEditor/ToastEditor"), {
  ssr: false,
  loading: () => <p className={styles.loading}>에디터를 로딩 중입니다..</p>
});

export default function RecordDetailPage(){
  const params = useParams();
  // params가 null이거나 id가 없을 때를 대비한 안전장치
  const id = params?.id ? String(params.id).replace(/[^0-9]/g, '') : '';
  const router = useRouter();

  // 상태 관리 바구니 구역 (오류 유발 가능한 문법 완전 클리닝)
  const [record, setRecord] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 
  const [editTitle, setEditTitle] = useState(''); 
  const [editContent, setEditContent] = useState(''); 

  // 파일 관리 구역
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState(null);

  // 파일명 잘라내기 헬퍼 함수
  const getFileName = (url) => {
    if (!url) return '';
    return url.split('/').pop() || '첨부파일';
  };

  // 데이터 가져오기 함수 정의
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
  
  // 컴포넌트 마운트 시 로드
  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]); 

  // 기록 삭제 기능
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

  // 수정 저장 기능
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
      fetchRecord();       
    } else {
      alert(result?.error || "수정 중 오류가 발생했습니다.");
    }
  };

  // 데이터 로딩 중 화면 처리
  if (!record){
    return <div className={styles.container}>데이터를 안전하게 불러오는 중입니다...</div>
  }
  
  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <button onClick={() => router.push('/diary')} className={styles.backBtn}>
          ← 목록으로 돌아가기
        </button>
      </nav>

      <article className={styles.card}>
        {isEditing ? (
            <>
              {/* --- 🛠️ 1. 수정 모드 레이아웃 --- */}
              <input
                className={styles.titleInput}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)} 
              />
              
              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <ToastEditor content={editContent} setContent={setEditContent} />
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
            {/* --- 📝 2. 상세보기 레이아웃 --- */}
            <header>
              <div className={styles.badge}>번호 : #{record.id}</div>
              
              <p className={styles.time}>작성일자 : {record.updatedAt ? new Date(record.updatedAt).toLocaleString("ko-KR",{
                month: "long", day: "numeric", hour: "numeric", minute:"2-digit", second:"2-digit", hour12: false
              }) : ''}</p>
              
              <h2 className={styles.title}>{record.title}</h2>
              <p className={styles.time}>
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
      </article>
    </div>
  )
}