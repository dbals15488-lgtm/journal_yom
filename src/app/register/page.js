"use client";

import { useState } from "react";
import styles from "./register.module.css";
import { Router, useRouter } from "next/navigation";

export default function RegisterPage() {
  // 입력값 바구니
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  // 가입 버튼 실행될 함수
  const handleSubmit = async (e) => {
    e.preventDefault();

    const koreanRegex = /^[가-힣]{2,10}$/;
    if (!koreanRegex.test(name)) {
      alert("이름은 공백 없이 2~10글자의 한글로만 입력해주세요.");
      return;
    }

    // 아이디 검사
    const userIdRegex = /^[a-z][a-z0-9]{5,11}$/;
    if (!userIdRegex.test(userId)) {
      alert("아이디는 6~12자로 입력해 주세요.");
      return
    }

    // 비밀번호 검사
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
        alert("비밀번호는 영문자와 숫자를 조합하여 8글자 이상으로 입력해 주세요.");
        return;
    }

    if(userId === password){
        alert("보안을 위해 아이디와 비밀번호를 다르게 입력해주세요.")
        return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setUserId("");
        setName("");
        setEmail("");
        setPassword("");

        router.push("/")
      } else {
        alert(data.message || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("통신 에러", error);
      alert("서버와 연결할 수 없습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* 상단 타이틀 구역 */}
        <div className={styles.header}>
          <h2 className={styles.title}>회원가입</h2>
          <p className={styles.subtitle}>
            당신의 성장을 기록하는 공간에 오신 것을 환영합니다.
          </p>
        </div>

        {/* 회원 가입 입력 폼 */}
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
            <label className={styles.label}>아이디</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="영문 소문자, 숫자 4~12자"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>이메일</label>
            <input
              type="email"
              required
              className={styles.input}
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>비밀번호</label>
            <input
              type="password"
              required
              className={styles.input}
              placeholder="영문 숫자 조합 8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            가입하기
          </button>
        </form>

        {/* 소셜 로그인 구역 */}
        <div className={styles.dividerContainer}>
          <div className={styles.dividerLine}></div>
          <span className={styles.dividerText}>
            또는 소셜 계정으로 시작하기
          </span>
        </div>

        {/* 소셜 로그인 버튼 박스 */}
        <div className={styles.socialGroup}>
          <button className={`${styles.socialButton} ${styles.google}`}>
            구글
          </button>
          <button className={`${styles.socialButton} ${styles.kakao}`}>
            카카오
          </button>
          <button className={`${styles.socialButton} ${styles.naver}`}>
            네이버
          </button>
        </div>
      </div>
    </div>
  );
}
