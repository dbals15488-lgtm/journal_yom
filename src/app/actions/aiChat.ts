"use server";

import prisma from "../../lib/prisma";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// TODO: 나중에 로그인 연동 시 실제 유저ID로 교체
const CURRENT_USER_ID = "user_id_here";

export interface ChatMessage {
  id: number;
  role: string; // "user" or "assistant"
  content: string;
  createdAt: Date;
}

// 최근 하루 범위
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

// 이번 주 범위 (월요일 시작)
function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { gte: monday, lte: sunday };
}

// 사용자 컨텍스트 (오늘 + 이번 주 활동 요약)
async function getUserContext(): Promise<string> {
  const todayRange = getTodayRange();
  const weekRange = getWeekRange();

  const [todayDiary, todayWorkouts, todayDiets, weekDiets] = await Promise.all([
    prisma.record.findFirst({
      where: { createdAt: todayRange },
      select: { title: true, category: true },
    }),
    prisma.workoutRecord.findMany({
      where: { date: todayRange },
      select: { part: true, workoutName: true, reps: true, sets: true },
    }),
    prisma.dietRecord.findMany({
      where: { date: todayRange },
      select: { foodName: true, mealType: true, calories: true, protein: true, fat: true, carbs: true },
    }),
    prisma.dietRecord.findMany({
      where: { date: weekRange },
      select: { calories: true },
    }),
  ]);

  const parts: string[] = [];
  parts.push(`오늘 날짜: ${new Date().toISOString().split("T")[0]}`);

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

// 채팅 기록 조회
export async function fetchChatHistory(): Promise<{
  success: boolean;
  data?: ChatMessage[];
  message?: string;
}> {
  try {
    const messages = await prisma.aiChat.findMany({
      where: { userId: CURRENT_USER_ID },
      orderBy: { createdAt: "asc" },
      take: 50, // 최근 50개만
    });
    return { success: true, data: messages };
  } catch (error) {
    console.error("fetchChatHistory error:", error);
    return { success: false, message: "채팅 기록을 불러올 수 없습니다." };
  }
}

// 메시지 전송 (저장 + AI 응답 + 저장)
export async function sendChatMessage(userMessage: string): Promise<{
  success: boolean;
  data?: { userMsg: ChatMessage; aiMsg: ChatMessage };
  message?: string;
}> {
  if (!userMessage?.trim()) {
    return { success: false, message: "메시지를 입력해주세요." };
  }

  try {
    // 1. 사용자 메시지 DB 저장
    const userMsg = await prisma.aiChat.create({
      data: {
        role: "user",
        content: userMessage.trim(),
        userId: CURRENT_USER_ID,
      },
    });

    // 2. 사용자 컨텍스트 조회
    const context = await getUserContext();

    // 3. 최근 대화 몇 개 가져와서 컨텍스트에 포함
    const recentMessages = await prisma.aiChat.findMany({
      where: { userId: CURRENT_USER_ID },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const conversationHistory = recentMessages
      .reverse()
      .map((m) => `${m.role === "user" ? "사용자" : "어시스턴트"}: ${m.content}`)
      .join("\n");

    // 4. Gemini에게 요청
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

    // 5. AI 답변 DB 저장
    const aiMsg = await prisma.aiChat.create({
      data: {
        role: "assistant",
        content: aiText,
        userId: CURRENT_USER_ID,
      },
    });

    return { success: true, data: { userMsg, aiMsg } };
  } catch (error) {
    console.error("sendChatMessage error:", error);
    return { success: false, message: "메시지 전송 중 오류가 발생했습니다." };
  }
}

// 채팅 기록 전체 삭제
export async function clearChatHistory() {
  try {
    await prisma.aiChat.deleteMany({
      where: { userId: CURRENT_USER_ID },
    });
    return { success: true };
  } catch (error) {
    console.error("clearChatHistory error:", error);
    return { success: false };
  }
}