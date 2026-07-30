"use server";

import prisma from "../../lib/prisma";

export interface RecentRecord {
  id: number;
  type: "diary" | "workout" | "diet";
  title: string;
  subtitle?: string;
  date: Date;
  href: string;
}

export async function fetchRecentRecords(): Promise<{
  success: boolean;
  data?: RecentRecord[];
  message?: string;
}> {
  try {
    // 각각 필요한 만큼만 가져오기
    const [latestDiary, latestWorkouts, latestDiets] = await Promise.all([
      // 일지: 가장 최근 1개
      prisma.record.findFirst({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          createdAt: true,
        },
      }),
      // 운동: 최근 날짜의 모든 항목 (그룹핑용)
      prisma.workoutRecord.findMany({
        orderBy: { date: "desc" },
        take: 20,
        select: {
          id: true,
          part: true,
          date: true,
        },
      }),
      // 식단: 최근 날짜의 모든 항목 (총 칼로리 계산용)
      prisma.dietRecord.findMany({
        orderBy: { date: "desc" },
        take: 20,
        select: {
          id: true,
          date: true,
          calories: true,
        },
      }),
    ]);

    const records: RecentRecord[] = [];

    // 일지
    if (latestDiary) {
      records.push({
        id: latestDiary.id,
        type: "diary",
        title: latestDiary.title,
        subtitle: latestDiary.category,
        date: latestDiary.createdAt,
        href: `/detail/${latestDiary.id}`,
      });
    }

    // 운동 — 가장 최근 날짜의 것만
    if (latestWorkouts.length > 0) {
      const latestDate = latestWorkouts[0].date.toISOString().split("T")[0];
      const sameDayWorkouts = latestWorkouts.filter(
        (w) => w.date.toISOString().split("T")[0] === latestDate
      );
      const parts = [...new Set(sameDayWorkouts.map((i) => i.part))].join(", ");
      records.push({
        id: sameDayWorkouts[0].id,
        type: "workout",
        title: `${parts} 운동`,
        subtitle: `${sameDayWorkouts.length}개 종목`,
        date: sameDayWorkouts[0].date,
        href: "/workout",
      });
    }

    // 식단 — 가장 최근 날짜의 총 칼로리
    if (latestDiets.length > 0) {
      const latestDate = latestDiets[0].date.toISOString().split("T")[0];
      const sameDayDiets = latestDiets.filter(
        (d) => d.date.toISOString().split("T")[0] === latestDate
      );
      const totalCal = sameDayDiets.reduce((sum, i) => sum + (i.calories ?? 0), 0);
      records.push({
        id: sameDayDiets[0].id,
        type: "diet",
        title: `${Math.round(totalCal).toLocaleString()} kcal`,
        subtitle: `${sameDayDiets.length}개 항목`,
        date: sameDayDiets[0].date,
        href: "/diet",
      });
    }

    // 순서 고정: 일지 → 운동 → 식단
    const typeOrder: Record<RecentRecord["type"], number> = { diary: 0, workout: 1, diet: 2 };
    records.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

    return { success: true, data: records };
  } catch (error) {
    console.error("fetchRecentRecords error:", error);
    return { success: false, message: "최근 기록을 불러올 수 없습니다." };
  }
}