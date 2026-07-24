"use server";

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// AI 영양소 자동 계산
// ===============================
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

// 식단 저장
// ===============================

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

export async function createDiet(data: DietInput[], date: Date) {
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
        userId: "user_id_here", // TODO: 로그인 연동 시 교체
      })),
    });
    revalidatePath("/diet");
    return { success: true };
  } catch (error) {
    console.error("createDiet error:", error);
    return { success: false, message: "저장 중 오류가 발생했습니다." };
  }
}

// 식단 조회
// ===============================
export async function fetchDiets() {
  try {
    return await prisma.dietRecord.findMany({ orderBy: { date: "asc" } });
  } catch (error) {
    console.error("fetchDiets error:", error);
    return [];
  }
}

// ===============================
// 날짜 범위 헬퍼 (시간대 문제 방지)
// ===============================
function getDayRange(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { gte: start, lte: end };
  }
  
  // ===============================
  // 특정 날짜 식단 통째로 교체 (수정)
  // ===============================
  export async function updateDietsForDate(date: Date, data: DietInput[]) {
    const error = validateInput(data);
    if (error) return { success: false, message: error };
  
    try {
      await prisma.$transaction([
        prisma.dietRecord.deleteMany({
          where: { date: getDayRange(date) },
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
            userId: "user_id_here",
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
  
  // ===============================
  // 특정 날짜 식단 전체 삭제
  // ===============================
  export async function deleteDietsByDate(date: Date) {
    try {
      await prisma.dietRecord.deleteMany({
        where: { date: getDayRange(date) },
      });
      revalidatePath("/diet");
      return { success: true };
    } catch (error) {
      console.error("deleteDietsByDate error:", error);
      return { success: false };
    }
  }