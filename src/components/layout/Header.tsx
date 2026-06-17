import { style } from 'framer-motion/client'
import styles from './Header.module.css'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'

export default  function Header({session}){
    const [time, setTime] =useState('')
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
      }, []);

    return(
        <header className={styles.header}>
            <div>기록 일지</div>

            <div className={styles.midSection}>{time}</div>

            <div className={styles.rightSection}>
                {session?.user ? (
                    <>
                    <span className={styles.userName}>{session.user.name}님</span>
                    <button className={styles.navButton}>마이페이지</button>
                    <button className={styles.navButton} onClick={() => setIsModalOpen(true)}>
                                로그아웃
                    </button>
                    </>
                    
                ) : (
                        <Link href="/login" style={{ textDecoration: "none", color: "inherit" }}>
                            👤 로그인
                        </Link>
                )}
             </div>

             {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <p>정말 로그아웃 하시겠습니까?</p>
                        <button onClick={() => signOut({ callbackUrl: '/'})} className={styles.onbtn}>네</button>
                        <button onClick={() => setIsModalOpen(false)} className={styles.offbtn}>아니오</button>
                    </div>
                </div>
             )}
        </header>
    )

}