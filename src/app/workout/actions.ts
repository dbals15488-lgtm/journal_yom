"use server";

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";

interface WorkoutInput{
  part: string;
  name: string;
  reps: number | string;
  sets: number | string;
  restTime: string; 
}

function validateInput(data: WorkoutInput[]): string | null {
  for ( const item of data) {
    if (!item.part?.trim() || !item.name?.trim() || !item.restTime?.trim()){
      return "모든 항목을 입력해주세요.";
    }
    if (!Number(item.reps) || Number(item.reps) <= 0 || !Number(item.sets) || Number(item.sets) <= 0){
      return "횟수와 세트 수를 올바르게 입력해주세요."
    }
  }
  return null;
}

export async function createWorkout(data: WorkoutInput[], date: Date) {
  const error = validateInput(data);

  if(error) return { success: false, massage: error};

  try {
    await prisma.workoutRecord.createMany({
      data: data.map((item) => ({
        part: item.part.trim(),
        workoutName: item.name.trim(),
        reps: Number(item.reps),
        sets: Number(item.sets),
        restTime: item.restTime.trim(),
        date,
        userId: "user_id_here", 
      })),
    });
    revalidatePath("/workout");
    return { success: true };
  } catch (error) {
    console.error("createWorkout error:", error);
    return { success: false, message: "저장 중 오류가 발생했습니다." };
  }
}

export async function updateWorkoutsForDate(date: Date, data: WorkoutInput[]){
  const error = validateInput(data);
  if(error) return { success: false, message: error};

  try {
    await prisma.$transaction([
      prisma.workoutRecord.deleteMany({ where: { date } }),
      prisma.workoutRecord.createMany({
        data: data.map((item) => ({
          part: item.part.trim(),
          workoutName: item.name.trim(),
          reps: Number(item.reps),
          sets: Number(item.sets),
          restTime: item.restTime.trim(),
          date,
          userId: "user_id_here",
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
  try {
    await prisma.workoutRecord.deleteMany({ where: { date } });
    revalidatePath("/workout");
    return { success: true };
  } catch (error) {
    console.error("deleteWorkoutsByDate error:", error);
    return { success: false };
  }
}

export async function fetchWorkouts() {
  try {
    return await prisma.workoutRecord.findMany({ orderBy: { date: "asc" } });
  } catch (error) {
    console.error("fetchWorkouts error:", error);
    return [];
  }
}