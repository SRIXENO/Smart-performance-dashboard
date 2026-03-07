'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

type MotionRevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  y?: number;
  once?: boolean;
};

export default function MotionReveal({
  children,
  className,
  delayMs = 0,
  y = 20,
  once = true,
}: MotionRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || reduceMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold: 0.16 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, reduceMotion]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0)' : `translate3d(0, ${y}px, 0)`,
        transition: reduceMotion ? 'none' : `opacity 540ms cubic-bezier(.2,.7,.2,1) ${delayMs}ms, transform 540ms cubic-bezier(.2,.7,.2,1) ${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}

