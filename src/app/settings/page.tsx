"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/contexts/ThemeContext';

const SettingsPage = () => {
  const { theme } = useTheme();

  return (
    <div className={`settings-page ${theme}-theme`}>
      {/* Back button */}
      <div className="back-button-container">
        <Link href="/">
          <button className="back-button" aria-label="Back">
            ← Back
          </button>
        </Link>
      </div>
      
      <div className="settings-content">
        <h1>Settings</h1>
        <p>This is the settings page.</p>
        {/* ...additional settings content... */}
      </div>
    </div>
  );
};

export default SettingsPage;
