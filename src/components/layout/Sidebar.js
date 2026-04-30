import styles from './Sidebar.module.css'

export default function Sidebar({months, selectedMonth, onMonthSelect}){
    return(
        <aside className={styles.sidebar}>
            <div className={styles.logo}>오늘의 일지</div>
            <ul className={styles.menuList}>
                {months.map((m) => (
                    <li
                    key={m}
                    className={`${styles.menuItem} ${selectedMonth === m ? styles.active: ''}`}
                    onClick={() => onMonthSelect(m)}
                    >
                        {m}월
                    </li>
                ))}
            </ul>
        </aside>
    )
}