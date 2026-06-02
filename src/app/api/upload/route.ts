import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request){
    try{
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if(!file || file.size === 0){
            return NextResponse.json(
                { error: "업로드된 파일이 없습니다." },
                { status: 400}
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

        const uploadDir= path.join(process.cwd(), "public", "uploads");

        await fs.mkdir(uploadDir, {recursive : true});

        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);

        const fileUrl = `/uploads/${fileName}`;

        return NextResponse.json({success: true, fileUrl});
    }catch(error: any){
        console.error("API 업로드 라우터 에러 발생:", error);
        return NextResponse.json(
            { error: "서버 내부 오류로 파일 업로드에 실패햇습니다."},
            { status: 500}
        );
    }
}