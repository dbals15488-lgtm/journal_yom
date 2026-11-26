import { NextResponse, type NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import { auth } from "../../../auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, category } = body as {
      title: string;
      content: string;
      category: string;
    };

    const newRecord = await prisma.record.create({
      data: { title, content, category, userId: user.id },
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch {
    return NextResponse.json({ error: "데이터 저장을 실패했습니다." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const records = await prisma.record.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: "데이터 불러오기 실패!" }, { status: 500 });
  }
}
