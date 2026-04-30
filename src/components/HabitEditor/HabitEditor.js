import { useState } from "react";
import styles from './HabitEditor.module.css'

export default function HabitEditor({selectedMonth, selectedDay, onSave}){
    const [ title, setTitle] = useState(''); //제목 확인
    const [ content, setContent] = useState(''); //사용자가 지금 쓰고 있는 글자 확인
    
    return(
        <div className={styles.editorContainer}>
            <h2>✍️ {selectedMonth}월 {selectedDay}일 기록하기</h2>
            <input
            type="text"
            className={styles.titleInput} 
            placeholder="제목을 입력해주세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
            className={styles.textarea}
            placeholder="내용을 입력해주세요"
            value={content}
            onChange={(e) => setContent(e.target.value)} //타자 칠떄마다 content 업데이트
           />
            <button
            className={styles.saveButton}
            onClick={() => {
                if(!title) return alert('제목을 입력해주세요!') // 제목 없으면 경고 띄움
                onSave(title, content); // 제목과 내용을 같이보냄
                setTitle(''); // 저장후 제목 초기화
                setContent(''); // 저장 후엔 입력창 비우기
            }}
            >
                저장하기
            </button>
         
        </div>
    )
}