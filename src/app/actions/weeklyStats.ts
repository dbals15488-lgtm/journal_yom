"use server";

import prisma from "../../lib/prisma";

export interface WeeklyDayData {
  date: string;
  dayLabel: string;
  hasDiary: boolean;
  hasWorkout: boolean;
  calories: number;
}

export interface WeeklyStats {
  diaryCount: number;
  workoutCount: number;
  totalCalories: number;
  days: WeeklyDayData[];
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // KST = UTC + 9시간

// KST 기준 YYYY-MM-DD 문자열로 변환
function toKstDateStr(d: Date): string {
  return new Date(d.getTime() + KST_OFFSET_MS).toISOString().split("T")[0];
}

// KST 기준 이번 주 월요일 00:00:00 (실제 UTC 시각 반환)
function getWeekStart(): Date {
  // 현재 시각을 KST로 이동 (UTC 메서드가 KST 값을 반환하도록)
  const nowKst = new Date(Date.now() + KST_OFFSET_MS);
  const day = nowKst.getUTCDay(); // 0=일, 1=월, ..., 6=토 (실제로는 KST 요일)
  const diff = day === 0 ? 6 : day - 1;

  // KST 월요일 00:00:00 (아직 UTC처럼 취급 중)
  const mondayShifted = new Date(nowKst);
  mondayShifted.setUTCDate(mondayShifted.getUTCDate() - diff);
  mondayShifted.setUTCHours(0, 0, 0, 0);

  // 실제 UTC 시각으로 되돌림
  return new Date(mondayShifted.getTime() - KST_OFFSET_MS);
}

// 월요일 00:00 → 일요일 23:59:59.999
function getWeekEnd(monday: Date): Date {
  return new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
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

    // 요일별 집계 Map — 키는 KST 기준 YYYY-MM-DD
    const dayMap = new Map<string, WeeklyDayData>();
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
      const key = toKstDateStr(dayDate);
      dayMap.set(key, {
        date: key,
        dayLabel: DAY_LABELS[i],
        hasDiary: false,
        hasWorkout: false,
        calories: 0,
      });
    }

    diaries.forEach((d) => {
      const key = toKstDateStr(d.createdAt);
      const day = dayMap.get(key);
      if (day) day.hasDiary = true;
    });

    workouts.forEach((w) => {
      const key = toKstDateStr(w.date);
      const day = dayMap.get(key);
      if (day) day.hasWorkout = true;
    });

    diets.forEach((d) => {
      const key = toKstDateStr(d.date);
      const day = dayMap.get(key);
      if (day) day.calories += d.calories ?? 0;
    });

    const days = Array.from(dayMap.values());
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