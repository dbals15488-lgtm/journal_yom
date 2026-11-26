"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function ClockWidget() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return (
      <div className="card clock-card">
        <div className="clock-time">--:--:--</div>
      </div>
    );
  }

  const ampm = now.getHours() < 12 ? "오전" : "오후";
  const hour12 = now.getHours() % 12 || 12;
  const timeText = `${String(hour12).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  return (
    <div className="card clock-card">
      <div className="clock-label">현재 시간</div>
      <div className="clock-time">
        <span className="clock-ampm">{ampm}</span>
        <span className="clock-numbers">{timeText}</span>
      </div>
      <div className="clock-date">{format(now, "M월 d일 EEEE", { locale: ko })}</div>
    </div>
  );
}
