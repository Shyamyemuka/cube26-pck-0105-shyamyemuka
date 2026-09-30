'use client';

import { useState, useEffect } from 'react';
import { PullCord } from 'pullcord';
import 'pullcord/pullcord.css';

export default function ThemeToggle() {
  const [pulled, setPulled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Dark mode is permanently disabled — ensure light mode everywhere
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('pack_theme');
  }, []);

  const handlePull = () => {
    setPulled((p) => !p);
    // Ensure document never gets dark class
    document.documentElement.classList.remove('dark');
    // Dispatch custom event so the user can easily attach any new feature to the chain pull!
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pullcord_action', { detail: { timestamp: Date.now() } }));
    }
  };

  if (!mounted) return null;

  return (
    <PullCord
      onPull={handlePull}
      pulled={pulled}
      ariaLabel="Interactive pull cord"
      config={{
        gravity: 1250,   // hang tension / fall speed
        damping: 0.94,   // the snap: higher = snappier retract
        iterations: 20,  // rope stiffness
        stretchMax: 26,  // pull travel past rest
      }}
    />
  );
}

