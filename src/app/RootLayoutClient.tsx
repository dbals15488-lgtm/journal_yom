import { useState } from "react";
import { RecordProvider } from "../context/RecordContext";
import { Providers } from "./providers";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import "./globals.css";

export default function RootLayoutClient({ children, session }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <Providers>
      <RecordProvider>
        <Header session={session} /> 
        <div style={{ display: 'flex' }}>
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <main style={{ flex: 1 }}>{children}</main>
        </div>
      </RecordProvider>
    </Providers>
  );
}