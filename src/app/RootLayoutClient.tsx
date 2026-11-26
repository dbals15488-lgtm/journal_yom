'use client'

import { type ReactNode, useState } from "react";
import { type Session } from "next-auth";
import { Providers } from "./providers";
import { ThemeProvider } from "../app/contexts/ThemeContext";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import "./globals.css";

interface RootLayoutClientProps {
  children: ReactNode;
  session: Session | null;
}

export default function RootLayoutClient({ children, session }: RootLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <Providers>
      <ThemeProvider>
        <Header session={session} />
        <div className="layout-flex">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <main className="main-content">{children}</main>
        </div>
      </ThemeProvider>
    </Providers>
  );
}