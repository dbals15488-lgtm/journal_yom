import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, name, email, password } = body; // 🎯 프론트엔드에서 보낸 userId 받기

    if (!userId || !name || !email || !password) {
      return NextResponse.json({ message: '모든 필드를 채워주세요.' }, { status: 400 });
    }

    // 아이디 중복 검사
    const existingId = await prisma.user.findUnique({
      where: { userId: userId },
    });
    if (existingId) {
      return NextResponse.json({ message: '이미 사용 중인 아이디입니다.' }, { status: 400 });
    }

    // 이메일 중복 검사
    const existingEmail = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingEmail) {
      return NextResponse.json({ message: '이미 가입된 이메일 주소입니다.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🎯 실제 DB 테이블에 저장할 때 userId도 기입
    const newUser = await prisma.user.create({
      data: {
        userId: userId,
        name: name,
        email: email,
        password: hashedPassword,
      },
    });

    console.log('🎉 데이터베이스 저장 완료:', newUser);
    return NextResponse.json({ message: '회원가입이 성공적으로 완료되었습니다!' }, { status: 201 });

  } catch (error) {
    console.error('🔥 Prisma DB 처리 중 진짜 에러 발생:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}