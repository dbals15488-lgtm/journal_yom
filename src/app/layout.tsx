import { auth } from "../auth";
import RootLayoutClient from "./RootLayoutClient";

export default async function RootLayout({ children }) {
  const session = await auth(); // 여기서 서버 세션을 가져옵니다.

  return (
    <html lang="ko">
      <body>
        <RootLayoutClient session={session}>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}