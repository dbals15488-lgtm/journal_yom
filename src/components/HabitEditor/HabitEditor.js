import { useEffect, useState } from "react";
import styles from './HabitEditor.module.css'

export default function HabitEditor({selectedMonth, selectedDay, onSave}){
    const [ title, setTitle] = useState(''); //제목 확인
    const [ content, setContent] = useState(''); //사용자가 지금 쓰고 있는 글자 확인
    const [category, setCategory] = useState('일반');
    

    const handleSave = async () => {
        // 유효성 검사
        if (!title || !content) {
            alert("제목과 내용을 입력해주세요")
            return;
        }

        try{
            // fetch는 특정 주소로 편지를 보내는 도구
            const response = await fetch('/api/record', {
                method : 'POST' , //데이터를 보낼게(POST)라고 명시
                headers: {
                    'Content-Type' : 'application/json' , //이 봉투 안에 JSON 데이터가 들어있어 라고 알려줍니다.
                },
                body : JSON.stringify({
                    title: title,
                    content: content,
                    category : category,
                }), //우리가 입력한 데이터들을 JSON 문자열로 변환해서 body에 담음
            });
            
            if (response.ok){
                alert("저장되었습니다.");
                setTitle(""); //입력창 비우기
                setContent("");
                if(onSave) onSave()
            }else{
                alert("저장에 실패했습니다.")
            }
        }catch (error){
            console.error("에러 발생:", error);
            alert("네트워크 오류가 발생했습니다.")
        }
    };

  

    
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
            onClick={handleSave}
            >
                저장하기
            </button>
         
        </div>
    )
}