import { NextResponse, type NextRequest } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body as { name: string; email: string };

    if (!name || !email) {
      return NextResponse.json({ message: "이름과 이메일을 모두 입력해 주세요." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { name, email },
    });

    if (!user) {
      return NextResponse.json({ message: "일치하는 회원 정보가 없습니다." }, { status: 404 });
    }

    const halfLength = Math.floor(user.userId.length / 2);
    const maskedId =
      user.userId.substring(0, halfLength) + "*".repeat(user.userId.length - halfLength);

    return NextResponse.json(
      {
        message: "아이디를 성공적으로 찾았습니다.",
        maskedId,
        fullId: user.userId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("아이디 찾기 에러:", error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
