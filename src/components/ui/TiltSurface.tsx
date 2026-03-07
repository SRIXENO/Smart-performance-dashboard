'use client';

import { ReactNode, useMemo, useState } from 'react';

type TiltSurfaceProps = {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
};

export default function TiltSurface({
  children,
  className,
  maxTilt = 6,
  scale = 1.01,
}: TiltSurfaceProps) {
  const [transform, setTransform] = useState('perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)');
  const supportsHover = useMemo(
    () => (typeof window !== 'undefined' ? window.matchMedia('(hover: hover)').matches : false),
    []
  );

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!supportsHover) return;
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const px = (x / rect.width) * 2 - 1;
    const py = (y / rect.height) * 2 - 1;
    const rotateY = px * maxTilt;
    const rotateX = -py * maxTilt;
    setTransform(`perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale})`);
  };

  const reset = () => setTransform('perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)');

  return (
    <div
      className={className}
      onMouseMove={onMouseMove}
      onMouseLeave={reset}
      style={{ transform, transition: 'transform 180ms ease-out', transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
}

