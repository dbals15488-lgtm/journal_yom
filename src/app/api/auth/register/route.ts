import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email, password } = body as {
      userId: string;
      name: string;
      email: string;
      password: string;
    };

    if (!userId || !name || !email || !password) {
      return NextResponse.json({ message: "모든 필드를 채워주세요." }, { status: 400 });
    }

    const existingId = await prisma.user.findUnique({ where: { userId } });
    if (existingId) {
      return NextResponse.json({ message: "이미 사용 중인 아이디입니다." }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ message: "이미 가입된 이메일 주소입니다." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { userId, name, email, password: hashedPassword },
    });

    return NextResponse.json({ message: "회원가입 성공!" }, { status: 201 });
  } catch (error) {
    console.error("회원가입 에러:", error);
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
