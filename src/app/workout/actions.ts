"use server";

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";

// 운동 일지 저장
// actions.ts
export async function createWorkout(data: any, date: Date) {
  try {
    await prisma.workoutRecord.createMany({
      data: data.map((item: any) => ({
        workoutName: item.name,
        reps: Number(item.reps),
        sets: Number(item.sets),
        restTime: item.restTime,
        date: date,
        userId: "user_id_here",
      })),
    });
    revalidatePath("/workout");
    return { success: true };
  } catch (error) {
    console.error("저장 에러:", error);
    return { success: false };
  }
}

// 운동 일지 삭제
export async function deleteWorkout(id: number) {
  await prisma.workoutRecord.delete({
    where: { id : id }
  });
  revalidatePath("/workout");
}

export async function fetchWorkouts() {
  const data = await prisma.workoutRecord.findMany();
  return data;
}