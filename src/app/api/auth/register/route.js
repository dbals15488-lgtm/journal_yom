import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // 'bcrypt' 대신 'bcryptjs' 사용 추천 (배포 환경에서 에러가 적음)
import prisma from "../../../../lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, name, email, password } = body;

    // 데이터 유효성 검사
    if (!userId || !name || !email || !password) {
      return NextResponse.json({ message: '모든 필드를 채워주세요.' }, { status: 400 });
    }

    // 아이디 중복 검사
    const existingId = await prisma.user.findUnique({ where: { userId } });
    if (existingId) return NextResponse.json({ message: '이미 사용 중인 아이디입니다.' }, { status: 400 });

    // 이메일 중복 검사
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) return NextResponse.json({ message: '이미 가입된 이메일 주소입니다.' }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    // 저장
    const newUser = await prisma.user.create({
      data: { userId, name, email, password: hashedPassword },
    });

    return NextResponse.json({ message: '회원가입 성공!' }, { status: 201 });
  } catch (error) {
    console.error('🔥 에러 발생:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}