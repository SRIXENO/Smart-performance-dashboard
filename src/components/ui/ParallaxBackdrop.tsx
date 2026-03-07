'use client';

import { useEffect, useState } from 'react';

export default function ParallaxBackdrop() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffset(window.scrollY * 0.08);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden hidden dark:block" aria-hidden="true">
      <div
        className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl"
        style={{ transform: `translate3d(0, ${offset * -1}px, 0)` }}
      />
      <div
        className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl"
        style={{ transform: `translate3d(0, ${offset * 1.2}px, 0)` }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-violet-300/15 blur-3xl"
        style={{ transform: `translate3d(0, ${offset * 0.6}px, 0)` }}
      />
    </div>
  );
}
