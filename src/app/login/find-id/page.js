'use client'

import { useState } from "react"
import Link from "next/link"
import styles from '../login.module.css'

export default function FindIdPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    
    // 🎯 데이터 저장을 위한 바구니 3개
    const [maskedId, setMaskedId] = useState(''); // 마스킹된 아이디
    const [fullId, setFullId] = useState('');       // 전체 원본 아이디
    const [showFullId, setShowFullId] = useState(false); // 전체 보기 토글 스위치

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/auth/find-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
            });

            const data = await response.json();

            if (response.ok) {
                setMaskedId(data.maskedId);
                setFullId(data.fullId);
                setShowFullId(false); // 새로 조회했을 때는 다시 마스킹 상태로 초기화
            } else {
                alert(data.message || '아이디 찾기에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            alert('서버 통신 에러가 발생했습니다.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h2 className={styles.title}>아이디 찾기</h2>
                    <p className={styles.subtitle}>가입하실 때 기입한 이름과 이메일을 입력해 주세요.</p>
                </div>

                {/* 아이디를 찾기 전 검사 폼 */}
                {!maskedId ? (
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>이름</label>
                            <input
                                type="text"
                                required
                                className={styles.input}
                                placeholder="홍길동"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>이메일 주소</label>
                            <input
                                type="email"
                                required
                                className={styles.input}
                                placeholder="example@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button type="submit" className={styles.submitButton}>아이디 찾기</button>
                    </form>
                ) : (
                    /* 🎯 아이디를 찾은 후 보여주는 결과 화면 */
                    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                            고객님의 아이디는 <br />
                            <strong style={{ color: '#3b82f6', fontSize: '1.4rem', display: 'block', margin: '0.5rem 0' }}>
                                {showFullId ? fullId : maskedId}
                            </strong> 입니다.
                        </p>

                        {/* 🎯 [전체 보기 / 가리기] 버튼 */}
                        <button 
                            type="button"
                            onClick={() => setShowFullId(!showFullId)}
                            style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.85rem',
                                backgroundColor: '#e5e7eb',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: '#374151',
                                fontWeight: '600',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#d1d5db'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                        >
                            {showFullId ? "아이디 가리기" : "전체 보기"}
                        </button>
                    </div>
                )}

                <div className={styles.footerLinks}>
                    <Link href="/login" className={styles.link}>로그인하러 가기</Link>
                </div>
            </div>
        </div>
    )
}