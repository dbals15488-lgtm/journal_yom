"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import "./dashboard.css";

import { fetchTodaySummary, type TodaySummary } from "./actions/today";
import { fetchRecentRecords, type RecentRecord } from "./actions/recent";
import { fetchWeather, type WeatherData } from "./actions/weather";
import { fetchWeeklyStats, type WeeklyStats } from "./actions/weeklyStats";

import ClockWidget from "../components/dashboard/ClockWidget";
import WeatherWidget from "../components/dashboard/WeatherWidget";
import RecentRecordsWidget from "../components/dashboard/RecentRecordsWidget";
import WeeklyStatsWidget from "../components/dashboard/WeeklyStatsWidget";
import AiAssistantWidget from "../components/dashboard/AiAssistantWidget";
import QuickActionsWidget from "../components/dashboard/QuickActionsWidget";

export default function HomePage() {
  const { data: session } = useSession();
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
      const getPosition = (): Promise<{ lat: number; lon: number } | null> => {
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            resolve(null);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 5000 },
          );
        });
      };

      const position = await getPosition();

      const [weatherRes, summaryRes, recentRes, weeklyRes] = await Promise.all([
        fetchWeather(position?.lat, position?.lon),
        fetchTodaySummary(),
        fetchRecentRecords(),
        fetchWeeklyStats(),
      ]);

      if (weatherRes.success && weatherRes.data) {
        setWeather(weatherRes.data);
      } else {
        setWeatherError(weatherRes.message ?? "날씨 로딩 실패");
      }

      if (summaryRes.success && summaryRes.data) {
        setTodaySummary(summaryRes.data);
      }

      if (recentRes.success && recentRes.data) {
        setRecentRecords(recentRes.data);
      }

      if (weeklyRes.success && weeklyRes.data) {
        setWeeklyStats(weeklyRes.data);
      }
    };
    loadAll();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">대시보드</h1>
        <p className="dashboard-date">{todayText}</p>
      </div>

      <div className="dashboard-grid">
        {/* 왼쪽 열 */}
        <div className="dashboard-col-left">
          <div className="card profile-card">
            <div className="profile-header">
              <div className="profile-avatar">{userName.charAt(0)}</div>
              <div className="profile-info">
                <h2 className="profile-name">{userName}</h2>
                <p className="profile-role">개인 대시보드</p>
              </div>
            </div>

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
          </div>

          <QuickActionsWidget />
        </div>

        {/* 가운데 열 */}
        <div className="dashboard-col-center">
          <WeatherWidget weather={weather} error={weatherError} />
          <AiAssistantWidget />
        </div>

        {/* 오른쪽 열 */}
        <div className="dashboard-col-right">
          <ClockWidget />
          <WeeklyStatsWidget stats={weeklyStats} />
          <RecentRecordsWidget records={recentRecords} />
        </div>
      </div>
    </div>
  );
}
