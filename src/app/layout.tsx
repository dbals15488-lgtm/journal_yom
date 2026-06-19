import { auth } from "../auth";
import RootLayoutClient from "./RootLayoutClient";

export default async function RootLayout({ children }) {
  const session = await auth(); 

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