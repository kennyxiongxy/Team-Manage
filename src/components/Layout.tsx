import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [, setSidebarCollapsed] = useState(false);

  // On mobile, sidebar is hidden by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Navbar */}
      <Navbar />

      {/* Sidebar - Desktop only */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main
        className="pt-16 min-h-[100dvh] transition-all duration-300 lg:ml-60 flex flex-col"
      >
        <div className="flex-1 p-4 lg:p-6">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}
