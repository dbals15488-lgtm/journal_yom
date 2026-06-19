"use server";

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";

async function getUserId(){
  const session = await auth();
  if (!session || !session.user || !session.user.email) return null;
  const user = await prisma.user.findUnique({ where: {email: session.user.email} });
  return user ? user.id : null;
}

export async function getDiaryList() {
  const userId = await getUserId();
  if(!userId) return [];
  return await prisma.record.findMany({ where: {userId: userId} });
}

export async function deleteDiary(id: number) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "로그인이 필요합니다."};
  try {
    await prisma.record.deleteMany({ where: { id: Number(id), userId: userId } });
    revalidatePath("/diary");
    return { success: true };
  } catch (error) {
    return { success: false, error: "삭제에 실패했습니다." };
  }
}

export async function updateDiary(id: string, title: string, content: string, fileUrls: string[]) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "로그인이 필요합니다." };

  try {
    await prisma.record.update({
      where: { id: Number(id), userId: userId },
      data: {
        title,
        content,
        fileUrl: fileUrls
       },
    });
    revalidatePath("/diary");
    return { success: true };
  } catch (error) {
    console.error(error)
    return { success: false, error: "수정 실패" };
  }
} 

export async function createDiary(title: string, content: string, selectedDate: string, fileUrls: string[] = []) {
  const userId = await getUserId();
  if (!userId) return { success : false, error: "로그인이 필요합니다."};

  try {
    await prisma.record.create({
      data: { 
        title,
        content,
        createdAt: new Date(selectedDate),
        fileUrl: fileUrls,
        userId: userId,
        category: "일반"
         },
    });
    revalidatePath("/diary");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "저장 실패" };
  }
}