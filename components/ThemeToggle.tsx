'use client';

import { useState, useEffect } from 'react';
import { PullCord } from 'pullcord';
import 'pullcord/pullcord.css';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Default to light mode unless explicitly set to dark
    const saved = localStorage.getItem('pack_theme');
    if (saved === 'dark') {
      setDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handlePull = () => {
    setDark((d) => {
      const next = !d;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('pack_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('pack_theme', 'light');
      }
      return next;
    });
  };

  if (!mounted) return null;

  return (
    <PullCord
      onPull={handlePull}
      pulled={!dark}
      ariaLabel="Toggle theme"
      config={{
        gravity: 1250,   // hang tension / fall speed
        damping: 0.94,   // the snap: higher = snappier retract
        iterations: 20,  // rope stiffness
        stretchMax: 26,  // pull travel past rest
      }}
    />
  );
}

