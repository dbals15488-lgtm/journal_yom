import { type ReactNode } from "react";
import { auth } from "../auth";
import RootLayoutClient from "./RootLayoutClient";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <html lang="ko" suppressHydrationWarning={true}>
      <body>
        <RootLayoutClient session={session}>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}