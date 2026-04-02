import { useState } from 'react';

interface MyIconButtonProps {
  logo: string;
  theme?: 'white' | 'black' | 'highlight' | 'red';
  logoScale?: number;
  size?: number;
  onClick?: () => void;
  tooltip?: string;
  className?: string;
}

const themeColor = {
  white: '#FFFFFF',
  black: '#555555',
  highlight: '#3B82F6',
  red: '#EF4444',
};

export default function MyIconButton({
  logo,
  theme = 'white',
  logoScale = 1,
  size = 28,
  onClick,
  tooltip,
  className = '',
}: MyIconButtonProps) {
  const [hovered, setHovered] = useState(false);

  const color = themeColor[theme];
  const displayColor = hovered && (theme === 'white' || theme === 'black')
    ? theme === 'white' ? '#CCCCCC' : '#777777'
    : color;

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          flex items-center justify-center rounded-full
          transition-all duration-100 cursor-pointer
          ${hovered ? 'bg-white/10' : ''}
          ${className}
        `}
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.72 * logoScale}
          height={size * 0.72 * logoScale}
          viewBox="0 0 512 512"
          style={{ fill: displayColor }}
        >
          <path d={logo} />
        </svg>
      </button>
      {tooltip && hovered && (
        <div
          className="absolute top-full mt-1 left-1/2 -translate-x-1/2
            bg-pcl-gray1 text-white text-xs px-2 py-1 rounded
            whitespace-nowrap z-50 pointer-events-none"
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
