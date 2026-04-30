"use client"
import { createContext, useContext, useState, useEffect } from "react"

const RecordContext = createContext();

export function RecordProvider({children}) {
    const [records, setRecords] = useState([])
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("habit_records");
        if (saved) {
            setRecords(JSON.parse(saved));
        }
        setIsLoaded(true)
    }, [])
 

    // 데이터 바뀔 때마다 로컬스토리지에 저장하기
    useEffect(() => {
        if (isLoaded){
            localStorage.setItem("habit_records", JSON.stringify(records));
        }
    }, [records, isLoaded]);
    

    // 저장 함수
    const addRecord = (newRecord) => {
        setRecords((prev) => [...prev, newRecord]);
    };

    // 삭제 함수
    const deleteRecord = (id) => {
        setRecords((prev) => prev.filter((r) => String(r.id) !== String(id)));
    }



    return(
        <RecordContext.Provider value={{records, addRecord, isLoaded, deleteRecord}}>
            {children}
        </RecordContext.Provider>
    )
}


export const useRecords = () => useContext(RecordContext)