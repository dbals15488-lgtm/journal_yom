"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "../login.module.css";

export default function FindPasswordPage() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/find-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setTempPassword(data.tempPassword);
        alert(data.message);
      } else {
        alert(data.message || "비밀번호 찾기에 실패했습니다.");
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
          <h2 className={styles.title}>비밀번호 찾기</h2>
          <p className={styles.warningText}>
            * 테스트용: 발급된 임시 비밀번호가 화면에 바로 노출됩니다.
          </p>
        </div>

        {!tempPassword ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>아이디</label>
              <input
                type="text"
                required
                className={styles.input}
                placeholder="아이디를 입력해주세요"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
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
              임시 비밀번호 발급
            </button>
          </form>
        ) : (
          <div className={styles.resultBox}>
            <p className={styles.resultLabel}>발급된 임시 비밀번호</p>
            <p className={styles.tempPasswordDisplay}>
              <strong>{tempPassword}</strong>
            </p>
            <p className={styles.resultHint}>
              이 패스워드로 로그인 하신 뒤 마이페이지에서 비밀번호를 변경해 주세요.
            </p>
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
