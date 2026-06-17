
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Naver from "next-auth/providers/naver";
import bcrypt from "bcryptjs";
import prisma from "./lib/prisma"; 

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const inputUsername = String(credentials.username).trim();
        const inputPassword = String(credentials.password).trim();

        try {
          const user = await prisma.user.findUnique({
            where: {
              userId: inputUsername,
            },
          });
          if (!user) {
            console.log("❌ MySQL 조회 결과: 일치하는 아이디가 없습니다.");
            return null;
          }

          const isPasswordMatch = await bcrypt.compare(inputPassword, user.password);

          if (isPasswordMatch) {
            console.log(`⭕ MySQL 연동 성공: [${user.name}]님이 로그인하셨습니다.`);
            
            return {
              id: String(user.id),
              name: user.name,
              email: user.email,
            };
          }

          console.log("❌ 비밀번호가 일치하지 않습니다.");
          return null;

        } catch (error) {
          console.error("🔒 MySQL 로그인 처리 중 통신 에러 발생:", error);
          return null;
        }
      }
    }),
    Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }),
    Kakao({ clientId: process.env.KAKAO_CLIENT_ID, clientSecret: process.env.KAKAO_CLIENT_SECRET }),
    Naver({ clientId: process.env.NAVER_CLIENT_ID, clientSecret: process.env.NAVER_CLIENT_SECRET }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/auth/signout", 
  },
  secret: process.env.NEXTAUTH_SECRET,
});