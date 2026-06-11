import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ message: '이름과 이메일을 모두 입력해 주세요.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { name: name, email: email },
    });

    if (!user) {
      return NextResponse.json({ message: '일치하는 회원 정보가 없습니다.' }, { status: 404 });
    }

    // 🎯 1. 마스킹 아이디 만들기 (앞 절반만 보여주고 뒤는 * 처리)
    const halfLength = Math.floor(user.userId.length / 2);
    const maskedId = user.userId.substring(0, halfLength) + '*'.repeat(user.userId.length - halfLength);

    // 🎯 2. 마스킹 버전과 전체 버전을 함께 응답으로 내려줍니다.
    return NextResponse.json({ 
      message: '아이디를 성공적으로 찾았습니다.',
      maskedId: maskedId,
      fullId: user.userId // 전체 아이디 포함
    }, { status: 200 });

  } catch (error) {
    console.error('🔥 아이디 찾기 에러:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}