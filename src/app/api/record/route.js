import { PrismaClient } from "@prisma/client";  //프리즈마 클라이언트 호출
import { NextResponse } from "next/server"; // 응답 도구 호출


const prisma = new PrismaClient()


// 서버에 데이터 보내는 함수 POST

export async function POST(request) {
    try{
        // 사용자가 화면에서 보낸 데이터를 확인합니다.
        const body = await request.json();
        const {title, content, category} = body;

        
        // 프리즈마 비서에게 금고 수납함에 저장하라고 시킵니다.
        const newRecord = await prisma.record.create({
            data:{
                title : title,
                content: content,
                category: category,
            },
        });

        // 성공시 화면에 알려줍니다.
        return NextResponse.json(newRecord, { status : 201})
    } catch(error) {
        // 문제가 생기면 에러를 보여줍니다.
        return NextResponse.json({error : '데이터 저장을 실패햇습니다.'}, {status : 500})
    }
}


// 서버에서 데이터를 가져오는 함수 GET

export async function GET(){
    try{
        // 비서에게 수납함에 있는 모든 내용을 가져오라고 시킵니다.
        const record = await prisma.record.findMany({
            orderBy: {createdAt: 'desc'}
        });
        return NextResponse.json(record);
    }catch (error){
        return NextResponse.json({error : '데이터 불러오기 실패!'}, {status : 500})
    }
}