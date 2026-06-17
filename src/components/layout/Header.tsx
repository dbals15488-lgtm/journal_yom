import { style } from 'framer-motion/client'
import styles from './Header.module.css'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default  function Header({session}){
    const [time, setTime] =useState('')

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
                    <Link href="/api/auth/signout" className={styles.navButton}>
                                로그아웃
                    </Link>
                    </>
                    
                ) : (
                        <Link href="/login" style={{ textDecoration: "none", color: "inherit" }}>
                            👤 로그인
                        </Link>
                )}
                
             </div>
        </header>
    )

}