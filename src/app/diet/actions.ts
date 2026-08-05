"use server";

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import { getCurrentUserId } from "../../lib/session";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function calculateNutrition(foodName: string, amount: string) {
  if (!foodName?.trim() || !amount?.trim()) {
    return { success: false, message: "음식명과 양을 입력해주세요." };
  }

  try {
    const prompt = `다음 음식의 영양성분을 계산해주세요.
음식: ${foodName}
양: ${amount}

반드시 아래 JSON 형식으로만 답변하세요. 설명이나 다른 텍스트는 절대 포함하지 마세요.
{
  "protein": 단백질(g, 소수점 1자리 숫자),
  "fat": 지방(g, 소수점 1자리 숫자),
  "carbs": 탄수화물(g, 소수점 1자리 숫자),
  "calories": 칼로리(kcal, 정수)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
    });

    const text = response.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, message: "AI 응답을 이해할 수 없습니다. 다시 시도해주세요." };
    }

    const data = JSON.parse(jsonMatch[0]);
    return {
      success: true,
      data: {
        protein: Number(data.protein) || 0,
        fat: Number(data.fat) || 0,
        carbs: Number(data.carbs) || 0,
        calories: Number(data.calories) || 0,
      },
    };
  } catch (error) {
    console.error("calculateNutrition error:", error);
    return { success: false, message: "AI 계산 중 오류가 발생했습니다." };
  }
}

interface DietInput {
  foodName: string;
  amount: string;
  protein: number | string;
  fat: number | string;
  carbs: number | string;
  calories: number | string;
  mealType: string;
}

function validateInput(data: DietInput[]): string | null {
  for (const item of data) {
    if (!item.foodName?.trim()) return "음식명을 입력해주세요.";
    if (!item.amount?.trim()) return "양을 입력해주세요.";
    if (!item.mealType?.trim()) return "식사 구분을 선택해주세요.";
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

export async function createDiet(data: DietInput[], date: Date) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  const error = validateInput(data);
  if (error) return { success: false, message: error };

  try {
    await prisma.dietRecord.createMany({
      data: data.map((item) => ({
        foodName: item.foodName.trim(),
        amount: item.amount.trim(),
        protein: Number(item.protein) || 0,
        fat: Number(item.fat) || 0,
        carbs: Number(item.carbs) || 0,
        calories: Number(item.calories) || 0,
        mealType: item.mealType,
        date,
        userId,
      })),
    });
    revalidatePath("/diet");
    return { success: true };
  } catch (error) {
    console.error("createDiet error:", error);
    return { success: false, message: "저장 중 오류가 발생했습니다." };
  }
}

export async function updateDietsForDate(date: Date, data: DietInput[]) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  const error = validateInput(data);
  if (error) return { success: false, message: error };

  try {
    await prisma.$transaction([
      prisma.dietRecord.deleteMany({
        where: {
          date: getDayRange(date),
          userId,
        },
      }),
      prisma.dietRecord.createMany({
        data: data.map((item) => ({
          foodName: item.foodName.trim(),
          amount: item.amount.trim(),
          protein: Number(item.protein) || 0,
          fat: Number(item.fat) || 0,
          carbs: Number(item.carbs) || 0,
          calories: Number(item.calories) || 0,
          mealType: item.mealType,
          date,
          userId,
        })),
      }),
    ]);
    revalidatePath("/diet");
    return { success: true };
  } catch (error) {
    console.error("updateDietsForDate error:", error);
    return { success: false, message: "수정 중 오류가 발생했습니다." };
  }
}

export async function deleteDietsByDate(date: Date) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  try {
    await prisma.dietRecord.deleteMany({
      where: {
        date: getDayRange(date),
        userId,
      },
    });
    revalidatePath("/diet");
    return { success: true };
  } catch (error) {
    console.error("deleteDietsByDate error:", error);
    return { success: false };
  }
}

export async function fetchDiets() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return [];
  }

  try {
    return await prisma.dietRecord.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });
  } catch (error) {
    console.error("fetchDiets error:", error);
    return [];
  }
}