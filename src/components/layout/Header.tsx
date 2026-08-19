'use client'

import styles from './Header.module.css'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import { useTheme } from '../../app/contexts/ThemeContext';

interface Session {
    user?: {
        name?: string | null;
        email?: string | null;
    };
}

interface HeaderProps {
    session: Session | null;
}

export default function Header({ session }: HeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { theme, toggleTheme } = useTheme();

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const userName = session?.user?.name ?? '';
    const initial = userName.charAt(0) || '?';

    return (
        <header className={styles.header}>
            <Link href="/" className={styles.logoLink}>
                <img src="/images/logo.png" alt="logo" className={styles.logo} />
            </Link>

            <div className={styles.rightSection}>
                {session?.user ? (
                    <div className={styles.profileWrapper} ref={dropdownRef}>
                        <button
                            className={styles.profileButton}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <div className={styles.avatar}>{initial}</div>
                            <span className={styles.userName}>{userName}</span>
                            <span className={`${styles.arrow} ${isDropdownOpen ? styles.arrowOpen : ''}`}>▾</span>
                        </button>

                        {isDropdownOpen && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownHeader}>
                                    <div className={styles.dropdownAvatar}>{initial}</div>
                                    <div className={styles.dropdownUserInfo}>
                                        <div className={styles.dropdownName}>{userName}</div>
                                        {session.user.email && (
                                            <div className={styles.dropdownEmail}>{session.user.email}</div>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.dropdownDivider} />
                                <Link
                                    href="/mypage"
                                    className={styles.dropdownItem}
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <span className={styles.dropdownIcon}>👤</span>
                                    <span>마이페이지</span>
                                </Link>
                                <div className={styles.dropdownDivider} />
                                <button
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                        toggleTheme();
                                    }}
                                >
                                    <span className={styles.dropdownIcon}>{theme === 'dark' ? '☀️' : '🌙'}</span>
                                    <span>{theme === 'dark' ? '라이트 모드' : '다크 모드'}</span>
                                </button>
                                <button
                                    className={`${styles.dropdownItem} ${styles.logoutItem}`}
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        setIsLogoutModalOpen(true);
                                    }}
                                >
                                    <span className={styles.dropdownIcon}>🚪</span>
                                    <span>로그아웃</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link href="/login" className={styles.loginLink}>
                        👤 로그인
                    </Link>
                )}
            </div>

            {isLogoutModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsLogoutModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <p className={styles.modalText}>로그아웃 하시겠습니까?</p>
                        <div className={styles.modalButtons}>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className={styles.onbtn}
                            >
                                로그아웃
                            </button>
                            <button
                                onClick={() => setIsLogoutModalOpen(false)}
                                className={styles.offbtn}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}