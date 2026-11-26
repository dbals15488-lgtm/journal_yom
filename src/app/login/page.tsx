"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import styles from "./login.module.css";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userId || !password) {
      alert("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      const result = await signIn("credentials", {
        username: String(userId).trim(),
        password: String(password).trim(),
        redirect: false,
      });

      if (result?.error || result?.url?.includes("error")) {
        alert("아이디 또는 비밀번호가 올바르지 않습니다.");
      } else {
        alert("로그인에 성공했습니다!");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("로그인 시도 중 에러:", error);
      alert("서버 연결에 실패했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>학습 일지 로그인</h2>
          <p className={styles.subtitle}>오늘의 성장을 기록하기 위해 로그인해 주세요.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>아이디</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="아이디를 입력하세요"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>비밀번호</label>
            <input
              type="password"
              required
              className={styles.input}
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            로그인하기
          </button>
        </form>

        <div className={styles.footerLinks}>
          <Link href="/register" className={styles.link}>
            회원가입
          </Link>
          <span className={styles.divider}>|</span>
          <Link href="/login/find-id" className={styles.link}>
            아이디 찾기
          </Link>
          <span className={styles.divider}>|</span>
          <Link href="/login/find-password" className={styles.link}>
            비밀번호 찾기
          </Link>
        </div>
      </div>
    </div>
  );
}
