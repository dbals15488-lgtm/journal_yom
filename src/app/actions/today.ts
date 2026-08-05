"use server";

import prisma from "../../lib/prisma";
import { getCurrentUserId } from "../../lib/session";

export interface TodaySummary {
  hasDiary: boolean;
  hasWorkout: boolean;
  dietCalories: number;
  completed: number;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getTodayRangeKst() {
  const nowKst = new Date(Date.now() + KST_OFFSET_MS);
  const startShifted = new Date(nowKst);
  startShifted.setUTCHours(0, 0, 0, 0);
  const endShifted = new Date(nowKst);
  endShifted.setUTCHours(23, 59, 59, 999);
  return {
    gte: new Date(startShifted.getTime() - KST_OFFSET_MS),
    lte: new Date(endShifted.getTime() - KST_OFFSET_MS),
  };
}

export async function fetchTodaySummary(): Promise<{
  success: boolean;
  data?: TodaySummary;
  message?: string;
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  try {
    const range = getTodayRangeKst();

    const [diaryCount, workoutCount, dietRecords] = await Promise.all([
      prisma.record.count({
        where: { createdAt: range, userId },
      }),
      prisma.workoutRecord.count({
        where: { date: range, userId },
      }),
      prisma.dietRecord.findMany({
        where: { date: range, userId },
        select: { calories: true },
      }),
    ]);

    const hasDiary = diaryCount > 0;
    const hasWorkout = workoutCount > 0;
    const dietCalories = dietRecords.reduce((sum, r) => sum + (r.calories ?? 0), 0);
    const hasDiet = dietCalories > 0;
    const completed = [hasDiary, hasWorkout, hasDiet].filter(Boolean).length;

    return {
      success: true,
      data: {
        hasDiary,
        hasWorkout,
        dietCalories: Math.round(dietCalories),
        completed,
      },
    };
  } catch (error) {
    console.error("fetchTodaySummary error:", error);
    return { success: false, message: "오늘의 요약을 불러올 수 없습니다." };
  }
}