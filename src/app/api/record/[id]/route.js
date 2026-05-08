import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// [GET] 특정 번호(id)의 데이터 1개만 갖고오기

    export async function GET(req, {params}){
        try{
            const {id} = await params;
            const record = await prisma.record.findUnique({
                where: {id : parseInt(id)},
            });
            return NextResponse.json(record);
        }catch(error){
            return NextResponse.json({error: '상세 데이터 불러오기 실패'}, {status: 500})
        }
    }

// [PUT] 수정

    export async function PUT(req, {params}){
        try{
            const {id} = await params;
            const {title, content} = await req.json();
            const uqdated = await prisma.record.uqdated({
                where: {id : parseInt(id)},
                data: {title,content}
            });
            return NextResponse.json(uqdated);
        }catch(error){
            return NextResponse.json({error: '수정 실패'}, {status : 500});
        }
    }

// [DELETE] 삭제

    export async function DELETE(req, {params}){
        try{
            const {id} = await params;
            await prisma.record.delete({
                where: {id : parseInt(id)},
            });
            return NextResponse.json({massage: "삭제 완료"})
        }catch(error){
            return NextResponse({error: '삭제 실패'}, {status: 500});
        }
    }