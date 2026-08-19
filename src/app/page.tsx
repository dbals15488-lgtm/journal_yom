"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import "./dashboard.css";

import { fetchTodaySummary, type TodaySummary } from "./actions/today";
import { fetchRecentRecords, type RecentRecord } from "./actions/recent";
import { fetchWeather, type WeatherData } from "./actions/weather";
import { fetchWeeklyStats, type WeeklyStats } from "./actions/weeklyStats";
import { getWeatherInfo } from "./weather-utils";
import {
  fetchChatHistory,
  sendChatMessage,
  clearChatHistory,
  type ChatMessage,
} from "./actions/aiChat";

// ===============================
// 로그인 필요 안내 (공용)
// ===============================
function LoginRequiredNotice({ message }: { message: string }) {
  return (
    <div className="login-required">
      <div className="login-required-icon">🔒</div>
      <p className="login-required-text">{message}</p>
      <Link href="/login" className="login-required-btn">
        로그인하기
      </Link>
    </div>
  );
}

// ===============================
// 시계 위젯
// ===============================
function ClockWidget() {
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

// ===============================
// 날씨 위젯
// ===============================
function WeatherWidget({
  weather,
  error,
}: {
  weather: WeatherData | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="card weather-card">
        <p className="weather-error">{error}</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="card weather-card">
        <p className="weather-loading">날씨 정보 불러오는 중...</p>
      </div>
    );
  }

  const currentInfo = getWeatherInfo(weather.current.weatherCode, weather.current.isDay);

  return (
    <div className="card weather-card">
      {/* 현재 날씨 */}
      <div className="weather-main">
        <div className="weather-icon-large">{currentInfo.icon}</div>
        <div className="weather-info">
          <div className="weather-location">{weather.location.name}</div>
          <div className="weather-temp">{weather.current.temperature}°</div>
          <div className="weather-label">{currentInfo.label}</div>
          <div className="weather-minmax">
            <span className="weather-max">↑ {weather.today.max}°</span>
            <span className="weather-min">↓ {weather.today.min}°</span>
          </div>
        </div>
      </div>

      {/* 시간별 예보 */}
      <div className="weather-section">
        <div className="weather-section-label">시간별 예보</div>
        <div className="weather-hourly">
          {weather.hourly.map((h, i) => {
            const info = getWeatherInfo(h.weatherCode);
            return (
              <div key={h.time} className="weather-hour-item">
                <div className="weather-hour-label">
                  {i === 0 ? "지금" : `${h.hour}시`}
                </div>
                <div className="weather-hour-icon">{info.icon}</div>
                <div className="weather-hour-temp">{h.temperature}°</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 주간 예보 */}
      <div className="weather-section">
        <div className="weather-section-label">주간 예보</div>
        <div className="weather-weekly">
          {weather.weekly.map((d, i) => {
            const info = getWeatherInfo(d.weatherCode);
            const dateObj = new Date(d.date);
            const dayLabel = i === 0 ? "오늘" : format(dateObj, "EEE", { locale: ko });

            return (
              <div key={d.date} className="weather-day-item">
                <div className="weather-day-name">{dayLabel}</div>
                <div className="weather-day-icon">{info.icon}</div>
                <div className="weather-day-label">{info.label}</div>
                {d.precipitationProb > 0 && (
                  <div className="weather-day-rain">💧 {d.precipitationProb}%</div>
                )}
                <div className="weather-day-temps">
                  <span className="weather-day-max">{d.max}°</span>
                  <span className="weather-day-min">{d.min}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===============================
// 최근 기록 위젯
// ===============================
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

function RecentRecordsWidget({
  records,
  isLoggedIn,
}: {
  records: RecentRecord[] | null;
  isLoggedIn: boolean;
}) {
  // 로그인 안 됐으면 로그인 유도
  if (!isLoggedIn) {
    return (
      <div className="card recent-card">
        <div className="recent-header">
          <h3 className="recent-title">최근 기록</h3>
        </div>
        <LoginRequiredNotice message="최근 기록을 보려면 로그인이 필요해요" />
      </div>
    );
  }

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
          아직 기록이 없어요.<br />첫 기록을 남겨보세요!
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
            <Link
              key={`${r.type}-${r.id}`}
              href={r.href}
              className="recent-item"
            >
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
                {r.subtitle && (
                  <div className="recent-item-subtitle">{r.subtitle}</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ===============================
// 이번 주 통계 위젯
// ===============================
function WeeklyStatsWidget({
  stats,
  isLoggedIn,
}: {
  stats: WeeklyStats | null;
  isLoggedIn: boolean;
}) {
  // 로그인 안 됐으면 로그인 유도
  if (!isLoggedIn) {
    return (
      <div className="card weekly-card">
        <div className="weekly-header">
          <h3 className="weekly-title">이번 주 통계</h3>
        </div>
        <LoginRequiredNotice message="통계를 보려면 로그인이 필요해요" />
      </div>
    );
  }

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

            {/* 요일별 미니 격자 */}
            <div className="weekly-days">
              {stats.days.map((d) => {
                const active =
                  item.key === "calories" ? d.calories > 0 : d[item.key];
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

// ===============================
// AI 어시스턴트 위젯
// ===============================
const QUICK_PROMPTS = [
  "오늘 뭐 먹을까?",
  "이번 주 어땠어?",
  "어떤 운동 추천해?",
];

function AiAssistantWidget({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 초기 로드 (로그인 시에만)
  useEffect(() => {
    if (!isLoggedIn) return;

    const load = async () => {
      const result = await fetchChatHistory();
      if (result.success && result.data) {
        setMessages(result.data);
      } else {
        setMessages([]);
      }
    };
    load();
  }, [isLoggedIn]);

  // 메시지 목록 아래로 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 로그인 안 됐으면 로그인 유도
  if (!isLoggedIn) {
    return (
      <div className="card ai-card">
        <div className="ai-header">
          <h3 className="ai-title">🤖 AI 어시스턴트</h3>
        </div>
        <div className="ai-messages">
          <LoginRequiredNotice message="AI 어시스턴트를 사용하려면 로그인이 필요해요" />
        </div>
      </div>
    );
  }

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || isSending) return;

    setInput("");
    setIsSending(true);

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: message,
      createdAt: new Date(),
    };
    setMessages((prev) => [...(prev ?? []), tempUserMsg]);

    const result = await sendChatMessage(message);
    setIsSending(false);

    if (result.success && result.data) {
      setMessages((prev) => {
        const withoutTemp = (prev ?? []).filter((m) => m.id !== tempUserMsg.id);
        return [...withoutTemp, result.data!.userMsg, result.data!.aiMsg];
      });
    } else {
      alert(result.message ?? "전송 실패");
      setMessages((prev) => (prev ?? []).filter((m) => m.id !== tempUserMsg.id));
    }
  };

  const handleClear = async () => {
    if (!confirm("대화 기록을 모두 삭제하시겠습니까?")) return;
    await clearChatHistory();
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="card ai-card">
      <div className="ai-header">
        <h3 className="ai-title">🤖 AI 어시스턴트</h3>
        {messages && messages.length > 0 && (
          <button onClick={handleClear} className="ai-clear-btn">
            대화 초기화
          </button>
        )}
      </div>

      <div className="ai-messages" ref={scrollRef}>
        {messages === null ? (
          <p className="ai-loading">불러오는 중...</p>
        ) : messages.length === 0 ? (
          <div className="ai-welcome">
            <p className="ai-welcome-text">
              안녕하세요! 👋<br />
              오늘 하루를 함께 관리해드릴게요.<br />
              무엇이든 물어보세요.
            </p>
            <div className="ai-quick-prompts">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="ai-quick-prompt"
                  disabled={isSending}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div key={m.id} className={`ai-msg ai-msg-${m.role}`}>
                <div className="ai-msg-bubble">{m.content}</div>
              </div>
            ))}
            {isSending && (
              <div className="ai-msg ai-msg-assistant">
                <div className="ai-msg-bubble ai-msg-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="ai-input-row">
        <input
          type="text"
          className="ai-input"
          placeholder="메시지를 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
        <button
          onClick={() => handleSend()}
          className="ai-send-btn"
          disabled={isSending || !input.trim()}
        >
          {isSending ? "..." : "전송"}
        </button>
      </div>
    </div>
  );
}

// ===============================
// 빠른 액션 위젯
// ===============================
const QUICK_ACTIONS = [
  { icon: "✏️", label: "일지 쓰기", href: "/diary", color: "#8b5cf6" },
  { icon: "💪", label: "운동 기록", href: "/workout", color: "#f97316" },
  { icon: "🍽", label: "식단 등록", href: "/diet", color: "#10b981" },
  { icon: "🎧", label: "고객 센터", href: "/support", color: "#3b82f6" },
];

function QuickActionsWidget() {
  return (
    <div className="card quick-card">
      <div className="quick-header">
        <h3 className="quick-title">빠른 액션</h3>
      </div>
      <div className="quick-grid">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="quick-item"
          >
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

// ===============================
// 메인 페이지
// ===============================
export default function HomePage() {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;
  const userName = session?.user?.name ?? "게스트";

  const today = new Date();
  const todayText = format(today, "yyyy년 M월 d일 EEEE", { locale: ko });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [recentRecords, setRecentRecords] = useState<RecentRecord[] | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      // 위치 정보
      const getPosition = (): Promise<{ lat: number; lon: number } | null> => {
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            resolve(null);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 5000 }
          );
        });
      };

      const position = await getPosition();

      // 날씨는 항상 로드 (로그인 불필요)
      const weatherRes = await fetchWeather(position?.lat, position?.lon);
      if (weatherRes.success && weatherRes.data) {
        setWeather(weatherRes.data);
      } else {
        setWeatherError(weatherRes.message ?? "날씨 로딩 실패");
      }

      // 로그인 상태에서만 개인 데이터 로드
      if (isLoggedIn) {
        const [summaryRes, recentRes, weeklyRes] = await Promise.all([
          fetchTodaySummary(),
          fetchRecentRecords(),
          fetchWeeklyStats(),
        ]);

        if (summaryRes.success && summaryRes.data) {
          setTodaySummary(summaryRes.data);
        }
        if (recentRes.success && recentRes.data) {
          setRecentRecords(recentRes.data);
        }
        if (weeklyRes.success && weeklyRes.data) {
          setWeeklyStats(weeklyRes.data);
        }
      }
    };

    // 세션 상태 결정된 후 로드
    if (status !== "loading") {
      loadAll();
    }
  }, [isLoggedIn, status]);

  return (
    <div className="dashboard">
      {/* 상단 날짜 */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">대시보드</h1>
        <p className="dashboard-date">{todayText}</p>
      </div>

      {/* 3열 그리드 */}
      <div className="dashboard-grid">
        {/* 왼쪽 열 */}
        <div className="dashboard-col-left">
          <div className="card profile-card">
            <div className="profile-header">
              <div className="profile-avatar">{userName.charAt(0)}</div>
              <div className="profile-info">
                <h2 className="profile-name">{userName}</h2>
                <p className="profile-role">
                  {isLoggedIn ? "개인 대시보드" : "로그인이 필요합니다"}
                </p>
              </div>
            </div>

            {isLoggedIn ? (
              <div className="today-summary">
                <Link
                  href="/diary"
                  className={`summary-item ${todaySummary?.hasDiary ? "summary-done" : ""}`}
                >
                  <div className="summary-icon">📝</div>
                  <div className="summary-label">일지</div>
                  <div className="summary-value">
                    {todaySummary === null ? "-" : todaySummary.hasDiary ? "✓" : "-"}
                  </div>
                </Link>

                <Link
                  href="/workout"
                  className={`summary-item ${todaySummary?.hasWorkout ? "summary-done" : ""}`}
                >
                  <div className="summary-icon">💪</div>
                  <div className="summary-label">운동</div>
                  <div className="summary-value">
                    {todaySummary === null ? "-" : todaySummary.hasWorkout ? "✓" : "-"}
                  </div>
                </Link>

                <Link
                  href="/diet"
                  className={`summary-item ${
                    todaySummary && todaySummary.dietCalories > 0 ? "summary-done" : ""
                  }`}
                >
                  <div className="summary-icon">🍽</div>
                  <div className="summary-label">식단</div>
                  <div className="summary-value summary-value-sm">
                    {todaySummary === null
                      ? "-"
                      : todaySummary.dietCalories > 0
                      ? `${todaySummary.dietCalories.toLocaleString()}kcal`
                      : "-"}
                  </div>
                </Link>

                <div
                  className={`summary-item ${
                    todaySummary && todaySummary.completed === 3 ? "summary-done" : ""
                  }`}
                >
                  <div className="summary-icon">🎯</div>
                  <div className="summary-label">달성률</div>
                  <div className="summary-value">
                    {todaySummary === null ? "-" : `${todaySummary.completed}/3`}
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login" className="login-cta">
                <span className="login-cta-icon">🔐</span>
                <span className="login-cta-text">로그인하고 시작하기</span>
              </Link>
            )}
          </div>

          <QuickActionsWidget />
        </div>

        {/* 가운데 열 */}
        <div className="dashboard-col-center">
          <WeatherWidget weather={weather} error={weatherError} />
          <AiAssistantWidget isLoggedIn={isLoggedIn} />
        </div>

        {/* 오른쪽 열 */}
        <div className="dashboard-col-right">
          <ClockWidget />
          <WeeklyStatsWidget stats={weeklyStats} isLoggedIn={isLoggedIn} />
          <RecentRecordsWidget records={recentRecords} isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </div>
  );
}