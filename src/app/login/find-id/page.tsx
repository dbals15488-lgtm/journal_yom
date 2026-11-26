"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "../login.module.css";

export default function FindIdPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [maskedId, setMaskedId] = useState("");
  const [fullId, setFullId] = useState("");
  const [showFullId, setShowFullId] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/find-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMaskedId(data.maskedId);
        setFullId(data.fullId);
        setShowFullId(false);
      } else {
        alert(data.message || "아이디 찾기에 실패했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("서버 통신 에러가 발생했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>아이디 찾기</h2>
          <p className={styles.subtitle}>가입하실 때 기입한 이름과 이메일을 입력해 주세요.</p>
        </div>

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
            <button type="submit" className={styles.submitButton}>
              아이디 찾기
            </button>
          </form>
        ) : (
          <div className={styles.resultBox}>
            <p className={styles.resultText}>
              고객님의 아이디는 <br />
              <strong className={styles.resultId}>{showFullId ? fullId : maskedId}</strong>{" "}
              입니다.
            </p>
            <button
              type="button"
              onClick={() => setShowFullId(!showFullId)}
              className={styles.toggleBtn}
            >
              {showFullId ? "아이디 가리기" : "전체 보기"}
            </button>
          </div>
        )}

        <div className={styles.footerLinks}>
          <Link href="/login" className={styles.link}>
            로그인하러 가기
          </Link>
        </div>
      </div>
    </div>
  );
}
