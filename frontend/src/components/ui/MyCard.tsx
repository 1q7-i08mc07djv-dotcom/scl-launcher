import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface MyCardProps {
  title: string;
  children: React.ReactNode;
  canSwap?: boolean;
  isSwapped?: boolean;
  defaultSwapped?: boolean;
  onSwap?: (swapped: boolean) => void;
  className?: string;
  useAnimation?: boolean;
  hasMouseAnimation?: boolean;
}

export default function MyCard({
  title,
  children,
  canSwap = false,
  defaultSwapped = false,
  onSwap,
  className = '',
  useAnimation = true,
  hasMouseAnimation = true,
}: MyCardProps) {
  const [swapped, setSwapped] = useState(defaultSwapped);
  const [hovered, setHovered] = useState(false);

  const handleSwap = () => {
    if (!canSwap) return;
    const newSwapped = !swapped;
    setSwapped(newSwapped);
    onSwap?.(newSwapped);
  };

  return (
    <div
      className={`
        rounded-pcl bg-pcl-card border border-pcl-border
        ${hasMouseAnimation && hovered ? 'bg-pcl-card-hover' : ''}
        ${className}
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: useAnimation ? 'background-color 0.2s ease' : 'none',
      }}
    >
      {/* Card Title Bar */}
      <div
        className={`
          flex items-center px-4 py-2.5 rounded-t-pcl
          border-b border-pcl-border
          ${canSwap ? 'cursor-pointer select-none' : ''}
        `}
        onClick={handleSwap}
      >
        {canSwap && (
          <span className="mr-2 text-pcl-text-secondary">
            {swapped ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </span>
        )}
        <span className="text-sm font-medium text-white">{title}</span>
      </div>

      {/* Card Content */}
      {(!canSwap || !swapped) && (
        <div className="p-5">
          {children}
        </div>
      )}
    </div>
  );
}
