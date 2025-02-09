"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/contexts/ThemeContext';

const SettingsPage = () => {
  const { theme } = useTheme();

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
          <p className={`${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            This is the settings page.
          </p>
          {/* ...additional settings content... */}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
