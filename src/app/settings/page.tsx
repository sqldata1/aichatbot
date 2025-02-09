"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/contexts/ThemeContext';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen p-4 ${
      theme === 'dark' ? 'bg-surface-dark text-white' : 'bg-white text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <button className={`mb-6 px-4 py-2 rounded-lg ${
            theme === 'dark' 
              ? 'bg-gray-800 hover:bg-gray-700 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
          }`}>
            ← Back
          </button>
        </Link>
        
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          
          <div className={`p-4 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <h2 className="text-xl font-semibold mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <span>Theme Mode</span>
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-full ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-white hover:bg-gray-50 shadow-sm'
                }`}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
