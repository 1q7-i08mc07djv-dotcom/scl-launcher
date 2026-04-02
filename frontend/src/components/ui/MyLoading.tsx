import { useEffect, useState } from 'react';

interface MyLoadingProps {
  size?: number;
  className?: string;
  autoRun?: boolean;
}

export default function MyLoading({
  size = 50,
  className = '',
  autoRun = true,
}: MyLoadingProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!autoRun) return;
    const interval = setInterval(() => {
      setRotation((r) => (r + 30) % 360);
    }, 80);
    return () => clearInterval(interval);
  }, [autoRun]);

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.08s linear' }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="var(--color-highlight)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="31.4 94.2"
        />
        <circle
          cx="25"
          cy="25"
          r="14"
          fill="none"
          stroke="var(--color-gray1)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="22 66"
        />
      </svg>
    </div>
  );
}
