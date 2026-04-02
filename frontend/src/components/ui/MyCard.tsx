import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface MyCardProps {
  title: string;
  children: React.ReactNode;
  canSwap?: boolean;
  defaultSwapped?: boolean;
  onSwap?: (swapped: boolean) => void;
  className?: string;
  hasMouseAnimation?: boolean;
}

export default function MyCard({
  title,
  children,
  canSwap = false,
  defaultSwapped = false,
  onSwap,
  className = '',
  hasMouseAnimation = true,
}: MyCardProps) {
  const [swapped, setSwapped] = useState(defaultSwapped);
  const [hovered, setHovered] = useState(false);

  const handleSwap = () => {
    if (!canSwap) return;
    const next = !swapped;
    setSwapped(next);
    onSwap?.(next);
  };

  return (
    <div
      className={`
        rounded-pcl border
        ${hasMouseAnimation && hovered ? 'bg-pcl-card-hover' : 'bg-pcl-card'}
        ${className}
      `}
      style={{ borderColor: 'var(--color-border)', boxShadow: '0 1px 3px var(--shadow-color)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Title bar */}
      <div
        className={`flex items-center px-4 py-2.5 rounded-t-pcl cursor-default ${canSwap ? 'cursor-pointer' : ''}`}
        style={{ borderBottom: canSwap && !swapped ? '1px solid var(--color-border)' : 'none' }}
        onClick={handleSwap}
      >
        {canSwap && (
          <span className="mr-2" style={{ color: 'var(--color-text-secondary)' }}>
            {swapped ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{title}</span>
      </div>

      {/* Content */}
      {!canSwap || !swapped ? (
        <div className="p-5">{children}</div>
      ) : null}
    </div>
  );
}
