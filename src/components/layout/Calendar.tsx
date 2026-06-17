import styles from './Calendar.module.css'


export default function Calendar({selectedMonth, selectedDay, onDaySelect}){

    // 현재 연도를 구하는식
    const currentYear = new Date().getFullYear();

    // 선택된 월의 마지막 날짜 계산
    // 예 : selectedMonth가 2라면 , new Date(2026, 2, 0)은 2월의 마지막 날인 28을 반환합니다.
    const lastDay = new Date(currentYear, selectedMonth, 0).getDate();

    // 1부터 30까지 숫자가 담긴 배열 만들기(이름표로 쓸 것들)
    const days = Array.from({length: lastDay}, (_, i) => i+ 1)

    return(
        <section className={styles.calendarContainer}>
            <h3>📅 {selectedMonth}월 날짜 선택</h3>
            <div className={styles.dayGrid}>
                {days.map((d) => (
                    <button
                    key={d} 
                    className={`${styles.dayButton} ${selectedDay === d ? styles.activeDay : ''}`}
                    onClick={() => onDaySelect(d)}
                    >
                        {d}일
                    </button>
                ))}
            </div>
        </section>
    )
}