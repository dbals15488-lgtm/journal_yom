"use client"

import { useParams, useRouter } from 'next/navigation';
import styles from './Detail.module.css';
import { useRecords } from '@/context/RecordContext';

export default function RecordDetailPage(){

  const {id} = useParams(); //url 에서 id를 가져옵니다 (예 : /detail/123 -> id : 123)
  const router = useRouter();

  // 중앙 사물함에서 기록들 만 빼오기
  const {records, deleteRecord} = useRecords();

  // 서버에서 ID가 일치하는 기록 찾기
  const record = records.find((r) => String(r.id) === String(id))

  const handleDelete = () => {
    if (window.confirm("정말 이 기록을 삭제하시겠습니까?")){
      deleteRecord(id); 
      alert("삭제되었습니다.")
      router.push('/') //삭제 후 메인으로 이동
    }
  }
  

  if(!record) return <div className={styles.container}>기록을 찾을 수 없습니다.</div>
  
  return(
    <div className={styles.container}>
      <nav className={styles.nav}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          ← 목록으로 돌아가기
        </button>
      </nav>


      <article className={styles.card}>
        <header>
          <h1 className={styles.day}>
            [{record.month}월 {record.day}일] 
          </h1>
          <div className={styles.badge}>학습 기록 #{record.id}</div>
          <h2 className={styles.title}>{record.title}</h2>
          <p className={styles.time}>저장 시간 : {record.saveTime}</p>
        </header>

        <section className={styles.content}>
          {record.content}
        </section>

        <div className={styles.footer}>
            <button className={styles.editBtn}>수정하기</button>
            <button className={styles.deleteBtn} onClick={handleDelete}>삭제하기</button>
        </div>
      </article>
    </div>
  )


}