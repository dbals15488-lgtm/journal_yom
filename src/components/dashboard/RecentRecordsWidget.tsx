"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { RecentRecord } from "../../app/actions/recent";

const RECENT_TYPE_META: Record<RecentRecord["type"], { icon: string; label: string; color: string }> = {
  diary: { icon: "📝", label: "일지", color: "#8b5cf6" },
  workout: { icon: "💪", label: "운동", color: "#f97316" },
  diet: { icon: "🍽", label: "식단", color: "#10b981" },
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return format(target, "M월 d일", { locale: ko });
}

interface RecentRecordsWidgetProps {
  records: RecentRecord[] | null;
}

export default function RecentRecordsWidget({ records }: RecentRecordsWidgetProps) {
  if (records === null) {
    return (
      <div className="card recent-card">
        <div className="recent-header">
          <h3 className="recent-title">최근 기록</h3>
        </div>
        <p className="recent-loading">불러오는 중...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="card recent-card">
        <div className="recent-header">
          <h3 className="recent-title">최근 기록</h3>
        </div>
        <p className="recent-empty">
          아직 기록이 없어요.
          <br />첫 기록을 남겨보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="card recent-card">
      <div className="recent-header">
        <h3 className="recent-title">최근 기록</h3>
      </div>
      <div className="recent-list">
        {records.map((r) => {
          const meta = RECENT_TYPE_META[r.type];
          return (
            <Link key={`${r.type}-${r.id}`} href={r.href} className="recent-item">
              <div
                className="recent-icon"
                style={{ background: `${meta.color}20`, color: meta.color }}
              >
                {meta.icon}
              </div>
              <div className="recent-body">
                <div className="recent-item-top">
                  <span className="recent-type" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="recent-time">{getRelativeTime(r.date)}</span>
                </div>
                <div className="recent-item-title">{r.title}</div>
                {r.subtitle && <div className="recent-item-subtitle">{r.subtitle}</div>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
