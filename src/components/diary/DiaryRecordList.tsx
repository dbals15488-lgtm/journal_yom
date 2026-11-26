"use client";

import React from "react";
import Link from "next/link";

interface DiaryRecord {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}

interface DiaryRecordListProps {
  records: DiaryRecord[];
  selectedDate: Date;
  activeId: number | null;
  onToggle: (id: number | null) => void;
  onDelete: (id: number) => void;
}

export default function DiaryRecordList({
  records,
  selectedDate,
  activeId,
  onToggle,
  onDelete,
}: DiaryRecordListProps) {
  const filtered = records.filter(
    (r) => new Date(r.createdAt).toDateString() === selectedDate.toDateString(),
  );

  return (
    <section className="list-section">
      <h3>{selectedDate.toLocaleDateString()} 기록</h3>
      {filtered.length > 0 ? (
        filtered.map((item) => {
          const isSelected = activeId === item.id;
          return (
            <div
              key={item.id}
              className={`record-item ${isSelected ? "active" : ""}`}
              onClick={() => onToggle(isSelected ? null : item.id)}
            >
              <div className="record-item-inner">
                <div className="record-item-row">
                  <div className="record-text-group">
                    <h4>{item.title}</h4>
                    <div dangerouslySetInnerHTML={{ __html: item.content }} />
                  </div>
                  {isSelected && (
                    <div className="action-btn-group" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/detail/${item.id}`}>
                        <button className="view-btn">보기</button>
                      </Link>
                      <button className="delete-btn" onClick={() => onDelete(item.id)}>삭제</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <p className="no-data">작성된 기록이 없습니다.</p>
      )}
    </section>
  );
}
