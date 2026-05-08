"use client"

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './Detail.module.css';

export default function RecordDetailPage(){

  const {id} = useParams(); //url 에서 id를 가져옵니다 (예 : /detail/123 -> id : 123)
  const router = useRouter();

  // 상태 관리 : 화면에서 변하는 데이터들을 담는 바구니
  const [record, setRecord] =useState(null); //DB에서 가져온 진짜 일지 데이터를 담는 곳
  const [isEditing, setIsEditing] = useState(false); // 지금 보기모드 인지 수정 모드인지 구분하는 스위치
  const [editTitle, setEditTitle] = useState(''); //수정창에 입력한 새로운 제목을 담는 바구니
  const [editContent, setEditContent] = useState(''); //수정한 새로운 내용을 담는 바구니

  // 기능 관리 : 서버와 대화하는 함수들

      const fetchRecord = async () => {
        try{
          const res = await fetch(`/api/record/${id}`); //우리가 만든 api에게 id 번호 데이터를 달라고 요청
          if(res.ok){
            const data = await res.json(); // api가 준 데이터를 자바스크립트 객체로 변환
            setRecord(data);               // 화면 바구니에 담기
            setEditTitle(data.title);      // 수정 입력창에도 미리 제목을 넣어둠
            setEditContent(data.content)   // 수정 입력창에도 미리 내용을 넣어둠
          }
        }catch(error){
          console.error("로딩 실패:", error)
        }
      }
  
  // 페이지가 처음 열릴떄 실행

      useEffect(() => {
        fetchRecord()
      }, [id]);


  // 기록 삭제하기

    const handleDelete = async () => {
      if(window.confirm("정말 이 기록을 삭제하시겠습니까?")){  // 실수 방지용 확인창
        const res = await fetch(`/api/record/${id}`, {method: 'DELETE'}); //api에게 삭제요청
        if(res.ok){
          alert("삭제되었습니다.");
          router.push('/'); //삭제가 끝났으니 메인으로 이동
        }
      }
    };

    // 수정 내용 저장하기
      
    const handleUpdate = async () => {
      const res = await fetch(`/api/record/${id}`,{
        method : 'PUT', // 수정할떄는 주로 PUT 메서드를 사용
        headers : {'Content-Type' : 'application/json'},
        body: JSON.stringify({title: editTitle, content: editContent}), // 내가 새로 쓴내용을 보냄
      })

      if(res.ok){
        alert("수정되었습니다.");
        setIsEditing(false); //다시 보기 모드 로전환
        fetchRecord(); //수정된 내용으로 화면을 다시 그리기 위해 데이터 새로 가져오기
      }
    }

    // 데이터 가져오는 동안 대기 화면
    if(!record) return <div className={styles.container}>데이터를 가져오고 있습니다.</div>
  
  
  return(
    <div className={styles.container}>
      <nav className={styles.nav}>
        {/* router.push를 써서 메인으로 보내버림 */}
        <button onClick={() => router.push('/')} className={styles.backBtn}>
          ← 목록으로 돌아가기
        </button>
      </nav>


      <article className={styles.card}>
        {/* 수위치가 켜져있으면 수정창, 꺼져있으면 상세보기 창을 보여줍니다. */}
        {isEditing ? (
            <>
            {/* 수정 모드 레이아웃 */}
            <header>
              <h1>기록 수정 중...</h1>
              <input
              className={styles.titleInput}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)} // 글자를 칠 때마다 업데이트
              >
              </input>
            </header>
            <section className={styles.content}>
              <textarea
                className={styles.contentArea}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </section>
            <div>
              <button className={styles.saveBtn} onClick={handleUpdate}>저장하기</button>
              <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>취소</button>
            </div>
            </>
        ) : (
          // 상세 보기 레이아웃
          <>
            <header>
              <h1 className={styles.day}>
              {/* DB의 날짜 데이터를 우리가 보기 편한 월/일로 변환 */}
                {new Date(record.createdAt).getMonth() +1}월 {new Date(record.createdAt).getDate()}일 기록
              </h1>
              <div className={styles.badge}>번호 : #{record.id}</div>
              <h2 className={styles.title}>{record.title}</h2>
              <p className={styles.time}>
                최근 수정 : {new Date(record.createAt).toLocaleString()}
              </p>
            </header>

            <section className={styles.content}>
              {/* 작성한 내용 출력 */}
              {record.content} 
            </section>

            <div className={styles.footer}>
              <button className={styles.editBtn} onClick={() => setIsEditing(true)}>수정하기</button>
              <button className={styles.deleteBtn} onClick={handleDelete}>삭제하기</button>
              <button className={styles.back2Btn} onClick={() => router.push('/')}>목록</button>
            </div>
          </>
        )}
       
      </article>
    </div>
  )


}