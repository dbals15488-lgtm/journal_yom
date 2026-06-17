import React from "react";
import Link from "next/link";
import './dashboard.css';
import { auth } from "../auth";



interface MenuCardProps{
    icon : string;
    title : string ;
    description : string;
    href : string ;
}

const MenuCard = ({icon, title, description, href} : MenuCardProps) =>(
    <Link href={href} className="card">
        <div className="card-icon">{icon}</div>
        <h3 className="card-title">{title}</h3>
        <p className="card-desc">{description}</p>
    </Link>
);


export default async function HomePage(){
    const session = await auth();

    return(
        <div className="container">
            <header className="header">
                <div>
                    <h1 className="title">Learning Log</h1>
                    <p className="subtitle">오늘의 성장을 기록하고 관리하세요.</p>
                </div>
             
            </header>

            <main className="menu-grid">
                <MenuCard 
                icon="📝" 
                title="오늘의 일지" 
                description="학습 내용을 기록합니다" 
                href="/diary" 
                />
                <MenuCard 
                icon="🏃‍♂️"
                title="운동 일지"
                description="건강한 몸을 위한 기록"
                href="/workout"
                />
                <MenuCard 
                icon="🥗" 
                title="식단 관리" 
                description="균형 잡힌 영양 밸런스" 
                href="/diet" 
                />
                <MenuCard 
                icon="💻" 
                title="업무 일지" 
                description="오늘의 업무 성과 정리" 
                href="/work-log" 
                />
                <MenuCard 
                icon="🎧" 
                title="고객센터" 
                description="문의 및 도움말" 
                href="/support" 
                />
            </main>
        </div>
    )
}