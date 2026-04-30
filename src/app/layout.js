import "./globals.css";

import { RecordProvider } from "@/context/RecordContext";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body >
        <RecordProvider>
           {children}
        </RecordProvider>
        </body>
    </html>
  );
}
