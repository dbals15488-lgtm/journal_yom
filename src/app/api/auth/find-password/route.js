import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request){
    try {
        const body = await request.json();
        const { userId, email } = body;

        if(!userId || !email) {
            return NextResponse.json({ message: '아이디와 이메일을 모두 입력해주세요.'})
        }

        const user = await prisma.user.findFirst({
            where: {
                userId: userId,
                email: email,
            }
        });

        if (!user){
            return NextResponse.json({ message: "일치하는 회원 정보가 없습니다."}, { status: 404})
        }

        // 랜덤 임시 비밀번호 생성
        const tempPassword = Math.random().toString(36).slice(-8) + '1!';

        // 임시 비밀번호 암호화
        const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

        // DB 유저의 비밀번호를 임시 비밀번호로 업데이트
        await prisma.user.updateMany({
            where: { id : user.id },
            data: {password: hashedTempPassword }
        });

        return NextResponse.json({
            message: '임시 비밀번호가 발급되었습니다. 로그인 후 반드시 변경해주세요',
            tempPassword: tempPassword
        }, { status: 200});

    } catch (error) {
        console.error('🔥 비밀번호 찾기 에러:', error);
        return NextResponse.json( {message: '서버 오류가 발생햇습니다.'}, { status : 500});
    } finally {
        await prisma.$disconnect();
    }
}