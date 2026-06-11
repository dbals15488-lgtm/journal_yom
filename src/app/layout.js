import "./globals.css";

import { RecordProvider } from "../context/RecordContext";
import { Providers } from "./providers";

export const metadata = {
  title: "학습 일지",
  description: "나의 성장 기록",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body >
       <Providers>
          <RecordProvider>
            {children}
          </RecordProvider>
        </Providers> 
        </body>
    </html>
  );
}
