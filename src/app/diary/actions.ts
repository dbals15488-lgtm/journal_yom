"use server"; // 서버에서만 실행하도록

import prisma  from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";

//  유저 ID 가져오는 함수
async function getUserId(){
  const session = await auth();
  if (!session || !session.user || !session.user.email) return null;

  const user = await prisma.user.findUnique({
    where: {email: session.user.email},
  });
  return user ? user.id : null;
}

// 1. 일지 목록 가져기
export async function getDiaryList() {
  const userId = await getUserId();
  if(!userId) return [];

  try {
    const logs = await prisma.record.findMany({
      where: {userId: userId},
      select: {
        id: true,
        createdAt: true,
        title: true,
        content: true,
        fileUrl: true,
      },
    });
    return logs;
  } catch (error) {
    console.error("DB 에러 발생:", error);
    return [];
  }
}

// 2. 일지 삭제하기
export async function deleteDiary(id: number) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "로그인이 필요합니다."}

  try {
    await prisma.record.deleteMany({
      where: {
        id: Number(id),
        userId: userId
      },
    });

    revalidatePath("/diary");
    return { success: true };
  } catch (error) {
    console.error("DB 삭제 에러 발생:", error);
    return { success: false, error: "삭제에 실패했습니다." };
  }
}

// 3. 일지 수정하기
export async function updateDiary(id: string, title: string, content: string, fileUrl: string | null) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "로그인이 필요합니다." };

  try {
    await prisma.record.update({
      where: { 
        id: Number(id),
        userId: userId
      },
      data: {
        title: title,
        content: content,
        category: "일반", // 기존 필수 카테고리 유지
        fileUrl: fileUrl,  // ✨ 파일 업로드 경로 또는 null 저장
      },
    });

    revalidatePath("/diary");
    return { success: true };
  } catch (error) {
    console.error("DB 수정 에러 발생:", error);
    return { success: false, error: "데이터베이스 수정에 실패했습니다." };
  }
} 

// 4. 일지 생성하기 (독립된 함수로 분리 및 fileUrl 추가)
export async function createDiary(title: string, content: string, selectedDate: string, fileUrl: string | null = null) {
  const userId = await getUserId();
  if (!userId) return { success : false, error: "로그인이 필요합니다."};

  try {
    await prisma.record.create({
      data: {
        title: title,
        content: content,
        category: "일반",
        createdAt: new Date(selectedDate),
        fileUrl: fileUrl,
        userId: userId,
      },
    });

    revalidatePath("/diary");
    return { success: true };
  } catch (error) {
    console.error("DB 저장 에러 발생:", error);
    return { success: false, error: "저장에 실패했습니다." };
  }
}