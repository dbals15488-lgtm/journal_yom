"use server";

import prisma from "../../lib/prisma";

export interface TodaySummary {
  hasDiary: boolean;      // 오늘 일지 작성 여부
  hasWorkout: boolean;    // 오늘 운동 기록 여부
  dietCalories: number;   // 오늘 총 칼로리 (0이면 미기록)
  completed: number;      // 완료한 항목 수 (0~3)
}

// 오늘 하루 범위 헬퍼
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

export async function fetchTodaySummary(): Promise<{
  success: boolean;
  data?: TodaySummary;
  message?: string;
}> {
  try {
    const range = getTodayRange();

    const [diaryCount, workoutCount, dietRecords] = await Promise.all([
      prisma.record.count({
        where: { createdAt: range },
      }),
      prisma.workoutRecord.count({
        where: { date: range },
      }),
      prisma.dietRecord.findMany({
        where: { date: range },
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