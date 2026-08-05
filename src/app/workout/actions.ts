"use server";

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "../../lib/session";

interface WorkoutInput {
  part: string;
  name: string;
  reps: number | string;
  sets: number | string;
  restTime: string;
}

function validateInput(data: WorkoutInput[]): string | null {
  for (const item of data) {
    if (!item.part?.trim() || !item.name?.trim() || !item.restTime?.trim()) {
      return "모든 항목을 입력해주세요.";
    }
    if (!Number(item.reps) || Number(item.reps) <= 0 || !Number(item.sets) || Number(item.sets) <= 0) {
      return "횟수와 세트 수를 올바르게 입력해주세요.";
    }
  }
  return null;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getDayRange(date: Date) {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  const startShifted = new Date(shifted);
  startShifted.setUTCHours(0, 0, 0, 0);
  const endShifted = new Date(shifted);
  endShifted.setUTCHours(23, 59, 59, 999);
  return {
    gte: new Date(startShifted.getTime() - KST_OFFSET_MS),
    lte: new Date(endShifted.getTime() - KST_OFFSET_MS),
  };
}

export async function createWorkout(data: WorkoutInput[], date: Date) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  const error = validateInput(data);
  if (error) return { success: false, message: error };

  try {
    await prisma.workoutRecord.createMany({
      data: data.map((item) => ({
        part: item.part.trim(),
        workoutName: item.name.trim(),
        reps: Number(item.reps),
        sets: Number(item.sets),
        restTime: item.restTime.trim(),
        date,
        userId,
      })),
    });
    revalidatePath("/workout");
    return { success: true };
  } catch (error) {
    console.error("createWorkout error:", error);
    return { success: false, message: "저장 중 오류가 발생했습니다." };
  }
}

export async function updateWorkoutsForDate(date: Date, data: WorkoutInput[]) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  const error = validateInput(data);
  if (error) return { success: false, message: error };

  try {
    await prisma.$transaction([
      prisma.workoutRecord.deleteMany({
        where: {
          date: getDayRange(date),
          userId,
        },
      }),
      prisma.workoutRecord.createMany({
        data: data.map((item) => ({
          part: item.part.trim(),
          workoutName: item.name.trim(),
          reps: Number(item.reps),
          sets: Number(item.sets),
          restTime: item.restTime.trim(),
          date,
          userId,
        })),
      }),
    ]);
    revalidatePath("/workout");
    return { success: true };
  } catch (error) {
    console.error("updateWorkoutsForDate error:", error);
    return { success: false, message: "수정 중 오류가 발생했습니다." };
  }
}

export async function deleteWorkoutsByDate(date: Date) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  try {
    await prisma.workoutRecord.deleteMany({
      where: {
        date: getDayRange(date),
        userId,
      },
    });
    revalidatePath("/workout");
    return { success: true };
  } catch (error) {
    console.error("deleteWorkoutsByDate error:", error);
    return { success: false };
  }
}

export async function fetchWorkouts() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return [];
  }

  try {
    return await prisma.workoutRecord.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });
  } catch (error) {
    console.error("fetchWorkouts error:", error);
    return [];
  }
}