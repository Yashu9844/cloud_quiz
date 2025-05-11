import React, { ReactNode } from "react";
import Navbar from "./Navbar";

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout component that wraps all pages with navigation and consistent styling
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Fixed navbar */}
      <Navbar />
      
      {/* Main content with proper spacing for fixed navbar */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 mt-16 md:mt-20">
        <div className="w-full">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-4 md:py-6 mt-8 text-center text-gray-500 dark:text-gray-400 text-sm border-t border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4">
          © {new Date().getFullYear()} Quiz Growth Pulse. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
