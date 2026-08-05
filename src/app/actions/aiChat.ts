"use server";

import prisma from "../../lib/prisma";
import { GoogleGenAI } from "@google/genai";
import { getCurrentUserId } from "../../lib/session";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface ChatMessage {
  id: number;
  role: string;
  content: string;
  createdAt: Date;
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

function getWeekRangeKst() {
  const nowKst = new Date(Date.now() + KST_OFFSET_MS);
  const day = nowKst.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;

  const mondayShifted = new Date(nowKst);
  mondayShifted.setUTCDate(mondayShifted.getUTCDate() - diff);
  mondayShifted.setUTCHours(0, 0, 0, 0);

  const monday = new Date(mondayShifted.getTime() - KST_OFFSET_MS);
  const sunday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  return { gte: monday, lte: sunday };
}

function getTodayKstStr(): string {
  return new Date(Date.now() + KST_OFFSET_MS).toISOString().split("T")[0];
}

async function getUserContext(userId: number): Promise<string> {
  const todayRange = getTodayRangeKst();
  const weekRange = getWeekRangeKst();

  const [todayDiary, todayWorkouts, todayDiets, weekDiets] = await Promise.all([
    prisma.record.findFirst({
      where: { createdAt: todayRange, userId },
      select: { title: true, category: true },
    }),
    prisma.workoutRecord.findMany({
      where: { date: todayRange, userId },
      select: { part: true, workoutName: true, reps: true, sets: true },
    }),
    prisma.dietRecord.findMany({
      where: { date: todayRange, userId },
      select: { foodName: true, mealType: true, calories: true, protein: true, fat: true, carbs: true },
    }),
    prisma.dietRecord.findMany({
      where: { date: weekRange, userId },
      select: { calories: true },
    }),
  ]);

  const parts: string[] = [];
  parts.push(`오늘 날짜: ${getTodayKstStr()} (KST 기준)`);

  if (todayDiary) {
    parts.push(`오늘 일지: "${todayDiary.title}" (카테고리: ${todayDiary.category})`);
  } else {
    parts.push("오늘 일지: 아직 없음");
  }

  if (todayWorkouts.length > 0) {
    const workoutSummary = todayWorkouts
      .map((w) => `${w.part} - ${w.workoutName} ${w.reps}회 x ${w.sets}세트`)
      .join(", ");
    parts.push(`오늘 운동: ${workoutSummary}`);
  } else {
    parts.push("오늘 운동: 아직 없음");
  }

  if (todayDiets.length > 0) {
    const todayCal = todayDiets.reduce((s, d) => s + (d.calories ?? 0), 0);
    const todayProtein = todayDiets.reduce((s, d) => s + (d.protein ?? 0), 0);
    const dietSummary = todayDiets
      .map((d) => `${d.mealType}-${d.foodName}(${d.calories}kcal)`)
      .join(", ");
    parts.push(`오늘 식단: ${dietSummary}`);
    parts.push(`오늘 총 칼로리: ${Math.round(todayCal)}kcal, 단백질: ${Math.round(todayProtein)}g`);
  } else {
    parts.push("오늘 식단: 아직 없음");
  }

  const weekCal = weekDiets.reduce((s, d) => s + (d.calories ?? 0), 0);
  parts.push(`이번 주 총 칼로리: ${Math.round(weekCal)}kcal`);

  return parts.join("\n");
}

export async function fetchChatHistory(): Promise<{
  success: boolean;
  data?: ChatMessage[];
  message?: string;
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  try {
    const messages = await prisma.aiChat.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    return { success: true, data: messages };
  } catch (error) {
    console.error("fetchChatHistory error:", error);
    return { success: false, message: "채팅 기록을 불러올 수 없습니다." };
  }
}

export async function sendChatMessage(userMessage: string): Promise<{
  success: boolean;
  data?: { userMsg: ChatMessage; aiMsg: ChatMessage };
  message?: string;
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  if (!userMessage?.trim()) {
    return { success: false, message: "메시지를 입력해주세요." };
  }

  try {
    const userMsg = await prisma.aiChat.create({
      data: {
        role: "user",
        content: userMessage.trim(),
        userId,
      },
    });

    const context = await getUserContext(userId);

    const recentMessages = await prisma.aiChat.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const conversationHistory = recentMessages
      .reverse()
      .map((m) => `${m.role === "user" ? "사용자" : "어시스턴트"}: ${m.content}`)
      .join("\n");

    const prompt = `당신은 개인 건강 관리 앱의 친근한 AI 어시스턴트입니다.
사용자의 일지, 운동, 식단 데이터를 참고해 따뜻하고 실용적인 조언을 해주세요.
답변은 3~5줄 이내로 간결하게 작성해주세요. 이모지도 적절히 활용해 친근함을 표현하세요.

[사용자의 오늘 활동]
${context}

[최근 대화]
${conversationHistory}

사용자에게 답변해주세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
    });

    const aiText = response.text?.trim() ?? "죄송해요, 답변을 생성하지 못했어요. 다시 시도해주세요.";

    const aiMsg = await prisma.aiChat.create({
      data: {
        role: "assistant",
        content: aiText,
        userId,
      },
    });

    return { success: true, data: { userMsg, aiMsg } };
  } catch (error) {
    console.error("sendChatMessage error:", error);
    return { success: false, message: "메시지 전송 중 오류가 발생했습니다." };
  }
}

export async function clearChatHistory() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  try {
    await prisma.aiChat.deleteMany({
      where: { userId },
    });
    return { success: true };
  } catch (error) {
    console.error("clearChatHistory error:", error);
    return { success: false };
  }
}