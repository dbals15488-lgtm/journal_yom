import { MdChevronLeft, MdChevronRight } from 'react-icons/md'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation';

import Link from 'next/link';

import styles from './Sidebar.module.css'


export default function Sidebar({isOpen, toggleSidebar}){
    const pathname = usePathname();

    const menuItems = [
        { name: "홈", href: "/", icon: "🏠" },
        { name: "오늘의 일지", href: "/diary", icon: "📝" },
        { name: "운동 일지", href: "/workout", icon: "🏃‍♂️" },
        { name: "식단 관리", href: "/diet", icon: "🥗" },
        { name: "업무 일지", href: "/work-log", icon: "💻" },
        { name: "고객센터", href: "/support", icon: "🎧" },
      ];
    return(
        <motion.aside className={styles.sidebar}
        initial={{ x: - 250}} // 처음 닫혀있는 위치
        animate={{ x: isOpen ? 0 : -250 }}   // 열리면 0 으로 닫히면 -250 으로 동작
        transition={{ duration: 0.3, ease: "easeInOut" }} // 부드러운 전환
        >

            <button className={styles.toggleButton} onClick={toggleSidebar}>
                  {isOpen ? <MdChevronLeft size={24} /> : <MdChevronRight size={24} />}
            </button>

            <div className={styles.logo}>오늘의 일지</div>

            <ul className={styles.menuList}>
              {menuItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                    <li
                    key={item.href}
                    className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
                    >
                        <Link href={item.href} className={styles.menuLink}
                        onClick={() => {
                            if (isOpen){
                                toggleSidebar()
                            }
                        }}>
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.name}>{item.name}</span>
                        </Link>
                    </li>
                )
              })

              }
            </ul>
        </motion.aside>
    )
}