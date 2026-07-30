"use server";

import prisma from "../../lib/prisma";

export interface WeeklyDayData {
  date: string;      // "YYYY-MM-DD"
  dayLabel: string;  // "월", "화", ...
  hasDiary: boolean;
  hasWorkout: boolean;
  calories: number;
}

export interface WeeklyStats {
  diaryCount: number;
  workoutCount: number;
  totalCalories: number;
  days: WeeklyDayData[]; // 이번 주 월~일 7일
}

// 이번 주 월요일 0시부터 계산
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=일, 1=월, ..., 6=토
  const diff = day === 0 ? 6 : day - 1; // 월요일 기준으로 며칠 뒤인지
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekEnd(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export async function fetchWeeklyStats(): Promise<{
  success: boolean;
  data?: WeeklyStats;
  message?: string;
}> {
  try {
    const monday = getWeekStart();
    const sunday = getWeekEnd(monday);
    const range = { gte: monday, lte: sunday };

    // 이번 주 데이터 3개 병렬 조회
    const [diaries, workouts, diets] = await Promise.all([
      prisma.record.findMany({
        where: { createdAt: range },
        select: { createdAt: true },
      }),
      prisma.workoutRecord.findMany({
        where: { date: range },
        select: { date: true },
      }),
      prisma.dietRecord.findMany({
        where: { date: range },
        select: { date: true, calories: true },
      }),
    ]);

    // 요일별 집계용 Map 준비
    const dayMap = new Map<string, WeeklyDayData>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = d.toISOString().split("T")[0];
      dayMap.set(key, {
        date: key,
        dayLabel: DAY_LABELS[i],
        hasDiary: false,
        hasWorkout: false,
        calories: 0,
      });
    }

    // 일지 집계 (그날 하나라도 있으면 true)
    diaries.forEach((d) => {
      const key = d.createdAt.toISOString().split("T")[0];
      const day = dayMap.get(key);
      if (day) day.hasDiary = true;
    });

    // 운동 집계
    workouts.forEach((w) => {
      const key = w.date.toISOString().split("T")[0];
      const day = dayMap.get(key);
      if (day) day.hasWorkout = true;
    });

    // 식단 집계 (그날 총 칼로리 합산)
    diets.forEach((d) => {
      const key = d.date.toISOString().split("T")[0];
      const day = dayMap.get(key);
      if (day) day.calories += d.calories ?? 0;
    });

    // 배열로 변환 (월~일 순서 유지)
    const days = Array.from(dayMap.values());

    // 요약 카운트
    const diaryCount = days.filter((d) => d.hasDiary).length;
    const workoutCount = days.filter((d) => d.hasWorkout).length;
    const totalCalories = days.reduce((sum, d) => sum + d.calories, 0);

    return {
      success: true,
      data: {
        diaryCount,
        workoutCount,
        totalCalories: Math.round(totalCalories),
        days,
      },
    };
  } catch (error) {
    console.error("fetchWeeklyStats error:", error);
    return { success: false, message: "이번 주 통계를 불러올 수 없습니다." };
  }
}