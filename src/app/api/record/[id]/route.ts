import { NextResponse, type NextRequest } from "next/server";
import prisma from "../../../../lib/prisma";
import { auth } from "../../../../auth";

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user?.id ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const record = await prisma.record.findUnique({
      where: { id: parseInt(id) },
    });

    if (!record || record.userId !== userId) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "상세 데이터 불러오기 실패" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const record = await prisma.record.findUnique({ where: { id: parseInt(id) } });

    if (!record || record.userId !== userId) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    const { title, content } = (await req.json()) as { title: string; content: string };
    const updated = await prisma.record.update({
      where: { id: parseInt(id) },
      data: { title, content },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const record = await prisma.record.findUnique({ where: { id: parseInt(id) } });

    if (!record || record.userId !== userId) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    await prisma.record.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ message: "삭제 완료" });
  } catch {
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
