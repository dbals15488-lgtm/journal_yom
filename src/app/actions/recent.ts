"use server";

import prisma from "../../lib/prisma";
import { getCurrentUserId } from "../../lib/session";

export interface RecentRecord {
  id: number;
  type: "diary" | "workout" | "diet";
  title: string;
  subtitle?: string;
  date: Date;
  href: string;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toKstDateStr(d: Date): string {
  return new Date(d.getTime() + KST_OFFSET_MS).toISOString().split("T")[0];
}

export async function fetchRecentRecords(): Promise<{
  success: boolean;
  data?: RecentRecord[];
  message?: string;
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  try {
    const [latestDiary, latestWorkouts, latestDiets] = await Promise.all([
      prisma.record.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          createdAt: true,
        },
      }),
      prisma.workoutRecord.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 20,
        select: {
          id: true,
          part: true,
          date: true,
        },
      }),
      prisma.dietRecord.findMany({
        where: { userId },
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

    if (latestWorkouts.length > 0) {
      const latestDateKey = toKstDateStr(latestWorkouts[0].date);
      const sameDayWorkouts = latestWorkouts.filter(
        (w) => toKstDateStr(w.date) === latestDateKey
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

    if (latestDiets.length > 0) {
      const latestDateKey = toKstDateStr(latestDiets[0].date);
      const sameDayDiets = latestDiets.filter(
        (d) => toKstDateStr(d.date) === latestDateKey
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

    const typeOrder: Record<RecentRecord["type"], number> = { diary: 0, workout: 1, diet: 2 };
    records.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

    return { success: true, data: records };
  } catch (error) {
    console.error("fetchRecentRecords error:", error);
    return { success: false, message: "최근 기록을 불러올 수 없습니다." };
  }
}