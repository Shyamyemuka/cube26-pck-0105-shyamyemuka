'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Default to dark mode unless explicitly set to light
    const saved = localStorage.getItem('pack_theme');
    if (saved === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pack_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pack_theme', 'dark');
      setIsDark(true);
    }
  };

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-2xl neu-flat-sm flex items-center justify-center opacity-0" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="w-10 h-10 rounded-2xl neu-flat-sm hover:neu-flat-hover flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all"
      aria-label="Toggle display theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#6BFF86] stroke-[2.2]" />
      ) : (
        <Moon className="w-4 h-4 text-[#773C30] stroke-[2.2]" />
      )}
    </button>
  );
}
