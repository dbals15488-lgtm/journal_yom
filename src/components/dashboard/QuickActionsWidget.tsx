"use client";

import Link from "next/link";

const QUICK_ACTIONS = [
  { icon: "✏️", label: "일지 쓰기", href: "/diary", color: "#8b5cf6" },
  { icon: "💪", label: "운동 기록", href: "/workout", color: "#f97316" },
  { icon: "🍽", label: "식단 등록", href: "/diet", color: "#10b981" },
  { icon: "🎧", label: "고객 문의", href: "/support", color: "#3b82f6" },
];

export default function QuickActionsWidget() {
  return (
    <div className="card quick-card">
      <div className="quick-header">
        <h3 className="quick-title">빠른 액션</h3>
      </div>
      <div className="quick-grid">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.label} href={action.href} className="quick-item">
            <div
              className="quick-icon"
              style={{ background: `${action.color}20`, color: action.color }}
            >
              {action.icon}
            </div>
            <span className="quick-label">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
