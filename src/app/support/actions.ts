"use server";

import prisma from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "../../lib/session";
import { auth } from "../../auth";

export interface SupportPostSummary {
    id: number;
    title: string;
    category: string;
    status: string;
    authorInitial: string;
    isMine: boolean;   // ← 추가
    createdAt: Date;
    hasAnswer: boolean;
  }

  

export interface SupportPostDetail {
  id: number;
  title: string;
  content: string;
  category: string;
  status: string;
  authorName: string;   // 관리자/본인만 볼 때
  authorInitial: string; // 다른 사람 볼 때
  isMine: boolean;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  answer: string | null;
  answeredAt: Date | null;
}

// 현재 사용자가 관리자인지 확인
async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id, 10) },
    select: { role: true },
  });

  return user?.role === "admin";
}

// 게시글 목록 조회
export async function fetchSupportPosts(): Promise<{
    success: boolean;
    data?: SupportPostSummary[];
    message?: string;
  }> {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, message: "로그인이 필요합니다." };
    }
  
    try {
      const posts = await prisma.supportPost.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true },
          },
        },
      });
  
      const isAdmin = await isCurrentUserAdmin(); // 관리자면 모든 제목 다 보임
  
      const summaries: SupportPostSummary[] = posts.map((p) => {
        const isMine = p.userId === userId;
        // 본인 or 관리자만 원본 제목, 나머지는 마스킹
        const title = isMine || isAdmin
          ? p.title
          : maskTitle(p.title);
  
        return {
          id: p.id,
          title,
          category: p.category,
          status: p.status,
          authorInitial: p.user.name.charAt(0),
          isMine,
          createdAt: p.createdAt,
          hasAnswer: !!p.answer,
        };
      });
  
      return { success: true, data: summaries };
    } catch (error) {
      console.error("fetchSupportPosts error:", error);
      return { success: false, message: "게시글을 불러올 수 없습니다." };
    }
  }
  
  // 제목 마스킹: 앞 2글자만 + "..."
  function maskTitle(title: string): string {
    if (title.length <= 2) return title + "...";
    return title.slice(0, 2) + "...";
  }

// 게시글 상세 조회 (본인 or 관리자만 내용 볼 수 있음)
export async function fetchSupportPostDetail(id: number): Promise<{
  success: boolean;
  data?: SupportPostDetail;
  message?: string;
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  try {
    const post = await prisma.supportPost.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    if (!post) {
      return { success: false, message: "게시글을 찾을 수 없습니다." };
    }

    const isMine = post.userId === userId;
    const isAdmin = await isCurrentUserAdmin();
    const canView = isMine || isAdmin;

    if (!canView) {
      return { success: false, message: "본인 또는 관리자만 내용을 볼 수 있습니다." };
    }

    return {
      success: true,
      data: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        status: post.status,
        authorName: post.user.name,
        authorInitial: post.user.name.charAt(0),
        isMine,
        isAdmin,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        answer: post.answer,
        answeredAt: post.answeredAt,
      },
    };
  } catch (error) {
    console.error("fetchSupportPostDetail error:", error);
    return { success: false, message: "게시글을 불러올 수 없습니다." };
  }
}

// 게시글 작성
export async function createSupportPost(data: {
  title: string;
  content: string;
  category: string;
}): Promise<{
  success: boolean;
  postId?: number;
  message?: string;
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  if (!data.title?.trim() || !data.content?.trim()) {
    return { success: false, message: "제목과 내용을 입력해주세요." };
  }

  if (!["bug", "improvement", "question"].includes(data.category)) {
    return { success: false, message: "올바른 카테고리를 선택해주세요." };
  }

  try {
    const post = await prisma.supportPost.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        category: data.category,
        userId,
      },
    });

    revalidatePath("/support");
    return { success: true, postId: post.id };
  } catch (error) {
    console.error("createSupportPost error:", error);
    return { success: false, message: "저장 중 오류가 발생했습니다." };
  }
}

// 게시글 삭제 (본인 or 관리자)
export async function deleteSupportPost(id: number) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  try {
    const post = await prisma.supportPost.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!post) {
      return { success: false, message: "게시글을 찾을 수 없습니다." };
    }

    const isMine = post.userId === userId;
    const isAdmin = await isCurrentUserAdmin();

    if (!isMine && !isAdmin) {
      return { success: false, message: "삭제 권한이 없습니다." };
    }

    await prisma.supportPost.delete({ where: { id } });

    revalidatePath("/support");
    return { success: true };
  } catch (error) {
    console.error("deleteSupportPost error:", error);
    return { success: false, message: "삭제 중 오류가 발생했습니다." };
  }
}

// 관리자 답변 (관리자만)
export async function submitAdminAnswer(postId: number, answer: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { success: false, message: "관리자만 답변할 수 있습니다." };
  }

  if (!answer?.trim()) {
    return { success: false, message: "답변 내용을 입력해주세요." };
  }

  try {
    await prisma.supportPost.update({
      where: { id: postId },
      data: {
        answer: answer.trim(),
        answeredAt: new Date(),
        status: "answered",
      },
    });

    revalidatePath("/support");
    revalidatePath(`/support/${postId}`);
    return { success: true };
  } catch (error) {
    console.error("submitAdminAnswer error:", error);
    return { success: false, message: "답변 저장 중 오류가 발생했습니다." };
  }
}

// 관리자가 상태 변경 (관리자만)
export async function updatePostStatus(postId: number, status: string) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { success: false, message: "관리자만 변경할 수 있습니다." };
  }

  if (!["pending", "answered", "closed"].includes(status)) {
    return { success: false, message: "올바른 상태값이 아닙니다." };
  }

  try {
    await prisma.supportPost.update({
      where: { id: postId },
      data: { status },
    });

    revalidatePath("/support");
    revalidatePath(`/support/${postId}`);
    return { success: true };
  } catch (error) {
    console.error("updatePostStatus error:", error);
    return { success: false, message: "상태 변경 중 오류가 발생했습니다." };
  }
}

// 현재 사용자가 관리자인지 확인하는 export 함수 (컴포넌트용)
export async function checkIsAdmin() {
  return await isCurrentUserAdmin();
}