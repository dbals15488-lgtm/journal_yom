"use client";

import type { WeeklyStats } from "../../app/actions/weeklyStats";

interface WeeklyStatsWidgetProps {
  stats: WeeklyStats | null;
}

export default function WeeklyStatsWidget({ stats }: WeeklyStatsWidgetProps) {
  if (stats === null) {
    return (
      <div className="card weekly-card">
        <div className="weekly-header">
          <h3 className="weekly-title">이번 주 통계</h3>
        </div>
        <p className="weekly-loading">불러오는 중...</p>
      </div>
    );
  }

  const items = [
    {
      icon: "📝",
      label: "일지",
      value: `${stats.diaryCount}회`,
      color: "#8b5cf6",
      key: "hasDiary" as const,
    },
    {
      icon: "💪",
      label: "운동",
      value: `${stats.workoutCount}회`,
      color: "#f97316",
      key: "hasWorkout" as const,
    },
    {
      icon: "🍽",
      label: "식단",
      value: `${stats.totalCalories.toLocaleString()} kcal`,
      color: "#10b981",
      key: "calories" as const,
    },
  ];

  return (
    <div className="card weekly-card">
      <div className="weekly-header">
        <h3 className="weekly-title">이번 주 통계</h3>
      </div>
      <div className="weekly-list">
        {items.map((item) => (
          <div key={item.label} className="weekly-item">
            <div className="weekly-item-top">
              <div className="weekly-item-info">
                <div
                  className="weekly-item-icon"
                  style={{ background: `${item.color}20`, color: item.color }}
                >
                  {item.icon}
                </div>
                <span className="weekly-item-label">{item.label}</span>
              </div>
              <span className="weekly-item-value" style={{ color: item.color }}>
                {item.value}
              </span>
            </div>
            <div className="weekly-days">
              {stats.days.map((d) => {
                const active = item.key === "calories" ? d.calories > 0 : d[item.key];
                return (
                  <div key={d.date} className="weekly-day">
                    <div
                      className={`weekly-day-box ${active ? "weekly-day-active" : ""}`}
                      style={active ? { background: item.color } : undefined}
                    />
                    <span className="weekly-day-label">{d.dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
