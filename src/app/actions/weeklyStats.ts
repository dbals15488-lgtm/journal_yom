"use server";

import prisma from "../../lib/prisma";
import { getCurrentUserId } from "../../lib/session";

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

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toKstDateStr(d: Date): string {
  return new Date(d.getTime() + KST_OFFSET_MS).toISOString().split("T")[0];
}

function getWeekStart(): Date {
  const nowKst = new Date(Date.now() + KST_OFFSET_MS);
  const day = nowKst.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;

  const mondayShifted = new Date(nowKst);
  mondayShifted.setUTCDate(mondayShifted.getUTCDate() - diff);
  mondayShifted.setUTCHours(0, 0, 0, 0);

  return new Date(mondayShifted.getTime() - KST_OFFSET_MS);
}

function getWeekEnd(monday: Date): Date {
  return new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
}

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export async function fetchWeeklyStats(): Promise<{
  success: boolean;
  data?: WeeklyStats;
  message?: string;
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  try {
    const monday = getWeekStart();
    const sunday = getWeekEnd(monday);
    const range = { gte: monday, lte: sunday };

    const [diaries, workouts, diets] = await Promise.all([
      prisma.record.findMany({
        where: { createdAt: range, userId },
        select: { createdAt: true },
      }),
      prisma.workoutRecord.findMany({
        where: { date: range, userId },
        select: { date: true },
      }),
      prisma.dietRecord.findMany({
        where: { date: range, userId },
        select: { date: true, calories: true },
      }),
    ]);

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